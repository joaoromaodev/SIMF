import { getSupabaseAdminClient } from "../../../../lib/supabase/server.js";
import AcontBankList from "../../../../components/acont-bank-list.jsx";
import { AcontConsolidadoExportButtons } from "../../../../components/acont-export-buttons.jsx";
import Link from "next/link";
import { ChevronLeft, Landmark } from "lucide-react";
import { formatCurrency } from "../../../../lib/utils/formatters.js";

export const dynamic = "force-dynamic";

async function fetchContas(supabase, banco, exercicio) {
  const { data, error } = await supabase
    .rpc("fn_acont_resumo_banco", { p_banco: banco, p_exercicio: exercicio });
  if (error) return [];
  return data || [];
}

export default async function AcontBBPage({ searchParams }) {
  const sp        = await searchParams;
  const ano       = sp.ano || "2026";
  const supabase  = getSupabaseAdminClient();
  const contas    = await fetchContas(supabase, "BB", ano);
  const ativas    = contas.filter((c) => c.ativo);
  const totalDisp = ativas.reduce((s, c) => s + parseFloat(c.saldo_disponibilidade || 0), 0);

  return (
    <div className="space-y-8">
      <div>
        <Link href={`/dashboard/acont?ano=${ano}`} className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-400 hover:text-para-blue uppercase tracking-widest mb-5 transition-colors">
          <ChevronLeft size={13} />
          Hub ACONT
        </Link>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-50 rounded-lg">
              <Landmark size={20} className="text-yellow-600" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Banco do Brasil</h1>
              <p className="text-slate-400 text-sm font-medium mt-0.5">
                {contas.length} contas · {ativas.length} ativas · Exercício {ano} · {formatCurrency(totalDisp)} disponível
              </p>
            </div>
          </div>
          <div className="flex-shrink-0">
            <AcontConsolidadoExportButtons banco="BB" exercicio={ano} />
          </div>
        </div>
      </div>

      <AcontBankList contas={contas} banco="BB" slug="bb" ano={ano} />
    </div>
  );
}
