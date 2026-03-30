## Why

The team needs a reliable MVP to ingest SIAFE `.csv` reports without manual cleanup before analysis. Creating a defined import flow now reduces data quality issues, preserves traceability for each upload, and produces a BI-ready consolidated dataset from the two available report families.

The MVP will start from six known CSV files:
- `2023_2024_NEDL.csv`
- `2025_NEDL.csv`
- `2026_NEDL.csv`
- `2023_2024_DLOB.csv`
- `2025_DLOB.csv`
- `2026_DLOB.csv`

The `2023_2024` and `2025` files are static historical loads. The `2026` files are active operational datasets and will be uploaded daily, with each new valid upload fully replacing the prior `2026` dataset of the same report type.

## What Changes

- Add an MVP flow to upload SIAFE `.csv` files for the `NE+DL` and `DL+OB` report formats.
- Validate each uploaded file against the required columns for its report type before data is accepted.
- Normalize incoming field names into a canonical schema so downstream processing does not depend on report-specific headers.
- Store import metadata for each upload, including report type, filename, reference period, timestamps, record counts, and validation outcome.
- Consolidate imported rows into a BI-oriented dataset using the hierarchy `Processo > NE > DL > OB`.
- Use `documento_liquidacao` as the primary cross-report consolidation key between `NE+DL` and `DL+OB`.
- Treat `numero_processo` as the top-level traceability key across the lineage.
- Support historical static imports for `2023_2024` and `2025`, and daily replacement of the active `2026` datasets.
- Materialize the consolidated BI dataset into a table used directly by BI consumers.
- Reject unsupported file types and malformed files with actionable validation feedback for operators.

## Capabilities

### New Capabilities
- `siafe-report-import`: Upload, validate, normalize, and register metadata for SIAFE `NE+DL` and `DL+OB` CSV imports.
- `siafe-report-consolidation`: Build and materialize a consolidated dataset keyed by `Processo > NE > DL > OB` from the normalized SIAFE imports for BI consumption.

### Modified Capabilities

None.

## Impact

- Affects backend import endpoints, CSV parsing and validation logic, normalization rules, and persistence for import metadata and normalized rows.
- Introduces or expands storage for upload batches, validation results, normalized report rows, and consolidated lineage records.
- Establishes the materialized source contract that BI consumers will use instead of raw uploaded files.
- Requires test coverage for file validation, normalization mapping, relationship consolidation, year-based import rules, daily active-year replacement, and partial-import handling.