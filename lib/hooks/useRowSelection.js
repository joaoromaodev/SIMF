"use client";

import { useState, useCallback } from "react";

export function useRowSelection(rows, idField = "documento_liquidacao") {
  const [selectedIds, setSelectedIds] = useState(new Set());

  const toggleRow = useCallback((id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelectedIds((prev) => {
      const allIds = rows.map((r) => r[idField]);
      const allSelected = allIds.every((id) => prev.has(id));
      return allSelected ? new Set() : new Set(allIds);
    });
  }, [rows, idField]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const calculateTotal = useCallback(
    (field = "valor_liquidado_a_pagar") => {
      return rows
        .filter((r) => selectedIds.has(r[idField]))
        .reduce((sum, r) => sum + (parseFloat(r[field]) || 0), 0);
    },
    [rows, selectedIds, idField]
  );

  const isSelected = (id) => selectedIds.has(id);
  const allSelected = rows.length > 0 && rows.every((r) => selectedIds.has(r[idField]));
  const someSelected = selectedIds.size > 0 && !allSelected;

  return {
    selectedIds,
    selectedCount: selectedIds.size,
    toggleRow,
    toggleAll,
    clearSelection,
    calculateTotal,
    isSelected,
    allSelected,
    someSelected,
  };
}