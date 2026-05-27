import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionRole } from "../lib/auth/require-role.js";
import {
  TrendingUp,
  FileCheck2,
  CreditCard,
  Calculator,
  ArrowRight,
} from "lucide-react";
import SimfLogo from "../components/ui/simf-logo.jsx";

/**
 * Página raiz.
 * - Com sessão  → redireciona para /dashboard
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
      dir: "DFIN",
      desc: "Execução orçamentária e empenhos por exercício.",
    },
    {
      icon: FileCheck2,
      label: "CLIQ",
      dir: "DPPC",
      desc: "Controle de liquidações e histórico de documentos.",
    },
    {
      icon: CreditCard,
      label: "CPAG",
      dir: "DPPC",
      desc: "Monitoramento de OBs e liquidados a pagar.",
    },
    {
      icon: Calculator,
      label: "ACONT",
      dir: "DFIN",
      desc: "Saldos, conferência e extrato por banco.",
    },
  ];

  return (
    <div className="min-h-screen bg-white font-sans text-slate-800 flex flex-col">

      {/* ── Header fixo ───────────────────────────────────────────────────── */}
      <header className="border-b border-slate-100 bg-white/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <SimfLogo variant="full" />
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-4 py-2 bg-para-blue hover:bg-para-blue-dark text-white text-[11px] font-black uppercase tracking-widest rounded-lg shadow-sm transition-colors"
          >
            Entrar
            <ArrowRight size={12} />
          </Link>
        </div>
      </header>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section
        className="flex-1 flex flex-col items-center justify-center text-center px-6 py-28 bg-slate-50"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgb(15 23 42 / 0.06) 1px, transparent 0)",
          backgroundSize: "24px 24px",
        }}
      >
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-para-blue-light border border-para-blue/15 rounded-full text-[11px] font-black uppercase tracking-widest text-para-blue mb-8">
          Sistema Interno · SEDUC/PA
        </div>

        {/* Título */}
        <h1 className="text-5xl sm:text-6xl font-black text-slate-900 tracking-tight leading-[1.05] mb-5 text-balance max-w-3xl">
          Monitoramento Financeiro
        </h1>

        {/* Subtítulo */}
        <p className="text-base sm:text-lg text-slate-500 max-w-xl mb-10 leading-relaxed">
          Acompanhamento de execução orçamentária, pagamentos e contas bancárias da SAPF.
        </p>

        {/* CTA */}
        <Link
          href="/login"
          className="inline-flex items-center gap-2.5 px-7 py-3.5 bg-para-blue hover:bg-para-blue-dark text-white text-[11px] font-black uppercase tracking-widest rounded-xl shadow-md hover:shadow-lg transition-all"
        >
          Acessar o Sistema
          <ArrowRight size={14} />
        </Link>
        <p className="mt-4 text-[11px] uppercase tracking-widest font-medium text-slate-300">
          Acesso restrito · servidores autorizados
        </p>
      </section>

      {/* ── Módulos ───────────────────────────────────────────────────────── */}
      <section className="bg-white border-t border-slate-100">
        <div className="max-w-6xl mx-auto w-full px-6 py-16">
          <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 text-center mb-10">
            Módulos disponíveis
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {MODULES.map(({ icon: Icon, label, dir, desc }) => (
              <div
                key={label}
                className="bg-white rounded-card border border-slate-200 px-6 py-6 flex flex-col gap-3 transition-all hover:-translate-y-0.5 hover:border-para-blue/30"
                style={{ boxShadow: "var(--shadow-card)" }}
              >
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-lg bg-para-blue-light flex items-center justify-center flex-shrink-0">
                    <Icon size={17} className="text-para-blue" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {dir}
                  </span>
                </div>
                <div>
                  <p className="text-base font-black text-slate-900 tracking-tight">{label}</p>
                  <p className="mt-1.5 text-xs text-slate-500 font-medium leading-relaxed">
                    {desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-100 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <p className="text-[11px] text-slate-400 font-medium text-center">
            © {new Date().getFullYear()} SEDUC/PA · Secretaria Adjunta de Planejamento e Finanças
          </p>
        </div>
      </footer>

    </div>
  );
}
