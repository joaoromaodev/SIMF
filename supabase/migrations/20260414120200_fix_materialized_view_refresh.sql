-- Migration: Enable CONCURRENTLY refresh on consolidated_siafe_lineage
--
-- PROBLEMA: REFRESH MATERIALIZED VIEW CONCURRENTLY requer um índice ÚNICO
-- sobre *colunas reais* (não expressões), cobrindo todas as linhas.
-- A view original não tinha nenhuma coluna com essa garantia.
--
-- SOLUÇÃO: Recriar a view adicionando row_id (row_number determinístico)
-- como chave sintética, criar índice único sobre ela, e extrair o REFRESH
-- para uma função dedicada refresh_consolidated_lineage().
--
-- IMPACTO: Todos os SELECTs existentes continuam funcionando — nenhuma
-- coluna original foi removida ou renomeada; row_id é coluna adicional.

-- ─── 1. Recriar a materialized view com row_id ────────────────────────────

drop materialized view if exists public.consolidated_siafe_lineage;

create materialized view public.consolidated_siafe_lineage as
select
  row_number() over (
    order by
      p.numero_processo,
      coalesce(ne.codigo_nota_empenho, ''),
      coalesce(dl.documento_liquidacao, ''),
      coalesce(ob.ordem_bancaria, '')
  ) as row_id,
  p.numero_processo,
  ne.codigo_nota_empenho,
  dl.documento_liquidacao,
  ob.ordem_bancaria,
  dl.dl_documento_credor,
  dl.dl_nome_credor,
  ob.ob_credor_documento,
  ob.ob_credor_nome,
  ob.data_pagamento,
  dl.codigo_fonte_recurso as documento_codigo_fonte_recurso,
  dl.codigo_detalhamento_fr as documento_codigo_detalhamento_fr,
  dl.codigo_unidade_gestora as documento_codigo_unidade_gestora,
  dl.valor_original,
  dl.valor_liquido,
  dl.valor_bruto,
  dl.valor_retido,
  dl.valor_pago,
  dl.valor_liquidado_a_pagar,
  dl.valor_liquido_2,
  dl.valor as documento_valor,
  ob.valor as ordem_valor,
  dl.created_at as documento_created_at,
  ob.created_at as ordem_created_at
from public.processos p
left join public.notas_empenho ne
  on ne.numero_processo = p.numero_processo
left join public.documentos_liquidacao dl
  on dl.codigo_nota_empenho = ne.codigo_nota_empenho
  or dl.numero_processo = p.numero_processo
left join public.ordens_bancarias ob
  on ob.documento_liquidacao = dl.documento_liquidacao;

-- ─── 2. Índice único sobre coluna real — viabiliza CONCURRENTLY ──────────

create unique index consolidated_siafe_lineage_row_id_idx
  on public.consolidated_siafe_lineage (row_id);

-- ─── 3. Função dedicada para refresh não-bloqueante ───────────────────────

create or replace function public.refresh_consolidated_lineage()
returns void
language plpgsql
as $$
begin
  refresh materialized view concurrently public.consolidated_siafe_lineage;
end;
$$;

-- ─── 4. Atualizar consolidate_siafe_lineage — remover REFRESH direto ──────
--
-- A função agora só consolida dados nas tabelas canônicas (steps 1-4).
-- O refresh da view é responsabilidade do chamador via refresh_consolidated_lineage().

create or replace function public.consolidate_siafe_lineage()
returns void
language plpgsql
as $$
begin
  -- 1. Ensure canonical process entities
  insert into public.processos (numero_processo)
  select distinct numero_processo
  from (
    select numero_processo from public.normalized_ne_dl_rows
    union
    select numero_processo from public.normalized_dl_ob_rows
  ) source
  where numero_processo is not null
  on conflict (numero_processo) do nothing;

  -- 2. Ensure canonical nota de empenho entities
  insert into public.notas_empenho (codigo_nota_empenho, numero_processo)
  select distinct codigo_nota_empenho, numero_processo
  from public.normalized_ne_dl_rows
  where codigo_nota_empenho is not null
  on conflict (codigo_nota_empenho) do update
    set numero_processo = coalesce(excluded.numero_processo, public.notas_empenho.numero_processo),
        updated_at = timezone('utc'::text, now());

  -- 3. Consolidate documento de liquidação entities from NE+DL and DL+OB
  with documentos as (
    select
      documento_liquidacao,
      max(numero_processo) filter (where numero_processo is not null) as numero_processo,
      max(codigo_nota_empenho) filter (where codigo_nota_empenho is not null) as codigo_nota_empenho,
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
        null::text as dl_documento_credor,
        null::text as dl_nome_credor,
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

  -- 4. Consolidate ordem bancária entities
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

  -- Nota: o REFRESH da view foi extraído para refresh_consolidated_lineage().
  -- O chamador (finalize_siafe_active_import) é responsável por invocá-lo.
end;
$$;

-- ─── 5. Atualizar finalize_siafe_active_import ────────────────────────────
--
-- Separa explicitamente: consolidação de dados + refresh da view.
-- O refresh agora usa CONCURRENTLY via refresh_consolidated_lineage().

create or replace function public.finalize_siafe_active_import(
  p_new_batch_id uuid,
  p_report_type public.siafe_report_type,
  p_year_scope public.siafe_year_scope,
  p_source_headers jsonb,
  p_processed_row_count integer,
  p_normalized_row_count integer
)
returns jsonb
language plpgsql
as $$
declare
  v_previous_batch_ids uuid[];
begin
  select coalesce(array_agg(locked.id), array[]::uuid[])
  into v_previous_batch_ids
  from (
    select id
    from public.import_batches
    where report_type = p_report_type
      and year_scope = p_year_scope
      and status = 'success'
      and is_active = true
      and id <> p_new_batch_id
    for update
  ) as locked;

  update public.import_batches
  set
    is_active = false,
    replaced_batch_id = p_new_batch_id,
    finished_at = timezone('utc'::text, now())
  where id = any(v_previous_batch_ids);

  update public.import_batches
  set
    status = 'success',
    source_headers = p_source_headers,
    processed_row_count = p_processed_row_count,
    normalized_row_count = p_normalized_row_count,
    validation_errors = '[]'::jsonb,
    is_active = true,
    finished_at = timezone('utc'::text, now())
  where id = p_new_batch_id;

  if p_report_type = 'NE_DL' then
    delete from public.normalized_ne_dl_rows
    where import_batch_id = any(v_previous_batch_ids);
  elsif p_report_type = 'DL_OB' then
    delete from public.normalized_dl_ob_rows
    where import_batch_id = any(v_previous_batch_ids);
  end if;

  -- Consolidar tabelas canônicas a partir das linhas normalizadas
  perform public.consolidate_siafe_lineage();

  -- Atualizar a materialized view de forma não-bloqueante (CONCURRENTLY)
  perform public.refresh_consolidated_lineage();

  return jsonb_build_object(
    'active_batch_id', p_new_batch_id,
    'deactivated_batch_ids', v_previous_batch_ids
  );
end;
$$;
