create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'siafe_report_type') then
    create type public.siafe_report_type as enum ('NE_DL', 'DL_OB');
  end if;

  if not exists (select 1 from pg_type where typname = 'siafe_year_scope') then
    create type public.siafe_year_scope as enum ('2023_2024', '2025', '2026');
  end if;

  if not exists (select 1 from pg_type where typname = 'siafe_import_status') then
    create type public.siafe_import_status as enum ('processing', 'success', 'failed');
  end if;
end
$$;

create table if not exists public.import_batches (
  id uuid primary key default gen_random_uuid(),
  report_type public.siafe_report_type not null,
  year_scope public.siafe_year_scope not null,
  original_file_name text not null,
  storage_bucket text,
  storage_path text,
  status public.siafe_import_status not null default 'processing',
  validation_errors jsonb not null default '[]'::jsonb,
  source_headers jsonb not null default '[]'::jsonb,
  processed_row_count integer not null default 0,
  normalized_row_count integer not null default 0,
  is_active boolean not null default false,
  replaced_batch_id uuid references public.import_batches(id),
  started_at timestamptz not null default timezone('utc'::text, now()),
  finished_at timestamptz,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.normalized_ne_dl_rows (
  id uuid primary key default gen_random_uuid(),
  import_batch_id uuid not null references public.import_batches(id) on delete cascade,
  source_row_number integer not null,
  year_scope public.siafe_year_scope not null,
  numero_processo text,
  codigo_nota_empenho text,
  documento_liquidacao text,
  codigo_plano_interno text,
  codigo_projeto_atividade text,
  codigo_natureza_despesa text,
  codigo_fonte_recurso text,
  codigo_detalhamento_fr text,
  codigo_unidade_gestora text,
  valor_original numeric(18, 2),
  valor_liquido numeric(18, 2),
  valor_bruto numeric(18, 2),
  valor_retido numeric(18, 2),
  valor_pago numeric(18, 2),
  valor_liquidado_a_pagar numeric(18, 2),
  valor_liquido_2 numeric(18, 2),
  raw_row jsonb not null,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.normalized_dl_ob_rows (
  id uuid primary key default gen_random_uuid(),
  import_batch_id uuid not null references public.import_batches(id) on delete cascade,
  source_row_number integer not null,
  year_scope public.siafe_year_scope not null,
  numero_processo text,
  documento_liquidacao text,
  ordem_bancaria text,
  ob_credor_documento text,
  ob_credor_nome text,
  dl_documento_credor text,
  dl_nome_credor text,
  data_pagamento date,
  codigo_fonte_recurso text,
  codigo_detalhamento_fr text,
  codigo_unidade_gestora text,
  valor numeric(18, 2),
  raw_row jsonb not null,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists import_batches_report_scope_idx
  on public.import_batches (report_type, year_scope);

create unique index if not exists import_batches_single_active_scope_idx
  on public.import_batches (report_type, year_scope)
  where is_active = true and status = 'success';

create index if not exists normalized_ne_dl_rows_batch_idx
  on public.normalized_ne_dl_rows (import_batch_id);

create index if not exists normalized_ne_dl_rows_documento_idx
  on public.normalized_ne_dl_rows (documento_liquidacao);

create index if not exists normalized_dl_ob_rows_batch_idx
  on public.normalized_dl_ob_rows (import_batch_id);

create index if not exists normalized_dl_ob_rows_documento_idx
  on public.normalized_dl_ob_rows (documento_liquidacao);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

drop trigger if exists set_import_batches_updated_at on public.import_batches;

create trigger set_import_batches_updated_at
before update on public.import_batches
for each row
execute function public.set_updated_at();

insert into storage.buckets (id, name, public)
values ('siafe-imports', 'siafe-imports', false)
on conflict (id) do nothing;
