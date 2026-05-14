import Link from "next/link";
import { ChevronRight, Database } from "lucide-react";

const MODULES = [
  {
    abbr: "DFIN",
    label: "Diretoria de Finanças",
    desc: "Gestão orçamentária e financeira",
    href: "/dashboard/dfin",
    status: "Operacional",
    disabled: false,
  },
  {
    abbr: "DPPC",
    label: "Pagamento e Prestação de Contas",
    desc: "Liquidações, pagamentos e ordens bancárias",
    href: "/dashboard/dppc",
    status: "Operacional",
    disabled: false,
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">

      {/* Header */}
      <header className="border-b border-slate-200 bg-white px-10 py-5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <span className="text-white text-xs font-black">S</span>
          </div>
          <div>
            <span className="text-slate-900 font-black tracking-tight text-base">SIMF</span>
            <span className="text-slate-300 mx-2 text-xs">·</span>
            <span className="text-slate-500 text-xs font-medium">Sistema Integrado de Monitoramento Financeiro</span>
          </div>
        </div>
        <Link
          href="/dashboard/import"
          className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-black text-slate-600 uppercase tracking-widest transition-colors shadow-sm"
        >
          <Database size={13} />
          Atualizar Base
        </Link>
      </header>

      {/* Conteúdo central */}
      <div className="flex-1 flex flex-col items-center px-10 py-16">
        <div className="w-full max-w-4xl space-y-10">

          {/* Hero */}
          <div>
            <p className="text-[11px] font-black text-blue-600 uppercase tracking-widest mb-3">
              Governo do Estado do Pará — SEDUC/PA
            </p>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-tight mb-4">
              Secretaria Adjunta de<br />Planejamento e Finanças
            </h1>
            <p className="text-slate-500 text-base font-medium leading-relaxed max-w-xl">
              Painel de monitoramento financeiro integrado ao SIAFE. Acesse os módulos de cada diretoria abaixo.
            </p>
          </div>

          {/* Módulos */}
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
              Módulos disponíveis
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {MODULES.map(({ abbr, label, desc, href, status, disabled }) =>
                disabled ? (
                  <div key={abbr} className="bg-white border border-slate-200 rounded-2xl p-6 opacity-50 cursor-not-allowed shadow-sm">
                    <div className="flex items-start justify-between mb-5">
                      <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full uppercase tracking-widest">
                        {status}
                      </span>
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-1">{abbr}</h2>
                    <p className="text-[11px] font-medium text-slate-500 mb-3">{label}</p>
                    <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
                  </div>
                ) : (
                  <Link
                    key={abbr}
                    href={href}
                    className="group bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-md hover:border-blue-300 transition-all duration-200 shadow-sm"
                  >
                    <div className="flex items-start justify-between mb-5">
                      <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full uppercase tracking-widest">
                        {status}
                      </span>
                      <ChevronRight size={14} className="text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-1">{abbr}</h2>
                    <p className="text-[11px] font-medium text-slate-500 mb-3">{label}</p>
                    <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
                  </Link>
                )
              )}

              {/* Card Gestão de Dados */}
              <Link
                href="/dashboard/import"
                className="group bg-blue-50 border border-blue-200 rounded-2xl p-6 hover:bg-blue-100 hover:border-blue-300 transition-all duration-200 shadow-sm"
              >
                <div className="flex items-start justify-between mb-5">
                  <span className="text-[10px] font-black text-blue-700 bg-blue-100 px-2.5 py-1 rounded-full uppercase tracking-widest">
                    Gestão de Dados
                  </span>
                  <ChevronRight size={14} className="text-blue-400 group-hover:text-blue-700 group-hover:translate-x-0.5 transition-all" />
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <Database size={18} className="text-blue-600" />
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">BASE</h2>
                </div>
                <p className="text-[11px] font-medium text-slate-500 mb-3">Atualização de Dados</p>
                <p className="text-xs text-slate-500 leading-relaxed">Upload de relatórios CSV do SIAFE para atualização da base.</p>
              </Link>
            </div>
          </div>

        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-200 bg-white px-10 py-5">
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
          Secretaria de Estado de Educação · SEDUC/PA · Governo do Pará
        </p>
      </div>

    </div>
  );
}