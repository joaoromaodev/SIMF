import { createClient } from '@supabase/supabase-js';
const sb = createClient(
  'https://kxvnotkxfyuscqouhacw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4dm5vdGt4Znl1c2Nxb3VoYWN3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDg5NDY1OCwiZXhwIjoyMDkwNDcwNjU4fQ.H_vpotjq4qiNfsLEwMmWF4vSPsoMxak-cIHxglRnhaQ',
  { auth: { persistSession: false } }
);
for (const ys of ['2023_2024', '2025', '2026']) {
  const { data, error } = await sb.rpc('count_ne_by_year_scope', { p_year_scope: ys });
  console.log(`${ys} => ${error ? 'ERRO: ' + error.message : data}`);
}
