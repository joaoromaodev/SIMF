"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "../../../lib/supabase/browser.js";
import { CheckCircle, Eye, EyeOff } from "lucide-react";

export default function RedefinirSenhaPage() {
  const router = useRouter();

  const [password,  setPassword]  = useState("");
  const [confirm,   setConfirm]   = useState("");
  const [showPass,  setShowPass]  = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [done,      setDone]      = useState(false);
  const [error,     setError]     = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("A senha deve ter pelo menos 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError("Não foi possível redefinir a senha. O link pode ter expirado — solicite um novo.");
      return;
    }

    setDone(true);
    setTimeout(() => router.push("/login"), 3000);
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
          <p className="text-sm text-slate-400 font-medium mt-1">Nova senha</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-8 py-8">

          {done ? (
            /* Estado: senha redefinida */
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <CheckCircle size={40} className="text-emerald-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">Senha redefinida!</p>
                <p className="text-xs text-slate-500 mt-1">
                  Redirecionando para o login…
                </p>
              </div>
            </div>
          ) : (
            /* Formulário */
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1">
                  Criar nova senha
                </h2>
                <p className="text-xs text-slate-500">
                  Mínimo de 8 caracteres.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-black uppercase tracking-widest text-slate-400">
                  Nova senha
                </label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    className="w-full px-4 py-2.5 pr-10 text-sm text-slate-800 bg-white border border-slate-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 placeholder:text-slate-300 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"
                  >
                    {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-black uppercase tracking-widest text-slate-400">
                  Confirmar senha
                </label>
                <input
                  type={showPass ? "text" : "password"}
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repita a senha"
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
                {loading ? "Salvando…" : "Salvar nova senha"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
