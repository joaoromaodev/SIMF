import { getSupabaseAdminClient } from "../../../../../lib/supabase/server.js";
import { fetchContaDetalhe, calcConferencia } from "../../_conta-detail.js";
import AcontExtrato from "../../../../../components/acont-extrato.jsx";
import AcontSaldosDetail from "../../../../../components/acont-saldos-detail.jsx";
import { AcontExtratoExportButtons } from "../../../../../components/acont-export-buttons.jsx";
import Link from "next/link";
import { ChevronLeft, Landmark, CheckCircle2, AlertTriangle, Info } from "lucide-react";
import { formatCurrency } from "../../../../../lib/utils/formatters.js";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function BanparaContaDetailPage({ params, searchParams }) {
  const { id } = await params;
  const sp     = await searchParams;
  const ano    = sp.ano || "2026";

  const supabase = getSupabaseAdminClient();
  const { conta, saldos, extrato, resumo } = await fetchContaDetalhe(supabase, id, ano);

  if (!conta || conta.banco !== "BANPARA") notFound();

  const conf  = calcConferencia(resumo);
  const { disp, razao, extCC } = resumo;
  const totalEx = extrato.reduce((s, i) => s + parseFloat(i.valor || 0), 0);

  return (
    <div className="space-y-8">
      <div>
        <Link href={`/dashboard/acont/banpara?ano=${ano}`} className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-400 hover:text-para-blue uppercase tracking-widest mb-5 transition-colors">
          <ChevronLeft size={13} />
          Banpará
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg"><Landmark size={20} className="text-para-blue" /></div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">{conta.finalidade}</h1>
              <p className="text-slate-400 text-sm font-medium mt-0.5">
                Banpará · Ag. {conta.agencia} · {conta.numero_conta} · Exercício {ano}
                {conta.conta_contabil && <> · <span className="font-mono text-[11px]">{conta.conta_contabil}</span></>}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <AcontExtratoExportButtons contaId={Number(id)} exercicio={ano} />
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-[11px] font-black uppercase tracking-widest ${conf?.ok ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-amber-50 border-amber-200 text-amber-700"}`}>
              {conf?.ok ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
              {conf?.ok ? "Conferência OK" : conf?.parcial ? "Conferir Razão" : "Divergência"}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-6 py-5 flex flex-col gap-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Disponibilidade</p>
          <p className="text-2xl font-black text-para-blue leading-none tracking-tight">{formatCurrency(disp)}</p>
          <p className="text-[11px] text-slate-400">Exercício + Anterior</p>
        </div>
        <div className={`bg-white rounded-xl border shadow-sm px-6 py-5 flex flex-col gap-2 ${Math.abs(disp - razao) > 0.05 ? "border-amber-200" : "border-slate-200"}`}>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Razão Contábil</p>
          <p className={`text-2xl font-black leading-none tracking-tight ${Math.abs(disp - razao) > 0.05 ? "text-amber-600" : "text-slate-700"}`}>{formatCurrency(razao)}</p>
          {Math.abs(disp - razao) > 0.05 && <p className="text-[11px] text-amber-500 flex items-center gap-1"><Info size={11} />Dif.: {formatCurrency(Math.abs(disp - razao))}</p>}
        </div>
        <div className={`bg-white rounded-xl border shadow-sm px-6 py-5 flex flex-col gap-2 ${extCC != null && Math.abs(disp - extCC) > 0.05 ? "border-red-200" : "border-slate-200"}`}>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Extrato CC</p>
          <p className={`text-2xl font-black leading-none tracking-tight ${extCC != null && Math.abs(disp - extCC) > 0.05 ? "text-red-500" : "text-slate-700"}`}>{extCC != null ? formatCurrency(extCC) : "—"}</p>
          {extCC != null && Math.abs(disp - extCC) > 0.05 && <p className="text-[11px] text-red-400 flex items-center gap-1"><Info size={11} />Dif.: {formatCurrency(Math.abs(disp - extCC))}</p>}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div><p className="text-sm font-black text-slate-800">Extrato de Movimentações</p><p className="text-[11px] text-slate-400 mt-0.5">{extrato.length} lançamentos</p></div>
          <div className={`text-sm font-black ${totalEx >= 0 ? "text-emerald-600" : "text-red-500"}`}>Saldo período: {totalEx >= 0 ? "+" : ""}{formatCurrency(totalEx)}</div>
        </div>
        <AcontExtrato extrato={extrato} />
      </div>

      <div>
        <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-4">Detalhamento por Fonte — Exercício {ano}</p>
        <AcontSaldosDetail saldos={saldos} />
      </div>
    </div>
  );
}
