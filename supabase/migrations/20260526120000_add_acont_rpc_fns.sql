-- Migration: 20260526120000_add_acont_rpc_fns
--
-- Funções RPC para o módulo ACONT com suporte a filtro de exercício.

-- ── fn_acont_kpis_banco ───────────────────────────────────────────────────────
-- KPIs por banco filtrados por exercício.

create or replace function public.fn_acont_kpis_banco(p_exercicio text default '2026')
returns table(
  banco                 text,
  qtd_contas            bigint,
  qtd_contas_ativas     bigint,
  total_disponibilidade numeric,
  total_razao           numeric
)
language sql stable
as $$
  select
    c.banco,
    count(distinct c.id),
    count(distinct c.id) filter (where c.ativo = true),
    coalesce(sum(
      case when c.ativo = true
        then s.disponibilidade_exercicio + s.disponibilidade_anterior
        else 0
      end
    ), 0),
    coalesce(sum(
      case when c.ativo = true
        then s.razao_exercicio + s.razao_anterior
        else 0
      end
    ), 0)
  from public.acont_contas c
  left join public.acont_saldos s
    on s.conta_id = c.id and s.exercicio = p_exercicio
  group by c.banco
  order by c.banco;
$$;

-- ── fn_acont_resumo_banco ─────────────────────────────────────────────────────
-- Resumo de todas as contas de um banco filtrado por exercício.
-- Usado para a listagem de contas com saldos corretos do ano selecionado.

create or replace function public.fn_acont_resumo_banco(
  p_banco     text,
  p_exercicio text default '2026'
)
returns table(
  id                    bigint,
  banco                 text,
  agencia               text,
  numero_conta          text,
  finalidade            text,
  conta_contabil        text,
  ativo                 boolean,
  saldo_disponibilidade numeric,
  saldo_razao           numeric,
  saldo_extrato_cc      numeric,
  saldo_total           numeric,
  qtd_fontes            bigint
)
language sql stable
as $$
  select
    c.id,
    c.banco,
    c.agencia,
    c.numero_conta,
    c.finalidade,
    c.conta_contabil,
    c.ativo,
    coalesce(sum(s.disponibilidade_exercicio + s.disponibilidade_anterior), 0),
    coalesce(sum(s.razao_exercicio           + s.razao_anterior),           0),
    (
      select s2.extrato_cc
      from   public.acont_saldos s2
      where  s2.conta_id   = c.id
        and  s2.exercicio  = p_exercicio
        and  s2.extrato_cc is not null
      order  by s2.id desc
      limit  1
    ),
    coalesce(sum(s.disponibilidade_exercicio + s.disponibilidade_anterior), 0),
    count(distinct s.fonte)
  from public.acont_contas c
  left join public.acont_saldos s
    on s.conta_id = c.id and s.exercicio = p_exercicio
  where c.banco = p_banco
  group by c.id, c.banco, c.agencia, c.numero_conta, c.finalidade, c.conta_contabil, c.ativo
  order by c.ativo desc, c.numero_conta;
$$;

-- ── fn_acont_posicao_saldos ───────────────────────────────────────────────────
-- Posição geral de saldos — todas as contas de todos os bancos — para o relatório.

create or replace function public.fn_acont_posicao_saldos(p_exercicio text default '2026')
returns table(
  id                    bigint,
  banco                 text,
  agencia               text,
  numero_conta          text,
  finalidade            text,
  ativo                 boolean,
  saldo_disponibilidade numeric,
  saldo_razao           numeric,
  saldo_extrato_cc      numeric
)
language sql stable
as $$
  select
    c.id,
    c.banco,
    c.agencia,
    c.numero_conta,
    c.finalidade,
    c.ativo,
    coalesce(sum(s.disponibilidade_exercicio + s.disponibilidade_anterior), 0),
    coalesce(sum(s.razao_exercicio           + s.razao_anterior),           0),
    (
      select s2.extrato_cc
      from   public.acont_saldos s2
      where  s2.conta_id  = c.id
        and  s2.exercicio = p_exercicio
        and  s2.extrato_cc is not null
      order  by s2.id desc
      limit  1
    )
  from public.acont_contas c
  left join public.acont_saldos s
    on s.conta_id = c.id and s.exercicio = p_exercicio
  group by c.id, c.banco, c.agencia, c.numero_conta, c.finalidade, c.ativo
  order by c.banco, c.ativo desc, c.numero_conta;
$$;

-- ── fn_acont_consolidado_fonte ────────────────────────────────────────────────
-- Saldo consolidado por fonte de recurso.

create or replace function public.fn_acont_consolidado_fonte(
  p_exercicio text default '2026',
  p_banco     text default null
)
returns table(
  fonte                 text,
  banco                 text,
  qtd_contas            bigint,
  total_disponibilidade numeric,
  total_razao           numeric
)
language sql stable
as $$
  select
    s.fonte,
    c.banco,
    count(distinct c.id),
    coalesce(sum(s.disponibilidade_exercicio + s.disponibilidade_anterior), 0),
    coalesce(sum(s.razao_exercicio           + s.razao_anterior),           0)
  from public.acont_saldos s
  join public.acont_contas c on c.id = s.conta_id
  where s.exercicio = p_exercicio
    and c.ativo     = true
    and (p_banco is null or c.banco = p_banco)
  group by s.fonte, c.banco
  order by c.banco, s.fonte;
$$;
