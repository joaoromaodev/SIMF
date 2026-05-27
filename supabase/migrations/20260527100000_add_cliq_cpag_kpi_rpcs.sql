-- Migration: 20260527100000_add_cliq_cpag_kpi_rpcs
--
-- RPCs para KPIs de CLIQ e CPAG filtrados por ano de exercício.
-- Resolve o bug crítico onde os KPIs sempre exibiam totais globais
-- ignorando o ano selecionado no seletor.

-- ── fn_cliq_kpis ─────────────────────────────────────────────────────────────

create or replace function public.fn_cliq_kpis(p_year_scope text default '2026')
returns table(
  total_em_liquidacao           numeric,
  quantidade_em_liquidacao      bigint,
  quantidade_liquidados_a_pagar bigint
)
language sql stable as $$
  select
    coalesce(sum(valor_bruto), 0)::numeric(18,2),
    count(*)::bigint,
    count(*)::bigint
  from public.vw_liquidados_a_pagar
  where year_scope = p_year_scope;
$$;

-- ── fn_cliq_por_fonte ────────────────────────────────────────────────────────

create or replace function public.fn_cliq_por_fonte(p_year_scope text default '2026')
returns table(
  fonte             text,
  total_valor_bruto numeric,
  quantidade        bigint
)
language sql stable as $$
  select
    coalesce(nullif(trim(fonte), ''), 'Sem fonte') as fonte,
    coalesce(sum(valor_bruto), 0)::numeric(18,2),
    count(*)::bigint
  from public.vw_liquidados_a_pagar
  where year_scope = p_year_scope
  group by coalesce(nullif(trim(fonte), ''), 'Sem fonte')
  order by 2 desc;
$$;

-- ── fn_cpag_kpis ─────────────────────────────────────────────────────────────
-- Usa `p_year_scope` para filtrar vw_liquidados_a_pagar (campo year_scope)
-- e `p_ano` para filtrar vw_monitoramento_pagamentos por data_pagamento.

create or replace function public.fn_cpag_kpis(
  p_year_scope text default '2026',
  p_ano        text default '2026'
)
returns table(
  total_pago_confirmado      numeric,
  total_a_pagar              numeric,
  quantidade_obs_emitidas    bigint,
  quantidade_obs_confirmadas bigint,
  quantidade_obs_pendentes   bigint,
  quantidade_dls_com_saldo   bigint
)
language sql stable as $$
  with monitoramento as (
    select
      coalesce(sum(valor) filter (where confirmado_manualmente is true), 0)::numeric(18,2) as total_pago_confirmado,
      count(distinct btrim(ordem_bancaria)) filter (
        where ordem_bancaria is not null and btrim(ordem_bancaria) <> ''
      )::bigint as quantidade_obs_emitidas,
      count(distinct btrim(ordem_bancaria)) filter (
        where ordem_bancaria is not null
          and btrim(ordem_bancaria) <> ''
          and confirmado_manualmente is true
      )::bigint as quantidade_obs_confirmadas
    from public.vw_monitoramento_pagamentos
    where data_pagamento >= (p_ano || '-01-01')::date
      and data_pagamento <= (p_ano || '-12-31')::date
  ),
  liquidados as (
    select
      coalesce(sum(valor_liquidado_a_pagar), 0)::numeric(18,2) as total_a_pagar,
      count(*)::bigint as quantidade_dls_com_saldo
    from public.vw_liquidados_a_pagar
    where year_scope = p_year_scope
  )
  select
    m.total_pago_confirmado,
    l.total_a_pagar,
    m.quantidade_obs_emitidas,
    m.quantidade_obs_confirmadas,
    (m.quantidade_obs_emitidas - m.quantidade_obs_confirmadas)::bigint,
    l.quantidade_dls_com_saldo
  from monitoramento m
  cross join liquidados l;
$$;
