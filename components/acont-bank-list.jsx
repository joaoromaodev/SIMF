"use client";

import Link from "next/link";
import { ChevronRight, CheckCircle2, AlertTriangle } from "lucide-react";
import { formatCurrency } from "../lib/utils/formatters.js";

const DIFF_THRESHOLD = 0.05; // 5 centavos de tolerância

function conferencia(disp, razao, extrato) {
  if (extrato == null) return null; // sem extrato cadastrado
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
          const disp   = parseFloat(c.saldo_disponibilidade || 0);
          const razao  = parseFloat(c.saldo_razao           || 0);
          const extrato = c.saldo_extrato_cc != null ? parseFloat(c.saldo_extrato_cc) : null;
          const ok     = conferencia(disp, razao, extrato);

          return (
            <Link
              key={c.id}
              href={`/dashboard/acont/${slug}/${c.id}`}
              className="grid grid-cols-[1fr_140px_140px_140px_56px_40px] gap-4 items-center px-6 py-4 hover:bg-slate-50 transition-colors group"
            >
              {/* Conta */}
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-800 truncate">{c.finalidade}</p>
                <p className="text-[11px] font-mono text-slate-400 mt-0.5">{c.agencia} · {c.numero_conta}</p>
              </div>

              {/* Disponibilidade */}
              <p className="text-right font-mono font-bold text-para-blue text-xs">{formatCurrency(disp)}</p>

              {/* Razão */}
              <p className={`text-right font-mono font-bold text-xs ${Math.abs(disp - razao) > DIFF_THRESHOLD ? "text-amber-600" : "text-slate-500"}`}>
                {formatCurrency(razao)}
              </p>

              {/* Extrato CC */}
              <p className={`text-right font-mono font-bold text-xs ${extrato != null && Math.abs(disp - extrato) > DIFF_THRESHOLD ? "text-red-500" : "text-slate-500"}`}>
                {extrato != null ? formatCurrency(extrato) : "—"}
              </p>

              {/* Conferência */}
              <div className="flex justify-center">
                {ok === null ? (
                  <span className="text-[10px] text-slate-300 font-black">—</span>
                ) : ok ? (
                  <CheckCircle2 size={15} className="text-emerald-500" />
                ) : (
                  <AlertTriangle size={15} className="text-amber-500" />
                )}
              </div>

              {/* Seta */}
              <div className="flex justify-end">
                <ChevronRight size={14} className="text-slate-300 group-hover:text-para-blue transition-colors" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
