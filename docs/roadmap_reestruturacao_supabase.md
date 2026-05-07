# SIMF - Roadmap de Reestruturacao Supabase

## Contexto

O SIMF e um MVP para ingestao, validacao, normalizacao e disponibilizacao de relatorios CSV extraidos do SIAFE para uso em painel e BI.

A fase anterior da ingestao foi organizada em torno dos tipos `NE_DL` e `DL_OB`. A decisao arquitetural atual substitui essa referencia por tres universos oficiais:

- `NE`
- `NEDL`
- `DLOB`

O objetivo desta reestruturacao e adaptar o Supabase, o pipeline de ingestao e as views para esses tres universos, mantendo rastreabilidade por batch e evitando uma consolidacao fisica completa como prioridade do MVP.

## Decisoes Arquiteturais Consolidadas

Os tipos internos finais serao `NE`, `NEDL` e `DLOB`.

Os nomes `NE_DL` e `DL_OB` devem ser tratados como legados quando necessario para compatibilidade, migracao ou leitura historica. Eles nao devem orientar novas implementacoes.

O conjunto operacional esperado possui 9 arquivos:

```text
2023_2024_NE.csv
2025_NE.csv
2026_NE.csv
2023_2024_NEDL.csv
2025_NEDL.csv
2026_NEDL.csv
2023_2024_DLOB.csv
2025_DLOB.csv
2026_DLOB.csv
```

`NE` possui `NUMERO_PROCESSO`.

`NEDL` possui `NUMERO_PROCESSO`, mas o vinculo principal com `NE` ocorre por `CodigoNotadeEmpenho`.

`DLOB` nao possui `NUMERO_PROCESSO`. O processo exibido no painel para uma OB deve ser derivado por:

```text
DLOB.DocumentodaLiquidacao
  -> NEDL.DocumentodeLiquidacao
  -> NEDL.CodigoNotadeEmpenho
  -> NE.CodigoNotadeEmpenho
  -> NE.NUMERO_PROCESSO
```

O painel e o BI devem ser alimentados inicialmente por views SQL sobre tabelas normalizadas, nao por uma camada canonica fisica completa.

Materialized views, tabelas canonicas persistidas e consolidacao fisica completa podem ser avaliadas futuramente, mas nao sao prioridade desta fase.

## Modelo-Alvo

Fluxo conceitual:

```text
CSV
  -> import_batches
  -> normalized_ne_rows
  -> normalized_nedl_rows
  -> normalized_dlob_rows
  -> views SQL
  -> painel / BI
```

Camadas:

| Camada | Responsabilidade |
|---|---|
| `import_batches` | controle de upload, status, escopo, arquivo original, batch ativo e rastreabilidade |
| `normalized_ne_rows` | linhas normalizadas do universo `NE` |
| `normalized_nedl_rows` | linhas normalizadas do universo `NEDL` |
| `normalized_dlob_rows` | linhas normalizadas do universo `DLOB` |
| views SQL | cruzamento, enriquecimento, qualidade, auditoria e consumo pelo painel |
| painel / BI | leitura das views, filtros, exportacoes e marcacoes auxiliares |

## Controle de Importacao

`import_batches` deve continuar como tabela central de controle.

Campos esperados ou equivalentes:

- `id`
- `report_type`
- `year_scope`
- `original_file_name`
- `storage_bucket`
- `storage_path`
- `status`
- `validation_errors`
- `source_headers`
- `processed_row_count`
- `normalized_row_count`
- `is_active`
- `replaced_batch_id`
- `started_at`
- `finished_at`
- `created_at`
- `updated_at`

`report_type` deve aceitar `NE`, `NEDL` e `DLOB`.

`year_scope` deve manter:

- `2023_2024`
- `2025`
- `2026`

Para `2026`, deve existir apenas um batch ativo de sucesso por `report_type` e `year_scope`.

## Politica dos Historicos

Durante desenvolvimento, os historicos podem ser limpos e recarregados para permitir validacao do modelo.

Apos estabilizacao, historicos devem ser travados depois de carga validada.

| Escopo | Durante desenvolvimento | Apos estabilizacao |
|---|---|---|
| `2023_2024` | pode limpar e recarregar | travado apos validacao |
| `2025` | pode limpar e recarregar | travado apos validacao |
| `2026` | substituicao integral por universo | substituicao integral por universo |

## Politica de 2026

O escopo `2026` permanece como escopo ativo.

Um novo upload de `2026_NE.csv` deve substituir apenas o batch ativo de `NE`/`2026`. A mesma regra vale separadamente para `NEDL`/`2026` e `DLOB`/`2026`.

A substituicao de um universo nao deve afetar os demais.

## Estrategia de Views

A estrategia atual e comecar com views comuns.

Materialized views so devem ser avaliadas apos evidencia real de gargalo de performance.

Views base recomendadas:

- `vw_active_import_batches`
- `vw_ne_active`
- `vw_nedl_active`
- `vw_dlob_active`

Views de BI recomendadas:

- `vw_execucao_financeira`
- `vw_liquidados_a_pagar`
- `vw_pagamentos`
- `vw_monitoramento_pagamentos`

Views de qualidade e auditoria recomendadas:

- `vw_status_carga_relatorios`
- `vw_nedl_sem_ne`
- `vw_dlob_sem_nedl`
- `vw_divergencia_processo_ne_nedl`

## Marcacoes Manuais

`marcacoes_pagamento` deve permanecer como tabela auxiliar do painel.

Ela pode complementar `vw_monitoramento_pagamentos`, mas nao deve virar substituta de uma camada canonica completa nem exigir a criacao de entidades fisicas para todo o fluxo financeiro.

## Regras de BI

`vw_liquidados_a_pagar` deve partir de `NEDL` e considerar a soma das OBs vinculadas em `DLOB`.

Uma DL so e considerada quitada quando:

```text
sum(DLOB.valor) >= NEDL.valor_bruto
```

O saldo recomendado e:

```text
greatest(NEDL.valor_bruto - coalesce(sum(DLOB.valor), 0), 0)
```

`vw_monitoramento_pagamentos` ou view futura equivalente deve derivar `numero_processo` pelo encadeamento `DLOB -> NEDL -> NE`, nunca por campo proprio de `DLOB`.

## Roadmap Incremental

### Incremento 1 - Contrato final dos relatorios

Objetivo: formalizar o contrato dos 9 CSVs e alinhar a documentacao principal.

Entregas:

- documentar os universos `NE`, `NEDL` e `DLOB`;
- documentar os 9 arquivos esperados;
- documentar campos finais por relatorio;
- documentar que `DLOB` nao possui `NUMERO_PROCESSO`;
- documentar chaves de cruzamento;
- documentar parsing monetario;
- documentar regra de quitacao;
- arquivar documentos superados.

Criterios de aceite:

- `docs/estrutura_relatorios.md` e o contrato oficial;
- documentos legados estao em `docs/archive/`;
- `docs/roadmap_reestruturacao_supabase_tasks.md` substitui o tracker antigo;
- nenhuma migration ou alteracao funcional foi feita neste incremento documental.

### Incremento 2 - Reestruturacao dos tipos e batches

Objetivo: preparar a base para aceitar `NE`, `NEDL` e `DLOB`.

Entregas:

- ajustar tipo/enum de relatorio;
- adaptar `import_batches` para os novos tipos;
- definir estrategia de compatibilidade com `NE_DL` e `DL_OB`, se necessaria;
- preservar `year_scope`, `status`, `is_active` e `replaced_batch_id`.

Criterios de aceite:

- o banco aceita batches dos tres universos;
- a regra de batch ativo por `report_type`/`year_scope` continua valida;
- novas implementacoes nao dependem dos nomes antigos.

### Incremento 3 - Tabelas normalizadas dos 3 universos

Objetivo: criar a base normalizada alvo.

Entregas:

- criar `normalized_ne_rows`;
- criar ou ajustar `normalized_nedl_rows`;
- criar ou ajustar `normalized_dlob_rows`;
- remover exigencia de `NUMERO_PROCESSO` do `DLOB`;
- adicionar indices de cruzamento;
- preservar `raw_row`.

Criterios de aceite:

- cada universo possui tabela normalizada propria;
- campos CSV estao mapeados para nomes internos canonicos;
- `DLOB` nao depende de `NUMERO_PROCESSO`;
- joins principais sao suportados por indices.

### Incremento 4 - Finalizacao atomica de importacao

Objetivo: adaptar a finalizacao dos imports aos tres universos.

Entregas:

- atualizar a rotina de finalizacao de imports;
- garantir substituicao integral de `2026` por universo;
- manter rastreabilidade dos batches substituidos;
- permitir limpeza e recarga de historicos em desenvolvimento.

Criterios de aceite:

- um upload de `2026_NE.csv` substitui apenas `NE`/`2026`;
- a mesma regra vale para `NEDL` e `DLOB`;
- batches substituidos continuam rastreaveis.

### Incremento 5 - Pipeline de ingestao Next.js

Objetivo: adaptar upload, validacao e normalizacao para os 9 relatorios.

Entregas:

- atualizar schemas em codigo;
- atualizar validacao de tipo e nome de arquivo;
- atualizar normalizacao;
- atualizar formulario de upload;
- atualizar mensagens de erro e warnings;
- garantir parsing monetario;
- garantir parsing de datas.

Criterios de aceite:

- o formulario permite selecionar `NE`, `NEDL` e `DLOB`;
- o sistema aceita os 9 nomes esperados;
- cada arquivo persiste na tabela correta;
- upload invalido gera batch `failed`, quando aplicavel;
- `DLOB` sem `NUMERO_PROCESSO` e aceito.

### Incremento 6 - Views ativas

Objetivo: criar views intermediarias para consumo seguro das normalizadas.

Entregas:

- `vw_active_import_batches`;
- `vw_ne_active`;
- `vw_nedl_active`;
- `vw_dlob_active`.

Criterios de aceite:

- as views retornam somente batches validos;
- para `2026`, apenas o batch ativo e considerado;
- historicos seguem a politica vigente.

### Incremento 7 - Views de BI

Objetivo: criar as views principais do painel.

Entregas:

- `vw_execucao_financeira`;
- `vw_liquidados_a_pagar`;
- `vw_pagamentos`;
- `vw_monitoramento_pagamentos`.

Criterios de aceite:

- o painel consulta empenhos, liquidacoes e pagamentos;
- processo da OB e derivado por `DLOB -> NEDL -> NE`;
- quitacao por soma de OBs contra `Valor Bruto` e aplicada;
- marcacoes manuais entram apenas como tabela auxiliar.

### Incremento 8 - Views de qualidade e auditoria

Objetivo: diagnosticar integridade da carga.

Entregas:

- `vw_status_carga_relatorios`;
- `vw_nedl_sem_ne`;
- `vw_dlob_sem_nedl`;
- `vw_divergencia_processo_ne_nedl`.

Criterios de aceite:

- e possivel saber se os 9 relatorios foram carregados;
- NEDLs sem NE correspondente ficam visiveis;
- DLOBs sem NEDL correspondente ficam visiveis;
- divergencias de processo entre NE e NEDL ficam visiveis.

### Incremento 9 - Validacao operacional com os 9 CSVs

Objetivo: validar a reestruturacao com dados reais.

Entregas:

- limpar base de desenvolvimento;
- aplicar migrations;
- subir os 9 arquivos;
- validar `import_batches`;
- validar tabelas normalizadas;
- validar views ativas;
- validar views de BI;
- validar views de qualidade.

Criterios de aceite:

- os 9 arquivos importam com sucesso;
- o painel consulta as views corretamente;
- nao ha dependencia de `NUMERO_PROCESSO` no `DLOB`;
- liquidados a pagar refletem pagamentos parciais e totais;
- inconsistencias ficam visiveis em views proprias.

### Incremento 10 - Hardening pos-validacao

Objetivo: estabilizar o modelo apos validacao real.

Entregas:

- revisar indices;
- avaliar performance das views;
- avaliar necessidade de materialized views;
- travar historicos validados;
- atualizar documentacao final;
- remover ou isolar legados, se necessario.

Criterios de aceite:

- historico validado esta protegido;
- views criticas performam adequadamente;
- documentacao reflete o estado real;
- projeto pronto para continuidade incremental.

## Riscos e Cuidados

Risco de coexistencia entre nomes antigos e novos: definir compatibilidade explicitamente antes da implementacao.

Risco de vinculo incorreto da OB: mitigar com joins por `documento_liquidacao` e views como `vw_dlob_sem_nedl`.

Risco de divergencia entre views: centralizar regra de batch ativo em views intermediarias.

Risco de performance: comecar com views comuns, revisar indices e materializar apenas gargalos reais.

## Validacao Recomendada

Para rodadas funcionais futuras:

```bash
npm test
npm run build
```

Para validacao operacional em Supabase:

```sql
select * from import_batches order by created_at desc;
select * from normalized_ne_rows limit 50;
select * from normalized_nedl_rows limit 50;
select * from normalized_dlob_rows limit 50;
select * from vw_status_carga_relatorios;
select * from vw_nedl_sem_ne;
select * from vw_dlob_sem_nedl;
select * from vw_divergencia_processo_ne_nedl;
select * from vw_execucao_financeira limit 50;
select * from vw_liquidados_a_pagar limit 50;
select * from vw_pagamentos limit 50;
select * from vw_monitoramento_pagamentos limit 50;
```
