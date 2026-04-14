-- Migration: Add atributos_extras JSONB to canonical tables
--
-- Estratégia de extensibilidade sem migration de schema:
-- Qualquer campo novo que aparecer num CSV futuro e não corresponder
-- a uma coluna canônica fixa é armazenado aqui pelo normalize.js.
-- Ex: "OperadorOB", "CodigoNaturezaDespesa", "DescricaoObjeto", etc.
--
-- O índice GIN viabiliza queries como:
--   WHERE atributos_extras @> '{"CodigoNaturezaDespesa": "33903700"}'
-- sem precisar de ALTER TABLE ou nova migration.

alter table public.notas_empenho
  add column if not exists atributos_extras jsonb not null default '{}'::jsonb;

alter table public.documentos_liquidacao
  add column if not exists atributos_extras jsonb not null default '{}'::jsonb;

alter table public.ordens_bancarias
  add column if not exists atributos_extras jsonb not null default '{}'::jsonb;

create index if not exists notas_empenho_atributos_extras_gin_idx
  on public.notas_empenho using gin (atributos_extras);

create index if not exists documentos_liquidacao_atributos_extras_gin_idx
  on public.documentos_liquidacao using gin (atributos_extras);

create index if not exists ordens_bancarias_atributos_extras_gin_idx
  on public.ordens_bancarias using gin (atributos_extras);
