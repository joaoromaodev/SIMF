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

- [ ] Definir estrategia de compatibilidade entre `NE_DL`/`DL_OB` e `NE`/`NEDL`/`DLOB`.
- [ ] Ajustar tipo/enum de relatorio no Supabase para aceitar `NE`, `NEDL` e `DLOB`.
- [ ] Adaptar `import_batches.report_type` para os tres universos.
- [ ] Preservar `year_scope` com `2023_2024`, `2025` e `2026`.
- [ ] Preservar `status`, `is_active` e `replaced_batch_id`.
- [ ] Garantir batch ativo unico por `report_type`/`year_scope` para `2026`.
- [ ] Validar que a substituicao de um universo nao afeta os demais.

## Incremento 3 - Tabelas normalizadas dos 3 universos

- [ ] Criar `normalized_ne_rows`.
- [ ] Criar ou ajustar `normalized_nedl_rows`.
- [ ] Criar ou ajustar `normalized_dlob_rows`.
- [ ] Remover exigencia de `NUMERO_PROCESSO` do `DLOB`.
- [ ] Mapear `DocumentodaLiquidacao` para `documento_liquidacao` em `DLOB`.
- [ ] Preservar `raw_row` para rastreabilidade.
- [ ] Adicionar indices para `import_batch_id`.
- [ ] Adicionar indices para `year_scope`.
- [ ] Adicionar indices para `codigo_nota_empenho`.
- [ ] Adicionar indices para `documento_liquidacao`.
- [ ] Adicionar indices para `ordem_bancaria`.

## Incremento 4 - Finalizacao atomica de importacao

- [ ] Atualizar rotina de finalizacao de importacao para os tres universos.
- [ ] Garantir substituicao integral de `2026_NE.csv` apenas em `NE`/`2026`.
- [ ] Garantir substituicao integral de `2026_NEDL.csv` apenas em `NEDL`/`2026`.
- [ ] Garantir substituicao integral de `2026_DLOB.csv` apenas em `DLOB`/`2026`.
- [ ] Manter rastreabilidade de batches substituidos.
- [ ] Definir comportamento de remocao/desativacao de linhas normalizadas antigas.
- [ ] Permitir limpeza e recarga de historicos durante desenvolvimento.

## Incremento 5 - Pipeline de ingestao Next.js

- [ ] Atualizar schemas em `lib/siafe/`.
- [ ] Atualizar validacao de tipo de relatorio.
- [ ] Atualizar validacao de nome de arquivo para os 9 CSVs.
- [ ] Atualizar normalizacao de `NE`.
- [ ] Atualizar normalizacao de `NEDL`.
- [ ] Atualizar normalizacao de `DLOB`.
- [ ] Garantir que `DLOB` sem `NUMERO_PROCESSO` seja aceito.
- [ ] Garantir parsing monetario no formato `R$ 6,092.04`.
- [ ] Garantir parsing de datas.
- [ ] Atualizar formulario de upload para `NE`, `NEDL` e `DLOB`.
- [ ] Atualizar mensagens de erro e warnings.
- [ ] Atualizar testes automatizados da ingestao.

## Incremento 6 - Views ativas

- [ ] Criar `vw_active_import_batches`.
- [ ] Criar `vw_ne_active`.
- [ ] Criar `vw_nedl_active`.
- [ ] Criar `vw_dlob_active`.
- [ ] Garantir que views ativas filtrem apenas batches validos.
- [ ] Garantir que `2026` considere apenas batch ativo.
- [ ] Garantir que historicos sigam a politica vigente.

## Incremento 7 - Views de BI

- [ ] Criar ou revisar `vw_execucao_financeira`.
- [ ] Criar ou revisar `vw_liquidados_a_pagar`.
- [ ] Criar ou revisar `vw_pagamentos`.
- [ ] Criar ou revisar `vw_monitoramento_pagamentos`.
- [ ] Aplicar regra de quitacao por soma de OBs contra `Valor Bruto`.
- [ ] Derivar processo da OB por `DLOB -> NEDL -> NE`.
- [ ] Integrar `marcacoes_pagamento` apenas como tabela auxiliar.

## Incremento 8 - Views de qualidade e auditoria

- [ ] Criar `vw_status_carga_relatorios`.
- [ ] Criar `vw_nedl_sem_ne`.
- [ ] Criar `vw_dlob_sem_nedl`.
- [ ] Criar `vw_divergencia_processo_ne_nedl`.
- [ ] Validar que a view de status cobre os 9 relatorios.
- [ ] Validar diagnostico de `NEDL` sem `NE`.
- [ ] Validar diagnostico de `DLOB` sem `NEDL`.
- [ ] Validar divergencia de processo entre `NE` e `NEDL`.

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
