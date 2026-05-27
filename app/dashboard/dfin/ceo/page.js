import { getSupabaseAdminClient } from "../../../../lib/supabase/server.js";
import { CeoTabs } from "../../../../components/ceo-tabs.jsx";
import CeoExportButtons from "../../../../components/ceo-export-buttons.jsx";
import ErrorBanner from "../../../../components/error-banner.jsx";
import Link from "next/link";
import { ChevronLeft, Landmark } from "lucide-react";
import StatCard from "../../../../components/ui/stat-card.jsx";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

function anoToYearScope(ano) {
  if (ano === "2023" || ano === "2024") return "2023_2024";
  return ano;
}

export default async function CeoDashboardPage({ searchParams }) {
  const sp        = await searchParams;
  const ano       = sp?.ano    || "2026";
  const aba       = sp?.aba    || "empenhos";
  const pagina    = Math.max(1, parseInt(sp?.pagina || "1", 10));
  const q         = sp?.q      || "";
  const yearScope = anoToYearScope(ano);
  const offset    = (pagina - 1) * PAGE_SIZE;

  const supabase = getSupabaseAdminClient();

  const [{ data: empenhos, error }, { data: totalReal }] = await Promise.all([
    (() => {
      let query = supabase
        .from("vw_ne_active")
        .select("codigo_nota_empenho, data_empenho, nome_usuario_criou, codigo_unidade_gestora, numero_processo, valor_original, valor_corrente, saldo_a_liquidar, quantidade, year_scope")
        .eq("year_scope", yearScope)
        .order("data_empenho", { ascending: false, nullsFirst: false })
        .range(offset, offset + PAGE_SIZE - 1);
      if (q) {
        // Supabase REST não suporta OR diretamente em .filter — usamos ilike no processo (campo principal de busca)
        query = query.or(`numero_processo.ilike.%${q}%,codigo_nota_empenho.ilike.%${q}%`);
      }
      return query;
    })(),
    supabase.rpc("count_ne_by_year_scope", { p_year_scope: yearScope }),
  ]);

  const rows       = empenhos ?? [];
  const total      = totalReal ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const kpis = {
    quantidadeEmpenhos: total,
  };

  return (
    <div className="space-y-8">

      {error && <ErrorBanner message={`Falha ao consultar vw_ne_active: ${error.message}`} />}

      {/* Breadcrumb + Header */}
      <div>
        <Link
          href="/dashboard/dfin"
          className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-400 hover:text-para-blue uppercase tracking-widest mb-5 transition-colors"
        >
          <ChevronLeft size={13} />
          Hub DFIN
        </Link>
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              Dashboard CEO
            </h1>
            <p className="text-slate-500 text-sm font-medium mt-1">
              Coord. de Execução Orçamentária
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-emerald-700 uppercase tracking-widest bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-1">
            <span className="relative flex w-1.5 h-1.5">
              <span className="absolute inset-0 rounded-full bg-emerald-400 opacity-75 animate-ping" />
              <span className="relative w-1.5 h-1.5 rounded-full bg-emerald-500" />
            </span>
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
          <summary className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg shadow-sm text-[11px] font-black uppercase tracking-widest text-para-blue cursor-pointer select-none hover:border-para-blue transition-colors list-none">
            {ano}
            <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-open:rotate-180">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </summary>
          <div className="absolute left-0 top-full mt-1 z-20 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 min-w-[110px]">
            {["2023", "2024", "2025", "2026"].map((a) => (
              <Link
                key={a}
                href={`/dashboard/dfin/ceo?aba=${aba}&ano=${a}`}
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

      {/* KPI + Exportação */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_220px] gap-4 items-stretch">
        <StatCard
          label="Empenhos Gerados"
          value={kpis.quantidadeEmpenhos.toLocaleString("pt-BR")}
          sub={`${totalPages} páginas · ${PAGE_SIZE} registros por página`}
          icon={Landmark}
        />
        <div
          className="bg-white rounded-card border border-slate-200 px-5 py-4 flex flex-col justify-center gap-1"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Relatórios</p>
          <CeoExportButtons />
        </div>
      </div>

      {/* Abas */}
      <CeoTabs
        empenhos={rows}
        ano={ano}
        pagina={pagina}
        totalPages={totalPages}
        total={total}
        pageSize={PAGE_SIZE}
        abaAtiva={aba}
      />
    </div>
  );
}
