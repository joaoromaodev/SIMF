"use client";

import { useState } from "react";
import {
  fetchAcontExtratoExport,
  fetchAcontExtratoConsolidadoExport,
  fetchAcontPosicaoSaldosExport,
  fetchAcontDivergenciasExport,
  fetchAcontConsolidadoFonteExport,
  fetchAcontMovimentacoesExport,
} from "../app/actions/acont.js";

// ── Formatters ────────────────────────────────────────────────────────────────

function fmtCurrency(v) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v ?? 0);
}
function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR");
}
function today() {
  return new Date().toISOString().slice(0, 10).replace(/-/g, "");
}

// ── XLSX helpers ─────────────────────────────────────────────────────────────

async function writeXLSX(wb, filename) {
  const XLSX = await import("xlsx");
  XLSX.writeFile(wb, filename);
}

async function newXLSX() {
  const XLSX = await import("xlsx");
  return { XLSX, wb: XLSX.utils.book_new() };
}

// ── PDF helpers ───────────────────────────────────────────────────────────────

async function newPDF() {
  const { jsPDF }              = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const today2 = new Date().toLocaleDateString("pt-BR");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("SIMF — SEDUC/PA", 14, 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(`Gerado em: ${today2}`, 14, 20);
  doc.setTextColor(0);
  return { doc, autoTable, HEADER_COLOR: [0, 113, 206] };
}

const HEAD_STYLE  = (c) => ({ fillColor: c, textColor: 255, fontStyle: "bold", fontSize: 7 });
const BODY_STYLE  = { fontSize: 7, textColor: 50 };
const ALT_STYLE   = { fillColor: [245, 247, 250] };
const CELL_STYLE  = { cellPadding: 2, overflow: "linebreak" };

// ── 1. Extrato individual ─────────────────────────────────────────────────────

async function exportExtratoXLSX({ conta, extrato, exercicio }) {
  const { XLSX, wb } = await newXLSX();
  const ws = XLSX.utils.json_to_sheet(
    extrato.map((r) => ({
      "Data OB":        fmtDate(r.data_ob),
      "Data Crédito":   fmtDate(r.data_transacao),
      Tipo:             r.tipo,
      "Tipo Despesa":   r.tipo_despesa,
      Descrição:        r.descricao ?? "—",
      Valor:            parseFloat(r.valor || 0),
    }))
  );
  XLSX.utils.book_append_sheet(wb, ws, "Extrato");
  XLSX.writeFile(wb, `ACONT_EXTRATO_${conta?.numero_conta?.replace(/[./]/g, "") ?? "CONTA"}_${today()}.xlsx`);
}

async function exportExtratoPDF({ conta, extrato, exercicio }) {
  const { doc, autoTable, HEADER_COLOR } = await newPDF();
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(`Extrato — ${conta?.finalidade ?? ""}`, 14, 28);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(80);
  doc.text(`${conta?.banco} · Ag. ${conta?.agencia} · ${conta?.numero_conta} · Exercício ${exercicio}`, 14, 34);
  doc.setTextColor(0);
  autoTable(doc, {
    startY: 40,
    head: [["Data OB", "Data Crédito", "Tipo", "Tipo Despesa", "Descrição", "Valor"]],
    body: extrato.map((r) => [
      fmtDate(r.data_ob),
      fmtDate(r.data_transacao),
      r.tipo,
      r.tipo_despesa,
      r.descricao ?? "—",
      fmtCurrency(r.valor),
    ]),
    headStyles: HEAD_STYLE(HEADER_COLOR),
    bodyStyles: BODY_STYLE,
    alternateRowStyles: ALT_STYLE,
    styles: CELL_STYLE,
    columnStyles: { 5: { halign: "right" } },
  });
  doc.save(`ACONT_EXTRATO_${conta?.numero_conta?.replace(/[./]/g, "") ?? "CONTA"}_${today()}.pdf`);
}

// ── 2. Extrato consolidado por banco ─────────────────────────────────────────

async function exportExtratoConsolidadoXLSX({ banco, contas, extrato }) {
  const { XLSX, wb } = await newXLSX();
  // Aba resumo
  const wsRes = XLSX.utils.json_to_sheet(
    contas.map((c) => {
      const lancamentos = extrato.filter((e) => e.conta_id === c.id);
      const total = lancamentos.reduce((s, e) => s + parseFloat(e.valor || 0), 0);
      return {
        Finalidade: c.finalidade,
        Agência:    c.agencia,
        Conta:      c.numero_conta,
        Lançamentos: lancamentos.length,
        "Saldo Período": total,
      };
    })
  );
  XLSX.utils.book_append_sheet(wb, wsRes, "Resumo");
  // Aba extrato completo
  const wsExt = XLSX.utils.json_to_sheet(
    extrato.map((r) => ({
      Finalidade:     r.conta?.finalidade ?? "—",
      Conta:          r.conta?.numero_conta ?? "—",
      "Data OB":      fmtDate(r.data_ob),
      "Data Crédito": fmtDate(r.data_transacao),
      Tipo:           r.tipo,
      "Tipo Despesa": r.tipo_despesa,
      Valor:          parseFloat(r.valor || 0),
    }))
  );
  XLSX.utils.book_append_sheet(wb, wsExt, "Extrato Completo");
  XLSX.writeFile(wb, `ACONT_CONSOLIDADO_${banco}_${today()}.xlsx`);
}

// ── 3. Posição de saldos ─────────────────────────────────────────────────────

async function exportPosicaoXLSX({ exercicio, rows }) {
  const { XLSX, wb } = await newXLSX();
  const ws = XLSX.utils.json_to_sheet(
    rows.map((r) => ({
      Banco:           r.banco,
      Agência:         r.agencia,
      Conta:           r.numero_conta,
      Finalidade:      r.finalidade,
      Status:          r.ativo ? "Ativa" : "Inativa",
      Disponibilidade: parseFloat(r.saldo_disponibilidade || 0),
      Razão:           parseFloat(r.saldo_razao           || 0),
      "Extrato CC":    r.saldo_extrato_cc != null ? parseFloat(r.saldo_extrato_cc) : "",
      "Dif. Razão":    Math.abs(parseFloat(r.saldo_disponibilidade || 0) - parseFloat(r.saldo_razao || 0)),
    }))
  );
  XLSX.utils.book_append_sheet(wb, ws, "Posição de Saldos");
  XLSX.writeFile(wb, `ACONT_POSICAO_SALDOS_${exercicio}_${today()}.xlsx`);
}

async function exportPosicaoPDF({ exercicio, rows }) {
  const { doc, autoTable, HEADER_COLOR } = await newPDF();
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(`Posição de Saldos — Exercício ${exercicio}`, 14, 28);
  autoTable(doc, {
    startY: 34,
    head: [["Banco", "Conta", "Finalidade", "Status", "Disponibilidade", "Razão", "Extrato CC", "Dif. Razão"]],
    body: rows.map((r) => {
      const disp  = parseFloat(r.saldo_disponibilidade || 0);
      const razao = parseFloat(r.saldo_razao           || 0);
      const ext   = r.saldo_extrato_cc != null ? parseFloat(r.saldo_extrato_cc) : null;
      return [
        r.banco,
        r.numero_conta,
        r.finalidade,
        r.ativo ? "Ativa" : "Inativa",
        fmtCurrency(disp),
        fmtCurrency(razao),
        ext != null ? fmtCurrency(ext) : "—",
        fmtCurrency(Math.abs(disp - razao)),
      ];
    }),
    headStyles: HEAD_STYLE(HEADER_COLOR),
    bodyStyles: BODY_STYLE,
    alternateRowStyles: ALT_STYLE,
    styles: CELL_STYLE,
    columnStyles: { 4: { halign: "right" }, 5: { halign: "right" }, 6: { halign: "right" }, 7: { halign: "right" } },
  });
  doc.save(`ACONT_POSICAO_SALDOS_${exercicio}_${today()}.pdf`);
}

// ── 4. Divergências ──────────────────────────────────────────────────────────

async function exportDivergenciasXLSX({ exercicio, rows }) {
  const { XLSX, wb } = await newXLSX();
  const ws = XLSX.utils.json_to_sheet(
    rows.map((r) => ({
      Banco:           r.banco,
      Conta:           r.numero_conta,
      Finalidade:      r.finalidade,
      Disponibilidade: parseFloat(r.saldo_disponibilidade || 0),
      Razão:           parseFloat(r.saldo_razao           || 0),
      "Extrato CC":    r.saldo_extrato_cc != null ? parseFloat(r.saldo_extrato_cc) : "",
      "Dif. Razão":    r.diff_razao,
      "Dif. Extrato":  r.diff_extrato ?? "",
    }))
  );
  XLSX.utils.book_append_sheet(wb, ws, "Divergências");
  XLSX.writeFile(wb, `ACONT_DIVERGENCIAS_${exercicio}_${today()}.xlsx`);
}

// ── 5. Consolidado por fonte ─────────────────────────────────────────────────

async function exportFonteXLSX({ exercicio, banco, rows }) {
  const { XLSX, wb } = await newXLSX();
  const ws = XLSX.utils.json_to_sheet(
    rows.map((r) => ({
      Banco:           r.banco,
      "Fonte Recurso": r.fonte,
      "Qtd. Contas":   Number(r.qtd_contas),
      Disponibilidade: parseFloat(r.total_disponibilidade || 0),
      Razão:           parseFloat(r.total_razao           || 0),
    }))
  );
  XLSX.utils.book_append_sheet(wb, ws, "Consolidado por Fonte");
  XLSX.writeFile(wb, `ACONT_CONSOLIDADO_FONTE_${exercicio}_${today()}.xlsx`);
}

// ── 6. Movimentações do período ──────────────────────────────────────────────

async function exportMovimentacoesXLSX({ exercicio, banco, rows }) {
  const { XLSX, wb } = await newXLSX();
  const ws = XLSX.utils.json_to_sheet(
    rows.map((r) => ({
      Banco:          r.conta?.banco ?? "—",
      Conta:          r.conta?.numero_conta ?? "—",
      Finalidade:     r.conta?.finalidade ?? "—",
      "Data OB":      fmtDate(r.data_ob),
      "Data Crédito": fmtDate(r.data_transacao),
      Tipo:           r.tipo,
      "Tipo Despesa": r.tipo_despesa,
      Valor:          parseFloat(r.valor || 0),
    }))
  );
  XLSX.utils.book_append_sheet(wb, ws, "Movimentações");
  XLSX.writeFile(wb, `ACONT_MOVIMENTACOES_${exercicio}_${today()}.xlsx`);
}

// ── Componente base de botão ──────────────────────────────────────────────────

function ExportBtn({ label, loading, onClick, disabled }) {
  return (
    <a
      role="button"
      onClick={disabled || loading ? undefined : onClick}
      className={`inline-flex items-center justify-between px-3 py-2 text-[11px] font-black uppercase tracking-widest border rounded-lg transition-colors ${
        disabled || loading
          ? "text-slate-300 bg-slate-50 border-slate-100 cursor-not-allowed"
          : "text-slate-700 bg-slate-50 border-slate-200 hover:bg-slate-100 cursor-pointer"
      }`}
    >
      {loading ? "Gerando..." : label}
      {!loading && (
        <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="ml-2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
      )}
    </a>
  );
}

// ── Exportar extrato de uma conta ─────────────────────────────────────────────

export function AcontExtratoExportButtons({ contaId, exercicio = "2026" }) {
  const [loading, setLoading] = useState(null);
  const [error,   setError  ] = useState(null);

  async function handle(format) {
    setLoading(format); setError(null);
    try {
      const data = await fetchAcontExtratoExport({ contaId, exercicio });
      if (format === "xlsx") await exportExtratoXLSX(data);
      else                   await exportExtratoPDF(data);
    } catch (e) { setError("Erro ao gerar relatório."); console.error(e); }
    finally { setLoading(null); }
  }

  return (
    <div className="flex flex-col gap-2">
      <ExportBtn label="Extrato XLSX" loading={loading === "xlsx"} onClick={() => handle("xlsx")} />
      <ExportBtn label="Extrato PDF"  loading={loading === "pdf"}  onClick={() => handle("pdf")}  />
      {error && <p className="text-[10px] text-red-500">{error}</p>}
    </div>
  );
}

// ── Exportar consolidado de um banco ─────────────────────────────────────────

export function AcontConsolidadoExportButtons({ banco, exercicio = "2026" }) {
  const [loading, setLoading] = useState(null);
  const [error,   setError  ] = useState(null);

  async function handle() {
    setLoading("xlsx"); setError(null);
    try {
      const data = await fetchAcontExtratoConsolidadoExport({ banco, exercicio });
      await exportExtratoConsolidadoXLSX(data);
    } catch (e) { setError("Erro ao gerar relatório."); console.error(e); }
    finally { setLoading(null); }
  }

  return (
    <div className="flex flex-col gap-2">
      <ExportBtn label="Extrato Consolidado XLSX" loading={loading === "xlsx"} onClick={handle} />
      {error && <p className="text-[10px] text-red-500">{error}</p>}
    </div>
  );
}

// ── Relatórios gerais (posição, divergências, fonte, movimentações) ───────────

export function AcontRelatoriosButtons({ exercicio = "2026", banco = null, dataInicio = null, dataFim = null }) {
  const [loading, setLoading] = useState(null);
  const [error,   setError  ] = useState(null);

  async function handle(tipo, format) {
    const key = `${tipo}-${format}`;
    setLoading(key); setError(null);
    try {
      if (tipo === "posicao") {
        const data = await fetchAcontPosicaoSaldosExport({ exercicio, banco });
        if (format === "xlsx") await exportPosicaoXLSX(data);
        else                   await exportPosicaoPDF(data);
      } else if (tipo === "divergencias") {
        const data = await fetchAcontDivergenciasExport({ exercicio });
        await exportDivergenciasXLSX(data);
      } else if (tipo === "fonte") {
        const data = await fetchAcontConsolidadoFonteExport({ exercicio, banco });
        await exportFonteXLSX(data);
      } else if (tipo === "movimentacoes") {
        const data = await fetchAcontMovimentacoesExport({ exercicio, banco, dataInicio, dataFim });
        await exportMovimentacoesXLSX(data);
      }
    } catch (e) { setError("Erro ao gerar relatório."); console.error(e); }
    finally { setLoading(null); }
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      <ExportBtn label="Posição de Saldos XLSX"       loading={loading === "posicao-xlsx"}       onClick={() => handle("posicao", "xlsx")} />
      <ExportBtn label="Posição de Saldos PDF"        loading={loading === "posicao-pdf"}        onClick={() => handle("posicao", "pdf")} />
      <ExportBtn label="Divergências XLSX"            loading={loading === "divergencias-xlsx"}  onClick={() => handle("divergencias", "xlsx")} />
      <ExportBtn label="Consolidado por Fonte XLSX"   loading={loading === "fonte-xlsx"}         onClick={() => handle("fonte", "xlsx")} />
      <ExportBtn label="Movimentações do Período XLSX" loading={loading === "movimentacoes-xlsx"} onClick={() => handle("movimentacoes", "xlsx")} />
      {error && <p className="text-[10px] text-red-500 col-span-2">{error}</p>}
    </div>
  );
}
