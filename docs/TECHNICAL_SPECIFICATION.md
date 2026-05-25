# Documentacao Tecnica - SIMF

## Visao Geral

O SIMF e uma aplicacao web desenvolvida com Next.js App Router e Supabase para ingestao, validacao, normalizacao e disponibilizacao de relatorios CSV do SIAFE.

A fase atual da arquitetura documental e tecnica trabalha com tres universos oficiais:

- `NE` - notas de empenho;
- `NEDL` - documentos de liquidacao vinculados a empenhos;
- `DLOB` - ordens bancarias vinculadas a liquidacoes.

A base alvo do painel e formada por tabelas normalizadas por universo e views SQL de BI/qualidade.

Referencias como `NE_DL`, `DL_OB`, `normalized_ne_dl_rows`, `normalized_dl_ob_rows` e `consolidated_siafe_lineage` pertencem ao desenho anterior ou a estudos/implementacoes legadas. Elas podem existir no codigo ou banco durante a transicao, mas nao sao o alvo principal da nova fase.

## Stack Tecnica

- **Frontend**: Next.js 15 App Router, React 19, Tailwind CSS v4
- **Backend**: Next.js API Routes e Server Actions
- **Banco e Storage**: Supabase, PostgreSQL e Supabase Storage
- **Charts**: Recharts
- **Icones**: lucide-react
- **Exportacao**: xlsx, jspdf, jspdf-autotable
- **Validacao e processamento**: schemas customizados em `lib/siafe/`

## Mapa de Rotas

| Rota | Arquivo | Descricao |
|---|---|---|
| `/` | `app/page.js` | Portal principal |
| `/dashboard/dppc` | `app/dashboard/dppc/page.js` | Hub DPPC |
| `/dashboard/dppc/cpag` | `app/dashboard/dppc/cpag/page.js` | Dashboard de Controle de Pagamentos |
| `/dashboard/dppc/cliq` | `app/dashboard/dppc/cliq/page.js` | Dashboard de Controle de Liquidacoes |
| `/dashboard/dfin` | `app/dashboard/dfin/page.js` | Hub DFIN |
| `/dashboard/import` | `app/dashboard/import/page.js` | Upload de relatorios CSV do SIAFE |

## API de Importacao

**POST `/api/imports`**

Parametros esperados no `FormData`:

- `file`
- `reportType`
- `yearScope`

Direcao alvo para `reportType`:

- `NE`
- `NEDL`
- `DLOB`

Direcao alvo para `yearScope`:

- `2023_2024`
- `2025`
- `2026`

Durante a transicao, o codigo pode ainda conter nomes antigos. Novas alteracoes devem convergir para os tipos oficiais.

## Autenticacao e Autorizacao

A frente planejada de autenticacao usara Supabase Auth para login e sessao.

O perfil operacional do usuario sera controlado por tabela propria `profiles`, com campo `role`.

Roles iniciais:

- `user` - pode acessar dashboards e consultar dados;
- `admin` - pode acessar dashboards, subir relatorios CSV e gerenciar usuarios.

Diretrizes:

- dashboards devem exigir usuario autenticado;
- `/dashboard/import` deve ser restrita a `admin`;
- `POST /api/imports` deve validar permissao `admin` no backend;
- a UI pode esconder acoes nao permitidas, mas nao deve ser a fonte de autorizacao;
- o primeiro `admin` sera criado manualmente no Supabase;
- roles desconhecidos ou usuarios sem perfil devem negar acesso por padrao.

A especificacao detalhada da frente esta em `docs/auth-access-control.md`.

## Arquitetura de Dados

### Hierarquia de Negocio

```text
Processo
  -> NE
  -> NEDL
  -> DLOB
```

Chaves principais:

| Relacao | Chave |
|---|---|
| `NE` -> `NEDL` | `codigo_nota_empenho` |
| `NEDL` -> `DLOB` | `documento_liquidacao` |
| processo administrativo | `NE.numero_processo` |

`DLOB` nao possui `NUMERO_PROCESSO`. Qualquer processo exibido para ordem bancaria deve ser derivado por join:

```text
DLOB.documento_liquidacao
  -> NEDL.documento_liquidacao
  -> NEDL.codigo_nota_empenho
  -> NE.codigo_nota_empenho
  -> NE.numero_processo
```

### Modelo-Alvo

```text
CSV
  -> import_batches
  -> normalized_ne_rows
  -> normalized_nedl_rows
  -> normalized_dlob_rows
  -> views SQL
  -> painel / BI
```

### Tabelas Normalizadas Alvo

- `normalized_ne_rows`
- `normalized_nedl_rows`
- `normalized_dlob_rows`

Essas tabelas devem guardar linhas normalizadas, `import_batch_id`, `year_scope`, `source_row_number`, `raw_row` e campos canonicos necessarios para views.

### Tabelas e Estruturas Legadas

As estruturas abaixo podem existir no projeto por historico, mas nao representam o alvo principal da reestruturacao:

- `normalized_ne_dl_rows`
- `normalized_dl_ob_rows`
- tabelas canonicas fisicas completas como `processos`, `notas_empenho`, `documentos_liquidacao`, `ordens_bancarias`;
- `consolidated_siafe_lineage`;
- materialized views usadas como consolidacao principal.

A nova fase deve priorizar views SQL sobre normalizadas. Consolidacao fisica completa e materialized views so devem voltar a ser avaliadas se houver necessidade real apos validacao operacional.

### Tabela Auxiliar do Painel

- `marcacoes_pagamento` - confirmacoes manuais de pagamento.

Essa tabela deve permanecer auxiliar e complementar as views. Ela nao deve se tornar camada canonica completa do fluxo financeiro.

## Formato dos Relatorios CSV

O contrato oficial esta em `docs/estrutura_relatorios.md`.

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

### NE

Campos finais:

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

### NEDL

Campos finais:

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

### DLOB

Campos finais:

```text
OrdemBancaria
DatadoPagamento
DocumentodaLiquidacao
CodigoUnidadeGestora
NomeUsuarioQueCriou
Finalidade
Valor
```

`DLOB` nao deve exigir `NUMERO_PROCESSO`.

`DocumentodaLiquidacao` deve ser normalizado internamente como `documento_liquidacao`.

### Valores Monetarios

O formato atual esperado inclui:

```text
R$ 6,092.04
```

Valores monetarios devem ser persistidos como decimais normalizados, sem simbolo de moeda ou formatacao textual.

## Views de Negocio

Views ativas recomendadas:

- `vw_active_import_batches`
- `vw_ne_active`
- `vw_nedl_active`
- `vw_dlob_active`

Views de BI recomendadas:

- `vw_execucao_financeira`
- `vw_liquidados_a_pagar`
- `vw_pagamentos`
- `vw_monitoramento_pagamentos`

Views de qualidade recomendadas:

- `vw_status_carga_relatorios`
- `vw_nedl_sem_ne`
- `vw_dlob_sem_nedl`
- `vw_divergencia_processo_ne_nedl`

## Regra de Quitacao

Uma DL so e considerada quitada quando a soma das OBs vinculadas atinge ou supera o `Valor Bruto` da DL.

Regra base:

```text
sum(DLOB.valor) >= NEDL.valor_bruto
```

Saldo recomendado:

```text
greatest(NEDL.valor_bruto - coalesce(sum(DLOB.valor), 0), 0)
```

## Politica de Importacao

Durante desenvolvimento:

- historicos `2023_2024` e `2025` podem ser limpos e recarregados;
- `2026` permanece com substituicao integral por universo.

Apos estabilizacao:

- historicos devem ser travados apos carga validada;
- `2026` continua substituivel por universo enquanto for escopo ativo.

## Componentes Principais

### Server Components

- `app/dashboard/dppc/cpag/page.js` - consulta views do CPAG.
- `app/dashboard/dppc/cliq/page.js` - consulta dados de liquidacoes.

### Client Components

- `components/liquidados-table.jsx`
- `components/selection-calculator.jsx`
- `components/payment-toggle.jsx`
- `components/cpag-export-buttons.jsx`
- `components/upload-form.jsx`

### Hooks e Utilitarios

- `lib/hooks/useRowSelection.js`
- `lib/utils/formatters.js`
- `app/actions/pagamentos.js`

## Proximos Passos Tecnicos

As proximas implementacoes devem seguir `docs/roadmap_reestruturacao_supabase.md` e o tracker `docs/roadmap_reestruturacao_supabase_tasks.md`.

Antes de implementar mudancas funcionais, revisar:

- `docs/estrutura_relatorios.md`
- `docs/auth-access-control.md`
- `docs/roadmap_reestruturacao_supabase.md`
- `docs/roadmap_reestruturacao_supabase_tasks.md`
- `docs/CPAG_SPEC.md`, quando a mudanca afetar painel ou views de pagamento.
