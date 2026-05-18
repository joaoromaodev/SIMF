-- Reescreve vw_dlob_sem_nedl_diagnostico eliminando o LEFT JOIN na tabela
-- legada documentos_liquidacao. A view agora é construída integralmente sobre
-- vw_dlob_sem_nedl_detalhado (que já usa apenas normalized_dlob_rows) e mantém
-- a mesma lógica de classificacao_operacional com regex aprimorado.

create or replace view public.vw_dlob_sem_nedl_diagnostico as
select
  d.year_scope,
  d.source_row_number,
  d.ordem_bancaria,
  d.documento_liquidacao,
  d.data_pagamento,
  d.valor,
  d.finalidade,
  d.codigo_unidade_gestora,
  d.raw_row,
  case
    when coalesce(d.finalidade, '') ~* '(FOLHA|FOPAG|PESSOAL)'
      then 'FOLHA'::text
    when coalesce(d.finalidade, '') ~* '(RETEN|RETENÇÃO|INSS|IRRF|ISS|(^|[^[:alnum:]])IR([^[:alnum:]]|$))'
      then 'RETENCAO'::text
    when coalesce(d.finalidade, '') ~* '(RAP|RESTOS A PAGAR|RESTO A PAGAR)'
      then 'RESTOS_A_PAGAR'::text
    when coalesce(d.finalidade, '') ~* '(DAR|TRIBUTO|IMPOSTO)'
      then 'TRIBUTOS'::text
    else 'OUTRO'::text
  end as classificacao_operacional
from public.vw_dlob_sem_nedl_detalhado d;

comment on view public.vw_dlob_sem_nedl_diagnostico is
  'OBs sem NEDL correspondente, com classificação operacional. '
  'Fonte única: normalized_dlob_rows via vw_dlob_sem_nedl_detalhado. '
  'Sem dependência de tabelas legadas.';
