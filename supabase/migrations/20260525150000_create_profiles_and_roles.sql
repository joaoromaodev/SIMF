-- Migration: 20260525150000_create_profiles_and_roles
--
-- Cria a tabela `profiles` para controle de perfil/role de usuários do SIMF.
-- Vincula cada perfil a um usuário do Supabase Auth via FK para auth.users.
--
-- Roles:
--   admin — acesso total, incluindo importação de CSV e gestão de usuários
--   user  — apenas consulta de dashboards
--
-- O trigger `on_auth_user_created` cria automaticamente um perfil `user`
-- após cada signup no Supabase Auth.
--
-- O primeiro `admin` deve ser promovido manualmente no Supabase:
--   UPDATE public.profiles SET role = 'admin' WHERE email = '<email>';

-- ── Enum de role ─────────────────────────────────────────────────────────────

do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum ('admin', 'user');
  end if;
end $$;

-- ── Tabela profiles ───────────────────────────────────────────────────────────

create table if not exists public.profiles (
  id          uuid        primary key references auth.users(id) on delete cascade,
  email       text        not null default '',
  role        public.user_role not null default 'user',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table  public.profiles              is 'Perfis internos de usuário do SIMF. Role controla nível de acesso.';
comment on column public.profiles.id           is 'UUID idêntico ao auth.users.id — FK com cascade delete.';
comment on column public.profiles.role         is 'admin: importação e gestão; user: somente consulta.';

-- ── RLS ───────────────────────────────────────────────────────────────────────

alter table public.profiles enable row level security;

-- Usuário autenticado pode ler apenas seu próprio perfil
create policy "profiles: usuario le o proprio"
  on public.profiles
  for select
  using (auth.uid() = id);

-- Inserção e atualização reservadas ao service role (trigger + API admin)
-- Nenhuma policy de INSERT/UPDATE para usuários comuns

-- ── Trigger: criar perfil automaticamente após signup ─────────────────────────

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (
    new.id,
    coalesce(new.email, ''),
    'user'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Remove o trigger se já existir para evitar duplicata
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ── Função auxiliar server-side: retorna role do usuário autenticado ──────────

create or replace function public.get_my_role()
returns public.user_role
language sql
security definer
set search_path = public
as $$
  select role
  from   public.profiles
  where  id = auth.uid();
$$;

comment on function public.get_my_role() is
  'Retorna o role do usuário autenticado via auth.uid(). Usar em Server Components ou RLS.';
