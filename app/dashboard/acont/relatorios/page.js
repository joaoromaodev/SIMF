import { getSupabaseAdminClient } from "../../../../lib/supabase/server.js";
import Link from "next/link";
import { ChevronLeft, FileText, AlertTriangle, CheckCircle2 } from "lucide-react";
import { formatCurrency } from "../../../../lib/utils/formatters.js";
import { AcontRelatoriosButtons } from "../../../../components/acont-export-buttons.jsx";

export const dynamic = "force-dynamic";

const ANOS   = ["2022", "2023", "2024", "2025", "2026"];
const BANCOS = [
  { value: "",       label: "Todos os Bancos" },
  { value: "BB",     label: "Banco do Brasil" },
  { value: "BANPARA", label: "Banpará"         },
  { value: "CEF",    label: "Caixa Econômica"  },
];

const DIFF_THRESHOLD = 0.05;

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR");
}

async function fetchPosicao(supabase, exercicio) {
  const { data, error } = await supabase
    .rpc("fn_acont_posicao_saldos", { p_exercicio: exercicio });
  return data || [];
}

async function fetchFonte(supabase, exercicio, banco) {
  const { data } = await supabase
    .rpc("fn_acont_consolidado_fonte", {
      p_exercicio: exercicio,
      p_banco:     banco || null,
    });
  return data || [];
}

export default async function AcontRelatoriosPage({ searchParams }) {
  const sp    = await searchParams;
  const ano   = sp.ano   || "2026";
  const banco = sp.banco || "";

  const supabase = getSupabaseAdminClient();
  const [posicao, fonte] = await Promise.all([
    fetchPosicao(supabase, ano),
    fetchFonte(supabase, ano, banco || null),
  ]);

  const posicaoFiltrada = banco ? posicao.filter((r) => r.banco === banco) : posicao;

  const divergencias = posicaoFiltrada.filter((r) => {
    const disp  = parseFloat(r.saldo_disponibilidade || 0);
    const razao = parseFloat(r.saldo_razao           || 0);
    const ext   = r.saldo_extrato_cc != null ? parseFloat(r.saldo_extrato_cc) : null;
    return Math.abs(disp - razao) > DIFF_THRESHOLD ||
           (ext != null && Math.abs(disp - ext) > DIFF_THRESHOLD);
  });

  const totalDisp = posicaoFiltrada
    .filter((r) => r.ativo)
    .reduce((s, r) => s + parseFloat(r.saldo_disponibilidade || 0), 0);

  // Monta URL mantendo filtros
  function hrefFiltro(key, val) {
    const p = new URLSearchParams({ ano, banco });
    p.set(key, val);
    return `/dashboard/acont/relatorios?${p.toString()}`;
  }

  return (
    <div className="space-y-8">

      {/* Breadcrumb */}
      <div>
        <Link href={`/dashboard/acont?ano=${ano}`} className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-400 hover:text-para-blue uppercase tracking-widest mb-5 transition-colors">
          <ChevronLeft size={13} />
          Hub ACONT
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <FileText size={20} className="text-para-blue" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Relatórios ACONT</h1>
            <p className="text-slate-400 text-sm font-medium mt-0.5">
              Exercício {ano}{banco ? ` · ${banco}` : " · Todos os Bancos"}
            </p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Ano */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">Exercício</span>
          <details className="relative group">
            <summary className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] font-black uppercase tracking-widest text-para-blue cursor-pointer select-none hover:border-para-blue transition-colors list-none">
              {ano}
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-open:rotate-180"><polyline points="6 9 12 15 18 9" /></svg>
            </summary>
            <div className="absolute left-0 top-full mt-1 z-20 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 min-w-[100px]">
              {ANOS.map((a) => (
                <Link key={a} href={hrefFiltro("ano", a)} className={`block px-4 py-2 text-[11px] font-black uppercase tracking-widest transition-colors ${ano === a ? "text-para-blue bg-blue-50" : "text-slate-500 hover:bg-slate-50"}`}>{a}</Link>
              ))}
            </div>
          </details>
        </div>

        {/* Banco */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">Banco</span>
          <details className="relative group">
            <summary className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] font-black uppercase tracking-widest text-para-blue cursor-pointer select-none hover:border-para-blue transition-colors list-none">
              {banco || "Todos"}
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-open:rotate-180"><polyline points="6 9 12 15 18 9" /></svg>
            </summary>
            <div className="absolute left-0 top-full mt-1 z-20 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 min-w-[160px]">
              {BANCOS.map((b) => (
                <Link key={b.value} href={hrefFiltro("banco", b.value)} className={`block px-4 py-2 text-[11px] font-black uppercase tracking-widest transition-colors ${banco === b.value ? "text-para-blue bg-blue-50" : "text-slate-500 hover:bg-slate-50"}`}>{b.label}</Link>
              ))}
            </div>
          </details>
        </div>
      </div>

      {/* KPIs rápidos */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-5 py-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Contas</p>
          <p className="text-2xl font-black text-para-blue mt-1">{posicaoFiltrada.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-5 py-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ativas</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">{posicaoFiltrada.filter((r) => r.ativo).length}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-5 py-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Com Divergência</p>
          <p className={`text-2xl font-black mt-1 ${divergencias.length > 0 ? "text-amber-600" : "text-emerald-600"}`}>{divergencias.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-5 py-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Disponibilidade</p>
          <p className="text-lg font-black text-slate-900 mt-1">{formatCurrency(totalDisp)}</p>
        </div>
      </div>

      {/* Botões de exportação */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <p className="text-sm font-black text-slate-800 mb-4">Exportar Relatórios</p>
        <AcontRelatoriosButtons exercicio={ano} banco={banco || null} />
      </div>

      {/* Posição de Saldos */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Posição de Saldos</p>
          <span className="text-[11px] text-slate-400">{posicaoFiltrada.length} contas</span>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left font-black uppercase tracking-wider text-slate-500">Banco</th>
                  <th className="px-4 py-3 text-left font-black uppercase tracking-wider text-slate-500">Conta</th>
                  <th className="px-4 py-3 text-left font-black uppercase tracking-wider text-slate-500">Finalidade</th>
                  <th className="px-4 py-3 text-left font-black uppercase tracking-wider text-slate-500">Status</th>
                  <th className="px-4 py-3 text-right font-black uppercase tracking-wider text-slate-500">Disponibilidade</th>
                  <th className="px-4 py-3 text-right font-black uppercase tracking-wider text-slate-500">Razão</th>
                  <th className="px-4 py-3 text-right font-black uppercase tracking-wider text-slate-500">Extrato CC</th>
                  <th className="px-4 py-3 text-center font-black uppercase tracking-wider text-slate-500">Conf.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {posicaoFiltrada.map((r, i) => {
                  const disp   = parseFloat(r.saldo_disponibilidade || 0);
                  const razao  = parseFloat(r.saldo_razao           || 0);
                  const ext    = r.saldo_extrato_cc != null ? parseFloat(r.saldo_extrato_cc) : null;
                  const divR   = Math.abs(disp - razao) > DIFF_THRESHOLD;
                  const divE   = ext != null && Math.abs(disp - ext) > DIFF_THRESHOLD;
                  const ok     = r.ativo && !divR && !divE;

                  return (
                    <tr key={i} className={`transition-colors ${i % 2 === 0 ? "bg-white hover:bg-slate-50" : "bg-slate-50/40 hover:bg-slate-100/40"} ${!r.ativo ? "opacity-60" : ""}`}>
                      <td className="px-4 py-3 font-bold text-slate-700">{r.banco}</td>
                      <td className="px-4 py-3 font-mono text-slate-500">{r.numero_conta}</td>
                      <td className="px-4 py-3 text-slate-600 max-w-[180px] truncate">{r.finalidade}</td>
                      <td className="px-4 py-3">
                        {r.ativo
                          ? <span className="text-[10px] font-black bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">Ativa</span>
                          : <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">Inativa</span>
                        }
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-para-blue">{formatCurrency(disp)}</td>
                      <td className={`px-4 py-3 text-right font-mono font-bold ${divR ? "text-amber-600" : "text-slate-500"}`}>{formatCurrency(razao)}</td>
                      <td className={`px-4 py-3 text-right font-mono font-bold ${divE ? "text-red-500" : "text-slate-500"}`}>{ext != null ? formatCurrency(ext) : "—"}</td>
                      <td className="px-4 py-3 text-center">
                        {!r.ativo ? <span className="text-slate-300">—</span>
                          : ok ? <CheckCircle2 size={14} className="text-emerald-500 inline" />
                          : <AlertTriangle size={14} className="text-amber-500 inline" />}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Divergências */}
      {divergencias.length > 0 && (
        <div>
          <p className="text-[11px] font-black uppercase tracking-widest text-amber-600 mb-3">
            Divergências ({divergencias.length})
          </p>
          <div className="bg-white rounded-xl border border-amber-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-amber-50 border-b border-amber-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-black uppercase tracking-wider text-amber-700">Banco</th>
                    <th className="px-4 py-3 text-left font-black uppercase tracking-wider text-amber-700">Conta</th>
                    <th className="px-4 py-3 text-left font-black uppercase tracking-wider text-amber-700">Finalidade</th>
                    <th className="px-4 py-3 text-right font-black uppercase tracking-wider text-amber-700">Disponibilidade</th>
                    <th className="px-4 py-3 text-right font-black uppercase tracking-wider text-amber-700">Razão</th>
                    <th className="px-4 py-3 text-right font-black uppercase tracking-wider text-amber-700">Extrato CC</th>
                    <th className="px-4 py-3 text-right font-black uppercase tracking-wider text-amber-700">Dif. Razão</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-50">
                  {divergencias.map((r, i) => {
                    const disp  = parseFloat(r.saldo_disponibilidade || 0);
                    const razao = parseFloat(r.saldo_razao           || 0);
                    const ext   = r.saldo_extrato_cc != null ? parseFloat(r.saldo_extrato_cc) : null;
                    return (
                      <tr key={i} className="hover:bg-amber-50/50">
                        <td className="px-4 py-3 font-bold text-slate-700">{r.banco}</td>
                        <td className="px-4 py-3 font-mono text-slate-500">{r.numero_conta}</td>
                        <td className="px-4 py-3 text-slate-600 max-w-[180px] truncate">{r.finalidade}</td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-para-blue">{formatCurrency(disp)}</td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-amber-600">{formatCurrency(razao)}</td>
                        <td className="px-4 py-3 text-right font-mono text-slate-500">{ext != null ? formatCurrency(ext) : "—"}</td>
                        <td className="px-4 py-3 text-right font-mono font-black text-red-500">{formatCurrency(Math.abs(disp - razao))}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Consolidado por Fonte */}
      <div>
        <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3">Consolidado por Fonte de Recurso</p>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left font-black uppercase tracking-wider text-slate-500">Banco</th>
                  <th className="px-4 py-3 text-left font-black uppercase tracking-wider text-slate-500">Fonte</th>
                  <th className="px-4 py-3 text-right font-black uppercase tracking-wider text-slate-500">Contas</th>
                  <th className="px-4 py-3 text-right font-black uppercase tracking-wider text-slate-500">Disponibilidade</th>
                  <th className="px-4 py-3 text-right font-black uppercase tracking-wider text-slate-500">Razão</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {fonte.map((r, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-white hover:bg-slate-50" : "bg-slate-50/40 hover:bg-slate-100/40"}>
                    <td className="px-4 py-3 font-bold text-slate-700">{r.banco}</td>
                    <td className="px-4 py-3 font-mono text-slate-600">{r.fonte}</td>
                    <td className="px-4 py-3 text-right text-slate-500">{Number(r.qtd_contas)}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-para-blue">{formatCurrency(r.total_disponibilidade)}</td>
                    <td className="px-4 py-3 text-right font-mono text-slate-500">{formatCurrency(r.total_razao)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
}
