import { getSupabaseAdminClient } from "../../../../../lib/supabase/server.js";
import { fetchContaDetalhe, calcConferencia } from "../../_conta-detail.js";
import AcontExtrato from "../../../../../components/acont-extrato.jsx";
import AcontSaldosDetail from "../../../../../components/acont-saldos-detail.jsx";
import Link from "next/link";
import { ChevronLeft, Landmark, CheckCircle2, AlertTriangle, Info } from "lucide-react";
import { formatCurrency } from "../../../../../lib/utils/formatters.js";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function BBContaDetailPage({ params }) {
  const { id } = await params;
  const supabase = getSupabaseAdminClient();
  const { conta, saldos, extrato } = await fetchContaDetalhe(supabase, id);

  if (!conta || conta.banco !== "BB") notFound();

  const conf    = calcConferencia(conta);
  const disp    = parseFloat(conta.saldo_disponibilidade || 0);
  const razao   = parseFloat(conta.saldo_razao           || 0);
  const extCC   = conta.saldo_extrato_cc != null ? parseFloat(conta.saldo_extrato_cc) : null;
  const totalEx = extrato.reduce((s, i) => s + parseFloat(i.valor || 0), 0);

  return (
    <div className="space-y-8">

      {/* Breadcrumb */}
      <div>
        <Link href="/dashboard/acont/bb" className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-400 hover:text-para-blue uppercase tracking-widest mb-5 transition-colors">
          <ChevronLeft size={13} />
          Banco do Brasil
        </Link>

        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-50 rounded-lg">
              <Landmark size={20} className="text-yellow-600" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">{conta.finalidade}</h1>
              <p className="text-slate-400 text-sm font-medium mt-0.5">
                BB · Ag. {conta.agencia} · {conta.numero_conta}
                {conta.conta_contabil && (
                  <span className="text-slate-300 mx-2">·</span>
                )}
                {conta.conta_contabil && (
                  <span className="font-mono text-[11px]">{conta.conta_contabil}</span>
                )}
              </p>
            </div>
          </div>

          {/* Badge de conferência */}
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-[11px] font-black uppercase tracking-widest ${
            conf?.ok
              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
              : "bg-amber-50 border-amber-200 text-amber-700"
          }`}>
            {conf?.ok
              ? <CheckCircle2 size={14} />
              : <AlertTriangle size={14} />
            }
            {conf?.ok
              ? "Conferência OK"
              : conf?.parcial
              ? "Conferir Razão"
              : "Divergência"
            }
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-6 py-5 flex flex-col gap-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Disponibilidade</p>
          <p className="text-2xl font-black text-para-blue leading-none tracking-tight">{formatCurrency(disp)}</p>
          <p className="text-[11px] text-slate-400">Exercício + Anterior</p>
        </div>

        <div className={`bg-white rounded-xl border shadow-sm px-6 py-5 flex flex-col gap-2 ${
          Math.abs(disp - razao) > 0.05 ? "border-amber-200" : "border-slate-200"
        }`}>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Razão Contábil</p>
          <p className={`text-2xl font-black leading-none tracking-tight ${
            Math.abs(disp - razao) > 0.05 ? "text-amber-600" : "text-slate-700"
          }`}>{formatCurrency(razao)}</p>
          {Math.abs(disp - razao) > 0.05 && (
            <p className="text-[11px] text-amber-500 flex items-center gap-1">
              <Info size={11} />
              Diferença: {formatCurrency(Math.abs(disp - razao))}
            </p>
          )}
        </div>

        <div className={`bg-white rounded-xl border shadow-sm px-6 py-5 flex flex-col gap-2 ${
          extCC != null && Math.abs(disp - extCC) > 0.05 ? "border-red-200" : "border-slate-200"
        }`}>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Extrato CC</p>
          <p className={`text-2xl font-black leading-none tracking-tight ${
            extCC != null && Math.abs(disp - extCC) > 0.05 ? "text-red-500" : "text-slate-700"
          }`}>{extCC != null ? formatCurrency(extCC) : "—"}</p>
          {extCC != null && Math.abs(disp - extCC) > 0.05 && (
            <p className="text-[11px] text-red-400 flex items-center gap-1">
              <Info size={11} />
              Diferença: {formatCurrency(Math.abs(disp - extCC))}
            </p>
          )}
        </div>
      </div>

      {/* Extrato */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-black text-slate-800">Extrato de Movimentações</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{extrato.length} lançamentos</p>
          </div>
          <div className={`text-sm font-black ${totalEx >= 0 ? "text-emerald-600" : "text-red-500"}`}>
            Saldo período: {totalEx >= 0 ? "+" : ""}{formatCurrency(totalEx)}
          </div>
        </div>
        <AcontExtrato extrato={extrato} />
      </div>

      {/* Detalhamento Saldos */}
      <div>
        <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-4">
          Detalhamento por Fonte
        </p>
        <AcontSaldosDetail saldos={saldos} />
      </div>

    </div>
  );
}
