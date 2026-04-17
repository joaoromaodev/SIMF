"use client";

import { formatCurrency } from "../lib/utils/formatters";
import { X, CheckSquare } from "lucide-react";

export function SelectionCalculator({ selectedCount, totalValue, onClear, onAction }) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-200/60 flex items-center justify-between px-5 py-4 gap-4">

        {/* Esquerda */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
              <CheckSquare size={14} className="text-white" />
            </div>
            <span className="text-sm font-black text-slate-800">
              {selectedCount} {selectedCount === 1 ? "linha" : "linhas"}
            </span>
          </div>
          <div className="h-5 w-px bg-slate-200" />
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Total selecionado</p>
            <p className="text-base font-black text-emerald-600 leading-none mt-0.5">
              {formatCurrency(totalValue)}
            </p>
          </div>
        </div>

        {/* Direita */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {onAction && (
            <button
              onClick={onAction}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-black uppercase tracking-widest rounded-lg transition-colors"
            >
              Confirmar Seleção
            </button>
          )}
          <button
            onClick={onClear}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
            title="Limpar seleção"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}