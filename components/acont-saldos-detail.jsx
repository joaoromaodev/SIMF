"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { formatCurrency } from "../lib/utils/formatters.js";

function SaldoTable({ titulo, cor, rows, cols }) {
  const [aberto, setAberto] = useState(false);

  const total = rows.reduce((s, r) => s + parseFloat(r[cols.exercicio] || 0) + parseFloat(r[cols.anterior] || 0), 0);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <button
        onClick={() => setAberto((p) => !p)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`w-2.5 h-2.5 rounded-full ${cor}`} />
          <span className="text-sm font-black text-slate-800">{titulo}</span>
          <span className="text-[11px] text-slate-400 font-medium">
            {rows.length} linha{rows.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-black text-para-blue">{formatCurrency(total)}</span>
          {aberto ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
        </div>
      </button>

      {aberto && (
        <div className="border-t border-slate-100 overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-5 py-2.5 text-left font-black uppercase tracking-wider text-slate-500">Fonte</th>
                <th className="px-5 py-2.5 text-left font-black uppercase tracking-wider text-slate-500">Detalhamento</th>
                <th className="px-5 py-2.5 text-right font-black uppercase tracking-wider text-slate-500">Exercício</th>
                <th className="px-5 py-2.5 text-right font-black uppercase tracking-wider text-slate-500">Anterior</th>
                <th className="px-5 py-2.5 text-right font-black uppercase tracking-wider text-slate-500">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {rows.map((r, i) => {
                const ex  = parseFloat(r[cols.exercicio] || 0);
                const ant = parseFloat(r[cols.anterior]  || 0);
                return (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-mono text-slate-500">{r.fonte}</td>
                    <td className="px-5 py-3 text-slate-600">{r.detalhamento}</td>
                    <td className="px-5 py-3 text-right font-mono font-bold text-slate-700">{formatCurrency(ex)}</td>
                    <td className="px-5 py-3 text-right font-mono text-slate-400">{formatCurrency(ant)}</td>
                    <td className="px-5 py-3 text-right font-mono font-black text-para-blue">{formatCurrency(ex + ant)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function AcontSaldosDetail({ saldos }) {
  return (
    <div className="space-y-4">
      <SaldoTable
        titulo="Disponibilidade"
        cor="bg-para-blue"
        rows={saldos}
        cols={{ exercicio: "disponibilidade_exercicio", anterior: "disponibilidade_anterior" }}
      />
      <SaldoTable
        titulo="Razão Contábil"
        cor="bg-slate-400"
        rows={saldos}
        cols={{ exercicio: "razao_exercicio", anterior: "razao_anterior" }}
      />
      <SaldoTable
        titulo="Aplicação Financeira"
        cor="bg-emerald-500"
        rows={saldos}
        cols={{ exercicio: "aplicacao_exercicio", anterior: "aplicacao_anterior" }}
      />
    </div>
  );
}
