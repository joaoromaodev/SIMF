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

The initial MVP stack will use:
- `Next.js` for the frontend application
- `Supabase` as the backend platform
- `Postgres` for persistence
- `Supabase Storage` for original CSV files
- server-side functions for ingestion, validation, normalization, and materialized consolidated table refresh

This stack prioritizes rapid implementation while preserving a strong path for evolution into a stable administrative platform.

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
- Implement the MVP on `Next.js + Supabase`, using Postgres, Storage, and server-side functions as the primary technical foundation.
- Reject unsupported file types and malformed files with actionable validation feedback for operators.

## Capabilities

### New Capabilities
- `siafe-report-import`: Upload, validate, normalize, and register metadata for SIAFE `NE+DL` and `DL+OB` CSV imports.
- `siafe-report-consolidation`: Build and materialize a consolidated dataset keyed by `Processo > NE > DL > OB` from the normalized SIAFE imports for BI consumption.

### Modified Capabilities

None.

## Impact

- Affects the Next.js application layer, server-side upload and import flows, Supabase persistence, CSV parsing and validation logic, normalization rules, and persistence for import metadata and normalized rows.
- Introduces or expands Postgres storage for upload batches, validation results, normalized report rows, and consolidated lineage records.
- Uses Supabase Storage for preserving original uploaded CSV files.
- Establishes the materialized source contract that BI consumers will use instead of raw uploaded files.
- Requires test coverage for file validation, normalization mapping, relationship consolidation, year-based import rules, daily active-year replacement, and partial-import handling.