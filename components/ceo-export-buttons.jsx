"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { fetchAllCeoExportData } from "../app/actions/ceo.js";

function fmtCurrency(value) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value ?? 0);
}

function fmtDate(dateString) {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("pt-BR");
}

function todayFilename() {
  return new Date().toISOString().slice(0, 10).replace(/-/g, "");
}

// ── XLSX ─────────────────────────────────────────────────────────────────────

async function exportXLSX(rows, ano) {
  const XLSX = await import("xlsx");
  const wb   = XLSX.utils.book_new();

  const ws = XLSX.utils.json_to_sheet(
    rows.map((r) => ({
      "Unidade Gestora":    r.codigo_unidade_gestora ?? "—",
      "Data Empenho":       fmtDate(r.data_empenho),
      Processo:             r.numero_processo        ?? "—",
      NE:                   r.codigo_nota_empenho    ?? "—",
      "Criado Por":         r.nome_usuario_criou     ?? "—",
      "Valor Original":     r.valor_original         ?? 0,
      "Valor Corrente":     r.valor_corrente         ?? 0,
      "Saldo a Liquidar":   r.saldo_a_liquidar       ?? 0,
      Quantidade:           r.quantidade             ?? 0,
    }))
  );

  XLSX.utils.book_append_sheet(wb, ws, "Empenhos Gerados");
  XLSX.writeFile(wb, `CEO_EMPENHOS_${ano}_${todayFilename()}.xlsx`);
}

// ── PDF ──────────────────────────────────────────────────────────────────────

async function exportPDF(rows, ano) {
  const { jsPDF }             = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc          = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const today        = new Date().toLocaleDateString("pt-BR");
  const HEADER_COLOR = [0, 113, 206];

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("SIMF — SEDUC/PA", 14, 15);

  doc.setFontSize(11);
  doc.text("Relatorio CEO — Empenhos Gerados", 14, 22);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(`Gerado em: ${today}  ·  Exercício: ${ano}`, 14, 28);
  doc.setTextColor(0);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Empenhos Gerados", 14, 36);

  autoTable(doc, {
    startY: 40,
    head: [["UG", "Data Empenho", "Processo", "NE", "Criado Por", "Vl. Original", "Vl. Corrente", "Saldo a Liquidar"]],
    body: rows.map((r) => [
      r.codigo_unidade_gestora ?? "—",
      fmtDate(r.data_empenho),
      r.numero_processo        ?? "—",
      r.codigo_nota_empenho    ?? "—",
      r.nome_usuario_criou     ?? "—",
      fmtCurrency(r.valor_original),
      fmtCurrency(r.valor_corrente),
      fmtCurrency(r.saldo_a_liquidar),
    ]),
    headStyles: { fillColor: HEADER_COLOR, textColor: 255, fontStyle: "bold", fontSize: 7 },
    bodyStyles: { fontSize: 7, textColor: 50 },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    styles: { cellPadding: 2, overflow: "linebreak" },
    columnStyles: { 5: { halign: "right" }, 6: { halign: "right" }, 7: { halign: "right" } },
  });

  doc.save(`CEO_EMPENHOS_${ano}_${todayFilename()}.pdf`);
}

// ── Componente ────────────────────────────────────────────────────────────────

export default function CeoExportButtons() {
  const searchParams = useSearchParams();
  const ano = searchParams.get("ano") || "2026";
  const aba = searchParams.get("aba") || "empenhos";
  const q   = searchParams.get("q")   || "";

  const [loading, setLoading] = useState(null);
  const [error,   setError  ] = useState(null);

  // Aba 2 (PRDs) ainda não tem dados para exportar
  const exportDisabled = aba === "prds";

  async function handleExport(format) {
    setLoading(format);
    setError(null);
    try {
      const { rows } = await fetchAllCeoExportData({ ano, q });
      if (format === "xlsx") {
        await exportXLSX(rows, ano);
      } else {
        await exportPDF(rows, ano);
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
      {/* Indicador do exercício */}
      <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 border border-blue-200 rounded-full px-3 py-1 inline-block">
        Empenhos Gerados · {ano}
      </p>

      <button
        onClick={() => handleExport("xlsx")}
        disabled={exportDisabled || loading !== null}
        className="w-full flex items-center justify-between px-4 py-3 border border-slate-200 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
      >
        <div className="text-left">
          <p className="text-sm font-black text-slate-800">
            {loading === "xlsx" ? "Gerando..." : "Exportar XLSX"}
          </p>
          <p className="text-xs text-slate-500 font-medium">Planilha de empenhos</p>
        </div>
        <svg className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      </button>

      <button
        onClick={() => handleExport("pdf")}
        disabled={exportDisabled || loading !== null}
        className="w-full flex items-center justify-between px-4 py-3 border border-slate-200 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
      >
        <div className="text-left">
          <p className="text-sm font-black text-slate-800">
            {loading === "pdf" ? "Gerando..." : "Exportar PDF"}
          </p>
          <p className="text-xs text-slate-500 font-medium">Relatório com cabeçalho</p>
        </div>
        <svg className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      </button>

      {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
    </div>
  );
}
