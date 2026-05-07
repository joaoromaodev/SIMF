# AGENTS.md

## 1. Visao Geral do Projeto

O SIMF e um MVP para ingestao, validacao, normalizacao e disponibilizacao de relatorios CSV extraidos do SIAFE para uso em painel e BI.

Stack principal:

- Next.js
- Supabase
- PostgreSQL
- Supabase Storage

O projeto esta na fase de reestruturacao Supabase para tres universos oficiais de relatorio:

- `NE`
- `NEDL`
- `DLOB`

Os nomes antigos `NE_DL` e `DL_OB` sao legados. Use-os apenas quando for necessario compreender codigo, migrations ou dados existentes.

## 2. Direcao Arquitetural Atual

A base alvo do MVP e:

```text
CSV
  -> import_batches
  -> normalized_ne_rows
  -> normalized_nedl_rows
  -> normalized_dlob_rows
  -> views SQL
  -> painel / BI
```

Nesta fase, o painel deve ser alimentado por views SQL sobre tabelas normalizadas.

Consolidacao fisica completa, materialized views e camada canonica persistida podem ser avaliadas futuramente, mas nao sao prioridade do MVP atual.

## 3. Contrato dos Relatorios

O contrato oficial esta em:

- `docs/estrutura_relatorios.md`

Arquivos esperados:

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

Regras essenciais:

- `NE` possui `NUMERO_PROCESSO`.
- `NEDL` possui `NUMERO_PROCESSO`, mas vincula com `NE` por `CodigoNotadeEmpenho`.
- `DLOB` nao possui `NUMERO_PROCESSO`.
- `DLOB.DocumentodaLiquidacao` deve mapear para `documento_liquidacao`.
- Processo para OB deve ser derivado por `DLOB -> NEDL -> NE`.
- Uma DL so e quitada quando a soma das OBs vinculadas atinge ou supera o `Valor Bruto`.

## 4. Documentos que Agentes Devem Ler Antes de Implementar

Antes de qualquer alteracao funcional, leia:

- `docs/estrutura_relatorios.md`
- `docs/roadmap_reestruturacao_supabase.md`
- `docs/roadmap_reestruturacao_supabase_tasks.md`
- `docs/TECHNICAL_SPECIFICATION.md`

Se a mudanca envolver painel, CPAG, pagamentos, views de pagamento ou marcacoes manuais, leia tambem:

- `docs/CPAG_SPEC.md`

## 5. Documentos Arquivados

Documentos em `docs/archive/` sao historicos.

Eles podem ser usados para entender contexto, MDX antigo, decisoes passadas ou implementacoes legadas, mas nao devem ser usados como fonte principal para novas implementacoes.

Arquivos arquivados nesta reestruturacao:

- `docs/archive/simf-evolucao-ingestao-incrementos_legacy.md`
- `docs/archive/simf-evolucao-ingestao-tasks_legacy.md`
- `docs/archive/estrutura_relatorios_legacy.md`

## 6. Escopo Atual

O roadmap ativo esta em:

- `docs/roadmap_reestruturacao_supabase.md`

O tracker ativo esta em:

- `docs/roadmap_reestruturacao_supabase_tasks.md`

Nao use `simf-evolucao-ingestao-tasks.md` como tracker ativo. Esse documento foi substituido.

## 7. Regras Para Implementacao

Antes de alterar codigo:

- confirme qual incremento do roadmap esta em execucao;
- leia os documentos ativos;
- inspecione os arquivos impactados;
- preserve a menor superficie de mudanca possivel;
- evite refatoracoes amplas fora do incremento;
- nao gere migrations sem solicitacao explicita para a rodada;
- mantenha rastreabilidade por batch;
- preserve a politica de `2026`;
- nao reintroduza dependencia de `NUMERO_PROCESSO` em `DLOB`.

Durante implementacao:

- prefira evolucao incremental;
- mantenha schemas e validacoes controladas;
- trate aliases e colunas extras com governanca;
- registre warnings claros;
- preserve `raw_row` e metadados necessarios para troubleshooting;
- evite transformar JSON auxiliar em modelo principal de consulta.

Ao concluir:

- informe arquivos alterados;
- explique a decisao tecnica;
- registre validacoes executadas;
- registre riscos residuais;
- atualize o tracker ativo quando uma task real for concluida.

## 8. Restricoes de Escopo Sem Pedido Explicito

Nao implementar sem solicitacao clara:

- autenticacao avancada;
- integracoes externas novas;
- UI administrativa de schemas;
- catalogo persistido de schemas;
- consolidacao fisica completa;
- materialized views como primeira opcao;
- dashboards fora do escopo solicitado;
- troca de stack;
- refatoracao estrutural ampla.

## 9. Validacao Recomendada

Quando a rodada envolver codigo, validar quando possivel:

```bash
npm test
npm run build
```

Quando a rodada envolver upload ou Supabase:

- validar batch criado;
- validar arquivo armazenado;
- validar linhas normalizadas;
- validar politica de `2026`;
- validar views afetadas;
- validar que `DLOB` segue sem `NUMERO_PROCESSO`.

Rodadas puramente documentais nao exigem build/testes, mas devem ao menos conferir `git status` e a estrutura de `docs/`.
