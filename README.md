# SIMF

Sistema para ingestão, validação, normalização e disponibilização de relatórios CSV do SIAFE, preparando uma base consistente para consumo em painel e BI.

---

## 1. Visão geral

O **SIMF** é uma aplicação construída com:

- **Next.js**
- **Supabase**
- **PostgreSQL**
- **Supabase Storage**

O foco atual do projeto é a reestruturação da ingestão SIAFE para três universos oficiais:

- `NE`
- `NEDL`
- `DLOB`

A arquitetura anterior usava principalmente as nomenclaturas `NE_DL` e `DL_OB`. Esses nomes agora são considerados legados e devem ser usados apenas para entender código, banco ou histórico de documentação da fase anterior.

Nesta fase, o sistema contempla ou está sendo orientado para:

- upload manual de arquivos `.csv`;
- validação operacional e estrutural dos relatórios;
- parsing de CSV;
- normalização de dados por universo;
- persistência de batches de importação;
- armazenamento do arquivo original no Supabase Storage;
- política especial de substituição integral dos dados ativos de `2026`;
- views SQL comuns para alimentar painel e BI.

---

## 2. O que o projeto é

O SIMF, no estado atual, é:

- uma plataforma de ingestão de arquivos CSV do SIAFE;
- uma camada de validação e normalização;
- uma camada de persistência e rastreabilidade de batches;
- uma base normalizada para consultas via views SQL;
- uma base de dados para consumo em painel e BI.

---

## 3. O que o projeto não é

Neste momento, o SIMF **não é**:

- um sistema transacional completo do fluxo financeiro;
- um workflow administrativo;
- um substituto do SIAFE;
- uma integração direta com a API do SIAFE;
- uma plataforma com UI administrativa de schemas de relatório;
- uma camada de consolidação física completa como prioridade do MVP.

Materialized views, tabelas canônicas físicas completas e consolidações persistidas podem ser avaliadas futuramente, mas a direção atual é iniciar com views SQL comuns sobre tabelas normalizadas.

---

## 4. Estado atual da aplicação

Atualmente, o projeto já possui uma fundação de ingestão com:

- upload manual de CSV;
- formulário de envio no frontend;
- rota de importação;
- parsing de CSV;
- validação de:
  - tipo de relatório;
  - nome do arquivo;
  - escopo anual;
  - estrutura do CSV;
- persistência de `import_batches`;
- armazenamento do arquivo original no Storage;
- política de substituição integral para o `2026`;
- testes automatizados da fundação da ingestão.

A direção técnica atual é convergir a persistência normalizada para:

- `normalized_ne_rows`
- `normalized_nedl_rows`
- `normalized_dlob_rows`

Estruturas como `normalized_ne_dl_rows` e `normalized_dl_ob_rows` pertencem ao desenho anterior e devem ser tratadas como legado durante a transição.

Os tipos oficiais de relatório são:

- `NE`
- `NEDL`
- `DLOB`

---

## 5. Política de arquivos e escopo anual

### Arquivos esperados

O conjunto completo de carga SIAFE é composto por 9 arquivos CSV:

#### NE

- `2023_2024_NE.csv`
- `2025_NE.csv`
- `2026_NE.csv`

#### NEDL

- `2023_2024_NEDL.csv`
- `2025_NEDL.csv`
- `2026_NEDL.csv`

#### DLOB

- `2023_2024_DLOB.csv`
- `2025_DLOB.csv`
- `2026_DLOB.csv`

### Política por escopo anual

- `2023_2024` e `2025` são históricos.
- Durante desenvolvimento, históricos podem ser limpos e recarregados.
- Após estabilização, históricos devem ser travados depois de carga validada.
- `2026` é tratado como escopo ativo.
- Cada novo upload válido de `2026` substitui integralmente o batch ativo anterior do mesmo universo.

---

## 6. Arquitetura de dados

Modelo-alvo:

```text
CSV
  -> import_batches
  -> normalized_ne_rows
  -> normalized_nedl_rows
  -> normalized_dlob_rows
  -> views SQL
  -> painel / BI
```

Camadas principais:

- `import_batches`: controle de upload, arquivo original, escopo, status, batch ativo e rastreabilidade.
- `normalized_ne_rows`: linhas normalizadas do universo `NE`.
- `normalized_nedl_rows`: linhas normalizadas do universo `NEDL`.
- `normalized_dlob_rows`: linhas normalizadas do universo `DLOB`.
- views SQL: cruzamento, enriquecimento, auditoria, qualidade e consumo pelo painel.

O painel deve ser alimentado por views SQL comuns sobre as tabelas normalizadas. A consolidação física completa não é prioridade do MVP atual.

### Chaves de cruzamento

| Relação | Chave |
|---|---|
| `NE` -> `NEDL` | `CodigoNotadeEmpenho` |
| `NEDL` -> `DLOB` | `DocumentodeLiquidacao` / `DocumentodaLiquidacao` |
| Processo administrativo | preferencialmente `NE.NUMERO_PROCESSO` |

`DLOB` não possui `NUMERO_PROCESSO`.

Quando uma view ou painel precisar exibir o processo de uma ordem bancária, o valor deve ser derivado por:

```text
DLOB.DocumentodaLiquidacao
  -> NEDL.DocumentodeLiquidacao
  -> NEDL.CodigoNotadeEmpenho
  -> NE.CodigoNotadeEmpenho
  -> NE.NUMERO_PROCESSO
```

### Quitação de DL

Uma DL só é considerada quitada quando a soma das OBs vinculadas atinge ou supera o `Valor Bruto` da DL:

```text
sum(DLOB.valor) >= NEDL.valor_bruto
```

Pagamentos parciais devem permanecer visíveis nas views até a quitação completa.

### Marcações manuais

`marcacoes_pagamento` permanece como tabela auxiliar do painel.

Ela deve complementar views como `vw_monitoramento_pagamentos`, sem substituir a base normalizada nem virar camada canônica completa.

---

## 7. Estrutura principal do projeto

Arquivos e diretórios centrais:

- `app/`
- `components/`
- `lib/siafe/`
- `supabase/migrations/`
- `tests/`
- `docs/`
- `README.md`

Arquivos-chave da ingestão:

- `app/api/imports/route.js`
- `components/upload-form.jsx`
- `lib/siafe/csv.js`
- `lib/siafe/importer.js`
- `lib/siafe/normalize.js`
- `lib/siafe/schemas.js`
- `lib/siafe/validation.js`
- `tests/siafe-import.test.js`

---

## 8. Documentação complementar

A documentação principal da arquitetura atual está em:

- `docs/estrutura_relatorios.md`
- `docs/auth-access-control.md`
- `docs/roadmap_reestruturacao_supabase.md`
- `docs/roadmap_reestruturacao_supabase_tasks.md`
- `docs/TECHNICAL_SPECIFICATION.md`
- `docs/CPAG_SPEC.md`
- `docs/AGENTS.md`

Esses arquivos devem ser usados como referência principal para continuidade técnica, definição de escopo e atuação de agentes de desenvolvimento.

Documentos antigos da evolução de ingestão foram arquivados em `docs/archive/` e não devem orientar novas implementações.

> Observação: o projeto **não utiliza mais OpenSpec** como fluxo de trabalho.

---

## 9. Autenticação — instruções operacionais

O sistema usa Supabase Auth com controle de roles em `profiles`.

### Primeiro admin

Após aplicar as migrations, crie o primeiro admin manualmente:

1. Crie o usuário em **Supabase Dashboard > Authentication > Users**.
2. Aguarde o trigger `on_auth_user_created` criar o perfil com `role = 'user'`.
3. Eleve o role no SQL Editor:

```sql
UPDATE public.profiles SET role = 'admin' WHERE email = 'seu@email.com';
```

### Criar usuários adicionais

Acesse `/dashboard/admin/usuarios` com uma conta admin. A tela permite:
- criar usuários com e-mail, senha inicial e role;
- alterar role de outros usuários;
- remover usuários.

Usuários são criados com e-mail já confirmado. O usuário pode fazer login imediatamente com as credenciais definidas pelo admin.

### Roles disponíveis

| Role | Acesso |
|---|---|
| `user` | Dashboards (leitura) |
| `admin` | Dashboards + importação + gestão de usuários |

### Variável de ambiente obrigatória para auth

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...   # server-side apenas — nunca expor ao client
```

---

## 10. Pré-requisitos

Antes de rodar o projeto localmente, garanta que você possui:

- **Node.js** instalado
- **npm**
- um projeto Supabase acessível
- credenciais válidas do Supabase
- migrations aplicadas no banco
- bucket configurado para receber os CSVs

---

## 11. Instalação

Na raiz do projeto:

```bash
npm ci
```

Se necessário, pode usar:

```bash
npm install
```

---

## 12. Variáveis de ambiente

Crie um arquivo `.env.local` a partir de `.env.example`.

No PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Preencha com as credenciais reais do seu ambiente Supabase.

Exemplo base:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_SIAFE_IMPORTS_BUCKET=siafe-imports
```

### Significado das variáveis

- `NEXT_PUBLIC_SUPABASE_URL`: URL do projeto Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: chave pública
- `SUPABASE_SERVICE_ROLE_KEY`: chave server-side usada na importação
- `SUPABASE_SIAFE_IMPORTS_BUCKET`: bucket utilizado para armazenar os CSVs originais

---

## 13. Banco e migrations

O projeto depende de migrations SQL presentes em:

- `supabase/migrations/`

Aplique as migrations no seu projeto Supabase antes de testar uploads reais.

> Observação: o repositório não mantém bootstrap local versionado do Supabase CLI. O setup costuma depender de um projeto Supabase já existente.

Durante a transição, algumas migrations ou estruturas existentes podem ainda refletir nomes legados como `NE_DL`, `DL_OB`, `normalized_ne_dl_rows` e `normalized_dl_ob_rows`. A direção documentada para novos ciclos está nos arquivos em `docs/`.

---

## 14. Como rodar localmente

Na raiz do projeto:

```bash
npm run dev
```

Depois acesse:

```text
http://localhost:3000
```

---

## 15. Como validar que a aplicação subiu

Sinais esperados:

- a aplicação abre no navegador;
- a rota principal responde;
- a interface de upload aparece;
- não há erro de build no terminal;
- a rota `/api/imports` compila normalmente.

---

## 16. Testes automatizados

Para executar os testes atuais:

```bash
npm test
```

Para validar o build:

```bash
npm run build
```

---

## 17. Teste manual de upload

### 1. Suba a aplicação

```bash
npm run dev
```

### 2. Acesse a interface

```text
http://localhost:3000
```

### 3. Escolha

- tipo de relatório;
- ano de referência;
- arquivo CSV correspondente.

### 4. Faça o upload

### 5. Valide no Supabase

Após o envio, confira:

#### Batch

```sql
select *
from import_batches
order by created_at desc;
```

#### Normalizados NE

```sql
select *
from normalized_ne_rows
order by created_at desc
limit 50;
```

#### Normalizados NEDL

```sql
select *
from normalized_nedl_rows
order by created_at desc
limit 50;
```

#### Normalizados DLOB

```sql
select *
from normalized_dlob_rows
order by created_at desc
limit 50;
```

#### Views

```sql
select * from vw_active_import_batches;
select * from vw_ne_active limit 50;
select * from vw_nedl_active limit 50;
select * from vw_dlob_active limit 50;
select * from vw_liquidados_a_pagar limit 50;
select * from vw_monitoramento_pagamentos limit 50;
```

#### Storage

Verifique se o arquivo foi salvo no bucket configurado.

---

## 18. Evolução atual da ingestão

A frente atual é a reestruturação Supabase para os três universos `NE`, `NEDL` e `DLOB`.

Direção atual:

- formalizar o contrato dos 9 CSVs;
- reestruturar tipos e batches para os três universos;
- criar tabelas normalizadas por universo;
- adaptar o pipeline de ingestão Next.js;
- criar views ativas;
- criar views de BI;
- criar views de qualidade e auditoria;
- validar operacionalmente com os 9 CSVs;
- endurecer a operação após validação.

O roadmap ativo está em:

- `docs/roadmap_reestruturacao_supabase.md`
- `docs/roadmap_reestruturacao_supabase_tasks.md`

A frente de autenticação e controle de acesso com Supabase Auth está implementada (AUTH-01 a AUTH-05). O sistema exige login para acessar qualquer dashboard, restringe importações a admins e oferece tela de gestão de usuários em `/dashboard/admin/usuarios`. Detalhes em `docs/auth-access-control.md`.

---

## 19. Restrições de escopo atuais

Salvo solicitação explícita, não considerar como parte do escopo atual:

- consolidação canônica física completa;
- materialized views como primeira estratégia;
- implementação de autenticação fora dos incrementos planejados (AUTH-01 a AUTH-05 já concluídos; AUTH-06 em andamento);
- UI administrativa de schemas;
- integração direta com sistemas externos;
- troca de stack;
- refatoração ampla fora do incremento ativo.

---

## 20. Boas práticas para continuidade

Ao continuar o projeto:

- leia `docs/AGENTS.md`;
- leia `docs/estrutura_relatorios.md`;
- leia `docs/auth-access-control.md` quando a rodada envolver autenticação ou permissões;
- leia `docs/roadmap_reestruturacao_supabase.md`;
- leia `docs/roadmap_reestruturacao_supabase_tasks.md`;
- preserve a política de `2026`;
- preserve a regra de que `DLOB` não possui `NUMERO_PROCESSO`;
- faça mudanças incrementais;
- evite refatorações amplas sem necessidade;
- execute `npm test` e `npm run build` sempre que possível em rodadas funcionais.

---

## 21. Resumo rápido

### Para instalar

```bash
npm ci
```

### Para configurar ambiente

```powershell
Copy-Item .env.example .env.local
```

### Para subir localmente

```bash
npm run dev
```

### Para testar

```bash
npm test
npm run build
```

---

## 22. Observação final

Este README deve ser atualizado sempre que houver mudanças relevantes no estado do projeto, no fluxo de ingestão, na forma de execução local ou na estratégia de evolução documentada em `docs/`.
