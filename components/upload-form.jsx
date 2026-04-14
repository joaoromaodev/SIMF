"use client";

import { useState } from "react";

const REPORT_OPTIONS = [
  { value: "NE+DL", label: "NE+DL" },
  { value: "DL+OB", label: "DL+OB" }
];

const YEAR_SCOPE_OPTIONS = [
  { value: "2023_2024", label: "2023_2024 (Histórico)" },
  { value: "2025", label: "2025 (Histórico)" },
  { value: "2026", label: "2026 (Ativo)" }
];

export function UploadForm() {
  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget; 
    setSubmitting(true);
    setStatus(null);

    const formData = new FormData(form);

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
      form.reset(); 
    } catch (error) {
      setStatus({
        kind: "error",
        payload: {
          message: "A requisição falhou antes de completar a importação.",
          errors: [error instanceof Error ? error.message : "Erro de rede desconhecido"]
        }
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="space-y-8" onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="flex flex-col space-y-2">
          <label htmlFor="reportType" className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tipo de Relatório</label>
          <select id="reportType" name="reportType" defaultValue="NE+DL" required className="w-full p-3 bg-white border border-slate-300 rounded text-sm font-medium focus:border-para-blue outline-none transition-all">
            {REPORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div className="flex flex-col space-y-2">
          <label htmlFor="yearScope" className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Ano de Referência</label>
          <select id="yearScope" name="yearScope" defaultValue="2026" required className="w-full p-3 bg-white border border-slate-300 rounded text-sm font-medium focus:border-para-blue outline-none transition-all">
            {YEAR_SCOPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>
      <div className="flex flex-col space-y-2">
        <label htmlFor="file" className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Arquivo CSV (SIAFE)</label>
        <div className="p-8 border border-slate-200 rounded bg-slate-50">
          <input id="file" name="file" type="file" accept=".csv,text/csv" required className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-6 file:rounded file:border-0 file:text-[10px] file:font-black file:uppercase file:bg-para-blue file:text-white hover:file:bg-blue-800 cursor-pointer transition-all" />
        </div>
      </div>
      <button type="submit" disabled={submitting} className={`w-full py-4 text-white text-xs font-black uppercase tracking-widest rounded shadow-md transition-all ${submitting ? 'bg-slate-400' : 'bg-para-blue hover:bg-blue-900'}`}>
        {submitting ? "Processando..." : "Processar Relatório SIAFE"}
      </button>
      {status && (
        <div className={`p-4 rounded border text-xs font-bold uppercase tracking-wider ${status.kind === "success" ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-para-red"}`}>
          {status.payload.message}
          {status.kind === "success" && Array.isArray(status.payload.warnings) && status.payload.warnings.length > 0 && (
            <ul className="mt-3 list-disc pl-5 text-left normal-case tracking-normal font-medium text-amber-700">
              {status.payload.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          )}
          {Array.isArray(status.payload.errors) && status.payload.errors.length > 0 && (
            <ul className="mt-3 list-disc pl-5 text-left normal-case tracking-normal font-medium">
              {status.payload.errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </form>
  );
}
