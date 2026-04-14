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

- [ ] Confirmar e documentar os campos mínimos obrigatórios de `NE_DL`
- [ ] Confirmar e documentar os campos opcionais de `NE_DL`
- [ ] Confirmar e documentar os campos mínimos obrigatórios de `DL_OB`
- [ ] Confirmar e documentar os campos opcionais de `DL_OB`
- [ ] Confirmar se `ordem_bancaria` será tratada como opcional em `DL_OB`
- [ ] Confirmar aliases conhecidos aceitos para os relatórios atuais
- [ ] Confirmar política de colunas extras:
  - [ ] permitir sem bloquear
  - [ ] retornar warning
- [ ] Confirmar tratamento de colisão de aliases como erro bloqueante

---

## 4.2 Evolução dos schemas em código

- [ ] Evoluir `lib/siafe/schemas.js` para declarar:
  - [ ] campos obrigatórios
  - [ ] campos opcionais
  - [ ] bindings preferenciais de cabeçalho
  - [ ] aliases conhecidos
- [ ] Manter compatibilidade com os tipos internos atuais:
  - [ ] `NE_DL`
  - [ ] `DL_OB`
- [ ] Preservar `fileCode`, `label` e `normalizedTable`
- [ ] Evitar expansão prematura para catálogo em banco

---

## 4.3 Resolução flexível de cabeçalhos

- [ ] Criar etapa explícita de resolução de cabeçalhos
- [ ] Implementar resolução por nome de coluna, sem dependência da ordem
- [ ] Aplicar aliases conhecidos
- [ ] Construir mapa canônico de índices por campo
- [ ] Detectar campos obrigatórios ausentes
- [ ] Detectar colunas desconhecidas
- [ ] Detectar aliases aplicados
- [ ] Detectar colisões de mapeamento e tratá-las como erro
- [ ] Garantir compatibilidade com limpeza de BOM e parsing atual

---

## 4.4 Validação estrutural flexível

- [ ] Revisar `lib/siafe/validation.js`
- [ ] Remover dependência de ordem exata do header
- [ ] Remover erro bloqueante por coluna extra
- [ ] Permitir ausência de campos opcionais
- [ ] Manter erro bloqueante por ausência de campo obrigatório
- [ ] Melhorar a estrutura dos retornos de validação:
  - [ ] erros bloqueantes
  - [ ] warnings
  - [ ] aliases aplicados
  - [ ] colunas ignoradas

---

## 4.5 Normalização independente da ordem das colunas

- [ ] Revisar `lib/siafe/normalize.js`
- [ ] Fazer a normalização depender do mapa canônico resolvido
- [ ] Preencher `null` para opcionais ausentes
- [ ] Ignorar colunas extras sem bloquear
- [ ] Preservar o mesmo output canônico atual
- [ ] Preservar compatibilidade com:
  - [ ] `normalized_ne_dl_rows`
  - [ ] `normalized_dl_ob_rows`

---

## 4.6 Integração no pipeline de importação

- [ ] Revisar `lib/siafe/importer.js`
- [ ] Substituir validação rígida por resolução + validação mínima
- [ ] Garantir que a nova flexibilidade não afete:
  - [ ] `validateUploadSelection`
  - [ ] criação de `import_batches`
  - [ ] upload para Storage
  - [ ] persistência nas tabelas atuais
  - [ ] política de históricos
  - [ ] política do `2026`
- [ ] Garantir criação de failed batch quando faltarem campos obrigatórios

---

## 4.7 Retorno da API e observabilidade mínima

- [ ] Revisar retorno da API de upload
- [ ] Incluir warnings em respostas bem-sucedidas, quando houver
- [ ] Incluir detalhes estruturados suficientes para troubleshooting
- [ ] Manter compatibilidade com o frontend atual
- [ ] Evitar excesso de verbosidade ou logs permanentes desnecessários

---

## 4.8 Ajustes de interface para warnings

- [ ] Revisar `components/upload-form.jsx`
- [ ] Garantir exibição de warnings quando o upload for bem-sucedido com flexibilização aplicada
- [ ] Manter exibição clara dos erros bloqueantes
- [ ] Não alterar o fluxo funcional do formulário além do necessário

---

## 4.9 Testes automatizados

### NE_DL
- [ ] Adicionar teste para upload com colunas fora de ordem
- [ ] Adicionar teste para upload com coluna extra
- [ ] Adicionar teste aceitando `CodigoUnidadeGestora`
- [ ] Adicionar teste aceitando `InstituicaoCodigoUnidadeGestora`
- [ ] Adicionar teste falhando sem `DocumentodeLiquidacao`
- [ ] Adicionar teste falhando sem `CodigoNotadeEmpenho`
- [ ] Adicionar teste falhando sem `NUMERO_PROCESSO`

### DL_OB
- [ ] Adicionar teste para upload com colunas fora de ordem
- [ ] Adicionar teste para upload com coluna extra
- [ ] Adicionar teste falhando sem `DocumentodeLiquidacao`
- [ ] Adicionar teste falhando sem `NUMERO_PROCESSO`
- [ ] Adicionar teste cobrindo `ordem_bancaria` opcional, se confirmado

### Pipeline
- [ ] Validar que `processSiafeUpload` continua persistindo corretamente
- [ ] Validar que o nome do arquivo continua sendo exigido
- [ ] Validar que `yearScope` continua sendo respeitado
- [ ] Validar que a política do `2026` continua intacta
- [ ] Atualizar testes antigos que reflitam contrato rígido e não sejam mais compatíveis com o novo comportamento

---

## 4.10 Validação operacional do incremento

- [ ] Executar `npm test`
- [ ] Executar `npm run build`
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

- [ ] `NE_DL` aceitar ordem livre de colunas
- [ ] `NE_DL` aceitar colunas extras sem bloquear
- [ ] `NE_DL` aceitar aliases conhecidos
- [ ] `NE_DL` aceitar ausência de opcionais
- [ ] `NE_DL` falhar por ausência de obrigatórios mínimos
- [ ] `DL_OB` aceitar ordem livre de colunas
- [ ] `DL_OB` aceitar colunas extras sem bloquear
- [ ] `DL_OB` aceitar ausência de opcionais
- [ ] `DL_OB` falhar por ausência de obrigatórios mínimos
- [ ] a política de `2026` permanecer intacta
- [ ] o pipeline atual continuar funcional
- [ ] `npm test` passar
- [ ] `npm run build` passar

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
