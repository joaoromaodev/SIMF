"use client";

export default function CeoExportButtons() {
  return (
    <div className="space-y-3">
      <button
        disabled
        className="w-full flex items-center justify-between px-4 py-3 border border-slate-200 rounded-lg bg-slate-50 opacity-50 cursor-not-allowed"
      >
        <div className="text-left">
          <p className="text-sm font-black text-slate-800">Exportar XLSX</p>
          <p className="text-xs text-slate-500 font-medium">Planilha de empenhos</p>
        </div>
        <svg className="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      </button>

      <button
        disabled
        className="w-full flex items-center justify-between px-4 py-3 border border-slate-200 rounded-lg bg-slate-50 opacity-50 cursor-not-allowed"
      >
        <div className="text-left">
          <p className="text-sm font-black text-slate-800">Exportar PDF</p>
          <p className="text-xs text-slate-500 font-medium">Relatório com cabeçalho</p>
        </div>
        <svg className="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      </button>
    </div>
  );
}
