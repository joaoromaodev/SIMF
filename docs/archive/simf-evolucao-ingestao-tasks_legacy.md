# SIMF — Tasks da Evolução da Ingestão

## 1. Finalidade deste documento

Este documento registra as tarefas operacionais da evolução da ingestão do SIMF.

Seu objetivo é servir como checklist técnico de execução, revisão e acompanhamento do trabalho, especialmente no contexto da implementação incremental da flexibilização dos relatórios atuais.

Este arquivo deve ser atualizado conforme a evolução das tarefas, preferencialmente mantendo:
- tarefas concluídas;
- tarefas em andamento;
- tarefas pendentes;
- observações relevantes de implementação ou decisão.

Este documento complementa:
- `docs/simf-evolucao-ingestao-incrementos.md`
- os artefatos formais do OpenSpec

---

## 2. Estado atual

A fundação da ingestão já está implementada e funcional para os relatórios:

- `NE_DL`
- `DL_OB`

Também já existem:
- upload manual;
- validação de tipo, nome e escopo;
- parsing CSV;
- persistência de batch;
- persistência de linhas normalizadas;
- Storage;
- política de substituição do `2026`;
- testes automatizados da fundação.

A próxima frente de evolução é a implementação do **Incremento 1**, voltado para a flexibilização controlada dos dois relatórios atuais.

---

## 3. Escopo atual em execução

## Incremento 1 — Flexibilização controlada dos 2 relatórios atuais

### Objetivo do incremento
Permitir que `NE_DL` e `DL_OB` aceitem:
- colunas em qualquer ordem;
- colunas extras;
- aliases conhecidos;
- ausência de campos opcionais;

mantendo como erro bloqueante apenas a ausência dos campos mínimos obrigatórios por relatório.

---

## 4. Tasks do Incremento 1

## 4.1 Definição de comportamento e contrato

- [x] Confirmar e documentar os campos mínimos obrigatórios de `NE_DL`
- [x] Confirmar e documentar os campos opcionais de `NE_DL`
- [x] Confirmar e documentar os campos mínimos obrigatórios de `DL_OB`
- [x] Confirmar e documentar os campos opcionais de `DL_OB`
- [x] Confirmar se `ordem_bancaria` será tratada como opcional em `DL_OB`
- [x] Confirmar aliases conhecidos aceitos para os relatórios atuais
- [x] Confirmar política de colunas extras:
  - [x] permitir sem bloquear
  - [x] retornar warning
- [x] Confirmar tratamento de colisão de aliases como erro bloqueante

---

## 4.2 Evolução dos schemas em código

- [x] Evoluir `lib/siafe/schemas.js` para declarar:
  - [x] campos obrigatórios
  - [x] campos opcionais
  - [x] bindings preferenciais de cabeçalho
  - [x] aliases conhecidos
- [x] Manter compatibilidade com os tipos internos atuais:
  - [x] `NE_DL`
  - [x] `DL_OB`
- [x] Preservar `fileCode`, `label` e `normalizedTable`
- [x] Evitar expansão prematura para catálogo em banco

---

## 4.3 Resolução flexível de cabeçalhos

- [x] Criar etapa explícita de resolução de cabeçalhos
- [x] Implementar resolução por nome de coluna, sem dependência da ordem
- [x] Aplicar aliases conhecidos
- [x] Construir mapa canônico de índices por campo
- [x] Detectar campos obrigatórios ausentes
- [x] Detectar colunas desconhecidas
- [x] Detectar aliases aplicados
- [x] Detectar colisões de mapeamento e tratá-las como erro
- [x] Garantir compatibilidade com limpeza de BOM e parsing atual

---

## 4.4 Validação estrutural flexível

- [x] Revisar `lib/siafe/validation.js`
- [x] Remover dependência de ordem exata do header
- [x] Remover erro bloqueante por coluna extra
- [x] Permitir ausência de campos opcionais
- [x] Manter erro bloqueante por ausência de campo obrigatório
- [x] Melhorar a estrutura dos retornos de validação:
  - [x] erros bloqueantes
  - [x] warnings
  - [x] aliases aplicados
  - [x] colunas ignoradas
  - [ ] detalhes estruturados ricos na resposta da API

---

## 4.5 Normalização independente da ordem das colunas

- [x] Revisar `lib/siafe/normalize.js`
- [x] Fazer a normalização depender do mapa canônico resolvido
- [x] Preencher `null` para opcionais ausentes
- [x] Ignorar colunas extras sem bloquear
- [x] Preservar o mesmo output canônico atual
- [x] Preservar compatibilidade com:
  - [x] `normalized_ne_dl_rows`
  - [x] `normalized_dl_ob_rows`

---

## 4.6 Integração no pipeline de importação

- [x] Revisar `lib/siafe/importer.js`
- [x] Substituir validação rígida por resolução + validação mínima
- [x] Garantir que a nova flexibilidade não afete:
  - [x] `validateUploadSelection`
  - [x] criação de `import_batches`
  - [x] upload para Storage
  - [x] persistência nas tabelas atuais
  - [x] política de históricos
  - [x] política do `2026`
- [x] Garantir criação de failed batch quando faltarem campos obrigatórios

---

## 4.7 Retorno da API e observabilidade mínima

- [x] Revisar retorno da API de upload
- [x] Incluir warnings em respostas bem-sucedidas, quando houver
- [x] Incluir detalhes estruturados suficientes para troubleshooting
- [x] Manter compatibilidade com o frontend atual
- [x] Evitar excesso de verbosidade ou logs permanentes desnecessários

---

## 4.8 Ajustes de interface para warnings

- [x] Revisar `components/upload-form.jsx`
- [x] Garantir exibição de warnings quando o upload for bem-sucedido com flexibilização aplicada
- [x] Manter exibição clara dos erros bloqueantes
- [x] Não alterar o fluxo funcional do formulário além do necessário

---

## 4.9 Testes automatizados

### NE_DL
- [x] Adicionar teste para upload com colunas fora de ordem
- [x] Adicionar teste para upload com coluna extra
- [x] Adicionar teste aceitando `CodigoUnidadeGestora`
- [x] Adicionar teste aceitando `InstituicaoCodigoUnidadeGestora`
- [x] Adicionar teste falhando sem `DocumentodeLiquidacao`
- [x] Adicionar teste falhando sem `CodigoNotadeEmpenho`
- [x] Adicionar teste falhando sem `NUMERO_PROCESSO`

### DL_OB
- [x] Adicionar teste para upload com colunas fora de ordem
- [x] Adicionar teste para upload com coluna extra
- [x] Adicionar teste falhando sem `DocumentodeLiquidacao`
- [x] Adicionar teste falhando sem `NUMERO_PROCESSO`
- [x] Adicionar teste cobrindo `ordem_bancaria` opcional, se confirmado

### Pipeline
- [x] Validar que `processSiafeUpload` continua persistindo corretamente
- [x] Validar que o nome do arquivo continua sendo exigido
- [x] Validar que `yearScope` continua sendo respeitado
- [x] Validar que a política do `2026` continua intacta
- [x] Atualizar testes antigos que reflitam contrato rígido e não sejam mais compatíveis com o novo comportamento

---

## 4.10 Validação operacional do incremento

- [x] Executar `npm test`
- [x] Executar `npm run build`
- [ ] Validar upload manual de `NE_DL` com:
  - [ ] ordem diferente
  - [ ] coluna extra
  - [ ] alias conhecido
- [ ] Validar upload manual de `DL_OB` com:
  - [ ] ordem diferente
  - [ ] coluna extra
- [ ] Confirmar que uploads válidos continuam criando batches e persistindo linhas
- [ ] Confirmar que uploads inválidos por ausência de campo mínimo continuam falhando corretamente

---

## 5. Critérios de aceite do Incremento 1

O incremento será considerado concluído quando:

- [x] `NE_DL` aceitar ordem livre de colunas
- [x] `NE_DL` aceitar colunas extras sem bloquear
- [x] `NE_DL` aceitar aliases conhecidos
- [x] `NE_DL` aceitar ausência de opcionais
- [x] `NE_DL` falhar por ausência de obrigatórios mínimos
- [x] `DL_OB` aceitar ordem livre de colunas
- [x] `DL_OB` aceitar colunas extras sem bloquear
- [x] `DL_OB` aceitar ausência de opcionais
- [x] `DL_OB` falhar por ausência de obrigatórios mínimos
- [x] a política de `2026` permanecer intacta
- [x] o pipeline atual continuar funcional
- [x] `npm test` passar
- [x] `npm run build` passar

---

## 6. Restrições deste ciclo

Neste incremento, não implementar:

- novos relatórios;
- catálogo em banco;
- UI administrativa;
- versionamento persistido de schema;
- reformulação total da persistência;
- consolidação canônica;
- dashboards;
- autenticação;
- novas features fora da ingestão.

---

## 7. Observações para atualização contínua

Ao longo da implementação, registrar neste arquivo:

- decisões fechadas de negócio;
- tarefas concluídas;
- mudanças de escopo;
- riscos encontrados;
- eventuais dependências para o incremento seguinte.

Esse documento deve continuar enxuto, verificável e orientado à execução.

## 8. Observações de implementação

- `CodigoUnidadeGestora` passou a ser o header preferencial de `NE_DL`, mantendo `InstituicaoCodigoUnidadeGestora` como alias aceito com warning.
- Colunas extras agora são ignoradas com warning.
- Colisões entre headers que apontam para o mesmo campo canônico viraram erro estrutural bloqueante.
- A persistência atual, o upload ao Storage e a política de substituição integral de `2026` foram preservados.
- `normalizeRow` e `normalizeRows` receberam guarda explícita para impedir uso sem `headerResolution`, removendo a regressão latente de API interna/exportada sem alterar o pipeline principal.
- A suíte ganhou cobertura para o comportamento corretivo quando a normalização é chamada sem mapa resolvido.
- `npm test` passou na implementação deste incremento.
- `npm run build` passou no ambiente local após a instalação das dependências do workspace.
- Os relatórios CSV passaram a ter formato monetário `R$ 6,092.04` (americano com símbolo BRL). O `parseDecimal` foi atualizado para detectar e converter esse formato corretamente.
- O campo `Credor_Nome` passou a ser `NomeCredor` no cubo de 2026 — adicionado como alias no schema NE_DL.
- Campos novos adicionados ao NEDL: `Credor_Nome`, `CONTRATO`, `CONVENIO`. Removido: `CodigoPlanoInterno`.
- Campos novos adicionados ao DLOB: `CodigoProjetoAtividade`, `CodigoNaturezaDaDespesa`, `NomeNaturezaDaDespesa`, `NomeElementoDeDespesa`. Removidos: `DocumentoCredor`, `NomeCredor` (dl_documento_credor, dl_nome_credor).
- Migration `20260416000000_add_new_nedl_dlob_fields.sql` adicionada para os novos campos.
- Views `vw_liquidados_a_pagar` e `vw_monitoramento_pagamentos` criadas no Supabase consumindo diretamente as tabelas normalizadas.
- Tabelas canônicas criadas e função `consolidate_siafe_lineage()` executada com sucesso.
- Tabela `marcacoes_pagamento` criada para confirmação manual de pagamentos.
- Dashboard CPAG e CLIQ conectados com dados reais — mock data removido.
- `DatadaLiquidacao` passou a ser aceita como campo opcional em `NE_DL` e `DL_OB`, com persistência em `normalized_*` e consolidação para `documentos_liquidacao`.
- As views CPAG passaram a usar `data_liquidacao` real e a regra de pagamento parcial baseada em `sum(OB.valor)`.
- `vw_liquidados_a_pagar` agora expõe `valor_ja_pago_obs` para diferenciar pagamentos parciais no frontend.
- A migration `20260416000000_add_new_nedl_dlob_fields.sql` continua vazia no repositório; o ajuste efetivo deste ciclo foi entregue em uma nova migration idempotente.
- O ciclo corretivo seguinte passou a reconciliar explicitamente a camada canônica com os batches válidos do conjunto corrente, removendo órfãos em `documentos_liquidacao`, `ordens_bancarias` e `marcacoes_pagamento`.
- `vw_monitoramento_pagamentos` deixou de usar fallback por `numero_processo` para evitar associação insegura entre `OB` e `DL`.
- O comando `npm test` passou a incluir também `tests/consolidation.test.js`; quando não há credenciais Supabase disponíveis, a suíte de integração continua sendo pulada sem quebrar a validação local.
