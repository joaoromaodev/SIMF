"use client";

import { useState } from "react";

export default function ErrorBanner({ message }) {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-800 rounded-lg px-5 py-4 shadow-sm">
      <svg
        className="flex-shrink-0 mt-0.5"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <p className="text-sm font-medium flex-1 leading-relaxed">
        {message || "Erro ao buscar dados do Supabase. Os dados exibidos podem estar incompletos."}
      </p>
      <button
        onClick={() => setVisible(false)}
        aria-label="Fechar aviso"
        className="flex-shrink-0 text-red-400 hover:text-red-600 transition-colors ml-2"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}
