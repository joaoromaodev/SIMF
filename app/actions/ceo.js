"use server";

import { getSupabaseAdminClient } from "../../lib/supabase/server.js";

const EXPORT_PAGE_SIZE = 1000;

async function fetchAllRows(supabase, table, columns, order, filters = []) {
  const rows = [];
  let from = 0;

  while (true) {
    let query = supabase
      .from(table)
      .select(columns)
      .range(from, from + EXPORT_PAGE_SIZE - 1);

    if (order) {
      query = query.order(order.column, order.options);
    }

    for (const f of filters) {
      if      (f.op === "gte")   query = query.gte(f.column, f.value);
      else if (f.op === "lte")   query = query.lte(f.column, f.value);
      else if (f.op === "eq")    query = query.eq(f.column, f.value);
      else if (f.op === "ilike") query = query.ilike(f.column, f.value);
    }

    const { data, error } = await query;
    if (error) throw new Error(`Erro ao consultar ${table}: ${error.message}`);

    const pageRows = data || [];
    rows.push(...pageRows);
    if (pageRows.length < EXPORT_PAGE_SIZE) return rows;
    from += EXPORT_PAGE_SIZE;
  }
}

function anoToYearScope(ano) {
  if (ano === "2023" || ano === "2024") return "2023_2024";
  return ano;
}

/**
 * Exporta os empenhos da CEO para o exercício selecionado.
 *
 * @param {{ ano?: string }} params
 */
export async function fetchAllCeoExportData({ ano = "2026" } = {}) {
  const supabase  = getSupabaseAdminClient();
  const yearScope = anoToYearScope(ano);

  const rows = await fetchAllRows(
    supabase,
    "vw_ne_active",
    [
      "codigo_unidade_gestora",
      "data_empenho",
      "numero_processo",
      "codigo_nota_empenho",
      "nome_usuario_criou",
      "valor_original",
      "valor_corrente",
      "saldo_a_liquidar",
      "quantidade",
      "year_scope",
    ].join(", "),
    { column: "data_empenho", options: { ascending: false, nullsFirst: false } },
    [{ op: "eq", column: "year_scope", value: yearScope }]
  );

  return { rows, ano, yearScope };
}
