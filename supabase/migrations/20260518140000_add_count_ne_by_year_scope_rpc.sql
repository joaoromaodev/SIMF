create or replace function public.count_ne_by_year_scope(p_year_scope text)
returns bigint
language sql
stable
security definer
as $$
  select count(*)
  from public.normalized_ne_rows
  where year_scope::text = p_year_scope;
$$;
