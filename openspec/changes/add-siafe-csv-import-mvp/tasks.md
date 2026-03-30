## 1. Import Foundations

- [x] 1.1 Define the supported SIAFE report types, exact required columns, and canonical field mappings for `NE+DL` and `DL+OB`
- [x] 1.2 Define the canonical identifiers and business hierarchy:
  - `numero_processo`
  - `codigo_nota_empenho`
  - `documento_liquidacao`
  - `ordem_bancaria`
- [x] 1.3 Define the year-scope import policy for:
  - `2023_2024` static historical load
  - `2025` static historical load
  - `2026` active-year daily load with full replacement by report type
- [x] 1.4 Define the MVP technical stack and implementation boundaries:
  - `Next.js` frontend
  - `Supabase Postgres` persistence
  - `Supabase Storage` for original CSV files
  - server-side functions for import and consolidation workflows
- [x] 1.5 Add storage structures for `import_batches`, validation outcomes, normalized `NE+DL` rows, and normalized `DL+OB` rows
- [x] 1.6 Implement the upload entry point in the Next.js application and route files through the appropriate server-side import flow

## 2. Validation And Normalization

- [x] 2.1 Implement file-level validation for extension, report type, filename/year-scope rule, and required columns with actionable error messages
- [x] 2.2 Implement exact header validation for `NE+DL` using:
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
- [x] 2.3 Implement exact header validation for `DL+OB` using:
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
- [x] 2.4 Implement row parsing and header normalization into the canonical SIAFE field schema
- [x] 2.5 Preserve DLOB business fields separately:
  - `ob_credor_documento`
  - `ob_credor_nome`
  - `dl_documento_credor`
  - `dl_nome_credor`
- [x] 2.6 Persist import metadata for both successful and failed upload attempts
- [x] 2.7 Persist original uploaded CSV files to Supabase Storage and link them to their import batches
- [x] 2.8 Reassess and finalize the order of structural validation vs original file persistence to Storage, keeping traceability and failure handling consistent

## 3. Consolidation

- [ ] 3.1 Implement deterministic merging of normalized rows into the `Processo > NE > DL > OB` hierarchy
- [ ] 3.2 Join `NE+DL` and `DL+OB` primarily by `documento_liquidacao`
- [ ] 3.3 Preserve `numero_processo` as the top-level traceability key throughout the lineage
- [ ] 3.4 Support partial lineage persistence so incomplete relationships remain available for future enrichment, including DL records without OB
- [ ] 3.5 Build and expose the materialized BI-facing consolidated table from canonical records rather than raw report schemas
- [x] 3.6 Harden the active-year daily replacement policy for `2026`, ensuring safe and consistent full replacement of the prior dataset of the same report type
- [ ] 3.7 Rebuild or refresh the materialized consolidated table after each successful `2026` replacement import

## 4. Verification

- [x] 4.1 Add automated tests for supported report validation, missing-column failures, and header normalization
- [ ] 4.2 Add automated tests for hierarchy consolidation across `NE+DL` and `DL+OB` imports, including partial matches and DL without OB
- [x] 4.3 Add automated tests for year-scope behavior:
  - static historical import acceptance
  - historical overwrite rejection
  - active-year `2026` full replacement behavior
  - prior active batch deactivation
  - prior normalized row removal/replacement
  - single active batch guarantee per report type/year
- [ ] 4.4 Validate the end-to-end MVP flow with representative SIAFE CSV samples:
  - `2023_2024_NEDL.csv`
  - `2025_NEDL.csv`
  - `2026_NEDL.csv`
  - `2023_2024_DLOB.csv`
  - `2025_DLOB.csv`
  - `2026_DLOB.csv`
- [ ] 4.5 Document unresolved semantic questions for follow-up:
  - `valor_liquido` vs `valor_liquido_2`
  - whether the materialized consolidated table refresh runs after each active-year upload or only after both daily files are loaded
