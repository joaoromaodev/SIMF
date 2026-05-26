-- Migration: 20260525180000_hardening_indices_and_cleanup
--
-- Incremento 10 — Hardening pós-validação.
--
-- 1. Índices adicionais para padrões de consulta comuns nas views de BI.
-- 2. Índice composto em import_batches para lookup de batch ativo.
-- 3. Remove branches legados (NE_DL / DL_OB) de finalize_siafe_active_import.
--    As tabelas correspondentes foram removidas em 20260518130000_drop_legacy_tables.
-- 4. Avalição de materialized views: sem necessidade real no volume atual.
--    Views SQL comuns sobre tabelas normalizadas são suficientes.
-- 5. Históricos não são travados — decisão explícita (ver 20260525140000).
--    Todos os year_scopes usam substituição atômica via is_active.

-- ── Índices em normalized_nedl_rows ──────────────────────────────────────────

-- Filtragem por credor (CLIQ, CPAG)
create index if not exists normalized_nedl_rows_credor_nome_idx
  on public.normalized_nedl_rows (credor_nome)
  where credor_nome is not null;

-- Filtragem por fonte de recurso (CLIQ)
create index if not exists normalized_nedl_rows_nome_fonte_recurso_idx
  on public.normalized_nedl_rows (nome_fonte_recurso)
  where nome_fonte_recurso is not null;

-- Filtragem por data de liquidação (range queries)
create index if not exists normalized_nedl_rows_data_liquidacao_idx
  on public.normalized_nedl_rows (data_liquidacao)
  where data_liquidacao is not null;

-- Cruzamento NEDL→NE por processo
create index if not exists normalized_nedl_rows_numero_processo_ne_idx
  on public.normalized_nedl_rows (numero_processo)
  where numero_processo is not null;

-- ── Índices em normalized_ne_rows ────────────────────────────────────────────

-- Filtragem por data de empenho (range queries)
create index if not exists normalized_ne_rows_data_empenho_idx
  on public.normalized_ne_rows (data_empenho)
  where data_empenho is not null;

-- ── Índices em normalized_dlob_rows ──────────────────────────────────────────

-- Filtragem por data de pagamento (range queries)
create index if not exists normalized_dlob_rows_data_pagamento_idx
  on public.normalized_dlob_rows (data_pagamento)
  where data_pagamento is not null;

-- ── Índice composto em import_batches ────────────────────────────────────────

-- Lookup frequente: batch ativo por tipo e ano (getActiveBatch + vw_active_import_batches)
create index if not exists idx_import_batches_active_lookup
  on public.import_batches (report_type, year_scope, is_active, status)
  where is_active = true and status = 'success';

-- ── Remoção de branches legados do finalize_siafe_active_import ──────────────
-- As tabelas normalized_ne_dl_rows e normalized_dl_ob_rows foram removidas em
-- 20260518130000_drop_legacy_tables.sql. Os branches NE_DL/DL_OB da função
-- ficariam silenciosos (delete from tabela inexistente nunca seria acionado),
-- mas os mantemos removidos por limpeza e clareza de código.

create or replace function public.finalize_siafe_active_import(
  p_new_batch_id uuid,
  p_report_type public.siafe_report_type,
  p_year_scope public.siafe_year_scope,
  p_source_headers jsonb,
  p_processed_row_count integer,
  p_normalized_row_count integer
)
returns jsonb
language plpgsql
as $$
declare
  v_previous_batch_ids uuid[];
begin
  select coalesce(array_agg(locked.id), array[]::uuid[])
  into v_previous_batch_ids
  from (
    select id
    from public.import_batches
    where report_type = p_report_type
      and year_scope = p_year_scope
      and status = 'success'
      and is_active = true
      and id <> p_new_batch_id
    for update
  ) as locked;

  -- Desativa batches anteriores
  update public.import_batches
  set
    is_active = false,
    replaced_batch_id = p_new_batch_id,
    finished_at = timezone('utc'::text, now())
  where id = any(v_previous_batch_ids);

  -- Ativa o novo batch
  update public.import_batches
  set
    status = 'success',
    source_headers = p_source_headers,
    processed_row_count = p_processed_row_count,
    normalized_row_count = p_normalized_row_count,
    validation_errors = '[]'::jsonb,
    is_active = true,
    finished_at = timezone('utc'::text, now())
  where id = p_new_batch_id;

  -- Remove linhas normalizadas do batch anterior (substituição integral)
  if p_report_type::text = 'NE' then
    delete from public.normalized_ne_rows
    where import_batch_id = any(v_previous_batch_ids);
  elsif p_report_type::text = 'NEDL' then
    delete from public.normalized_nedl_rows
    where import_batch_id = any(v_previous_batch_ids);
  elsif p_report_type::text = 'DLOB' then
    delete from public.normalized_dlob_rows
    where import_batch_id = any(v_previous_batch_ids);
  end if;
  -- Nota: branches NE_DL e DL_OB foram removidos — tabelas legadas dropadas em
  -- 20260518130000_drop_legacy_tables.sql.

  return jsonb_build_object(
    'active_batch_id', p_new_batch_id,
    'deactivated_batch_ids', v_previous_batch_ids
  );
end;
$$;
