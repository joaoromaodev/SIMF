import Link from "next/link";
import { UploadForm } from "../../../components/upload-form";
import { ChevronLeft, BookOpen, ArrowRightLeft, Plus } from "lucide-react";

export default function ImportPage() {
  return (
    <div className="-m-8 min-h-screen bg-slate-50 flex flex-col font-sans">

      {/* Topbar */}
      <header className="border-b border-slate-200 bg-white px-8 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center">
            <span className="text-white text-[11px] font-black">S</span>
          </div>
          <span className="text-slate-900 font-black tracking-tight">SIMF</span>
          <span className="text-slate-300 mx-1">/</span>
          <span className="text-slate-500 text-sm font-medium">Atualização de Base</span>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-500 hover:text-blue-600 uppercase tracking-widest transition-colors"
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
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Importação de Relatórios SIAFE
              </h1>
              <p className="text-slate-500 text-sm font-medium mt-1">
                Envie os arquivos CSV exportados do sistema SIAFE para atualizar a base de dados.
              </p>
            </div>

            {/* Card de Upload */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="border-b border-slate-100 px-6 py-4 flex items-center gap-3 bg-slate-50">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">
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
                <div key={label} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <span className="text-[11px] font-black text-blue-600 uppercase tracking-widest">{label}</span>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{desc}</p>
                  <p className="text-[10px] font-mono text-slate-400 mt-2 bg-slate-50 border border-slate-100 rounded px-2 py-1 inline-block">{file}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Coluna direita — Dicionário De/Para */}
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">

              {/* Header */}
              <div className="border-b border-slate-100 px-5 py-4 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-blue-50">
                    <ArrowRightLeft size={14} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-[11px] font-black text-slate-700 uppercase tracking-widest">
                      Dicionário de Colunas
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">Mapeamento De/Para</p>
                  </div>
                </div>
                <button
                  disabled
                  className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-400 border border-slate-200 rounded-lg px-2.5 py-1.5 cursor-not-allowed opacity-50"
                  title="Em desenvolvimento"
                >
                  <Plus size={11} />
                  Novo
                </button>
              </div>

              {/* Preview de mapeamentos */}
              <div className="divide-y divide-slate-100">
                {[
                  { origem: "DocumentodeLiquidacao", destino: "documento_liquidacao", tipo: "text" },
                  { origem: "CodigoNotadeEmpenho", destino: "codigo_nota_empenho", tipo: "text" },
                  { origem: "NUMERO_PROCESSO", destino: "numero_processo", tipo: "text" },
                  { origem: "Valor Original", destino: "valor_original", tipo: "numeric" },
                  { origem: "DatadoPagamento", destino: "data_pagamento", tipo: "date" },
                ].map(({ origem, destino, tipo }) => (
                  <div key={origem} className="px-5 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-mono text-slate-600 truncate">{origem}</p>
                    </div>
                    <ArrowRightLeft size={10} className="text-slate-300 flex-shrink-0" />
                    <div className="flex-1 min-w-0 text-right">
                      <p className="text-[11px] font-mono text-blue-600 truncate">{destino}</p>
                    </div>
                    <span className="text-[9px] font-black uppercase text-slate-400 bg-slate-100 rounded px-1.5 py-0.5 flex-shrink-0">
                      {tipo}
                    </span>
                  </div>
                ))}
              </div>

              {/* Rodapé */}
              <div className="border-t border-slate-100 bg-slate-50 px-5 py-3 flex items-center justify-between">
                <p className="text-[10px] text-slate-400 font-medium">
                  Interface completa em breve
                </p>
                <div className="flex items-center gap-1.5">
                  <BookOpen size={11} className="text-slate-400" />
                  <span className="text-[10px] text-slate-400 font-medium">Ver todos</span>
                </div>
              </div>
            </div>

            {/* Card de política */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-[11px] font-black text-amber-700 uppercase tracking-widest mb-2">
                Política de Importação 2026
              </p>
              <p className="text-xs text-amber-700/80 leading-relaxed">
                Uploads do ano de 2026 substituem integralmente os dados anteriores do mesmo tipo. Históricos de 2023/2024 e 2025 são imutáveis após o primeiro carregamento.
              </p>
            </div>
          </div>
        </div>
      </div>

      <footer className="border-t border-slate-200 bg-white py-4 px-8 text-center">
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
          Secretaria de Estado de Educação · SEDUC/PA
        </p>
      </footer>
    </div>
  );
}