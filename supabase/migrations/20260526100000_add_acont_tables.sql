-- Migration: 20260526100000_add_acont_tables
--
-- ACONT — Controle de Contas Bancárias SEDUC/PA
--
-- Cria as tabelas:
--   acont_contas   — cadastro mestre de contas correntes
--   acont_saldos   — saldo por conta / fonte / detalhamento
--   acont_extrato  — movimentações (sintéticas) por conta
--
-- E as views:
--   vw_acont_resumo_conta  — saldo consolidado + disponibilidade + razão por conta
--   vw_acont_kpis_banco    — totais agregados por banco

-- ── 1. acont_contas ──────────────────────────────────────────────────────────

create table if not exists public.acont_contas (
  id                    bigint  generated always as identity primary key,
  banco                 text    not null,            -- 'BB' | 'BANPARA' | 'CEF'
  codigo_banco          text    not null,            -- ex. '001' BB / '748' Sicredi etc.
  agencia               text    not null,
  numero_conta          text    not null,
  finalidade            text    not null,
  conta_contabil        text,                        -- código razão contábil
  ativo                 boolean not null default true,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  unique (banco, numero_conta)
);

comment on table public.acont_contas is
  'Cadastro mestre das contas bancárias ativas/inativas da SEDUC.';

-- ── 2. acont_saldos ──────────────────────────────────────────────────────────

create table if not exists public.acont_saldos (
  id                    bigint  generated always as identity primary key,
  conta_id              bigint  not null references public.acont_contas (id) on delete cascade,
  exercicio             text    not null default '2026',
  fonte                 text    not null,
  detalhamento          text    not null,
  -- Coluna Disponibilidade
  disponibilidade_exercicio  numeric(18,2) not null default 0,
  disponibilidade_anterior   numeric(18,2) not null default 0,
  -- Coluna Razão (conta contábil banco)
  razao_exercicio       numeric(18,2) not null default 0,
  razao_anterior        numeric(18,2) not null default 0,
  -- Aplicação financeira
  aplicacao_exercicio   numeric(18,2) not null default 0,
  aplicacao_anterior    numeric(18,2) not null default 0,
  -- Extrato Conta Corrente e Conta de Investimento (campo bruto da planilha)
  extrato_cc            numeric(18,2),
  extrato_ci            numeric(18,2),
  created_at            timestamptz not null default now()
);

comment on table public.acont_saldos is
  'Saldo mensal por conta / fonte / detalhamento (importado da planilha ACONT).';

-- ── 3. acont_extrato ─────────────────────────────────────────────────────────

create table if not exists public.acont_extrato (
  id                    bigint  generated always as identity primary key,
  conta_id              bigint  not null references public.acont_contas (id) on delete cascade,
  data_ob               date    not null,   -- data da Ordem Bancária
  data_transacao        date    not null,   -- data de crédito/débito efetivo
  tipo                  text    not null,   -- 'CREDITO' | 'DEBITO'
  tipo_despesa          text    not null,   -- Creche, Aluguel, PETE, PEAE, Diárias…
  descricao             text,
  valor                 numeric(18,2) not null,  -- positivo p/ crédito, negativo p/ débito
  created_at            timestamptz not null default now()
);

comment on table public.acont_extrato is
  'Movimentações de extrato por conta (dado sintético para entrega inicial).';

-- ── Índices ──────────────────────────────────────────────────────────────────

create index if not exists acont_contas_banco_idx
  on public.acont_contas (banco)
  where ativo = true;

create index if not exists acont_saldos_conta_id_idx
  on public.acont_saldos (conta_id);

create index if not exists acont_extrato_conta_id_data_ob_idx
  on public.acont_extrato (conta_id, data_ob desc);

-- ── 4. vw_acont_resumo_conta ─────────────────────────────────────────────────

create or replace view public.vw_acont_resumo_conta as
select
  c.id,
  c.banco,
  c.agencia,
  c.numero_conta,
  c.finalidade,
  c.conta_contabil,
  c.ativo,

  -- Disponibilidade = soma dos dois exercícios
  coalesce(sum(s.disponibilidade_exercicio + s.disponibilidade_anterior), 0) as saldo_disponibilidade,

  -- Razão = soma dos dois exercícios
  coalesce(sum(s.razao_exercicio + s.razao_anterior), 0) as saldo_razao,

  -- Extrato CC (de referência: last row não-null para mesma conta)
  (
    select s2.extrato_cc
    from   public.acont_saldos s2
    where  s2.conta_id = c.id
      and  s2.extrato_cc is not null
    order  by s2.id desc
    limit  1
  ) as saldo_extrato_cc,

  -- Saldo total conforme planilha (disp_ex + disp_ant)
  coalesce(sum(s.disponibilidade_exercicio + s.disponibilidade_anterior), 0) as saldo_total,

  count(distinct s.fonte) as qtd_fontes

from public.acont_contas c
left join public.acont_saldos s on s.conta_id = c.id
group by c.id, c.banco, c.agencia, c.numero_conta, c.finalidade, c.conta_contabil, c.ativo;

comment on view public.vw_acont_resumo_conta is
  'Resumo consolidado de saldos por conta bancária.';

-- ── 5. vw_acont_kpis_banco ───────────────────────────────────────────────────

create or replace view public.vw_acont_kpis_banco as
select
  c.banco,
  count(distinct c.id)                                         as qtd_contas,
  coalesce(sum(s.disponibilidade_exercicio + s.disponibilidade_anterior), 0) as total_disponibilidade,
  coalesce(sum(s.razao_exercicio + s.razao_anterior), 0)       as total_razao
from public.acont_contas c
left join public.acont_saldos s on s.conta_id = c.id
where c.ativo = true
group by c.banco
order by c.banco;

comment on view public.vw_acont_kpis_banco is
  'Totais agregados de saldo por banco (apenas contas ativas).';
