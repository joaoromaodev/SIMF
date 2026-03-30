## ADDED Requirements

### Requirement: Consolidate imported data into Processo to OB lineage
The system SHALL consolidate normalized SIAFE records into a hierarchy ordered as `Processo > NE > DL > OB`.

#### Scenario: Build full lineage from complementary reports
- **WHEN** normalized imports provide matching identifiers across `NE+DL` and `DL+OB` data
- **THEN** the system produces consolidated records that link `Processo` to `NE`, `NE` to `DL`, and `DL` to `OB`

#### Scenario: Preserve partial lineage when child entities are missing
- **WHEN** a normalized import contains `Processo`, `NE`, or `DL` information but no matching downstream child entity yet
- **THEN** the system stores the available lineage and leaves missing lower levels empty without discarding the record

### Requirement: Use canonical identifiers for deterministic merging
The system SHALL merge normalized rows using canonical identifiers for each hierarchy level rather than raw source header names.

#### Scenario: Merge repeated identifiers across batches
- **WHEN** multiple import batches contain the same canonical `numero_processo`, `codigo_nota_empenho`, `documento_liquidacao`, or `ordem_bancaria`
- **THEN** the system merges them into the same logical lineage using deterministic matching rules

#### Scenario: Keep unmatched records available for later enrichment
- **WHEN** a normalized row cannot yet be linked to another hierarchy level
- **THEN** the system persists the row so a future import can enrich the same lineage

### Requirement: Use Documento de Liquidacao as the primary cross-report consolidation key
The system SHALL use `documento_liquidacao` as the main cross-report key for linking `NE+DL` and `DL+OB` normalized records.

#### Scenario: Join NE+DL and DL+OB by Documento de Liquidacao
- **WHEN** a normalized `NE+DL` row and a normalized `DL+OB` row share the same canonical `documento_liquidacao`
- **THEN** the system links them into the same financial lineage

#### Scenario: Preserve top-level traceability through Numero do Processo
- **WHEN** consolidated lineage is built from both report families
- **THEN** `numero_processo` remains available as the top-level traceability key

### Requirement: Respect the business cardinality of the financial hierarchy
The system SHALL represent the business lineage according to the known relationships:
- `1 Processo : N NE`
- `1 NE : N DL`
- `1 DL : N OB`

#### Scenario: One process has multiple empenhos
- **WHEN** multiple normalized rows reference the same `numero_processo` but different `codigo_nota_empenho`
- **THEN** the system links them to one process and multiple NEs

#### Scenario: One empenho has multiple liquidacoes
- **WHEN** multiple normalized rows reference the same `codigo_nota_empenho` but different `documento_liquidacao`
- **THEN** the system links them to one NE and multiple DLs

#### Scenario: One liquidacao has multiple ordens bancarias
- **WHEN** multiple normalized rows reference the same `documento_liquidacao` but different `ordem_bancaria`
- **THEN** the system links them to one DL and multiple OBs

### Requirement: Expose a materialized BI-ready consolidated dataset
The system SHALL provide a materialized consolidated dataset that BI consumers can query without needing to understand report-specific schemas.

#### Scenario: BI consumer reads consolidated data
- **WHEN** a BI process requests SIAFE import output
- **THEN** the system returns canonical fields and hierarchy relationships derived from the materialized consolidated dataset

#### Scenario: Source lineage remains traceable
- **WHEN** a consolidated record is inspected for troubleshooting
- **THEN** the system can trace the record back to the import batch or batches that contributed to it

### Requirement: Support historical and active-year consolidation behavior
The system SHALL consolidate historical static batches and active-year batches without losing traceability.

#### Scenario: Consolidate static historical years
- **WHEN** the system processes `2023_2024` and `2025` datasets
- **THEN** they are kept as historical reference data in the consolidated source

#### Scenario: Refresh active-year lineage for 2026
- **WHEN** a new valid `2026` batch supersedes the prior active-year import for the same report type
- **THEN** the consolidated dataset reflects the newest active-year records while preserving batch lineage

### Requirement: Rebuild materialized consolidated data after successful active-year import
The system SHALL refresh the materialized consolidated table after successful `2026` replacement imports.

#### Scenario: Refresh after new 2026 NEDL import
- **WHEN** a new valid `2026_NEDL.csv` replaces the active `NE+DL` dataset
- **THEN** the system rebuilds or refreshes the materialized consolidated table to reflect the new active-year state

#### Scenario: Refresh after new 2026 DLOB import
- **WHEN** a new valid `2026_DLOB.csv` replaces the active `DL+OB` dataset
- **THEN** the system rebuilds or refreshes the materialized consolidated table to reflect the new active-year state