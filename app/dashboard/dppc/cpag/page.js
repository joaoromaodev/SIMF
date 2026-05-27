import { getSupabaseAdminClient } from "../../../../lib/supabase/server.js";
import CpagExportButtons from "../../../../components/cpag-export-buttons.jsx";
import ErrorBanner from "../../../../components/error-banner.jsx";
import { CpagTabs } from "../../../../components/cpag-tabs.jsx";
import Link from "next/link";
import { ChevronLeft, TrendingUp, Clock } from "lucide-react";
import StatCard from "../../../../components/ui/stat-card.jsx";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

function anoToYearScope(ano) {
  if (ano === "2023" || ano === "2024") return "2023_2024";
  return ano;
}

const DEFAULT_KPIS = {
  totalPago: 0,
  totalAPagar: 0,
  quantidadeOBs: 0,
  quantidadeObsConfirmadas: 0,
  quantidadeObsPendentes: 0,
  quantidadeDlsComSaldo: 0,
};

function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value ?? 0);
}


export default async function CpagDashboardPage({ searchParams }) {
  const sp        = await searchParams;
  const ano       = sp?.ano       || "2026";
  const aba       = sp?.aba       || "liquidados";
  const paginaLiq = Math.max(1, parseInt(sp?.paginaLiq || "1", 10));
  const paginaMon = Math.max(1, parseInt(sp?.paginaMon || "1", 10));
  const offsetLiq = (paginaLiq - 1) * PAGE_SIZE;
  const offsetMon = (paginaMon - 1) * PAGE_SIZE;
  const credor    = sp?.credor    || "";
  const processo  = sp?.processo  || "";
  const docCred   = sp?.doc_cred  || "";
  const vinculo   = sp?.vinculo   || "";
  const yearScope = anoToYearScope(ano);

  const supabase = getSupabaseAdminClient();

  const [
    kpisResult,
    liquidadosResult,
    liquidadosCountResult,
    monitoramentoResult,
    monitoramentoCountResult,
  ] = await Promise.all([
    supabase.rpc("fn_cpag_kpis", { p_year_scope: yearScope, p_ano: ano }),
    (() => {
      let q = supabase
        .from("vw_liquidados_a_pagar")
        .select("numero_processo, codigo_nota_empenho, documento_liquidacao, data_liquidacao, credor, codigo_natureza_despesa, fonte, valor_liquido, valor_bruto, valor_liquidado_a_pagar, valor_ja_pago_obs")
        .eq("year_scope", yearScope)
        .order("data_liquidacao", { ascending: false, nullsFirst: false })
        .range(offsetLiq, offsetLiq + PAGE_SIZE - 1);
      if (credor)   q = q.ilike("credor",          `%${credor}%`);
      if (processo) q = q.ilike("numero_processo",  `%${processo}%`);
      return q;
    })(),
    (() => {
      let q = supabase
        .from("vw_liquidados_a_pagar")
        .select("*", { count: "exact", head: true })
        .eq("year_scope", yearScope);
      if (credor)   q = q.ilike("credor",         `%${credor}%`);
      if (processo) q = q.ilike("numero_processo", `%${processo}%`);
      return q;
    })(),
    (() => {
      let q = supabase
        .from("vw_monitoramento_pagamentos")
        .select("numero_processo, credor, fonte, documento_liquidacao, ordem_bancaria, data_liquidacao, data_pagamento, valor, codigo_unidade_gestora, contrato_convenio, descricao, documento_credor, confirmado_manualmente, confirmado_por, confirmado_em, observacao, tem_vinculo_nedl, motivo_sem_vinculo")
        .gte("data_pagamento", `${ano}-01-01`)
        .lte("data_pagamento", `${ano}-12-31`)
        .order("data_pagamento", { ascending: false })
        .range(offsetMon, offsetMon + PAGE_SIZE - 1);
      if (credor)   q = q.ilike("credor",          `%${credor}%`);
      if (processo) q = q.ilike("numero_processo",  `%${processo}%`);
      if (docCred)  q = q.ilike("documento_credor", `%${docCred}%`);
      if (vinculo === "sem_vinculo") q = q.eq("tem_vinculo_nedl", false);
      if (vinculo === "confirmados") q = q.eq("confirmado_manualmente", true);
      return q;
    })(),
    (() => {
      let q = supabase
        .from("vw_monitoramento_pagamentos")
        .select("*", { count: "exact", head: true })
        .gte("data_pagamento", `${ano}-01-01`)
        .lte("data_pagamento", `${ano}-12-31`);
      if (credor)   q = q.ilike("credor",          `%${credor}%`);
      if (processo) q = q.ilike("numero_processo",  `%${processo}%`);
      if (docCred)  q = q.ilike("documento_credor", `%${docCred}%`);
      if (vinculo === "sem_vinculo") q = q.eq("tem_vinculo_nedl", false);
      if (vinculo === "confirmados") q = q.eq("confirmado_manualmente", true);
      return q;
    })(),
  ]);

  const queryErrors = [
    kpisResult.error          && "vw_cpag_kpis",
    liquidadosResult.error    && "vw_liquidados_a_pagar",
    monitoramentoResult.error && "vw_monitoramento_pagamentos",
  ].filter(Boolean);

  const fetchError = queryErrors.length > 0
    ? `Falha ao consultar: ${queryErrors.join(", ")}. Os dados podem estar incompletos.`
    : null;

  const kpisData = (kpisResult.data || [])[0] || {};
  const kpis = {
    totalPago:               parseFloat(kpisData.total_pago_confirmado)    || DEFAULT_KPIS.totalPago,
    totalAPagar:             parseFloat(kpisData.total_a_pagar)            || DEFAULT_KPIS.totalAPagar,
    quantidadeOBs:           Number(kpisData.quantidade_obs_emitidas)      || DEFAULT_KPIS.quantidadeOBs,
    quantidadeObsConfirmadas: Number(kpisData.quantidade_obs_confirmadas)  || DEFAULT_KPIS.quantidadeObsConfirmadas,
    quantidadeObsPendentes:  Number(kpisData.quantidade_obs_pendentes)     || DEFAULT_KPIS.quantidadeObsPendentes,
    quantidadeDlsComSaldo:   Number(kpisData.quantidade_dls_com_saldo)     || DEFAULT_KPIS.quantidadeDlsComSaldo,
  };

  const totalLiq      = liquidadosCountResult.count    ?? 0;
  const totalMon      = monitoramentoCountResult.count ?? 0;
  const totalPagesLiq = Math.max(1, Math.ceil(totalLiq / PAGE_SIZE));
  const totalPagesMon = Math.max(1, Math.ceil(totalMon / PAGE_SIZE));
  const liquidados    = liquidadosResult.data    ?? [];
  const monitoramento = monitoramentoResult.data ?? [];

  return (
    <div className="space-y-8">
      {fetchError && <ErrorBanner message={fetchError} />}

      {/* Breadcrumb + Header */}
      <div>
        <Link
          href="/dashboard/dppc"
          className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-400 hover:text-para-blue uppercase tracking-widest mb-5 transition-colors"
        >
          <ChevronLeft size={13} />
          Hub DPPC
        </Link>
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              Dashboard CPAG
            </h1>
            <p className="text-slate-500 text-sm font-medium mt-1">
              Controle de Pagamentos
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
                href={`/dashboard/dppc/cpag?aba=${aba}&ano=${a}`}
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
        <StatCard label="Total Efetivamente Pago" value={formatCurrency(kpis.totalPago)} sub={`${kpis.quantidadeObsConfirmadas.toLocaleString("pt-BR")} OBs confirmadas`} icon={TrendingUp} accent="green" />
        <StatCard label="Total a Pagar" value={formatCurrency(kpis.totalAPagar)} sub={`${kpis.quantidadeDlsComSaldo.toLocaleString("pt-BR")} DLs com saldo pendente`} icon={Clock} accent="amber" />
        <div
          className="bg-white rounded-card border border-slate-200 px-5 py-4 flex flex-col justify-center gap-1"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Relatórios</p>
          <CpagExportButtons />
        </div>
      </div>

      {/* Tabela — largura total */}
      <CpagTabs
        liquidados={liquidados}
        monitoramento={monitoramento}
        ano={ano}
        abaAtiva={aba}
        paginaLiq={paginaLiq}
        totalPagesLiq={totalPagesLiq}
        totalLiq={totalLiq}
        paginaMon={paginaMon}
        totalPagesMon={totalPagesMon}
        totalMon={totalMon}
        pageSize={PAGE_SIZE}
      />
    </div>
  );
}
