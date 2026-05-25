# Autenticacao e Controle de Acesso - SIMF

## Objetivo

Esta frente define o planejamento para adicionar autenticacao e autorizacao ao SIMF usando Supabase Auth, com controle de perfil em tabela propria.

O objetivo e proteger o acesso aos dashboards, restringir importacoes CSV e permitir gestao controlada de usuarios sem alterar, nesta rodada, rotas, APIs, UI, migrations ou codigo funcional.

## Premissas

- Supabase Auth sera usado como provedor de login e sessao.
- A tabela `profiles` armazenara metadados internos do usuario, incluindo `role`.
- Os roles iniciais serao `admin` e `user`.
- O primeiro usuario `admin` sera criado manualmente no Supabase.
- A UI podera ocultar funcionalidades conforme o perfil, mas a autorizacao obrigatoria deve acontecer no backend.
- Nenhuma permissao sensivel deve depender apenas de estado client-side.

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
- subir relatorios CSV;
- acionar a API de importacao;
- substituir batches conforme a politica vigente;
- adicionar usuarios ao sistema;
- atribuir perfil inicial aos usuarios criados;
- consultar telas administrativas futuras.

Nao deve:

- ignorar validacoes de schema, arquivo ou escopo anual;
- usar operacoes administrativas sem registro minimo de autoria quando a auditoria for implementada.

## Matriz de Permissoes

| Acao | `user` | `admin` | Observacao |
|---|---:|---:|---|
| Fazer login | Sim | Sim | Via Supabase Auth |
| Encerrar sessao | Sim | Sim | Via Supabase Auth |
| Acessar dashboards | Sim | Sim | Exige sessao valida |
| Consultar dados de BI | Sim | Sim | Conforme views autorizadas |
| Acessar pagina de importacao | Nao | Sim | Deve ser protegido por rota |
| Enviar CSV | Nao | Sim | Deve ser validado no backend |
| Substituir batch ativo de `2026` | Nao | Sim | Mantem regra atual de importacao |
| Adicionar usuario | Nao | Sim | Gestao administrativa |
| Definir role de usuario | Nao | Sim | Roles iniciais: `admin`, `user` |
| Alterar proprio role | Nao | Nao | Evitar escalada de privilegio |
| Acessar logs/auditoria futura | Nao | Sim | Escopo de hardening |

## Rotas Protegidas

Rotas publicas planejadas:

- pagina de login futura;
- eventuais telas de recuperacao de senha do Supabase Auth;
- `/`, caso seja mantida como portal publico.

Rotas autenticadas para `user` e `admin`:

- `/dashboard/dppc`;
- `/dashboard/dppc/cpag`;
- `/dashboard/dppc/cliq`;
- `/dashboard/dfin`.

Rotas restritas a `admin`:

- `/dashboard/import`;
- rotas futuras de administracao de usuarios.

Observacao: a lista acima descreve a politica-alvo. Nenhuma rota deve ser alterada nesta rodada de documentacao.

## APIs Protegidas

APIs que devem exigir sessao autenticada:

- endpoints futuros de leitura, se expostos fora de Server Components;
- endpoints futuros de perfil/sessao.

APIs que devem exigir `admin`:

- `POST /api/imports`;
- endpoints futuros de criacao de usuarios;
- endpoints futuros de alteracao de roles;
- endpoints futuros de auditoria administrativa, se houver.

Regras obrigatorias:

- `POST /api/imports` deve validar sessao e role no backend antes de processar arquivo, gravar Storage ou criar `import_batches`.
- A chave `SUPABASE_SERVICE_ROLE_KEY` deve permanecer restrita ao servidor.
- A API nao deve aceitar role enviado pelo client como fonte de verdade.
- O perfil deve ser lido de `profiles` ou de mecanismo server-side equivalente.

## Fluxo de Login

Fluxo planejado:

1. Usuario acessa a pagina de login.
2. Usuario informa credenciais.
3. Supabase Auth valida credenciais e cria sessao.
4. Aplicacao recupera o usuario autenticado.
5. Backend ou server layer consulta `profiles` para obter `role`.
6. Usuario e redirecionado conforme permissao:
   - `user`: dashboards;
   - `admin`: dashboards, com acesso adicional a importacao e administracao.
7. A cada acesso protegido, sessao e role devem ser revalidados no servidor.

Estados esperados:

- sem sessao: redirecionar para login;
- sessao valida sem `profiles`: bloquear acesso e orientar correcao administrativa;
- role desconhecido: bloquear acesso por padrao;
- role valido: liberar apenas o escopo permitido.

## Fluxo de Criacao de Usuarios

Fluxo planejado para administracao:

1. Admin acessa a area futura de gestao de usuarios.
2. Admin informa email e role inicial (`user` ou `admin`).
3. Backend valida que o solicitante possui role `admin`.
4. Backend cria o usuario no Supabase Auth pelo mecanismo administrativo apropriado.
5. Backend cria o registro correspondente em `profiles`.
6. Usuario criado recebe convite, senha temporaria ou fluxo de recuperacao definido para o ambiente.
7. Auditoria futura registra quem criou o usuario, quando e com qual role.

Regras:

- apenas `admin` pode criar usuarios;
- apenas `admin` pode atribuir role inicial;
- usuarios nao podem alterar o proprio role;
- criacao parcial entre Supabase Auth e `profiles` deve ser tratada como erro operacional a corrigir.

## Regra para Primeiro Admin

O primeiro `admin` sera criado manualmente no Supabase.

Procedimento esperado na implementacao:

1. Criar usuario no Supabase Auth.
2. Criar registro correspondente em `profiles`.
3. Definir `profiles.role = 'admin'`.
4. Confirmar que o usuario consegue acessar areas administrativas.

Essa regra evita criar uma tela publica de bootstrap administrativo e reduz risco de escalada inicial de privilegio.

## Decisoes de Seguranca

- Backend deve validar todas as permissoes sensiveis.
- UI pode esconder botoes e links, mas isso e apenas conveniencia de experiencia.
- `role` deve viver em `profiles`, nao em payload enviado pelo client.
- Roles desconhecidos devem negar acesso por padrao.
- Usuarios autenticados sem perfil devem ser bloqueados ate correcao.
- A importacao CSV deve exigir `admin` antes de qualquer efeito colateral.
- Service role do Supabase deve ficar apenas em ambiente server-side.
- RLS e policies do Supabase devem ser planejadas junto da modelagem de `profiles`.
- Mudancas de role devem ser auditaveis em rodada futura.
- O modelo inicial evita permissoes granulares ate haver necessidade real.

## Itens Fora de Escopo

Fora do escopo desta rodada:

- implementar login;
- criar migrations;
- criar tabela `profiles`;
- alterar frontend funcional;
- alterar backend funcional;
- proteger rotas no codigo;
- proteger `POST /api/imports` no codigo;
- criar tela de gestao de usuarios;
- criar auditoria operacional;
- configurar provedores externos de identidade;
- definir politicas finais de RLS.

Fora do escopo inicial de produto, salvo decisao futura:

- perfis adicionais alem de `admin` e `user`;
- permissoes granulares por dashboard;
- grupos, departamentos ou unidades gestoras;
- SSO corporativo;
- MFA obrigatorio;
- aprovacao em multiplas etapas para importacao.

## Dependencias para Implementacao Futura

- Definir schema SQL de `profiles`.
- Definir policies/RLS para leitura e escrita de perfis.
- Definir estrategia de middleware ou verificacao server-side por rota.
- Definir helper server-side para obter usuario autenticado e role.
- Definir comportamento de redirecionamento pos-login.
- Definir fluxo operacional de convite/recuperacao de senha.
- Definir formato minimo de auditoria para importacoes e gestao de usuarios.

## Decisoes Humanas Pendentes

- Confirmar se `/` permanecera como portal publico ou se redirecionara usuarios sem sessao para login.
- Definir o fluxo operacional de criacao de senha: convite, senha temporaria ou recuperacao por email.
- Definir se um `admin` podera rebaixar outro `admin`.
- Definir se havera regra especial para impedir remocao/rebaixamento do ultimo `admin`.
- Definir nivel minimo de auditoria exigido no primeiro incremento funcional.
- Definir se RLS sera aplicada ja no primeiro ciclo de autenticacao ou em hardening posterior.
