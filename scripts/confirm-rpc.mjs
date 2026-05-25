/**
 * Confirma que a RPC count_ne_by_year_scope responde para os 3 escopos.
 * Somente leitura.
 *
 * Uso:
 *   node --env-file=.env.local scripts/confirm-rpc.mjs
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
  console.error('    node --env-file=.env.local scripts/confirm-rpc.mjs\n');
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

for (const ys of ['2023_2024', '2025', '2026']) {
  const { data, error } = await sb.rpc('count_ne_by_year_scope', { p_year_scope: ys });
  console.log(`${ys} => ${error ? 'ERRO: ' + error.message : data}`);
}
