"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { fetchAllCliqExportData } from "../app/actions/cliq.js";

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

const TAB_LABELS = {
  empenhos_liquidar:    "Empenhos a Liquidar",
  historico_liquidados: "Liquidados a Pagar",
};

// ── XLSX ─────────────────────────────────────────────────────────────────────

async function exportXLSX(tab, rows, ano) {
  const XLSX = await import("xlsx");
  const wb   = XLSX.utils.book_new();

  if (tab === "historico_liquidados") {
    const ws = XLSX.utils.json_to_sheet(
      rows.map((r) => {
        const vlImposto = (parseFloat(r.valor_bruto) || 0) - (parseFloat(r.valor_liquido) || 0);
        return {
          Processo:                  r.numero_processo         ?? "—",
          Empenho:                   r.codigo_nota_empenho     ?? "—",
          Credor:                    r.credor                  ?? "—",
          Natureza:                  r.codigo_natureza_despesa ?? "—",
          "Fonte de Recurso":        r.fonte                   ?? "—",
          "Documento de Liquidacao": r.documento_liquidacao    ?? "—",
          "Data da Liquidacao":      fmtDate(r.data_liquidacao),
          "Valor Liquido":           r.valor_liquido           ?? 0,
          "Valor Bruto":             r.valor_bruto             ?? 0,
          "Valor Imposto":           vlImposto                 ?? 0,
          "A Pagar":                 r.valor_liquidado_a_pagar ?? 0,
        };
      })
    );
    XLSX.utils.book_append_sheet(wb, ws, "Liquidados a Pagar");
    XLSX.writeFile(wb, `CLIQ_LIQUIDADOS_${todayFilename()}.xlsx`);
  } else {
    const ws = XLSX.utils.json_to_sheet(
      rows.map((r) => ({
        Processo:          r.numero_processo         ?? "—",
        Empenho:           r.codigo_nota_empenho     ?? "—",
        Credor:            r.credor                  ?? "—",
        Natureza:          r.codigo_natureza_despesa ?? "—",
        "Fonte de Recurso": r.fonte                  ?? "—",
        "Data Liquidacao": fmtDate(r.data_liquidacao),
        "Valor Bruto":     r.valor_bruto             ?? 0,
        "Ja Pago (OBs)":   r.valor_ja_pago_obs       ?? 0,
        "A Pagar":         r.valor_liquidado_a_pagar ?? 0,
      }))
    );
    XLSX.utils.book_append_sheet(wb, ws, "Empenhos a Liquidar");
    XLSX.writeFile(wb, `CLIQ_EMPENHOS_${todayFilename()}.xlsx`);
  }
}

// ── PDF ──────────────────────────────────────────────────────────────────────

async function exportPDF(tab, rows, ano) {
  const { jsPDF }             = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc          = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const today        = new Date().toLocaleDateString("pt-BR");
  const HEADER_COLOR = [0, 113, 206];

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("SIMF — SEDUC/PA", 14, 15);

  doc.setFontSize(11);
  doc.text(`Relatorio CLIQ — ${TAB_LABELS[tab] ?? tab}`, 14, 22);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(`Gerado em: ${today}`, 14, 28);
  doc.setTextColor(0);

  if (tab === "historico_liquidados") {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Liquidados a Pagar", 14, 36);

    autoTable(doc, {
      startY: 40,
      head: [["Processo", "Empenho", "Credor", "Natureza", "Fonte", "Doc. Liquidacao", "Dt. Liquidacao", "Vl. Liquido", "Vl. Bruto", "A Pagar"]],
      body: rows.map((r) => [
        r.numero_processo         ?? "—",
        r.codigo_nota_empenho     ?? "—",
        r.credor                  ?? "—",
        r.codigo_natureza_despesa ?? "—",
        r.fonte                   ?? "—",
        r.documento_liquidacao    ?? "—",
        fmtDate(r.data_liquidacao),
        fmtCurrency(r.valor_liquido),
        fmtCurrency(r.valor_bruto),
        fmtCurrency(r.valor_liquidado_a_pagar),
      ]),
      headStyles: { fillColor: HEADER_COLOR, textColor: 255, fontStyle: "bold", fontSize: 7 },
      bodyStyles: { fontSize: 7, textColor: 50 },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      styles: { cellPadding: 2, overflow: "linebreak" },
      columnStyles: { 7: { halign: "right" }, 8: { halign: "right" }, 9: { halign: "right" } },
    });

    doc.save(`CLIQ_LIQUIDADOS_${todayFilename()}.pdf`);
  } else {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Empenhos a Liquidar", 14, 36);

    autoTable(doc, {
      startY: 40,
      head: [["Processo", "Empenho", "Credor", "Natureza", "Fonte", "Dt. Liquidacao", "Vl. Bruto", "Ja Pago", "A Pagar"]],
      body: rows.map((r) => [
        r.numero_processo         ?? "—",
        r.codigo_nota_empenho     ?? "—",
        r.credor                  ?? "—",
        r.codigo_natureza_despesa ?? "—",
        r.fonte                   ?? "—",
        fmtDate(r.data_liquidacao),
        fmtCurrency(r.valor_bruto),
        fmtCurrency(r.valor_ja_pago_obs),
        fmtCurrency(r.valor_liquidado_a_pagar),
      ]),
      headStyles: { fillColor: HEADER_COLOR, textColor: 255, fontStyle: "bold", fontSize: 7 },
      bodyStyles: { fontSize: 7, textColor: 50 },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      styles: { cellPadding: 2, overflow: "linebreak" },
      columnStyles: { 6: { halign: "right" }, 7: { halign: "right" }, 8: { halign: "right" } },
    });

    doc.save(`CLIQ_EMPENHOS_${todayFilename()}.pdf`);
  }
}

// ── Componente ────────────────────────────────────────────────────────────────

export default function CliqExportButtons() {
  const searchParams = useSearchParams();
  const tab      = searchParams.get("aba")      || "empenhos_liquidar";
  const ano      = searchParams.get("ano")      || "2026";
  const fonte    = searchParams.get("fonte")    || "";
  const fontes   = searchParams.get("fontes")   || "";
  const credor   = searchParams.get("credor")   || "";
  const processo = searchParams.get("processo") || "";
  const empenho  = searchParams.get("empenho")  || "";
  const status   = searchParams.get("status")   || "";

  const [loading, setLoading] = useState(null);
  const [error,   setError  ] = useState(null);

  // Aba 3 (Recursos) não tem dados para exportar
  const exportDisabled = tab === "recursos";
  const tabLabel = TAB_LABELS[tab] ?? (tab === "recursos" ? "Recursos (Saldo)" : tab);

  async function handleExport(format) {
    setLoading(format);
    setError(null);
    try {
      const data = await fetchAllCliqExportData({
        tab,
        ano,
        filters: { fonte, fontes, credor, processo, empenho, status },
      });
      if (format === "xlsx") {
        await exportXLSX(tab, data.rows, ano);
      } else {
        await exportPDF(tab, data.rows, ano);
      }
    } catch (err) {
      setError("Erro ao gerar relatorio. Tente novamente.");
      console.error(err);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Indicador da aba ativa */}
      <p className="text-[10px] font-black uppercase tracking-widest text-para-blue bg-blue-50 border border-blue-200 rounded-full px-3 py-1 inline-block truncate max-w-full">
        {tabLabel}
      </p>

      <a
        role="button"
        onClick={exportDisabled || loading ? undefined : () => handleExport("xlsx")}
        className={`inline-flex items-center justify-between px-3 py-2 text-[11px] font-black uppercase tracking-widest border rounded-lg transition-colors ${
          exportDisabled || loading
            ? "text-slate-300 bg-slate-50 border-slate-100 cursor-not-allowed"
            : "text-slate-700 bg-slate-50 border-slate-200 hover:bg-slate-100 cursor-pointer"
        }`}
      >
        {loading === "xlsx" ? "Gerando..." : "Exportar XLSX"}
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
      </a>

      <a
        role="button"
        onClick={exportDisabled || loading ? undefined : () => handleExport("pdf")}
        className={`inline-flex items-center justify-between px-3 py-2 text-[11px] font-black uppercase tracking-widest border rounded-lg transition-colors ${
          exportDisabled || loading
            ? "text-slate-300 bg-slate-50 border-slate-100 cursor-not-allowed"
            : "text-slate-700 bg-slate-50 border-slate-200 hover:bg-slate-100 cursor-pointer"
        }`}
      >
        {loading === "pdf" ? "Gerando..." : "Exportar PDF"}
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
      </a>

      {error && <p className="text-[10px] text-red-600 font-medium">{error}</p>}
    </div>
  );
}
