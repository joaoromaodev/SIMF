create or replace view public.vw_cpag_kpis as
with monitoramento as (
  select
    coalesce(sum(valor) filter (where confirmado_manualmente is true), 0)::numeric(18, 2) as total_pago_confirmado,
    count(*)::bigint as quantidade_obs_emitidas,
    count(*) filter (where confirmado_manualmente is true)::bigint as quantidade_obs_confirmadas
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
