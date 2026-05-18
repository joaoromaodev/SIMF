/**
 * SIMF — Diagnóstico Fase 1: Órfãos DLOB sem NEDL
 * Executa as 7 tarefas do prompt de diagnóstico via REST API do Supabase.
 * Não altera nada no banco — somente leitura.
 *
 * Uso: node scripts/diagnostico-fase1.mjs
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kxvnotkxfyuscqouhacw.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4dm5vdGt4Znl1c2Nxb3VoYWN3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDg5NDY1OCwiZXhwIjoyMDkwNDcwNjU4fQ.H_vpotjq4qiNfsLEwMmWF4vSPsoMxak-cIHxglRnhaQ';

const sb = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

// ─── helpers ────────────────────────────────────────────────────────────────

function hr(title) {
  console.log('\n' + '═'.repeat(70));
  console.log(`  ${title}`);
  console.log('═'.repeat(70));
}

function groupBy(rows, key) {
  const map = {};
  for (const row of rows) {
    const k = row[key] ?? '__null__';
    if (!map[k]) map[k] = [];
    map[k].push(row);
  }
  return map;
}

function sum(rows, field) {
  return rows.reduce((acc, r) => acc + (parseFloat(r[field]) || 0), 0);
}

/** Busca todas as páginas de uma view (PostgREST limita a 1000/req). */
async function fetchAll(view, select = '*', extraFilter = null) {
  const PAGE = 1000;
  let all = [];
  let from = 0;
  while (true) {
    let q = sb.from(view).select(select).range(from, from + PAGE - 1);
    if (extraFilter) q = extraFilter(q);
    const { data, error } = await q;
    if (error) throw new Error(`${view}: ${error.message}`);
    all = all.concat(data);
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return all;
}

// ─── TAREFA 1 ────────────────────────────────────────────────────────────────
async function tarefa1() {
  hr('TAREFA 1 — Distribuição atual dos órfãos (vw_dlob_sem_nedl_detalhado)');

  const rows = await fetchAll('vw_dlob_sem_nedl_detalhado',
    'year_scope,documento_liquidacao,ordem_bancaria,valor');

  const byYear = groupBy(rows, 'year_scope');

  console.log('\nyear_scope    | total_sem_nedl | dls_distintas | obs_distintas | soma_valor');
  console.log('--------------|----------------|---------------|---------------|------------------');

  const years = Object.keys(byYear).sort();
  for (const ys of years) {
    const g = byYear[ys];
    const dls = new Set(g.map(r => r.documento_liquidacao)).size;
    const obs = new Set(g.map(r => r.ordem_bancaria)).size;
    const total = sum(g, 'valor');
    console.log(
      `${ys.padEnd(13)} | ${String(g.length).padEnd(14)} | ${String(dls).padEnd(13)} | ${String(obs).padEnd(13)} | ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
    );
  }
  console.log(`\nTOTAL: ${rows.length} linhas`);
  return rows; // reutilizado nas demais tarefas
}

// ─── TAREFA 2 ────────────────────────────────────────────────────────────────
async function tarefa2(dlob_orfaos) {
  hr('TAREFA 2 — Confirmar ausência de match direto no NEDL ativo');

  // Pega os pares (year_scope, documento_liquidacao) dos órfãos
  const pairs = dlob_orfaos.map(r => ({ ys: r.year_scope, dl: r.documento_liquidacao }));

  // Busca NEDL ativo (somente campos necessários)
  console.log('  Buscando vw_nedl_active...');
  const nedl = await fetchAll('vw_nedl_active', 'year_scope,documento_liquidacao');

  const nedlSet = new Set(nedl.map(r => `${r.year_scope}|||${r.documento_liquidacao}`));

  const byYear = {};
  for (const p of pairs) {
    if (!byYear[p.ys]) byYear[p.ys] = { total: 0, com_match: 0 };
    byYear[p.ys].total++;
    if (nedlSet.has(`${p.ys}|||${p.dl}`)) byYear[p.ys].com_match++;
  }

  console.log('\nyear_scope    | total_dlob_sem_nedl | encontrados_match_direto');
  console.log('--------------|---------------------|-------------------------');
  for (const ys of Object.keys(byYear).sort()) {
    const g = byYear[ys];
    console.log(`${ys.padEnd(13)} | ${String(g.total).padEnd(19)} | ${g.com_match} ${g.com_match === 0 ? '✓ (esperado 0)' : '⚠️ INESPERADO'}`);
  }

  return nedl; // reutilizado na tarefa 3 e 4
}

// ─── TAREFA 3 ────────────────────────────────────────────────────────────────
async function tarefa3(dlob_orfaos) {
  hr('TAREFA 3 — Verificar presença no raw_row do NEDL (fuzzy)');
  console.log('  Buscando raw_row do NEDL ativo (pode demorar)...');

  const nedlRaw = await fetchAll('vw_nedl_active', 'year_scope,documento_liquidacao,raw_row');

  // Para cada DL orfã, verifica se aparece no raw_row de qualquer linha NEDL do mesmo year_scope
  const dlOrfas = [...new Set(dlob_orfaos.map(r => `${r.year_scope}|||${r.documento_liquidacao}`))];

  const matches = [];
  for (const key of dlOrfas) {
    const [ys, dl] = key.split('|||');
    if (!dl) continue;
    const count = nedlRaw.filter(n =>
      n.year_scope === ys &&
      n.raw_row &&
      typeof n.raw_row === 'string' &&
      n.raw_row.includes(dl)
    ).length;
    if (count > 0) matches.push({ year_scope: ys, documento_liquidacao: dl, ocorrencias: count });
  }

  if (matches.length === 0) {
    console.log('\n  ✓ Resultado: 0 matches em raw_row — DLs realmente ausentes do NEDL carregado.');
  } else {
    console.log(`\n  ⚠️ ${matches.length} DLs encontradas em raw_row:`);
    console.log('\nyear_scope | documento_liquidacao | ocorrencias_no_raw_nedl');
    for (const m of matches.slice(0, 100)) {
      console.log(`  ${m.year_scope} | ${m.documento_liquidacao} | ${m.ocorrencias}`);
    }
  }
}

// ─── TAREFA 4 ────────────────────────────────────────────────────────────────
async function tarefa4(dlob_orfaos, nedl_all) {
  hr('TAREFA 4 — Verificar cross-year_scope (erro de recorte temporal)');

  // Pega DLs únicas dos órfãos
  const dlOrfas = new Set(dlob_orfaos.map(r => r.documento_liquidacao).filter(Boolean));

  // Verifica se essas DLs aparecem no NEDL com year_scope diferente
  const crossMatches = {};
  for (const n of nedl_all) {
    if (!n.documento_liquidacao) continue;
    if (dlOrfas.has(n.documento_liquidacao)) {
      // Encontrou no NEDL — verifica se é de year_scope diferente
      const dlob_ys = dlob_orfaos
        .filter(r => r.documento_liquidacao === n.documento_liquidacao)
        .map(r => r.year_scope);

      for (const ys of dlob_ys) {
        if (ys !== n.year_scope) {
          const k = `${ys}|${n.year_scope}|${n.documento_liquidacao}`;
          crossMatches[k] = (crossMatches[k] || 0) + 1;
        }
      }
    }
  }

  const sorted = Object.entries(crossMatches)
    .map(([k, c]) => { const [ys_dlob, ys_nedl, dl] = k.split('|'); return { ys_dlob, ys_nedl, dl, c }; })
    .sort((a, b) => b.c - a.c)
    .slice(0, 100);

  if (sorted.length === 0) {
    console.log('\n  ✓ Resultado: Nenhum cross-year_scope — não é erro de recorte temporal.');
  } else {
    console.log(`\n  ⚠️ ${sorted.length} casos de cross-year_scope encontrados:`);
    console.log('\nyear_scope_dlob | year_scope_nedl | documento_liquidacao | ocorrencias');
    for (const m of sorted) {
      console.log(`  ${m.ys_dlob.padEnd(15)} | ${m.ys_nedl.padEnd(15)} | ${m.dl} | ${m.c}`);
    }
  }
}

// ─── TAREFA 5 ────────────────────────────────────────────────────────────────
async function tarefa5() {
  hr('TAREFA 5 — NEDL sem documento_liquidacao');

  const nedlSemDl = await fetchAll('vw_nedl_sem_documento_liquidacao',
    'year_scope,source_row_number,codigo_nota_empenho,numero_processo,credor_nome,data_liquidacao,valor_bruto,valor_liquidado_a_pagar,raw_row');

  const byYear = groupBy(nedlSemDl, 'year_scope');

  console.log('\nyear_scope    | linhas_sem_dl | soma_valor_bruto');
  console.log('--------------|---------------|-------------------');
  for (const ys of Object.keys(byYear).sort()) {
    const g = byYear[ys];
    const soma = sum(g, 'valor_bruto');
    console.log(`${ys.padEnd(13)} | ${String(g.length).padEnd(13)} | ${soma.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
  }

  console.log(`\nTOTAL: ${nedlSemDl.length} linhas sem documento_liquidacao`);

  if (nedlSemDl.length > 0) {
    console.log('\n--- Primeiros 20 exemplos ---');
    console.log('year_scope | row# | codigo_ne | credor_nome | valor_bruto | raw_row (primeiros 120 chars)');
    for (const r of nedlSemDl.slice(0, 20)) {
      const raw = r.raw_row ? String(r.raw_row).substring(0, 120).replace(/\n/g, ' ') : '(null)';
      console.log(`  ${r.year_scope} | ${r.source_row_number} | ${r.codigo_nota_empenho || '(null)'} | ${(r.credor_nome || '').substring(0, 30)} | ${r.valor_bruto} | ${raw}`);
    }

    // Classificação das linhas sem DL
    console.log('\n--- Classificação dos registros sem DL ---');
    let subtotais = 0, semValor = 0, comValor = 0;
    for (const r of nedlSemDl) {
      const vb = parseFloat(r.valor_bruto) || 0;
      const vp = parseFloat(r.valor_liquidado_a_pagar) || 0;
      const raw = String(r.raw_row || '').toLowerCase();
      if (raw.includes('total') || raw.includes('subtotal')) subtotais++;
      else if (vb === 0 && vp === 0) semValor++;
      else comValor++;
    }
    console.log(`  Com valor financeiro (possível dado real): ${comValor}`);
    console.log(`  Sem valor financeiro: ${semValor}`);
    console.log(`  Parecem subtotais/linhas agregadas: ${subtotais}`);
  }
}

// ─── TAREFA 6 ────────────────────────────────────────────────────────────────
async function tarefa6(dlob_orfaos) {
  hr('TAREFA 6 — Classificar órfãos por finalidade operacional');

  function classifica(finalidade) {
    const f = (finalidade || '').toUpperCase();
    if (/FOLHA|FOPAG|PESSOAL/.test(f)) return 'FOLHA';
    if (/RETEN|INSS|IRRF|ISS/.test(f)) return 'RETENCAO';
    if (/RAP|RESTOS A PAGAR/.test(f)) return 'RESTOS_A_PAGAR';
    if (/DAR|TRIBUTO|IMPOSTO/.test(f)) return 'TRIBUTOS';
    return 'OUTRO';
  }

  const classes = { FOLHA: [], RETENCAO: [], RESTOS_A_PAGAR: [], TRIBUTOS: [], OUTRO: [] };
  for (const r of dlob_orfaos) {
    const cl = classifica(r.finalidade);
    classes[cl].push(r);
  }

  console.log('\nclassificacao   | total | soma_valor');
  console.log('----------------|-------|------------------------');
  for (const [cl, rows] of Object.entries(classes)) {
    const s = sum(rows, 'valor');
    console.log(`${cl.padEnd(16)} | ${String(rows.length).padEnd(5)} | ${s.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
  }

  // Exemplos de finalidades únicas na categoria OUTRO
  const outroFinalidades = [...new Set(classes.OUTRO.map(r => r.finalidade || '(null)'))].slice(0, 30);
  if (outroFinalidades.length > 0) {
    console.log('\n--- Finalidades na categoria OUTRO (primeiras 30) ---');
    for (const f of outroFinalidades) console.log(`  "${f}"`);
  }

  // Exemplos com finalidades operacionais especiais (RAP, folha, etc.)
  const especiais = dlob_orfaos.filter(r => classifica(r.finalidade) !== 'OUTRO');
  if (especiais.length > 0) {
    console.log('\n--- Exemplos de finalidades operacionais (não-OUTRO) ---');
    for (const r of especiais.slice(0, 20)) {
      console.log(`  [${classifica(r.finalidade)}] ${r.year_scope} | OB: ${r.ordem_bancaria} | DL: ${r.documento_liquidacao} | valor: ${r.valor} | "${r.finalidade}"`);
    }
  }
}

// ─── TAREFA 7 ────────────────────────────────────────────────────────────────
async function tarefa7() {
  hr('TAREFA 7 — Confirmar que vw_liquidados_a_pagar está limpa');

  const semDl = await fetchAll('vw_liquidados_a_pagar', 'documento_liquidacao',
    q => q.or('documento_liquidacao.is.null,documento_liquidacao.eq.'));

  console.log(`\n  deve_ser_zero = ${semDl.length}`);
  if (semDl.length === 0) {
    console.log('  ✓ vw_liquidados_a_pagar não possui linhas sem documento_liquidacao.');
  } else {
    console.log(`  ⚠️ ${semDl.length} linhas com documento_liquidacao NULL ou vazio!`);
  }
}

// ─── MAIN ────────────────────────────────────────────────────────────────────
async function main() {
  console.log('SIMF — Diagnóstico Fase 1');
  console.log(`Data: ${new Date().toISOString()}`);
  console.log('Base: vw_dlob_sem_nedl_detalhado + vw_nedl_active + vw_liquidados_a_pagar\n');

  try {
    const dlob_orfaos = await tarefa1();
    // tarefa1 retorna todos os campos necessários para tarefas subsequentes
    // mas precisamos dos campos completos para tarefa 3 e 6
    // vamos refetch com todos os campos
    console.log('\n  [re-fetch completo dos órfãos para tarefas seguintes...]');
    const dlob_full = await fetchAll('vw_dlob_sem_nedl_detalhado');

    const nedl_all = await tarefa2(dlob_full);
    await tarefa3(dlob_full);
    await tarefa4(dlob_full, nedl_all);
    await tarefa5();
    await tarefa6(dlob_full);
    await tarefa7();

    hr('DIAGNÓSTICO CONCLUÍDO');
    console.log('Revise os resultados acima e prossiga com a Fase 2.');
  } catch (err) {
    console.error('\n❌ ERRO:', err.message);
    process.exit(1);
  }
}

main();
