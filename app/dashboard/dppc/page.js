import Link from "next/link";

export default function DPPCHubPage() {
  return (
    <div className="space-y-10">
      {/* Link de Retorno */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-para-blue transition-colors"
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
          Voltar ao Portal Principal
        </Link>
      </div>

      {/* Page Header */}
      <div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">
          Diretoria de Pagamento e Prestação de Contas
        </h1>
        <p className="text-slate-500 text-sm font-medium">
          Gestão centralizada de liquidações (CLIQ) e pagamentos (CPAG)
        </p>
      </div>

      {/* Navigation Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Card 1: CLIQ */}
        <Link
          href="/dashboard/dppc/cliq"
          className="group bg-white rounded-lg shadow-md border border-slate-200 p-8 hover:shadow-lg transition-all duration-300 cursor-pointer"
        >
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-slate-50 rounded-lg group-hover:bg-slate-100 transition-colors">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#0071ce"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <path d="M9 15l2 2 4-4" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">CLIQ</h2>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-widest mt-1">
                  Coordenadoria de Liquidação
                </p>
              </div>
            </div>
          </div>

          {/* Badge */}
          <div className="inline-block mb-4">
            <span className="px-3 py-1 bg-slate-200 text-slate-700 text-xs font-black uppercase tracking-widest rounded-full">
              Módulo em Desenvolvimento
            </span>
          </div>

          <p className="text-slate-600 text-sm leading-relaxed">
            Gestão de documentos de liquidação. Análise e aprovação de liquidações de empenhos com integração aos dados do SIAFE.
          </p>

          <div className="mt-6 flex items-center gap-2 text-para-blue font-black uppercase text-xs tracking-widest group-hover:translate-x-1 transition-transform">
            Acessar
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
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>
        </Link>

        {/* Card 2: CPAG */}
        <Link
          href="/dashboard/dppc/cpag"
          className="group bg-white rounded-lg shadow-md border border-slate-200 p-8 hover:shadow-lg transition-all duration-300 cursor-pointer"
        >
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-slate-50 rounded-lg group-hover:bg-slate-100 transition-colors">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#0071ce"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">CPAG</h2>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-widest mt-1">
                  Coordenadoria de Pagamentos
                </p>
              </div>
            </div>
          </div>

          {/* Badge */}
          <div className="inline-block mb-4">
            <span className="px-3 py-1 bg-blue-100 text-para-blue text-xs font-black uppercase tracking-widest rounded-full">
              Módulo Operacional
            </span>
          </div>

          <p className="text-slate-600 text-sm leading-relaxed">
            Dashboard completo com KPIs de pagamento, evolução mensal, distribuição por fonte de recurso e histórico de ordens bancárias.
          </p>

          <div className="mt-6 flex items-center gap-2 text-para-blue font-black uppercase text-xs tracking-widest group-hover:translate-x-1 transition-transform">
            Acessar
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
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>
        </Link>
      </div>

      {/* Footer Note */}
      <div className="border-t border-slate-200 pt-8 mt-8">
        <p className="text-slate-500 text-xs font-medium">
          Todas as operações são realizadas com dados em tempo real do banco de dados centralizado. Para suporte, contacte o desenvolvedor.
        </p>
      </div>
    </div>
  );
}
