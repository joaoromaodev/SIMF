create or replace view public.vw_active_import_batches as
select
  b.id,
  b.report_type::text as report_type,
  b.year_scope::text as year_scope,
  b.original_file_name,
  b.storage_bucket,
  b.storage_path,
  b.status::text as status,
  b.processed_row_count,
  b.normalized_row_count,
  b.is_active,
  b.started_at,
  b.finished_at,
  b.created_at,
  b.updated_at
from public.import_batches b
where b.status::text = 'success'
  and (
    b.year_scope::text <> '2026'
    or b.is_active = true
  );

create or replace view public.vw_ne_active as
select
  n.id,
  n.import_batch_id,
  n.source_row_number,
  n.year_scope::text as year_scope,
  n.codigo_nota_empenho,
  n.data_empenho,
  n.nome_usuario_criou,
  n.codigo_unidade_gestora,
  n.numero_processo,
  n.valor_original,
  n.valor_corrente,
  n.saldo_a_liquidar,
  n.quantidade,
  n.raw_row,
  n.created_at,
  b.original_file_name,
  b.finished_at as import_finished_at
from public.normalized_ne_rows n
join public.vw_active_import_batches b
  on b.id = n.import_batch_id
 and b.report_type = 'NE';

create or replace view public.vw_nedl_active as
select
  n.id,
  n.import_batch_id,
  n.source_row_number,
  n.year_scope::text as year_scope,
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
  b.finished_at as import_finished_at
from public.normalized_nedl_rows n
join public.vw_active_import_batches b
  on b.id = n.import_batch_id
 and b.report_type = 'NEDL';

create or replace view public.vw_dlob_active as
select
  d.id,
  d.import_batch_id,
  d.source_row_number,
  d.year_scope::text as year_scope,
  d.ordem_bancaria,
  d.data_pagamento,
  d.documento_liquidacao,
  d.codigo_unidade_gestora,
  d.nome_usuario_criou,
  d.finalidade,
  d.valor,
  d.raw_row,
  d.created_at,
  b.original_file_name,
  b.finished_at as import_finished_at
from public.normalized_dlob_rows d
join public.vw_active_import_batches b
  on b.id = d.import_batch_id
 and b.report_type = 'DLOB';

create or replace view public.vw_execucao_financeira as
with ne_by_empenho as (
  select
    ne.year_scope,
    ne.codigo_nota_empenho,
    max(ne.numero_processo) filter (where ne.numero_processo is not null) as numero_processo,
    max(ne.data_empenho) filter (where ne.data_empenho is not null) as data_empenho,
    max(ne.codigo_unidade_gestora) filter (where ne.codigo_unidade_gestora is not null) as codigo_unidade_gestora,
    max(ne.valor_original) as valor_original,
    max(ne.valor_corrente) as valor_corrente,
    max(ne.saldo_a_liquidar) as saldo_a_liquidar
  from public.vw_ne_active ne
  where ne.codigo_nota_empenho is not null
  group by ne.year_scope, ne.codigo_nota_empenho
)
select
  nedl.year_scope,
  coalesce(ne.numero_processo, nedl.numero_processo) as numero_processo,
  ne.numero_processo as numero_processo_ne,
  nedl.numero_processo as numero_processo_nedl,
  nedl.codigo_nota_empenho,
  nedl.documento_liquidacao,
  dlob.ordem_bancaria,
  ne.data_empenho,
  nedl.data_liquidacao,
  dlob.data_pagamento,
  ne.codigo_unidade_gestora as codigo_unidade_gestora_ne,
  dlob.codigo_unidade_gestora as codigo_unidade_gestora_dlob,
  nedl.codigo_natureza_despesa,
  nedl.nome_fonte_recurso,
  nedl.codigo_fonte_recurso,
  nedl.nome_detalhamento_fr,
  nedl.codigo_detalhamento_fr,
  nedl.codigo_projeto_atividade,
  nedl.credor_nome,
  nedl.contrato,
  nedl.convenio,
  dlob.finalidade,
  ne.valor_original as valor_empenhado_original,
  ne.valor_corrente as valor_empenhado_corrente,
  ne.saldo_a_liquidar,
  nedl.valor_original as valor_liquidado_original,
  nedl.valor_liquido as valor_liquidado_liquido,
  nedl.valor_bruto as valor_liquidado_bruto,
  nedl.valor_retido,
  nedl.valor_pago as valor_pago_nedl,
  nedl.valor_liquidado_a_pagar as valor_liquidado_a_pagar_nedl,
  dlob.valor as valor_pago_ob
from public.vw_nedl_active nedl
left join ne_by_empenho ne
  on ne.year_scope = nedl.year_scope
 and ne.codigo_nota_empenho = nedl.codigo_nota_empenho
left join public.vw_dlob_active dlob
  on dlob.year_scope = nedl.year_scope
 and dlob.documento_liquidacao = nedl.documento_liquidacao;

create or replace view public.vw_liquidados_a_pagar as
with ne_by_empenho as (
  select
    ne.year_scope,
    ne.codigo_nota_empenho,
    max(ne.numero_processo) filter (where ne.numero_processo is not null) as numero_processo,
    max(ne.data_empenho) filter (where ne.data_empenho is not null) as data_empenho,
    max(ne.codigo_unidade_gestora) filter (where ne.codigo_unidade_gestora is not null) as codigo_unidade_gestora
  from public.vw_ne_active ne
  where ne.codigo_nota_empenho is not null
  group by ne.year_scope, ne.codigo_nota_empenho
),
ob_totais as (
  select
    dlob.year_scope,
    dlob.documento_liquidacao,
    sum(dlob.valor)::numeric(18, 2) as valor_ja_pago_obs
  from public.vw_dlob_active dlob
  where dlob.documento_liquidacao is not null
  group by dlob.year_scope, dlob.documento_liquidacao
)
select
  coalesce(ne.numero_processo, nedl.numero_processo) as numero_processo,
  nedl.codigo_nota_empenho,
  nedl.credor_nome as credor,
  null::text as dl_documento_credor,
  nedl.codigo_natureza_despesa,
  nedl.codigo_fonte_recurso as fonte,
  nedl.documento_liquidacao,
  nedl.data_liquidacao,
  nedl.valor_original,
  nedl.valor_liquido,
  nedl.valor_retido,
  nedl.valor_bruto,
  greatest(coalesce(nedl.valor_bruto, 0) - coalesce(ob.valor_ja_pago_obs, 0), 0)::numeric(18, 2) as valor_liquidado_a_pagar,
  coalesce(ob.valor_ja_pago_obs, 0)::numeric(18, 2) as valor_ja_pago_obs,
  coalesce(ne.codigo_unidade_gestora, null::text) as codigo_unidade_gestora,
  nedl.created_at as updated_at,
  nedl.year_scope,
  ne.data_empenho,
  nedl.nome_fonte_recurso,
  nedl.codigo_fonte_recurso,
  nedl.valor_pago as valor_pago_nedl,
  nedl.contrato,
  nedl.convenio
from public.vw_nedl_active nedl
left join ne_by_empenho ne
  on ne.year_scope = nedl.year_scope
 and ne.codigo_nota_empenho = nedl.codigo_nota_empenho
left join ob_totais ob
  on ob.year_scope = nedl.year_scope
 and ob.documento_liquidacao = nedl.documento_liquidacao
where coalesce(nedl.valor_bruto, 0) > coalesce(ob.valor_ja_pago_obs, 0);

create or replace view public.vw_pagamentos as
with nedl_by_documento as (
  select
    nedl.year_scope,
    nedl.documento_liquidacao,
    max(nedl.codigo_nota_empenho) filter (where nedl.codigo_nota_empenho is not null) as codigo_nota_empenho,
    max(nedl.numero_processo) filter (where nedl.numero_processo is not null) as numero_processo,
    max(nedl.data_liquidacao) filter (where nedl.data_liquidacao is not null) as data_liquidacao,
    max(nedl.credor_nome) filter (where nedl.credor_nome is not null) as credor_nome
  from public.vw_nedl_active nedl
  where nedl.documento_liquidacao is not null
  group by nedl.year_scope, nedl.documento_liquidacao
),
ne_by_empenho as (
  select
    ne.year_scope,
    ne.codigo_nota_empenho,
    max(ne.numero_processo) filter (where ne.numero_processo is not null) as numero_processo,
    max(ne.data_empenho) filter (where ne.data_empenho is not null) as data_empenho
  from public.vw_ne_active ne
  where ne.codigo_nota_empenho is not null
  group by ne.year_scope, ne.codigo_nota_empenho
)
select
  dlob.year_scope,
  coalesce(ne.numero_processo, nedl.numero_processo) as numero_processo,
  nedl.codigo_nota_empenho,
  dlob.documento_liquidacao,
  dlob.ordem_bancaria,
  ne.data_empenho,
  nedl.data_liquidacao,
  dlob.data_pagamento,
  nedl.credor_nome,
  dlob.codigo_unidade_gestora,
  dlob.nome_usuario_criou,
  dlob.finalidade,
  dlob.valor
from public.vw_dlob_active dlob
left join nedl_by_documento nedl
  on nedl.year_scope = dlob.year_scope
 and nedl.documento_liquidacao = dlob.documento_liquidacao
left join ne_by_empenho ne
  on ne.year_scope = nedl.year_scope
 and ne.codigo_nota_empenho = nedl.codigo_nota_empenho;

create or replace view public.vw_monitoramento_pagamentos as
select
  p.numero_processo,
  p.documento_liquidacao,
  p.ordem_bancaria,
  p.credor_nome as credor,
  null::text as ob_credor_documento,
  p.data_liquidacao,
  p.data_pagamento,
  p.valor,
  null::text as fonte,
  p.codigo_unidade_gestora,
  mp.confirmado_manualmente,
  mp.confirmado_por,
  mp.confirmado_em,
  mp.observacao,
  p.year_scope,
  p.codigo_nota_empenho,
  p.data_empenho,
  p.nome_usuario_criou,
  p.finalidade
from public.vw_pagamentos p
left join public.marcacoes_pagamento mp
  on mp.ordem_bancaria = p.ordem_bancaria;

create or replace view public.vw_status_carga_relatorios as
with expected(report_type, year_scope) as (
  values
    ('NE'::text, '2023_2024'::text),
    ('NE'::text, '2025'::text),
    ('NE'::text, '2026'::text),
    ('NEDL'::text, '2023_2024'::text),
    ('NEDL'::text, '2025'::text),
    ('NEDL'::text, '2026'::text),
    ('DLOB'::text, '2023_2024'::text),
    ('DLOB'::text, '2025'::text),
    ('DLOB'::text, '2026'::text)
),
ranked_batches as (
  select
    b.*,
    row_number() over (
      partition by b.report_type, b.year_scope
      order by coalesce(b.finished_at, b.created_at) desc, b.created_at desc
    ) as rn
  from public.vw_active_import_batches b
)
select
  e.report_type,
  e.year_scope,
  (e.year_scope || '_' || e.report_type || '.csv') as expected_file_name,
  (rb.id is not null) as has_success_batch,
  rb.id as active_batch_id,
  rb.finished_at as last_success_at,
  rb.normalized_row_count
from expected e
left join ranked_batches rb
  on rb.report_type = e.report_type
 and rb.year_scope = e.year_scope
 and rb.rn = 1;

create or replace view public.vw_nedl_sem_ne as
select
  nedl.year_scope,
  nedl.codigo_nota_empenho,
  nedl.documento_liquidacao,
  nedl.numero_processo as numero_processo_nedl,
  nedl.data_liquidacao,
  nedl.valor_bruto
from public.vw_nedl_active nedl
where nedl.codigo_nota_empenho is not null
  and not exists (
    select 1
    from public.vw_ne_active ne
    where ne.year_scope = nedl.year_scope
      and ne.codigo_nota_empenho = nedl.codigo_nota_empenho
  );

create or replace view public.vw_dlob_sem_nedl as
select
  dlob.year_scope,
  dlob.ordem_bancaria,
  dlob.documento_liquidacao,
  dlob.data_pagamento,
  dlob.valor
from public.vw_dlob_active dlob
where dlob.documento_liquidacao is not null
  and not exists (
    select 1
    from public.vw_nedl_active nedl
    where nedl.year_scope = dlob.year_scope
      and nedl.documento_liquidacao = dlob.documento_liquidacao
  );

create or replace view public.vw_divergencia_processo_ne_nedl as
select
  nedl.year_scope,
  nedl.codigo_nota_empenho,
  ne.numero_processo as numero_processo_ne,
  nedl.numero_processo as numero_processo_nedl,
  nedl.documento_liquidacao,
  nedl.data_liquidacao
from public.vw_nedl_active nedl
join public.vw_ne_active ne
  on ne.year_scope = nedl.year_scope
 and ne.codigo_nota_empenho = nedl.codigo_nota_empenho
where ne.numero_processo is not null
  and nedl.numero_processo is not null
  and ne.numero_processo <> nedl.numero_processo;
