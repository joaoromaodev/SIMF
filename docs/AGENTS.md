# AGENTS.md

## 1. Visão geral do projeto

**SIMF** é uma aplicação para ingestão, validação, normalização e persistência de relatórios CSV do SIAFE, com foco em preparar uma base consistente para consolidação e consumo posterior em BI.

A stack atual do projeto é:

- **Next.js**
- **Supabase**
- **Postgres**
- **Supabase Storage**

O projeto está em fase de evolução incremental. A fundação da ingestão já existe e está funcional. A próxima linha de trabalho está concentrada na flexibilização controlada da ingestão e na preparação da base para suportar novos relatórios no futuro.

---

## 2. O que o projeto é

O SIMF, no estado atual, é:

- uma plataforma de upload manual de arquivos `.csv`;
- uma camada de validação estrutural e operacional dos relatórios SIAFE;
- uma camada de parsing e normalização dos dados;
- uma camada de persistência de batches de importação;
- uma camada de persistência de linhas normalizadas por relatório;
- uma base para futura consolidação canônica e uso em BI.

---

## 3. O que o projeto não é

O SIMF, no estado atual, **não é**:

- sistema transacional completo do fluxo financeiro;
- workflow administrativo;
- substituto do SIAFE;
- dashboard final;
- integração direta com API do SIAFE;
- plataforma com catálogo administrativo de schemas;
- engine genérica completa de qualquer tipo de relatório.

---

## 4. Estado atual da aplicação

Atualmente, o projeto já possui:

- upload manual de CSV;
- UI mínima para envio dos relatórios;
- rota de importação;
- parsing de CSV;
- validação de:
  - tipo de relatório;
  - nome do arquivo;
  - escopo anual;
  - estrutura/cabeçalhos;
- normalização;
- persistência de `import_batches`;
- persistência de:
  - `normalized_ne_dl_rows`
  - `normalized_dl_ob_rows`
- armazenamento do CSV original no Supabase Storage;
- política especial de substituição integral do `2026`;
- testes automatizados da fundação da ingestão.

Os tipos de relatório atualmente suportados são:

- `NE_DL`
- `DL_OB`

---

## 5. Diretrizes arquiteturais obrigatórias

Ao trabalhar neste projeto, preserve os seguintes princípios:

### 5.1 Flexibilidade na entrada, disciplina no domínio
O sistema pode evoluir para aceitar maior flexibilidade nos arquivos de entrada, mas o domínio interno deve continuar normalizado e canônico.

### 5.2 Preservar o domínio canônico
Campos internos como:
- `numero_processo`
- `codigo_nota_empenho`
- `documento_liquidacao`
- `ordem_bancaria`

continuam sendo a base do modelo de negócio.

### 5.3 Preservar rastreabilidade
Toda mudança na ingestão deve manter:
- batch de importação;
- armazenamento do arquivo original;
- visibilidade suficiente para troubleshooting;
- comportamento auditável.

### 5.4 Preservar a política anual
A política de ano deve continuar sendo respeitada:

- `2023_2024` e `2025` como históricos estáticos;
- `2026` como escopo ativo com substituição integral por tipo.

### 5.5 Não expandir escopo sem solicitação clara
Mudanças devem ser incrementais e focadas no objetivo do ciclo atual.

---

## 6. Fluxo de evolução atual

O projeto **não utiliza mais OpenSpec** como fluxo de trabalho.

As referências atuais para evolução estão em `docs/`.

Use como base principal:

- `docs/simf-evolucao-ingestao-incrementos.md`
- `docs/simf-evolucao-ingestao-tasks.md`

Esses arquivos definem:
- a estratégia de evolução da ingestão;
- os incrementos previstos;
- o escopo do incremento atual;
- as tasks operacionais em andamento.

---

## 7. Incremento atual

Salvo instrução em contrário, considere que o projeto está trabalhando no:

## Incremento 1 — Flexibilização controlada dos 2 relatórios atuais

Objetivo:
- permitir ordem livre de colunas;
- separar campos obrigatórios e opcionais;
- aceitar aliases conhecidos;
- permitir colunas extras com warning;
- preservar a fundação atual da ingestão.

Este incremento **não** inclui:
- novos relatórios;
- catálogo em banco;
- UI administrativa;
- versionamento persistido de schema;
- consolidação canônica;
- dashboards;
- autenticação.

---

## 8. Arquivos-chave do projeto

Antes de alterar qualquer coisa, inspecione com prioridade:

- `README.md`
- `docs/simf-evolucao-ingestao-incrementos.md`
- `docs/simf-evolucao-ingestao-tasks.md`
- `package.json`
- `app/api/imports/route.js`
- `components/upload-form.jsx`
- `lib/siafe/csv.js`
- `lib/siafe/importer.js`
- `lib/siafe/normalize.js`
- `lib/siafe/schemas.js`
- `lib/siafe/validation.js`
- `tests/siafe-import.test.js`
- `supabase/migrations/`

---

## 9. Regras para agentes

### 9.1 Antes de implementar
O agente deve:
- ler o `README.md`;
- ler os arquivos relevantes em `docs/`;
- entender o incremento atual;
- inspecionar os arquivos impactados antes de modificar;
- identificar o menor conjunto de mudanças necessário.

### 9.2 Durante a implementação
O agente deve:
- fazer a menor mudança coerente possível;
- preservar o que já funciona;
- evitar refatorações amplas sem necessidade;
- evitar expansão de escopo;
- manter compatibilidade com a política de `2026`;
- preservar a persistência atual, salvo instrução contrária.

### 9.3 Ao concluir
O agente deve informar:
- diagnóstico do problema ou objetivo implementado;
- arquivos alterados;
- motivo das alterações;
- validações executadas;
- riscos residuais ou pendências.

---

## 10. Restrições de escopo

Sem solicitação clara, **não implementar**:

- novos relatórios fora do incremento atual;
- catálogo administrativo de schemas;
- UI administrativa para aliases;
- consolidação canônica completa;
- tabelas `processos`, `notas_empenho`, `documentos_liquidacao`, `ordens_bancarias`;
- `consolidated_siafe_lineage`;
- dashboard final;
- autenticação avançada;
- integrações externas novas;
- troca de stack;
- refatoração estrutural ampla sem necessidade operacional imediata.

---

## 11. Convenções de implementação

### 11.1 Preferir evolução incremental
Sempre preferir:
- adaptação do pipeline atual;
- compatibilidade progressiva;
- mudanças pequenas e verificáveis.

### 11.2 Evitar lógica mágica
Não introduzir inferência excessiva ou heurísticas frágeis para “adivinhar” relatórios ou campos sem controle explícito.

### 11.3 Flexibilizar com governança
Ao flexibilizar a ingestão:
- warnings devem ser claros;
- erros bloqueantes devem continuar explícitos;
- aliases devem ser controlados;
- colisões de mapeamento devem ser tratadas com segurança.

### 11.4 JSON não deve virar substituto do domínio
Se no futuro houver `extra_fields_json` ou equivalente, tratá-lo como:
- buffer de evolução;
- área de retenção;
- apoio à observabilidade;

e não como modelo principal de consulta operacional.

---

## 12. Validação obrigatória

Sempre que possível, validar com:

```bash
npm test
npm run build
```

Quando o ciclo envolver upload:
- validar manualmente o fluxo local, se possível;
- confirmar comportamento no batch;
- confirmar persistência nas tabelas corretas;
- confirmar preservação da política de `2026`, quando aplicável.

Se não for possível executar alguma validação por dependência externa, registrar claramente isso no relatório final.

---

## 13. Atualização de documentação e tasks

Quando um ciclo alterar o estado do incremento atual, o agente deve atualizar, quando fizer sentido:

- `docs/simf-evolucao-ingestao-tasks.md`

Especialmente para:
- marcar tarefas concluídas;
- registrar observações de implementação;
- refletir decisões fechadas durante o ciclo.

Se houver mudança relevante de direção arquitetural, avaliar também atualização de:

- `docs/simf-evolucao-ingestao-incrementos.md`

---

## 14. Observações finais

Este arquivo existe para alinhar o comportamento de agentes técnicos no repositório.

Ao atuar neste projeto, o agente deve sempre buscar:

- clareza de escopo;
- preservação do que já funciona;
- respeito às regras de negócio;
- continuidade técnica;
- e baixa taxa de regressão.
