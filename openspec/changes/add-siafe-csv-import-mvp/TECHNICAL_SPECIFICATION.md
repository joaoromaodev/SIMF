# Documentação Técnica - SIMF (Sistema Integrado de Monitoramento Financeiro)

## Visão Geral
O SIMF é um sistema web desenvolvido com Next.js (App Router), utilizando Supabase como backend/DB e Tailwind CSS para estilização. O sistema gerencia dados financeiros do SIAFE (Sistema Integrado de Administração Financeira para Estados), focando em relatórios de NE+DL (Notas de Empenho + Documentos de Liquidação) e DL+OB (Documentos de Liquidação + Ordens Bancárias).

## Mapa de Rotas

### Estrutura do Next.js App Router
As rotas são definidas pela estrutura de pastas em `app/`, seguindo o padrão do Next.js 13+ App Router.

#### Páginas Implementadas

1. **/** (Página Inicial)
   - **Arquivo**: `app/page.js`
   - **Componente**: `HomePage`
   - **Descrição**: Portal principal com cards de navegação para os módulos DFIN, DPPC e Gestão de Dados.
   - **Links**:
     - `/dashboard/dfin` (Diretoria de Finanças)
     - `/dashboard/dppc` (Pagamento e Prestação de Contas)
     - `/dashboard/import` (Atualização de Base)

2. **/dashboard** (Layout do Dashboard)
   - **Arquivo**: `app/dashboard/layout.js`
   - **Componente**: `DashboardLayout`
   - **Descrição**: Layout compartilhado para todas as páginas do dashboard, incluindo sidebar colapsível com navegação institucional.
   - **Sidebar Links**:
     - `/dashboard/dppc/cliq` (CLIQ - Controle de Liquidações)
     - `/dashboard/dppc/cpag` (CPAG - Controle de Pagamentos)
     - `/dashboard/import` (Atualizar Base)

3. **/dashboard/dppc** (Hub DPPC)
   - **Arquivo**: `app/dashboard/dppc/page.js`
   - **Componente**: `DPPCHubPage`
   - **Descrição**: Página hub para a Diretoria de Pagamento e Prestação de Contas, com cards de navegação para CLIQ e CPAG.

4. **/dashboard/dppc/cpag** (Dashboard CPAG)
   - **Arquivo**: `app/dashboard/dppc/cpag/page.js`
   - **Componente**: `CpagDashboardPage`
   - **Descrição**: Dashboard de Controle de Pagamentos (Ordens Bancárias), exibindo KPIs, gráficos e tabela de ordens recentes.
   - **Funcionalidades**:
     - KPIs: Total Efetivamente Pago, Quantidade de Ordens Bancárias, Total de Liquidações a Pagar
     - Gráficos: Distribuição por Fonte de Recurso (Pizza) e por Categoria (Barra)
     - Tabela: Últimas 10 ordens bancárias

#### APIs Implementadas

1. **POST /api/imports**
   - **Arquivo**: `app/api/imports/route.js`
   - **Descrição**: Endpoint para upload e processamento de arquivos CSV do SIAFE.
   - **Parâmetros** (FormData):
     - `file`: Arquivo CSV (obrigatório)
     - `reportType`: Tipo de relatório ("NE+DL" ou "DL+OB")
     - `yearScope`: Ano de referência ("2023_2024", "2025", "2026")
   - **Resposta**: JSON com status do processamento ou erros

## Componentes React

### CpagCharts
- **Arquivo**: `components/cpag-charts.jsx`
- **Tipo**: Client Component ("use client")
- **Props**:
  - `sourceData`: Array de objetos `{name: string, value: number}` - Dados para gráfico de distribuição por fonte de recurso
  - `categoryData`: Array de objetos `{name: string, value: number}` - Dados para gráfico de distribuição por categoria
- **Responsabilidades**:
  - Renderiza dois gráficos usando Recharts: Pizza (Donut) para fontes e Barra para categorias
  - Formatação de moeda brasileira (BRL)
  - Tooltips customizados com valores e percentuais
  - Layout responsivo (grid-cols-1 lg:grid-cols-2)

### UploadForm
- **Arquivo**: `components/upload-form.jsx`
- **Tipo**: Client Component ("use client")
- **Props**: Nenhuma (componente autocontido)
- **Estado Interno**:
  - `status`: Objeto com estado do upload (`{kind: "success"|"error", payload: {...}}`)
  - `submitting`: Boolean para controle de loading
- **Responsabilidades**:
  - Formulário para upload de CSV do SIAFE
  - Selects para tipo de relatório (NE+DL, DL+OB) e ano de referência
  - Input file com accept=".csv,text/csv"
  - Submissão via fetch para `/api/imports`
  - Exibição de status de sucesso/erro com mensagens detalhadas

## Data Schema (Mock Data)

### Schema do MockCpagData
Baseado no mock data implementado em `app/dashboard/dppc/cpag/page.js`, o schema dos dados de Ordens Bancárias (CPAG) é definido como:

```javascript
{
  ordem_bancaria: string,     // Ex: "2026160101OB00001" - Identificador único da ordem bancária
  contrato: string,           // Ex: "015/2026" - Número do contrato
  categoria: string,          // Ex: "ALUGUEL DE IMÓVEIS" - Categoria da despesa
  credor: string,             // Ex: "ENOQUE COSTA DO NASCIMENTO" - Nome do credor/fornecedor
  data: string,               // Ex: "2026-01-15" - Data do pagamento (formato YYYY-MM-DD)
  valor: number,              // Ex: 25000.00 - Valor em reais (float)
  descricao: string,          // Ex: "Pagamento referente a medição 03" - Descrição da transação
  fonte_recurso: string       // Ex: "TESOURO ESTADUAL" - Fonte de recurso do pagamento
}
```

### Campos Obrigatórios
Todos os campos são opcionais no mock data atual, mas em produção devem ser validados.

### Tipos de Dados Inferidos
- **Strings**: ordem_bancaria, contrato, categoria, credor, descricao, fonte_recurso
- **Number**: valor (float com 2 casas decimais)
- **Date**: data (representado como string no formato ISO YYYY-MM-DD)

### Relacionamentos
- `documento_liquidacao`: Chave de ligação entre relatórios (conforme regras de negócio)
- Hierarquia: Processo > NE (Empenho) > DL (Liquidação) > OB (Ordem Bancária)

## Regras de Negócio Implementadas
1. **Hierarquia**: Processo > NE > DL > OB
2. **Chave de Ligação**: Relatórios se cruzam pelo `documento_liquidacao`
3. **Política 2026**: Uploads do ano de 2026 substituem integralmente os dados anteriores do mesmo tipo/ano
4. **Persistência**: Primeiro salva CSV bruto no Storage, depois normaliza em tabelas `normalized_ne_dl_rows` ou `normalized_dl_ob_rows`

## Tecnologias Utilizadas
- **Frontend**: Next.js 13+ (App Router), React, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase (Postgres + Storage)
- **Charts**: Recharts
- **Validação**: Schemas customizados em `lib/siafe/schemas.js`
- **Processamento**: Lógica em `lib/siafe/importer.js`, `normalize.js`, `validation.js`

## Próximos Passos
- Implementar páginas CLIQ (`/dashboard/dppc/cliq`)
- Conectar dados reais do Supabase (atualmente usando mock data)
- Implementar autenticação/autorização
- Adicionar testes automatizados
- Expandir validações e tratamento de erros