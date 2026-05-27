"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FileCheck2, Wrench, Search, X, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value ?? 0);
}

function formatDate(dateString) {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("pt-BR");
}

function buildHref(filters, pagina, aba, ano) {
  const params = new URLSearchParams();
  if (aba)              params.set("aba",      aba);
  if (ano)              params.set("ano",      ano);
  if (filters.fonte)    params.set("fonte",    filters.fonte);
  if (filters.credor)   params.set("credor",   filters.credor);
  if (filters.processo) params.set("processo", filters.processo);
  if (pagina && pagina > 1) params.set("pagina", pagina);
  const qs = params.toString();
  return `/dashboard/dppc/cliq${qs ? `?${qs}` : ""}`;
}

const TABS = [
  { id: "empenhos_liquidar",    label: "Empenhos a Liquidar"          },
  { id: "historico_liquidados", label: "Liquidados a Pagar (Histórico)" },
  { id: "recursos",             label: "Recursos (Saldo)"              },
];

// ── Componente auxiliar: input de busca com ícone e botão de limpar ──────────
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
          placeholder={`Filtrar…`}
          className="w-full pl-7 pr-7 py-1.5 text-xs text-slate-700 bg-white border border-slate-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-para-blue/30 focus:border-para-blue placeholder:text-slate-300"
        />
        {value && (
          <button onClick={() => onChange("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors">
            <X size={12} />
          </button>
        )}
      </div>
    </div>
  );
}

// ── Botões de exportação genéricos ───────────────────────────────────────────
function ExportButtons() {
  return (
    <div className="flex items-center gap-2">
      <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-black uppercase tracking-widest text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-sm transition-colors">
        <Download size={12} />
        Exportar XLSX
      </button>
      <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-black uppercase tracking-widest text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-sm transition-colors">
        <Download size={12} />
        Exportar PDF
      </button>
    </div>
  );
}

// ── Multi-select de Fonte ─────────────────────────────────────────────────────
function FonteMultiSelect({ fontes, selected, onChange }) {
  const [open, setOpen] = useState(false);

  const toggleFonte = (fonte) => {
    onChange(
      selected.includes(fonte)
        ? selected.filter((f) => f !== fonte)
        : [...selected, fonte]
    );
  };

  const label = selected.length === 0
    ? "Todas as fontes"
    : selected.length === 1
    ? selected[0]
    : `${selected.length} fontes selecionadas`;

  return (
    <div className="flex flex-col gap-1 min-w-0 relative">
      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
        Fonte
      </label>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center justify-between pl-3 pr-2.5 py-1.5 text-xs font-semibold bg-white border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-para-blue/30 transition-colors ${
          selected.length > 0
            ? "border-para-blue text-para-blue"
            : "border-slate-200 text-slate-700"
        }`}
      >
        <span className="truncate">{label}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          className={`flex-shrink-0 ml-1.5 transition-transform ${open ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <>
          {/* Overlay para fechar ao clicar fora */}
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 z-20 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 min-w-[200px] max-h-56 overflow-y-auto">
            {/* Limpar seleção */}
            {selected.length > 0 && (
              <button
                type="button"
                onClick={() => { onChange([]); setOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-para-blue hover:bg-blue-50 transition-colors"
              >
                <X size={11} /> Limpar seleção
              </button>
            )}
            {fontes.map((fonte) => (
              <label
                key={fonte}
                className="flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:bg-slate-50 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(fonte)}
                  onChange={() => toggleFonte(fonte)}
                  className="rounded border-slate-300 text-para-blue focus:ring-para-blue/30 cursor-pointer"
                />
                <span className="text-xs font-semibold text-slate-700 truncate">{fonte}</span>
              </label>
            ))}
            {fontes.length === 0 && (
              <p className="px-3 py-2 text-xs text-slate-400">Nenhuma fonte disponível</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export function CliqTabs({ rows, totalCount, filters, pagina, totalPages, fontes, hasActiveFilters, ano, abaAtiva = "empenhos_liquidar" }) {
  const router       = useRouter();
  const searchParams = useSearchParams();

  function switchTab(id) {
    if (id === abaAtiva) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("aba", id);
    params.delete("pagina");
    router.push(`/dashboard/dppc/cliq?${params.toString()}`);
  }

  // Filtros — Aba 1
  const [statusEmpenho, setStatusEmpenho] = useState(() => searchParams.get("status") || "todos");

  // Sincroniza status Aba 1 à URL
  useEffect(() => {
    const id = setTimeout(() => {
      const p = new URLSearchParams(searchParams.toString());
      if (statusEmpenho !== "todos") p.set("status", statusEmpenho); else p.delete("status");
      router.replace(`?${p.toString()}`, { scroll: false });
    }, 100);
    return () => clearTimeout(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusEmpenho]);

  const empenhosFiltrados = useMemo(() => {
    return rows.filter((row) => {
      // Filtro de status baseado em valor_ja_pago_obs (campo real da view)
      const pago  = parseFloat(row.valor_ja_pago_obs) || 0;
      if (statusEmpenho === "pendente") return pago === 0;       // sem nenhum pagamento
      if (statusEmpenho === "parcial")  return pago > 0;         // pelo menos um pagamento parcial
      return true; // "todos"
    });
  }, [rows, statusEmpenho]);

  // Filtros cruzados — Aba 2
  const [filtroProcesso,  setFiltroProcesso]  = useState(() => searchParams.get("processo") || "");
  const [filtroCredor,    setFiltroCredor]    = useState(() => searchParams.get("credor")   || "");
  const [filtroEmpenho,   setFiltroEmpenho]   = useState(() => searchParams.get("empenho")  || "");
  const [filtroFontes,    setFiltroFontes]    = useState(() => {
    const raw = searchParams.get("fontes");
    return raw ? raw.split(",").filter(Boolean) : [];
  });

  // Sincroniza filtros Aba 2 à URL (debounce 400 ms)
  useEffect(() => {
    const id = setTimeout(() => {
      const p = new URLSearchParams(searchParams.toString());
      if (filtroCredor)          p.set("credor",   filtroCredor);                      else p.delete("credor");
      if (filtroProcesso)        p.set("processo", filtroProcesso);                    else p.delete("processo");
      if (filtroEmpenho)         p.set("empenho",  filtroEmpenho);                     else p.delete("empenho");
      if (filtroFontes.length)   p.set("fontes",   filtroFontes.join(","));            else p.delete("fontes");
      p.delete("pagina");
      router.replace(`?${p.toString()}`, { scroll: false });
    }, 400);
    return () => clearTimeout(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroCredor, filtroProcesso, filtroEmpenho, filtroFontes]);

  const filteredRows = useMemo(() => {
    const n = (s) => (s ?? "").toLowerCase().trim();
    return rows.filter((row) => {
      if (filtroProcesso && !n(row.numero_processo).includes(n(filtroProcesso)))    return false;
      if (filtroCredor   && !n(row.credor).includes(n(filtroCredor)))               return false;
      if (filtroEmpenho  && !n(row.codigo_nota_empenho).includes(n(filtroEmpenho))) return false;
      if (filtroFontes.length > 0 && !filtroFontes.includes(row.fonte))             return false;
      return true;
    });
  }, [rows, filtroProcesso, filtroCredor, filtroEmpenho, filtroFontes]);

  const hasLocalFilter = filtroProcesso || filtroCredor || filtroEmpenho || filtroFontes.length > 0;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">

      {/* ── Barra de abas ── */}
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
                  ? "text-para-blue bg-white shadow-[inset_0_-2px_0_0] shadow-para-blue"
                  : "text-slate-400 hover:text-slate-600 hover:bg-white/60"
                }
              `}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Aba 1: Empenhos a Liquidar ── */}
      {abaAtiva === "empenhos_liquidar" && (
        <>
          {/* Barra de filtro de status */}
          <div className="px-6 py-3 border-b border-slate-100 flex items-center gap-4 bg-slate-50/50">
            <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap">
              Status
            </label>
            <select
              value={statusEmpenho}
              onChange={(e) => setStatusEmpenho(e.target.value)}
              className="text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-para-blue/30 focus:border-para-blue cursor-pointer"
            >
              <option value="todos">Todos</option>
              <option value="pendente">Sem Pagamento</option>
              <option value="parcial">Pagamento Parcial</option>
            </select>
            <span className="ml-auto text-[11px] text-slate-400 font-medium">
              {empenhosFiltrados.length}
              {empenhosFiltrados.length !== rows.length && (
                <span className="text-slate-300"> / {rows.length}</span>
              )}{" "}
              registros
            </span>
          </div>

          {empenhosFiltrados.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    {[
                      { label: "Processo",  align: "text-left"  },
                      { label: "Empenho",   align: "text-left"  },
                      { label: "Credor",    align: "text-left"  },
                      { label: "Natureza",  align: "text-left"  },
                      { label: "Fonte",     align: "text-left"  },
                      { label: "Data",      align: "text-left"  },
                      { label: "Valor",     align: "text-right" },
                    ].map(({ label, align }) => (
                      <th key={label} className={`px-5 py-3 text-[11px] font-black uppercase tracking-wider text-slate-500 ${align}`}>
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {empenhosFiltrados.map((row, index) => (
                    <tr key={row.codigo_nota_empenho ?? `row-${index}`} className={`transition-colors hover:bg-slate-50 ${index % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}>
                      <td className="px-5 py-3.5 text-slate-800 font-semibold text-xs">{row.numero_processo || "—"}</td>
                      <td className="px-5 py-3.5 font-mono text-[11px] text-slate-500">{row.codigo_nota_empenho || "—"}</td>
                      <td className="px-5 py-3.5 text-slate-600 text-xs max-w-[160px] truncate">{row.credor || "—"}</td>
                      <td className="px-5 py-3.5 text-slate-600 text-xs">{row.codigo_natureza_despesa || "—"}</td>
                      <td className="px-5 py-3.5 text-slate-600 text-xs">{row.fonte || "—"}</td>
                      <td className="px-5 py-3.5 text-slate-500 text-xs">{formatDate(row.data_empenho)}</td>
                      <td className="px-5 py-3.5 text-right font-mono font-bold text-para-blue text-xs">{formatCurrency(row.valor_bruto)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-16 text-center">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                <FileCheck2 size={18} className="text-slate-400" />
              </div>
              <p className="text-slate-400 text-sm font-medium">
                Nenhum empenho encontrado para os filtros aplicados.
              </p>
            </div>
          )}

          {/* ── Paginação (servidor) — apenas quando sem filtro de status ── */}
          {statusEmpenho === "todos" && totalPages > 1 && (
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
              <span className="text-[11px] text-slate-400 font-medium">
                Página <span className="font-black text-slate-600">{pagina}</span> de{" "}
                <span className="font-black text-slate-600">{totalPages}</span>
                <span className="text-slate-300 mx-2">·</span>
                {totalCount.toLocaleString("pt-BR")} registros no total
              </span>
              <div className="flex items-center gap-1">
                <Link
                  href={buildHref(filters, pagina - 1, abaAtiva, ano)}
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
                  href={buildHref(filters, pagina + 1, abaAtiva, ano)}
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

      {/* ── Aba 2: Liquidados a Pagar (Histórico) ── */}
      {abaAtiva === "historico_liquidados" && (
        <>
          {/* Barra superior: filtros cruzados + exportação */}
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <FilterInput label="Processo" value={filtroProcesso} onChange={setFiltroProcesso} />
              <FilterInput label="Credor"   value={filtroCredor}   onChange={setFiltroCredor}   />
              <FilterInput label="Empenho"  value={filtroEmpenho}  onChange={setFiltroEmpenho}  />
              <FonteMultiSelect
                fontes={fontes}
                selected={filtroFontes}
                onChange={setFiltroFontes}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-medium">
                {filteredRows.length}
                {filteredRows.length !== rows.length && (
                  <span className="text-slate-300"> / {rows.length}</span>
                )}{" "}
                registros
              </span>
              {hasLocalFilter && (
                <button
                  onClick={() => { setFiltroProcesso(""); setFiltroCredor(""); setFiltroEmpenho(""); setFiltroFontes([]); }}
                  className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-widest text-para-blue hover:text-blue-700 transition-colors"
                >
                  <X size={11} /> Limpar filtros
                </button>
              )}
            </div>
          </div>

          {/* Tabela */}
          {filteredRows.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    {[
                      { label: "Processo",    align: "text-left"  },
                      { label: "Empenho",     align: "text-left"  },
                      { label: "Credor",      align: "text-left"  },
                      { label: "Natureza",    align: "text-left"  },
                      { label: "Fonte",       align: "text-left"  },
                      { label: "DL",          align: "text-left"  },
                      { label: "Data",        align: "text-left"  },
                      { label: "Vl. Líquido", align: "text-right" },
                      { label: "Vl. Bruto",   align: "text-right" },
                      { label: "Vl. Imposto", align: "text-right" },
                    ].map(({ label, align }) => (
                      <th key={label} className={`px-5 py-3 text-[11px] font-black uppercase tracking-wider text-slate-500 ${align}`}>
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRows.map((row, index) => {
                    const vlImposto = (parseFloat(row.valor_bruto) || 0) - (parseFloat(row.valor_liquido) || 0);
                    return (
                      <tr key={row.documento_liquidacao ?? `row-${index}`} className={`transition-colors hover:bg-slate-50 ${index % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}>
                        <td className="px-5 py-3.5 text-slate-800 font-semibold text-xs">{row.numero_processo || "—"}</td>
                        <td className="px-5 py-3.5 font-mono text-[11px] text-slate-500">{row.codigo_nota_empenho || "—"}</td>
                        <td className="px-5 py-3.5 text-slate-600 text-xs max-w-[160px] truncate">{row.credor || "—"}</td>
                        <td className="px-5 py-3.5 text-slate-600 text-xs">{row.codigo_natureza_despesa || "—"}</td>
                        <td className="px-5 py-3.5 text-slate-600 text-xs">{row.fonte || "—"}</td>
                        <td className="px-5 py-3.5 font-mono text-[11px] text-slate-500">{row.documento_liquidacao || "—"}</td>
                        <td className="px-5 py-3.5 text-slate-500 text-xs">{formatDate(row.data_liquidacao)}</td>
                        <td className="px-5 py-3.5 text-right font-mono font-bold text-para-blue text-xs">{formatCurrency(row.valor_liquido)}</td>
                        <td className="px-5 py-3.5 text-right font-mono font-bold text-para-blue text-xs">{formatCurrency(row.valor_bruto)}</td>
                        <td className="px-5 py-3.5 text-right font-mono font-bold text-slate-500 text-xs">{formatCurrency(vlImposto)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-16 text-center">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                <FileCheck2 size={18} className="text-slate-400" />
              </div>
              <p className="text-slate-400 text-sm font-medium">
                {hasLocalFilter ? "Nenhum registro para os filtros aplicados." : "Nenhuma liquidação encontrada."}
              </p>
            </div>
          )}

          {/* ── Paginação (servidor) — apenas quando não há filtros locais ── */}
          {!hasLocalFilter && totalPages > 1 && (
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
              <span className="text-[11px] text-slate-400 font-medium">
                Página <span className="font-black text-slate-600">{pagina}</span> de{" "}
                <span className="font-black text-slate-600">{totalPages}</span>
                <span className="text-slate-300 mx-2">·</span>
                {totalCount.toLocaleString("pt-BR")} registros no total
              </span>
              <div className="flex items-center gap-1">
                <Link
                  href={buildHref(filters, pagina - 1, abaAtiva, ano)}
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
                  href={buildHref(filters, pagina + 1, abaAtiva, ano)}
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

    {/* ── Aba 3: Recursos (Saldo) — Em Construção ── */}
      {abaAtiva === "recursos" && (
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
            Módulo de Validação de Saldo Bancário
          </h3>

          <p className="text-sm text-slate-500 leading-relaxed max-w-lg">
            Módulo de validação de saldo bancário em desenvolvimento. Integração futura com o{" "}
            <span className="font-bold text-slate-700">SIMAS</span>{" "}
            (Conta Contábil:{" "}
            <span className="font-mono font-bold text-slate-700">622920102</span>
            ) para bloqueio e autorização de liquidações baseada em disponibilidade de recursos.
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