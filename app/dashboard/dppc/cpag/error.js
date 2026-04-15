"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function CpagError({ error, reset }) {
  useEffect(() => {
    console.error("[CPAG] Erro não tratado:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="bg-white border border-red-200 rounded-lg shadow-md p-10 max-w-md w-full text-center space-y-5">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#ef4444"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>

        <div className="space-y-1">
          <h2 className="text-lg font-black text-slate-900 tracking-tight">
            Erro ao carregar o Dashboard CPAG
          </h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            {error?.message || "Não foi possível conectar ao banco de dados. Verifique sua conexão e tente novamente."}
          </p>
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <button
            onClick={reset}
            className="w-full px-4 py-2 bg-para-blue text-white text-sm font-black uppercase tracking-widest rounded hover:opacity-90 transition-opacity"
          >
            Tentar novamente
          </button>
          <Link
            href="/dashboard/dppc"
            className="w-full px-4 py-2 bg-slate-100 text-slate-600 text-sm font-black uppercase tracking-widest rounded hover:bg-slate-200 transition-colors text-center"
          >
            Voltar ao Hub DPPC
          </Link>
        </div>
      </div>
    </div>
  );
}
