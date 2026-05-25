"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "../../lib/supabase/browser.js";

function LoginForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const redirect     = searchParams.get("redirect") || "/dashboard/dppc";

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
        <label className="block text-[11px] font-black uppercase tracking-widest text-slate-400">
          Email
        </label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="seu@email.gov.br"
          className="w-full px-4 py-2.5 text-sm text-slate-800 bg-white border border-slate-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 placeholder:text-slate-300 transition-colors"
        />
      </div>

      <div className="space-y-1.5">
        <label className="block text-[11px] font-black uppercase tracking-widest text-slate-400">
          Senha
        </label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="w-full px-4 py-2.5 text-sm text-slate-800 bg-white border border-slate-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 placeholder:text-slate-300 transition-colors"
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
        className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-black uppercase tracking-widest rounded-lg shadow-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Logo / Marca */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 shadow-lg mb-4">
            <span className="text-white font-black text-xl tracking-tight">S</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">SIMF</h1>
          <p className="text-sm text-slate-400 font-medium mt-1">
            Sistema de Inteligência e Monitoramento Financeiro
          </p>
          <p className="text-[11px] font-black uppercase tracking-widest text-slate-300 mt-1">
            SEDUC / Governo do Pará
          </p>
        </div>

        {/* Card de login */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-8 py-8">
          <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-6">
            Acesso ao Sistema
          </h2>
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </div>

        {/* Rodapé */}
        <p className="text-center text-[11px] text-slate-300 font-medium mt-6">
          Acesso restrito a servidores autorizados da SEDUC/PA
        </p>
      </div>
    </div>
  );
}
