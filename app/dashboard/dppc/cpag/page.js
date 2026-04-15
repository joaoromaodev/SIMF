import { getSupabaseAdminClient } from "../../../../lib/supabase/server.js";
import PaymentToggle from "../../../../components/payment-toggle.jsx";
import CpagExportButtons from "../../../../components/cpag-export-buttons.jsx";
import ErrorBanner from "../../../../components/error-banner.jsx";
import { LiquidadosTable } from "../../../../components/liquidados-table.jsx";
import Link from "next/link";
import { ChevronLeft, TrendingUp, Clock, Landmark } from "lucide-react";

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

async function fetchCpagData(supabase) {
  const [obAggResult, dlAggResult, liquidadosResult, monitoramentoResult] = await Promise.all([
    supabase.from("vw_monitoramento_pagamentos").select("valor, confirmado_manualmente"),
    supabase.from("vw_liquidados_a_pagar").select("valor_liquidado_a_pagar"),
    supabase.from("vw_liquidados_a_pagar").select("*").order("updated_at", { ascending: false }).limit(100),
    supabase.from("vw_monitoramento_pagamentos").select("*").order("data_pagamento", { ascending: false }).limit(100),
  ]);

  const queryErrors = [
    obAggResult.error && "vw_monitoramento_pagamentos (agregado)",
    dlAggResult.error && "vw_liquidados_a_pagar (agregado)",
    liquidadosResult.error && "vw_liquidados_a_pagar (tabela)",
    monitoramentoResult.error && "vw_monitoramento_pagamentos (tabela)",
  ].filter(Boolean);

  const fetchError = queryErrors.length > 0
    ? `Falha ao consultar: ${queryErrors.join(", ")}. Os dados podem estar incompletos.`
    : null;

  const obData = obAggResult.data || [];
  const dlData = dlAggResult.data || [];

  const totalPago = obData.filter((r) => r.confirmado_manualmente).reduce((s, r) => s + (parseFloat(r.valor) || 0), 0);
  const totalAPagar = dlData.reduce((s, r) => s + (parseFloat(r.valor_liquidado_a_pagar) || 0), 0);
  const quantidadeOBs = obData.length;

  return {
    kpis: { totalPago, totalAPagar, quantidadeOBs },
    liquidados: liquidadosResult.data || [],
    monitoramento: monitoramentoResult.data || [],
    fetchError,
  };
}

function StatCard({ label, value, sub, icon: Icon, accent }) {
  const accents = {
    green: "border-emerald-500",
    amber: "border-amber-400",
    blue: "border-para-blue",
  };
  const textAccents = {
    green: "text-emerald-600",
    amber: "text-amber-600",
    blue: "text-para-blue",
  };
  const bgAccents = {
    green: "bg-emerald-50",
    amber: "bg-amber-50",
    blue: "bg-blue-50",
  };

  return (
    <div className={`bg-white rounded-xl border border-slate-200 shadow-sm border-l-4 ${accents[accent]} p-5 flex items-start gap-4`}>
      <div className={`p-2.5 rounded-lg ${bgAccents[accent]} flex-shrink-0`}>
        <Icon size={18} className={textAccents[accent]} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1">{label}</p>
        <p className={`text-2xl font-black ${textAccents[accent]} leading-none`}>{value}</p>
        {sub && <p className="text-[11px] text-slate-400 mt-1.5 font-medium">{sub}</p>}
      </div>
    </div>
  );
}

export default async function CpagDashboardPage() {
  const supabase = getSupabaseAdminClient();
  const { kpis, liquidados, monitoramento, fetchError } = await fetchCpagData(supabase);

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
            <p className="text-slate-400 text-sm font-medium mt-1">
              Controle de Pagamentos — Exercício Fiscal 2026
            </p>
          </div>
          <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-sm">
            Dados em tempo real
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Total Efetivamente Pago"
          value={formatCurrency(kpis.totalPago)}
          sub="OBs confirmadas manualmente"
          icon={TrendingUp}
          accent="green"
        />
        <StatCard
          label="Total a Pagar"
          value={formatCurrency(kpis.totalAPagar)}
          sub="DLs sem OB correspondente"
          icon={Clock}
          accent="amber"
        />
        <StatCard
          label="Ordens Bancárias Emitidas"
          value={kpis.quantidadeOBs.toLocaleString("pt-BR")}
          sub="Total de OBs no período"
          icon={Landmark}
          accent="blue"
        />
      </div>

      {/* Grid principal + sidebar */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-6">

        {/* Coluna principal */}
        <div className="space-y-6 min-w-0">

          {/* Tabela: Liquidados a Pagar */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
              <div>
                <h2 className="text-sm font-black uppercase tracking-widest text-slate-800">
                  Liquidados a Pagar
                </h2>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                  Documentos de liquidação sem ordem bancária emitida
                </p>
              </div>
              {liquidados.length > 0 && (
                <span className="text-[11px] font-black text-slate-400 bg-slate-100 rounded-full px-3 py-1">
                  {liquidados.length} registros
                </span>
              )}
            </div>

            {liquidados.length > 0 ? (
              <LiquidadosTable liquidados={liquidados} />
            ) : (
              <div className="px-6 py-16 text-center">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                  <TrendingUp size={18} className="text-slate-400" />
                </div>
                <p className="text-slate-400 text-sm font-medium">
                  Nenhum documento de liquidação a pagar encontrado.
                </p>
              </div>
            )}
          </div>

          {/* Tabela: Monitoramento de Pagamentos */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
              <div>
                <h2 className="text-sm font-black uppercase tracking-widest text-slate-800">
                  Monitoramento de Pagamentos
                </h2>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                  Ordens bancárias emitidas e status de confirmação
                </p>
              </div>
              {monitoramento.length > 0 && (
                <span className="text-[11px] font-black text-slate-400 bg-slate-100 rounded-full px-3 py-1">
                  {monitoramento.length} registros
                </span>
              )}
            </div>

            {monitoramento.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      {["Processo", "Credor", "Fonte", "DL", "OB", "Data Pgto", "Valor", "Status"].map((h, i) => (
                        <th
                          key={h}
                          className={`px-5 py-3 text-[11px] font-black uppercase tracking-wider text-slate-500 ${
                            i >= 6 ? "text-right" : i === 7 ? "text-center" : "text-left"
                          }`}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {monitoramento.map((item, index) => (
                      <tr
                        key={item.ordem_bancaria}
                        className={`transition-colors hover:bg-slate-50 ${
                          index % 2 === 0 ? "bg-white" : "bg-slate-50/50"
                        }`}
                      >
                        <td className="px-5 py-3.5 text-slate-800 font-semibold text-xs">
                          {item.numero_processo || "—"}
                        </td>
                        <td className="px-5 py-3.5 text-slate-600 text-xs max-w-[180px] truncate">
                          {item.credor || "—"}
                        </td>
                        <td className="px-5 py-3.5 text-slate-600 text-xs">
                          {item.fonte || "—"}
                        </td>
                        <td className="px-5 py-3.5 font-mono text-[11px] text-slate-500">
                          {item.documento_liquidacao || "—"}
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
                        <td className="px-5 py-3.5 text-center">
                          <PaymentToggle
                            ordemBancaria={item.ordem_bancaria}
                            initialConfirmado={item.confirmado_manualmente ?? false}
                            confirmadoPor={item.confirmado_por ?? null}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-6 py-16 text-center">
                <p className="text-slate-400 text-sm font-medium">
                  Nenhuma ordem bancária encontrada.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar direita */}
        <aside className="space-y-4">

          {/* Exportação */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-4">
              Relatórios
            </p>
            <CpagExportButtons />
          </div>

          {/* Indicadores */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-4">
              Painel de Indicadores
            </p>
            <div className="space-y-0 divide-y divide-slate-100">
              {[
                {
                  label: "OBs confirmadas",
                  value: monitoramento.filter((r) => r.confirmado_manualmente).length,
                  color: "text-emerald-600",
                  bg: "bg-emerald-50",
                },
                {
                  label: "OBs pendentes",
                  value: monitoramento.filter((r) => !r.confirmado_manualmente).length,
                  color: "text-amber-600",
                  bg: "bg-amber-50",
                },
                {
                  label: "DLs sem OB",
                  value: liquidados.length,
                  color: "text-para-blue",
                  bg: "bg-blue-50",
                },
              ].map(({ label, value, color, bg }) => (
                <div key={label} className="flex items-center justify-between py-3">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    {label}
                  </span>
                  <span className={`text-sm font-black ${color} ${bg} px-2.5 py-1 rounded-md`}>
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Observações */}
          <div className="bg-slate-900 rounded-xl p-5">
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3">
              Observações
            </p>
            <p className="text-xs text-slate-300 leading-relaxed">
              O status de pagamento pode ser confirmado manualmente na coluna Status da tabela de Monitoramento. A alteração é registrada em tempo real.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}