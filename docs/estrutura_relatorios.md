# SIMF - Contrato Oficial dos Relatorios SIAFE

## Finalidade

Este documento define o contrato oficial dos arquivos CSV SIAFE aceitos pelo SIMF na fase de reestruturacao Supabase para tres universos:

- `NE`
- `NEDL`
- `DLOB`

Os nomes antigos `NE_DL` e `DL_OB` sao legados e nao devem ser usados como referencia principal para novas implementacoes.

## Arquivos Esperados

O conjunto completo de carga operacional e composto por 9 arquivos CSV:

| Escopo | NE | NEDL | DLOB |
|---|---|---|---|
| `2023_2024` | `2023_2024_NE.csv` | `2023_2024_NEDL.csv` | `2023_2024_DLOB.csv` |
| `2025` | `2025_NE.csv` | `2025_NEDL.csv` | `2025_DLOB.csv` |
| `2026` | `2026_NE.csv` | `2026_NEDL.csv` | `2026_DLOB.csv` |

## Universo NE

O universo `NE` representa notas de empenho.

Campos finais do CSV:

```text
CodigoNotadeEmpenho
DatadoEmpenho
NomeUsuarioQueCriou
InstituicaoCodigoUnidadeGestora
NUMERO_PROCESSO
Valor Original
Valor Corrente
Saldo a Liquidar
Quantidade
```

Mapeamento canonico recomendado:

| Campo CSV | Campo interno |
|---|---|
| `CodigoNotadeEmpenho` | `codigo_nota_empenho` |
| `DatadoEmpenho` | `data_empenho` |
| `NomeUsuarioQueCriou` | `nome_usuario_criou` |
| `InstituicaoCodigoUnidadeGestora` | `codigo_unidade_gestora` |
| `NUMERO_PROCESSO` | `numero_processo` |
| `Valor Original` | `valor_original` |
| `Valor Corrente` | `valor_corrente` |
| `Saldo a Liquidar` | `saldo_a_liquidar` |
| `Quantidade` | `quantidade` |

## Universo NEDL

O universo `NEDL` representa documentos de liquidacao vinculados a notas de empenho.

Campos finais do CSV:

```text
DocumentodeLiquidacao
DatadaLiquidacao
CodigoNotadeEmpenho
CodigoNaturezaDaDespesa
NomeFonteDeRecurso
CodigoFonteDeRecurso
NomeDetalhamentoFr
CodigoDetalhamentoFr
NUMERO_PROCESSO
CodigoProjetoAtividade
NomeCredor
CONTRATO
CONVENIO
Valor Original
Valor Liquido
Valor Bruto
Valor Retido
Valor Pago
Valor Liquidado a Pagar
```

Mapeamento canonico recomendado:

| Campo CSV | Campo interno |
|---|---|
| `DocumentodeLiquidacao` | `documento_liquidacao` |
| `DatadaLiquidacao` | `data_liquidacao` |
| `CodigoNotadeEmpenho` | `codigo_nota_empenho` |
| `CodigoNaturezaDaDespesa` | `codigo_natureza_despesa` |
| `NomeFonteDeRecurso` | `nome_fonte_recurso` |
| `CodigoFonteDeRecurso` | `codigo_fonte_recurso` |
| `NomeDetalhamentoFr` | `nome_detalhamento_fr` |
| `CodigoDetalhamentoFr` | `codigo_detalhamento_fr` |
| `NUMERO_PROCESSO` | `numero_processo` |
| `CodigoProjetoAtividade` | `codigo_projeto_atividade` |
| `NomeCredor` | `credor_nome` |
| `CONTRATO` | `contrato` |
| `CONVENIO` | `convenio` |
| `Valor Original` | `valor_original` |
| `Valor Liquido` | `valor_liquido` |
| `Valor Bruto` | `valor_bruto` |
| `Valor Retido` | `valor_retido` |
| `Valor Pago` | `valor_pago` |
| `Valor Liquidado a Pagar` | `valor_liquidado_a_pagar` |

## Universo DLOB

O universo `DLOB` representa ordens bancarias vinculadas a documentos de liquidacao.

Campos finais do CSV:

```text
OrdemBancaria
DatadoPagamento
DocumentodaLiquidacao
CodigoUnidadeGestora
NomeUsuarioQueCriou
Finalidade
Valor
```

Mapeamento canonico recomendado:

| Campo CSV | Campo interno |
|---|---|
| `OrdemBancaria` | `ordem_bancaria` |
| `DatadoPagamento` | `data_pagamento` |
| `DocumentodaLiquidacao` | `documento_liquidacao` |
| `CodigoUnidadeGestora` | `codigo_unidade_gestora` |
| `NomeUsuarioQueCriou` | `nome_usuario_criou` |
| `Finalidade` | `finalidade` |
| `Valor` | `valor` |

Regra obrigatoria: `DLOB` nao possui `NUMERO_PROCESSO`. O campo nao deve ser exigido em upload, normalizacao, views ou BI. Se existir em estruturas antigas por legado, nao deve orientar a nova regra de negocio.

O campo `DocumentodaLiquidacao` do CSV `DLOB` deve mapear para o campo canonico interno `documento_liquidacao`.

## Chaves de Cruzamento

| Relacao | Chave |
|---|---|
| `NE` -> `NEDL` | `NE.CodigoNotadeEmpenho = NEDL.CodigoNotadeEmpenho` |
| `NEDL` -> `DLOB` | `NEDL.DocumentodeLiquidacao = DLOB.DocumentodaLiquidacao` |
| Processo administrativo | preferencialmente `NE.NUMERO_PROCESSO` |

O `NUMERO_PROCESSO` presente em `NEDL` deve ser usado como apoio, validacao e auditoria. O vinculo principal entre `NE` e `NEDL` ocorre por `CodigoNotadeEmpenho`.

## Derivacao do Processo para OB

Como `DLOB` nao possui `NUMERO_PROCESSO`, qualquer view ou painel que exiba processo para uma ordem bancaria deve derivar esse valor pelo encadeamento:

```text
DLOB.DocumentodaLiquidacao
  -> NEDL.DocumentodeLiquidacao
  -> NEDL.CodigoNotadeEmpenho
  -> NE.CodigoNotadeEmpenho
  -> NE.NUMERO_PROCESSO
```

Views de qualidade devem identificar `DLOB` sem `NEDL` correspondente e divergencias entre `NE.NUMERO_PROCESSO` e `NEDL.NUMERO_PROCESSO`.

## Parsing Monetario

Campos monetarios devem ser normalizados para decimal antes da persistencia.

O parser deve aceitar o formato exportado nos CSVs SIAFE, incluindo valores com simbolo e separadores:

```text
R$ 6,092.04
6,092.04
6092.04
```

Regras:

- remover simbolos de moeda e espacos;
- interpretar virgula como separador de milhar quando houver ponto decimal;
- interpretar ponto como separador decimal no formato americano exportado;
- persistir valores como numericos decimais, nunca como texto formatado.

Se novos CSVs vierem com formato brasileiro (`6.092,04`), a aceitacao deve ser decisao explicita e testada antes de entrar no contrato operacional.

## Regra de Quitacao

Uma DL so e considerada quitada quando a soma das OBs vinculadas atinge ou supera o `Valor Bruto` da DL.

Calculo recomendado para views:

```text
soma_obs = sum(DLOB.Valor) por documento_liquidacao
saldo_liquidado_a_pagar = greatest(NEDL.Valor Bruto - soma_obs, 0)
quitada = soma_obs >= NEDL.Valor Bruto
```

Pagamentos parciais devem permanecer visiveis ate que a soma das OBs alcance o valor bruto.

## Referencia Historica

O conteudo anterior deste arquivo misturava campos antigos, campos conflitantes de `DLOB` e consultas MDX de apoio. Ele foi preservado em:

```text
docs/archive/estrutura_relatorios_legacy.md
```

Esse arquivo arquivado pode ser consultado para historico de cubos e MDX, mas nao deve ser usado como contrato principal.
