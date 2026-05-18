import { getSupabaseAdminClient } from "../../../../lib/supabase/server.js";
import { CeoTabs } from "../../../../components/ceo-tabs.jsx";
import CeoExportButtons from "../../../../components/ceo-export-buttons.jsx";
import ErrorBanner from "../../../../components/error-banner.jsx";
import Link from "next/link";
import { ChevronLeft, Landmark } from "lucide-react";

export const dynamic = "force-dynamic";

function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value ?? 0);
}

// 2023 e 2024 estão consolidados num único cubo histórico
function anoToYearScope(ano) {
  if (ano === "2023" || ano === "2024") return "2023_2024";
  return ano;
}

function StatCard({ label, value, sub, icon: Icon, accent }) {
  const accents    = { blue: "border-blue-600" };
  const textAccents = { blue: "text-blue-600" };
  const bgAccents  = { blue: "bg-blue-50" };

  return (
    <div className={`bg-white rounded-xl border border-slate-200 shadow-sm border-l-4 ${accents[accent]} px-7 py-6 flex items-center gap-5`}>
      <div className={`p-3.5 rounded-xl ${bgAccents[accent]} flex-shrink-0`}>
        <Icon size={24} className={textAccents[accent]} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">{label}</p>
        <p className={`text-4xl font-black ${textAccents[accent]} leading-none tracking-tight`}>{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-2 font-medium">{sub}</p>}
      </div>
    </div>
  );
}

export default async function CeoDashboardPage({ searchParams }) {
  const sp        = await searchParams;
  const ano       = sp?.ano || "2026";
  const yearScope = anoToYearScope(ano);

  const supabase = getSupabaseAdminClient();

  const { data: empenhos, error } = await supabase
    .from("vw_ne_active")
    .select("codigo_nota_empenho, data_empenho, nome_usuario_criou, codigo_unidade_gestora, numero_processo, valor_original, valor_corrente, saldo_a_liquidar, quantidade, year_scope")
    .eq("year_scope", yearScope)
    .order("data_empenho", { ascending: false, nullsFirst: false })
    .limit(500);

  const rows = empenhos ?? [];

  const kpis = {
    quantidadeEmpenhos: rows.length,
    totalEmpenhado: rows.reduce((sum, r) => sum + (parseFloat(r.valor_corrente) || 0), 0),
    totalSaldoLiquidar: rows.reduce((sum, r) => sum + (parseFloat(r.saldo_a_liquidar) || 0), 0),
  };

  return (
    <div className="space-y-8">

      {error && <ErrorBanner message={`Falha ao consultar vw_ne_active: ${error.message}`} />}

      {/* Breadcrumb + Header */}
      <div>
        <Link
          href="/dashboard/dfin"
          className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-400 hover:text-blue-600 uppercase tracking-widest mb-5 transition-colors"
        >
          <ChevronLeft size={13} />
          Hub DFIN
        </Link>
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              Dashboard CEO
            </h1>
            <p className="text-slate-400 text-sm font-medium mt-1">
              Coord. de Execução Orçamentária
            </p>
          </div>
          <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-sm">
            Dados em tempo real
          </span>
        </div>
      </div>

      {/* Seletor de Ano */}
      <div className="flex items-center gap-3">
        <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">
          Ano de Exercício
        </span>
        <details className="relative group">
          <summary className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg shadow-sm text-[11px] font-black uppercase tracking-widest text-blue-600 cursor-pointer select-none hover:border-blue-400 transition-colors list-none">
            {ano}
            <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-open:rotate-180">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </summary>
          <div className="absolute left-0 top-full mt-1 z-20 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 min-w-[110px]">
            {["2023", "2024", "2025", "2026"].map((a) => (
              <Link
                key={a}
                href={`/dashboard/dfin/ceo?ano=${a}`}
                className={`flex items-center justify-between px-4 py-2 text-[11px] font-black uppercase tracking-widest transition-colors ${
                  ano === a
                    ? "text-blue-600 bg-blue-50"
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

      {/* KPIs + Exportação */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_220px] gap-5 items-stretch">
        <StatCard
          label="Empenhos Gerados"
          value={kpis.quantidadeEmpenhos.toLocaleString("pt-BR")}
          sub={formatCurrency(kpis.totalEmpenhado) + " valor corrente"}
          icon={Landmark}
          accent="blue"
        />
        <StatCard
          label="Saldo a Liquidar"
          value={formatCurrency(kpis.totalSaldoLiquidar)}
          sub="Total de saldo pendente de liquidação"
          icon={Landmark}
          accent="blue"
        />
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-6 py-6 flex flex-col justify-center gap-1">
          <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Relatórios</p>
          <CeoExportButtons />
        </div>
      </div>

      {/* Abas */}
      <CeoTabs empenhos={rows} ano={ano} />
    </div>
  );
}
