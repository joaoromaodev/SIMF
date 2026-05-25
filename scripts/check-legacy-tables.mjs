/**
 * Verifica quais tabelas legadas ainda existem no banco tentando fazer
 * SELECT count(*) em cada uma via REST. Somente leitura.
 *
 * Uso:
 *   node --env-file=.env.local scripts/check-legacy-tables.mjs
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
  console.error('    NEXT_PUBLIC_SUPABASE_URL  :', SUPABASE_URL ? '✓' : 'AUSENTE');
  console.error('    SUPABASE_SERVICE_ROLE_KEY :', SUPABASE_KEY ? '✓' : 'AUSENTE');
  console.error('\n    Execute com:');
  console.error('    node --env-file=.env.local scripts/check-legacy-tables.mjs\n');
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

const LEGACY = [
  'documentos_liquidacao',
  'normalized_ne_dl_rows',
  'normalized_dl_ob_rows',
  'ordens_bancarias',
  'notas_empenho',
  'processos',
  'consolidated_siafe_lineage',
];

async function main() {
  console.log('SIMF — Tabelas legadas presentes no banco\n');
  const existentes = [];

  for (const table of LEGACY) {
    const { error } = await sb.from(table).select('*', { count: 'exact', head: true });
    if (error && (error.code === 'PGRST116' || error.message?.includes('does not exist'))) {
      console.log(`  AUSENTE  ${table}`);
    } else if (error) {
      console.log(`  EXISTE?  ${table}  (erro: ${error.message})`);
      existentes.push(table);
    } else {
      console.log(`  EXISTE   ${table}`);
      existentes.push(table);
    }
  }

  console.log('\n--- Resumo ---');
  if (existentes.length === 0) {
    console.log('Nenhuma tabela legada encontrada via REST. Já removidas ou nunca aplicadas.');
  } else {
    console.log(`Tabelas a remover (${existentes.length}):`);
    for (const t of existentes) console.log(`  DROP TABLE IF EXISTS ${t} CASCADE;`);
  }
}

main().catch(e => { console.error('ERRO:', e.message); process.exit(1); });
