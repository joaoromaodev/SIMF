import Link from "next/link";
import { TrendingUp, Calculator, ChevronRight, ChevronLeft } from "lucide-react";

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
        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">DFIN</p>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          Diretoria de Finanças
        </h1>
        <p className="text-slate-400 text-sm font-medium mt-1">
          Execução orçamentária e controle de contas bancárias
        </p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* CEO */}
        <Link
          href="/dashboard/dfin/ceo"
          className="group bg-white rounded-xl border border-slate-200 shadow-sm p-7 hover:shadow-md hover:border-para-blue/30 transition-all duration-200"
        >
          <div className="flex items-start justify-between mb-6">
            <div className="p-3 bg-blue-50 rounded-xl group-hover:bg-blue-100 transition-colors">
              <TrendingUp size={24} className="text-para-blue" />
            </div>
            <span className="text-[10px] font-black text-para-blue bg-blue-50 px-2.5 py-1 rounded-full uppercase tracking-widest">
              Operacional
            </span>
          </div>

          <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-1">CEO</h2>
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">
            Coord. de Execução Orçamentária
          </p>
          <p className="text-slate-500 text-sm leading-relaxed mb-6">
            Monitoramento da execução orçamentária com análise de empenhos, liquidações e saldo disponível.
          </p>

          <div className="flex items-center gap-1.5 text-para-blue font-black uppercase text-[11px] tracking-widest group-hover:gap-2.5 transition-all">
            Acessar
            <ChevronRight size={13} />
          </div>
        </Link>

        {/* ACONT */}
        <Link
          href="/dashboard/acont"
          className="group bg-white rounded-xl border border-slate-200 shadow-sm p-7 hover:shadow-md hover:border-para-blue/30 transition-all duration-200"
        >
          <div className="flex items-start justify-between mb-6">
            <div className="p-3 bg-blue-50 rounded-xl group-hover:bg-blue-100 transition-colors">
              <Calculator size={24} className="text-para-blue" />
            </div>
            <span className="text-[10px] font-black text-para-blue bg-blue-50 px-2.5 py-1 rounded-full uppercase tracking-widest">
              Operacional
            </span>
          </div>

          <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-1">ACONT</h2>
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">
            Controle de Contas Bancárias
          </p>
          <p className="text-slate-500 text-sm leading-relaxed mb-6">
            Acompanhamento de saldos, conferência de disponibilidade, razão e extrato por banco e exercício.
          </p>

          <div className="flex items-center gap-1.5 text-para-blue font-black uppercase text-[11px] tracking-widest group-hover:gap-2.5 transition-all">
            Acessar
            <ChevronRight size={13} />
          </div>
        </Link>

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
