## Context

The MVP must accept two SIAFE report variants, `NE+DL` and `DL+OB`, that arrive as CSV exports with fixed known headers and yearly file batches. The business value is not just storing rows but turning them into a predictable lineage where `Processo` groups `NE`, `NE` groups `DL`, and `DL` groups `OB`.

The initial operating model includes six CSV files:
- `2023_2024_NEDL.csv`
- `2025_NEDL.csv`
- `2026_NEDL.csv`
- `2023_2024_DLOB.csv`
- `2025_DLOB.csv`
- `2026_DLOB.csv`

The `2023_2024` and `2025` files are historical and static after import. The `2026` files are the active yearly datasets and may be re-uploaded until the year closes.

Because BI consumers need a stable dataset, the import path should separate raw upload concerns from canonical storage and from the final consolidated view.

The current repository has no existing OpenSpec capabilities for this workflow, so the design should minimize coupling and make future report types additive. The MVP should prioritize correctness, traceability, and deterministic consolidation over advanced reconciliation or repair tooling.

## Goals / Non-Goals

**Goals:**
- Accept only `.csv` uploads for the two supported SIAFE report types.
- Validate required headers before rows are persisted.
- Map source-specific headers into canonical field names used by downstream logic.
- Record per-import metadata and validation results for auditing and support.
- Consolidate normalized data into a BI-ready dataset based on `Processo > NE > DL > OB`.
- Use `documento_liquidacao` as the primary join key between `NE+DL` and `DL+OB`.
- Allow partial coverage across reports while keeping lineage explicit, such as a `DL` without an `OB` yet.
- Enforce the year-batch rule: `2023_2024` and `2025` are static; `2026` is replaceable until year end.

**Non-Goals:**
- Supporting spreadsheets, PDFs, or additional SIAFE report families in the MVP.
- Building a full operator UI for reconciliation, retry orchestration, or historical diffing.
- Performing advanced deduplication across semantically similar but conflicting uploads beyond basic import identity rules.
- Designing final BI dashboards or analytics models beyond the consolidated source dataset.
- Supporting arbitrary year/version lifecycle rules beyond the explicitly defined `2023_2024`, `2025`, and `2026` behavior.

## Decisions

### 1. Separate import batches from normalized business records

The system will store an import batch record per uploaded file and normalized rows linked to that batch. This keeps operational metadata, validation state, and business data distinct.

Rationale:
- Batch-level traceability is required for support and auditing.
- Reprocessing or invalidating a batch becomes simpler when business rows are associated with an import boundary.
- The year-based loading policy requires distinguishing historical static loads from active-year refreshes.

Alternatives considered:
- Store only consolidated output and discard import lineage. Rejected because failures and source provenance become hard to audit.
- Store raw CSV text only. Rejected because downstream logic would repeatedly parse and normalize the same file.

### 2. Use explicit report-type schemas for validation and normalization

Each supported report type will define its own required columns and a mapping from source headers to canonical field names. The importer identifies the report type up front and applies the corresponding schema.

Rationale:
- `NE+DL` and `DL+OB` files contain different header sets but overlap in identifiers.
- The headers are already known, so explicit schemas are safer and easier to test than heuristic field inference.

Alternatives considered:
- Infer report type from fuzzy header matching. Rejected because false positives would create silent data corruption.
- Normalize rows with ad hoc conditional logic scattered across the importer. Rejected because it makes new report types harder to add.

### 3. Use explicit canonical identifiers and business hierarchy

The canonical hierarchy for the MVP is:
- `numero_processo`
- `codigo_nota_empenho`
- `documento_liquidacao`
- `ordem_bancaria`

The business lineage is:
- `1 Processo : N NE`
- `1 NE : N DL`
- `1 DL : N OB`

Rationale:
- This reflects the known domain model already defined by the team.
- It gives the importer and consolidator fixed business anchors.

Alternatives considered:
- Treat only `processo` and `DL` as primary business keys. Rejected because NE and OB are also first-class entities in the lineage.
- Build a generic flat dataset without explicit hierarchy. Rejected because BI consumers need stable traceability.

### 4. Consolidate through canonical entity keys instead of report-specific joins

Normalized rows will be merged into canonical entities keyed by `numero_processo`, `codigo_nota_empenho`, `documento_liquidacao`, and `ordem_bancaria` as available. Cross-report consolidation will use `documento_liquidacao` as the primary join key.

Rationale:
- `NE+DL` contributes `Processo + NE + DL`.
- `DL+OB` contributes `Processo + DL + OB`.
- `documento_liquidacao` is the operational bridge between both report families.

Alternatives considered:
- Build separate datasets per report and let BI join them. Rejected because it pushes source complexity downstream.
- Require a fully connected chain on every import. Rejected because the source files do not provide that guarantee.

### 5. Fail fast on missing required columns, but allow row-level nulls where relationships are incomplete

File-level validation will reject uploads missing mandatory headers for the declared report type. Once the schema is valid, row parsing may still produce incomplete relationships, which will be stored and marked as partial rather than rejected outright.

Rationale:
- Missing headers mean the file cannot be interpreted safely.
- Incomplete row relationships are expected in the domain and still provide usable information.

Alternatives considered:
- Reject any row without the full hierarchy. Rejected because it would drop legitimate intermediate data.
- Accept files with missing required headers and guess column intent. Rejected because it undermines data quality.

### 6. Preserve ambiguous source fields separately until business meaning is confirmed

The importer must preserve semantically ambiguous fields as separate canonical fields when their business meaning is not yet fully validated.

Known cases:
- `Valor Liquido` vs `Valor Liquido2`
- `CredorDocumento` vs `DocumentoCredor`
- `Credor_Nome` vs `NomeCredor`

Rationale:
- Premature collapsing of these fields may lose information.
- The MVP should preserve source fidelity while still enabling BI use.

Alternatives considered:
- Merge ambiguous fields immediately. Rejected because the semantic meaning has not yet been confirmed.
- Drop one of the duplicate-looking fields. Rejected because this may destroy relevant source data.

### 7. Use year-scoped import policy

The importer will classify uploads by report family and reference year scope:
- `2023_2024`: static historical load
- `2025`: static historical load
- `2026`: mutable active-year load

Rationale:
- This reflects the operating rule defined by the team.
- Historical batches should not be overwritten accidentally.
- The active year needs controlled refresh capability.

Alternatives considered:
- Treat every upload as a new immutable batch forever. Rejected because the active-year dataset must evolve during the year.
- Allow unrestricted replacement for all years. Rejected because historical data should remain locked once loaded.

## Canonical Schemas

### NE+DL required source headers

- `DocumentodeLiquidacao`
- `CodigoNotadeEmpenho`
- `CodigoPlanoInterno`
- `CodigoProjetoAtividade`
- `CodigoNaturezaDaDespesa`
- `CodigoFonteDeRecurso`
- `CodigoDetalhamentoFr`
- `NUMERO_PROCESSO`
- `InstituicaoCodigoUnidadeGestora`
- `Valor Original`
- `Valor Liquido`
- `Valor Bruto`
- `Valor Retido`
- `Valor Pago`
- `Valor Liquidado a Pagar`
- `Valor Liquido2`

### DL+OB required source headers

- `OrdemBancaria`
- `CredorDocumento`
- `Credor_Nome`
- `DatadoPagamento`
- `CodigoFonteDeRecurso`
- `CodigoDetalhamentoFr`
- `DocumentodeLiquidacao`
- `DocumentoCredor`
- `NomeCredor`
- `NUMERO_PROCESSO`
- `CodigoUnidadeGestora`
- `Valor`

### Canonical field mapping for NE+DL

- `DocumentodeLiquidacao` -> `documento_liquidacao`
- `CodigoNotadeEmpenho` -> `codigo_nota_empenho`
- `CodigoPlanoInterno` -> `codigo_plano_interno`
- `CodigoProjetoAtividade` -> `codigo_projeto_atividade`
- `CodigoNaturezaDaDespesa` -> `codigo_natureza_despesa`
- `CodigoFonteDeRecurso` -> `codigo_fonte_recurso`
- `CodigoDetalhamentoFr` -> `codigo_detalhamento_fr`
- `NUMERO_PROCESSO` -> `numero_processo`
- `InstituicaoCodigoUnidadeGestora` -> `codigo_unidade_gestora`
- `Valor Original` -> `valor_original`
- `Valor Liquido` -> `valor_liquido`
- `Valor Bruto` -> `valor_bruto`
- `Valor Retido` -> `valor_retido`
- `Valor Pago` -> `valor_pago`
- `Valor Liquidado a Pagar` -> `valor_liquidado_a_pagar`
- `Valor Liquido2` -> `valor_liquido_2`

### Canonical field mapping for DL+OB

- `OrdemBancaria` -> `ordem_bancaria`
- `CredorDocumento` -> `credor_documento`
- `Credor_Nome` -> `credor_nome`
- `DatadoPagamento` -> `data_pagamento`
- `CodigoFonteDeRecurso` -> `codigo_fonte_recurso`
- `CodigoDetalhamentoFr` -> `codigo_detalhamento_fr`
- `DocumentodeLiquidacao` -> `documento_liquidacao`
- `DocumentoCredor` -> `documento_credor`
- `NomeCredor` -> `nome_credor`
- `NUMERO_PROCESSO` -> `numero_processo`
- `CodigoUnidadeGestora` -> `codigo_unidade_gestora`
- `Valor` -> `valor`

## Suggested Persistence Model

- `import_batches`
- `normalized_ne_dl_rows`
- `normalized_dl_ob_rows`
- `processos`
- `notas_empenho`
- `documentos_liquidacao`
- `ordens_bancarias`
- `consolidated_siafe_lineage` (table or view)

## Risks / Trade-offs

- [Conflicting uploads for the same identifiers] -> Keep import batch lineage and use deterministic upsert rules so conflicts can be inspected and corrected later.
- [Header variability across SIAFE exports] -> Centralize the exact known headers and canonical mappings in schema definitions.
- [Partial hierarchies may confuse BI consumers] -> Persist explicit nulls and lineage flags so downstream models can distinguish missing data from failed processing.
- [Large files may increase import latency] -> Process rows in a streaming or chunked manner if supported by the implementation stack, and persist batch progress metadata.
- [Static historical years accidentally overwritten] -> Enforce year-scope rules at upload validation time.
- [Ambiguous source columns interpreted incorrectly] -> Preserve ambiguous fields separately until business validation confirms canonical collapse rules.

## Migration Plan

1. Introduce storage for import batches, normalized report rows, and canonical lineage entities.
2. Add the CSV ingestion workflow for `NE+DL` and `DL+OB` with exact header validation and normalization.
3. Enforce year-scope rules for `2023_2024`, `2025`, and `2026`.
4. Add consolidation logic that materializes or exposes the BI-ready `Processo > NE > DL > OB` dataset.
5. Backfill by importing the historical files `2023_2024` and `2025`, then load the active `2026` files.
6. Roll back by disabling the upload entry point and ignoring new batches; batch-linked records allow targeted cleanup if needed.

## Open Questions

- What is the final business meaning of `valor_liquido` versus `valor_liquido_2`?
- What is the final business meaning of `credor_documento` versus `documento_credor`, and `credor_nome` versus `nome_credor`?
- Should repeated `2026` uploads replace the prior active-year dataset atomically or create a superseded batch history with one active version?
- Does BI need a fully materialized table, or is a database view over normalized and canonical entities sufficient for the MVP?