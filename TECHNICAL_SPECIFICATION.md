# Documentação Técnica - SIMF (Sistema Integrado de Monitoramento Financeiro)

## Visão Geral
O SIMF é um sistema web desenvolvido com Next.js (App Router), utilizando Supabase como backend/DB e Tailwind CSS para estilização. O sistema gerencia dados financeiros do SIAFE, focando em relatórios de NE+DL (Notas de Empenho + Documentos de Liquidação) e DL+OB (Documentos de Liquidação + Ordens Bancárias).

## Stack Técnica
- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS v4
- **Backend**: Next.js API Routes, Supabase (Postgres + Storage)
- **Charts**: Recharts
- **Ícones**: lucide-react
- **Exportação**: xlsx, jspdf, jspdf-autotable
- **Validação e Processamento**: schemas customizados em `lib/siafe/`

## Mapa de Rotas

### Páginas Implementadas

| Rota | Arquivo | Descrição |
|---|---|---|
| `/` | `app/page.js` | Portal principal — cards de navegação para os módulos |
| `/dashboard/dppc` | `app/dashboard/dppc/page.js` | Hub DPPC com cards para CLIQ e CPAG |
| `/dashboard/dppc/cpag` | `app/dashboard/dppc/cpag/page.js` | Dashboard de Controle de Pagamentos |
| `/dashboard/dppc/cliq` | `app/dashboard/dppc/cliq/page.js` | Dashboard de Controle de Liquidações |
| `/dashboard/dfin` | `app/dashboard/dfin/page.js` | Hub DFIN — em construção |
| `/dashboard/import` | `app/dashboard/import/page.js` | Upload de relatórios CSV do SIAFE |

### APIs Implementadas

**POST /api/imports**
- Arquivo: `app/api/imports/route.js`
- Parâmetros (FormData): `file`, `reportType` ("NE+DL" ou "DL+OB"), `yearScope` ("2023_2024", "2025", "2026")
- Resposta: JSON com status, batch e warnings

## Arquitetura de Dados

### Hierarquia de Negócio

Processo > NE (Empenho) > DL (Liquidação) > OB (Ordem Bancária)

Chave de ligação entre relatórios: `documento_liquidacao`

### Tabelas Normalizadas (fonte)
- `normalized_ne_dl_rows` — linhas do relatório NE+DL
- `normalized_dl_ob_rows` — linhas do relatório DL+OB

### Tabelas Canônicas
- `processos`
- `notas_empenho`
- `documentos_liquidacao`
- `ordens_bancarias`
- `marcacoes_pagamento` — confirmação manual de pagamento pelo usuário

### Views de Negócio
- `vw_liquidados_a_pagar` — DLs sem OB correspondente (todos os exercícios)
- `vw_monitoramento_pagamentos` — OBs emitidas com status de confirmação

### Materialized View
- `consolidated_siafe_lineage` — linhagem consolidada para BI (refresh via `consolidate_siafe_lineage()`)

## Política de Importação
- `2023_2024` e `2025`: históricos estáticos, imutáveis após primeiro upload
- `2026`: escopo ativo, cada novo upload substitui integralmente o batch anterior do mesmo tipo

## Formato dos Relatórios CSV

### NEDL — campos principais
`DocumentodeLiquidacao, CodigoNotadeEmpenho, CodigoNaturezaDaDespesa, CodigoFonteDeRecurso, CodigoDetalhamentoFr, NUMERO_PROCESSO, CodigoProjetoAtividade, InstituicaoCodigoUnidadeGestora, Credor_Nome (alias: NomeCredor), CONTRATO, CONVENIO, Valor Original, Valor Liquido, Valor Bruto, Valor Retido, Valor Pago, Valor Liquidado a Pagar, Valor Liquido2`

Obrigatórios: `DocumentodeLiquidacao`, `CodigoNotadeEmpenho`, `NUMERO_PROCESSO`

### DLOB — campos principais
`OrdemBancaria, CredorDocumento, Credor_Nome, DatadoPagamento, CodigoFonteDeRecurso, CodigoDetalhamentoFr, DocumentodeLiquidacao, NUMERO_PROCESSO, CodigoUnidadeGestora, CodigoProjetoAtividade, CodigoNaturezaDaDespesa, NomeNaturezaDaDespesa, NomeElementoDeDespesa, Valor`

Obrigatórios: `DocumentodeLiquidacao`, `NUMERO_PROCESSO`

**Formato dos valores monetários**: `R$ 6,092.04` (símbolo + separador de milhar vírgula + decimal ponto)

## Componentes Principais

### Server Components
- `app/dashboard/dppc/cpag/page.js` — busca dados de `vw_liquidados_a_pagar` e `vw_monitoramento_pagamentos`
- `app/dashboard/dppc/cliq/page.js` — busca dados de `vw_liquidados_a_pagar` com filtros e paginação

### Client Components
- `components/liquidados-table.jsx` — tabela com seleção de linhas e calculadora de saldo
- `components/selection-calculator.jsx` — barra flutuante com total selecionado
- `components/payment-toggle.jsx` — botão de confirmação manual com update otimista
- `components/cpag-export-buttons.jsx` — exportação XLSX e PDF
- `components/upload-form.jsx` — formulário de upload de CSV

### Hooks e Utilitários
- `lib/hooks/useRowSelection.js` — gerenciamento de seleção de linhas
- `lib/utils/formatters.js` — `formatCurrency` e `formatDate`
- `app/actions/pagamentos.js` — Server Actions para marcação de pagamento e exportação

## Próximos Passos
- Autenticação e autorização de usuários
- Filtros por período no CPAG
- Paginação no CPAG (atualmente limitado a 100 registros)
- Reimportar históricos com nova estrutura de colunas quando disponível
- Conectar CLIQ com dados reais de `vw_liquidados_a_pagar` com filtro de credor por fonte
