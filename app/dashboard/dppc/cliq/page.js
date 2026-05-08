import { getSupabaseAdminClient } from "../../../../lib/supabase/server.js";
import CliqCharts from "../../../../components/cliq-charts.jsx";
import Link from "next/link";
import { ChevronLeft, FileCheck2, Filter, X } from "lucide-react";

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
  const pagina = Math.max(1, parseInt(sp.pagina, 10) || 1);
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
              <p className="text-slate-400 text-sm font-medium mt-0.5">Controle de Liquidações — Exercício Fiscal 2026</p>
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

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Total em Liquidação", value: formatCurrency(kpis.totalEmLiquidacao), sub: "Valor bruto acumulado" },
          { label: "Empenhos em Liquidação", value: kpis.quantidadeEmLiquidacao.toLocaleString("pt-BR"), sub: "Total de registros" },
          { label: "Liquidados a Pagar", value: kpis.quantidadeLiquidadosAPagar.toLocaleString("pt-BR"), sub: "Com saldo a pagar" },
        ].map(({ label, value, sub }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1">{label}</p>
            <p className="text-2xl font-black text-para-blue leading-none">{value}</p>
            <p className="text-[11px] text-slate-400 mt-1.5 font-medium">{sub}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <CliqCharts statusData={statusData} sourceData={sourceData} />

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
          <Filter size={14} className="text-slate-400" />
          <span className="text-[11px] font-black uppercase tracking-widest text-slate-500">Filtros</span>
          {hasActiveFilters && (
            <span className="ml-auto text-[10px] font-black text-para-blue bg-blue-50 px-2 py-0.5 rounded-full">
              Ativo
            </span>
          )}
        </div>
        <form method="GET" className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-[11px] uppercase font-black text-slate-400 tracking-widest mb-1.5">Credor</label>
              <input
                type="text" name="credor" defaultValue={filters.credor}
                placeholder="Buscar por credor..."
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-para-blue/30 focus:border-para-blue transition-colors"
              />
            </div>
            <div>
              <label className="block text-[11px] uppercase font-black text-slate-400 tracking-widest mb-1.5">Fonte de Recurso</label>
              <select name="fonte" defaultValue={filters.fonte} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-para-blue/30 focus:border-para-blue transition-colors">
                <option value="">Todas as fontes</option>
                {fontes.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] uppercase font-black text-slate-400 tracking-widest mb-1.5">Processo</label>
              <input
                type="text" name="processo" defaultValue={filters.processo}
                placeholder="Buscar por processo..."
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-para-blue/30 focus:border-para-blue transition-colors"
              />
            </div>
          </div>
          <button type="submit" className="px-5 py-2 bg-para-blue text-white text-[11px] font-black uppercase tracking-widest rounded-lg hover:bg-blue-700 transition-colors">
            Aplicar Filtros
          </button>
        </form>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-800">Visão Geral de Liquidações</h2>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">Documentos de liquidação com saldo pendente, inclusive pagamentos parciais</p>
          </div>
          {totalCount > 0 && (
            <span className="text-[11px] font-black text-slate-400 bg-slate-100 rounded-full px-3 py-1">
              {totalCount.toLocaleString("pt-BR")} {hasActiveFilters ? "(filtrado)" : "registros"}
            </span>
          )}
        </div>

        {rows.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    {["Processo", "Empenho", "Doc. Liquidação", "Credor", "Fonte", "Dt. Liquidação", "Pago em OBs", "Val. Líquido", "Val. Bruto", "A Pagar"].map((h, i) => (
                      <th key={h} className={`px-5 py-3 text-[11px] font-black uppercase tracking-wider text-slate-500 ${i >= 6 ? (i === 6 ? "text-right" : "text-right") : "text-left"}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((row, index) => (
                    <tr key={row.documento_liquidacao} className={`transition-colors hover:bg-slate-50 ${index % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}>
                      <td className="px-5 py-3.5 text-slate-800 font-semibold text-xs">{row.numero_processo || "—"}</td>
                      <td className="px-5 py-3.5 font-mono text-[11px] text-slate-500">{row.codigo_nota_empenho || "—"}</td>
                      <td className="px-5 py-3.5 font-mono text-[11px] text-slate-500">{row.documento_liquidacao || "—"}</td>
                      <td className="px-5 py-3.5 text-slate-600 text-xs max-w-[160px] truncate">{row.credor || "—"}</td>
                      <td className="px-5 py-3.5 text-slate-600 text-xs">{row.fonte || "—"}</td>
                      <td className="px-5 py-3.5 text-slate-500 text-xs">{formatDate(row.data_liquidacao)}</td>
                      <td className="px-5 py-3.5 text-right font-mono font-bold text-emerald-600 text-xs">{formatCurrency(row.valor_ja_pago_obs)}</td>
                      <td className="px-5 py-3.5 text-right font-mono font-bold text-para-blue text-xs">{formatCurrency(row.valor_liquido)}</td>
                      <td className="px-5 py-3.5 text-right font-mono font-bold text-para-blue text-xs">{formatCurrency(row.valor_bruto)}</td>
                      <td className="px-5 py-3.5 text-right font-mono font-bold text-amber-600 text-xs">{formatCurrency(row.valor_liquidado_a_pagar)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            <div className="border-t border-slate-100 px-6 py-4 flex items-center justify-between bg-slate-50/50">
              <Link
                href={buildHref(filters, pagina - 1)}
                className={`px-4 py-2 text-[11px] font-black uppercase tracking-widest rounded-lg border transition-colors ${pagina <= 1 ? "text-slate-300 border-slate-100 pointer-events-none" : "text-slate-600 border-slate-200 hover:bg-slate-100"}`}
                aria-disabled={pagina <= 1}
              >
                Anterior
              </Link>
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                Página {pagina} de {totalPages}
              </span>
              <Link
                href={buildHref(filters, pagina + 1)}
                className={`px-4 py-2 text-[11px] font-black uppercase tracking-widest rounded-lg border transition-colors ${pagina >= totalPages ? "text-slate-300 border-slate-100 pointer-events-none" : "text-slate-600 border-slate-200 hover:bg-slate-100"}`}
                aria-disabled={pagina >= totalPages}
              >
                Próxima
              </Link>
            </div>
          </>
        ) : (
          <div className="px-6 py-16 text-center">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <FileCheck2 size={18} className="text-slate-400" />
            </div>
            <p className="text-slate-400 text-sm font-medium">
              {hasActiveFilters ? "Nenhum registro para os filtros aplicados." : "Nenhuma liquidação a pagar encontrada."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
