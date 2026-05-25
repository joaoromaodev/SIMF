import { getSupabaseAdminClient } from "../../../../lib/supabase/server.js";
import { CliqTabs } from "../../../../components/cliq-tabs.jsx";
import CliqExportButtons from "../../../../components/cliq-export-buttons.jsx";
import Link from "next/link";
import { ChevronLeft, FileCheck2, X } from "lucide-react";

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

function StatCard({ label, quantidade, total }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-7 py-6 flex flex-col justify-between gap-3">
      <p className="text-xs font-black uppercase tracking-widest text-slate-400">{label}</p>
      <div>
        <p className="text-4xl font-black text-para-blue leading-none tracking-tight">
          {quantidade.toLocaleString("pt-BR")}
        </p>
        <p className="text-sm font-bold text-slate-400 mt-2">
          {formatCurrency(total)}
        </p>
      </div>
    </div>
  );
}

async function fetchFontes(supabase) {
  const { data, error } = await supabase
    .from("vw_cliq_por_fonte")
    .select("fonte");
  if (error) return [];
  return [...new Set((data || []).map((r) => r.fonte).filter((fonte) => fonte && fonte !== "Sem fonte"))].sort();
}

async function fetchCliqData(supabase, filters, pagina) {
  const page = Math.max(1, parseInt(pagina, 10) || 1);
  const from = (page - 1) * PAGE_SIZE;

  let rowQuery = supabase.from("vw_liquidados_a_pagar").select("*", { count: "exact" }).order("data_liquidacao", { ascending: false, nullsFirst: false }).range(from, from + PAGE_SIZE - 1);

  if (filters.fonte) { rowQuery = rowQuery.eq("fonte", filters.fonte); }
  if (filters.credor) { rowQuery = rowQuery.ilike("credor", `%${filters.credor}%`); }
  if (filters.processo) { rowQuery = rowQuery.ilike("numero_processo", `%${filters.processo}%`); }

  const [kpisResult, sourceResult, statusResult, rowResult] = await Promise.all([
    supabase
      .from("vw_cliq_kpis")
      .select("total_em_liquidacao, quantidade_em_liquidacao, quantidade_liquidados_a_pagar")
      .maybeSingle(),
    supabase
      .from("vw_cliq_por_fonte")
      .select("fonte, total_valor_bruto, quantidade")
      .order("total_valor_bruto", { ascending: false }),
    supabase
      .from("vw_cliq_status")
      .select("status, quantidade"),
    rowQuery,
  ]);

  const kpisData = kpisResult.data || {};
  const kpis = {
    totalEmLiquidacao: parseFloat(kpisData.total_em_liquidacao) || DEFAULT_KPIS.totalEmLiquidacao,
    quantidadeEmLiquidacao: Number(kpisData.quantidade_em_liquidacao) || DEFAULT_KPIS.quantidadeEmLiquidacao,
    quantidadeLiquidadosAPagar: Number(kpisData.quantidade_liquidados_a_pagar) || DEFAULT_KPIS.quantidadeLiquidadosAPagar,
  };
  const sourceData = (sourceResult.data || []).map((row) => ({
    name: row.fonte || "Sem fonte",
    value: Math.round((parseFloat(row.total_valor_bruto) || 0) * 100) / 100,
  }));
  const statusOrder = { "Em Liquidação": 0, "Liquidados a Pagar": 1 };
  const statusData = (statusResult.data || [])
    .map((row) => ({ name: row.status, value: Number(row.quantidade) || 0 }))
    .sort((a, b) => (statusOrder[a.name] ?? 99) - (statusOrder[b.name] ?? 99));

  return {
    kpis,
    sourceData,
    statusData,
    rows: rowResult.data || [],
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
  const filters = { fonte: sp.fonte || "", credor: sp.credor || "", processo: sp.processo || "" };
  const ano     = sp.ano  || "2026";
  const aba     = sp.aba  || "empenhos_liquidar";
  const pagina  = Math.max(1, parseInt(sp.pagina, 10) || 1);
  const supabase = getSupabaseAdminClient();

  const [fontes, { kpis, sourceData, statusData, rows, totalCount }] = await Promise.all([
    fetchFontes(supabase),
    fetchCliqData(supabase, filters, pagina),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const hasActiveFilters = filters.fonte || filters.credor || filters.processo;

  return (
    <div className="space-y-8">

      {/* Breadcrumb + Header */}
      <div>
        <Link href="/dashboard/dppc" className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-400 hover:text-para-blue uppercase tracking-widest mb-5 transition-colors">
          <ChevronLeft size={13} />
          Hub DPPC
        </Link>
        <div className="flex items-end justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <FileCheck2 size={20} className="text-para-blue" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Dashboard CLIQ</h1>
              <p className="text-slate-400 text-sm font-medium mt-0.5">Controle de Liquidações</p>
            </div>
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
                    ? "text-para-blue bg-blue-50"
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
      <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_220px] gap-5 items-stretch">
        <StatCard
          label="Empenhos em Liquidação"
          quantidade={kpis.quantidadeEmLiquidacao}
          total={kpis.totalEmLiquidacao}
        />
        <StatCard
          label="Liquidados a Pagar"
          quantidade={kpis.quantidadeLiquidadosAPagar}
          total={kpis.totalAPagar}
        />
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-6 py-6 flex flex-col justify-center gap-1">
          <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Relatórios</p>
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
