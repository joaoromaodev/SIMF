"use server";

import { getSupabaseAdminClient } from "../../lib/supabase/server.js";
import { revalidatePath } from "next/cache";

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

export async function fetchAllCpagExportData() {
  const supabase = getSupabaseAdminClient();

  const [liquidadosResult, monitoramentoResult] = await Promise.all([
    supabase
      .from("vw_liquidados_a_pagar")
      .select("numero_processo, codigo_nota_empenho, documento_liquidacao, credor, dl_documento_credor, fonte, valor_liquido, valor_bruto, valor_liquidado_a_pagar, updated_at")
      .order("updated_at", { ascending: false }),
    supabase
      .from("vw_monitoramento_pagamentos")
      .select("numero_processo, documento_liquidacao, ordem_bancaria, credor, ob_credor_documento, data_pagamento, valor, fonte, confirmado_manualmente, confirmado_por, confirmado_em, observacao")
      .order("data_pagamento", { ascending: false }),
  ]);

  return {
    liquidados: liquidadosResult.data || [],
    monitoramento: monitoramentoResult.data || [],
  };
}
