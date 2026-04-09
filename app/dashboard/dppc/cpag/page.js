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

// Mock Data - Temporário até o back-end implementar os novos campos
const mockCpagData = [
  {
    ordem_bancaria: "2026160101OB00001",
    contrato: "015/2026",
    categoria: "ALUGUEL DE IMÓVEIS",
    credor: "ENOQUE COSTA DO NASCIMENTO",
    data: "2026-01-15",
    valor: 25000.00,
    descricao: "Pagamento referente a medição 03",
    fonte_recurso: "TESOURO ESTADUAL"
  },
  {
    ordem_bancaria: "2026160101OB00002",
    contrato: "022/2026",
    categoria: "DIÁRIAS",
    credor: "ALESSANDRA CARVALHO CAVALCANTE",
    data: "2026-01-20",
    valor: 1200.00,
    descricao: "Diárias de viagem para capacitação",
    fonte_recurso: "FUNDEB"
  },
  {
    ordem_bancaria: "2026160101OB00003",
    contrato: "008/2026",
    categoria: "CONVÊNIOS",
    credor: "PREFEITURA MUNICIPAL DE BUJARU",
    data: "2026-01-25",
    valor: 45000.00,
    descricao: "Repasse mensal conforme convênio",
    fonte_recurso: "TESOURO ESTADUAL"
  },
  {
    ordem_bancaria: "2026160101OB00004",
    contrato: "031/2026",
    categoria: "TERCEIRIZADAS",
    credor: "BELEM RIO SEGURANCA LTDA",
    data: "2026-02-01",
    valor: 18000.00,
    descricao: "Serviços de limpeza mensal",
    fonte_recurso: "TESOURO ESTADUAL"
  },
  {
    ordem_bancaria: "2026160101OB00005",
    contrato: "045/2026",
    categoria: "OBRAS",
    credor: "PREFEITURA MUNICIPAL DE SAO G. DO ARAGUAIA",
    data: "2026-02-10",
    valor: 125000.00,
    descricao: "Pagamento de medição obra escola",
    fonte_recurso: "FUNDEB"
  },
  {
    ordem_bancaria: "2026160101OB00006",
    contrato: "016/2026",
    categoria: "ALUGUEL DE IMÓVEIS",
    credor: "ISANE THEREZINHA ZAHLUTH MONTEIRO",
    data: "2026-02-15",
    valor: 32000.00,
    descricao: "Aluguel prédio administrativo",
    fonte_recurso: "TESOURO ESTADUAL"
  },
  {
    ordem_bancaria: "2026160101OB00007",
    contrato: "023/2026",
    categoria: "DIÁRIAS",
    credor: "CLAUDIVALDO MARQUES DOS SANTOS",
    data: "2026-02-20",
    valor: 800.00,
    descricao: "Diárias participação em evento",
    fonte_recurso: "TESOURO ESTADUAL"
  },
  {
    ordem_bancaria: "2026160101OB00008",
    contrato: "009/2026",
    categoria: "CONVÊNIOS",
    credor: "PREFEITURA MUNICIPAL DE IPIXUNA DO PARA",
    data: "2026-03-01",
    valor: 35000.00,
    descricao: "Repasse para projeto educacional",
    fonte_recurso: "FUNDEB"
  },
  {
    ordem_bancaria: "2026160101OB00009",
    contrato: "032/2026",
    categoria: "TERCEIRIZADAS",
    credor: "KAPA CAPITAL FACILITIES LTDA",
    data: "2026-03-05",
    valor: 22000.00,
    descricao: "Serviços de segurança mensal",
    fonte_recurso: "TESOURO ESTADUAL"
  },
  {
    ordem_bancaria: "2026160101OB00010",
    contrato: "046/2026",
    categoria: "OBRAS",
    credor: "PREFEITURA MUNICIPAL DE TRACUATEUA",
    data: "2026-03-15",
    valor: 98000.00,
    descricao: "Pagamento medição reforma",
    fonte_recurso: "TESOURO ESTADUAL"
  },
  {
    ordem_bancaria: "2026160101OB00011",
    contrato: "017/2026",
    categoria: "ALUGUEL DE IMÓVEIS",
    credor: "MARIA DO SOCORRO SOUSA DA SILVA",
    data: "2026-03-20",
    valor: 28000.00,
    descricao: "Aluguel salas de aula",
    fonte_recurso: "FUNDEB"
  },
  {
    ordem_bancaria: "2026160101OB00012",
    contrato: "024/2026",
    categoria: "DIÁRIAS",
    credor: "ESMERINO JOSE DE MATOS BARREIRA",
    data: "2026-03-25",
    valor: 1500.00,
    descricao: "Diárias missão técnica",
    fonte_recurso: "TESOURO ESTADUAL"
  },
  {
    ordem_bancaria: "2026160101OB00013",
    contrato: "010/2026",
    categoria: "CONVÊNIOS",
    credor: "PREFEITURA MUNICIPAL DE JACAREACANGA",
    data: "2026-04-01",
    valor: 25000.00,
    descricao: "Repasse mensal convênio",
    fonte_recurso: "FUNDEB"
  },
  {
    ordem_bancaria: "2026160101OB00014",
    contrato: "033/2026",
    categoria: "TERCEIRIZADAS",
    credor: "E B CARDOSO LTDA",
    data: "2026-04-05",
    valor: 15000.00,
    descricao: "Manutenção equipamentos",
    fonte_recurso: "TESOURO ESTADUAL"
  },
  {
    ordem_bancaria: "2026160101OB00015",
    contrato: "047/2026",
    categoria: "OBRAS",
    credor: "PREFEITURA MUNICIPAL DE MOJU",
    data: "2026-04-10",
    valor: 145000.00,
    descricao: "Pagamento medição construção",
    fonte_recurso: "TESOURO ESTADUAL"
  }
];

// async function fetchCpagData() {
//   const supabase = getSupabaseAdminClient();

//   try {
//     const { data, error } = await supabase
//       .from("normalized_dl_ob_rows")
//       .select("*")
//       .eq("year_scope", "2026")
//       .order("data_pagamento", { ascending: false });

//     if (error) throw error;

//     return data || [];
//   } catch (error) {
//     console.error("Erro ao buscar dados CPAG:", error);
//     return [];
//   }
// }

function calculateKPIs(data) {
  const totalPago = data.reduce((sum, row) => sum + (parseFloat(row.valor) || 0), 0);
  const volume = data.length;
  const totalLiquidacoesPagar = 5430000.00; // Hardcoded - virá de outra tabela no futuro

  return {
    totalPago,
    volume,
    totalLiquidacoesPagar,
  };
}

function processSourceData(data) {
  const grouped = {};

  data.forEach((row) => {
    const source = row.fonte_recurso || "Não Informado";
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

function processCategoryData(data) {
  const grouped = {};

  data.forEach((row) => {
    const category = row.categoria || "Não Informado";
    if (!grouped[category]) {
      grouped[category] = 0;
    }
    grouped[category] += parseFloat(row.valor) || 0;
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
    if (!row.data) return;

    const date = new Date(row.data);
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
  // const data = await fetchCpagData();
  const data = mockCpagData; // Usando mock data temporário
  const kpis = calculateKPIs(data);
  const sourceData = processSourceData(data);
  const categoryData = processCategoryData(data);
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
          <p className="text-3xl font-black text-para-blue wrap-break-word">
            {formatCurrency(kpis.totalPago)}
          </p>
        </div>

        {/* Quantidade de Ordem Bancárias */}
        <div className="bg-white rounded-lg shadow-md border-l-4 border-para-blue p-6">
          <p className="text-xs uppercase font-black text-slate-500 tracking-widest mb-2">
            Quantidade de Ordem Bancárias
          </p>
          <p className="text-3xl font-black text-para-blue">
            {kpis.volume.toLocaleString("pt-BR")}
          </p>
        </div>

        {/* Total de Liquidações a Pagar */}
        <div className="bg-white rounded-lg shadow-md border-l-4 border-para-blue p-6">
          <p className="text-xs uppercase font-black text-slate-500 tracking-widest mb-2">
            Total de Liquidações a Pagar
          </p>
          <p className="text-3xl font-black text-para-blue wrap-break-word">
            {formatCurrency(kpis.totalLiquidacoesPagar)}
          </p>
        </div>
      </div>

      {/* Charts */}
      <CpagCharts sourceData={sourceData} categoryData={categoryData} />

      {/* Latest Orders Table */}
      <div className="bg-white rounded-lg shadow-md border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-black uppercase tracking-wider text-slate-800">
            Visão Geral de Ordens Bancárias
          </h2>
        </div>

        {lastOrders.length > 0 ? (
          <div className="max-h-100 overflow-y-auto relative">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-slate-50 z-10">
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-6 py-3 text-left font-black uppercase text-xs tracking-wider text-slate-700">
                    Ordem Bancária
                  </th>
                  <th className="px-6 py-3 text-left font-black uppercase text-xs tracking-wider text-slate-700">
                    Contrato
                  </th>
                  <th className="px-6 py-3 text-left font-black uppercase text-xs tracking-wider text-slate-700">
                    Categoria
                  </th>
                  <th className="px-6 py-3 text-left font-black uppercase text-xs tracking-wider text-slate-700">
                    Credor
                  </th>
                  <th className="px-6 py-3 text-left font-black uppercase text-xs tracking-wider text-slate-700">
                    Data
                  </th>
                  <th className="px-6 py-3 text-right font-black uppercase text-xs tracking-wider text-slate-700">
                    Valor
                  </th>
                  <th className="px-6 py-3 text-left font-black uppercase text-xs tracking-wider text-slate-700">
                    Descrição
                  </th>
                </tr>
              </thead>
              <tbody>
                {lastOrders.map((order, index) => (
                  <tr
                    key={order.ordem_bancaria}
                    className={`border-b border-slate-100 ${
                      index % 2 === 0 ? "bg-white" : "bg-slate-50"
                    } hover:bg-slate-100 transition-colors`}
                  >
                    <td className="px-6 py-3 text-slate-800 font-medium">
                      {order.ordem_bancaria || "—"}
                    </td>
                    <td className="px-6 py-3 text-slate-700">
                      {order.contrato || "—"}
                    </td>
                    <td className="px-6 py-3 text-slate-700">
                      {order.categoria || "—"}
                    </td>
                    <td className="px-6 py-3 text-slate-700">
                      {order.credor || "—"}
                    </td>
                    <td className="px-6 py-3 text-slate-700">
                      {formatDate(order.data)}
                    </td>
                    <td className="px-6 py-3 text-right font-bold text-para-blue">
                      {formatCurrency(order.valor)}
                    </td>
                    <td className="px-6 py-3 text-slate-700">
                      {order.descricao || "—"}
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
