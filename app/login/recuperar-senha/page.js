"use client";

import { useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "../../../lib/supabase/browser.js";
import { ArrowLeft, Mail, CheckCircle } from "lucide-react";
import SimfLogo from "../../../components/ui/simf-logo.jsx";

export default function RecuperarSenhaPage() {
  const [email,   setEmail]   = useState("");
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);
  const [error,   setError]   = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase   = createSupabaseBrowserClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=/login/redefinir-senha`;

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    setLoading(false);

    if (resetError) {
      setError("Não foi possível enviar o e-mail. Verifique o endereço e tente novamente.");
      return;
    }

    setSent(true);
  }

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

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <SimfLogo variant="full" />
        </div>

        {/* Card */}
        <div
          className="bg-white rounded-2xl border border-slate-200 px-8 py-9"
          style={{ boxShadow: "var(--shadow-panel)" }}
        >

          {sent ? (
            /* Estado: e-mail enviado */
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <CheckCircle size={40} className="text-emerald-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">E-mail enviado!</p>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Verifique a caixa de entrada de <span className="font-bold">{email}</span> e clique no link para redefinir sua senha.
                </p>
              </div>
              <p className="text-[11px] text-slate-400">
                O link expira em 1 hora.
              </p>
            </div>
          ) : (
            /* Formulário */
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="mb-1">
                <h2 className="text-lg font-black text-slate-900 tracking-tight">
                  Redefinir senha
                </h2>
                <p className="text-xs text-slate-500 leading-relaxed mt-1">
                  Informe seu e-mail cadastrado. Você receberá um link para criar uma nova senha.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-black uppercase tracking-widest text-slate-500">
                  E-mail
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

              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3">
                  <p className="text-xs font-medium text-red-700">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-para-blue hover:bg-para-blue-dark text-white text-[11px] font-black uppercase tracking-widest rounded-lg shadow-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Mail size={13} />
                {loading ? "Enviando…" : "Enviar link de recuperação"}
              </button>
            </form>
          )}
        </div>

        {/* Voltar */}
        <div className="text-center mt-5">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-400 hover:text-slate-700 uppercase tracking-widest transition-colors"
          >
            <ArrowLeft size={11} />
            Voltar ao login
          </Link>
        </div>
      </div>
    </div>
  );
}
