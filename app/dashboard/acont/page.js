import { getSupabaseAdminClient } from "../../../lib/supabase/server.js";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Landmark } from "lucide-react";
import { formatCurrency } from "../../../lib/utils/formatters.js";

export const dynamic = "force-dynamic";

const BANCO_META = {
  BB:      { label: "Banco do Brasil", slug: "bb",      cor: "bg-yellow-50 border-yellow-200",       texto: "text-yellow-700", icone: "bg-yellow-100 text-yellow-600" },
  BANPARA: { label: "Banpará",         slug: "banpara",  cor: "bg-blue-50 border-blue-200",           texto: "text-para-blue",  icone: "bg-blue-100 text-para-blue"    },
  CEF:     { label: "Caixa Econômica", slug: "cef",      cor: "bg-orange-50 border-orange-200",       texto: "text-orange-700", icone: "bg-orange-100 text-orange-600" },
};

async function fetchKpisBanco(supabase) {
  const { data, error } = await supabase
    .from("vw_acont_kpis_banco")
    .select("banco, qtd_contas, qtd_contas_ativas, total_disponibilidade, total_razao");
  if (error) return [];
  return data || [];
}

export default async function AcontHubPage() {
  const supabase  = getSupabaseAdminClient();
  const kpis      = await fetchKpisBanco(supabase);

  const totalContas = kpis.reduce((s, r) => s + Number(r.qtd_contas        || 0), 0);
  const totalAtivas = kpis.reduce((s, r) => s + Number(r.qtd_contas_ativas || 0), 0);
  const totalDisp   = kpis.reduce((s, r) => s + parseFloat(r.total_disponibilidade || 0), 0);

  return (
    <div className="space-y-8">

      {/* Breadcrumb */}
      <div>
        <Link href="/" className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-400 hover:text-para-blue uppercase tracking-widest transition-colors">
          <ChevronLeft size={13} />
          Portal Principal
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Landmark size={20} className="text-para-blue" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Dashboard ACONT</h1>
            <p className="text-slate-400 text-sm font-medium mt-0.5">Controle de Contas Bancárias</p>
          </div>
        </div>
      </div>

      {/* KPI global */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-7 py-6 flex flex-col gap-2">
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">Total de Contas</p>
          <p className="text-4xl font-black text-para-blue leading-none tracking-tight">{totalContas}</p>
          <p className="text-[11px] text-slate-400 font-medium">BB · Banpará · Caixa Econômica</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-7 py-6 flex flex-col gap-2">
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">Contas Ativas</p>
          <p className="text-4xl font-black text-emerald-600 leading-none tracking-tight">{totalAtivas}</p>
          <p className="text-[11px] text-slate-400 font-medium">{totalContas - totalAtivas} inativas</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-7 py-6 flex flex-col gap-2">
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">Disponibilidade Total</p>
          <p className="text-2xl font-black text-slate-900 leading-none tracking-tight">{formatCurrency(totalDisp)}</p>
          <p className="text-[11px] text-slate-400 font-medium">Exercício atual + anterior</p>
        </div>
      </div>

      {/* Cards por banco */}
      <div>
        <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-4">Bancos</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {["BB", "BANPARA", "CEF"].map((banco) => {
            const meta  = BANCO_META[banco];
            const dados = kpis.find((k) => k.banco === banco);
            const qtd      = Number(dados?.qtd_contas        || 0);
            const qtdAtivas = Number(dados?.qtd_contas_ativas || 0);
            const disp     = parseFloat(dados?.total_disponibilidade || 0);

            return (
              <Link
                key={banco}
                href={`/dashboard/acont/${meta.slug}`}
                className={`group bg-white rounded-xl border shadow-sm p-7 hover:shadow-md transition-all duration-200 ${meta.cor}`}
              >
                <div className="flex items-start justify-between mb-6">
                  <div className={`p-3 rounded-xl ${meta.icone} transition-colors`}>
                    <Landmark size={22} />
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${meta.icone}`}>
                      {qtdAtivas} ativas
                    </span>
                    {qtd !== qtdAtivas && (
                      <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-slate-100 text-slate-400">
                        {qtd - qtdAtivas} inativas
                      </span>
                    )}
                  </div>
                </div>

                <h2 className={`text-xl font-black tracking-tight mb-1 ${meta.texto}`}>{meta.label}</h2>
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">{banco}</p>
                <p className="text-sm font-bold text-slate-600 mb-6">
                  {formatCurrency(disp)}
                  <span className="font-medium text-slate-400 ml-1 text-xs">disponível</span>
                </p>

                <div className={`flex items-center gap-1.5 font-black uppercase text-[11px] tracking-widest group-hover:gap-2.5 transition-all ${meta.texto}`}>
                  Ver contas
                  <ChevronRight size={13} />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

    </div>
  );
}
