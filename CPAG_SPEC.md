# ETAPA 2 DO DESENVOLVIMENTO



# Especificação de Desenvolvimento - Módulo CPAG

## Objetivo
Implementar a tela do Dashboard CPAG (`app/dashboard/dppc/cpag/page.js`) com dados estáticos (Mock) e funcionalidades reais de filtro e exportação (XLSX/PDF) para validação da diretoria.

## Checklist de Tarefas (Copilot, execute uma por vez quando solicitado)

- [x] **TASK 1: Estrutura Base e UI**
  - Refatorar `page.js` para incluir o Banner de "Controle de Recursos" (simulando a planilha do Franz/Cláudia).
  - Criar o esqueleto visual das duas tabelas principais: "Liquidados a Pagar" e "Monitoramento de Pagamentos".
  - Criar o esqueleto da área lateral/inferior de "Relatórios".

- [x] **TASK 2: Mock Data e Renderização**
  - Criar os arrays `mockLiquidados` e `mockMonitoramento` com 5 a 10 registros realistas cada.
  - Preencher as tabelas da Task 1 com esses dados.
  - Formatar moedas para BRL e datas para pt-BR.


- [ ] **TASK 3: Exportação de Relatórios (XLSX e PDF)**
  - Instalar dependências necessárias (informar o usuário para rodar `npm install xlsx jspdf jspdf-autotable`).
  - Implementar as funções de download nos botões da área "Geração de Relatórios".
  - O download deve gerar arquivos reais (.xlsx e .pdf) contendo os dados do mock cruzando "Pago vs A Pagar".