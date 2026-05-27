"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient } from "../../lib/supabase/browser.js";
import SimfLogo from "../../components/ui/simf-logo.jsx";

function LoginForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const redirect     = searchParams.get("redirect") || "/dashboard";

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createSupabaseBrowserClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError("Email ou senha incorretos. Verifique os dados e tente novamente.");
      setLoading(false);
      return;
    }

    router.push(redirect);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <label className="block text-[11px] font-black uppercase tracking-widest text-slate-500">
          Email
        </label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="seu@email.gov.br"
          className="w-full px-4 py-2.5 text-sm text-slate-800 bg-white border border-slate-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-para-blue/25 focus:border-para-blue placeholder:text-slate-300 transition-colors"
        />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="block text-[11px] font-black uppercase tracking-widest text-slate-500">
            Senha
          </label>
          <Link
            href="/login/recuperar-senha"
            className="text-[11px] font-bold text-para-blue hover:text-para-blue-dark transition-colors"
          >
            Esqueci minha senha
          </Link>
        </div>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="w-full px-4 py-2.5 text-sm text-slate-800 bg-white border border-slate-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-para-blue/25 focus:border-para-blue placeholder:text-slate-300 transition-colors"
        />
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3">
          <p className="text-xs font-medium text-red-700">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 px-4 bg-para-blue hover:bg-para-blue-dark text-white text-[11px] font-black uppercase tracking-widest rounded-lg shadow-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-slate-50"
      style={{
        backgroundImage:
          "radial-gradient(circle at 1px 1px, rgb(15 23 42 / 0.06) 1px, transparent 0)",
        backgroundSize: "24px 24px",
      }}
    >
      <div className="w-full max-w-sm">

        {/* Logo / Marca */}
        <div className="flex justify-center mb-8">
          <SimfLogo variant="full" />
        </div>

        {/* Card de login */}
        <div
          className="bg-white rounded-2xl border border-slate-200 px-8 py-9"
          style={{ boxShadow: "var(--shadow-panel)" }}
        >
          <div className="mb-7">
            <h2 className="text-lg font-black text-slate-900 tracking-tight">
              Acesso ao Sistema
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Entre com suas credenciais institucionais.
            </p>
          </div>
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </div>

        {/* Rodapé */}
        <p className="text-center text-[11px] uppercase tracking-widest font-medium text-slate-300 mt-6">
          Acesso restrito · SEDUC/PA
        </p>
      </div>
    </div>
  );
}
