-- Migration: 20260525140000_unlock_historical_imports
--
-- Remove a política de imutabilidade dos históricos (2023_2024 e 2025).
-- Todos os year_scopes passam a usar a mesma lógica de substituição do 2026:
-- apenas o batch is_active=true é visível nas views; reimports desativam
-- o batch anterior e substituem as linhas normalizadas atomicamente.
--
-- Antes: vw_active_import_batches mostrava TODOS os batches success de anos
--        históricos (independente de is_active), o que causaria duplicatas
--        se a trava do código fosse removida sem esta migration.
-- Depois: todos os anos filtram por is_active = true.

create or replace view public.vw_active_import_batches as
select
  b.id,
  b.report_type::text   as report_type,
  b.year_scope::text    as year_scope,
  b.original_file_name,
  b.storage_bucket,
  b.storage_path,
  b.status::text        as status,
  b.processed_row_count,
  b.normalized_row_count,
  b.is_active,
  b.started_at,
  b.finished_at,
  b.created_at,
  b.updated_at
from public.import_batches b
where b.status::text = 'success'
  and b.is_active = true;
