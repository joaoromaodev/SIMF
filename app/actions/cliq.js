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

/**
 * Exporta a aba ativa da CLIQ respeitando os filtros de URL.
 *
 * @param {{ tab?: string, ano?: string, filters?: object }} params
 *   tab     — "empenhos_liquidar" | "historico_liquidados"  (padrão: "empenhos_liquidar")
 *   ano     — ex. "2026"
 *   filters — { fonte, credor, processo } — vindos da URL
 */
export async function fetchAllCliqExportData({
  tab     = "empenhos_liquidar",
  ano     = "2026",
  filters = {},
} = {}) {
  const supabase = getSupabaseAdminClient();

  const activeFilters = [];
  if (filters.fonte)    activeFilters.push({ op: "eq",    column: "fonte",                value: filters.fonte });
  if (filters.credor)   activeFilters.push({ op: "ilike", column: "credor",               value: `%${filters.credor}%` });
  if (filters.processo) activeFilters.push({ op: "ilike", column: "numero_processo",      value: `%${filters.processo}%` });
  if (filters.empenho)  activeFilters.push({ op: "ilike", column: "codigo_nota_empenho",  value: `%${filters.empenho}%` });

  // Para Tab 1, ordena por data_empenho; Tab 2 por data_liquidacao
  const order = tab === "empenhos_liquidar"
    ? { column: "data_empenho",    options: { ascending: false, nullsFirst: false } }
    : { column: "data_liquidacao", options: { ascending: false, nullsFirst: false } };

  const rows = await fetchAllRows(
    supabase,
    "vw_liquidados_a_pagar",
    [
      "numero_processo",
      "codigo_nota_empenho",
      "credor",
      "codigo_natureza_despesa",
      "fonte",
      "data_liquidacao",
      "valor_bruto",
      "valor_liquido",
      "valor_ja_pago_obs",
      "valor_liquidado_a_pagar",
      "documento_liquidacao",
    ].join(", "),
    order,
    activeFilters
  );

  // ── Pós-filtros client-computed (campos derivados / multi-valor) ──────────

  let filteredRows = rows;

  // Filtro de status (baseado em valor_ja_pago_obs — campo real da vw_liquidados_a_pagar)
  if (filters.status === "pendente") {
    filteredRows = filteredRows.filter(
      (r) => (parseFloat(r.valor_ja_pago_obs) || 0) === 0
    );
  } else if (filters.status === "parcial") {
    filteredRows = filteredRows.filter(
      (r) => (parseFloat(r.valor_ja_pago_obs) || 0) > 0
    );
  }

  // Filtro de multi-fontes (Aba 2 — ?fontes=A,B,C)
  if (filters.fontes) {
    const fontesArr = filters.fontes.split(",").map((f) => f.trim()).filter(Boolean);
    if (fontesArr.length > 0) {
      filteredRows = filteredRows.filter((r) => fontesArr.includes(r.fonte));
    }
  }

  return { tab, ano, rows: filteredRows };
}
