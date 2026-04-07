# Questões Semânticas e de Negócio - MVP SIAFE

Durante a implementação do Apply 1 e Apply 2, mapeamos as seguintes definições pendentes com a área de negócio:

### 1. Divergência de Valores Líquidos
- **Questão**: Qual a diferença prática de uso entre `valor_liquido` e `valor_liquido_2` nos relatórios NE+DL?
- **Status**: Atualmente o sistema preserva ambos, mas a regra de BI deve priorizar um deles para o cálculo de saldo.

### 2. Gatilho de Consolidação (Performance)
- **Questão**: A automação atual reconstrói a fita de BI (`consolidated_siafe_lineage`) a cada upload de 2026.
- **Status**: Se o volume de dados crescer demais, devemos avaliar se a consolidação deve ser agendada (ex: uma vez por dia) em vez de disparada por transação.

### 3. Tratamento de Caracteres Especiais (Municípios)
- **Questão**: Municípios como 'Pau D'Arco' exigem normalização para 'Pau Darco' para match de busca.
- **Status**: Implementado via script auxiliar, mas requer validação se outros nomes de municípios seguem esse padrão de aspas/acentos.
