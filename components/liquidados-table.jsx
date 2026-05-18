"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatCurrency } from "../lib/utils/formatters";

export function LiquidadosTable({ liquidados, pagina = 1, totalPages = 1, total = 0, ano = "2026" }) {
  const [statusFilter, setStatusFilter] = useState("todos");

  const filteredLiquidados = liquidados.filter((item) => {
    const pago  = parseFloat(item.valor_ja_pago_obs) || 0;
    const bruto = parseFloat(item.valor_bruto)       || 0;
    if (statusFilter === "pendente") return pago === 0;
    if (statusFilter === "parcial")  return pago > 0 && pago < bruto;
    return pago < bruto; // "todos" — exclui quitados por padrão
  });

  return (
    <>
      {/* ── Barra de filtros ── */}
      <div className="px-6 py-3 border-b border-slate-100 flex items-center gap-4 bg-slate-50/50">
        <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap">
          Status
        </label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 cursor-pointer"
        >
          <option value="todos">Todos</option>
          <option value="pendente">Pendente de Pagamento</option>
          <option value="parcial">Pago Parcial</option>
        </select>
        <span className="ml-auto text-[11px] text-slate-400 font-medium">
          {filteredLiquidados.length}
          {filteredLiquidados.length !== liquidados.length && (
            <span className="text-slate-300"> / {liquidados.length}</span>
          )}{" "}
          registros
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr className="border-b border-slate-200">
              <th className="px-5 py-3 text-left font-black uppercase text-[11px] tracking-wider text-slate-500">Processo</th>
              <th className="px-5 py-3 text-left font-black uppercase text-[11px] tracking-wider text-slate-500">Empenho</th>
              <th className="px-5 py-3 text-left font-black uppercase text-[11px] tracking-wider text-slate-500">Credor</th>
              <th className="px-5 py-3 text-left font-black uppercase text-[11px] tracking-wider text-slate-500">Natureza</th>
              <th className="px-5 py-3 text-left font-black uppercase text-[11px] tracking-wider text-slate-500">Fonte</th>
              <th className="px-5 py-3 text-left font-black uppercase text-[11px] tracking-wider text-slate-500">DL</th>
              <th className="px-5 py-3 text-left font-black uppercase text-[11px] tracking-wider text-slate-500">Dt. Liquidação</th>
              <th className="px-5 py-3 text-right font-black uppercase text-[11px] tracking-wider text-slate-500">Pago em OBs</th>
              <th className="px-5 py-3 text-right font-black uppercase text-[11px] tracking-wider text-slate-500">Vl. Líquido</th>
              <th className="px-5 py-3 text-right font-black uppercase text-[11px] tracking-wider text-slate-500">Vl. Bruto</th>
              <th className="px-5 py-3 text-right font-black uppercase text-[11px] tracking-wider text-slate-500">Vl. Imposto</th>
              <th className="px-5 py-3 text-right font-black uppercase text-[11px] tracking-wider text-slate-500">A Pagar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredLiquidados.map((item, index) => {
              const vlImposto = (parseFloat(item.valor_bruto) || 0) - (parseFloat(item.valor_liquido) || 0);
              return (
                <tr
                  key={item.documento_liquidacao ?? `row-${index}`}
                  className={`transition-colors ${index % 2 === 0 ? "bg-white hover:bg-slate-50" : "bg-slate-50/50 hover:bg-slate-100"}`}
                >
                  <td className="px-5 py-3.5 text-slate-800 font-semibold text-xs">{item.numero_processo || "—"}</td>
                  <td className="px-5 py-3.5 font-mono text-[11px] text-slate-500">{item.codigo_nota_empenho || "—"}</td>
                  <td className="px-5 py-3.5 text-slate-600 text-xs max-w-[160px] truncate">{item.credor || "—"}</td>
                  <td className="px-5 py-3.5 text-slate-600 text-xs">{item.codigo_natureza_despesa || "—"}</td>
                  <td className="px-5 py-3.5 text-slate-600 text-xs">{item.fonte || "—"}</td>
                  <td className="px-5 py-3.5 font-mono text-[11px] text-slate-500">{item.documento_liquidacao || "—"}</td>
                  <td className="px-5 py-3.5 text-slate-500 text-xs">{item.data_liquidacao ? new Date(item.data_liquidacao).toLocaleDateString("pt-BR") : "—"}</td>
                  <td className="px-5 py-3.5 text-right font-mono font-bold text-emerald-600 text-xs">{formatCurrency(item.valor_ja_pago_obs)}</td>
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

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <span className="text-[11px] text-slate-400 font-medium">
            Página <span className="font-black text-slate-600">{pagina}</span> de{" "}
            <span className="font-black text-slate-600">{totalPages}</span>
            <span className="text-slate-300 mx-2">·</span>
            {total.toLocaleString("pt-BR")} registros no total
          </span>
          <div className="flex items-center gap-1">
            <Link
              href={`/dashboard/dppc/cpag?ano=${ano}&paginaLiq=${pagina - 1}`}
              aria-disabled={pagina <= 1}
              className={`inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-black uppercase tracking-widest rounded-lg border transition-colors ${
                pagina <= 1
                  ? "border-slate-100 text-slate-300 pointer-events-none"
                  : "border-slate-200 text-slate-500 bg-white hover:bg-slate-50 hover:text-slate-700"
              }`}
            >
              <ChevronLeft size={12} /> Anterior
            </Link>
            <Link
              href={`/dashboard/dppc/cpag?ano=${ano}&paginaLiq=${pagina + 1}`}
              aria-disabled={pagina >= totalPages}
              className={`inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-black uppercase tracking-widest rounded-lg border transition-colors ${
                pagina >= totalPages
                  ? "border-slate-100 text-slate-300 pointer-events-none"
                  : "border-slate-200 text-slate-500 bg-white hover:bg-slate-50 hover:text-slate-700"
              }`}
            >
              Próxima <ChevronRight size={12} />
            </Link>
          </div>
        </div>
      )}

    </>
  );
}
