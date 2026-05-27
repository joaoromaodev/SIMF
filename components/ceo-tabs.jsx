"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X, Wrench, Landmark, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value ?? 0);
}

function formatDate(dateString) {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("pt-BR");
}

const TABS = [
  { id: "empenhos", label: "Empenhos Gerados"            },
  { id: "prds",     label: "Fila de PRDs (Aguardando NE)" },
];

export function CeoTabs({ empenhos = [], ano, pagina = 1, totalPages = 1, total = 0, pageSize = 50, abaAtiva = "empenhos" }) {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const [busca, setBusca] = useState(() => searchParams.get("q") || "");

  // Sincroniza busca à URL (debounce 400 ms)
  useEffect(() => {
    const id = setTimeout(() => {
      const p = new URLSearchParams(searchParams.toString());
      if (busca) p.set("q", busca); else p.delete("q");
      p.delete("pagina");
      router.replace(`?${p.toString()}`, { scroll: false });
    }, 400);
    return () => clearTimeout(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busca]);

  function switchTab(id) {
    if (id === abaAtiva) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("aba", id);
    params.delete("pagina");
    router.push(`/dashboard/dfin/ceo?${params.toString()}`);
  }

  const empenhosFiltrados = useMemo(() => {
    const q = busca.toLowerCase().trim();
    if (!q) return empenhos;
    return empenhos.filter((r) =>
      (r.numero_processo ?? "").toLowerCase().includes(q) ||
      (r.codigo_nota_empenho ?? "").toLowerCase().includes(q)
    );
  }, [empenhos, busca]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">

      {/* Barra de abas */}
      <div className="flex border-b border-slate-200 bg-slate-50/60">
        {TABS.map((tab) => {
          const isActive = abaAtiva === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => switchTab(tab.id)}
              className={`
                relative px-6 py-4 text-[11px] font-black uppercase tracking-widest
                transition-colors duration-150 focus:outline-none
                ${isActive
                  ? "text-blue-600 bg-white shadow-[inset_0_-2px_0_0] shadow-blue-600"
                  : "text-slate-400 hover:text-slate-600 hover:bg-white/60"
                }
              `}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Aba 1: Empenhos Gerados */}
      {abaAtiva === "empenhos" && (
        <>
          {/* Barra de busca */}
          <div className="px-6 py-3 border-b border-slate-100 flex items-center gap-4 bg-slate-50/50">
            <div className="relative max-w-xs w-full">
              <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por Processo ou NE…"
                className="w-full pl-8 pr-8 py-1.5 text-xs text-slate-700 bg-white border border-slate-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 placeholder:text-slate-300"
              />
              {busca && (
                <button
                  onClick={() => setBusca("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
                >
                  <X size={12} />
                </button>
              )}
            </div>
            <span className="ml-auto text-[11px] text-slate-400 font-medium whitespace-nowrap">
              {empenhosFiltrados.length}
              {empenhosFiltrados.length !== empenhos.length && (
                <span className="text-slate-300"> / {empenhos.length}</span>
              )}{" "}
              registros
            </span>
          </div>

          {empenhosFiltrados.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr className="border-b border-slate-200">
                    {[
                      { label: "UG",               align: "text-left"  },
                      { label: "Data Empenho",      align: "text-left"  },
                      { label: "Processo",          align: "text-left"  },
                      { label: "NE",                align: "text-left"  },
                      { label: "Criado Por",        align: "text-left"  },
                      { label: "Vl. Original",      align: "text-right" },
                      { label: "Vl. Corrente",      align: "text-right" },
                      { label: "Saldo a Liquidar",  align: "text-right" },
                    ].map(({ label, align }) => (
                      <th
                        key={label}
                        className={`px-5 py-3 font-black uppercase text-[11px] tracking-wider text-slate-500 ${align}`}
                      >
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {empenhosFiltrados.map((row, index) => (
                    <tr
                      key={`${row.codigo_nota_empenho}-${index}`}
                      className={`transition-colors hover:bg-slate-50 ${index % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}
                    >
                      <td className="px-5 py-3.5 font-mono text-[11px] text-slate-500">{row.codigo_unidade_gestora || "—"}</td>
                      <td className="px-5 py-3.5 text-slate-500 text-xs whitespace-nowrap">{formatDate(row.data_empenho)}</td>
                      <td className="px-5 py-3.5 text-slate-800 font-semibold text-xs">{row.numero_processo || "—"}</td>
                      <td className="px-5 py-3.5 font-mono text-[11px] text-slate-500 whitespace-nowrap">{row.codigo_nota_empenho || "—"}</td>
                      <td className="px-5 py-3.5 text-slate-600 text-xs max-w-[160px] truncate">{row.nome_usuario_criou || "—"}</td>
                      <td className="px-5 py-3.5 text-right font-mono font-bold text-slate-500 text-xs whitespace-nowrap">{formatCurrency(row.valor_original)}</td>
                      <td className="px-5 py-3.5 text-right font-mono font-bold text-blue-600 text-xs whitespace-nowrap">{formatCurrency(row.valor_corrente)}</td>
                      <td className="px-5 py-3.5 text-right font-mono font-bold text-amber-600 text-xs whitespace-nowrap">{formatCurrency(row.saldo_a_liquidar)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-16 text-center">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                <Landmark size={18} className="text-slate-400" />
              </div>
              <p className="text-slate-400 text-sm font-medium">
                {busca
                  ? "Nenhum empenho encontrado para a busca aplicada."
                  : "Nenhum empenho encontrado para este exercício."}
              </p>
            </div>
          )}

          {/* Paginação */}
          {!busca && totalPages > 1 && (
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
              <span className="text-[11px] text-slate-400 font-medium">
                Página <span className="font-black text-slate-600">{pagina}</span> de{" "}
                <span className="font-black text-slate-600">{totalPages}</span>
                <span className="text-slate-300 mx-2">·</span>
                {total.toLocaleString("pt-BR")} registros no total
              </span>
              <div className="flex items-center gap-1">
                <Link
                  href={(() => { const p = new URLSearchParams(searchParams.toString()); p.set("aba", abaAtiva); p.set("ano", ano); p.set("pagina", String(pagina - 1)); if (busca) p.set("q", busca); else p.delete("q"); return `/dashboard/dfin/ceo?${p.toString()}`; })()}
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
                  href={(() => { const p = new URLSearchParams(searchParams.toString()); p.set("aba", abaAtiva); p.set("ano", ano); p.set("pagina", String(pagina + 1)); if (busca) p.set("q", busca); else p.delete("q"); return `/dashboard/dfin/ceo?${p.toString()}`; })()}
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
      )}

      {/* Aba 2: Fila de PRDs */}
      {abaAtiva === "prds" && (
        <div className="px-8 py-20 flex flex-col items-center justify-center text-center">
          <div className="relative mb-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-50 to-slate-100 border border-blue-100 flex items-center justify-center shadow-sm">
              <Wrench size={32} className="text-blue-400" />
            </div>
            <span className="absolute inset-0 rounded-2xl border-2 border-blue-200 animate-ping opacity-30" />
          </div>

          <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 border border-blue-200 rounded-full px-4 py-1.5 mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            Em Construção
          </span>

          <h3 className="text-xl font-black text-slate-800 tracking-tight mb-3">
            Fila de PRDs Aprovados
          </h3>

          <p className="text-sm text-slate-500 leading-relaxed max-w-md">
            Integração futura com o{" "}
            <span className="font-bold text-slate-700">SIMAS</span>{" "}
            para listagem de PRDs aprovados aguardando emissão de Nota de Empenho (NE).
          </p>

          <div className="mt-8 flex items-center gap-3">
            <span className="h-px w-16 bg-slate-200" />
            <span className="text-[11px] font-black uppercase tracking-widest text-slate-300">Em Breve</span>
            <span className="h-px w-16 bg-slate-200" />
          </div>
        </div>
      )}

    </div>
  );
}
