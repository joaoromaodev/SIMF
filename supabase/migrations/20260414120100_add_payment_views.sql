-- Migration: Add vw_liquidados_a_pagar and vw_monitoramento_pagamentos views

-- View: DLs sem OB correspondente (liquidados a pagar)
-- Consome apenas tabelas canônicas. codigo_natureza_despesa ainda não existe
-- em documentos_liquidacao — retorna NULL até ser promovido a campo canônico.
create or replace view public.vw_liquidados_a_pagar as
select
  dl.numero_processo,
  dl.codigo_nota_empenho,
  dl.documento_liquidacao,
  dl.dl_nome_credor as credor,
  dl.dl_documento_credor,
  dl.codigo_fonte_recurso as fonte,
  null::text as codigo_natureza_despesa,
  dl.valor_liquidado_a_pagar,
  dl.valor_bruto,
  dl.valor_liquido,
  dl.updated_at
from public.documentos_liquidacao dl
where not exists (
  select 1
  from public.ordens_bancarias ob
  where ob.documento_liquidacao = dl.documento_liquidacao
);

-- View: Monitoramento de pagamentos — OBs com DLs e marcações manuais
create or replace view public.vw_monitoramento_pagamentos as
select
  dl.numero_processo,
  ob.documento_liquidacao,
  ob.ordem_bancaria,
  ob.ob_credor_nome as credor,
  ob.ob_credor_documento,
  ob.data_pagamento,
  ob.valor,
  ob.codigo_fonte_recurso as fonte,
  mp.confirmado_manualmente,
  mp.confirmado_por,
  mp.confirmado_em,
  mp.observacao
from public.ordens_bancarias ob
join public.documentos_liquidacao dl on dl.documento_liquidacao = ob.documento_liquidacao
left join public.marcacoes_pagamento mp on mp.ordem_bancaria = ob.ordem_bancaria;
