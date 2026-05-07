alter type public.siafe_report_type add value if not exists 'NE';
alter type public.siafe_report_type add value if not exists 'NEDL';
alter type public.siafe_report_type add value if not exists 'DLOB';

create table if not exists public.normalized_ne_rows (
  id uuid primary key default gen_random_uuid(),
  import_batch_id uuid not null references public.import_batches(id) on delete cascade,
  source_row_number integer not null,
  year_scope public.siafe_year_scope not null,
  codigo_nota_empenho text,
  data_empenho date,
  nome_usuario_criou text,
  codigo_unidade_gestora text,
  numero_processo text,
  valor_original numeric(18, 2),
  valor_corrente numeric(18, 2),
  saldo_a_liquidar numeric(18, 2),
  quantidade numeric(18, 2),
  raw_row jsonb not null,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.normalized_nedl_rows (
  id uuid primary key default gen_random_uuid(),
  import_batch_id uuid not null references public.import_batches(id) on delete cascade,
  source_row_number integer not null,
  year_scope public.siafe_year_scope not null,
  documento_liquidacao text,
  data_liquidacao date,
  codigo_nota_empenho text,
  codigo_natureza_despesa text,
  nome_fonte_recurso text,
  codigo_fonte_recurso text,
  nome_detalhamento_fr text,
  codigo_detalhamento_fr text,
  numero_processo text,
  codigo_projeto_atividade text,
  credor_nome text,
  contrato text,
  convenio text,
  valor_original numeric(18, 2),
  valor_liquido numeric(18, 2),
  valor_bruto numeric(18, 2),
  valor_retido numeric(18, 2),
  valor_pago numeric(18, 2),
  valor_liquidado_a_pagar numeric(18, 2),
  raw_row jsonb not null,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.normalized_dlob_rows (
  id uuid primary key default gen_random_uuid(),
  import_batch_id uuid not null references public.import_batches(id) on delete cascade,
  source_row_number integer not null,
  year_scope public.siafe_year_scope not null,
  ordem_bancaria text,
  data_pagamento date,
  documento_liquidacao text,
  codigo_unidade_gestora text,
  nome_usuario_criou text,
  finalidade text,
  valor numeric(18, 2),
  raw_row jsonb not null,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists normalized_ne_rows_batch_idx
  on public.normalized_ne_rows (import_batch_id);

create index if not exists normalized_ne_rows_year_scope_idx
  on public.normalized_ne_rows (year_scope);

create index if not exists normalized_ne_rows_codigo_nota_empenho_idx
  on public.normalized_ne_rows (codigo_nota_empenho);

create index if not exists normalized_ne_rows_numero_processo_idx
  on public.normalized_ne_rows (numero_processo);

create index if not exists normalized_nedl_rows_batch_idx
  on public.normalized_nedl_rows (import_batch_id);

create index if not exists normalized_nedl_rows_year_scope_idx
  on public.normalized_nedl_rows (year_scope);

create index if not exists normalized_nedl_rows_codigo_nota_empenho_idx
  on public.normalized_nedl_rows (codigo_nota_empenho);

create index if not exists normalized_nedl_rows_documento_liquidacao_idx
  on public.normalized_nedl_rows (documento_liquidacao);

create index if not exists normalized_nedl_rows_numero_processo_idx
  on public.normalized_nedl_rows (numero_processo);

create index if not exists normalized_dlob_rows_batch_idx
  on public.normalized_dlob_rows (import_batch_id);

create index if not exists normalized_dlob_rows_year_scope_idx
  on public.normalized_dlob_rows (year_scope);

create index if not exists normalized_dlob_rows_documento_liquidacao_idx
  on public.normalized_dlob_rows (documento_liquidacao);

create index if not exists normalized_dlob_rows_ordem_bancaria_idx
  on public.normalized_dlob_rows (ordem_bancaria);

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

  update public.import_batches
  set
    is_active = false,
    replaced_batch_id = p_new_batch_id,
    finished_at = timezone('utc'::text, now())
  where id = any(v_previous_batch_ids);

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

  if p_report_type::text = 'NE' then
    delete from public.normalized_ne_rows
    where import_batch_id = any(v_previous_batch_ids);
  elsif p_report_type::text = 'NEDL' then
    delete from public.normalized_nedl_rows
    where import_batch_id = any(v_previous_batch_ids);
  elsif p_report_type::text = 'DLOB' then
    delete from public.normalized_dlob_rows
    where import_batch_id = any(v_previous_batch_ids);
  elsif p_report_type::text = 'NE_DL' then
    delete from public.normalized_ne_dl_rows
    where import_batch_id = any(v_previous_batch_ids);
  elsif p_report_type::text = 'DL_OB' then
    delete from public.normalized_dl_ob_rows
    where import_batch_id = any(v_previous_batch_ids);
  end if;

  return jsonb_build_object(
    'active_batch_id', p_new_batch_id,
    'deactivated_batch_ids', v_previous_batch_ids
  );
end;
$$;
