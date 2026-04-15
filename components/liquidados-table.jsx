"use client";

import { useRowSelection } from "../lib/hooks/useRowSelection";
import { SelectionCalculator } from "./selection-calculator";
import { formatCurrency } from "../lib/utils/formatters";

export function LiquidadosTable({ liquidados }) {
  const {
    toggleRow, toggleAll, clearSelection, calculateTotal,
    isSelected, allSelected, someSelected, selectedCount,
  } = useRowSelection(liquidados, "documento_liquidacao");

  const totalSelecionado = calculateTotal("valor_liquidado_a_pagar");

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr className="border-b border-slate-200">
              <th className="px-4 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => { if (el) el.indeterminate = someSelected; }}
                  onChange={toggleAll}
                  className="cursor-pointer"
                />
              </th>
              <th className="px-6 py-3 text-left font-black uppercase text-xs tracking-wider text-slate-700">Processo</th>
              <th className="px-6 py-3 text-left font-black uppercase text-xs tracking-wider text-slate-700">Empenho</th>
              <th className="px-6 py-3 text-left font-black uppercase text-xs tracking-wider text-slate-700">Credor</th>
              <th className="px-6 py-3 text-left font-black uppercase text-xs tracking-wider text-slate-700">Fonte</th>
              <th className="px-6 py-3 text-left font-black uppercase text-xs tracking-wider text-slate-700">DL</th>
              <th className="px-6 py-3 text-right font-black uppercase text-xs tracking-wider text-slate-700">Valor Liquido</th>
              <th className="px-6 py-3 text-right font-black uppercase text-xs tracking-wider text-slate-700">Valor Bruto</th>
              <th className="px-6 py-3 text-right font-black uppercase text-xs tracking-wider text-slate-700">A Pagar</th>
            </tr>
          </thead>
          <tbody>
            {liquidados.map((item, index) => (
              <tr
                key={item.documento_liquidacao}
                onClick={() => toggleRow(item.documento_liquidacao)}
                className={`border-b border-slate-100 cursor-pointer transition-colors ${
                  isSelected(item.documento_liquidacao)
                    ? "bg-blue-50"
                    : index % 2 === 0
                    ? "bg-white hover:bg-slate-100"
                    : "bg-slate-50 hover:bg-slate-100"
                }`}
              >
                <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={isSelected(item.documento_liquidacao)}
                    onChange={() => toggleRow(item.documento_liquidacao)}
                    className="cursor-pointer"
                  />
                </td>
                <td className="px-6 py-4 text-slate-800 font-medium">{item.numero_processo || "—"}</td>
                <td className="px-6 py-4 text-slate-700 font-mono text-xs">{item.codigo_nota_empenho || "—"}</td>
                <td className="px-6 py-4 text-slate-700">{item.credor || "—"}</td>
                <td className="px-6 py-4 text-slate-700">{item.fonte || "—"}</td>
                <td className="px-6 py-4 text-slate-700 font-mono text-xs">{item.documento_liquidacao || "—"}</td>
                <td className="px-6 py-4 text-right font-bold text-para-blue">{formatCurrency(item.valor_liquido)}</td>
                <td className="px-6 py-4 text-right font-bold text-para-blue">{formatCurrency(item.valor_bruto)}</td>
                <td className="px-6 py-4 text-right font-bold text-amber-600">{formatCurrency(item.valor_liquidado_a_pagar)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SelectionCalculator
        selectedCount={selectedCount}
        totalValue={totalSelecionado}
        onClear={clearSelection}
        onAction={() => console.log("acao sobre selecionadas")}
      />
    </>
  );
}