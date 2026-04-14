# SIMF

Sistema para ingestão, validação, normalização e persistência de relatórios CSV do SIAFE, preparando uma base consistente para consolidação posterior e consumo em BI.

---

## 1. Visão geral

O **SIMF** é uma aplicação construída com:

- **Next.js**
- **Supabase**
- **Postgres**
- **Supabase Storage**

O foco atual do projeto é a **camada de ingestão** de relatórios CSV do SIAFE.

Nesta fase, o sistema já contempla:

- upload manual de arquivos `.csv`;
- validação operacional e estrutural dos relatórios;
- parsing de CSV;
- normalização de dados;
- persistência de batches de importação;
- persistência de linhas normalizadas;
- armazenamento do arquivo original no Supabase Storage;
- política especial de substituição integral dos dados ativos de `2026`.

---

## 2. O que o projeto é

O SIMF, no estado atual, é:

- uma plataforma de ingestão de arquivos CSV do SIAFE;
- uma camada de validação e normalização;
- uma camada de persistência de batches;
- uma base para futura consolidação canônica;
- uma base de dados para posterior consumo em BI.

---

## 3. O que o projeto não é

Neste momento, o SIMF **não é**:

- um sistema transacional completo do fluxo financeiro;
- um workflow administrativo;
- um substituto do SIAFE;
- um dashboard final;
- uma integração direta com a API do SIAFE;
- uma plataforma com UI administrativa de schemas de relatório.

---

## 4. Estado atual da aplicação

Atualmente, o projeto já possui:

- upload manual de CSV;
- formulário de envio no frontend;
- rota de importação;
- parsing de CSV;
- validação de:
  - tipo de relatório;
  - nome do arquivo;
  - escopo anual;
  - estrutura do CSV;
- persistência de:
  - `import_batches`
  - `normalized_ne_dl_rows`
  - `normalized_dl_ob_rows`
- armazenamento do arquivo original no Storage;
- política de substituição integral para o `2026`;
- testes automatizados da fundação da ingestão.

Os tipos de relatório atualmente suportados são:

- `NE_DL`
- `DL_OB`

---

## 5. Política de arquivos e escopo anual

### Arquivos atualmente previstos

#### NEDL
- `2023_2024_NEDL.csv`
- `2025_NEDL.csv`
- `2026_NEDL.csv`

#### DLOB
- `2023_2024_DLOB.csv`
- `2025_DLOB.csv`
- `2026_DLOB.csv`

### Política por escopo anual

- `2023_2024` e `2025` são tratados como históricos estáticos;
- `2026` é tratado como escopo ativo;
- cada novo upload válido de `2026` substitui integralmente o batch ativo anterior do mesmo tipo.

---

## 6. Estrutura principal do projeto

Arquivos e diretórios centrais:

- `app/`
- `components/`
- `lib/siafe/`
- `supabase/migrations/`
- `tests/`
- `docs/`
- `AGENTS.md`

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

## 7. Documentação complementar

A evolução atual da ingestão está documentada em:

- `docs/simf-evolucao-ingestao-incrementos.md`
- `docs/simf-evolucao-ingestao-tasks.md`

Além disso, o repositório possui:

- `AGENTS.md`

Esses arquivos devem ser usados como referência principal para continuidade técnica, definição de escopo e atuação de agentes de desenvolvimento.

> Observação: o projeto **não utiliza mais OpenSpec** como fluxo de trabalho.

---

## 8. Pré-requisitos

Antes de rodar o projeto localmente, garanta que você possui:

- **Node.js** instalado
- **npm**
- um projeto Supabase acessível
- credenciais válidas do Supabase
- migrations aplicadas no banco
- bucket configurado para receber os CSVs

---

## 9. Instalação

Na raiz do projeto:

```bash
npm ci
```

Se necessário, pode usar:

```bash
npm install
```

---

## 10. Variáveis de ambiente

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

## 11. Banco e migrations

O projeto depende de migrations SQL presentes em:

- `supabase/migrations/`

Aplique as migrations no seu projeto Supabase antes de testar uploads reais.

Ordem mínima esperada:

1. `supabase/migrations/20260330160000_add_siafe_import_tables.sql`
2. `supabase/migrations/20260330173000_harden_siafe_active_year_replacement.sql`

Essas migrations devem preparar, entre outros elementos:

- `import_batches`
- `normalized_ne_dl_rows`
- `normalized_dl_ob_rows`
- bucket de uploads
- função de finalização do batch ativo de `2026`

> Observação: o repositório não mantém bootstrap local versionado do Supabase CLI. O setup costuma depender de um projeto Supabase já existente.

---

## 12. Como rodar localmente

Na raiz do projeto:

```bash
npm run dev
```

Depois acesse:

```text
http://localhost:3000
```

---

## 13. Como validar que a aplicação subiu

Sinais esperados:

- a aplicação abre no navegador;
- a rota principal responde;
- a interface de upload aparece;
- não há erro de build no terminal;
- a rota `/api/imports` compila normalmente.

---

## 14. Testes automatizados

Para executar os testes atuais:

```bash
npm test
```

Para validar o build:

```bash
npm run build
```

---

## 15. Teste manual de upload

### 1. Suba a aplicação
```bash
npm run dev
```

### 2. Acesse a interface
```text
http://localhost:3000
```

### 3. Escolha:
- tipo de relatório
- ano de referência
- arquivo CSV correspondente

### 4. Faça o upload

### 5. Valide no Supabase
Após o envio, confira:

#### Batch
```sql
select *
from import_batches
order by created_at desc;
```

#### Normalizados NEDL
```sql
select *
from normalized_ne_dl_rows
order by created_at desc
limit 50;
```

#### Normalizados DLOB
```sql
select *
from normalized_dl_ob_rows
order by created_at desc
limit 50;
```

#### Storage
Verifique se o arquivo foi salvo no bucket configurado.

---

## 16. Evolução atual da ingestão

A próxima frente de trabalho do projeto é a evolução da ingestão para um modelo mais flexível.

### Direção atual
- aceitar colunas em ordem livre;
- diferenciar campos obrigatórios e opcionais;
- aceitar aliases conhecidos;
- permitir colunas extras com warning;
- preparar a base para novos relatórios no futuro.

### Situação atual
Essa evolução está organizada por incrementos em:

- `docs/simf-evolucao-ingestao-incrementos.md`
- `docs/simf-evolucao-ingestao-tasks.md`

---

## 17. Restrições de escopo atuais

Salvo solicitação explícita, não considerar como parte do escopo atual:

- consolidação canônica completa;
- dashboards;
- autenticação avançada;
- UI administrativa de schemas;
- novos relatórios fora do incremento atual;
- integração direta com sistemas externos.

---

## 18. Boas práticas para continuidade

Ao continuar o projeto:

- leia `AGENTS.md`;
- leia os arquivos em `docs/`;
- preserve a política de `2026`;
- faça mudanças incrementais;
- evite refatorações amplas sem necessidade;
- preserve o domínio canônico interno;
- execute `npm test` e `npm run build` sempre que possível.

---

## 19. Resumo rápido

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

## 20. Observação final

Este README deve ser atualizado sempre que houver mudanças relevantes no estado do projeto, no fluxo de ingestão, na forma de execução local ou na estratégia de evolução documentada em `docs/`.
