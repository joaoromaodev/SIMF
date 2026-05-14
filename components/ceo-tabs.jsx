"use client";

import { useState, useMemo } from "react";
import { Search, X, Wrench } from "lucide-react";

function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value ?? 0);
}

function formatDate(dateString) {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("pt-BR");
}

const TABS = [
  { id: "empenhos",  label: "Empenhos Gerados"           },
  { id: "prds",      label: "Fila de PRDs (Aguardando NE)" },
];

const MOCK_EMPENHOS = [
  {
    ug: "020301",
    data: "2026-03-12",
    processo: "2026005842",
    ne: "2026NE000318",
    credor: "DISTRIBUIDORA EDUCACIONAL LTDA",
    fonte: "0148",
    det: "339030",
    natureza_despesa: "Material de Consumo",
    contrato: "CONT-2026-041",
    mes_ref: "Mar/2026",
    despesa: 187500.0,
  },
  {
    ug: "020301",
    data: "2026-04-03",
    processo: "2026008114",
    ne: "2026NE000451",
    credor: "SERVIÇOS TÉCNICOS ESPECIALIZADOS S/A",
    fonte: "0100",
    det: "339039",
    natureza_despesa: "Outros Serv. Terceiros — PJ",
    contrato: "CONT-2026-057",
    mes_ref: "Abr/2026",
    despesa: 214320.0,
  },
  {
    ug: "020302",
    data: "2026-04-18",
    processo: "2026009730",
    ne: "2026NE000589",
    credor: "CONSTRUTORA ALFA ENGENHARIA EIRELI",
    fonte: "0148",
    det: "449051",
    natureza_despesa: "Obras e Instalações",
    contrato: "CONT-2026-072",
    mes_ref: "Abr/2026",
    despesa: 85500.0,
  },
];

export function CeoTabs({ ano }) {
  const [activeTab, setActiveTab] = useState("empenhos");
  const [busca, setBusca] = useState("");

  const empenhosFiltrados = useMemo(() => {
    const q = busca.toLowerCase().trim();
    return MOCK_EMPENHOS.filter((r) => {
      if (ano && !r.data.startsWith(ano)) return false;
      if (!q) return true;
      return (
        r.processo.toLowerCase().includes(q) ||
        r.credor.toLowerCase().includes(q)
      );
    });
  }, [busca, ano]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">

      {/* Barra de abas */}
      <div className="flex border-b border-slate-200 bg-slate-50/60">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
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
      {activeTab === "empenhos" && (
        <>
          {/* Barra de busca */}
          <div className="px-6 py-3 border-b border-slate-100 flex items-center gap-4 bg-slate-50/50">
            <div className="relative max-w-xs w-full">
              <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por Processo ou Credor…"
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
              {empenhosFiltrados.length !== MOCK_EMPENHOS.length && (
                <span className="text-slate-300"> / {MOCK_EMPENHOS.length}</span>
              )}{" "}
              registros
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="border-b border-slate-200">
                  {[
                    { label: "UG",                  align: "text-left"  },
                    { label: "Data",                align: "text-left"  },
                    { label: "Processo",            align: "text-left"  },
                    { label: "NE",                  align: "text-left"  },
                    { label: "Credor",              align: "text-left"  },
                    { label: "Fonte",               align: "text-left"  },
                    { label: "Det",                 align: "text-left"  },
                    { label: "Natureza de Despesa", align: "text-left"  },
                    { label: "Contrato",            align: "text-left"  },
                    { label: "Mês Ref",             align: "text-left"  },
                    { label: "Despesa",             align: "text-right" },
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
                {empenhosFiltrados.length > 0 ? (
                  empenhosFiltrados.map((row, index) => (
                    <tr
                      key={row.ne}
                      className={`transition-colors hover:bg-slate-50 ${index % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}
                    >
                      <td className="px-5 py-3.5 font-mono text-[11px] text-slate-500">{row.ug}</td>
                      <td className="px-5 py-3.5 text-slate-500 text-xs whitespace-nowrap">{formatDate(row.data)}</td>
                      <td className="px-5 py-3.5 text-slate-800 font-semibold text-xs">{row.processo}</td>
                      <td className="px-5 py-3.5 font-mono text-[11px] text-slate-500">{row.ne}</td>
                      <td className="px-5 py-3.5 text-slate-600 text-xs max-w-[180px] truncate">{row.credor}</td>
                      <td className="px-5 py-3.5 text-slate-600 text-xs">{row.fonte}</td>
                      <td className="px-5 py-3.5 font-mono text-[11px] text-slate-500">{row.det}</td>
                      <td className="px-5 py-3.5 text-slate-600 text-xs">{row.natureza_despesa}</td>
                      <td className="px-5 py-3.5 font-mono text-[11px] text-slate-500">{row.contrato}</td>
                      <td className="px-5 py-3.5 text-slate-500 text-xs whitespace-nowrap">{row.mes_ref}</td>
                      <td className="px-5 py-3.5 text-right font-mono font-bold text-blue-600 text-xs whitespace-nowrap">{formatCurrency(row.despesa)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={11} className="px-6 py-16 text-center text-slate-400 text-sm font-medium">
                      Nenhum empenho encontrado para os filtros aplicados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Aba 2: Fila de PRDs */}
      {activeTab === "prds" && (
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

          <div className="mt-8 flex items-center gap-3 text-slate-200">
            <span className="h-px w-16 bg-slate-200" />
            <span className="text-[11px] font-black uppercase tracking-widest text-slate-300">Em Breve</span>
            <span className="h-px w-16 bg-slate-200" />
          </div>
        </div>
      )}

    </div>
  );
}
