"use client";

import { formatCurrency } from "../lib/utils/formatters";

export function SelectionCalculator({ selectedCount, totalValue, onClear, onAction }) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-gray-200 border-t border-gray-400 shadow-lg">
      <div className="flex items-center gap-6">
        <span className="text-sm font-bold">
          {selectedCount} linha{selectedCount !== 1 ? "s" : ""} selecionada{selectedCount !== 1 ? "s" : ""}
        </span>
        <span className="text-sm">
          Total selecionado: <strong>{formatCurrency(totalValue)}</strong>
        </span>
      </div>
      <div className="flex items-center gap-3">
        {onAction && (
          <button onClick={onAction} className="px-4 py-2 text-sm font-bold bg-gray-800 text-white rounded">
            Confirmar Selecionadas
          </button>
        )}
        <button onClick={onClear} className="px-4 py-2 text-sm font-bold bg-white border border-gray-400 rounded">
          Limpar Selecao
        </button>
      </div>
    </div>
  );
}