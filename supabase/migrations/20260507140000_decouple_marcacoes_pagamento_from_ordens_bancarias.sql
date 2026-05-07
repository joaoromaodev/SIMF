do $$
declare
  fk record;
begin
  for fk in
    select tc.constraint_name
    from information_schema.table_constraints tc
    join information_schema.key_column_usage kcu
      on kcu.constraint_schema = tc.constraint_schema
     and kcu.constraint_name = tc.constraint_name
     and kcu.table_schema = tc.table_schema
     and kcu.table_name = tc.table_name
    join information_schema.constraint_column_usage ccu
      on ccu.constraint_schema = tc.constraint_schema
     and ccu.constraint_name = tc.constraint_name
    where tc.table_schema = 'public'
      and tc.table_name = 'marcacoes_pagamento'
      and tc.constraint_type = 'FOREIGN KEY'
      and kcu.column_name = 'ordem_bancaria'
      and ccu.table_schema = 'public'
      and ccu.table_name = 'ordens_bancarias'
  loop
    execute format('alter table public.marcacoes_pagamento drop constraint %I', fk.constraint_name);
  end loop;
end;
$$;

comment on table public.marcacoes_pagamento is
  'Auxiliary manual payment markers keyed by ordem_bancaria text; independent from legacy canonical ordens_bancarias.';
