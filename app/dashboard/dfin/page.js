import Link from "next/link";
import { TrendingUp, Calculator, ChevronRight, ChevronLeft } from "lucide-react";

const CARDS = [
  {
    href:    "/dashboard/dfin/ceo",
    icon:    TrendingUp,
    label:   "CEO",
    abbr:    "Coord. de Execução Orçamentária",
    desc:    "Monitoramento da execução orçamentária com análise de empenhos, liquidações e saldo disponível.",
  },
  {
    href:    "/dashboard/acont",
    icon:    Calculator,
    label:   "ACONT",
    abbr:    "Controle de Contas Bancárias",
    desc:    "Acompanhamento de saldos, conferência de disponibilidade, razão e extrato por banco e exercício.",
  },
];

export default function DfinHubPage() {
  return (
    <div className="space-y-8">

      {/* Breadcrumb */}
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-400 hover:text-para-blue uppercase tracking-widest transition-colors"
        >
          <ChevronLeft size={13} />
          Portal Principal
        </Link>
      </div>

      {/* Header */}
      <div>
        <span className="inline-block text-[10px] font-black text-para-blue bg-para-blue-light px-2.5 py-1 rounded-full uppercase tracking-widest mb-3">
          DFIN
        </span>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          Diretoria de Finanças
        </h1>
        <p className="text-slate-500 text-sm font-medium mt-1">
          Execução orçamentária e controle de contas bancárias.
        </p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {CARDS.map(({ href, icon: Icon, label, abbr, desc }) => (
          <Link
            key={label}
            href={href}
            className="group bg-white rounded-panel border border-slate-200 p-7 transition-all duration-200 hover:-translate-y-0.5 hover:border-para-blue/30"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <div className="flex items-start justify-between mb-6">
              <div className="w-12 h-12 rounded-xl bg-para-blue-light flex items-center justify-center group-hover:bg-para-blue transition-colors">
                <Icon size={22} className="text-para-blue group-hover:text-white transition-colors" />
              </div>
              <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full uppercase tracking-widest">
                Operacional
              </span>
            </div>

            <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-1">{label}</h2>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">
              {abbr}
            </p>
            <p className="text-slate-500 text-sm leading-relaxed mb-6">{desc}</p>

            <div className="flex items-center gap-1.5 text-para-blue font-black uppercase text-[11px] tracking-widest group-hover:gap-2.5 transition-all">
              Acessar
              <ChevronRight size={13} />
            </div>
          </Link>
        ))}
      </div>

      {/* Footer */}
      <div className="border-t border-slate-200 pt-6">
        <p className="text-slate-400 text-xs font-medium">
          Dados em tempo real do banco de dados centralizado.
        </p>
      </div>
    </div>
  );
}
