/**
 * Lógica de dados compartilhada para as páginas de detalhe de conta.
 * Importada por bb/[id]/page.js, banpara/[id]/page.js e cef/[id]/page.js
 */

export async function fetchContaDetalhe(supabase, id) {
  const [contaRes, saldosRes, extratoRes] = await Promise.all([
    supabase
      .from("vw_acont_resumo_conta")
      .select("*")
      .eq("id", id)
      .single(),
    supabase
      .from("acont_saldos")
      .select("fonte, detalhamento, disponibilidade_exercicio, disponibilidade_anterior, razao_exercicio, razao_anterior, aplicacao_exercicio, aplicacao_anterior, extrato_cc, extrato_ci")
      .eq("conta_id", id)
      .order("fonte"),
    supabase
      .from("acont_extrato")
      .select("id, data_ob, data_transacao, tipo, tipo_despesa, descricao, valor")
      .eq("conta_id", id)
      .order("data_ob", { ascending: false }),
  ]);

  return {
    conta:   contaRes.data  || null,
    saldos:  saldosRes.data || [],
    extrato: extratoRes.data || [],
  };
}

export function calcConferencia(conta) {
  if (!conta) return null;
  const disp    = parseFloat(conta.saldo_disponibilidade || 0);
  const razao   = parseFloat(conta.saldo_razao           || 0);
  const extrato = conta.saldo_extrato_cc != null ? parseFloat(conta.saldo_extrato_cc) : null;
  const THRESH  = 0.05;
  if (extrato == null) {
    return { ok: Math.abs(disp - razao) <= THRESH, parcial: true };
  }
  const ok = Math.abs(disp - razao) <= THRESH && Math.abs(disp - extrato) <= THRESH;
  return { ok, parcial: false };
}
