# ETAPA 2 DO DESENVOLVIMENTO

# Especificação de Desenvolvimento - Módulo CPAG

## Objetivo
Implementar a tela do Dashboard CPAG (`app/dashboard/dppc/cpag/page.js`) com dados reais do Supabase, funcionalidades de filtro, seleção de linhas, calculadora de saldo e exportação (XLSX/PDF).

## Checklist de Tarefas

- [x] **TASK 1: Estrutura Base e UI**
  - Refatorar `page.js` para incluir o Banner de "Controle de Recursos".
  - Criar o esqueleto visual das duas tabelas principais: "Liquidados a Pagar" e "Monitoramento de Pagamentos".
  - Criar a área lateral de "Relatórios" e "Painel de Indicadores".

- [x] **TASK 2: Mock Data e Renderização**
  - Criar os arrays `mockLiquidados` e `mockMonitoramento` com registros realistas.
  - Preencher as tabelas com esses dados.
  - Formatar moedas para BRL e datas para pt-BR.

- [x] **TASK 3: Exportação de Relatórios (XLSX e PDF)**
  - Dependências instaladas: `xlsx`, `jspdf`, `jspdf-autotable`.
  - Implementadas as funções de download em `components/cpag-export-buttons.jsx`.
  - XLSX com 2 abas: "Liquidados a Pagar" e "Monitoramento".
  - PDF landscape A4 com cabeçalho SIMF/SEDUC-PA e tabelas via autoTable.

- [x] **TASK 4: Conexão com Dados Reais**
  - Mock data removido.
- Dados reais consumidos via Supabase das views `vw_liquidados_a_pagar` e `vw_monitoramento_pagamentos`.
  - KPIs calculados com dados reais: Total Pago, Total a Pagar, Quantidade de OBs.
- Tabela "Liquidados a Pagar": mostra todas as DLs com saldo pendente, inclusive pagamento parcial, em todos os exercícios.
- Tabela "Monitoramento": mostra OBs emitidas com status de confirmação manual.

- [x] **TASK 5: Seleção de Linhas e Calculadora de Saldo**
  - Hook `useRowSelection` em `lib/hooks/useRowSelection.js`.
  - Componente `LiquidadosTable` com checkboxes, seleção individual e total.
  - Componente `SelectionCalculator` fixo no rodapé com total selecionado em destaque.
  - Update otimista no `PaymentToggle` com rollback em caso de erro.

- [x] **TASK 6: Server Action de Marcação Manual**
  - `app/actions/pagamentos.js` com `toggleMarcacaoPagamento` e `fetchAllCpagExportData`.
  - Upsert em `marcacoes_pagamento` com `revalidatePath`.

## Mapeamento de Colunas (view → tabela)

### Liquidados a Pagar (vw_liquidados_a_pagar — base: NEDL)
| Coluna UI | Campo da view |
|---|---|
| Processo | `numero_processo` |
| Empenho | `codigo_nota_empenho` |
| Credor | `credor` |
| Natureza | `codigo_natureza_despesa` |
| Fonte | `fonte` |
| DL | `documento_liquidacao` |
| Dt. Liquidação | `data_liquidacao` |
| Pago em OBs | `valor_ja_pago_obs` |
| Vl. Líquido | `valor_liquido` |
| Vl. Bruto | `valor_bruto` |
| Vl. Imposto | `valor_bruto - valor_liquido` (calculado no frontend) |
| A Pagar | `valor_liquidado_a_pagar` |

### Monitoramento de Pagamentos (vw_monitoramento_pagamentos — base: DLOB)
| Coluna UI | Campo da view |
|---|---|
| Processo | `numero_processo` |
| Credor | `credor` |
| Fonte | `fonte` |
| DL | `documento_liquidacao` |
| Dt. Liquidação | `data_liquidacao` |
| OB | `ordem_bancaria` |
| Data Pgto | `data_pagamento` |
| Valor | `valor` |
| Status | `confirmado_manualmente` (PaymentToggle) |
