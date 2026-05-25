-- Migration: 20260525170000_create_audit_log
--
-- Tabela de auditoria mínima para operações administrativas do SIMF.
-- Cobre: criação de usuários, mudanças de role e remoções.
-- Importações já são auditadas via import_batches.imported_by.

create table if not exists public.audit_log (
  id          bigserial primary key,
  action      text        not null,          -- ex: 'user_created', 'role_changed', 'user_deleted'
  actor_id    uuid        references auth.users(id) on delete set null,
  target_id   uuid        references auth.users(id) on delete set null,
  payload     jsonb       not null default '{}',
  created_at  timestamptz not null default now()
);

comment on table public.audit_log is
  'Registro de auditoria de operações administrativas: criação de usuários, mudanças de role e remoções.';

comment on column public.audit_log.action is
  'Identificador da ação: user_created, role_changed, user_deleted.';

comment on column public.audit_log.actor_id is
  'UUID do admin que executou a ação. Null se o usuário foi removido.';

comment on column public.audit_log.target_id is
  'UUID do usuário afetado. Null se o usuário foi removido.';

comment on column public.audit_log.payload is
  'Dados adicionais da ação: role anterior, novo role, email, etc.';

-- RLS: somente admins podem ler o audit_log; escrita apenas via service role
alter table public.audit_log enable row level security;

create policy "audit_log: admin le registros"
  on public.audit_log
  for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'admin'
    )
  );

-- Índices para consultas de auditoria
create index if not exists idx_audit_log_actor_id
  on public.audit_log (actor_id)
  where actor_id is not null;

create index if not exists idx_audit_log_target_id
  on public.audit_log (target_id)
  where target_id is not null;

create index if not exists idx_audit_log_created_at
  on public.audit_log (created_at desc);

create index if not exists idx_audit_log_action
  on public.audit_log (action);
