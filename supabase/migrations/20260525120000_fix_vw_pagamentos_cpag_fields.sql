-- Migration: 20260525120000_fix_vw_pagamentos_cpag_fields
--
-- Problema: vw_monitoramento_pagamentos não expõe contrato_convenio, descricao
-- nem documento_credor, mas cpag/page.js e monitoramento-ob-table.jsx consultam
-- esses campos, causando erro de query e aba "Monitoramento OB" vazia.
--
-- Solução:
-- 1. Recriar vw_pagamentos adicionando contrato_convenio derivado de NEDL
--    (coalesce contrato / convenio) ao final da lista de colunas.
-- 2. Recriar vw_monitoramento_pagamentos adicionando contrato_convenio,
--    descricao (alias de finalidade) e documento_credor (null por ora)
--    ao final da lista de colunas — regra CREATE OR REPLACE requer append.

-- ── 1. vw_pagamentos ─────────────────────────────────────────────────────────
create or replace view public.vw_pagamentos as
with nedl_by_documento as (
  select
    n.year_scope,
    n.documento_liquidacao,
    max(n.numero_processo)      filter (where n.numero_processo      is not null)                       as numero_processo,
    max(n.codigo_nota_empenho)  filter (where n.codigo_nota_empenho  is not null)                       as codigo_nota_empenho,
    max(n.data_liquidacao)      filter (where n.data_liquidacao       is not null)                       as data_liquidacao,
    max(n.credor_nome)          filter (where n.credor_nome           is not null)                       as credor_nome,
    max(n.codigo_fonte_recurso) filter (where n.codigo_fonte_recurso  is not null)                       as codigo_fonte_recurso,
    max(n.nome_fonte_recurso)   filter (where n.nome_fonte_recurso    is not null)                       as nome_fonte_recurso,
    max(n.contrato)             filter (where n.contrato is not null and btrim(n.contrato) <> '')        as contrato,
    max(n.convenio)             filter (where n.convenio is not null and btrim(n.convenio) <> '')        as convenio
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
    max(ne.data_empenho)    filter (where ne.data_empenho    is not null) as data_empenho
  from public.vw_ne_active ne
  where ne.codigo_nota_empenho is not null
  group by ne.year_scope, ne.codigo_nota_empenho
)
select
  d.year_scope,
  coalesce(n.numero_processo, ne.numero_processo)                                      as numero_processo,
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
  n.credor_nome                                                                         as credor,
  coalesce(nullif(btrim(n.nome_fonte_recurso), ''), nullif(btrim(n.codigo_fonte_recurso), '')) as fonte,
  n.codigo_fonte_recurso,
  n.nome_fonte_recurso,
  -- Novo: contrato_convenio derivado do NEDL (contrato preferencial, convenio como fallback)
  coalesce(nullif(btrim(n.contrato), ''), nullif(btrim(n.convenio), ''))               as contrato_convenio
from public.vw_dlob_active d
left join nedl_by_documento n
  on n.year_scope        = d.year_scope
 and n.documento_liquidacao = d.documento_liquidacao
left join ne_by_empenho ne
  on ne.year_scope           = n.year_scope
 and ne.codigo_nota_empenho  = n.codigo_nota_empenho;

-- ── 2. vw_monitoramento_pagamentos ───────────────────────────────────────────
-- Adicionamos contrato_convenio, descricao e documento_credor ao final
-- para respeitar a regra CREATE OR REPLACE (só append de colunas).
create or replace view public.vw_monitoramento_pagamentos as
with pagamentos_com_vinculo as (
  select
    p.*,
    exists (
      select 1
      from public.vw_nedl_active n
      where n.year_scope              = p.year_scope
        and n.documento_liquidacao    is not null
        and btrim(n.documento_liquidacao) <> ''
        and n.documento_liquidacao    = p.documento_liquidacao
    ) as tem_vinculo_nedl
  from public.vw_pagamentos p
)
select
  p.numero_processo,
  p.documento_liquidacao,
  p.ordem_bancaria,
  p.credor,
  null::text                 as ob_credor_documento,
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
  end                        as motivo_sem_vinculo,
  -- Novos campos exigidos por cpag/page.js e monitoramento-ob-table.jsx
  p.contrato_convenio,
  p.finalidade               as descricao,
  null::text                 as documento_credor
from pagamentos_com_vinculo p
left join public.marcacoes_pagamento mp
  on mp.ordem_bancaria = p.ordem_bancaria;
