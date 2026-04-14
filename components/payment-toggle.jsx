"use client";

import { useState, useTransition } from "react";
import { toggleMarcacaoPagamento } from "../app/actions/pagamentos.js";

export default function PaymentToggle({ ordemBancaria, initialConfirmado, confirmadoPor }) {
  const [confirmado, setConfirmado] = useState(Boolean(initialConfirmado));
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    const novoValor = !confirmado;
    const previous = confirmado;

    setConfirmado(novoValor);

    startTransition(async () => {
      try {
        await toggleMarcacaoPagamento(ordemBancaria, novoValor, confirmadoPor ?? null);
      } catch {
        setConfirmado(previous);
      }
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={`px-3 py-1 text-xs font-black uppercase tracking-widest border rounded transition-colors disabled:opacity-50 ${
        confirmado
          ? "bg-green-100 text-green-700 border-green-300 hover:bg-green-200"
          : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
      }`}
    >
      {confirmado ? "Confirmado" : "A Pagar"}
    </button>
  );
}
