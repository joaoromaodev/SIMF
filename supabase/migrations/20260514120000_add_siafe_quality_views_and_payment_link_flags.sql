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
    and btrim(dlob.documento_liquidacao) <> ''
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
where nedl.documento_liquidacao is not null
  and btrim(nedl.documento_liquidacao) <> ''
  and coalesce(nedl.valor_bruto, 0) > coalesce(ob.valor_ja_pago_obs, 0);

create or replace view public.vw_nedl_sem_documento_liquidacao as
select
  nedl.year_scope,
  nedl.source_row_number,
  nedl.codigo_nota_empenho,
  nedl.numero_processo,
  nedl.data_liquidacao,
  nedl.credor_nome,
  nedl.valor_bruto,
  nedl.valor_liquidado_a_pagar,
  nedl.raw_row,
  case
    when coalesce(nedl.valor_bruto, 0) > 0
      or coalesce(nedl.valor_liquidado_a_pagar, 0) > 0
      then 'COM_VALOR_FINANCEIRO'::text
    else 'SEM_VALOR_FINANCEIRO'::text
  end as classificacao
from public.vw_nedl_active nedl
where nedl.documento_liquidacao is null
   or btrim(nedl.documento_liquidacao) = '';

create or replace view public.vw_dlob_sem_nedl_detalhado as
select
  dlob.year_scope,
  dlob.source_row_number,
  dlob.ordem_bancaria,
  dlob.documento_liquidacao,
  dlob.data_pagamento,
  dlob.valor,
  dlob.finalidade,
  dlob.codigo_unidade_gestora,
  dlob.raw_row
from public.vw_dlob_active dlob
where not exists (
  select 1
  from public.vw_nedl_active nedl
  where nedl.year_scope = dlob.year_scope
    and nedl.documento_liquidacao is not null
    and btrim(nedl.documento_liquidacao) <> ''
    and nedl.documento_liquidacao = dlob.documento_liquidacao
);

create or replace view public.vw_nedl_documento_duplicado as
select
  nedl.year_scope,
  nedl.documento_liquidacao,
  count(*)::bigint as quantidade_linhas,
  array_agg(nedl.source_row_number order by nedl.source_row_number) as source_row_numbers,
  array_agg(distinct nedl.numero_processo) filter (where nedl.numero_processo is not null) as numeros_processo,
  array_agg(distinct nedl.credor_nome) filter (where nedl.credor_nome is not null) as credores,
  array_agg(distinct nedl.nome_fonte_recurso) filter (where nedl.nome_fonte_recurso is not null) as nomes_fonte_recurso,
  array_agg(distinct nedl.codigo_fonte_recurso) filter (where nedl.codigo_fonte_recurso is not null) as codigos_fonte_recurso,
  array_agg(distinct nedl.data_liquidacao) filter (where nedl.data_liquidacao is not null) as datas_liquidacao,
  array_agg(distinct nedl.codigo_nota_empenho) filter (where nedl.codigo_nota_empenho is not null) as codigos_nota_empenho,
  array_agg(distinct nedl.valor_bruto) filter (where nedl.valor_bruto is not null) as valores_bruto,
  array_agg(distinct nedl.valor_liquidado_a_pagar) filter (where nedl.valor_liquidado_a_pagar is not null) as valores_liquidado_a_pagar
from public.vw_nedl_active nedl
where nedl.documento_liquidacao is not null
  and btrim(nedl.documento_liquidacao) <> ''
group by nedl.year_scope, nedl.documento_liquidacao
having count(*) > 1;

create or replace view public.vw_nedl_documento_duplicado_com_divergencia as
with duplicados as (
  select
    nedl.year_scope,
    nedl.documento_liquidacao,
    count(*)::bigint as quantidade_linhas,
    array_agg(nedl.source_row_number order by nedl.source_row_number) as source_row_numbers,
    array_agg(distinct nedl.numero_processo) filter (where nedl.numero_processo is not null) as numeros_processo,
    array_agg(distinct nedl.credor_nome) filter (where nedl.credor_nome is not null) as credores,
    array_agg(distinct nedl.nome_fonte_recurso) filter (where nedl.nome_fonte_recurso is not null) as nomes_fonte_recurso,
    array_agg(distinct nedl.codigo_fonte_recurso) filter (where nedl.codigo_fonte_recurso is not null) as codigos_fonte_recurso,
    array_agg(distinct nedl.data_liquidacao) filter (where nedl.data_liquidacao is not null) as datas_liquidacao,
    array_agg(distinct nedl.codigo_nota_empenho) filter (where nedl.codigo_nota_empenho is not null) as codigos_nota_empenho,
    array_agg(distinct nedl.valor_bruto) filter (where nedl.valor_bruto is not null) as valores_bruto,
    array_agg(distinct nedl.valor_liquidado_a_pagar) filter (where nedl.valor_liquidado_a_pagar is not null) as valores_liquidado_a_pagar,
    count(distinct coalesce(nedl.numero_processo, '__NULL__')) > 1 as diverge_numero_processo,
    count(distinct coalesce(nedl.credor_nome, '__NULL__')) > 1 as diverge_credor_nome,
    count(distinct coalesce(nedl.nome_fonte_recurso, '__NULL__')) > 1 as diverge_nome_fonte_recurso,
    count(distinct coalesce(nedl.codigo_fonte_recurso, '__NULL__')) > 1 as diverge_codigo_fonte_recurso,
    count(distinct coalesce(nedl.data_liquidacao::text, '__NULL__')) > 1 as diverge_data_liquidacao,
    count(distinct coalesce(nedl.codigo_nota_empenho, '__NULL__')) > 1 as diverge_codigo_nota_empenho,
    count(distinct coalesce(nedl.valor_bruto::text, '__NULL__')) > 1 as diverge_valor_bruto,
    count(distinct coalesce(nedl.valor_liquidado_a_pagar::text, '__NULL__')) > 1 as diverge_valor_liquidado_a_pagar
  from public.vw_nedl_active nedl
  where nedl.documento_liquidacao is not null
    and btrim(nedl.documento_liquidacao) <> ''
  group by nedl.year_scope, nedl.documento_liquidacao
  having count(*) > 1
)
select *
from duplicados
where diverge_numero_processo
   or diverge_credor_nome
   or diverge_nome_fonte_recurso
   or diverge_codigo_fonte_recurso
   or diverge_data_liquidacao
   or diverge_codigo_nota_empenho
   or diverge_valor_bruto
   or diverge_valor_liquidado_a_pagar;

create or replace view public.vw_pagamentos as
with nedl_by_documento as (
  select
    n.year_scope,
    n.documento_liquidacao,
    max(n.numero_processo) filter (where n.numero_processo is not null) as numero_processo,
    max(n.codigo_nota_empenho) filter (where n.codigo_nota_empenho is not null) as codigo_nota_empenho,
    max(n.data_liquidacao) filter (where n.data_liquidacao is not null) as data_liquidacao,
    max(n.credor_nome) filter (where n.credor_nome is not null) as credor_nome,
    max(n.codigo_fonte_recurso) filter (where n.codigo_fonte_recurso is not null) as codigo_fonte_recurso,
    max(n.nome_fonte_recurso) filter (where n.nome_fonte_recurso is not null) as nome_fonte_recurso
  from public.vw_nedl_active n
  where n.documento_liquidacao is not null
    and btrim(n.documento_liquidacao) <> ''
  group by n.year_scope, n.documento_liquidacao
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
  d.year_scope,
  coalesce(n.numero_processo, ne.numero_processo) as numero_processo,
  n.codigo_nota_empenho,
  d.documento_liquidacao,
  d.ordem_bancaria,
  ne.data_empenho,
  n.data_liquidacao,
  d.data_pagamento,
  n.credor_nome,
  d.codigo_unidade_gestora,
  d.nome_usuario_criou,
  d.finalidade,
  d.valor,
  n.credor_nome as credor,
  coalesce(nullif(btrim(n.nome_fonte_recurso), ''), nullif(btrim(n.codigo_fonte_recurso), '')) as fonte,
  n.codigo_fonte_recurso,
  n.nome_fonte_recurso
from public.vw_dlob_active d
left join nedl_by_documento n
  on n.year_scope = d.year_scope
 and n.documento_liquidacao = d.documento_liquidacao
left join ne_by_empenho ne
  on ne.year_scope = n.year_scope
 and ne.codigo_nota_empenho = n.codigo_nota_empenho;

create or replace view public.vw_monitoramento_pagamentos as
with pagamentos_com_vinculo as (
  select
    p.*,
    exists (
      select 1
      from public.vw_nedl_active n
      where n.year_scope = p.year_scope
        and n.documento_liquidacao is not null
        and btrim(n.documento_liquidacao) <> ''
        and n.documento_liquidacao = p.documento_liquidacao
    ) as tem_vinculo_nedl
  from public.vw_pagamentos p
)
select
  p.numero_processo,
  p.documento_liquidacao,
  p.ordem_bancaria,
  p.credor,
  null::text as ob_credor_documento,
  p.data_liquidacao,
  p.data_pagamento,
  p.valor,
  p.fonte,
  p.codigo_unidade_gestora,
  mp.confirmado_manualmente,
  mp.confirmado_por,
  mp.confirmado_em,
  mp.observacao,
  p.year_scope,
  p.codigo_nota_empenho,
  p.data_empenho,
  p.nome_usuario_criou,
  p.finalidade,
  p.tem_vinculo_nedl,
  case
    when p.documento_liquidacao is null
      or btrim(p.documento_liquidacao) = ''
      then 'OB sem DL informada'::text
    when p.tem_vinculo_nedl is false
      then 'DL não localizada no NEDL'::text
    else null::text
  end as motivo_sem_vinculo
from pagamentos_com_vinculo p
left join public.marcacoes_pagamento mp
  on mp.ordem_bancaria = p.ordem_bancaria;

create or replace view public.vw_cpag_kpis as
with monitoramento as (
  select
    coalesce(sum(valor) filter (where confirmado_manualmente is true), 0)::numeric(18, 2) as total_pago_confirmado,
    count(distinct btrim(ordem_bancaria)) filter (
      where ordem_bancaria is not null
        and btrim(ordem_bancaria) <> ''
    )::bigint as quantidade_obs_emitidas,
    count(distinct btrim(ordem_bancaria)) filter (
      where ordem_bancaria is not null
        and btrim(ordem_bancaria) <> ''
        and confirmado_manualmente is true
    )::bigint as quantidade_obs_confirmadas
  from public.vw_monitoramento_pagamentos
),
liquidados as (
  select
    coalesce(sum(valor_liquidado_a_pagar), 0)::numeric(18, 2) as total_a_pagar,
    count(*)::bigint as quantidade_dls_com_saldo
  from public.vw_liquidados_a_pagar
)
select
  m.total_pago_confirmado,
  l.total_a_pagar,
  m.quantidade_obs_emitidas,
  m.quantidade_obs_confirmadas,
  (m.quantidade_obs_emitidas - m.quantidade_obs_confirmadas)::bigint as quantidade_obs_pendentes,
  l.quantidade_dls_com_saldo
from monitoramento m
cross join liquidados l;

create or replace view public.vw_cliq_kpis as
select
  coalesce(sum(valor_bruto), 0)::numeric(18, 2) as total_em_liquidacao,
  count(*)::bigint as quantidade_em_liquidacao,
  count(*)::bigint as quantidade_liquidados_a_pagar
from public.vw_liquidados_a_pagar;

create or replace view public.vw_cliq_por_fonte as
select
  coalesce(nullif(trim(fonte), ''), 'Sem fonte') as fonte,
  coalesce(sum(valor_bruto), 0)::numeric(18, 2) as total_valor_bruto,
  count(*)::bigint as quantidade
from public.vw_liquidados_a_pagar
group by coalesce(nullif(trim(fonte), ''), 'Sem fonte');

create or replace view public.vw_cliq_status as
select
  'Em Liquidação'::text as status,
  0::bigint as quantidade
union all
select
  'Liquidados a Pagar'::text as status,
  count(*)::bigint as quantidade
from public.vw_liquidados_a_pagar;
