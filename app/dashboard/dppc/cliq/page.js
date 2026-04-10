import { getSupabaseAdminClient } from "../../../../lib/supabase/server.js";
import CliqCharts from "../../../../components/cliq-charts.jsx";
import Link from "next/link";

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
const mockCliqData = [
  {
    processo: "001/2026",
    documento_liquidacao: "2026160101DL000001",
    categoria: "ALUGUEL DE IMÓVEIS",
    fonte: "TESOURO ESTADUAL",
    credor: "ENOQUE COSTA DO NASCIMENTO",
    data: "2026-01-15",
    valor_liquido: 22500.00,
    valor_imposto: 2500.00,
    valor_bruto: 25000.00,
    descricao: "Liquidação referente a medição 03"
  },
  {
    processo: "002/2026",
    documento_liquidacao: "2026160101DL000002",
    categoria: "DIÁRIAS",
    fonte: "FUNDEB",
    credor: "ALESSANDRA CARVALHO CAVALCANTE",
    data: "2026-01-20",
    valor_liquido: 1080.00,
    valor_imposto: 120.00,
    valor_bruto: 1200.00,
    descricao: "Diárias de viagem para capacitação"
  },
  {
    processo: "003/2026",
    documento_liquidacao: "2026160101DL000003",
    categoria: "CONVÊNIOS",
    fonte: "TESOURO ESTADUAL",
    credor: "PREFEITURA MUNICIPAL DE BUJARU",
    data: "2026-01-25",
    valor_liquido: 40500.00,
    valor_imposto: 4500.00,
    valor_bruto: 45000.00,
    descricao: "Repasse mensal conforme convênio"
  },
  {
    processo: "004/2026",
    documento_liquidacao: "2026160101DL000004",
    categoria: "TERCEIRIZADAS",
    fonte: "TESOURO ESTADUAL",
    credor: "BELEM RIO SEGURANCA LTDA",
    data: "2026-02-01",
    valor_liquido: 16200.00,
    valor_imposto: 1800.00,
    valor_bruto: 18000.00,
    descricao: "Serviços de limpeza mensal"
  },
  {
    processo: "005/2026",
    documento_liquidacao: "2026160101DL000005",
    categoria: "OBRAS",
    fonte: "FUNDEB",
    credor: "PREFEITURA MUNICIPAL DE SAO G. DO ARAGUAIA",
    data: "2026-02-10",
    valor_liquido: 112500.00,
    valor_imposto: 12500.00,
    valor_bruto: 125000.00,
    descricao: "Pagamento de medição obra escola"
  },
  {
    processo: "006/2026",
    documento_liquidacao: "2026160101DL000006",
    categoria: "ALUGUEL DE IMÓVEIS",
    fonte: "TESOURO ESTADUAL",
    credor: "ISANE THEREZINHA ZAHLUTH MONTEIRO",
    data: "2026-02-15",
    valor_liquido: 28800.00,
    valor_imposto: 3200.00,
    valor_bruto: 32000.00,
    descricao: "Aluguel prédio administrativo"
  },
  {
    processo: "007/2026",
    documento_liquidacao: "2026160101DL000007",
    categoria: "DIÁRIAS",
    fonte: "TESOURO ESTADUAL",
    credor: "CLAUDIVALDO MARQUES DOS SANTOS",
    data: "2026-02-20",
    valor_liquido: 720.00,
    valor_imposto: 80.00,
    valor_bruto: 800.00,
    descricao: "Diárias participação em evento"
  },
  {
    processo: "008/2026",
    documento_liquidacao: "2026160101DL000008",
    categoria: "CONVÊNIOS",
    fonte: "FUNDEB",
    credor: "PREFEITURA MUNICIPAL DE IPIXUNA DO PARA",
    data: "2026-03-01",
    valor_liquido: 31500.00,
    valor_imposto: 3500.00,
    valor_bruto: 35000.00,
    descricao: "Repasse para projeto educacional"
  },
  {
    processo: "009/2026",
    documento_liquidacao: "2026160101DL000009",
    categoria: "TERCEIRIZADAS",
    fonte: "TESOURO ESTADUAL",
    credor: "KAPA CAPITAL FACILITIES LTDA",
    data: "2026-03-05",
    valor_liquido: 19800.00,
    valor_imposto: 2200.00,
    valor_bruto: 22000.00,
    descricao: "Serviços de segurança mensal"
  },
  {
    processo: "010/2026",
    documento_liquidacao: "2026160101DL000010",
    categoria: "OBRAS",
    fonte: "TESOURO ESTADUAL",
    credor: "PREFEITURA MUNICIPAL DE TRACUATEUA",
    data: "2026-03-15",
    valor_liquido: 78400.00,
    valor_imposto: 8800.00,
    valor_bruto: 98000.00,
    descricao: "Pagamento medição reforma"
  },
  {
    processo: "011/2026",
    documento_liquidacao: "2026160101DL000011",
    categoria: "ALUGUEL DE IMÓVEIS",
    fonte: "FUNDEB",
    credor: "MARIA DO SOCORRO SOUSA DA SILVA",
    data: "2026-03-20",
    valor_liquido: 25200.00,
    valor_imposto: 2800.00,
    valor_bruto: 28000.00,
    descricao: "Aluguel salas de aula"
  },
  {
    processo: "012/2026",
    documento_liquidacao: "2026160101DL000012",
    categoria: "DIÁRIAS",
    fonte: "TESOURO ESTADUAL",
    credor: "ESMERINO JOSE DE MATOS BARREIRA",
    data: "2026-03-25",
    valor_liquido: 1350.00,
    valor_imposto: 150.00,
    valor_bruto: 1500.00,
    descricao: "Diárias missão técnica"
  },
  {
    processo: "013/2026",
    documento_liquidacao: "2026160101DL000013",
    categoria: "CONVÊNIOS",
    fonte: "FUNDEB",
    credor: "PREFEITURA MUNICIPAL DE JACAREACANGA",
    data: "2026-04-01",
    valor_liquido: 22500.00,
    valor_imposto: 2500.00,
    valor_bruto: 25000.00,
    descricao: "Repasse mensal convênio"
  },
  {
    processo: "014/2026",
    documento_liquidacao: "2026160101DL000014",
    categoria: "TERCEIRIZADAS",
    fonte: "TESOURO ESTADUAL",
    credor: "E B CARDOSO LTDA",
    data: "2026-04-05",
    valor_liquido: 13500.00,
    valor_imposto: 1500.00,
    valor_bruto: 15000.00,
    descricao: "Manutenção equipamentos"
  },
  {
    processo: "015/2026",
    documento_liquidacao: "2026160101DL000015",
    categoria: "OBRAS",
    fonte: "TESOURO ESTADUAL",
    credor: "PREFEITURA MUNICIPAL DE MOJU",
    data: "2026-04-10",
    valor_liquido: 130500.00,
    valor_imposto: 14500.00,
    valor_bruto: 145000.00,
    descricao: "Pagamento medição construção"
  }
];

// async function fetchCliqData() {
//   const supabase = getSupabaseAdminClient();

//   try {
//     const { data, error } = await supabase
//       .from("normalized_ne_dl_rows")
//       .select("*")
//       .eq("year_scope", "2026")
//       .order("data", { ascending: false });

//     if (error) throw error;

//     return data || [];
//   } catch (error) {
//     console.error("Erro ao buscar dados CLIQ:", error);
//     return [];
//   }
// }

function calculateKPIs(data) {
  const totalEmLiquidacao = data.reduce((sum, row) => sum + (parseFloat(row.valor_bruto) || 0), 0);
  const quantidadeEmLiquidacao = data.length;
  const quantidadeLiquidadosAPagar = Math.floor(data.length * 0.7); // Mock: 70% liquidados a pagar

  return {
    totalEmLiquidacao,
    quantidadeEmLiquidacao,
    quantidadeLiquidadosAPagar,
  };
}

function processStatusData(data) {
  const emLiquidacao = data.length;
  const liquidadosAPagar = Math.floor(data.length * 0.7);

  return [
    { name: "Em Liquidação", value: emLiquidacao },
    { name: "Liquidados a Pagar", value: liquidadosAPagar }
  ];
}

function processSourceData(data) {
  const grouped = {};

  data.forEach((row) => {
    const source = row.fonte || "Não Informado";
    if (!grouped[source]) {
      grouped[source] = 0;
    }
    grouped[source] += parseFloat(row.valor_bruto) || 0;
  });

  return Object.entries(grouped).map(([name, value]) => ({
    name,
    value: Math.round(value * 100) / 100,
  }));
}

export default async function CliqDashboardPage() {
  // const data = await fetchCliqData();
  const data = mockCliqData; // Usando mock data temporário
  const kpis = calculateKPIs(data);
  const statusData = processStatusData(data);
  const sourceData = processSourceData(data);
  const lastLiquidations = data.slice(0, 10);

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

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total de Empenhos em Liquidação */}
        <div className="bg-white rounded-lg shadow-md border-l-4 border-para-blue p-6">
          <p className="text-xs uppercase font-black text-slate-500 tracking-widest mb-2">
            Total (R$) de Empenhos em Liquidação
          </p>
          <p className="text-3xl font-black text-para-blue break-words">
            {formatCurrency(kpis.totalEmLiquidacao)}
          </p>
        </div>

        {/* Empenhos em Liquidação */}
        <div className="bg-white rounded-lg shadow-md border-l-4 border-para-blue p-6">
          <p className="text-xs uppercase font-black text-slate-500 tracking-widest mb-2">
            Empenhos em Liquidação
          </p>
          <p className="text-3xl font-black text-para-blue">
            {kpis.quantidadeEmLiquidacao.toLocaleString("pt-BR")}
          </p>
        </div>

        {/* Empenhos Liquidados a Pagar */}
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

      {/* Latest Liquidations Table */}
      <div className="bg-white rounded-lg shadow-md border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-black uppercase tracking-wider text-slate-800">
            Visão Geral de Liquidações
          </h2>
        </div>

        {lastLiquidations.length > 0 ? (
          <div className="max-h-96 overflow-y-auto relative">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-slate-50 z-10">
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-6 py-3 text-left font-black uppercase text-xs tracking-wider text-slate-700">
                    Processo
                  </th>
                  <th className="px-6 py-3 text-left font-black uppercase text-xs tracking-wider text-slate-700">
                    Documento de Liquidação
                  </th>
                  <th className="px-6 py-3 text-left font-black uppercase text-xs tracking-wider text-slate-700">
                    Categoria
                  </th>
                  <th className="px-6 py-3 text-left font-black uppercase text-xs tracking-wider text-slate-700">
                    Fonte
                  </th>
                  <th className="px-6 py-3 text-left font-black uppercase text-xs tracking-wider text-slate-700">
                    Credor
                  </th>
                  <th className="px-6 py-3 text-left font-black uppercase text-xs tracking-wider text-slate-700">
                    Data
                  </th>
                  <th className="px-6 py-3 text-right font-black uppercase text-xs tracking-wider text-slate-700">
                    Valor Líquido
                  </th>
                  <th className="px-6 py-3 text-right font-black uppercase text-xs tracking-wider text-slate-700">
                    Valor Imposto
                  </th>
                  <th className="px-6 py-3 text-right font-black uppercase text-xs tracking-wider text-slate-700">
                    Valor Bruto
                  </th>
                  <th className="px-6 py-3 text-left font-black uppercase text-xs tracking-wider text-slate-700">
                    Descrição
                  </th>
                </tr>
              </thead>
              <tbody>
                {lastLiquidations.map((liquidation, index) => (
                  <tr
                    key={liquidation.documento_liquidacao}
                    className={`border-b border-slate-100 ${
                      index % 2 === 0 ? "bg-white" : "bg-slate-50"
                    } hover:bg-slate-100 transition-colors`}
                  >
                    <td className="px-6 py-3 text-slate-800 font-medium">
                      {liquidation.processo || "—"}
                    </td>
                    <td className="px-6 py-3 text-slate-700">
                      {liquidation.documento_liquidacao || "—"}
                    </td>
                    <td className="px-6 py-3 text-slate-700">
                      {liquidation.categoria || "—"}
                    </td>
                    <td className="px-6 py-3 text-slate-700">
                      {liquidation.fonte || "—"}
                    </td>
                    <td className="px-6 py-3 text-slate-700">
                      {liquidation.credor || "—"}
                    </td>
                    <td className="px-6 py-3 text-slate-700">
                      {formatDate(liquidation.data)}
                    </td>
                    <td className="px-6 py-3 text-right font-bold text-para-blue">
                      {formatCurrency(liquidation.valor_liquido)}
                    </td>
                    <td className="px-6 py-3 text-right font-bold text-para-blue">
                      {formatCurrency(liquidation.valor_imposto)}
                    </td>
                    <td className="px-6 py-3 text-right font-bold text-para-blue">
                      {formatCurrency(liquidation.valor_bruto)}
                    </td>
                    <td className="px-6 py-3 text-slate-700">
                      {liquidation.descricao || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-12 text-center">
            <p className="text-slate-500 text-sm font-medium">
              Nenhuma liquidação encontrada para o período.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}