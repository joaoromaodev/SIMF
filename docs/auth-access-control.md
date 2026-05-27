# Autenticacao e Controle de Acesso - SIMF

## Status

Implementado. Todas as frentes AUTH-01 a AUTH-05 estao concluidas.
Esta documentacao reflete o estado atual do sistema.

## Objetivo

Proteger o acesso aos dashboards, restringir importacoes CSV a administradores,
e permitir gestao controlada de usuarios. Autenticacao via Supabase Auth com
controle de perfil em tabela propria (`profiles`).

## Premissas

- Supabase Auth e o provedor de login e sessao.
- A tabela `profiles` armazena metadados internos do usuario, incluindo `role`.
- Os roles sao `admin` e `user` (enum `public.user_role`).
- O primeiro usuario `admin` e criado manualmente no Supabase Dashboard.
- A UI oculta funcionalidades conforme o perfil, mas a autorizacao real acontece no backend.
- Nenhuma permissao sensivel depende apenas de estado client-side.
- `SUPABASE_SERVICE_ROLE_KEY` permanece exclusivamente server-side.

## Perfis

### `user`

Perfil comum de consulta.

Pode:

- acessar areas autenticadas de dashboard;
- consultar dados de BI e acompanhamento;
- visualizar informacoes disponibilizadas pelas views autorizadas.

Nao pode:

- subir relatorios CSV;
- substituir batches de importacao;
- acessar funcionalidades administrativas;
- criar, editar ou remover usuarios.

### `admin`

Perfil administrativo do SIMF.

Pode:

- acessar dashboards;
- subir relatorios CSV e acionar `POST /api/imports`;
- substituir batches conforme a politica vigente;
- acessar `/dashboard/import` e `/dashboard/admin/usuarios`;
- criar usuarios com role inicial definido;
- alterar role de outros usuarios;
- remover usuarios;
- visualizar o audit_log.

Nao pode:

- alterar o proprio role;
- se remover do sistema;
- ignorar validacoes de schema, arquivo ou escopo anual.

## Matriz de Permissoes

| Acao | `user` | `admin` | Observacao |
|---|---:|---:|---|
| Fazer login | Sim | Sim | Via Supabase Auth |
| Encerrar sessao | Sim | Sim | Via Supabase Auth |
| Acessar dashboards | Sim | Sim | Exige sessao valida (middleware) |
| Consultar dados de BI | Sim | Sim | Conforme views autorizadas |
| Acessar `/dashboard/import` | Nao | Sim | `requireAdmin()` no Server Component |
| Enviar CSV via `POST /api/imports` | Nao | Sim | Auth verificada na route handler |
| Acessar `/dashboard/admin/usuarios` | Nao | Sim | `requireAdmin()` no Server Component |
| Criar usuario | Nao | Sim | `createUser` server action |
| Definir role de usuario | Nao | Sim | `updateUserRole` server action |
| Remover usuario | Nao | Sim | `deleteUser` server action |
| Alterar proprio role | Nao | Nao | Bloqueio explicito no server action |
| Se remover | Nao | Nao | Bloqueio explicito no server action |
| Ler audit_log | Nao | Sim | RLS restringe a admins |

## Arquitetura

### Middleware

`middleware.js` usa `@supabase/ssr` para:
- Redirecionar `/dashboard/*` para `/login?redirect=<path>` se sem sessao;
- Redirecionar `/login` para `/dashboard/dppc` se ja autenticado.

### Server Helpers

`lib/auth/require-role.js`:
- `requireAdmin()` — verifica sessao + role=admin, redireciona se negado;
- `getSessionRole()` — retorna `{ id, email, role }` ou null, sem redirecionar.

### Clientes Supabase

- `lib/supabase/session.js` — cliente de sessao com cookies (Server Components / Actions);
- `lib/supabase/browser.js` — cliente browser para UI de login;
- `lib/supabase/server.js` — cliente com service role para operacoes administrativas.

### Login

`app/login/page.js` — formulario client-side com `signInWithPassword`.
Apos login bem-sucedido, redireciona para o caminho original (`?redirect=`) ou `/dashboard/dppc`.

### Dashboard Layout

`app/dashboard/layout.js` — Server Component async que:
1. Chama `getSessionRole()` para obter email e role;
2. Renderiza `DashboardShell` com `userEmail` e `userRole`.

`components/dashboard-shell.jsx` — Client Component que:
- Exibe "Atualizar Base" e "Usuarios" apenas para `admin`;
- Exibe badge "Admin" no topbar;
- Contem o botao de logout.

## Rotas Protegidas

Rotas publicas:
- `/login`
- `/` (portal publico, sem autenticacao obrigatoria)

Rotas autenticadas para `user` e `admin`:
- `/dashboard/dppc`
- `/dashboard/dppc/cpag`
- `/dashboard/dppc/cliq`
- `/dashboard/dfin/ceo`
- `/dashboard/dfin/cped`
- `/dashboard/dfin/acont`

Rotas restritas a `admin`:
- `/dashboard/import`
- `/dashboard/admin/usuarios`

## APIs Protegidas

`POST /api/imports`:
1. Obtem `user` via `supabase.auth.getUser()`;
2. Retorna 401 se sem sessao;
3. Le `profiles.role` via query server-side;
4. Retorna 403 se role != 'admin';
5. Processa upload passando `importedBy: user.id`.

## Auditoria Minima

### Importacoes autenticadas

Coluna `imported_by uuid` em `import_batches` registra o UUID do admin responsavel.
Inclui batches de sucesso e falha.

### Criacao de usuarios

Tabela `audit_log` registra entrada com `action = 'user_created'`,
`actor_id` (admin), `target_id` (novo usuario), `payload: { email, role }`.

### Mudancas de role

Tabela `audit_log` registra entrada com `action = 'role_changed'`,
`actor_id`, `target_id`, `payload: { previous_role, new_role }`.

### Remocao de usuarios

Tabela `audit_log` registra entrada com `action = 'user_deleted'`,
`actor_id`, `target_id = null` (perfil removido em cascata),
`payload: { deleted_user_id, email, role }`.

### RLS no audit_log

Apenas admins podem ler o audit_log (policy `audit_log: admin le registros`).
Escrita e feita exclusivamente via service role server-side.

## Fluxo de Criacao de Usuarios

1. Admin acessa `/dashboard/admin/usuarios`;
2. Admin preenche email, senha inicial (min. 8 chars) e role (`admin` ou `user`);
3. Server action `createUser` verifica sessao admin;
4. `supabase.auth.admin.createUser` cria usuario com `email_confirm: true`;
5. Upsert em `profiles` define o role correto;
6. Em caso de falha no upsert, o usuario Auth e revertido (`deleteUser`);
7. Entrada registrada em `audit_log`;
8. Usuario pode fazer login imediatamente com as credenciais informadas pelo admin.

## Regra para Primeiro Admin

O primeiro `admin` deve ser criado manualmente no Supabase Dashboard:

```sql
-- 1. Crie o usuario em Authentication > Users
-- 2. Apos o trigger criar o perfil com role='user', eleve para admin:
UPDATE public.profiles SET role = 'admin' WHERE email = '<email-do-admin>';
```

## Decisoes de Seguranca

- Backend valida todas as permissoes sensiveis (role lido de `profiles`, nunca do client).
- UI oculta botoes e links como conveniencia, nao como controle de acesso.
- `role` vive em `profiles`, nao em payload enviado pelo client.
- Roles desconhecidos negam acesso por padrao.
- Usuarios autenticados sem perfil sao bloqueados.
- Importacao CSV exige `admin` antes de qualquer efeito colateral.
- `SUPABASE_SERVICE_ROLE_KEY` permanece exclusivamente server-side.
- Usuarios nao podem alterar o proprio role.
- Usuarios nao podem se remover.
- Auditoria gravada server-side com service role — nao pode ser forjada pelo client.

## Riscos Residuais

- Nao ha protecao contra rebaixamento do ultimo admin — e possivel ficar sem nenhum admin.
  Mitigacao manual: verificar antes de rebaixar ou remover.
- Senha inicial definida pelo admin: o usuario deveria ser orientado a alterar no primeiro acesso.
  Nao ha fluxo automatico de troca obrigatoria de senha — depende de orientacao operacional.
- Nao ha MFA, SSO corporativo ou aprovacao em multiplas etapas — escopo de hardening futuro.
- RLS nao cobre leitura de dados de BI por enquanto — as views sao publicas para autenticados.
  Refinamento de RLS por view e escopo de hardening futuro (Incremento 10).

## Decisoes Humanas Pendentes

- Confirmar se `/` permanecera como portal publico ou redirecionar para login.
- Definir se um `admin` pode rebaixar outro `admin` (atualmente permitido).
- Definir regra especial para impedir remocao/rebaixamento do ultimo `admin`.
- Definir se o usuario deve ser obrigado a alterar a senha no primeiro acesso.
- Definir politicas de RLS por view de BI em Incremento 10.
