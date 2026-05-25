-- Migration: 20260525130000_add_nedl_unidade_gestora_usuario
--
-- O relatório NEDL exportado pelo SIAFE inclui duas colunas ausentes no
-- contrato original: InstituicaoCodigoUnidadeGestora e NomeUsuarioQueCriou.
-- Estas colunas já existem em NE e DLOB — aqui passam a ser capturadas
-- também no NEDL para enriquecer cruzamentos e evitar joins com NE.

-- ── 1. Adicionar colunas à tabela normalizada ─────────────────────────────────
alter table public.normalized_nedl_rows
  add column if not exists codigo_unidade_gestora text,
  add column if not exists nome_usuario_criou      text;

-- ── 2. Recriar vw_nedl_active expondo as novas colunas ───────────────────────
--    As colunas novas devem vir ao final (regra CREATE OR REPLACE VIEW).
create or replace view public.vw_nedl_active as
select
  n.id,
  n.import_batch_id,
  n.source_row_number,
  n.year_scope::text          as year_scope,
  n.documento_liquidacao,
  n.data_liquidacao,
  n.codigo_nota_empenho,
  n.codigo_natureza_despesa,
  n.nome_fonte_recurso,
  n.codigo_fonte_recurso,
  n.nome_detalhamento_fr,
  n.codigo_detalhamento_fr,
  n.numero_processo,
  n.codigo_projeto_atividade,
  n.credor_nome,
  n.contrato,
  n.convenio,
  n.valor_original,
  n.valor_liquido,
  n.valor_bruto,
  n.valor_retido,
  n.valor_pago,
  n.valor_liquidado_a_pagar,
  n.raw_row,
  n.created_at,
  b.original_file_name,
  b.finished_at               as import_finished_at,
  n.codigo_unidade_gestora,
  n.nome_usuario_criou
from public.normalized_nedl_rows n
join public.vw_active_import_batches b
  on b.id          = n.import_batch_id
 and b.report_type = 'NEDL';
