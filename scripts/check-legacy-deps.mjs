/**
 * Verifica se alguma view do schema public referencia as tabelas legadas.
 * Somente leitura — não altera nada.
 *
 * Uso:
 *   node --env-file=.env.local scripts/check-legacy-deps.mjs
 *
 * Variáveis obrigatórias:
 *   NEXT_PUBLIC_SUPABASE_URL      — URL do projeto Supabase
 *   SUPABASE_SERVICE_ROLE_KEY     — service role key (nunca a anon key)
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('\n❌  Variáveis de ambiente obrigatórias não definidas.');
  console.error('    NEXT_PUBLIC_SUPABASE_URL  :', SUPABASE_URL  ? '✓' : 'AUSENTE');
  console.error('    SUPABASE_SERVICE_ROLE_KEY :', SUPABASE_KEY  ? '✓' : 'AUSENTE');
  console.error('\n    Execute com:');
  console.error('    node --env-file=.env.local scripts/check-legacy-deps.mjs\n');
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

const LEGACY_TABLES = [
  'documentos_liquidacao',
  'normalized_ne_dl_rows',
  'normalized_dl_ob_rows',
  'ordens_bancarias',
  'notas_empenho',
  'processos',
  'consolidated_siafe_lineage',
];

async function main() {
  console.log('SIMF — Verificação de dependências do legado\n');

  const { data: views, error } = await sb
    .from('information_schema.views')
    .select('table_name, view_definition')
    .eq('table_schema', 'public');

  if (error) {
    console.warn('⚠️  information_schema não acessível via REST. Verificando via views conhecidas...');
    await checkViaKnownViews();
    return;
  }

  console.log(`Views encontradas no schema public: ${views.length}\n`);

  let found = false;
  for (const legacyTable of LEGACY_TABLES) {
    const dependentes = views.filter(v =>
      v.view_definition &&
      v.view_definition.toLowerCase().includes(legacyTable.toLowerCase())
    );
    if (dependentes.length > 0) {
      found = true;
      console.log(`❌ BLOQUEADOR — "${legacyTable}" é referenciada por:`);
      for (const v of dependentes) console.log(`     • ${v.table_name}`);
    } else {
      console.log(`✓  "${legacyTable}" — sem dependências`);
    }
  }

  if (!found) {
    console.log('\n✅ Nenhuma view ativa depende do legado. DROP pode prosseguir com segurança.');
  } else {
    console.log('\n🚫 Corrija as dependências antes de executar o DROP.');
    process.exit(1);
  }
}

async function checkViaKnownViews() {
  const toCheck = [
    { view: 'vw_dlob_sem_nedl_diagnostico', desc: 'view de diagnóstico (recém-reescrita)' },
    { view: 'vw_dlob_sem_nedl_detalhado',   desc: 'view de detalhamento' },
    { view: 'vw_monitoramento_pagamentos',  desc: 'view CPAG' },
    { view: 'vw_liquidados_a_pagar',        desc: 'view CLIQ' },
    { view: 'vw_cpag_kpis',                 desc: 'KPIs CPAG' },
  ];

  let allOk = true;
  for (const { view, desc } of toCheck) {
    const { error } = await sb.from(view).select('*').limit(1);
    if (error) {
      console.log(`❌ ${view} (${desc}): ${error.message}`);
      allOk = false;
    } else {
      console.log(`✓  ${view} (${desc}): consulta OK`);
    }
  }

  if (allOk) {
    console.log('\n✅ Todas as views principais consultam sem erro.');
    console.log('   Confirme manualmente via Supabase SQL Editor que nenhuma referencia o legado.');
  }
}

main().catch(e => { console.error('ERRO:', e.message); process.exit(1); });
