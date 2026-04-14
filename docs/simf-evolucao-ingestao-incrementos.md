# SIMF — Evolução da Ingestão de Relatórios (Incrementos)

## 1. Finalidade deste documento

Este documento registra a estratégia de evolução da camada de ingestão do SIMF para os próximos ciclos de implementação.

Seu objetivo é orientar a continuidade técnica do projeto, especialmente no que diz respeito à transição do modelo atual — rígido e acoplado a dois relatórios fixos — para um modelo mais flexível, controlado e preparado para a incorporação futura de novos relatórios do SIAFE.

Este documento **não substitui o OpenSpec**. Ele funciona como apoio arquitetural e operacional para a equipe de desenvolvimento, ajudando a manter o alinhamento entre visão, escopo e ordem de implementação.

---

## 2. Contexto atual

Atualmente, o SIMF já possui a fundação da ingestão implementada para dois tipos de relatório:

- `NE_DL`
- `DL_OB`

Essa fundação já contempla:

- upload manual de arquivos `.csv`;
- validação de tipo, nome do arquivo e escopo anual;
- parsing de CSV;
- normalização;
- persistência de `import_batches`;
- persistência de linhas normalizadas;
- armazenamento do CSV original no Supabase Storage;
- regra especial de substituição integral para `2026`;
- testes automatizados da fundação.

O comportamento atual ainda é bastante rígido no que diz respeito ao cabeçalho dos arquivos:

- exige colunas específicas;
- exige nomenclatura estrita;
- historicamente exigia ordem fixa;
- rejeita variações estruturais que podem ocorrer em arquivos reais.

Além disso, a equipe já identificou que futuramente o sistema deverá suportar **novos relatórios**, com **novos campos** e possíveis variações de estrutura.

---

## 3. Diretriz arquitetural da evolução

A evolução da ingestão deve seguir este princípio:

> **Flexibilidade na entrada, disciplina no domínio.**

Na prática, isso significa:

- o sistema deve ser tolerante a variações controladas de arquivos de entrada;
- o sistema não deve ficar refém da forma exata como o CSV foi exportado;
- a normalização interna deve continuar baseada em um domínio canônico estável;
- a flexibilidade não deve significar perda de rastreabilidade, governança ou previsibilidade.

A estratégia adotada será **incremental**, para reduzir risco e preservar a fundação já aprovada do MVP.

---

## 4. Objetivo da evolução

Transformar o SIMF de um importador de dois CSVs rígidos em um motor de ingestão progressivamente mais flexível e preparado para absorver novos relatórios, mantendo:

- segurança operacional;
- rastreabilidade;
- facilidade de manutenção;
- compatibilidade com a futura consolidação canônica.

Essa evolução deve ocorrer **sem quebrar**:

- o pipeline atual de batches;
- o armazenamento dos arquivos originais;
- a política do `2026`;
- a persistência atual nas tabelas normalizadas;
- a base já validada do MVP.

---

## 5. Incrementos propostos

## Incremento 1 — Flexibilização controlada dos 2 relatórios atuais

### Objetivo
Resolver a dor operacional imediata da rigidez estrutural dos uploads para os relatórios já suportados:

- `NE_DL`
- `DL_OB`

### Escopo
- permitir colunas em qualquer ordem;
- diferenciar campos obrigatórios e opcionais;
- aceitar aliases conhecidos de cabeçalho;
- permitir colunas extras;
- tratar colunas extras como warning, e não como erro bloqueante;
- manter schemas ainda em código;
- manter tabelas atuais;
- manter a política de batches e de `2026`.

### Não entra
- novos tipos de relatório;
- catálogo em banco;
- UI administrativa;
- versionamento persistido de schema;
- engine genérica completa de ingestão.

### Resultado esperado
Os dois relatórios atuais passam a ser mais tolerantes, sem alteração do domínio interno.

---

## Incremento 2 — Observabilidade e rastreabilidade da interpretação do arquivo

### Objetivo
Garantir que a nova flexibilidade não torne o processo opaco.

### Escopo
- registrar aliases aplicados;
- registrar colunas ignoradas;
- registrar warnings;
- registrar como o cabeçalho foi interpretado;
- melhorar a resposta da API e o troubleshooting.

### Resultado esperado
A equipe consegue entender claramente como cada arquivo foi interpretado e por que foi aceito ou rejeitado.

---

## Incremento 3 — Evolução do schema declarativo em código

### Objetivo
Tornar a definição dos relatórios mais expressiva e menos dependente de listas fixas de headers.

### Escopo
- enriquecer os schemas em código;
- introduzir explicitamente:
  - obrigatórios;
  - opcionais;
  - aliases;
  - bindings canônicos;
  - política para colunas desconhecidas;
- consolidar um resolvedor de cabeçalhos reutilizável.

### Resultado esperado
O sistema continua controlado em código, mas fica preparado para escalar com menor acoplamento.

---

## Incremento 4 — Persistência preparada para evolução de schema

### Objetivo
Preparar a persistência para suportar evolução de layout sem perda de rastreabilidade.

### Escopo
- avaliar inclusão de metadados de schema na persistência;
- avaliar `schema_version`;
- avaliar `resolved_header_map_json`;
- avaliar `extra_fields_json`;
- manter as tabelas normalizadas atuais.

### Observação importante
O uso de JSON deve ser tratado como **buffer de evolução**, e não como substituto permanente do modelo canônico de consulta.

### Resultado esperado
O sistema passa a preservar melhor a interpretação do arquivo e a absorver mudanças de layout com menor risco.

---

## Incremento 5 — Suporte estruturado a novos relatórios

### Objetivo
Permitir a incorporação de novos relatórios além de `NE_DL` e `DL_OB` sem reescrever o pipeline.

### Escopo
- adicionar novos tipos de relatório;
- reaproveitar a estrutura flexível criada nos incrementos anteriores;
- tratar novos relatórios mais como configuração e teste do que como refatoração pesada.

### Resultado esperado
O SIMF passa a operar como plataforma extensível de ingestão, ainda com governança técnica centralizada em código.

---

## Incremento 6 — Catálogo persistido e governança avançada

### Objetivo
Dar um passo além na autonomia e escalabilidade da plataforma.

### Escopo
- avaliar mover definições de relatório/schema para banco;
- avaliar versionamento persistido de schemas;
- avaliar política formal de promoção de campos extras para campos canônicos;
- avaliar interface administrativa no futuro.

### Observação importante
A UI administrativa **não entra no curto prazo**. Antes dela, o catálogo deve amadurecer com governança técnica controlada.

### Resultado esperado
A plataforma passa a ter base para gestão mais avançada de schemas, sem depender exclusivamente de alteração em código.

---

## 6. Ordem recomendada de implementação

A ordem recomendada é:

1. Incremento 1  
2. Incremento 2  
3. Incremento 3  
4. Incremento 4  
5. Incremento 5  
6. Incremento 6  

### Justificativa
Essa ordem preserva o princípio de evolução segura:

- primeiro, resolve a dor operacional real;
- depois, cria observabilidade;
- depois, amadurece o desenho em código;
- depois, fortalece a persistência;
- só então amplia para novos relatórios;
- e só por último avalia catálogo persistido e UI.

---

## 7. Diretrizes de implementação

Durante essa evolução, a equipe deve preservar os seguintes princípios:

### 7.1 Preservar o domínio canônico
Mesmo com flexibilidade na entrada, o sistema deve continuar normalizando para campos internos estáveis.

### 7.2 Não relaxar arbitrariamente o contrato
Flexibilizar não significa aceitar qualquer arquivo sem controle.

### 7.3 Manter rastreabilidade
Toda flexibilidade deve vir acompanhada de observabilidade suficiente para auditoria e troubleshooting.

### 7.4 Evitar complexidade prematura
No curto prazo, manter schemas em código é mais seguro do que antecipar catálogo em banco e UI administrativa.

### 7.5 Tratar JSON como zona de retenção, não como modelo principal de consulta
Se `extra_fields_json` vier a ser adotado, ele deve funcionar como buffer de evolução e não como substituto do modelo canônico.

---

## 8. Pontos de atenção técnicos já identificados

### 8.1 Performance com campos extras em JSON
Caso no futuro haja necessidade de consultas frequentes sobre campos preservados em JSON, será necessário avaliar indexação apropriada (ex.: GIN) e eventual promoção desses campos para o modelo canônico.

### 8.2 Volume de arquivos e uso de memória
Se os relatórios crescerem significativamente em volume, pode ser necessário evoluir o processamento para leitura em lotes/chunks ou streaming, evitando carregar arquivos muito grandes inteiramente em memória.

### 8.3 Governança de aliases e novos schemas
A manutenção de aliases, bindings e regras de schema deve continuar inicialmente sob controle técnico da equipe de desenvolvimento. A migração disso para UI administrativa só deve ser considerada quando os conceitos estiverem estáveis.

### 8.4 Ambiguidade de aliases
O sistema não deve permitir colisões silenciosas entre múltiplos cabeçalhos mapeando de forma ambígua para o mesmo campo canônico no mesmo arquivo.

---

## 9. Situação recomendada para o próximo ciclo

A recomendação atual é iniciar pela implementação do **Incremento 1**, com foco em:

- flexibilização controlada dos dois relatórios atuais;
- diferenciação entre campos obrigatórios e opcionais;
- aceitação de aliases conhecidos;
- aceitação de colunas extras com warning;
- manutenção da base atual do MVP.

Esse incremento deve ser tratado como o primeiro passo de uma evolução maior, mas já deve ser entregue de forma completa, verificável e segura.

---

## 10. Observação final

Este documento deve ser atualizado à medida que os incrementos forem sendo iniciados, concluídos ou refinados.

A função dele é manter a equipe alinhada quanto a:

- visão da evolução;
- ordem correta dos trabalhos;
- limites de escopo;
- dependências entre incrementos;
- e riscos arquiteturais conhecidos.
