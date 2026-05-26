import { getSupabaseAdminClient } from "../../../../lib/supabase/server.js";
import AcontBankList from "../../../../components/acont-bank-list.jsx";
import Link from "next/link";
import { ChevronLeft, Landmark } from "lucide-react";
import { formatCurrency } from "../../../../lib/utils/formatters.js";

export const dynamic = "force-dynamic";

async function fetchContas(supabase, banco) {
  const { data, error } = await supabase
    .from("vw_acont_resumo_conta")
    .select("*")
    .eq("banco", banco)
    .order("ativo", { ascending: false })
    .order("numero_conta");
  if (error) return [];
  return data || [];
}

export default async function AcontCEFPage() {
  const supabase  = getSupabaseAdminClient();
  const contas    = await fetchContas(supabase, "CEF");
  const ativas    = contas.filter((c) => c.ativo);
  const totalDisp = ativas.reduce((s, c) => s + parseFloat(c.saldo_disponibilidade || 0), 0);

  return (
    <div className="space-y-8">
      <div>
        <Link href="/dashboard/acont" className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-400 hover:text-para-blue uppercase tracking-widest mb-5 transition-colors">
          <ChevronLeft size={13} />
          Hub ACONT
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-50 rounded-lg">
            <Landmark size={20} className="text-orange-600" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Caixa Econômica Federal</h1>
            <p className="text-slate-400 text-sm font-medium mt-0.5">
              {contas.length} contas · {ativas.length} ativas · {formatCurrency(totalDisp)} disponível
            </p>
          </div>
        </div>
      </div>

      <AcontBankList contas={contas} banco="CEF" slug="cef" />
    </div>
  );
}
