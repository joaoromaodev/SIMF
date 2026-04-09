import { getSupabaseAdminClient } from "../../../../lib/supabase/server.js";
import CpagCharts from "../../../../components/cpag-charts.jsx";

function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDate(dateString) {
  if (!dateString) return "—";
  const date = new Date(dateString);
  return date.toLocaleDateString("pt-BR");
}

async function fetchCpagData() {
  const supabase = getSupabaseAdminClient();

  try {
    const { data, error } = await supabase
      .from("normalized_dl_ob_rows")
      .select("*")
      .eq("year_scope", "2026")
      .order("data_pagamento", { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error("Erro ao buscar dados CPAG:", error);
    return [];
  }
}

function calculateKPIs(data) {
  const totalPago = data.reduce((sum, row) => sum + (parseFloat(row.valor) || 0), 0);
  const volume = data.length;
  const ticketMedio = volume > 0 ? totalPago / volume : 0;

  return {
    totalPago,
    volume,
    ticketMedio,
  };
}

function processSourceData(data) {
  const grouped = {};

  data.forEach((row) => {
    const source = row.codigo_fonte_recurso || "Não Informado";
    if (!grouped[source]) {
      grouped[source] = 0;
    }
    grouped[source] += parseFloat(row.valor) || 0;
  });

  return Object.entries(grouped).map(([name, value]) => ({
    name,
    value: Math.round(value * 100) / 100,
  }));
}

function processMonthlyData(data) {
  const MONTHS = [
    "Jan",
    "Fev",
    "Mar",
    "Abr",
    "Mai",
    "Jun",
    "Jul",
    "Ago",
    "Set",
    "Out",
    "Nov",
    "Dez",
  ];
  const grouped = {};

  data.forEach((row) => {
    if (!row.data_pagamento) return;

    const date = new Date(row.data_pagamento);
    const monthIndex = date.getMonth();
    const month = MONTHS[monthIndex];

    if (!grouped[month]) {
      grouped[month] = 0;
    }
    grouped[month] += parseFloat(row.valor) || 0;
  });

  return MONTHS.map((month) => ({
    month,
    value: Math.round((grouped[month] || 0) * 100) / 100,
  }));
}

export default async function CpagDashboardPage() {
  const data = await fetchCpagData();
  const kpis = calculateKPIs(data);
  const sourceData = processSourceData(data);
  const monthlyData = processMonthlyData(data);
  const lastOrders = data.slice(0, 10);

  return (
    <div className="space-y-10">
      {/* Page Title */}
      <div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">
          Dashboard CPAG
        </h1>
        <p className="text-slate-500 text-sm font-medium">
          Pagamento e Prestação de Contas — Exercício Fiscal 2026
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Efetivamente Pago */}
        <div className="bg-white rounded-lg shadow-md border-l-4 border-para-blue p-6">
          <p className="text-xs uppercase font-black text-slate-500 tracking-widest mb-2">
            Total Efetivamente Pago
          </p>
          <p className="text-3xl font-black text-para-blue break-words">
            {formatCurrency(kpis.totalPago)}
          </p>
        </div>

        {/* Volume de OBs Emitidas */}
        <div className="bg-white rounded-lg shadow-md border-l-4 border-para-blue p-6">
          <p className="text-xs uppercase font-black text-slate-500 tracking-widest mb-2">
            Volume de OBs Emitidas
          </p>
          <p className="text-3xl font-black text-para-blue">
            {kpis.volume.toLocaleString("pt-BR")}
          </p>
        </div>

        {/* Ticket Médio */}
        <div className="bg-white rounded-lg shadow-md border-l-4 border-para-blue p-6">
          <p className="text-xs uppercase font-black text-slate-500 tracking-widest mb-2">
            Ticket Médio
          </p>
          <p className="text-3xl font-black text-para-blue break-words">
            {formatCurrency(kpis.ticketMedio)}
          </p>
        </div>
      </div>

      {/* Charts */}
      <CpagCharts sourceData={sourceData} monthlyData={monthlyData} />

      {/* Latest Orders Table */}
      <div className="bg-white rounded-lg shadow-md border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-black uppercase tracking-wider text-slate-800">
            Últimas Ordens Bancárias
          </h2>
        </div>

        {lastOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-6 py-3 text-left font-black uppercase text-xs tracking-wider text-slate-700">
                    Ordem Bancária
                  </th>
                  <th className="px-6 py-3 text-left font-black uppercase text-xs tracking-wider text-slate-700">
                    Credor
                  </th>
                  <th className="px-6 py-3 text-left font-black uppercase text-xs tracking-wider text-slate-700">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left font-black uppercase text-xs tracking-wider text-slate-700">
                    Fonte
                  </th>
                  <th className="px-6 py-3 text-right font-black uppercase text-xs tracking-wider text-slate-700">
                    Valor
                  </th>
                </tr>
              </thead>
              <tbody>
                {lastOrders.map((order, index) => (
                  <tr
                    key={order.id}
                    className={`border-b border-slate-100 ${
                      index % 2 === 0 ? "bg-white" : "bg-slate-50"
                    } hover:bg-slate-100 transition-colors`}
                  >
                    <td className="px-6 py-3 text-slate-800 font-medium">
                      {order.ordem_bancaria || "—"}
                    </td>
                    <td className="px-6 py-3 text-slate-700">
                      {order.ob_credor_nome || order.dl_nome_credor || "—"}
                    </td>
                    <td className="px-6 py-3 text-slate-700">
                      {formatDate(order.data_pagamento)}
                    </td>
                    <td className="px-6 py-3 text-slate-700">
                      {order.codigo_fonte_recurso || "—"}
                    </td>
                    <td className="px-6 py-3 text-right font-bold text-para-blue">
                      {formatCurrency(order.valor)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-12 text-center">
            <p className="text-slate-500 text-sm font-medium">
              Nenhuma ordem bancária encontrada para o período.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
