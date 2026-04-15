import { getSupabaseAdminClient } from "../../../../lib/supabase/server.js";
import PaymentToggle from "../../../../components/payment-toggle.jsx";
import CpagExportButtons from "../../../../components/cpag-export-buttons.jsx";
import ErrorBanner from "../../../../components/error-banner.jsx";
import Link from "next/link";

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

async function fetchCpagData(supabase) {
  const [obAggResult, dlAggResult, liquidadosResult, monitoramentoResult] = await Promise.all([
    // KPI 1 + KPI 3: OBs — valor pago e contagem
    supabase
      .from("vw_monitoramento_pagamentos")
      .select("valor, confirmado_manualmente"),

    // KPI 2: total a pagar das DLs sem OB
    supabase
      .from("vw_liquidados_a_pagar")
      .select("valor_liquidado_a_pagar"),

    // Tabela Liquidados a Pagar
    supabase
      .from("vw_liquidados_a_pagar")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(100),

    // Tabela Monitoramento de Pagamentos
    supabase
      .from("vw_monitoramento_pagamentos")
      .select("*")
      .order("data_pagamento", { ascending: false })
      .limit(100),
  ]);

  // Verifica erros por query e agrega mensagem descritiva
  const queryErrors = [
    obAggResult.error && "vw_monitoramento_pagamentos (agregado)",
    dlAggResult.error && "vw_liquidados_a_pagar (agregado)",
    liquidadosResult.error && "vw_liquidados_a_pagar (tabela)",
    monitoramentoResult.error && "vw_monitoramento_pagamentos (tabela)",
  ].filter(Boolean);

  const fetchError =
    queryErrors.length > 0
      ? `Falha ao consultar: ${queryErrors.join(", ")}. Os dados podem estar incompletos.`
      : null;

  const obData = obAggResult.data || [];
  const dlData = dlAggResult.data || [];

  const totalPago = obData
    .filter((r) => r.confirmado_manualmente)
    .reduce((s, r) => s + (parseFloat(r.valor) || 0), 0);

  const totalAPagar = dlData.reduce(
    (s, r) => s + (parseFloat(r.valor_liquidado_a_pagar) || 0),
    0
  );

  const quantidadeOBs = obData.length;

  return {
    kpis: { totalPago, totalAPagar, quantidadeOBs },
    liquidados: liquidadosResult.data || [],
    monitoramento: monitoramentoResult.data || [],
    fetchError,
  };
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function CpagDashboardPage() {
  const supabase = getSupabaseAdminClient();
  const { kpis, liquidados, monitoramento, fetchError } = await fetchCpagData(supabase);

  return (
    <div className="space-y-10">
      {/* Banner de erro de conexão */}
      {fetchError && <ErrorBanner message={fetchError} />}

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

      {/* Header */}
      <div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">
          Dashboard CPAG
        </h1>
        <p className="text-slate-500 text-sm font-medium">
          Controle de Pagamentos — Exercício Fiscal 2026
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md border-l-4 border-green-500 p-6">
          <p className="text-xs uppercase font-black text-slate-500 tracking-widest mb-2">
            Total Efetivamente Pago
          </p>
          <p className="text-3xl font-black text-green-600 wrap-break-word">
            {formatCurrency(kpis.totalPago)}
          </p>
          <p className="text-xs text-slate-400 mt-1 font-medium">OBs confirmadas manualmente</p>
        </div>

        <div className="bg-white rounded-lg shadow-md border-l-4 border-amber-400 p-6">
          <p className="text-xs uppercase font-black text-slate-500 tracking-widest mb-2">
            Total a Pagar
          </p>
          <p className="text-3xl font-black text-amber-600 wrap-break-word">
            {formatCurrency(kpis.totalAPagar)}
          </p>
          <p className="text-xs text-slate-400 mt-1 font-medium">DLs sem OB correspondente</p>
        </div>

        <div className="bg-white rounded-lg shadow-md border-l-4 border-para-blue p-6">
          <p className="text-xs uppercase font-black text-slate-500 tracking-widest mb-2">
            Ordens Bancarias Emitidas
          </p>
          <p className="text-3xl font-black text-para-blue">
            {kpis.quantidadeOBs.toLocaleString("pt-BR")}
          </p>
          <p className="text-xs text-slate-400 mt-1 font-medium">Total de OBs no periodo</p>
        </div>
      </div>

      {/* Conteúdo principal + sidebar */}
      <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-8">

        {/* Coluna principal: duas tabelas */}
        <div className="space-y-8">

          {/* Tabela: Liquidados a Pagar */}
          <div className="bg-white rounded-lg shadow-md border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-black uppercase tracking-wider text-slate-800">
                Liquidados a Pagar
              </h2>
              {liquidados.length > 0 && (
                <span className="text-xs text-slate-500 font-medium">
                  {liquidados.length} registro{liquidados.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>

            {liquidados.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr className="border-b border-slate-200">
                      <th className="px-6 py-3 text-left font-black uppercase text-xs tracking-wider text-slate-700">
                        Processo
                      </th>
                      <th className="px-6 py-3 text-left font-black uppercase text-xs tracking-wider text-slate-700">
                        Empenho
                      </th>
                      <th className="px-6 py-3 text-left font-black uppercase text-xs tracking-wider text-slate-700">
                        Credor
                      </th>
                      <th className="px-6 py-3 text-left font-black uppercase text-xs tracking-wider text-slate-700">
                        Fonte
                      </th>
                      <th className="px-6 py-3 text-left font-black uppercase text-xs tracking-wider text-slate-700">
                        DL
                      </th>
                      <th className="px-6 py-3 text-left font-black uppercase text-xs tracking-wider text-slate-700">
                        Atualizado em
                      </th>
                      <th className="px-6 py-3 text-right font-black uppercase text-xs tracking-wider text-slate-700">
                        Valor Liquido
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
                    {liquidados.map((item, index) => (
                      <tr
                        key={item.documento_liquidacao}
                        className={`border-b border-slate-100 ${
                          index % 2 === 0 ? "bg-white" : "bg-slate-50"
                        } hover:bg-slate-100 transition-colors`}
                      >
                        <td className="px-6 py-4 text-slate-800 font-medium">
                          {item.numero_processo || "—"}
                        </td>
                        <td className="px-6 py-4 text-slate-700 font-mono text-xs">
                          {item.codigo_nota_empenho || "—"}
                        </td>
                        <td className="px-6 py-4 text-slate-700">
                          {item.credor || "—"}
                        </td>
                        <td className="px-6 py-4 text-slate-700">
                          {item.fonte || "—"}
                        </td>
                        <td className="px-6 py-4 text-slate-700 font-mono text-xs">
                          {item.documento_liquidacao || "—"}
                        </td>
                        <td className="px-6 py-4 text-slate-700">
                          {formatDate(item.updated_at)}
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-para-blue">
                          {formatCurrency(item.valor_liquido)}
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-para-blue">
                          {formatCurrency(item.valor_bruto)}
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-amber-600">
                          {formatCurrency(item.valor_liquidado_a_pagar)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-6 py-12 text-center">
                <p className="text-slate-500 text-sm font-medium">
                  Nenhum documento de liquidação a pagar encontrado.
                </p>
              </div>
            )}
          </div>

          {/* Tabela: Monitoramento de Pagamentos */}
          <div className="bg-white rounded-lg shadow-md border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-black uppercase tracking-wider text-slate-800">
                Monitoramento de Pagamentos
              </h2>
              {monitoramento.length > 0 && (
                <span className="text-xs text-slate-500 font-medium">
                  {monitoramento.length} registro{monitoramento.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>

            {monitoramento.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr className="border-b border-slate-200">
                      <th className="px-6 py-3 text-left font-black uppercase text-xs tracking-wider text-slate-700">
                        Processo
                      </th>
                      <th className="px-6 py-3 text-left font-black uppercase text-xs tracking-wider text-slate-700">
                        Credor
                      </th>
                      <th className="px-6 py-3 text-left font-black uppercase text-xs tracking-wider text-slate-700">
                        Fonte
                      </th>
                      <th className="px-6 py-3 text-left font-black uppercase text-xs tracking-wider text-slate-700">
                        DL
                      </th>
                      <th className="px-6 py-3 text-left font-black uppercase text-xs tracking-wider text-slate-700">
                        OB
                      </th>
                      <th className="px-6 py-3 text-left font-black uppercase text-xs tracking-wider text-slate-700">
                        Data Pgto
                      </th>
                      <th className="px-6 py-3 text-right font-black uppercase text-xs tracking-wider text-slate-700">
                        Valor
                      </th>
                      <th className="px-6 py-3 text-center font-black uppercase text-xs tracking-wider text-slate-700">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {monitoramento.map((item, index) => (
                      <tr
                        key={item.ordem_bancaria}
                        className={`border-b border-slate-100 ${
                          index % 2 === 0 ? "bg-white" : "bg-slate-50"
                        } hover:bg-slate-100 transition-colors`}
                      >
                        <td className="px-6 py-4 text-slate-800 font-medium">
                          {item.numero_processo || "—"}
                        </td>
                        <td className="px-6 py-4 text-slate-700">
                          {item.credor || "—"}
                        </td>
                        <td className="px-6 py-4 text-slate-700">
                          {item.fonte || "—"}
                        </td>
                        <td className="px-6 py-4 text-slate-700 font-mono text-xs">
                          {item.documento_liquidacao || "—"}
                        </td>
                        <td className="px-6 py-4 text-slate-700 font-mono text-xs">
                          {item.ordem_bancaria || "—"}
                        </td>
                        <td className="px-6 py-4 text-slate-700">
                          {formatDate(item.data_pagamento)}
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-para-blue">
                          {formatCurrency(item.valor)}
                        </td>
                        <td className="px-6 py-4 text-center">
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
              <div className="px-6 py-12 text-center">
                <p className="text-slate-500 text-sm font-medium">
                  Nenhuma ordem bancária encontrada.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          <div className="bg-white rounded-lg shadow-md border border-slate-200 p-6">
            <p className="text-xs uppercase font-black text-slate-500 tracking-widest mb-4">
              Relatorios
            </p>
            <CpagExportButtons />
          </div>

          <div className="bg-white rounded-lg shadow-md border border-slate-200 p-6">
            <p className="text-xs uppercase font-black text-slate-500 tracking-widest mb-4">
              Painel de Indicadores
            </p>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-xs font-black text-slate-500 uppercase tracking-widest">
                  OBs confirmadas
                </span>
                <span className="text-sm font-black text-green-600">
                  {monitoramento.filter((r) => r.confirmado_manualmente).length}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-xs font-black text-slate-500 uppercase tracking-widest">
                  OBs pendentes
                </span>
                <span className="text-sm font-black text-amber-600">
                  {monitoramento.filter((r) => !r.confirmado_manualmente).length}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-xs font-black text-slate-500 uppercase tracking-widest">
                  DLs sem OB
                </span>
                <span className="text-sm font-black text-para-blue">
                  {liquidados.length}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md border border-slate-200 p-6">
            <p className="text-xs uppercase font-black text-slate-500 tracking-widest mb-3">
              Observacoes
            </p>
            <p className="text-xs text-slate-500 leading-relaxed">
              O status de pagamento pode ser confirmado manualmente na coluna
              Status da tabela de Monitoramento. A alteracao e registrada em tempo real.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
