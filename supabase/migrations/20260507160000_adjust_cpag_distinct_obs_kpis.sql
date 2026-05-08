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
