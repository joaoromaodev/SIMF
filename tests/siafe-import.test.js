import test from "node:test";
import assert from "node:assert/strict";

import { parseCsv } from "../lib/siafe/csv.js";
import { normalizeRows } from "../lib/siafe/normalize.js";
import { REPORT_TYPES, getExpectedFileName } from "../lib/siafe/schemas.js";
import {
  ImportValidationError,
  ensureStaticScopeCanImport,
  validateHeaders,
  validateUploadSelection
} from "../lib/siafe/validation.js";

test("validate upload selection enforces exact filename contract", () => {
  const result = validateUploadSelection({
    fileName: "2026_NEDL.csv",
    reportType: REPORT_TYPES.NE_DL,
    yearScope: "2026"
  });

  assert.equal(result.ok, true);
  assert.equal(getExpectedFileName(REPORT_TYPES.NE_DL, "2026"), "2026_NEDL.csv");
});

test("validate upload selection rejects wrong filename and extension", () => {
  const result = validateUploadSelection({
    fileName: "notes.xlsx",
    reportType: REPORT_TYPES.DL_OB,
    yearScope: "2025"
  });

  assert.equal(result.ok, false);
  assert.match(result.errors[0], /Only `.csv` files are supported/);
});

test("validate headers accepts exact NE+DL schema and rejects extra columns", () => {
  const header = [
    "DocumentodeLiquidacao",
    "CodigoNotadeEmpenho",
    "CodigoPlanoInterno",
    "CodigoProjetoAtividade",
    "CodigoNaturezaDaDespesa",
    "CodigoFonteDeRecurso",
    "CodigoDetalhamentoFr",
    "NUMERO_PROCESSO",
    "InstituicaoCodigoUnidadeGestora",
    "Valor Original",
    "Valor Liquido",
    "Valor Bruto",
    "Valor Retido",
    "Valor Pago",
    "Valor Liquidado a Pagar",
    "Valor Liquido2"
  ];

  assert.deepEqual(validateHeaders(REPORT_TYPES.NE_DL, header).expected, header);

  assert.throws(
    () => validateHeaders(REPORT_TYPES.NE_DL, [...header, "Unexpected"]),
    ImportValidationError
  );
});

test("parse csv handles quoted commas", () => {
  const csvText = 'ColA,ColB\n"value, one","two"';
  const parsed = parseCsv(csvText);

  assert.deepEqual(parsed.header, ["ColA", "ColB"]);
  assert.deepEqual(parsed.rows, [["value, one", "two"]]);
});

test("normalize rows preserves distinct DL and OB creditor fields", () => {
  const header = [
    "OrdemBancaria",
    "CredorDocumento",
    "Credor_Nome",
    "DatadoPagamento",
    "CodigoFonteDeRecurso",
    "CodigoDetalhamentoFr",
    "DocumentodeLiquidacao",
    "DocumentoCredor",
    "NomeCredor",
    "NUMERO_PROCESSO",
    "CodigoUnidadeGestora",
    "Valor"
  ];

  const rows = [
    [
      "OB-1",
      "111",
      "Credor OB",
      "31/03/2026",
      "F1",
      "D1",
      "DL-1",
      "222",
      "Credor DL",
      "PROC-1",
      "UG-1",
      "1.234,56"
    ]
  ];

  const normalized = normalizeRows(REPORT_TYPES.DL_OB, header, rows, {
    batchId: "batch-1",
    yearScope: "2026"
  });

  assert.equal(normalized[0].ob_credor_documento, "111");
  assert.equal(normalized[0].dl_documento_credor, "222");
  assert.equal(normalized[0].data_pagamento, "2026-03-31");
  assert.equal(normalized[0].valor, 1234.56);
});

test("static scopes reject replacement when an active batch already exists", () => {
  assert.throws(
    () => ensureStaticScopeCanImport({ id: "existing-batch" }, "2025"),
    ImportValidationError
  );

  assert.doesNotThrow(() => ensureStaticScopeCanImport({ id: "existing-batch" }, "2026"));
});

