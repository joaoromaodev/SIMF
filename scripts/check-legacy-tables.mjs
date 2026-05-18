/**
 * Verifica quais tabelas legadas ainda existem no banco tentando fazer
 * SELECT count(*) em cada uma via REST. Somente leitura.
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kxvnotkxfyuscqouhacw.supabase.co';
const SUPABASE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4dm5vdGt4Znl1c2Nxb3VoYWN3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDg5NDY1OCwiZXhwIjoyMDkwNDcwNjU4fQ.H_vpotjq4qiNfsLEwMmWF4vSPsoMxak-cIHxglRnhaQ';

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
    const { data, error } = await sb.from(table).select('*', { count: 'exact', head: true });
    if (error && error.code === 'PGRST116') {
      // tabela não exposta pelo PostgREST — provavelmente não existe
      console.log(`  AUSENTE  ${table}`);
    } else if (error && error.message && error.message.includes('does not exist')) {
      console.log(`  AUSENTE  ${table}`);
    } else if (error) {
      // outro erro — pode ser permissão, mas tabela existe
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
