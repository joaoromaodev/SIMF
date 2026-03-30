"use client";

import { useState } from "react";

const REPORT_OPTIONS = [
  { value: "NE_DL", label: "NE+DL" },
  { value: "DL_OB", label: "DL+OB" }
];

const YEAR_SCOPE_OPTIONS = [
  { value: "2023_2024", label: "2023_2024 (historical static)" },
  { value: "2025", label: "2025 (historical static)" },
  { value: "2026", label: "2026 (active replacement)" }
];

export function UploadForm() {
  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setStatus(null);

    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/imports", {
        method: "POST",
        body: formData
      });

      const payload = await response.json();

      if (!response.ok) {
        setStatus({ kind: "error", payload });
        return;
      }

      setStatus({ kind: "success", payload });
      event.currentTarget.reset();
    } catch (error) {
      setStatus({
        kind: "error",
        payload: {
          message: "The upload request failed before the server could complete the import.",
          errors: [error instanceof Error ? error.message : "Unknown network error"]
        }
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="upload-form" onSubmit={handleSubmit}>
      <div className="field-grid">
        <div className="field">
          <label htmlFor="reportType">Report type</label>
          <select id="reportType" name="reportType" defaultValue="NE_DL" required>
            {REPORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <small>Choose the import schema to validate against.</small>
        </div>

        <div className="field">
          <label htmlFor="yearScope">Year scope</label>
          <select id="yearScope" name="yearScope" defaultValue="2026" required>
            {YEAR_SCOPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <small>Historical years are locked after the first successful load.</small>
        </div>
      </div>

      <div className="field">
        <label htmlFor="file">CSV file</label>
        <input id="file" name="file" type="file" accept=".csv,text/csv" required />
        <small>
          Expected filenames follow the fixed import contract, for example
          `2026_NEDL.csv` or `2023_2024_DLOB.csv`.
        </small>
      </div>

      <div className="submit-row">
        <button type="submit" disabled={submitting}>
          {submitting ? "Uploading and importing..." : "Upload SIAFE CSV"}
        </button>
      </div>

      {status ? (
        <section className={`status-card ${status.kind}`}>
          <h2>{status.kind === "success" ? "Import completed" : "Import failed"}</h2>
          <p>{status.payload.message}</p>
          {status.payload.batch ? (
            <ul>
              <li>Batch ID: {status.payload.batch.id}</li>
              <li>Status: {status.payload.batch.status}</li>
              <li>Report type: {status.payload.batch.reportType}</li>
              <li>Year scope: {status.payload.batch.yearScope}</li>
              <li>Rows: {status.payload.batch.normalizedRowCount}</li>
            </ul>
          ) : null}
          {Array.isArray(status.payload.errors) && status.payload.errors.length > 0 ? (
            <ul>
              {status.payload.errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}
    </form>
  );
}
