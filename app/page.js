import { UploadForm } from "../components/upload-form";

export default function HomePage() {
  return (
    <main className="page-shell">
      <section className="page-panel">
        <header className="hero">
          <p className="eyebrow">SIMF import operations</p>
          <h1>SIAFE CSV Intake</h1>
          <p>
            Upload one official SIAFE CSV at a time, store the original file in Supabase
            Storage, validate the exact header contract, normalize the report fields, and
            persist the batch for operational traceability.
          </p>
          <div className="hero-grid">
            <div className="hero-card">
              <strong>Supported reports</strong>
              <span>`NE+DL` and `DL+OB` only</span>
            </div>
            <div className="hero-card">
              <strong>Year scopes</strong>
              <span>`2023_2024`, `2025`, and active `2026` replacement</span>
            </div>
            <div className="hero-card">
              <strong>This slice</strong>
              <span>Upload, validate, normalize, store, and persist metadata</span>
            </div>
          </div>
        </header>
        <div className="content">
          <UploadForm />
        </div>
      </section>
    </main>
  );
}

