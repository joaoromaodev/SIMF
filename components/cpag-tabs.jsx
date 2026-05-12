"use client";

import { useState } from "react";
import { Wrench, TrendingUp } from "lucide-react";
import { LiquidadosTable } from "./liquidados-table.jsx";
import PaymentToggle from "./payment-toggle.jsx";
import { formatCurrency } from "../lib/utils/formatters";
import { MonitoramentoOBTable } from "./monitoramento-ob-table.jsx";

function formatDate(dateString) {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("pt-BR");
}

const TABS = [
  { id: "liquidados",    label: "Liquidados a Pagar"   },
  { id: "monitoramento", label: "Monitoramento de OBs"  },
  { id: "recursos",      label: "Recursos (Saldo)"      },
];

export function CpagTabs({ liquidados, monitoramento }) {
  const [activeTab, setActiveTab] = useState("liquidados");

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">

      {/* ── Barra de abas ── */}
      <div className="flex border-b border-slate-200 bg-slate-50/60">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                relative px-6 py-4 text-[11px] font-black uppercase tracking-widest
                transition-colors duration-150 focus:outline-none
                ${isActive
                  ? "text-blue-600 bg-white shadow-[inset_0_-2px_0_0] shadow-blue-600"
                  : "text-slate-400 hover:text-slate-600 hover:bg-white/60"
                }
              `}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Aba 1: Liquidados a Pagar ── */}
      {activeTab === "liquidados" && (
        <>
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <p className="text-[11px] text-slate-400 font-medium">
              Todos os exercícios — DLs com saldo pendente, inclusive pagamento parcial
            </p>
            {liquidados.length > 0 && (
              <span className="text-[11px] font-black text-slate-400 bg-slate-100 rounded-full px-3 py-1">
                {liquidados.length} registros
              </span>
            )}
          </div>

          {liquidados.length > 0 ? (
            <LiquidadosTable liquidados={liquidados} />
          ) : (
            <div className="px-6 py-16 text-center">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                <TrendingUp size={18} className="text-slate-400" />
              </div>
              <p className="text-slate-400 text-sm font-medium">
                Nenhum documento de liquidação a pagar encontrado.
              </p>
            </div>
          )}
        </>
      )}

      {/* ── Aba 2: Monitoramento de OBs ── */}
      {activeTab === "monitoramento" && (
        <MonitoramentoOBTable monitoramento={monitoramento} />
      )}

      {/* ── Aba 3: Recursos (Saldo) — Em Construção ── */}
      {activeTab === "recursos" && (
        <div className="px-8 py-20 flex flex-col items-center justify-center text-center">
          {/* Ícone animado */}
          <div className="relative mb-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-50 to-slate-100 border border-blue-100 flex items-center justify-center shadow-sm">
              <Wrench size={32} className="text-blue-400" />
            </div>
            {/* Pulsing ring */}
            <span className="absolute inset-0 rounded-2xl border-2 border-blue-200 animate-ping opacity-30" />
          </div>

          {/* Badge */}
          <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 border border-blue-200 rounded-full px-4 py-1.5 mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            Em Construção
          </span>

          {/* Título */}
          <h3 className="text-xl font-black text-slate-800 tracking-tight mb-3">
            Módulo de Validação de Saldo
          </h3>

          {/* Descrição */}
          <p className="text-sm text-slate-500 leading-relaxed max-w-md">
            Em breve você poderá selecionar múltiplas DLs aqui e o sistema somará os valores
            dinamicamente, cruzando com o saldo disponível em conta para validar o pagamento.
          </p>

          {/* Divisor decorativo */}
          <div className="mt-8 flex items-center gap-3 text-slate-200">
            <span className="h-px w-16 bg-slate-200" />
            <span className="text-[11px] font-black uppercase tracking-widest text-slate-300">Etapa 2</span>
            <span className="h-px w-16 bg-slate-200" />
          </div>
        </div>
      )}

    </div>
  );
}