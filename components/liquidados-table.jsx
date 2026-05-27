"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { formatCurrency } from "../lib/utils/formatters";

function FilterInput({ label, value, onChange }) {
  return (
    <div className="flex flex-col gap-1 min-w-0">
      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
        {label}
      </label>
      <div className="relative">
        <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Filtrar por ${label.toLowerCase()}…`}
          className="w-full pl-7 pr-7 py-1.5 text-xs text-slate-700 bg-white border border-slate-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 placeholder:text-slate-300"
        />
        {value && (
          <button
            onClick={() => onChange("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
          >
            <X size={12} />
          </button>
        )}
      </div>
    </div>
  );
}

export function LiquidadosTable({ liquidados, pagina = 1, totalPages = 1, total = 0, ano = "2026" }) {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [statusFilter,   setStatusFilter]   = useState("todos");
  const [filtroCredor,   setFiltroCredor]   = useState(() => searchParams.get("credor")   || "");
  const [filtroProcesso, setFiltroProcesso] = useState(() => searchParams.get("processo") || "");

  // Sincroniza filtros de texto com a URL (debounce 400 ms)
  useEffect(() => {
    const id = setTimeout(() => {
      const p = new URLSearchParams(searchParams.toString());
      if (filtroCredor)   p.set("credor",   filtroCredor);   else p.delete("credor");
      if (filtroProcesso) p.set("processo", filtroProcesso); else p.delete("processo");
      // Volta à página 1 ao filtrar
      p.delete("paginaLiq");
      router.replace(`?${p.toString()}`, { scroll: false });
    }, 400);
    return () => clearTimeout(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroCredor, filtroProcesso]);

  // Filtro de status + credor/processo aplicado client-side sobre os 50 rows da página
  const filteredLiquidados = liquidados.filter((item) => {
    const pago  = parseFloat(item.valor_ja_pago_obs) || 0;
    const bruto = parseFloat(item.valor_bruto)       || 0;
    if (statusFilter === "pendente" && !(pago === 0))               return false;
    if (statusFilter === "parcial"  && !(pago > 0 && pago < bruto)) return false;
    if (statusFilter === "todos"    && !(pago < bruto))             return false;
    // credor/processo são filtrados server-side, mas aplicamos client-side também
    // para resposta imediata enquanto a URL não propagou ainda
    const norm = (s) => (s ?? "").toLowerCase().trim();
    if (filtroCredor   && !norm(item.credor).includes(norm(filtroCredor)))             return false;
    if (filtroProcesso && !norm(item.numero_processo).includes(norm(filtroProcesso))) return false;
    return true;
  });

  const hasFilter = filtroCredor || filtroProcesso || statusFilter !== "todos";

  function clearAll() {
    setFiltroCredor("");
    setFiltroProcesso("");
    setStatusFilter("todos");
  }

  return (
    <>
      {/* ── Barra de filtros ── */}
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <FilterInput label="Credor"   value={filtroCredor}   onChange={setFiltroCredor}   />
          <FilterInput label="Processo" value={filtroProcesso} onChange={setFiltroProcesso} />
          <div className="flex flex-col gap-1 min-w-0">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
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
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-medium">
            {filteredLiquidados.length}
            {filteredLiquidados.length !== liquidados.length && (
              <span className="text-slate-300"> / {liquidados.length}</span>
            )}{" "}
            registros
          </span>
          {hasFilter && (
            <button
              onClick={clearAll}
              className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-widest text-blue-500 hover:text-blue-700 transition-colors"
            >
              <X size={11} /> Limpar filtros
            </button>
          )}
        </div>
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

      {/* Paginação — oculta quando há filtros locais ativos */}
      {!hasFilter && totalPages > 1 && (
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <span className="text-[11px] text-slate-400 font-medium">
            Página <span className="font-black text-slate-600">{pagina}</span> de{" "}
            <span className="font-black text-slate-600">{totalPages}</span>
            <span className="text-slate-300 mx-2">·</span>
            {total.toLocaleString("pt-BR")} registros no total
          </span>
          <div className="flex items-center gap-1">
            <Link
              href={`/dashboard/dppc/cpag?aba=liquidados&ano=${ano}&paginaLiq=${pagina - 1}`}
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
              href={`/dashboard/dppc/cpag?aba=liquidados&ano=${ano}&paginaLiq=${pagina + 1}`}
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
