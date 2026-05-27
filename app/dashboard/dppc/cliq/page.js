import { getSupabaseAdminClient } from "../../../../lib/supabase/server.js";
import { CliqTabs } from "../../../../components/cliq-tabs.jsx";
import CliqExportButtons from "../../../../components/cliq-export-buttons.jsx";
import Link from "next/link";
import { ChevronLeft, FileCheck2, X } from "lucide-react";
import StatCard from "../../../../components/ui/stat-card.jsx";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

const DEFAULT_KPIS = {
  totalEmLiquidacao: 0,
  quantidadeEmLiquidacao: 0,
  quantidadeLiquidadosAPagar: 0,
};

function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value ?? 0);
}

function formatDate(dateString) {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("pt-BR");
}

const ANOS = ["2021","2022","2023", "2024", "2025", "2026"];

function anoToYearScope(ano) {
  if (ano === "2023" || ano === "2024") return "2023_2024";
  return ano;
}

async function fetchFontes(supabase, yearScope) {
  const { data, error } = await supabase
    .rpc("fn_cliq_por_fonte", { p_year_scope: yearScope });
  if (error) return [];
  return (data || [])
    .map((r) => r.fonte)
    .filter((f) => f && f !== "Sem fonte")
    .sort();
}

async function fetchCliqData(supabase, filters, pagina, yearScope) {
  const page = Math.max(1, parseInt(pagina, 10) || 1);
  const from = (page - 1) * PAGE_SIZE;

  let rowQuery = supabase
    .from("vw_liquidados_a_pagar")
    .select("*", { count: "exact" })
    .eq("year_scope", yearScope)
    .order("data_liquidacao", { ascending: false, nullsFirst: false })
    .range(from, from + PAGE_SIZE - 1);

  if (filters.fonte)    { rowQuery = rowQuery.eq("fonte",                  filters.fonte); }
  if (filters.credor)   { rowQuery = rowQuery.ilike("credor",               `%${filters.credor}%`); }
  if (filters.processo) { rowQuery = rowQuery.ilike("numero_processo",       `%${filters.processo}%`); }
  if (filters.empenho)  { rowQuery = rowQuery.ilike("codigo_nota_empenho",   `%${filters.empenho}%`); }

  const [kpisResult, sourceResult, rowResult] = await Promise.all([
    supabase.rpc("fn_cliq_kpis",      { p_year_scope: yearScope }),
    supabase.rpc("fn_cliq_por_fonte", { p_year_scope: yearScope }),
    rowQuery,
  ]);

  const kpisRow  = (kpisResult.data  || [])[0] || {};
  const kpis = {
    totalEmLiquidacao:         parseFloat(kpisRow.total_em_liquidacao)           || DEFAULT_KPIS.totalEmLiquidacao,
    quantidadeEmLiquidacao:    Number(kpisRow.quantidade_em_liquidacao)          || DEFAULT_KPIS.quantidadeEmLiquidacao,
    quantidadeLiquidadosAPagar: Number(kpisRow.quantidade_liquidados_a_pagar)   || DEFAULT_KPIS.quantidadeLiquidadosAPagar,
  };
  const sourceData = (sourceResult.data || []).map((row) => ({
    name:  row.fonte || "Sem fonte",
    value: Math.round((parseFloat(row.total_valor_bruto) || 0) * 100) / 100,
  }));
  // Status derivado dos próprios KPIs (view vw_cliq_status não tem year filter)
  const statusData = [
    { name: "Em Liquidação",       value: 0 },
    { name: "Liquidados a Pagar",  value: kpis.quantidadeLiquidadosAPagar },
  ];

  return {
    kpis,
    sourceData,
    statusData,
    rows:       rowResult.data  || [],
    totalCount: rowResult.count || 0,
  };
}

function buildHref(filters, pagina) {
  const params = new URLSearchParams();
  if (filters.fonte) params.set("fonte", filters.fonte);
  if (filters.credor) params.set("credor", filters.credor);
  if (filters.processo) params.set("processo", filters.processo);
  if (pagina && pagina > 1) params.set("pagina", pagina);
  const qs = params.toString();
  return `/dashboard/dppc/cliq${qs ? `?${qs}` : ""}`;
}

export default async function CliqDashboardPage({ searchParams }) {
  const sp = await searchParams;
  const filters = {
    fonte:    sp.fonte    || "",
    credor:   sp.credor   || "",
    processo: sp.processo || "",
    empenho:  sp.empenho  || "",
  };
  const ano       = sp.ano  || "2026";
  const aba       = sp.aba  || "empenhos_liquidar";
  const pagina    = Math.max(1, parseInt(sp.pagina, 10) || 1);
  const yearScope = anoToYearScope(ano);
  const supabase  = getSupabaseAdminClient();

  const [fontes, { kpis, sourceData, statusData, rows, totalCount }] = await Promise.all([
    fetchFontes(supabase, yearScope),
    fetchCliqData(supabase, filters, pagina, yearScope),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const hasActiveFilters = filters.fonte || filters.credor || filters.processo || filters.empenho;

  return (
    <div className="space-y-8">

      {/* Breadcrumb + Header */}
      <div>
        <Link href="/dashboard/dppc" className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-400 hover:text-para-blue uppercase tracking-widest mb-5 transition-colors">
          <ChevronLeft size={13} />
          Hub DPPC
        </Link>
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Dashboard CLIQ</h1>
            <p className="text-slate-500 text-sm font-medium mt-1">Controle de Liquidações</p>
          </div>
          {hasActiveFilters && (
            <Link href="/dashboard/dppc/cliq" className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-400 hover:text-para-red uppercase tracking-widest transition-colors">
              <X size={12} />
              Limpar Filtros
            </Link>
          )}
        </div>
      </div>

      {/* Seletor de Ano */}
      <div className="flex items-center gap-3">
        <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">
          Ano de Exercício
        </span>
        <details className="relative group">
          <summary className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg shadow-sm text-[11px] font-black uppercase tracking-widest text-para-blue cursor-pointer select-none hover:border-para-blue transition-colors list-none">
            {ano}
            <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-open:rotate-180">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </summary>
          <div className="absolute left-0 top-full mt-1 z-20 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 min-w-[110px]">
            {ANOS.map((a) => (
              <Link
                key={a}
                href={`/dashboard/dppc/cliq?aba=${aba}&ano=${a}`}
                className={`flex items-center justify-between px-4 py-2 text-[11px] font-black uppercase tracking-widest transition-colors ${
                  ano === a
                    ? "text-para-blue bg-para-blue-light"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                }`}
              >
                {a}
                {ano === a && (
                  <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </Link>
            ))}
          </div>
        </details>
      </div>

      {/* KPI Cards + Exportação */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_220px] gap-4 items-stretch">
        <StatCard
          label="Em Liquidação"
          value={formatCurrency(kpis.totalEmLiquidacao)}
          sub={`${kpis.quantidadeEmLiquidacao.toLocaleString("pt-BR")} empenhos`}
          icon={FileCheck2}
        />
        <StatCard
          label="Liquidados a Pagar"
          value={kpis.quantidadeLiquidadosAPagar.toLocaleString("pt-BR")}
          sub="DLs com saldo pendente"
          icon={FileCheck2}
        />
        <div
          className="bg-white rounded-card border border-slate-200 px-5 py-4 flex flex-col justify-center gap-1"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Relatórios</p>
          <CliqExportButtons />
        </div>
      </div>

      {/* Abas — Filtros + Tabela */}
      <CliqTabs
        rows={rows}
        totalCount={totalCount}
        filters={filters}
        pagina={pagina}
        totalPages={totalPages}
        fontes={fontes}
        hasActiveFilters={!!hasActiveFilters}
        ano={ano}
        abaAtiva={aba}
      />
    </div>
  );
}
