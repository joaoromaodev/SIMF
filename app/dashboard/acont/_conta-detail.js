/**
 * Lógica de dados compartilhada para as páginas de detalhe de conta.
 * Importada por bb/[id]/page.js, banpara/[id]/page.js e cef/[id]/page.js
 */

export async function fetchContaDetalhe(supabase, id, exercicio = "2026") {
  const [contaRes, saldosRes, extratoRes] = await Promise.all([
    supabase
      .from("acont_contas")
      .select("id, banco, agencia, numero_conta, finalidade, conta_contabil, ativo")
      .eq("id", id)
      .single(),
    supabase
      .from("acont_saldos")
      .select("fonte, detalhamento, disponibilidade_exercicio, disponibilidade_anterior, razao_exercicio, razao_anterior, aplicacao_exercicio, aplicacao_anterior, extrato_cc, extrato_ci")
      .eq("conta_id", id)
      .eq("exercicio", exercicio)
      .order("fonte"),
    supabase
      .from("acont_extrato")
      .select("id, data_ob, data_transacao, tipo, tipo_despesa, descricao, valor")
      .eq("conta_id", id)
      .order("data_ob", { ascending: false }),
  ]);

  // Resumo de saldo calculado a partir dos saldos do exercício
  const saldos  = saldosRes.data || [];
  const disp    = saldos.reduce((s, r) => s + parseFloat(r.disponibilidade_exercicio || 0) + parseFloat(r.disponibilidade_anterior || 0), 0);
  const razao   = saldos.reduce((s, r) => s + parseFloat(r.razao_exercicio           || 0) + parseFloat(r.razao_anterior           || 0), 0);
  const extCC   = saldos.find((r) => r.extrato_cc != null)?.extrato_cc ?? null;

  return {
    conta:   contaRes.data || null,
    saldos,
    extrato: extratoRes.data || [],
    resumo:  { disp, razao, extCC: extCC != null ? parseFloat(extCC) : null },
  };
}

export function calcConferencia(resumo) {
  const { disp, razao, extCC } = resumo;
  const THRESH = 0.05;
  if (extCC == null) {
    return { ok: Math.abs(disp - razao) <= THRESH, parcial: true };
  }
  const ok = Math.abs(disp - razao) <= THRESH && Math.abs(disp - extCC) <= THRESH;
  return { ok, parcial: false };
}
