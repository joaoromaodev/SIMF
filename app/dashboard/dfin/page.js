import Link from "next/link";
import { Landmark, BookOpen, Vault, ChevronRight, ChevronLeft } from "lucide-react";

export default function DfinHubPage() {
  return (
    <div className="space-y-8">

      {/* Breadcrumb */}
      <div>
        <Link
          href="/"
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
          Diretoria Financeira
        </h1>
        <p className="text-slate-400 text-sm font-medium mt-1">
          Execução orçamentária, contabilidade e tesouraria
        </p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* CEO — Ativo */}
        <Link
          href="/dashboard/dfin/ceo"
          className="group bg-white rounded-xl border border-slate-200 shadow-sm p-7 hover:shadow-md hover:border-para-blue/30 transition-all duration-200"
        >
          <div className="flex items-start justify-between mb-6">
            <div className="p-3 bg-blue-50 rounded-xl group-hover:bg-blue-100 transition-colors">
              <Landmark size={24} className="text-para-blue" />
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

        {/* CCONT — Inativo */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-7 opacity-50 cursor-not-allowed select-none">
          <div className="flex items-start justify-between mb-6">
            <div className="p-3 bg-slate-100 rounded-xl">
              <BookOpen size={24} className="text-slate-400" />
            </div>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              Em Construção
            </span>
          </div>

          <h2 className="text-2xl font-black text-slate-700 tracking-tight mb-1">CCONT</h2>
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">
            Coord. de Contabilidade
          </p>
          <p className="text-slate-400 text-sm leading-relaxed">
            Escrituração contábil, conciliação de contas e geração de demonstrativos financeiros.
          </p>
        </div>

        {/* CTES — Inativo */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-7 opacity-50 cursor-not-allowed select-none">
          <div className="flex items-start justify-between mb-6">
            <div className="p-3 bg-slate-100 rounded-xl">
              <Vault size={24} className="text-slate-400" />
            </div>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              Em Construção
            </span>
          </div>

          <h2 className="text-2xl font-black text-slate-700 tracking-tight mb-1">CTES</h2>
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">
            Coord. de Tesouraria
          </p>
          <p className="text-slate-400 text-sm leading-relaxed">
            Controle de fluxo de caixa, gestão de contas bancárias e autorizações de pagamento.
          </p>
        </div>

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
