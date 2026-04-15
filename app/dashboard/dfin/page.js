import Link from "next/link";
import { ChevronLeft, Construction, TrendingUp, BookOpen, Calculator } from "lucide-react";

const MODULES = [
  { abbr: "CEO", label: "Controle de Execução Orçamentária", icon: TrendingUp },
  { abbr: "CPED", label: "Controle de Planejamento e Execução da Despesa", icon: BookOpen },
  { abbr: "ACONT", label: "Assessoria de Contabilidade", icon: Calculator },
];

export default function DfinHubPage() {
  return (
    <div className="space-y-8">

      {/* Breadcrumb */}
      <div>
        <Link href="/" className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-400 hover:text-para-blue uppercase tracking-widest transition-colors">
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
          Gestão orçamentária, planejamento e execução da despesa
        </p>
      </div>

      {/* Banner em construção */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 flex items-start gap-4">
        <div className="p-2.5 bg-amber-100 rounded-lg flex-shrink-0">
          <Construction size={20} className="text-amber-600" />
        </div>
        <div>
          <p className="text-sm font-black text-amber-800 mb-1">Módulo em desenvolvimento</p>
          <p className="text-xs text-amber-600 leading-relaxed font-medium">
            Os dashboards da DFIN estão sendo desenvolvidos. As coordenadorias CEO, CPED e ACONT estarão disponíveis em breve com integração completa ao banco de dados SIAFE.
          </p>
        </div>
      </div>

      {/* Cards das coordenadorias */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {MODULES.map(({ abbr, label, icon: Icon }) => (
          <div key={abbr} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 opacity-60 cursor-not-allowed">
            <div className="p-2.5 bg-slate-100 rounded-lg inline-flex mb-4">
              <Icon size={18} className="text-slate-400" />
            </div>
            <h2 className="text-lg font-black text-slate-600 tracking-tight mb-1">{abbr}</h2>
            <p className="text-xs text-slate-400 font-medium leading-relaxed">{label}</p>
            <div className="mt-4">
              <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full uppercase tracking-widest">
                Em breve
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="border-t border-slate-200 pt-6">
        <p className="text-slate-400 text-xs font-medium">
          Para acompanhar o desenvolvimento, entre em contato com o time de TI da SEDUC/PA.
        </p>
      </div>
    </div>
  );
}