"use client";

import { useState, useMemo } from "react";
import { Search, X } from "lucide-react";
import { formatCurrency } from "../lib/utils/formatters";

function formatDate(dateString) {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("pt-BR");
}

function FilterInput({ label, value, onChange }) {
  return (
    <div className="flex flex-col gap-1 min-w-0">
      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
        {label}
      </label>
      <div className="relative">
        <Search
          size={12}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none"
        />
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

export function MonitoramentoOBTable({ monitoramento }) {
  const [filtroProcesso,  setFiltroProcesso]  = useState("");
  const [filtroCredor,    setFiltroCredor]    = useState("");
  const [filtroDocumento, setFiltroDocumento] = useState("");
  const [yearFilter,      setYearFilter]      = useState("2026");

  const ANOS = ["2021", "2022", "2023", "2024", "2025", "2026"];

  const filtered = useMemo(() => {
    const normalize = (str) => (str ?? "").toLowerCase().trim();
    const proc = normalize(filtroProcesso);
    const cred = normalize(filtroCredor);
    const doc  = normalize(filtroDocumento);

    return monitoramento.filter((item) => {
      if (yearFilter) {
        const ano = item.data_pagamento
          ? String(new Date(item.data_pagamento).getFullYear())
          : null;
        if (ano !== yearFilter) return false;
      }
      if (proc && !normalize(item.numero_processo).includes(proc))   return false;
      if (cred && !normalize(item.credor).includes(cred))            return false;
      if (doc  && !normalize(item.documento_credor).includes(doc))   return false;
      return true;
    });
  }, [monitoramento, filtroProcesso, filtroCredor, filtroDocumento, yearFilter]);

  const hasActiveFilter = filtroProcesso || filtroCredor || filtroDocumento || yearFilter !== "2026";

  function clearAll() {
    setFiltroProcesso("");
    setFiltroCredor("");
    setFiltroDocumento("");
    setYearFilter("2026");
  }

  return (
    <>
      {/* ── Barra de filtros cruzados ── */}
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {/* Select de Ano — destaque visual por ser filtro principal */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Ano de Exercício
            </label>
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="py-1.5 px-3 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 cursor-pointer"
            >
              <option value="">Todos os anos</option>
              {ANOS.map((ano) => (
                <option key={ano} value={ano}>{ano}</option>
              ))}
            </select>
          </div>

          <FilterInput
            label="Processo"
            value={filtroProcesso}
            onChange={setFiltroProcesso}
          />
          <FilterInput
            label="Nome do Credor"
            value={filtroCredor}
            onChange={setFiltroCredor}
          />
          <FilterInput
            label="Documento do Credor"
            value={filtroDocumento}
            onChange={setFiltroDocumento}
          />
        </div>

        {/* Linha de status do filtro */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-medium">
            {filtered.length}
            {filtered.length !== monitoramento.length && (
              <span className="text-slate-300"> / {monitoramento.length}</span>
            )}{" "}
            ordens bancárias
          </span>
          {hasActiveFilter && (
            <button
              onClick={clearAll}
              className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-widest text-blue-500 hover:text-blue-700 transition-colors"
            >
              <X size={11} />
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      {/* ── Tabela ── */}
      {filtered.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {[
                  { label: "Contrato / Convênio", align: "text-left"  },
                  { label: "Processo",            align: "text-left"  },
                  { label: "OB",                  align: "text-left"  },
                  { label: "Data da OB",          align: "text-left"  },
                  { label: "Valor (R$)",          align: "text-right" },
                  { label: "Nome do Credor",      align: "text-left"  },
                  { label: "Doc. do Credor",      align: "text-left"  },
                  { label: "Descrição",           align: "text-left"  },
                ].map(({ label, align }) => (
                  <th
                    key={label}
                    className={`px-5 py-3 text-[11px] font-black uppercase tracking-wider text-slate-500 ${align}`}
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((item, index) => (
                <tr
                  key={item.ordem_bancaria ?? `row-${index}`}
                  className={`transition-colors hover:bg-slate-50 ${
                    index % 2 === 0 ? "bg-white" : "bg-slate-50/50"
                  }`}
                >
                  <td className="px-5 py-3.5 font-mono text-[11px] text-slate-500">
                    {item.contrato_convenio || "—"}
                  </td>
                  <td className="px-5 py-3.5 text-slate-800 font-semibold text-xs">
                    {item.numero_processo || "—"}
                  </td>
                  <td className="px-5 py-3.5 font-mono text-[11px] text-slate-500">
                    {item.ordem_bancaria || "—"}
                  </td>
                  <td className="px-5 py-3.5 text-slate-600 text-xs">
                    {formatDate(item.data_pagamento)}
                  </td>
                  <td className="px-5 py-3.5 text-right font-mono font-bold text-para-blue text-xs">
                    {formatCurrency(item.valor)}
                  </td>
                  <td className="px-5 py-3.5 text-slate-600 text-xs max-w-[180px] truncate">
                    {item.credor || "—"}
                  </td>
                  <td className="px-5 py-3.5 font-mono text-[11px] text-slate-500">
                    {item.documento_credor || "—"}
                  </td>
                  <td className="px-5 py-3.5 text-slate-500 text-xs max-w-[200px] truncate">
                    {item.descricao || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="px-6 py-16 text-center">
          <p className="text-slate-400 text-sm font-medium">
            {hasActiveFilter
              ? "Nenhuma ordem bancária encontrada para os filtros aplicados."
              : "Nenhuma ordem bancária encontrada."}
          </p>
        </div>
      )}
    </>
  );
}