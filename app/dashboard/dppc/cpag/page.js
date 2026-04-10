import Link from "next/link";

function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("pt-BR");
}

const mockLiquidados = [
  {
    processo: "001/2026",
    empenho: "20260001",
    credor: "PREFEITURA MUNICIPAL DE BELÉM",
    natureza_despesa: "ALUGUEL DE IMÓVEIS",
    fonte: "TESOURO ESTADUAL",
    dl: "2026160101DL000001",
    data: "2026-01-15",
    valor_liquido: 22500.00,
    valor_bruto: 25000.00,
    valor_imposto: 2500.00
  },
  {
    processo: "002/2026",
    empenho: "20260002",
    credor: "COMPANHIA DE SANEAMENTO DO PARÁ",
    natureza_despesa: "SERVIÇOS TERCEIRIZADOS",
    fonte: "FUNDEB",
    dl: "2026160101DL000002",
    data: "2026-02-10",
    valor_liquido: 162000.00,
    valor_bruto: 180000.00,
    valor_imposto: 18000.00
  },
  {
    processo: "003/2026",
    empenho: "20260003",
    credor: "PREFEITURA MUNICIPAL DE ANANINDEUA",
    natureza_despesa: "CONVÊNIOS",
    fonte: "TESOURO ESTADUAL",
    dl: "2026160101DL000003",
    data: "2026-03-05",
    valor_liquido: 405000.00,
    valor_bruto: 450000.00,
    valor_imposto: 45000.00
  },
  {
    processo: "004/2026",
    empenho: "20260004",
    credor: "BELEM RIO SEGURANCA LTDA",
    natureza_despesa: "SERVIÇOS TERCEIRIZADOS",
    fonte: "TESOURO ESTADUAL",
    dl: "2026160101DL000004",
    data: "2026-04-01",
    valor_liquido: 144000.00,
    valor_bruto: 160000.00,
    valor_imposto: 16000.00
  },
  {
    processo: "005/2026",
    empenho: "20260005",
    credor: "PREFEITURA MUNICIPAL DE MARITUBA",
    natureza_despesa: "OBRAS",
    fonte: "FUNDEB",
    dl: "2026160101DL000005",
    data: "2026-04-10",
    valor_liquido: 1125000.00,
    valor_bruto: 1250000.00,
    valor_imposto: 125000.00
  }
];

const mockMonitoramento = [
  {
    processo: "001/2026",
    contrato: "015/2026",
    credor: "PREFEITURA MUNICIPAL DE BELÉM",
    objeto: "Locação de Imóveis",
    mes_referencia: "Janeiro",
    dl: "2026160101DL000001",
    ob: "2026160101OB000001",
    data: "2026-01-15",
    valor: 25000.00
  },
  {
    processo: "002/2026",
    contrato: "022/2026",
    credor: "COMPANHIA DE SANEAMENTO DO PARÁ",
    objeto: "Terceirizadas",
    mes_referencia: "Fevereiro",
    dl: "2026160101DL000002",
    ob: "2026160101OB000002",
    data: "2026-02-10",
    valor: 180000.00
  },
  {
    processo: "003/2026",
    contrato: "008/2026",
    credor: "PREFEITURA MUNICIPAL DE ANANINDEUA",
    objeto: "Convênios",
    mes_referencia: "Março",
    dl: "2026160101DL000003",
    ob: "2026160101OB000003",
    data: "2026-03-05",
    valor: 450000.00
  },
  {
    processo: "004/2026",
    contrato: "031/2026",
    credor: "BELEM RIO SEGURANCA LTDA",
    objeto: "Terceirizadas",
    mes_referencia: "Abril",
    dl: "2026160101DL000004",
    ob: "2026160101OB000004",
    data: "2026-04-01",
    valor: 160000.00
  },
  {
    processo: "005/2026",
    contrato: "045/2026",
    credor: "PREFEITURA MUNICIPAL DE MARITUBA",
    objeto: "Obras",
    mes_referencia: "Abril",
    dl: "2026160101DL000005",
    ob: "2026160101OB000005",
    data: "2026-04-10",
    valor: 1250000.00
  }
];

export default function CpagDashboardPage() {
  return (
    <div className="space-y-10">
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

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-8">
          <div className="max-w-2xl">
            <p className="text-xs uppercase font-black text-slate-500 tracking-widest mb-3">
              Controle de Recursos
            </p>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-3">
              Dashboard CPAG
            </h1>
            <p className="text-slate-600 text-sm leading-relaxed">
              Tela base para monitoramento de pagamentos, liquidações e geração de relatórios.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full xl:w-auto">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs uppercase font-black text-slate-500 tracking-widest mb-2">
                Status de Recursos
              </p>
              <p className="text-xl font-black text-slate-900">Em construção</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs uppercase font-black text-slate-500 tracking-widest mb-2">
                Próxima fase
              </p>
              <p className="text-xl font-black text-slate-900">Filtros e exportação</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-8">
        <div className="space-y-8">
          <div className="bg-white rounded-lg shadow-md border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-4">
              <h2 className="text-lg font-black uppercase tracking-wider text-slate-800">
                Liquidados a Pagar
              </h2>
            </div>
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
                      Natureza de Despesa
                    </th>
                    <th className="px-6 py-3 text-left font-black uppercase text-xs tracking-wider text-slate-700">
                      Fonte
                    </th>
                    <th className="px-6 py-3 text-left font-black uppercase text-xs tracking-wider text-slate-700">
                      DL
                    </th>
                    <th className="px-6 py-3 text-left font-black uppercase text-xs tracking-wider text-slate-700">
                      Data
                    </th>
                    <th className="px-6 py-3 text-right font-black uppercase text-xs tracking-wider text-slate-700">
                      Valor Líquido
                    </th>
                    <th className="px-6 py-3 text-right font-black uppercase text-xs tracking-wider text-slate-700">
                      Valor Bruto
                    </th>
                    <th className="px-6 py-3 text-right font-black uppercase text-xs tracking-wider text-slate-700">
                      Valor Imposto
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {mockLiquidados.map((item, index) => (
                    <tr key={item.processo} className={`border-b border-slate-100 ${index % 2 === 0 ? "bg-white" : "bg-slate-50"} hover:bg-slate-100 transition-colors`}>
                      <td className="px-6 py-4 text-slate-800 font-medium">{item.processo}</td>
                      <td className="px-6 py-4 text-slate-700">{item.empenho}</td>
                      <td className="px-6 py-4 text-slate-700">{item.credor}</td>
                      <td className="px-6 py-4 text-slate-700">{item.natureza_despesa}</td>
                      <td className="px-6 py-4 text-slate-700">{item.fonte}</td>
                      <td className="px-6 py-4 text-slate-700">{item.dl}</td>
                      <td className="px-6 py-4 text-slate-700">{formatDate(item.data)}</td>
                      <td className="px-6 py-4 text-right font-bold text-para-blue">{formatCurrency(item.valor_liquido)}</td>
                      <td className="px-6 py-4 text-right font-bold text-para-blue">{formatCurrency(item.valor_bruto)}</td>
                      <td className="px-6 py-4 text-right font-bold text-para-blue">{formatCurrency(item.valor_imposto)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-4">
              <h2 className="text-lg font-black uppercase tracking-wider text-slate-800">
                Monitoramento de Pagamentos
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr className="border-b border-slate-200">
                    <th className="px-6 py-3 text-left font-black uppercase text-xs tracking-wider text-slate-700">
                      Processo
                    </th>
                    <th className="px-6 py-3 text-left font-black uppercase text-xs tracking-wider text-slate-700">
                      Contrato
                    </th>
                    <th className="px-6 py-3 text-left font-black uppercase text-xs tracking-wider text-slate-700">
                      Credor
                    </th>
                    <th className="px-6 py-3 text-left font-black uppercase text-xs tracking-wider text-slate-700">
                      Objeto
                    </th>
                    <th className="px-6 py-3 text-left font-black uppercase text-xs tracking-wider text-slate-700">
                      Mês de Referência
                    </th>
                    <th className="px-6 py-3 text-left font-black uppercase text-xs tracking-wider text-slate-700">
                      DL
                    </th>
                    <th className="px-6 py-3 text-left font-black uppercase text-xs tracking-wider text-slate-700">
                      OB
                    </th>
                    <th className="px-6 py-3 text-left font-black uppercase text-xs tracking-wider text-slate-700">
                      Data
                    </th>
                    <th className="px-6 py-3 text-right font-black uppercase text-xs tracking-wider text-slate-700">
                      Valor
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {mockMonitoramento.map((item, index) => (
                    <tr key={item.processo} className={`border-b border-slate-100 ${index % 2 === 0 ? "bg-white" : "bg-slate-50"} hover:bg-slate-100 transition-colors`}>
                      <td className="px-6 py-4 text-slate-800 font-medium">{item.processo}</td>
                      <td className="px-6 py-4 text-slate-700">{item.contrato}</td>
                      <td className="px-6 py-4 text-slate-700">{item.credor}</td>
                      <td className="px-6 py-4 text-slate-700">{item.objeto}</td>
                      <td className="px-6 py-4 text-slate-700">{item.mes_referencia}</td>
                      <td className="px-6 py-4 text-slate-700">{item.dl}</td>
                      <td className="px-6 py-4 text-slate-700">{item.ob}</td>
                      <td className="px-6 py-4 text-slate-700">{formatDate(item.data)}</td>
                      <td className="px-6 py-4 text-right font-bold text-para-blue">{formatCurrency(item.valor)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="bg-white rounded-lg shadow-md border border-slate-200 p-6">
            <p className="text-xs uppercase font-black text-slate-500 tracking-widest mb-4">
              Relatórios
            </p>
            <div className="space-y-4">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-black text-slate-900 mb-1">Geração de Relatórios</p>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Área reservada para exportação de arquivos XLSX e PDF na próxima etapa.
                </p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-black text-slate-900 mb-1">Painel de Indicadores</p>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Espaço para mostrar métricas de pago vs a pagar e status de liquidação.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md border border-slate-200 p-6">
            <p className="text-xs uppercase font-black text-slate-500 tracking-widest mb-4">
              Observações
            </p>
            <p className="text-sm text-slate-600 leading-relaxed">
              Esta versão apresenta apenas o esqueleto visual. Os dados e filtros serão adicionados na próxima etapa.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
