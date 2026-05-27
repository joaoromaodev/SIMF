"use server";

import { getSupabaseAdminClient } from "../../lib/supabase/server.js";

// ── Helpers ──────────────────────────────────────────────────────────────────

const PAGE_SIZE = 1000;

async function fetchAll(supabase, table, columns, filters = []) {
  const rows = [];
  let from = 0;
  while (true) {
    let q = supabase.from(table).select(columns).range(from, from + PAGE_SIZE - 1);
    for (const f of filters) {
      if (f.op === "eq") q = q.eq(f.col, f.val);
    }
    const { data, error } = await q;
    if (error) throw new Error(`Erro ao consultar ${table}: ${error.message}`);
    const page = data || [];
    rows.push(...page);
    if (page.length < PAGE_SIZE) return rows;
    from += PAGE_SIZE;
  }
}

// ── Extrato de uma conta ──────────────────────────────────────────────────────

export async function fetchAcontExtratoExport({ contaId, exercicio = "2026" } = {}) {
  const supabase = getSupabaseAdminClient();

  const [contaRes, extratoRes] = await Promise.all([
    supabase
      .from("acont_contas")
      .select("banco, agencia, numero_conta, finalidade, conta_contabil")
      .eq("id", contaId)
      .single(),
    supabase
      .from("acont_extrato")
      .select("data_ob, data_transacao, tipo, tipo_despesa, descricao, valor")
      .eq("conta_id", contaId)
      .gte("data_ob", `${exercicio}-01-01`)
      .lte("data_ob", `${exercicio}-12-31`)
      .order("data_ob", { ascending: false }),
  ]);

  return {
    conta:   contaRes.data  || null,
    extrato: extratoRes.data || [],
    exercicio,
  };
}

// ── Extrato consolidado de um banco ──────────────────────────────────────────

export async function fetchAcontExtratoConsolidadoExport({ banco, exercicio = "2026" } = {}) {
  const supabase = getSupabaseAdminClient();

  const { data: contas, error: errContas } = await supabase
    .from("acont_contas")
    .select("id, banco, agencia, numero_conta, finalidade")
    .eq("banco", banco)
    .eq("ativo", true)
    .order("numero_conta");

  if (errContas) throw new Error(errContas.message);

  const contaIds = (contas || []).map((c) => c.id);

  const { data: extrato, error: errExt } = await supabase
    .from("acont_extrato")
    .select("conta_id, data_ob, data_transacao, tipo, tipo_despesa, descricao, valor")
    .in("conta_id", contaIds)
    .gte("data_ob", `${exercicio}-01-01`)
    .lte("data_ob", `${exercicio}-12-31`)
    .order("conta_id")
    .order("data_ob", { ascending: false });

  if (errExt) throw new Error(errExt.message);

  // Enriquecer extrato com dados da conta
  const contaMap = Object.fromEntries((contas || []).map((c) => [c.id, c]));
  const rows = (extrato || []).map((r) => ({
    ...r,
    conta: contaMap[r.conta_id] || null,
  }));

  return { banco, exercicio, contas: contas || [], extrato: rows };
}

// ── Posição de saldos (todas as contas) ──────────────────────────────────────

export async function fetchAcontPosicaoSaldosExport({ exercicio = "2026", banco = null } = {}) {
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .rpc("fn_acont_posicao_saldos", { p_exercicio: exercicio });

  if (error) throw new Error(error.message);

  let rows = data || [];
  if (banco) rows = rows.filter((r) => r.banco === banco);

  return { exercicio, rows };
}

// ── Divergências ─────────────────────────────────────────────────────────────

export async function fetchAcontDivergenciasExport({ exercicio = "2026" } = {}) {
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .rpc("fn_acont_posicao_saldos", { p_exercicio: exercicio });

  if (error) throw new Error(error.message);

  const THRESH = 0.05;
  const rows = (data || []).filter((r) => {
    const disp   = parseFloat(r.saldo_disponibilidade || 0);
    const razao  = parseFloat(r.saldo_razao           || 0);
    const extrato = r.saldo_extrato_cc != null ? parseFloat(r.saldo_extrato_cc) : null;
    const divRazao  = Math.abs(disp - razao)  > THRESH;
    const divExtrat = extrato != null && Math.abs(disp - extrato) > THRESH;
    return divRazao || divExtrat;
  }).map((r) => {
    const disp   = parseFloat(r.saldo_disponibilidade || 0);
    const razao  = parseFloat(r.saldo_razao           || 0);
    const extrato = r.saldo_extrato_cc != null ? parseFloat(r.saldo_extrato_cc) : null;
    return {
      ...r,
      diff_razao:   Math.abs(disp - razao),
      diff_extrato: extrato != null ? Math.abs(disp - extrato) : null,
    };
  });

  return { exercicio, rows };
}

// ── Consolidado por fonte ─────────────────────────────────────────────────────

export async function fetchAcontConsolidadoFonteExport({ exercicio = "2026", banco = null } = {}) {
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .rpc("fn_acont_consolidado_fonte", {
      p_exercicio: exercicio,
      p_banco: banco || null,
    });

  if (error) throw new Error(error.message);

  return { exercicio, banco, rows: data || [] };
}

// ── Movimentações do período ──────────────────────────────────────────────────

export async function fetchAcontMovimentacoesExport({
  exercicio  = "2026",
  banco      = null,
  dataInicio = null,
  dataFim    = null,
} = {}) {
  const supabase = getSupabaseAdminClient();

  // Busca IDs de contas do banco (se filtrado)
  let contaIds = null;
  if (banco) {
    const { data: contas } = await supabase
      .from("acont_contas")
      .select("id")
      .eq("banco", banco)
      .eq("ativo", true);
    contaIds = (contas || []).map((c) => c.id);
    if (contaIds.length === 0) return { exercicio, banco, rows: [] };
  }

  let q = supabase
    .from("acont_extrato")
    .select("conta_id, data_ob, data_transacao, tipo, tipo_despesa, descricao, valor")
    .order("data_ob", { ascending: false });

  if (contaIds) q = q.in("conta_id", contaIds);
  if (dataInicio) q = q.gte("data_ob", dataInicio);
  if (dataFim)    q = q.lte("data_ob", dataFim);

  const { data: extrato, error } = await q;
  if (error) throw new Error(error.message);

  // Enriquecer com info da conta
  const ids = [...new Set((extrato || []).map((r) => r.conta_id))];
  let contaMap = {};
  if (ids.length > 0) {
    const { data: contas } = await supabase
      .from("acont_contas")
      .select("id, banco, numero_conta, finalidade")
      .in("id", ids);
    contaMap = Object.fromEntries((contas || []).map((c) => [c.id, c]));
  }

  const rows = (extrato || []).map((r) => ({
    ...r,
    conta: contaMap[r.conta_id] || null,
  }));

  return { exercicio, banco, rows };
}
