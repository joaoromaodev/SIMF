import { getSupabaseAdminClient } from "../../../../lib/supabase/server.js";
import CliqCharts from "../../../../components/cliq-charts.jsx";
import Link from "next/link";

const PAGE_SIZE = 50;

function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value ?? 0);
}

function formatDate(dateString) {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("pt-BR");
}

// ─── Queries ──────────────────────────────────────────────────────────────────

async function fetchFontes(supabase) {
  const { data, error } = await supabase
    .from("vw_liquidados_a_pagar")
    .select("fonte")
    .not("fonte", "is", null);

  if (error) return [];

  const unique = [...new Set((data || []).map((r) => r.fonte).filter(Boolean))];
  return unique.sort();
}

async function fetchCliqData(supabase, filters, pagina) {
  const page = Math.max(1, parseInt(pagina, 10) || 1);
  const from = (page - 1) * PAGE_SIZE;

  // Dados agregados para KPIs e gráficos (todas as páginas, campos mínimos)
  let aggQuery = supabase
    .from("vw_liquidados_a_pagar")
    .select("fonte, valor_bruto, valor_liquidado_a_pagar");

  // Dados paginados para a tabela
  let rowQuery = supabase
    .from("vw_liquidados_a_pagar")
    .select("*", { count: "exact" })
    .order("updated_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  if (filters.fonte) {
    aggQuery = aggQuery.eq("fonte", filters.fonte);
    rowQuery = rowQuery.eq("fonte", filters.fonte);
  }
  if (filters.credor) {
    aggQuery = aggQuery.ilike("credor", `%${filters.credor}%`);
    rowQuery = rowQuery.ilike("credor", `%${filters.credor}%`);
  }
  if (filters.processo) {
    aggQuery = aggQuery.ilike("numero_processo", `%${filters.processo}%`);
    rowQuery = rowQuery.ilike("numero_processo", `%${filters.processo}%`);
  }

  const [aggResult, rowResult] = await Promise.all([aggQuery, rowQuery]);

  return {
    aggData: aggResult.data || [],
    rows: rowResult.data || [],
    totalCount: rowResult.count || 0,
  };
}

// ─── Cálculos de KPI e dados de gráfico ──────────────────────────────────────

function calculateKPIs(aggData) {
  const totalEmLiquidacao = aggData.reduce(
    (sum, r) => sum + (parseFloat(r.valor_bruto) || 0),
    0
  );
  const quantidadeEmLiquidacao = aggData.length;
  const quantidadeLiquidadosAPagar = aggData.filter(
    (r) => (parseFloat(r.valor_liquidado_a_pagar) || 0) > 0
  ).length;

  return { totalEmLiquidacao, quantidadeEmLiquidacao, quantidadeLiquidadosAPagar };
}

function processStatusData(aggData) {
  const liquidados = aggData.filter(
    (r) => (parseFloat(r.valor_liquidado_a_pagar) || 0) > 0
  ).length;
  const emLiquidacao = aggData.length - liquidados;

  return [
    { name: "Em Liquidação", value: emLiquidacao },
    { name: "Liquidados a Pagar", value: liquidados },
  ];
}

function processSourceData(aggData) {
  const grouped = {};
  aggData.forEach((r) => {
    const source = r.fonte || "Não Informado";
    grouped[source] = (grouped[source] || 0) + (parseFloat(r.valor_bruto) || 0);
  });

  return Object.entries(grouped).map(([name, value]) => ({
    name,
    value: Math.round(value * 100) / 100,
  }));
}

// ─── Helpers de navegação ────────────────────────────────────────────────────

function buildHref(filters, pagina) {
  const params = new URLSearchParams();
  if (filters.fonte) params.set("fonte", filters.fonte);
  if (filters.credor) params.set("credor", filters.credor);
  if (filters.processo) params.set("processo", filters.processo);
  if (pagina && pagina > 1) params.set("pagina", pagina);
  const qs = params.toString();
  return `/dashboard/dppc/cliq${qs ? `?${qs}` : ""}`;
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function CliqDashboardPage({ searchParams }) {
  const sp = await searchParams;

  const filters = {
    fonte: sp.fonte || "",
    credor: sp.credor || "",
    processo: sp.processo || "",
  };
  const pagina = Math.max(1, parseInt(sp.pagina, 10) || 1);

  const supabase = getSupabaseAdminClient();

  const [fontes, { aggData, rows, totalCount }] = await Promise.all([
    fetchFontes(supabase),
    fetchCliqData(supabase, filters, pagina),
  ]);

  const kpis = calculateKPIs(aggData);
  const statusData = processStatusData(aggData);
  const sourceData = processSourceData(aggData);
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const hasActiveFilters = filters.fonte || filters.credor || filters.processo;

  return (
    <div className="space-y-10">
      {/* Link de Retorno */}
      <div>
        <Link
          href="/dashboard/dppc"
          className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-para-blue uppercase tracking-widest mb-6 transition-colors"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Voltar ao Hub DPPC
        </Link>
      </div>

      {/* Page Title */}
      <div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">
          Dashboard CLIQ
        </h1>
        <p className="text-slate-500 text-sm font-medium">
          Controle de Liquidações — Exercício Fiscal 2026
        </p>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <form method="GET" action="">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-xs uppercase font-black text-slate-500 tracking-widest mb-1">
                Credor
              </label>
              <input
                type="text"
                name="credor"
                defaultValue={filters.credor}
                placeholder="Filtrar por credor..."
                className="w-full border border-slate-200 rounded px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-para-blue"
              />
            </div>
            <div>
              <label className="block text-xs uppercase font-black text-slate-500 tracking-widest mb-1">
                Fonte de Recurso
              </label>
              <select
                name="fonte"
                defaultValue={filters.fonte}
                className="w-full border border-slate-200 rounded px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-para-blue"
              >
                <option value="">Todas as fontes</option>
                {fontes.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs uppercase font-black text-slate-500 tracking-widest mb-1">
                Processo
              </label>
              <input
                type="text"
                name="processo"
                defaultValue={filters.processo}
                placeholder="Filtrar por processo..."
                className="w-full border border-slate-200 rounded px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-para-blue"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="px-4 py-2 bg-para-blue text-white text-xs font-black uppercase tracking-widest rounded hover:bg-para-blue/90 transition-colors"
            >
              Filtrar
            </button>
            {hasActiveFilters && (
              <Link
                href="/dashboard/dppc/cliq"
                className="px-4 py-2 border border-slate-200 text-slate-600 text-xs font-black uppercase tracking-widest rounded hover:bg-slate-50 transition-colors"
              >
                Limpar Filtros
              </Link>
            )}
          </div>
        </form>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md border-l-4 border-para-blue p-6">
          <p className="text-xs uppercase font-black text-slate-500 tracking-widest mb-2">
            Total (R$) em Liquidação
          </p>
          <p className="text-3xl font-black text-para-blue wrap-break-word">
            {formatCurrency(kpis.totalEmLiquidacao)}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md border-l-4 border-para-blue p-6">
          <p className="text-xs uppercase font-black text-slate-500 tracking-widest mb-2">
            Empenhos em Liquidação
          </p>
          <p className="text-3xl font-black text-para-blue">
            {kpis.quantidadeEmLiquidacao.toLocaleString("pt-BR")}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md border-l-4 border-para-blue p-6">
          <p className="text-xs uppercase font-black text-slate-500 tracking-widest mb-2">
            Empenhos Liquidados a Pagar
          </p>
          <p className="text-3xl font-black text-para-blue">
            {kpis.quantidadeLiquidadosAPagar.toLocaleString("pt-BR")}
          </p>
        </div>
      </div>

      {/* Charts */}
      <CliqCharts statusData={statusData} sourceData={sourceData} />

      {/* Tabela de Liquidações */}
      <div className="bg-white rounded-lg shadow-md border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-black uppercase tracking-wider text-slate-800">
            Visão Geral de Liquidações
          </h2>
          {totalCount > 0 && (
            <span className="text-xs text-slate-500 font-medium">
              {totalCount.toLocaleString("pt-BR")} registro{totalCount !== 1 ? "s" : ""}
              {hasActiveFilters ? " (filtrado)" : ""}
            </span>
          )}
        </div>

        {rows.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-slate-50 z-10">
                  <tr className="border-b border-slate-200">
                    <th className="px-6 py-3 text-left font-black uppercase text-xs tracking-wider text-slate-700">
                      Processo
                    </th>
                    <th className="px-6 py-3 text-left font-black uppercase text-xs tracking-wider text-slate-700">
                      Empenho
                    </th>
                    <th className="px-6 py-3 text-left font-black uppercase text-xs tracking-wider text-slate-700">
                      Documento de Liquidação
                    </th>
                    <th className="px-6 py-3 text-left font-black uppercase text-xs tracking-wider text-slate-700">
                      Credor
                    </th>
                    <th className="px-6 py-3 text-left font-black uppercase text-xs tracking-wider text-slate-700">
                      Fonte
                    </th>
                    <th className="px-6 py-3 text-left font-black uppercase text-xs tracking-wider text-slate-700">
                      Atualizado em
                    </th>
                    <th className="px-6 py-3 text-right font-black uppercase text-xs tracking-wider text-slate-700">
                      Valor Líquido
                    </th>
                    <th className="px-6 py-3 text-right font-black uppercase text-xs tracking-wider text-slate-700">
                      Valor Bruto
                    </th>
                    <th className="px-6 py-3 text-right font-black uppercase text-xs tracking-wider text-slate-700">
                      A Pagar
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => (
                    <tr
                      key={row.documento_liquidacao}
                      className={`border-b border-slate-100 ${
                        index % 2 === 0 ? "bg-white" : "bg-slate-50"
                      } hover:bg-slate-100 transition-colors`}
                    >
                      <td className="px-6 py-3 text-slate-800 font-medium">
                        {row.numero_processo || "—"}
                      </td>
                      <td className="px-6 py-3 text-slate-700 font-mono text-xs">
                        {row.codigo_nota_empenho || "—"}
                      </td>
                      <td className="px-6 py-3 text-slate-700 font-mono text-xs">
                        {row.documento_liquidacao || "—"}
                      </td>
                      <td className="px-6 py-3 text-slate-700">
                        {row.credor || "—"}
                      </td>
                      <td className="px-6 py-3 text-slate-700">
                        {row.fonte || "—"}
                      </td>
                      <td className="px-6 py-3 text-slate-700">
                        {formatDate(row.updated_at)}
                      </td>
                      <td className="px-6 py-3 text-right font-bold text-para-blue">
                        {formatCurrency(row.valor_liquido)}
                      </td>
                      <td className="px-6 py-3 text-right font-bold text-para-blue">
                        {formatCurrency(row.valor_bruto)}
                      </td>
                      <td className="px-6 py-3 text-right font-bold text-para-blue">
                        {formatCurrency(row.valor_liquidado_a_pagar)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            <div className="border-t border-slate-200 px-6 py-4 flex items-center justify-between bg-slate-50">
              <Link
                href={buildHref(filters, pagina - 1)}
                className={`px-4 py-2 border border-slate-200 text-xs font-black uppercase tracking-widest rounded transition-colors ${
                  pagina <= 1
                    ? "text-slate-300 pointer-events-none border-slate-100"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
                aria-disabled={pagina <= 1}
              >
                Anterior
              </Link>

              <span className="text-xs font-black text-slate-500 uppercase tracking-widest">
                Pagina {pagina} de {totalPages}
              </span>

              <Link
                href={buildHref(filters, pagina + 1)}
                className={`px-4 py-2 border border-slate-200 text-xs font-black uppercase tracking-widest rounded transition-colors ${
                  pagina >= totalPages
                    ? "text-slate-300 pointer-events-none border-slate-100"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
                aria-disabled={pagina >= totalPages}
              >
                Proxima
              </Link>
            </div>
          </>
        ) : (
          <div className="px-6 py-12 text-center">
            <p className="text-slate-500 text-sm font-medium">
              {hasActiveFilters
                ? "Nenhum registro encontrado para os filtros aplicados."
                : "Nenhuma liquidação a pagar encontrada."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
