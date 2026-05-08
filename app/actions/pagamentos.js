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

async function fetchAllRows(supabase, table, columns, order) {
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

export async function fetchAllCpagExportData() {
  const supabase = getSupabaseAdminClient();

  const [liquidados, monitoramento] = await Promise.all([
    fetchAllRows(
      supabase,
      "vw_liquidados_a_pagar",
      "numero_processo, codigo_nota_empenho, documento_liquidacao, data_liquidacao, credor, dl_documento_credor, fonte, valor_liquido, valor_bruto, valor_liquidado_a_pagar, valor_ja_pago_obs, updated_at",
      { column: "data_liquidacao", options: { ascending: false, nullsFirst: false } }
    ),
    fetchAllRows(
      supabase,
      "vw_monitoramento_pagamentos",
      "numero_processo, documento_liquidacao, ordem_bancaria, credor, ob_credor_documento, data_liquidacao, data_pagamento, valor, fonte, codigo_unidade_gestora, confirmado_manualmente, confirmado_por, confirmado_em, observacao",
      { column: "data_pagamento", options: { ascending: false } }
    ),
  ]);

  return {
    liquidados,
    monitoramento,
  };
}
