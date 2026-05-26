"use client";

import Link from "next/link";
import { ChevronRight, CheckCircle2, AlertTriangle } from "lucide-react";
import { formatCurrency } from "../lib/utils/formatters.js";

const DIFF_THRESHOLD = 0.05; // 5 centavos de tolerância

function conferencia(disp, razao, extrato) {
  if (extrato == null) return null;
  const ok = Math.abs(disp - razao) <= DIFF_THRESHOLD &&
             Math.abs(disp - extrato) <= DIFF_THRESHOLD;
  return ok;
}

export default function AcontBankList({ contas, banco, slug }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Cabeçalho da tabela */}
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60">
        <div className="grid grid-cols-[1fr_140px_140px_140px_56px_40px] gap-4 items-center">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Conta / Finalidade</span>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Disponibilidade</span>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Razão</span>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Extrato CC</span>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Conf.</span>
          <span />
        </div>
      </div>

      {/* Linhas */}
      <div className="divide-y divide-slate-100">
        {contas.map((c) => {
          const inativa = !c.ativo;
          const disp    = parseFloat(c.saldo_disponibilidade || 0);
          const razao   = parseFloat(c.saldo_razao           || 0);
          const extrato = c.saldo_extrato_cc != null ? parseFloat(c.saldo_extrato_cc) : null;
          const ok      = inativa ? null : conferencia(disp, razao, extrato);

          return (
            <Link
              key={c.id}
              href={`/dashboard/acont/${slug}/${c.id}`}
              className={`grid grid-cols-[1fr_140px_140px_140px_56px_40px] gap-4 items-center px-6 py-4 transition-colors group ${
                inativa
                  ? "bg-slate-50/70 hover:bg-slate-100/70"
                  : "hover:bg-slate-50"
              }`}
            >
              {/* Conta */}
              <div className="min-w-0 flex items-center gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm font-bold truncate ${inativa ? "text-slate-400" : "text-slate-800"}`}>
                      {c.finalidade}
                    </p>
                    {inativa && (
                      <span className="flex-shrink-0 text-[9px] font-black uppercase tracking-widest bg-slate-200 text-slate-500 px-2 py-0.5 rounded-full">
                        Inativa
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] font-mono text-slate-400 mt-0.5">{c.agencia} · {c.numero_conta}</p>
                </div>
              </div>

              {/* Disponibilidade */}
              <p className={`text-right font-mono font-bold text-xs ${inativa ? "text-slate-300" : "text-para-blue"}`}>
                {formatCurrency(disp)}
              </p>

              {/* Razão */}
              <p className={`text-right font-mono font-bold text-xs ${
                inativa ? "text-slate-300"
                : Math.abs(disp - razao) > DIFF_THRESHOLD ? "text-amber-600"
                : "text-slate-500"
              }`}>
                {formatCurrency(razao)}
              </p>

              {/* Extrato CC */}
              <p className={`text-right font-mono font-bold text-xs ${
                inativa ? "text-slate-300"
                : extrato != null && Math.abs(disp - extrato) > DIFF_THRESHOLD ? "text-red-500"
                : "text-slate-500"
              }`}>
                {extrato != null ? formatCurrency(extrato) : "—"}
              </p>

              {/* Conferência — inativas não conferem */}
              <div className="flex justify-center">
                {inativa ? (
                  <span className="text-[10px] text-slate-300 font-black">—</span>
                ) : ok === null ? (
                  <span className="text-[10px] text-slate-300 font-black">—</span>
                ) : ok ? (
                  <CheckCircle2 size={15} className="text-emerald-500" />
                ) : (
                  <AlertTriangle size={15} className="text-amber-500" />
                )}
              </div>

              {/* Seta */}
              <div className="flex justify-end">
                <ChevronRight size={14} className={`transition-colors ${inativa ? "text-slate-200" : "text-slate-300 group-hover:text-para-blue"}`} />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
