-- Migration: 20260525160000_add_imported_by_to_batches
--
-- Adiciona coluna `imported_by` a import_batches para rastreabilidade
-- de quem realizou cada importação. Vinculada ao auth.users sem FK hard
-- para permitir registros históricos mesmo após remoção de usuário.

alter table public.import_batches
  add column if not exists imported_by uuid
    references auth.users(id) on delete set null;

comment on column public.import_batches.imported_by is
  'UUID do usuário admin que realizou a importação. Null para batches legados.';

-- Índice para consultas de auditoria por usuário
create index if not exists idx_import_batches_imported_by
  on public.import_batches (imported_by)
  where imported_by is not null;
