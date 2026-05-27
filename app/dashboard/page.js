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
        { icon: Calculator,  label: "ACONT", desc: "Controle de Contas Bancárias"   },
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
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0 shadow-sm">
          <LayoutDashboard size={18} className="text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Portal Principal</h1>
          <p className="text-slate-400 text-sm font-medium mt-0.5">
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
            className="group bg-white rounded-2xl border border-slate-200 shadow-sm p-8 hover:shadow-md hover:border-blue-200 transition-all duration-200"
          >
            {/* Cabeçalho do card */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <span className="text-[11px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-widest">
                  {section.abbr}
                </span>
                <h2 className="text-xl font-black text-slate-900 tracking-tight mt-3 mb-1">
                  {section.label}
                </h2>
                <p className="text-sm text-slate-400 font-medium">{section.desc}</p>
              </div>
              <ChevronRight
                size={20}
                className="text-slate-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-1"
              />
            </div>

            {/* Mini-módulos */}
            <div className="grid grid-cols-2 gap-3">
              {section.modules.map(({ icon: Icon, label, desc }) => (
                <div
                  key={label}
                  className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-3 group-hover:bg-blue-50/60 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center flex-shrink-0">
                    <Icon size={15} className="text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-black text-slate-800">{label}</p>
                    <p className="text-[10px] text-slate-400 font-medium truncate">{desc}</p>
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
