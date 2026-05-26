"use client";

import { useState } from "react";
import { ArrowDownLeft, ArrowUpRight, ChevronDown, ChevronUp } from "lucide-react";
import { formatCurrency } from "../lib/utils/formatters.js";

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR");
}

// Agrupa lançamentos por mês (YYYY-MM)
function agruparPorMes(rows) {
  const grupos = {};
  for (const r of rows) {
    const key = r.data_ob?.slice(0, 7) ?? "sem-data";
    if (!grupos[key]) grupos[key] = [];
    grupos[key].push(r);
  }
  // Ordena do mais recente para o mais antigo
  return Object.entries(grupos).sort((a, b) => b[0].localeCompare(a[0]));
}

function labelMes(ym) {
  if (ym === "sem-data") return "Sem data";
  const [y, m] = ym.split("-");
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
          .replace(/^\w/, (c) => c.toUpperCase());
}

function LancamentoCard({ item }) {
  const isCredito = item.tipo === "CREDITO";
  const valor     = Math.abs(parseFloat(item.valor || 0));

  return (
    <div className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors">
      {/* Ícone */}
      <div className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${
        isCredito ? "bg-emerald-50" : "bg-red-50"
      }`}>
        {isCredito
          ? <ArrowDownLeft  size={16} className="text-emerald-500" />
          : <ArrowUpRight   size={16} className="text-red-400" />
        }
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-slate-800 truncate">{item.tipo_despesa}</p>
        <p className="text-[11px] text-slate-400 mt-0.5">
          OB: {formatDate(item.data_ob)}
          {item.data_transacao !== item.data_ob && (
            <span className="text-slate-300 mx-1.5">·</span>
          )}
          {item.data_transacao !== item.data_ob && (
            <span>Crédito: {formatDate(item.data_transacao)}</span>
          )}
        </p>
      </div>

      {/* Valor */}
      <p className={`font-mono font-black text-sm flex-shrink-0 ${
        isCredito ? "text-emerald-600" : "text-red-500"
      }`}>
        {isCredito ? "+" : "-"}
        {formatCurrency(valor)}
      </p>
    </div>
  );
}

export default function AcontExtrato({ extrato }) {
  const grupos = agruparPorMes(extrato);
  const [abertos, setAbertos] = useState(() => {
    // Abre o primeiro grupo por padrão
    const s = new Set();
    if (grupos.length > 0) s.add(grupos[0][0]);
    return s;
  });

  function toggle(key) {
    setAbertos((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  if (extrato.length === 0) {
    return (
      <div className="px-6 py-12 text-center text-slate-400 text-sm font-medium">
        Nenhuma movimentação registrada.
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-100">
      {grupos.map(([mes, itens]) => {
        const isAberto = abertos.has(mes);
        const totalMes = itens.reduce((s, i) => {
          const v = parseFloat(i.valor || 0);
          return s + v;
        }, 0);
        return (
          <div key={mes}>
            {/* Cabeçalho do mês */}
            <button
              onClick={() => toggle(mes)}
              className="w-full flex items-center justify-between px-5 py-3 bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <span className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                {labelMes(mes)}
                <span className="text-slate-300 mx-2">·</span>
                {itens.length} lançamentos
              </span>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-black ${totalMes >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                  {totalMes >= 0 ? "+" : ""}{formatCurrency(totalMes)}
                </span>
                {isAberto ? <ChevronUp size={13} className="text-slate-400" /> : <ChevronDown size={13} className="text-slate-400" />}
              </div>
            </button>

            {/* Lançamentos */}
            {isAberto && (
              <div className="divide-y divide-slate-50">
                {itens
                  .sort((a, b) => b.data_ob?.localeCompare(a.data_ob ?? "") ?? 0)
                  .map((item) => (
                    <LancamentoCard key={item.id} item={item} />
                  ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
