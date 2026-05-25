# SIMF - Tasks da Reestruturacao Supabase

## Finalidade

Este e o tracker ativo da reestruturacao Supabase para os tres universos SIAFE: `NE`, `NEDL` e `DLOB`.

O tracker antigo `docs/simf-evolucao-ingestao-tasks.md` foi arquivado em `docs/archive/simf-evolucao-ingestao-tasks_legacy.md` e nao deve orientar novos ciclos.

## Incremento 1 - Contrato final dos relatorios

- [x] Criar `docs/archive/`.
- [x] Arquivar `simf-evolucao-ingestao-incrementos.md`.
- [x] Arquivar `simf-evolucao-ingestao-tasks.md`.
- [x] Preservar historico de `estrutura_relatorios.md` em `docs/archive/estrutura_relatorios_legacy.md`.
- [x] Recriar `docs/estrutura_relatorios.md` como contrato oficial dos CSVs.
- [x] Documentar os tres universos oficiais: `NE`, `NEDL`, `DLOB`.
- [x] Documentar os 9 arquivos CSV esperados.
- [x] Documentar campos finais de `NE`.
- [x] Documentar campos finais de `NEDL`.
- [x] Documentar campos finais de `DLOB`.
- [x] Documentar que `DLOB` nao possui `NUMERO_PROCESSO`.
- [x] Documentar chaves de cruzamento.
- [x] Documentar derivacao de processo para OB por `DLOB -> NEDL -> NE`.
- [x] Documentar regra de parsing monetario.
- [x] Documentar regra de quitacao por soma de OBs contra `Valor Bruto`.
- [x] Atualizar `docs/roadmap_reestruturacao_supabase.md`.
- [x] Atualizar `docs/TECHNICAL_SPECIFICATION.md`.
- [x] Atualizar `docs/AGENTS.md`.
- [x] Atualizar `docs/CPAG_SPEC.md`.
- [x] Revisar se `README.md` ou `AGENTS.md` da raiz precisam apontar para os novos documentos.

## Incremento 2 - Reestruturacao dos tipos e batches

- [x] Definir estrategia de compatibilidade entre `NE_DL`/`DL_OB` e `NE`/`NEDL`/`DLOB`.
- [x] Ajustar tipo/enum de relatorio no Supabase para aceitar `NE`, `NEDL` e `DLOB`.
- [x] Adaptar `import_batches.report_type` para os tres universos.
- [x] Preservar `year_scope` com `2023_2024`, `2025` e `2026`.
- [x] Preservar `status`, `is_active` e `replaced_batch_id`.
- [x] Garantir batch ativo unico por `report_type`/`year_scope` para `2026`.
- [x] Validar que a substituicao de um universo nao afeta os demais.

## Incremento 3 - Tabelas normalizadas dos 3 universos

- [x] Criar `normalized_ne_rows`.
- [x] Criar ou ajustar `normalized_nedl_rows`.
- [x] Criar ou ajustar `normalized_dlob_rows`.
- [x] Remover exigencia de `NUMERO_PROCESSO` do `DLOB`.
- [x] Mapear `DocumentodaLiquidacao` para `documento_liquidacao` em `DLOB`.
- [x] Preservar `raw_row` para rastreabilidade.
- [x] Adicionar indices para `import_batch_id`.
- [x] Adicionar indices para `year_scope`.
- [x] Adicionar indices para `codigo_nota_empenho`.
- [x] Adicionar indices para `documento_liquidacao`.
- [x] Adicionar indices para `ordem_bancaria`.

## Incremento 4 - Finalizacao atomica de importacao

- [x] Atualizar rotina de finalizacao de importacao para os tres universos.
- [x] Garantir substituicao integral de `2026_NE.csv` apenas em `NE`/`2026`.
- [x] Garantir substituicao integral de `2026_NEDL.csv` apenas em `NEDL`/`2026`.
- [x] Garantir substituicao integral de `2026_DLOB.csv` apenas em `DLOB`/`2026`.
- [x] Manter rastreabilidade de batches substituidos.
- [x] Definir comportamento de remocao/desativacao de linhas normalizadas antigas.
- [x] Permitir limpeza e recarga de historicos durante desenvolvimento.

## Incremento 5 - Pipeline de ingestao Next.js

- [x] Atualizar schemas em `lib/siafe/`.
- [x] Atualizar validacao de tipo de relatorio.
- [x] Atualizar validacao de nome de arquivo para os 9 CSVs.
- [x] Atualizar normalizacao de `NE`.
- [x] Atualizar normalizacao de `NEDL`.
- [x] Atualizar normalizacao de `DLOB`.
- [x] Garantir que `DLOB` sem `NUMERO_PROCESSO` seja aceito.
- [x] Garantir parsing monetario no formato `R$ 6,092.04`.
- [x] Garantir parsing de datas.
- [x] Atualizar formulario de upload para `NE`, `NEDL` e `DLOB`.
- [x] Atualizar mensagens de erro e warnings.
- [x] Atualizar testes automatizados da ingestao.

## Incremento 6 - Views ativas

- [x] Criar `vw_active_import_batches`.
- [x] Criar `vw_ne_active`.
- [x] Criar `vw_nedl_active`.
- [x] Criar `vw_dlob_active`.
- [x] Garantir que views ativas filtrem apenas batches validos.
- [x] Garantir que `2026` considere apenas batch ativo.
- [x] Garantir que historicos sigam a politica vigente.

## Incremento 7 - Views de BI

- [x] Criar ou revisar `vw_execucao_financeira`.
- [x] Criar ou revisar `vw_liquidados_a_pagar`.
- [x] Criar ou revisar `vw_pagamentos`.
- [x] Criar ou revisar `vw_monitoramento_pagamentos`.
- [x] Aplicar regra de quitacao por soma de OBs contra `Valor Bruto`.
- [x] Derivar processo da OB por `DLOB -> NEDL -> NE`.
- [x] Integrar `marcacoes_pagamento` apenas como tabela auxiliar.

## Incremento 8 - Views de qualidade e auditoria

- [x] Criar `vw_status_carga_relatorios`.
- [x] Criar `vw_nedl_sem_ne`.
- [x] Criar `vw_dlob_sem_nedl`.
- [x] Criar `vw_divergencia_processo_ne_nedl`.
- [x] Validar que a view de status cobre os 9 relatorios.
- [x] Validar diagnostico de `NEDL` sem `NE`.
- [x] Validar diagnostico de `DLOB` sem `NEDL`.
- [x] Validar divergencia de processo entre `NE` e `NEDL`.

## Incremento 9 - Validacao operacional com os 9 CSVs

- [ ] Limpar base de desenvolvimento.
- [ ] Aplicar migrations da reestruturacao.
- [ ] Subir `2023_2024_NE.csv`.
- [ ] Subir `2025_NE.csv`.
- [ ] Subir `2026_NE.csv`.
- [ ] Subir `2023_2024_NEDL.csv`.
- [ ] Subir `2025_NEDL.csv`.
- [ ] Subir `2026_NEDL.csv`.
- [ ] Subir `2023_2024_DLOB.csv`.
- [ ] Subir `2025_DLOB.csv`.
- [ ] Subir `2026_DLOB.csv`.
- [ ] Validar `import_batches`.
- [ ] Validar tabelas normalizadas.
- [ ] Validar views ativas.
- [ ] Validar views de BI.
- [ ] Validar views de qualidade.
- [ ] Corrigir inconsistencias encontradas.

## Incremento 10 - Hardening pos-validacao

- [ ] Revisar indices.
- [ ] Avaliar performance das views comuns.
- [ ] Avaliar necessidade real de materialized views.
- [ ] Travar historicos apos carga validada.
- [ ] Atualizar documentacao final pos-implementacao.
- [ ] Isolar ou remover referencias legadas que nao forem mais necessarias.
- [ ] Registrar riscos residuais e proximos ciclos.
