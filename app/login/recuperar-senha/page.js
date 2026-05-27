"use client";

import { useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "../../../lib/supabase/browser.js";
import { ArrowLeft, Mail, CheckCircle } from "lucide-react";

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
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 shadow-lg mb-4">
            <span className="text-white font-black text-xl tracking-tight">S</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">SIMF</h1>
          <p className="text-sm text-slate-400 font-medium mt-1">Recuperação de senha</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-8 py-8">

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
              <div>
                <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1">
                  Redefinir senha
                </h2>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Informe seu e-mail cadastrado. Você receberá um link para criar uma nova senha.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-black uppercase tracking-widest text-slate-400">
                  E-mail
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

              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3">
                  <p className="text-xs font-medium text-red-700">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-black uppercase tracking-widest rounded-lg shadow-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
            className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors"
          >
            <ArrowLeft size={11} />
            Voltar ao login
          </Link>
        </div>
      </div>
    </div>
  );
}
