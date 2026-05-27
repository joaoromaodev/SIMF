import Link from "next/link";
import {
  FileCheck2,
  CreditCard,
  TrendingUp,
  Calculator,
  ChevronRight,
  LayoutDashboard,
} from "lucide-react";

export default function DashboardHubPage() {
  const SECTIONS = [
    {
      abbr:  "DFIN",
      label: "Diretoria de Finanças",
      href:  "/dashboard/dfin",
      desc:  "Execução orçamentária e controle de contas bancárias.",
      modules: [
        { icon: TrendingUp, label: "CEO",   desc: "Coord. de Execução Orçamentária" },
        { icon: Calculator, label: "ACONT", desc: "Controle de Contas Bancárias"    },
      ],
    },
    {
      abbr:  "DPPC",
      label: "Diretoria de Pagamento e Prestação de Contas",
      href:  "/dashboard/dppc",
      desc:  "Liquidações, pagamentos e prestação de contas.",
      modules: [
        { icon: FileCheck2, label: "CLIQ", desc: "Coord. de Liquidação"  },
        { icon: CreditCard, label: "CPAG", desc: "Coord. de Pagamentos"  },
      ],
    },
  ];

  return (
    <div className="space-y-10">

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-11 h-11 rounded-xl bg-para-blue flex items-center justify-center flex-shrink-0">
          <LayoutDashboard size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Portal Principal</h1>
          <p className="text-slate-500 text-sm font-medium mt-0.5">
            Secretaria Adjunta de Planejamento e Finanças — SAPF
          </p>
        </div>
      </div>

      {/* Cards de diretoria */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {SECTIONS.map((section) => (
          <Link
            key={section.abbr}
            href={section.href}
            className="group bg-white rounded-panel border border-slate-200 p-8 transition-all duration-200 hover:-translate-y-0.5 hover:border-para-blue/30"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            {/* Cabeçalho do card */}
            <div className="flex items-start justify-between mb-6 gap-4">
              <div className="min-w-0">
                <span className="inline-block text-[10px] font-black text-para-blue bg-para-blue-light px-2.5 py-1 rounded-full uppercase tracking-widest">
                  {section.abbr}
                </span>
                <h2 className="text-xl font-black text-slate-900 tracking-tight mt-3 mb-1">
                  {section.label}
                </h2>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">{section.desc}</p>
              </div>
              <ChevronRight
                size={20}
                className="text-slate-300 group-hover:text-para-blue group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-1"
              />
            </div>

            {/* Mini-módulos */}
            <div className="grid grid-cols-2 gap-3">
              {section.modules.map(({ icon: Icon, label, desc }) => (
                <div
                  key={label}
                  className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-card px-4 py-3 transition-colors group-hover:bg-para-blue-light group-hover:border-para-blue/15"
                >
                  <div className="w-9 h-9 rounded-lg bg-para-blue-light flex items-center justify-center flex-shrink-0 group-hover:bg-white transition-colors">
                    <Icon size={16} className="text-para-blue" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-black text-slate-900">{label}</p>
                    <p className="text-[10px] text-slate-500 font-medium truncate">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Link>
        ))}
      </div>

    </div>
  );
}
