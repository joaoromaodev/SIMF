# Especificacao de Desenvolvimento - Modulo CPAG

## Objetivo

O CPAG e o dashboard de Controle de Pagamentos do SIMF.

Na nova arquitetura, o CPAG deve consumir views SQL construidas sobre os tres universos normalizados:

- `NE`
- `NEDL`
- `DLOB`

O modulo nao deve depender diretamente de consolidacao fisica completa para operar no MVP.

## Estado Funcional Existente

Funcionalidades ja previstas ou implementadas historicamente:

- tela em `app/dashboard/dppc/cpag/page.js`;
- tabelas de "Liquidados a Pagar" e "Monitoramento de Pagamentos";
- KPIs com totais de pagamentos e saldos;
- selecao de linhas;
- calculadora de saldo;
- exportacao XLSX/PDF;
- confirmacao manual de pagamento via `marcacoes_pagamento`.

Este documento agora define a direcao esperada dessas funcionalidades dentro do modelo `NE` / `NEDL` / `DLOB`.

## Fonte de Dados

O CPAG deve consumir views SQL.

Views principais:

- `vw_liquidados_a_pagar`
- `vw_monitoramento_pagamentos`

Views auxiliares ou futuras equivalentes podem ser criadas, desde que preservem as regras deste documento.

## Regra de Dados do DLOB

`DLOB` nao possui `NUMERO_PROCESSO`.

Nenhuma view do CPAG deve exigir `NUMERO_PROCESSO` diretamente em `DLOB`.

Quando o painel precisar exibir o processo de uma OB, o valor deve ser derivado por:

```text
DLOB.DocumentodaLiquidacao
  -> NEDL.DocumentodeLiquidacao
  -> NEDL.CodigoNotadeEmpenho
  -> NE.CodigoNotadeEmpenho
  -> NE.NUMERO_PROCESSO
```

No modelo normalizado:

```text
normalized_dlob_rows.documento_liquidacao
  -> normalized_nedl_rows.documento_liquidacao
  -> normalized_nedl_rows.codigo_nota_empenho
  -> normalized_ne_rows.codigo_nota_empenho
  -> normalized_ne_rows.numero_processo
```

## vw_liquidados_a_pagar

`vw_liquidados_a_pagar` deve ser baseada em `NEDL` enriquecida pela soma das OBs vinculadas em `DLOB`.

Regra central:

```text
uma DL so e considerada quitada quando sum(DLOB.valor) >= NEDL.valor_bruto
```

Saldo recomendado:

```text
valor_ja_pago_obs = coalesce(sum(DLOB.valor), 0)
valor_liquidado_a_pagar = greatest(NEDL.valor_bruto - valor_ja_pago_obs, 0)
```

A view deve retornar DLs com saldo positivo.

Pagamentos parciais devem permanecer visiveis.

Campos esperados ou equivalentes:

| Coluna UI | Campo da view |
|---|---|
| Processo | `numero_processo` |
| Empenho | `codigo_nota_empenho` |
| Credor | `credor` ou `credor_nome` |
| Natureza | `codigo_natureza_despesa` |
| Fonte | `fonte` ou `codigo_fonte_recurso` |
| DL | `documento_liquidacao` |
| Dt. Liquidacao | `data_liquidacao` |
| Pago em OBs | `valor_ja_pago_obs` |
| Vl. Liquido | `valor_liquido` |
| Vl. Bruto | `valor_bruto` |
| Vl. Imposto | `valor_bruto - valor_liquido` |
| A Pagar | `valor_liquidado_a_pagar` |

`numero_processo` nesta view pode vir diretamente de `NEDL` ou, preferencialmente, ser reconciliado com `NE.numero_processo` por `codigo_nota_empenho`.

## vw_monitoramento_pagamentos

`vw_monitoramento_pagamentos` deve ser baseada em `DLOB` enriquecida por `NEDL`, `NE` e `marcacoes_pagamento`.

O processo deve ser derivado por `DLOB -> NEDL -> NE`.

A view pode fazer `left join` com `marcacoes_pagamento` para exibir status manual.

Campos esperados ou equivalentes:

| Coluna UI | Campo da view |
|---|---|
| Processo | `numero_processo` derivado |
| Credor | `credor` ou `credor_nome` |
| Fonte | `fonte` ou `codigo_fonte_recurso` |
| DL | `documento_liquidacao` |
| Dt. Liquidacao | `data_liquidacao` |
| OB | `ordem_bancaria` |
| Data Pgto | `data_pagamento` |
| Valor | `valor` |
| Status | `confirmado_manualmente` |
| Confirmado por | `confirmado_por` |
| Confirmado em | `confirmado_em` |
| Observacao | `observacao` |

## marcacoes_pagamento

`marcacoes_pagamento` permanece como tabela auxiliar do painel.

Ela deve registrar confirmacoes manuais, observacoes e metadados de usuario quando disponiveis.

Ela nao deve virar camada canonica completa e nao deve substituir as views de dados SIAFE.

Na arquitetura `NE` / `NEDL` / `DLOB`, a marcacao manual deve usar `ordem_bancaria` como chave textual independente, sem exigir que a OB exista na tabela canonica historica `ordens_bancarias`.

Join recomendado:

- por `ordem_bancaria`, quando a OB estiver disponivel e for chave operacional suficiente;
- complementarmente por `documento_liquidacao`, se a estrategia funcional futura exigir;
- evitar fallback inseguro por `numero_processo`.

## Regras de Integridade Para o CPAG

- `DLOB` sem `NEDL` correspondente deve aparecer em view de qualidade, nao ser associado por heuristica fragil.
- Divergencia entre `NE.numero_processo` e `NEDL.numero_processo` deve aparecer em view de auditoria.
- A regra de quitacao deve usar soma de OBs contra `Valor Bruto`, nao apenas campo `Valor Pago` do `NEDL`.
- Pagamentos manuais nao alteram o valor financeiro da OB; apenas adicionam status operacional no painel.

## Checklist Funcional Historico

As tarefas abaixo descrevem funcionalidades do CPAG ja trabalhadas em ciclos anteriores e permanecem como referencia de comportamento esperado:

- [x] Estrutura visual do dashboard CPAG.
- [x] Tabelas de liquidados a pagar e monitoramento.
- [x] Exportacao XLSX/PDF.
- [x] Consumo de dados reais via Supabase.
- [x] Selecao de linhas e calculadora de saldo.
- [x] Server Action para marcacao manual.

## Pendencias da Nova Arquitetura

- [ ] Revisar as views atuais para garantir base em `normalized_ne_rows`, `normalized_nedl_rows` e `normalized_dlob_rows`.
- [ ] Garantir que `vw_liquidados_a_pagar` use soma de `DLOB` contra `NEDL.valor_bruto`.
- [ ] Garantir que `vw_monitoramento_pagamentos` derive processo por `DLOB -> NEDL -> NE`.
- [ ] Garantir que nenhuma view do CPAG exija `NUMERO_PROCESSO` em `DLOB`.
- [ ] Validar o CPAG com os 9 CSVs da nova arquitetura.
