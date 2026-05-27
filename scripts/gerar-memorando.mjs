import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, BorderStyle, HeadingLevel,
  UnderlineType, ShadingType, convertInchesToTwip
} from "docx";
import { writeFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "..", "MEMORANDO_SIMF_SIAFE_2026.docx");

// ── helpers ──────────────────────────────────────────────────────────────────

const FONT = "Arial";
const SZ   = 22;   // 11pt em half-points
const SZ_H = 24;   // 12pt

function p(children, opts = {}) {
  return new Paragraph({
    alignment: opts.align ?? AlignmentType.JUSTIFIED,
    spacing: { after: opts.after ?? 160, before: opts.before ?? 0, line: 276, lineRule: "auto" },
    indent: opts.indent ?? undefined,
    children: Array.isArray(children) ? children : [children],
  });
}

function t(text, opts = {}) {
  return new TextRun({
    text,
    font: FONT,
    size: opts.size ?? SZ,
    bold:      opts.bold      ?? false,
    italics:   opts.italic    ?? false,
    underline: opts.underline ? { type: UnderlineType.SINGLE } : undefined,
    color:     opts.color     ?? "000000",
  });
}

function bold(text, opts = {})   { return t(text, { ...opts, bold: true }); }
function italic(text, opts = {}) { return t(text, { ...opts, italic: true }); }

function separator() {
  return new Paragraph({
    spacing: { after: 80, before: 80 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "AAAAAA" } },
    children: [],
  });
}

function blankLine(after = 200) {
  return new Paragraph({ spacing: { after }, children: [] });
}

function heading(text) {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { after: 120, before: 240 },
    children: [
      new TextRun({ text, font: FONT, size: SZ, bold: true, color: "1F3864" }),
    ],
  });
}

// ── tabela ───────────────────────────────────────────────────────────────────

function dataRow(cells, isHeader = false) {
  return new TableRow({
    tableHeader: isHeader,
    children: cells.map((txt, i) =>
      new TableCell({
        shading: isHeader
          ? { type: ShadingType.CLEAR, fill: "1F3864" }
          : i % 2 === 0
            ? { type: ShadingType.CLEAR, fill: "EEF2F7" }
            : { type: ShadingType.CLEAR, fill: "FFFFFF" },
        margins: { top: 60, bottom: 60, left: 80, right: 80 },
        children: [
          new Paragraph({
            alignment: AlignmentType.LEFT,
            children: [
              new TextRun({
                text: txt,
                font: FONT,
                size: 18,
                bold: isHeader,
                color: isHeader ? "FFFFFF" : "000000",
              }),
            ],
          }),
        ],
      })
    ),
  });
}

function table(headers, rows) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top:           { style: BorderStyle.SINGLE, size: 4, color: "1F3864" },
      bottom:        { style: BorderStyle.SINGLE, size: 4, color: "1F3864" },
      left:          { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" },
      right:         { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" },
      insideH:       { style: BorderStyle.SINGLE, size: 2, color: "CCCCCC" },
      insideV:       { style: BorderStyle.SINGLE, size: 2, color: "CCCCCC" },
    },
    rows: [
      dataRow(headers, true),
      ...rows.map(r => dataRow(r)),
    ],
  });
}

// ── documento ────────────────────────────────────────────────────────────────

const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: FONT, size: SZ },
        paragraph: { spacing: { line: 276, lineRule: "auto" } },
      },
    },
  },
  sections: [
    {
      properties: {
        page: {
          margin: {
            top:    convertInchesToTwip(1.18),
            bottom: convertInchesToTwip(1.18),
            left:   convertInchesToTwip(1.38),
            right:  convertInchesToTwip(1.18),
          },
        },
      },
      children: [

        // ── Cabeçalho institucional ──────────────────────────────────────────
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 40 },
          children: [
            new TextRun({ text: "GOVERNO DO ESTADO DO PARÁ", font: FONT, size: 18, bold: true, color: "1F3864" }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 40 },
          children: [
            new TextRun({ text: "SECRETARIA DE ESTADO DE EDUCAÇÃO — SEDUC/PA", font: FONT, size: 18, bold: true, color: "1F3864" }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 40 },
          children: [
            new TextRun({ text: "Secretaria Adjunta de Planejamento e Finanças — SAPF", font: FONT, size: 18, color: "444444" }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 40 },
          children: [
            new TextRun({ text: "Diretoria de Finanças — DFIN  |  Diretoria de Pagamento e Prestação de Contas — DPPC", font: FONT, size: 18, color: "444444" }),
          ],
        }),

        separator(),
        blankLine(120),

        // ── Identificação do memorando ──────────────────────────────────────
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 60 },
          children: [
            new TextRun({ text: "MEMORANDO INTERNO Nº ___/2026 — DFIN/SAPF", font: FONT, size: SZ_H, bold: true, color: "1F3864" }),
          ],
        }),

        blankLine(80),

        // ── Destinatário / remetente / data ─────────────────────────────────
        p([bold("Para:   "), t("[Nome completo], [Cargo] — [Setor/SETIC ou equivalente]")]),
        p([bold("De:     "), t("[Nome de Franz], Diretor de Finanças — DFIN/SAPF/SEDUC")]),
        p([bold("        "), t("Cláudia [Sobrenome], Diretora de Pagamento e Prestação de Contas — DPPC/SAPF/SEDUC")]),
        p([bold("Data:   "), t("Belém, 27 de maio de 2026")]),
        p([bold("Assunto: "), t("Solicitação de acesso estruturado à base de dados do SIAFE para integração com o SIMF")]),

        separator(),
        blankLine(120),

        // ── 1. Apresentação ─────────────────────────────────────────────────
        heading("1. Apresentação"),

        p(t("As Diretorias de Finanças (DFIN) e de Pagamento e Prestação de Contas (DPPC) conduzem, em caráter interno, o desenvolvimento do SIMF — Sistema Integrado de Monitoramento Financeiro da SEDUC/PA, plataforma operacional de acompanhamento das finanças da Secretaria, voltada às equipes da SAPF. O sistema está em operação no servidor interno da Secretaria e contempla dois eixos principais de monitoramento:")),

        blankLine(60),

        p([bold("a) Fluxo de Pagamento"), t(" — acompanhamento do ciclo completo de execução financeira, desde a emissão da Nota de Empenho (NE) até a liquidação e a emissão da Ordem Bancária (OB), com visibilidade sobre valores empenhados, liquidados, pagos e a pagar, por fonte de recurso, ação e unidade gestora.")]),

        blankLine(40),

        p([bold("b) Movimentação de Contas Bancárias"), t(" — acompanhamento dos saldos e da movimentação das contas correntes da SEDUC junto aos bancos conveniados (BB, Banpará e CEF), com conferência cruzada entre disponibilidade contábil, razão bancário, aplicação financeira e extrato de conta corrente.")]),

        blankLine(80),

        // ── 2. Situação atual ───────────────────────────────────────────────
        heading("2. Situação Atual e Problema"),

        p(t("Para manter o SIMF alimentado com dados atualizados, a equipe da SAPF realiza hoje a extração manual de 9 (nove) relatórios do SIAFE, sendo 3 (três) deles com necessidade de atualização diária para acompanhamento do exercício de 2026. Esse processo:")),

        blankLine(40),

        p([t("—  "), t("Demanda tempo diário da equipe técnica a cada ciclo de atualização;")],   { indent: { left: 360 } }),
        p([t("—  "), t("Está sujeito a inconsistências decorrentes de extração e digitação manual;")], { indent: { left: 360 } }),
        p([t("—  "), t("Gera defasagem entre o dado registrado no SIAFE e o dado disponível para análise no SIMF;")], { indent: { left: 360 } }),
        p([t("—  "), bold("Não cobre uma lacuna crítica de visibilidade:"), t(" Ordens Bancárias emitidas por outras Unidades Gestoras em favor da SEDUC chegam creditadas nas contas bancárias sem que seja possível rastrear, pelo acesso atual, a OB de origem — o que impede a conferência completa do ciclo NE → Liquidação → OB.")], { indent: { left: 360 } }),

        blankLine(80),

        // ── 3. Solicitação ──────────────────────────────────────────────────
        heading("3. Solicitação"),

        p(t("Solicito a V.Sa., na condição de responsável técnico pelo SIAFE nesta Secretaria, a disponibilização de acesso estruturado de leitura à base de dados do sistema, contemplando os dois eixos do SIMF descritos a seguir.")),

        blankLine(100),

        new Paragraph({
          spacing: { after: 80 },
          children: [bold("Eixo 1 — Fluxo de Pagamento (NE → Liquidação → OB)", { color: "1F3864" })],
        }),

        table(
          ["Dado", "Granularidade", "Frequência"],
          [
            ["Notas de Empenho emitidas",        "UG / Fonte / Ação / Credor",                   "Diária"],
            ["Liquidações registradas",           "NE de origem / Valor / Data",                  "Diária"],
            ["Ordens Bancárias emitidas",         "Todas as UGs / Conta debitada / Valor / Data", "Diária"],
            ["Saldo a liquidar e a pagar",        "Por fonte e ação",                             "Diária"],
          ]
        ),

        blankLine(120),

        new Paragraph({
          spacing: { after: 80 },
          children: [bold("Eixo 2 — Movimentação de Contas Bancárias", { color: "1F3864" })],
        }),

        table(
          ["Dado", "Granularidade", "Frequência"],
          [
            ["Saldo de disponibilidade contábil", "Por conta / Fonte de recurso", "Mensal"],
            ["Saldo razão bancário",              "Por conta",                    "Mensal"],
            ["Saldo de aplicação financeira",     "Por conta",                    "Mensal"],
            ["Movimentações de crédito e débito", "Por conta / Data / Tipo",      "Diária"],
          ]
        ),

        blankLine(100),

        p([italic("Nota:"), t(" a integração se dará exclusivamente via conexão de leitura — sem nenhuma escrita, alteração ou impacto sobre a base do SIAFE.")]),

        blankLine(80),

        // ── 4. Benefícios ───────────────────────────────────────────────────
        heading("4. Benefícios Esperados"),

        p([t("—  "), t("Eliminação dos 9 relatórios de extração manual atualmente realizados pela equipe da SAPF;")], { indent: { left: 360 } }),
        p([t("—  "), t("Dados sempre atualizados e íntegros, sem risco de erro humano na importação;")], { indent: { left: 360 } }),
        p([t("—  "), t("Fechamento da lacuna de visibilidade sobre OBs de outras UGs, garantindo conferência completa do ciclo de pagamento;")], { indent: { left: 360 } }),
        p([t("—  "), t("Redução de demandas ad hoc dirigidas à equipe do SIAFE pela SAPF;")], { indent: { left: 360 } }),
        p([t("—  "), t("Fortalecimento do controle interno financeiro da SEDUC, com rastreabilidade de ponta a ponta do fluxo NE → OB.")], { indent: { left: 360 } }),

        blankLine(80),

        // ── 5. Encaminhamento ───────────────────────────────────────────────
        heading("5. Encaminhamento"),

        p(t("Solicito que V.Sa. avalie a viabilidade técnica e retorne com proposta de escopo e prazo para implementação. Esta Diretoria coloca à disposição a equipe responsável pelo SIMF para reunião técnica de alinhamento quando conveniente a V.Sa.")),

        p(t("Certo do empenho de V.Sa. nesta demanda, agradeço antecipadamente.")),

        blankLine(400),

        // ── Assinaturas lado a lado ─────────────────────────────────────────
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top:     { style: BorderStyle.NONE },
            bottom:  { style: BorderStyle.NONE },
            left:    { style: BorderStyle.NONE },
            right:   { style: BorderStyle.NONE },
            insideH: { style: BorderStyle.NONE },
            insideV: { style: BorderStyle.NONE },
          },
          rows: [
            new TableRow({
              children: [
                // Franz
                new TableCell({
                  width: { size: 50, type: WidthType.PERCENTAGE },
                  margins: { top: 0, bottom: 0, left: 0, right: 200 },
                  children: [
                    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 }, children: [new TextRun({ text: "_".repeat(38), font: FONT, size: SZ })] }),
                    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 }, children: [bold("[Nome de Franz]")] }),
                    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 }, children: [t("Diretor de Finanças — DFIN")] }),
                    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 }, children: [t("SAPF/SEDUC/PA")] }),
                  ],
                }),
                // Cláudia
                new TableCell({
                  width: { size: 50, type: WidthType.PERCENTAGE },
                  margins: { top: 0, bottom: 0, left: 200, right: 0 },
                  children: [
                    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 }, children: [new TextRun({ text: "_".repeat(38), font: FONT, size: SZ })] }),
                    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 }, children: [bold("Cláudia [Sobrenome]")] }),
                    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 }, children: [t("Diretora de Pagamento e Prestação de Contas — DPPC")] }),
                    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 }, children: [t("SAPF/SEDUC/PA")] }),
                  ],
                }),
              ],
            }),
          ],
        }),

      ],
    },
  ],
});

const buffer = await Packer.toBuffer(doc);
writeFileSync(OUT, buffer);
console.log("✅  Documento gerado:", OUT);
