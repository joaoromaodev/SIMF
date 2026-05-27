import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionRole } from "../lib/auth/require-role.js";
import {
  LayoutDashboard,
  TrendingUp,
  FileCheck2,
  CreditCard,
  Calculator,
  ArrowRight,
  Shield,
  Globe,
} from "lucide-react";

/**
 * Página raiz.
 * - Com sessão  → redireciona para /dashboard/dppc
 * - Sem sessão  → exibe landing page institucional com link para /login
 */
export default async function HomePage() {
  const session = await getSessionRole();

  if (session) {
    redirect("/dashboard");
  }

  const MODULES = [
    {
      icon: TrendingUp,
      label: "CEO",
      desc: "Coord. de Execução Orçamentária — acompanhamento de empenhos gerados por exercício.",
    },
    {
      icon: FileCheck2,
      label: "CLIQ",
      desc: "Controle de Liquidações — empenhos a liquidar e histórico de documentos.",
    },
    {
      icon: CreditCard,
      label: "CPAG",
      desc: "Controle de Pagamentos — monitoramento de OBs e liquidados a pagar.",
    },
    {
      icon: Calculator,
      label: "ACONT",
      desc: "Contas Bancárias — saldos, conferência e extrato por banco e exercício.",
    },
  ];

  return (
    <div className="min-h-screen bg-white font-sans text-slate-800 flex flex-col">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <header className="border-b border-slate-100 bg-white/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">

          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0 shadow-sm">
              <LayoutDashboard size={15} className="text-white" />
            </div>
            <div>
              <span className="text-base font-black tracking-tight text-slate-900">SIMF</span>
              <span className="hidden sm:inline text-slate-300 mx-2">·</span>
              <span className="hidden sm:inline text-xs font-medium text-slate-400">
                Sistema de Inteligência e Monitoramento Financeiro
              </span>
            </div>
          </div>

          {/* URL oficial + Entrar */}
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-slate-400">
              <Globe size={12} />
              simf.seduc.pa.gov.br
            </div>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-black uppercase tracking-widest rounded-lg shadow-sm transition-colors"
            >
              Entrar
              <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-24 bg-gradient-to-b from-slate-50 to-white">

        {/* Badge governamental */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 border border-blue-200 rounded-full text-[11px] font-black uppercase tracking-widest text-blue-600 mb-8">
          <Shield size={11} />
          Governo do Estado do Pará · SEDUC
        </div>

        <h1 className="text-5xl sm:text-6xl font-black text-slate-900 tracking-tight leading-none mb-4">
          SIMF
        </h1>
        <p className="text-lg sm:text-xl font-medium text-slate-500 max-w-xl mb-3">
          Sistema de Inteligência e Monitoramento Financeiro
        </p>
        <p className="text-sm text-slate-400 max-w-lg mb-10">
          Plataforma operacional da Secretaria Adjunta de Planejamento e Finanças —
          SAPF/SEDUC/PA — para acompanhamento da execução orçamentária, pagamentos e
          contas bancárias em tempo real.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <Link
            href="/login"
            className="inline-flex items-center gap-2.5 px-7 py-3.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-black uppercase tracking-widest rounded-xl shadow-md hover:shadow-lg transition-all"
          >
            Acessar o Sistema
            <ArrowRight size={14} />
          </Link>
          <span className="text-[11px] font-medium text-slate-300 select-none">
            Acesso restrito a servidores autorizados
          </span>
        </div>
      </section>

      {/* ── Módulos ───────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto w-full px-6 pb-20">
        <p className="text-[11px] font-black uppercase tracking-widest text-slate-300 text-center mb-8">
          Módulos disponíveis
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {MODULES.map(({ icon: Icon, label, desc }) => (
            <div
              key={label}
              className="bg-white rounded-xl border border-slate-100 shadow-sm px-6 py-6 flex flex-col gap-3 hover:border-blue-200 hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <Icon size={16} className="text-blue-600" />
                </div>
                <span className="text-sm font-black text-slate-900 tracking-tight">{label}</span>
              </div>
              <p className="text-xs text-slate-400 font-medium leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-100 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
            <Globe size={12} />
            <span className="font-black text-slate-500">simf.seduc.pa.gov.br</span>
          </div>
          <p className="text-[11px] text-slate-300 font-medium text-center">
            Secretaria de Estado de Educação do Pará · SEDUC/PA
          </p>
          <p className="text-[11px] text-slate-300 font-medium">
            SAPF · DFIN · DPPC · {new Date().getFullYear()}
          </p>
        </div>
      </footer>

    </div>
  );
}
