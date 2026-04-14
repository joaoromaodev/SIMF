-- Migration: Add marcacoes_pagamento table for manual payment confirmation tracking

create table if not exists public.marcacoes_pagamento (
  ordem_bancaria text primary key references public.ordens_bancarias(ordem_bancaria),
  confirmado_manualmente boolean not null default false,
  confirmado_por text,
  confirmado_em timestamptz,
  observacao text,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

drop trigger if exists set_marcacoes_pagamento_updated_at on public.marcacoes_pagamento;
create trigger set_marcacoes_pagamento_updated_at
before update on public.marcacoes_pagamento
for each row
execute function public.set_updated_at();
