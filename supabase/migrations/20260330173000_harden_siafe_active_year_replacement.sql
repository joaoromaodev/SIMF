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

  return jsonb_build_object(
    'active_batch_id', p_new_batch_id,
    'deactivated_batch_ids', v_previous_batch_ids
  );
end;
$$;
