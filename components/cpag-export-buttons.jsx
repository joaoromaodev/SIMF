"use client";

import { useState } from "react";
import { fetchAllCpagExportData } from "../app/actions/pagamentos.js";

function fmtCurrency(value) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value ?? 0
  );
}

function fmtDate(dateString) {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("pt-BR");
}

function todayFilename() {
  return new Date().toISOString().slice(0, 10).replace(/-/g, "");
}

async function exportXLSX(liquidados, monitoramento) {
  const XLSX = await import("xlsx");

  const wb = XLSX.utils.book_new();

  const ws1 = XLSX.utils.json_to_sheet(
    liquidados.map((r) => ({
      Processo: r.numero_processo ?? "—",
      Empenho: r.codigo_nota_empenho ?? "—",
      "Documento de Liquidacao": r.documento_liquidacao ?? "—",
      Credor: r.credor ?? "—",
      "CPF/CNPJ Credor": r.dl_documento_credor ?? "—",
      "Fonte de Recurso": r.fonte ?? "—",
      "Valor Liquido": r.valor_liquido ?? 0,
      "Valor Bruto": r.valor_bruto ?? 0,
      "A Pagar": r.valor_liquidado_a_pagar ?? 0,
      "Atualizado em": fmtDate(r.updated_at),
    }))
  );

  const ws2 = XLSX.utils.json_to_sheet(
    monitoramento.map((r) => ({
      Processo: r.numero_processo ?? "—",
      "Documento de Liquidacao": r.documento_liquidacao ?? "—",
      "Ordem Bancaria": r.ordem_bancaria ?? "—",
      Credor: r.credor ?? "—",
      "CPF/CNPJ Credor": r.ob_credor_documento ?? "—",
      "Data de Pagamento": fmtDate(r.data_pagamento),
      Valor: r.valor ?? 0,
      "Fonte de Recurso": r.fonte ?? "—",
      Confirmado: r.confirmado_manualmente ? "Sim" : "Nao",
      "Confirmado Por": r.confirmado_por ?? "—",
      "Confirmado Em": fmtDate(r.confirmado_em),
      Observacao: r.observacao ?? "—",
    }))
  );

  XLSX.utils.book_append_sheet(wb, ws1, "Liquidados a Pagar");
  XLSX.utils.book_append_sheet(wb, ws2, "Monitoramento");

  XLSX.writeFile(wb, `CPAG_RELATORIO_${todayFilename()}.xlsx`);
}

async function exportPDF(liquidados, monitoramento) {
  const { jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const today = new Date().toLocaleDateString("pt-BR");
  const HEADER_COLOR = [0, 113, 206];

  // ── Cabeçalho do documento ──────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("SIMF \u2014 SEDUC/PA", 14, 15);

  doc.setFontSize(11);
  doc.text("Relatorio CPAG", 14, 22);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(`Gerado em: ${today}`, 14, 28);
  doc.setTextColor(0);

  // ── Secao 1: Liquidados a Pagar ─────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Liquidados a Pagar", 14, 36);

  autoTable(doc, {
    startY: 40,
    head: [
      ["Processo", "Empenho", "Doc. Liquidacao", "Credor", "Fonte", "Val. Liq.", "Val. Bruto", "A Pagar"],
    ],
    body: liquidados.map((r) => [
      r.numero_processo ?? "—",
      r.codigo_nota_empenho ?? "—",
      r.documento_liquidacao ?? "—",
      r.credor ?? "—",
      r.fonte ?? "—",
      fmtCurrency(r.valor_liquido),
      fmtCurrency(r.valor_bruto),
      fmtCurrency(r.valor_liquidado_a_pagar),
    ]),
    headStyles: { fillColor: HEADER_COLOR, textColor: 255, fontStyle: "bold", fontSize: 7 },
    bodyStyles: { fontSize: 7, textColor: 50 },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    styles: { cellPadding: 2, overflow: "linebreak" },
    columnStyles: {
      5: { halign: "right" },
      6: { halign: "right" },
      7: { halign: "right" },
    },
  });

  const y2 = (doc.lastAutoTable?.finalY ?? 80) + 12;

  // ── Secao 2: Monitoramento de Pagamentos ────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Monitoramento de Pagamentos", 14, y2);

  autoTable(doc, {
    startY: y2 + 4,
    head: [
      ["Processo", "Doc. Liquidacao", "Ordem Bancaria", "Credor", "Data Pgto", "Valor", "Fonte", "Status"],
    ],
    body: monitoramento.map((r) => [
      r.numero_processo ?? "—",
      r.documento_liquidacao ?? "—",
      r.ordem_bancaria ?? "—",
      r.credor ?? "—",
      fmtDate(r.data_pagamento),
      fmtCurrency(r.valor),
      r.fonte ?? "—",
      r.confirmado_manualmente ? "Confirmado" : "A Pagar",
    ]),
    headStyles: { fillColor: HEADER_COLOR, textColor: 255, fontStyle: "bold", fontSize: 7 },
    bodyStyles: { fontSize: 7, textColor: 50 },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    styles: { cellPadding: 2, overflow: "linebreak" },
    columnStyles: {
      5: { halign: "right" },
    },
  });

  doc.save(`CPAG_RELATORIO_${todayFilename()}.pdf`);
}

export default function CpagExportButtons() {
  const [loading, setLoading] = useState(null); // 'xlsx' | 'pdf' | null
  const [error, setError] = useState(null);

  async function handleExport(format) {
    setLoading(format);
    setError(null);
    try {
      const { liquidados, monitoramento } = await fetchAllCpagExportData();
      if (format === "xlsx") {
        await exportXLSX(liquidados, monitoramento);
      } else {
        await exportPDF(liquidados, monitoramento);
      }
    } catch (err) {
      setError("Erro ao gerar relatorio. Tente novamente.");
      console.error(err);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-3">
      <button
        onClick={() => handleExport("xlsx")}
        disabled={loading !== null}
        className="w-full flex items-center justify-between px-4 py-3 border border-slate-200 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors disabled:opacity-50 group"
      >
        <div className="text-left">
          <p className="text-sm font-black text-slate-800">
            {loading === "xlsx" ? "Gerando..." : "Exportar XLSX"}
          </p>
          <p className="text-xs text-slate-500 font-medium">Planilha com 2 abas</p>
        </div>
        <svg
          className="w-4 h-4 text-slate-400 group-hover:text-para-blue transition-colors"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      </button>

      <button
        onClick={() => handleExport("pdf")}
        disabled={loading !== null}
        className="w-full flex items-center justify-between px-4 py-3 border border-slate-200 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors disabled:opacity-50 group"
      >
        <div className="text-left">
          <p className="text-sm font-black text-slate-800">
            {loading === "pdf" ? "Gerando..." : "Exportar PDF"}
          </p>
          <p className="text-xs text-slate-500 font-medium">Relatorio com cabecalho</p>
        </div>
        <svg
          className="w-4 h-4 text-slate-400 group-hover:text-para-blue transition-colors"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      </button>

      {error && (
        <p className="text-xs text-red-600 font-medium">{error}</p>
      )}
    </div>
  );
}
