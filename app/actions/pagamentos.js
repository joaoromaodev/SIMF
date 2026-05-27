"use server";

import { getSupabaseAdminClient } from "../../lib/supabase/server.js";
import { revalidatePath } from "next/cache";

const EXPORT_PAGE_SIZE = 1000;

export async function toggleMarcacaoPagamento(ordemBancaria, novoValor, confirmadoPor) {
  const supabase = getSupabaseAdminClient();

  const { error } = await supabase.from("marcacoes_pagamento").upsert(
    {
      ordem_bancaria: ordemBancaria,
      confirmado_manualmente: novoValor,
      confirmado_por: novoValor ? (confirmadoPor || null) : null,
      confirmado_em: novoValor ? new Date().toISOString() : null,
    },
    { onConflict: "ordem_bancaria" }
  );

  if (error) {
    throw new Error(`Erro ao atualizar marcação: ${error.message}`);
  }

  revalidatePath("/dashboard/dppc/cpag");
}

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

    if (error) {
      throw new Error(`Erro ao consultar ${table}: ${error.message}`);
    }

    const pageRows = data || [];
    rows.push(...pageRows);

    if (pageRows.length < EXPORT_PAGE_SIZE) {
      return rows;
    }

    from += EXPORT_PAGE_SIZE;
  }
}

/**
 * Exporta somente a aba ativa com os filtros em vigor.
 *
 * @param {{ tab?: string, ano?: string, filters?: object }} params
 *   tab     — "liquidados" | "monitoramento"  (padrão: "liquidados")
 *   ano     — ex. "2026"
 *   filters — { credor?, processo?, docCred?, vinculo? }
 */
function anoToYearScope(ano) {
  if (ano === "2023" || ano === "2024") return "2023_2024";
  return ano;
}

export async function fetchAllCpagExportData({ tab = "liquidados", ano = "2026", filters = {} } = {}) {
  const supabase   = getSupabaseAdminClient();
  const yearScope  = anoToYearScope(ano);

  if (tab === "monitoramento") {
    const monFilters = [
      { op: "gte", column: "data_pagamento", value: `${ano}-01-01` },
      { op: "lte", column: "data_pagamento", value: `${ano}-12-31` },
    ];
    if (filters.credor)   monFilters.push({ op: "ilike", column: "credor",          value: `%${filters.credor}%`   });
    if (filters.processo) monFilters.push({ op: "ilike", column: "numero_processo",  value: `%${filters.processo}%` });
    if (filters.docCred)  monFilters.push({ op: "ilike", column: "documento_credor", value: `%${filters.docCred}%`  });
    if (filters.vinculo === "sem_vinculo") monFilters.push({ op: "eq", column: "tem_vinculo_nedl",       value: false });
    if (filters.vinculo === "confirmados") monFilters.push({ op: "eq", column: "confirmado_manualmente", value: true  });

    const monitoramento = await fetchAllRows(
      supabase,
      "vw_monitoramento_pagamentos",
      [
        "numero_processo",
        "documento_liquidacao",
        "ordem_bancaria",
        "credor",
        "ob_credor_documento",
        "data_liquidacao",
        "data_pagamento",
        "valor",
        "fonte",
        "codigo_unidade_gestora",
        "contrato_convenio",
        "descricao",
        "documento_credor",
        "tem_vinculo_nedl",
        "motivo_sem_vinculo",
        "confirmado_manualmente",
        "confirmado_por",
        "confirmado_em",
        "observacao",
      ].join(", "),
      { column: "data_pagamento", options: { ascending: false } },
      monFilters
    );
    return { tab, monitoramento };
  }

  // tab === "liquidados" — filtro obrigatório por ano + filtros opcionais
  const liqFilters = [{ op: "eq", column: "year_scope", value: yearScope }];
  if (filters.credor)   liqFilters.push({ op: "ilike", column: "credor",          value: `%${filters.credor}%`   });
  if (filters.processo) liqFilters.push({ op: "ilike", column: "numero_processo",  value: `%${filters.processo}%` });

  const liquidados = await fetchAllRows(
    supabase,
    "vw_liquidados_a_pagar",
    [
      "numero_processo",
      "codigo_nota_empenho",
      "documento_liquidacao",
      "data_liquidacao",
      "credor",
      "dl_documento_credor",
      "fonte",
      "valor_liquido",
      "valor_bruto",
      "valor_liquidado_a_pagar",
      "valor_ja_pago_obs",
    ].join(", "),
    { column: "data_liquidacao", options: { ascending: false, nullsFirst: false } },
    liqFilters
  );
  return { tab, liquidados };
}
