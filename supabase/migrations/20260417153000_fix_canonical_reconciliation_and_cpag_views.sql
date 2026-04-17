create or replace function public.consolidate_siafe_lineage()
returns void
language plpgsql
as $$
begin
  insert into public.processos (numero_processo)
  with ne_source as (
    select n.numero_processo
    from public.normalized_ne_dl_rows n
    join public.import_batches b
      on b.id = n.import_batch_id
     and b.status = 'success'
     and (b.year_scope <> '2026' or b.is_active = true)
  ),
  dlob_source as (
    select d.numero_processo
    from public.normalized_dl_ob_rows d
    join public.import_batches b
      on b.id = d.import_batch_id
     and b.status = 'success'
     and (b.year_scope <> '2026' or b.is_active = true)
  ),
  processos_source as (
    select numero_processo from ne_source
    union
    select numero_processo from dlob_source
  )
  select distinct numero_processo
  from processos_source
  where numero_processo is not null
  on conflict (numero_processo) do nothing;

  insert into public.notas_empenho (codigo_nota_empenho, numero_processo)
  with active_ne_dl as (
    select n.*
    from public.normalized_ne_dl_rows n
    join public.import_batches b
      on b.id = n.import_batch_id
     and b.status = 'success'
     and (b.year_scope <> '2026' or b.is_active = true)
  )
  select distinct codigo_nota_empenho, numero_processo
  from active_ne_dl
  where codigo_nota_empenho is not null
  on conflict (codigo_nota_empenho) do update
    set numero_processo = coalesce(excluded.numero_processo, public.notas_empenho.numero_processo),
        updated_at = timezone('utc'::text, now());

  with active_ne_dl as (
    select n.*
    from public.normalized_ne_dl_rows n
    join public.import_batches b
      on b.id = n.import_batch_id
     and b.status = 'success'
     and (b.year_scope <> '2026' or b.is_active = true)
  ),
  active_dl_ob as (
    select d.*
    from public.normalized_dl_ob_rows d
    join public.import_batches b
      on b.id = d.import_batch_id
     and b.status = 'success'
     and (b.year_scope <> '2026' or b.is_active = true)
  ),
  ne_documentos as (
    select
      documento_liquidacao,
      max(numero_processo) filter (where numero_processo is not null) as numero_processo,
      max(codigo_nota_empenho) filter (where codigo_nota_empenho is not null) as codigo_nota_empenho,
      max(data_liquidacao) filter (where data_liquidacao is not null) as data_liquidacao,
      max(codigo_fonte_recurso) filter (where codigo_fonte_recurso is not null) as codigo_fonte_recurso,
      max(codigo_detalhamento_fr) filter (where codigo_detalhamento_fr is not null) as codigo_detalhamento_fr,
      max(codigo_unidade_gestora) filter (where codigo_unidade_gestora is not null) as codigo_unidade_gestora,
      max(valor_original) as valor_original,
      max(valor_liquido) as valor_liquido,
      max(valor_bruto) as valor_bruto,
      max(valor_retido) as valor_retido,
      max(valor_pago) as valor_pago,
      max(valor_liquidado_a_pagar) as valor_liquidado_a_pagar,
      max(valor_liquido_2) as valor_liquido_2
    from active_ne_dl
    where documento_liquidacao is not null
    group by documento_liquidacao
  ),
  dlob_documentos as (
    select
      documento_liquidacao,
      max(numero_processo) filter (where numero_processo is not null) as numero_processo,
      max(data_liquidacao) filter (where data_liquidacao is not null) as data_liquidacao,
      max(dl_documento_credor) filter (where dl_documento_credor is not null) as dl_documento_credor,
      max(dl_nome_credor) filter (where dl_nome_credor is not null) as dl_nome_credor,
      max(codigo_fonte_recurso) filter (where codigo_fonte_recurso is not null) as codigo_fonte_recurso,
      max(codigo_detalhamento_fr) filter (where codigo_detalhamento_fr is not null) as codigo_detalhamento_fr,
      max(codigo_unidade_gestora) filter (where codigo_unidade_gestora is not null) as codigo_unidade_gestora,
      sum(valor) filter (where valor is not null) as valor
    from active_dl_ob
    where documento_liquidacao is not null
    group by documento_liquidacao
  ),
  documentos_source as (
    select
      coalesce(ne.documento_liquidacao, dob.documento_liquidacao) as documento_liquidacao,
      coalesce(ne.numero_processo, dob.numero_processo) as numero_processo,
      ne.codigo_nota_empenho,
      coalesce(ne.data_liquidacao, dob.data_liquidacao) as data_liquidacao,
      dob.dl_documento_credor,
      dob.dl_nome_credor,
      coalesce(ne.codigo_fonte_recurso, dob.codigo_fonte_recurso) as codigo_fonte_recurso,
      coalesce(ne.codigo_detalhamento_fr, dob.codigo_detalhamento_fr) as codigo_detalhamento_fr,
      coalesce(ne.codigo_unidade_gestora, dob.codigo_unidade_gestora) as codigo_unidade_gestora,
      ne.valor_original,
      ne.valor_liquido,
      ne.valor_bruto,
      ne.valor_retido,
      ne.valor_pago,
      ne.valor_liquidado_a_pagar,
      ne.valor_liquido_2,
      dob.valor
    from ne_documentos ne
    full outer join dlob_documentos dob
      on dob.documento_liquidacao = ne.documento_liquidacao
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
  from documentos_source
  where documento_liquidacao is not null
  on conflict (documento_liquidacao) do update
    set
      numero_processo = excluded.numero_processo,
      codigo_nota_empenho = coalesce(excluded.codigo_nota_empenho, public.documentos_liquidacao.codigo_nota_empenho),
      data_liquidacao = coalesce(excluded.data_liquidacao, public.documentos_liquidacao.data_liquidacao),
      dl_documento_credor = coalesce(excluded.dl_documento_credor, public.documentos_liquidacao.dl_documento_credor),
      dl_nome_credor = coalesce(excluded.dl_nome_credor, public.documentos_liquidacao.dl_nome_credor),
      codigo_fonte_recurso = coalesce(excluded.codigo_fonte_recurso, public.documentos_liquidacao.codigo_fonte_recurso),
      codigo_detalhamento_fr = coalesce(excluded.codigo_detalhamento_fr, public.documentos_liquidacao.codigo_detalhamento_fr),
      codigo_unidade_gestora = coalesce(excluded.codigo_unidade_gestora, public.documentos_liquidacao.codigo_unidade_gestora),
      valor_original = excluded.valor_original,
      valor_liquido = excluded.valor_liquido,
      valor_bruto = excluded.valor_bruto,
      valor_retido = excluded.valor_retido,
      valor_pago = excluded.valor_pago,
      valor_liquidado_a_pagar = excluded.valor_liquidado_a_pagar,
      valor_liquido_2 = excluded.valor_liquido_2,
      valor = excluded.valor,
      updated_at = timezone('utc'::text, now());

  with active_dl_ob as (
    select d.*
    from public.normalized_dl_ob_rows d
    join public.import_batches b
      on b.id = d.import_batch_id
     and b.status = 'success'
     and (b.year_scope <> '2026' or b.is_active = true)
  ),
  ordens_source as (
    select
      ordem_bancaria,
      max(documento_liquidacao) filter (where documento_liquidacao is not null) as documento_liquidacao,
      max(numero_processo) filter (where numero_processo is not null) as numero_processo,
      max(ob_credor_documento) filter (where ob_credor_documento is not null) as ob_credor_documento,
      max(ob_credor_nome) filter (where ob_credor_nome is not null) as ob_credor_nome,
      max(data_pagamento) filter (where data_pagamento is not null) as data_pagamento,
      max(codigo_fonte_recurso) filter (where codigo_fonte_recurso is not null) as codigo_fonte_recurso,
      max(codigo_detalhamento_fr) filter (where codigo_detalhamento_fr is not null) as codigo_detalhamento_fr,
      max(codigo_unidade_gestora) filter (where codigo_unidade_gestora is not null) as codigo_unidade_gestora,
      max(valor) as valor
    from active_dl_ob
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
    dl.codigo_nota_empenho,
    o.ob_credor_documento,
    o.ob_credor_nome,
    o.data_pagamento,
    o.codigo_fonte_recurso,
    o.codigo_detalhamento_fr,
    o.codigo_unidade_gestora,
    o.valor
  from ordens_source o
  left join public.documentos_liquidacao dl
    on dl.documento_liquidacao = o.documento_liquidacao
  on conflict (ordem_bancaria) do update
    set
      documento_liquidacao = excluded.documento_liquidacao,
      numero_processo = excluded.numero_processo,
      codigo_nota_empenho = coalesce(excluded.codigo_nota_empenho, public.ordens_bancarias.codigo_nota_empenho),
      ob_credor_documento = coalesce(excluded.ob_credor_documento, public.ordens_bancarias.ob_credor_documento),
      ob_credor_nome = coalesce(excluded.ob_credor_nome, public.ordens_bancarias.ob_credor_nome),
      data_pagamento = coalesce(excluded.data_pagamento, public.ordens_bancarias.data_pagamento),
      codigo_fonte_recurso = coalesce(excluded.codigo_fonte_recurso, public.ordens_bancarias.codigo_fonte_recurso),
      codigo_detalhamento_fr = coalesce(excluded.codigo_detalhamento_fr, public.ordens_bancarias.codigo_detalhamento_fr),
      codigo_unidade_gestora = coalesce(excluded.codigo_unidade_gestora, public.ordens_bancarias.codigo_unidade_gestora),
      valor = excluded.valor,
      updated_at = timezone('utc'::text, now());

  delete from public.marcacoes_pagamento mp
  where not exists (
    with active_dl_ob as (
      select d.ordem_bancaria
      from public.normalized_dl_ob_rows d
      join public.import_batches b
        on b.id = d.import_batch_id
       and b.status = 'success'
       and (b.year_scope <> '2026' or b.is_active = true)
    )
    select 1
    from active_dl_ob source
    where source.ordem_bancaria = mp.ordem_bancaria
  );

  delete from public.ordens_bancarias ob
  where not exists (
    with active_dl_ob as (
      select d.ordem_bancaria
      from public.normalized_dl_ob_rows d
      join public.import_batches b
        on b.id = d.import_batch_id
       and b.status = 'success'
       and (b.year_scope <> '2026' or b.is_active = true)
      where d.ordem_bancaria is not null
    )
    select 1
    from active_dl_ob source
    where source.ordem_bancaria = ob.ordem_bancaria
  );

  delete from public.documentos_liquidacao dl
  where not exists (
    with active_ne_dl as (
      select n.documento_liquidacao
      from public.normalized_ne_dl_rows n
      join public.import_batches b
        on b.id = n.import_batch_id
       and b.status = 'success'
       and (b.year_scope <> '2026' or b.is_active = true)
      where n.documento_liquidacao is not null
    ),
    active_dl_ob as (
      select d.documento_liquidacao
      from public.normalized_dl_ob_rows d
      join public.import_batches b
        on b.id = d.import_batch_id
       and b.status = 'success'
       and (b.year_scope <> '2026' or b.is_active = true)
      where d.documento_liquidacao is not null
    ),
    documentos_source as (
      select documento_liquidacao from active_ne_dl
      union
      select documento_liquidacao from active_dl_ob
    )
    select 1
    from documentos_source source
    where source.documento_liquidacao = dl.documento_liquidacao
  );

  delete from public.notas_empenho ne
  where not exists (
    with active_ne_dl as (
      select n.codigo_nota_empenho
      from public.normalized_ne_dl_rows n
      join public.import_batches b
        on b.id = n.import_batch_id
       and b.status = 'success'
       and (b.year_scope <> '2026' or b.is_active = true)
      where n.codigo_nota_empenho is not null
    )
    select 1
    from active_ne_dl source
    where source.codigo_nota_empenho = ne.codigo_nota_empenho
  );

  delete from public.processos p
  where not exists (
    with active_ne_dl as (
      select n.numero_processo
      from public.normalized_ne_dl_rows n
      join public.import_batches b
        on b.id = n.import_batch_id
       and b.status = 'success'
       and (b.year_scope <> '2026' or b.is_active = true)
      where n.numero_processo is not null
    ),
    active_dl_ob as (
      select d.numero_processo
      from public.normalized_dl_ob_rows d
      join public.import_batches b
        on b.id = d.import_batch_id
       and b.status = 'success'
       and (b.year_scope <> '2026' or b.is_active = true)
      where d.numero_processo is not null
    ),
    processos_source as (
      select numero_processo from active_ne_dl
      union
      select numero_processo from active_dl_ob
    )
    select 1
    from processos_source source
    where source.numero_processo = p.numero_processo
  );

  refresh materialized view public.consolidated_siafe_lineage;
end;
$$;

create or replace view public.vw_liquidados_a_pagar as
with current_ne_dl as (
  select n.*
  from public.normalized_ne_dl_rows n
  join public.import_batches b
    on b.id = n.import_batch_id
   and b.status = 'success'
   and (b.year_scope <> '2026' or b.is_active = true)
),
current_dl_ob as (
  select d.*
  from public.normalized_dl_ob_rows d
  join public.import_batches b
    on b.id = d.import_batch_id
   and b.status = 'success'
   and (b.year_scope <> '2026' or b.is_active = true)
),
ne_enrichment as (
  select
    documento_liquidacao,
    max(data_liquidacao) filter (where data_liquidacao is not null) as data_liquidacao,
    max(credor_nome) filter (where credor_nome is not null) as credor_nome,
    max(codigo_natureza_despesa) filter (where codigo_natureza_despesa is not null) as codigo_natureza_despesa,
    max(codigo_fonte_recurso) filter (where codigo_fonte_recurso is not null) as codigo_fonte_recurso,
    max(codigo_unidade_gestora) filter (where codigo_unidade_gestora is not null) as codigo_unidade_gestora
  from current_ne_dl
  where documento_liquidacao is not null
  group by documento_liquidacao
),
dl_ob_enrichment as (
  select
    documento_liquidacao,
    max(data_liquidacao) filter (where data_liquidacao is not null) as data_liquidacao,
    max(codigo_fonte_recurso) filter (where codigo_fonte_recurso is not null) as codigo_fonte_recurso,
    max(codigo_unidade_gestora) filter (where codigo_unidade_gestora is not null) as codigo_unidade_gestora
  from current_dl_ob
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
  coalesce(dl.dl_nome_credor, ne.credor_nome) as credor,
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
with current_ne_dl as (
  select n.*
  from public.normalized_ne_dl_rows n
  join public.import_batches b
    on b.id = n.import_batch_id
   and b.status = 'success'
   and (b.year_scope <> '2026' or b.is_active = true)
),
current_dl_ob as (
  select d.*
  from public.normalized_dl_ob_rows d
  join public.import_batches b
    on b.id = d.import_batch_id
   and b.status = 'success'
   and (b.year_scope <> '2026' or b.is_active = true)
),
ne_enrichment as (
  select
    documento_liquidacao,
    max(data_liquidacao) filter (where data_liquidacao is not null) as data_liquidacao,
    max(credor_nome) filter (where credor_nome is not null) as credor_nome,
    max(codigo_fonte_recurso) filter (where codigo_fonte_recurso is not null) as codigo_fonte_recurso,
    max(codigo_unidade_gestora) filter (where codigo_unidade_gestora is not null) as codigo_unidade_gestora
  from current_ne_dl
  where documento_liquidacao is not null
  group by documento_liquidacao
),
dl_ob_enrichment as (
  select
    documento_liquidacao,
    max(data_liquidacao) filter (where data_liquidacao is not null) as data_liquidacao,
    max(codigo_fonte_recurso) filter (where codigo_fonte_recurso is not null) as codigo_fonte_recurso,
    max(codigo_unidade_gestora) filter (where codigo_unidade_gestora is not null) as codigo_unidade_gestora
  from current_dl_ob
  where documento_liquidacao is not null
  group by documento_liquidacao
)
select
  coalesce(dl.numero_processo, ob.numero_processo) as numero_processo,
  ob.documento_liquidacao,
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
left join public.documentos_liquidacao dl
  on dl.documento_liquidacao = ob.documento_liquidacao
left join ne_enrichment ne
  on ne.documento_liquidacao = ob.documento_liquidacao
left join dl_ob_enrichment dob
  on dob.documento_liquidacao = ob.documento_liquidacao
left join public.marcacoes_pagamento mp
  on mp.ordem_bancaria = ob.ordem_bancaria;
