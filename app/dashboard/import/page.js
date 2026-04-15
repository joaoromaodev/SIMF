import Link from "next/link";
import { UploadForm } from "../../../components/upload-form";
import { ChevronLeft, BookOpen, ArrowRightLeft, Plus } from "lucide-react";

export default function ImportPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans">

      {/* Topbar */}
      <header className="border-b border-white/10 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-md bg-para-blue flex items-center justify-center">
            <span className="text-white text-[11px] font-black">S</span>
          </div>
          <span className="text-white font-black tracking-tight">SIMF</span>
          <span className="text-white/20 mx-1">/</span>
          <span className="text-slate-400 text-sm font-medium">Atualização de Base</span>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-400 hover:text-white uppercase tracking-widest transition-colors"
        >
          <ChevronLeft size={13} />
          Portal Principal
        </Link>
      </header>

      {/* Conteúdo */}
      <div className="flex-1 flex items-start justify-center px-8 py-12">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">

          {/* Coluna esquerda — Upload */}
          <div className="space-y-6">
            {/* Título */}
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">
                Importação de Relatórios SIAFE
              </h1>
              <p className="text-slate-400 text-sm font-medium mt-1">
                Envie os arquivos CSV exportados do sistema SIAFE para atualizar a base de dados.
              </p>
            </div>

            {/* Card de Upload */}
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
              <div className="border-b border-white/10 px-6 py-4 flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] font-black text-slate-300 uppercase tracking-widest">
                  Input de Relatórios — .csv
                </span>
              </div>
              <div className="p-6">
                <UploadForm />
              </div>
            </div>

            {/* Info cards */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "NE+DL", desc: "Notas de Empenho e Documentos de Liquidação", file: "2026_NEDL.csv" },
                { label: "DL+OB", desc: "Documentos de Liquidação e Ordens Bancárias", file: "2026_DLOB.csv" },
              ].map(({ label, desc, file }) => (
                <div key={label} className="bg-white/5 border border-white/8 rounded-xl p-4">
                  <span className="text-[11px] font-black text-para-blue uppercase tracking-widest">{label}</span>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{desc}</p>
                  <p className="text-[10px] font-mono text-slate-500 mt-2 bg-white/5 rounded px-2 py-1 inline-block">{file}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Coluna direita — Dicionário De/Para */}
          <div className="space-y-4">
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">

              {/* Header */}
              <div className="border-b border-white/10 px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-para-blue/20">
                    <ArrowRightLeft size={14} className="text-para-blue" />
                  </div>
                  <div>
                    <p className="text-[11px] font-black text-white uppercase tracking-widest">
                      Dicionário de Colunas
                    </p>
                    <p className="text-[10px] text-slate-500 font-medium mt-0.5">Mapeamento De/Para</p>
                  </div>
                </div>
                <button
                  disabled
                  className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-500 border border-white/10 rounded-lg px-2.5 py-1.5 cursor-not-allowed opacity-50"
                  title="Em desenvolvimento"
                >
                  <Plus size={11} />
                  Novo
                </button>
              </div>

              {/* Preview de mapeamentos */}
              <div className="divide-y divide-white/5">
                {[
                  { origem: "DocumentodeLiquidacao", destino: "documento_liquidacao", tipo: "text" },
                  { origem: "CodigoNotadeEmpenho", destino: "codigo_nota_empenho", tipo: "text" },
                  { origem: "NUMERO_PROCESSO", destino: "numero_processo", tipo: "text" },
                  { origem: "Valor Original", destino: "valor_original", tipo: "numeric" },
                  { origem: "DatadoPagamento", destino: "data_pagamento", tipo: "date" },
                ].map(({ origem, destino, tipo }) => (
                  <div key={origem} className="px-5 py-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-mono text-slate-300 truncate">{origem}</p>
                    </div>
                    <ArrowRightLeft size={10} className="text-slate-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0 text-right">
                      <p className="text-[11px] font-mono text-para-blue truncate">{destino}</p>
                    </div>
                    <span className="text-[9px] font-black uppercase text-slate-600 bg-white/5 rounded px-1.5 py-0.5 flex-shrink-0">
                      {tipo}
                    </span>
                  </div>
                ))}
              </div>

              {/* Rodapé */}
              <div className="border-t border-white/8 px-5 py-3 flex items-center justify-between">
                <p className="text-[10px] text-slate-600 font-medium">
                  Interface completa em breve
                </p>
                <div className="flex items-center gap-1.5">
                  <BookOpen size={11} className="text-slate-600" />
                  <span className="text-[10px] text-slate-600 font-medium">Ver todos</span>
                </div>
              </div>
            </div>

            {/* Card de política */}
            <div className="bg-amber-950/40 border border-amber-800/30 rounded-xl p-4">
              <p className="text-[11px] font-black text-amber-400 uppercase tracking-widest mb-2">
                Política de Importação 2026
              </p>
              <p className="text-xs text-amber-200/70 leading-relaxed">
                Uploads do ano de 2026 substituem integralmente os dados anteriores do mesmo tipo. Históricos de 2023/2024 e 2025 são imutáveis após o primeiro carregamento.
              </p>
            </div>
          </div>
        </div>
      </div>

      <footer className="border-t border-white/8 py-4 px-8 text-center">
        <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">
          Secretaria de Estado de Educação · SEDUC/PA
        </p>
      </footer>
    </div>
  );
}