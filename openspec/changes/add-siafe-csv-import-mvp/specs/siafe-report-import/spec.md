## ADDED Requirements

### Requirement: Upload supported SIAFE CSV reports
The system SHALL accept uploads only for SIAFE `.csv` files classified as `NE+DL` or `DL+OB`.

#### Scenario: Accept supported CSV upload
- **WHEN** an operator uploads a `.csv` file and provides a supported report type
- **THEN** the system accepts the file for validation and import processing

#### Scenario: Reject unsupported file type
- **WHEN** an operator uploads a file that is not a `.csv`
- **THEN** the system rejects the upload and reports that only `.csv` files are supported

#### Scenario: Reject unsupported report type
- **WHEN** an operator submits a `.csv` file for a report type other than `NE+DL` or `DL+OB`
- **THEN** the system rejects the upload and reports the supported report types

### Requirement: Validate required columns by report type
The system SHALL validate that each uploaded SIAFE report contains the exact required columns defined for its report type before persisting normalized business data.

#### Scenario: Required columns are present in NE+DL
- **WHEN** a valid `NE+DL` CSV file includes all required columns:
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
- **THEN** the system continues to normalization and persistence

#### Scenario: Required columns are present in DL+OB
- **WHEN** a valid `DL+OB` CSV file includes all required columns:
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
- **THEN** the system continues to normalization and persistence

#### Scenario: Required columns are missing
- **WHEN** an uploaded CSV file is missing one or more required columns for its declared report type
- **THEN** the system rejects the import and returns the missing column names

### Requirement: Normalize source headers into canonical field names
The system SHALL translate report-specific source headers into a canonical field schema used by downstream consolidation.

#### Scenario: Normalize NE+DL fields
- **WHEN** an `NE+DL` file passes validation
- **THEN** the system maps its source headers into canonical fields including:
  - `numero_processo`
  - `codigo_nota_empenho`
  - `documento_liquidacao`
  - `codigo_plano_interno`
  - `codigo_projeto_atividade`
  - `codigo_natureza_despesa`
  - `codigo_fonte_recurso`
  - `codigo_detalhamento_fr`
  - `codigo_unidade_gestora`
  - `valor_original`
  - `valor_liquido`
  - `valor_bruto`
  - `valor_retido`
  - `valor_pago`
  - `valor_liquidado_a_pagar`
  - `valor_liquido_2`

#### Scenario: Normalize DL+OB fields
- **WHEN** a `DL+OB` file passes validation
- **THEN** the system maps its source headers into canonical fields including:
  - `numero_processo`
  - `documento_liquidacao`
  - `ordem_bancaria`
  - `ob_credor_documento`
  - `ob_credor_nome`
  - `dl_documento_credor`
  - `dl_nome_credor`
  - `data_pagamento`
  - `codigo_fonte_recurso`
  - `codigo_detalhamento_fr`
  - `codigo_unidade_gestora`
  - `valor`

### Requirement: Preserve distinct DL and OB creditor fields
The system SHALL preserve creditor-related source fields as distinct canonical attributes because they refer to different hierarchy levels.

#### Scenario: Preserve OB creditor fields separately
- **WHEN** a `DL+OB` file contains `CredorDocumento` and `Credor_Nome`
- **THEN** the system stores them as `ob_credor_documento` and `ob_credor_nome`

#### Scenario: Preserve DL creditor fields separately
- **WHEN** a `DL+OB` file contains `DocumentoCredor` and `NomeCredor`
- **THEN** the system stores them as `dl_documento_credor` and `dl_nome_credor`

### Requirement: Record import metadata for every upload attempt
The system SHALL persist metadata for each upload attempt, including report type, original filename, import timestamp, reference year scope, validation status, and record counts.

#### Scenario: Successful import metadata is recorded
- **WHEN** a CSV import completes successfully
- **THEN** the system stores a batch record with success status, the number of processed records, and the file reference scope

#### Scenario: Failed import metadata is recorded
- **WHEN** a CSV import fails validation or processing
- **THEN** the system stores a batch record with failed status and the relevant validation or processing error details

### Requirement: Enforce year-scope upload rules
The system SHALL apply different import behavior depending on the yearly scope of the uploaded file.

#### Scenario: Accept static historical file load
- **WHEN** an operator uploads one of the historical files for `2023_2024` or `2025` for the first approved load
- **THEN** the system imports it as a static historical dataset

#### Scenario: Prevent accidental overwrite of historical static data
- **WHEN** an operator attempts to replace a locked historical dataset for `2023_2024` or `2025`
- **THEN** the system rejects the operation or requires an explicit administrative override outside normal MVP flow

#### Scenario: Allow daily active-year replacement for 2026 NEDL
- **WHEN** an operator uploads a new valid `2026_NEDL.csv`
- **THEN** the system fully replaces the previously active `2026` `NE+DL` dataset and records the new batch as active

#### Scenario: Allow daily active-year replacement for 2026 DLOB
- **WHEN** an operator uploads a new valid `2026_DLOB.csv`
- **THEN** the system fully replaces the previously active `2026` `DL+OB` dataset and records the new batch as active