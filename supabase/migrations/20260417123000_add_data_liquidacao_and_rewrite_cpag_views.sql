alter table public.normalized_ne_dl_rows
  add column if not exists data_liquidacao date;

alter table public.normalized_ne_dl_rows
  add column if not exists credor_nome text;

alter table public.normalized_ne_dl_rows
  add column if not exists contrato text;

alter table public.normalized_ne_dl_rows
  add column if not exists convenio text;

alter table public.normalized_dl_ob_rows
  add column if not exists data_liquidacao date;

alter table public.normalized_dl_ob_rows
  add column if not exists codigo_projeto_atividade text;

alter table public.normalized_dl_ob_rows
  add column if not exists codigo_natureza_despesa text;

alter table public.normalized_dl_ob_rows
  add column if not exists nome_natureza_despesa text;

alter table public.normalized_dl_ob_rows
  add column if not exists nome_elemento_despesa text;

alter table public.documentos_liquidacao
  add column if not exists data_liquidacao date;

create or replace function public.consolidate_siafe_lineage()
returns void
language plpgsql
as $$
begin
  insert into public.processos (numero_processo)
  select distinct numero_processo
  from (
    select numero_processo from public.normalized_ne_dl_rows
    union
    select numero_processo from public.normalized_dl_ob_rows
  ) source
  where numero_processo is not null
  on conflict (numero_processo) do nothing;

  insert into public.notas_empenho (codigo_nota_empenho, numero_processo)
  select distinct codigo_nota_empenho, numero_processo
  from public.normalized_ne_dl_rows
  where codigo_nota_empenho is not null
  on conflict (codigo_nota_empenho) do update
    set numero_processo = coalesce(excluded.numero_processo, public.notas_empenho.numero_processo),
        updated_at = timezone('utc'::text, now());

  with documentos as (
    select
      documento_liquidacao,
      max(numero_processo) filter (where numero_processo is not null) as numero_processo,
      max(codigo_nota_empenho) filter (where codigo_nota_empenho is not null) as codigo_nota_empenho,
      max(data_liquidacao) filter (where data_liquidacao is not null) as data_liquidacao,
      max(dl_documento_credor) filter (where dl_documento_credor is not null) as dl_documento_credor,
      max(dl_nome_credor) filter (where dl_nome_credor is not null) as dl_nome_credor,
      max(codigo_fonte_recurso) filter (where codigo_fonte_recurso is not null) as codigo_fonte_recurso,
      max(codigo_detalhamento_fr) filter (where codigo_detalhamento_fr is not null) as codigo_detalhamento_fr,
      max(codigo_unidade_gestora) filter (where codigo_unidade_gestora is not null) as codigo_unidade_gestora,
      max(valor_original) as valor_original,
      max(valor_liquido) as valor_liquido,
      max(valor_bruto) as valor_bruto,
      max(valor_retido) as valor_retido,
      max(valor_pago) as valor_pago,
      max(valor_liquidado_a_pagar) as valor_liquidado_a_pagar,
      max(valor_liquido_2) as valor_liquido_2,
      max(valor) as valor
    from (
      select
        documento_liquidacao,
        numero_processo,
        codigo_nota_empenho,
        data_liquidacao,
        null::text as dl_documento_credor,
        credor_nome as dl_nome_credor,
        codigo_fonte_recurso,
        codigo_detalhamento_fr,
        codigo_unidade_gestora,
        valor_original,
        valor_liquido,
        valor_bruto,
        valor_retido,
        valor_pago,
        valor_liquidado_a_pagar,
        valor_liquido_2,
        null::numeric as valor
      from public.normalized_ne_dl_rows

      union all

      select
        documento_liquidacao,
        numero_processo,
        null::text as codigo_nota_empenho,
        data_liquidacao,
        dl_documento_credor,
        dl_nome_credor,
        codigo_fonte_recurso,
        codigo_detalhamento_fr,
        codigo_unidade_gestora,
        null::numeric as valor_original,
        null::numeric as valor_liquido,
        null::numeric as valor_bruto,
        null::numeric as valor_retido,
        null::numeric as valor_pago,
        null::numeric as valor_liquidado_a_pagar,
        null::numeric as valor_liquido_2,
        valor
      from public.normalized_dl_ob_rows
    ) combined
    group by documento_liquidacao
  )
  insert into public.documentos_liquidacao (
    documento_liquidacao,
    numero_processo,
    codigo_nota_empenho,
    data_liquidacao,
    dl_documento_credor,
    dl_nome_credor,
    codigo_fonte_recurso,
    codigo_detalhamento_fr,
    codigo_unidade_gestora,
    valor_original,
    valor_liquido,
    valor_bruto,
    valor_retido,
    valor_pago,
    valor_liquidado_a_pagar,
    valor_liquido_2,
    valor
  )
  select
    documento_liquidacao,
    numero_processo,
    codigo_nota_empenho,
    data_liquidacao,
    dl_documento_credor,
    dl_nome_credor,
    codigo_fonte_recurso,
    codigo_detalhamento_fr,
    codigo_unidade_gestora,
    valor_original,
    valor_liquido,
    valor_bruto,
    valor_retido,
    valor_pago,
    valor_liquidado_a_pagar,
    valor_liquido_2,
    valor
  from documentos
  where documento_liquidacao is not null
  on conflict (documento_liquidacao) do update
    set
      numero_processo = coalesce(excluded.numero_processo, public.documentos_liquidacao.numero_processo),
      codigo_nota_empenho = coalesce(excluded.codigo_nota_empenho, public.documentos_liquidacao.codigo_nota_empenho),
      data_liquidacao = coalesce(excluded.data_liquidacao, public.documentos_liquidacao.data_liquidacao),
      dl_documento_credor = coalesce(excluded.dl_documento_credor, public.documentos_liquidacao.dl_documento_credor),
      dl_nome_credor = coalesce(excluded.dl_nome_credor, public.documentos_liquidacao.dl_nome_credor),
      codigo_fonte_recurso = coalesce(excluded.codigo_fonte_recurso, public.documentos_liquidacao.codigo_fonte_recurso),
      codigo_detalhamento_fr = coalesce(excluded.codigo_detalhamento_fr, public.documentos_liquidacao.codigo_detalhamento_fr),
      codigo_unidade_gestora = coalesce(excluded.codigo_unidade_gestora, public.documentos_liquidacao.codigo_unidade_gestora),
      valor_original = coalesce(excluded.valor_original, public.documentos_liquidacao.valor_original),
      valor_liquido = coalesce(excluded.valor_liquido, public.documentos_liquidacao.valor_liquido),
      valor_bruto = coalesce(excluded.valor_bruto, public.documentos_liquidacao.valor_bruto),
      valor_retido = coalesce(excluded.valor_retido, public.documentos_liquidacao.valor_retido),
      valor_pago = coalesce(excluded.valor_pago, public.documentos_liquidacao.valor_pago),
      valor_liquidado_a_pagar = coalesce(excluded.valor_liquidado_a_pagar, public.documentos_liquidacao.valor_liquidado_a_pagar),
      valor_liquido_2 = coalesce(excluded.valor_liquido_2, public.documentos_liquidacao.valor_liquido_2),
      valor = coalesce(excluded.valor, public.documentos_liquidacao.valor),
      updated_at = timezone('utc'::text, now());

  with ordens as (
    select
      ordem_bancaria,
      max(documento_liquidacao) as documento_liquidacao,
      max(numero_processo) as numero_processo,
      max(ob_credor_documento) as ob_credor_documento,
      max(ob_credor_nome) as ob_credor_nome,
      max(data_pagamento) as data_pagamento,
      max(codigo_fonte_recurso) as codigo_fonte_recurso,
      max(codigo_detalhamento_fr) as codigo_detalhamento_fr,
      max(codigo_unidade_gestora) as codigo_unidade_gestora,
      max(valor) as valor
    from public.normalized_dl_ob_rows
    where ordem_bancaria is not null
    group by ordem_bancaria
  )
  insert into public.ordens_bancarias (
    ordem_bancaria,
    documento_liquidacao,
    numero_processo,
    codigo_nota_empenho,
    ob_credor_documento,
    ob_credor_nome,
    data_pagamento,
    codigo_fonte_recurso,
    codigo_detalhamento_fr,
    codigo_unidade_gestora,
    valor
  )
  select
    o.ordem_bancaria,
    o.documento_liquidacao,
    o.numero_processo,
    public.documentos_liquidacao.codigo_nota_empenho,
    o.ob_credor_documento,
    o.ob_credor_nome,
    o.data_pagamento,
    o.codigo_fonte_recurso,
    o.codigo_detalhamento_fr,
    o.codigo_unidade_gestora,
    o.valor
  from ordens o
  left join public.documentos_liquidacao
    on public.documentos_liquidacao.documento_liquidacao = o.documento_liquidacao
  on conflict (ordem_bancaria) do update
    set
      documento_liquidacao = coalesce(excluded.documento_liquidacao, public.ordens_bancarias.documento_liquidacao),
      numero_processo = coalesce(excluded.numero_processo, public.ordens_bancarias.numero_processo),
      codigo_nota_empenho = coalesce(excluded.codigo_nota_empenho, public.ordens_bancarias.codigo_nota_empenho),
      ob_credor_documento = coalesce(excluded.ob_credor_documento, public.ordens_bancarias.ob_credor_documento),
      ob_credor_nome = coalesce(excluded.ob_credor_nome, public.ordens_bancarias.ob_credor_nome),
      data_pagamento = coalesce(excluded.data_pagamento, public.ordens_bancarias.data_pagamento),
      codigo_fonte_recurso = coalesce(excluded.codigo_fonte_recurso, public.ordens_bancarias.codigo_fonte_recurso),
      codigo_detalhamento_fr = coalesce(excluded.codigo_detalhamento_fr, public.ordens_bancarias.codigo_detalhamento_fr),
      codigo_unidade_gestora = coalesce(excluded.codigo_unidade_gestora, public.ordens_bancarias.codigo_unidade_gestora),
      valor = coalesce(excluded.valor, public.ordens_bancarias.valor),
      updated_at = timezone('utc'::text, now());
end;
$$;

create or replace view public.vw_liquidados_a_pagar as
with active_ne_dl as (
  select n.*
  from public.normalized_ne_dl_rows n
  join public.import_batches b
    on b.id = n.import_batch_id
   and b.status = 'success'
   and b.is_active = true
),
active_dl_ob as (
  select d.*
  from public.normalized_dl_ob_rows d
  join public.import_batches b
    on b.id = d.import_batch_id
   and b.status = 'success'
   and b.is_active = true
),
ne_enrichment as (
  select
    documento_liquidacao,
    max(data_liquidacao) filter (where data_liquidacao is not null) as data_liquidacao,
    max(credor_nome) filter (where credor_nome is not null) as credor_nome,
    max(codigo_natureza_despesa) filter (where codigo_natureza_despesa is not null) as codigo_natureza_despesa,
    max(codigo_fonte_recurso) filter (where codigo_fonte_recurso is not null) as codigo_fonte_recurso,
    max(codigo_unidade_gestora) filter (where codigo_unidade_gestora is not null) as codigo_unidade_gestora
  from active_ne_dl
  where documento_liquidacao is not null
  group by documento_liquidacao
),
dl_ob_enrichment as (
  select
    documento_liquidacao,
    max(data_liquidacao) filter (where data_liquidacao is not null) as data_liquidacao,
    max(codigo_fonte_recurso) filter (where codigo_fonte_recurso is not null) as codigo_fonte_recurso,
    max(codigo_unidade_gestora) filter (where codigo_unidade_gestora is not null) as codigo_unidade_gestora
  from active_dl_ob
  where documento_liquidacao is not null
  group by documento_liquidacao
),
ob_totais as (
  select
    documento_liquidacao,
    sum(valor) as valor_ja_pago_obs
  from public.ordens_bancarias
  where documento_liquidacao is not null
  group by documento_liquidacao
)
select
  dl.numero_processo,
  dl.codigo_nota_empenho,
  coalesce(ne.credor_nome, dl.dl_nome_credor) as credor,
  dl.dl_documento_credor,
  ne.codigo_natureza_despesa,
  coalesce(dl.codigo_fonte_recurso, ne.codigo_fonte_recurso, dob.codigo_fonte_recurso) as fonte,
  dl.documento_liquidacao,
  coalesce(dl.data_liquidacao, ne.data_liquidacao, dob.data_liquidacao) as data_liquidacao,
  dl.valor_original,
  dl.valor_liquido,
  dl.valor_retido,
  dl.valor_bruto,
  greatest(coalesce(dl.valor_bruto, 0) - coalesce(ob.valor_ja_pago_obs, 0), 0)::numeric(18, 2) as valor_liquidado_a_pagar,
  coalesce(ob.valor_ja_pago_obs, 0)::numeric(18, 2) as valor_ja_pago_obs,
  coalesce(dl.codigo_unidade_gestora, ne.codigo_unidade_gestora, dob.codigo_unidade_gestora) as codigo_unidade_gestora,
  dl.updated_at
from public.documentos_liquidacao dl
left join ne_enrichment ne
  on ne.documento_liquidacao = dl.documento_liquidacao
left join dl_ob_enrichment dob
  on dob.documento_liquidacao = dl.documento_liquidacao
left join ob_totais ob
  on ob.documento_liquidacao = dl.documento_liquidacao
where coalesce(dl.valor_bruto, 0) > coalesce(ob.valor_ja_pago_obs, 0);

create or replace view public.vw_monitoramento_pagamentos as
with active_ne_dl as (
  select n.*
  from public.normalized_ne_dl_rows n
  join public.import_batches b
    on b.id = n.import_batch_id
   and b.status = 'success'
   and b.is_active = true
),
active_dl_ob as (
  select d.*
  from public.normalized_dl_ob_rows d
  join public.import_batches b
    on b.id = d.import_batch_id
   and b.status = 'success'
   and b.is_active = true
),
ne_enrichment as (
  select
    documento_liquidacao,
    max(data_liquidacao) filter (where data_liquidacao is not null) as data_liquidacao,
    max(credor_nome) filter (where credor_nome is not null) as credor_nome,
    max(codigo_fonte_recurso) filter (where codigo_fonte_recurso is not null) as codigo_fonte_recurso,
    max(codigo_unidade_gestora) filter (where codigo_unidade_gestora is not null) as codigo_unidade_gestora
  from active_ne_dl
  where documento_liquidacao is not null
  group by documento_liquidacao
),
dl_ob_enrichment as (
  select
    documento_liquidacao,
    max(data_liquidacao) filter (where data_liquidacao is not null) as data_liquidacao,
    max(codigo_fonte_recurso) filter (where codigo_fonte_recurso is not null) as codigo_fonte_recurso,
    max(codigo_unidade_gestora) filter (where codigo_unidade_gestora is not null) as codigo_unidade_gestora
  from active_dl_ob
  where documento_liquidacao is not null
  group by documento_liquidacao
)
select
  coalesce(dl.numero_processo, ob.numero_processo) as numero_processo,
  coalesce(ob.documento_liquidacao, dl.documento_liquidacao) as documento_liquidacao,
  ob.ordem_bancaria,
  coalesce(ob.ob_credor_nome, dl.dl_nome_credor, ne.credor_nome) as credor,
  ob.ob_credor_documento,
  coalesce(dl.data_liquidacao, ne.data_liquidacao, dob.data_liquidacao) as data_liquidacao,
  ob.data_pagamento,
  ob.valor,
  coalesce(ob.codigo_fonte_recurso, dl.codigo_fonte_recurso, ne.codigo_fonte_recurso, dob.codigo_fonte_recurso) as fonte,
  coalesce(ob.codigo_unidade_gestora, dl.codigo_unidade_gestora, ne.codigo_unidade_gestora, dob.codigo_unidade_gestora) as codigo_unidade_gestora,
  mp.confirmado_manualmente,
  mp.confirmado_por,
  mp.confirmado_em,
  mp.observacao
from public.ordens_bancarias ob
left join lateral (
  select dl.*
  from public.documentos_liquidacao dl
  where (
      ob.documento_liquidacao is not null
      and dl.documento_liquidacao = ob.documento_liquidacao
    )
    or (
      ob.documento_liquidacao is null
      and ob.numero_processo is not null
      and dl.numero_processo = ob.numero_processo
    )
  order by
    case
      when ob.documento_liquidacao is not null and dl.documento_liquidacao = ob.documento_liquidacao then 0
      else 1
    end,
    dl.data_liquidacao desc nulls last,
    dl.updated_at desc
  limit 1
) dl on true
left join ne_enrichment ne
  on ne.documento_liquidacao = coalesce(ob.documento_liquidacao, dl.documento_liquidacao)
left join dl_ob_enrichment dob
  on dob.documento_liquidacao = coalesce(ob.documento_liquidacao, dl.documento_liquidacao)
left join public.marcacoes_pagamento mp
  on mp.ordem_bancaria = ob.ordem_bancaria;
