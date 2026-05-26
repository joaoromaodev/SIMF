"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Search, X, ChevronLeft, ChevronRight } from "lucide-react";
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

export function MonitoramentoOBTable({ monitoramento, ano, pagina = 1, totalPages = 1, total = 0 }) {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [filtroProcesso,  setFiltroProcesso]  = useState(() => searchParams.get("processo")  || "");
  const [filtroCredor,    setFiltroCredor]    = useState(() => searchParams.get("credor")    || "");
  const [filtroDocumento, setFiltroDocumento] = useState(() => searchParams.get("doc_cred")  || "");
  const [filtroVinculo,   setFiltroVinculo]   = useState(() => searchParams.get("vinculo")   || "todos");

  // Sincroniza filtros com a URL (debounce 400 ms)
  useEffect(() => {
    const id = setTimeout(() => {
      const p = new URLSearchParams(searchParams.toString());
      if (filtroCredor)              p.set("credor",   filtroCredor);    else p.delete("credor");
      if (filtroProcesso)            p.set("processo", filtroProcesso);  else p.delete("processo");
      if (filtroDocumento)           p.set("doc_cred", filtroDocumento); else p.delete("doc_cred");
      if (filtroVinculo !== "todos") p.set("vinculo",  filtroVinculo);   else p.delete("vinculo");
      p.delete("paginaMon");
      router.replace(`?${p.toString()}`, { scroll: false });
    }, 400);
    return () => clearTimeout(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroCredor, filtroProcesso, filtroDocumento, filtroVinculo]);

  const filtered = useMemo(() => {
    const normalize = (str) => (str ?? "").toLowerCase().trim();
    const proc = normalize(filtroProcesso);
    const cred = normalize(filtroCredor);
    const doc  = normalize(filtroDocumento);

    return monitoramento.filter((item) => {
      if (proc && !normalize(item.numero_processo).includes(proc))   return false;
      if (cred && !normalize(item.credor).includes(cred))            return false;
      if (doc  && !normalize(item.documento_credor).includes(doc))   return false;
      if (filtroVinculo === "sem_vinculo"  && item.tem_vinculo_nedl !== false) return false;
      if (filtroVinculo === "confirmados"  && !item.confirmado_manualmente)    return false;
      return true;
    });
  }, [monitoramento, filtroProcesso, filtroCredor, filtroDocumento, filtroVinculo]);

  const hasActiveFilter = filtroProcesso || filtroCredor || filtroDocumento || filtroVinculo !== "todos";

  function clearAll() {
    setFiltroProcesso("");
    setFiltroCredor("");
    setFiltroDocumento("");
    setFiltroVinculo("todos");
  }

  return (
    <>
      {/* ── Barra de filtros cruzados ── */}
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
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
          <div className="flex flex-col gap-1 min-w-0">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Vínculo NEDL
            </label>
            <select
              value={filtroVinculo}
              onChange={(e) => setFiltroVinculo(e.target.value)}
              className={`text-xs font-semibold bg-white border rounded-lg px-3 py-1.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 cursor-pointer transition-colors ${
                filtroVinculo !== "todos"
                  ? "border-amber-400 text-amber-700"
                  : "border-slate-200 text-slate-700"
              }`}
            >
              <option value="todos">Todos</option>
              <option value="sem_vinculo">Sem vínculo NEDL</option>
              <option value="confirmados">Confirmados</option>
            </select>
          </div>
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
                  { label: "Status NEDL",         align: "text-left"  },
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
                  <td className="px-5 py-3.5">
                    {item.tem_vinculo_nedl === false ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-1 whitespace-nowrap">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                        {item.motivo_sem_vinculo || "DL não localizada no NEDL"}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-1 whitespace-nowrap">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                        Vinculado
                      </span>
                    )}
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

      {/* Paginação */}
      {!hasActiveFilter && totalPages > 1 && (
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <span className="text-[11px] text-slate-400 font-medium">
            Página <span className="font-black text-slate-600">{pagina}</span> de{" "}
            <span className="font-black text-slate-600">{totalPages}</span>
            <span className="text-slate-300 mx-2">·</span>
            {total.toLocaleString("pt-BR")} registros no total
          </span>
          <div className="flex items-center gap-1">
            <Link
              href={`/dashboard/dppc/cpag?aba=monitoramento&ano=${ano}&paginaMon=${pagina - 1}`}
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
              href={`/dashboard/dppc/cpag?aba=monitoramento&ano=${ano}&paginaMon=${pagina + 1}`}
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