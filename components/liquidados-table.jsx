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
              <th className="px-5 py-3 text-left font-black uppercase text-[11px] tracking-wider text-slate-500">Processo</th>
              <th className="px-5 py-3 text-left font-black uppercase text-[11px] tracking-wider text-slate-500">Empenho</th>
              <th className="px-5 py-3 text-left font-black uppercase text-[11px] tracking-wider text-slate-500">Credor</th>
              <th className="px-5 py-3 text-left font-black uppercase text-[11px] tracking-wider text-slate-500">Natureza</th>
              <th className="px-5 py-3 text-left font-black uppercase text-[11px] tracking-wider text-slate-500">Fonte</th>
              <th className="px-5 py-3 text-left font-black uppercase text-[11px] tracking-wider text-slate-500">DL</th>
              <th className="px-5 py-3 text-right font-black uppercase text-[11px] tracking-wider text-slate-500">Vl. Líquido</th>
              <th className="px-5 py-3 text-right font-black uppercase text-[11px] tracking-wider text-slate-500">Vl. Bruto</th>
              <th className="px-5 py-3 text-right font-black uppercase text-[11px] tracking-wider text-slate-500">Vl. Imposto</th>
              <th className="px-5 py-3 text-right font-black uppercase text-[11px] tracking-wider text-slate-500">A Pagar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {liquidados.map((item, index) => {
              const vlImposto = (parseFloat(item.valor_bruto) || 0) - (parseFloat(item.valor_liquido) || 0);
              return (
                <tr
                  key={item.documento_liquidacao ?? `row-${index}`}
                  onClick={() => toggleRow(item.documento_liquidacao)}
                  className={`cursor-pointer transition-colors ${
                    isSelected(item.documento_liquidacao)
                      ? "bg-blue-50"
                      : index % 2 === 0
                      ? "bg-white hover:bg-slate-50"
                      : "bg-slate-50/50 hover:bg-slate-100"
                  }`}
                >
                  <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isSelected(item.documento_liquidacao)}
                      onChange={() => toggleRow(item.documento_liquidacao)}
                      className="cursor-pointer"
                    />
                  </td>
                  <td className="px-5 py-3.5 text-slate-800 font-semibold text-xs">{item.numero_processo || "—"}</td>
                  <td className="px-5 py-3.5 font-mono text-[11px] text-slate-500">{item.codigo_nota_empenho || "—"}</td>
                  <td className="px-5 py-3.5 text-slate-600 text-xs max-w-[160px] truncate">{item.credor || "—"}</td>
                  <td className="px-5 py-3.5 text-slate-600 text-xs">{item.codigo_natureza_despesa || "—"}</td>
                  <td className="px-5 py-3.5 text-slate-600 text-xs">{item.fonte || "—"}</td>
                  <td className="px-5 py-3.5 font-mono text-[11px] text-slate-500">{item.documento_liquidacao || "—"}</td>
                  <td className="px-5 py-3.5 text-right font-mono font-bold text-para-blue text-xs">{formatCurrency(item.valor_liquido)}</td>
                  <td className="px-5 py-3.5 text-right font-mono font-bold text-para-blue text-xs">{formatCurrency(item.valor_bruto)}</td>
                  <td className="px-5 py-3.5 text-right font-mono font-bold text-slate-500 text-xs">{formatCurrency(vlImposto)}</td>
                  <td className="px-5 py-3.5 text-right font-mono font-bold text-amber-600 text-xs">{formatCurrency(item.valor_liquidado_a_pagar)}</td>
                </tr>
              );
            })}
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