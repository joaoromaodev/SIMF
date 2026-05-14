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
  (dl.documento_liquidacao is not null) as existe_no_legado,
  dl.numero_processo as legado_numero_processo,
  dl.codigo_nota_empenho as legado_codigo_nota_empenho,
  dl.data_liquidacao as legado_data_liquidacao,
  dl.dl_documento_credor as legado_dl_documento_credor,
  dl.dl_nome_credor as legado_dl_nome_credor,
  dl.codigo_fonte_recurso as legado_codigo_fonte_recurso,
  dl.codigo_detalhamento_fr as legado_codigo_detalhamento_fr,
  dl.codigo_unidade_gestora as legado_codigo_unidade_gestora,
  dl.valor_original as legado_valor_original,
  dl.valor_liquido as legado_valor_liquido,
  dl.valor_bruto as legado_valor_bruto,
  dl.valor_retido as legado_valor_retido,
  dl.valor_pago as legado_valor_pago,
  dl.valor_liquidado_a_pagar as legado_valor_liquidado_a_pagar,
  dl.valor_liquido_2 as legado_valor_liquido_2,
  dl.valor as legado_valor,
  dl.atributos_extras as legado_atributos_extras,
  dl.created_at as legado_created_at,
  dl.updated_at as legado_updated_at,
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
from public.vw_dlob_sem_nedl_detalhado d
left join public.documentos_liquidacao dl
  on dl.documento_liquidacao = d.documento_liquidacao;
