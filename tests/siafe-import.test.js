import test from "node:test";
import assert from "node:assert/strict";

import { detectCsvDelimiter, parseCsv } from "../lib/siafe/csv.js";
import { finalizeBatchSuccess, processSiafeUpload } from "../lib/siafe/importer.js";
import { normalizeRows } from "../lib/siafe/normalize.js";
import {
  REPORT_SCHEMAS,
  REPORT_TYPES,
  getExpectedFileName,
  normalizeReportType
} from "../lib/siafe/schemas.js";
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

test("validate upload selection accepts domain report labels from the upload form", () => {
  const result = validateUploadSelection({
    fileName: "2026_NEDL.csv",
    reportType: "NE+DL",
    yearScope: "2026"
  });

  assert.equal(result.ok, true);
  assert.equal(normalizeReportType("NE+DL"), REPORT_TYPES.NE_DL);
  assert.equal(getExpectedFileName("NE+DL", "2026"), "2026_NEDL.csv");
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

test("parse csv detects semicolon-delimited SIAFE exports", () => {
  const header = REPORT_SCHEMAS[REPORT_TYPES.NE_DL].headers;
  const row = header.map((column) => {
    const values = {
      DocumentodeLiquidacao: "DL-1",
      CodigoNotadeEmpenho: "NE-1",
      "Valor Original": "10,00",
      "Valor Liquido": "10,00",
      "Valor Bruto": "10,00",
      "Valor Retido": "0,00",
      "Valor Pago": "10,00",
      "Valor Liquidado a Pagar": "0,00",
      "Valor Liquido2": "10,00"
    };

    return values[column] ?? `${column}-value`;
  });
  const csvText = `${header.join(";")}\r\n${row.join(";")}`;
  const parsed = parseCsv(csvText);

  assert.equal(detectCsvDelimiter(csvText), ";");
  assert.deepEqual(parsed.header, header);
  assert.equal(parsed.rows[0][9], "10,00");
  assert.equal(validateHeaders("NE+DL", parsed.header).ok, true);
});

test("parse csv strips UTF-8 BOM from the first header", () => {
  const header = REPORT_SCHEMAS[REPORT_TYPES.DL_OB].headers;
  const csvText = `\ufeff${header.join(",")}\r\n${header.map((column) => `${column}-value`).join(",")}`;
  const parsed = parseCsv(csvText);

  assert.deepEqual(parsed.header, header);
  assert.equal(validateHeaders("DL+OB", parsed.header).ok, true);
});

test("validate headers reports the received and expected header contracts", () => {
  assert.throws(
    () => validateHeaders("NE+DL", ["DocumentodeLiquidacao;CodigoNotadeEmpenho"]),
    (error) => {
      assert.equal(error instanceof ImportValidationError, true);
      assert.match(error.details.join("\n"), /Expected header count: 16\. Received header count: 1\./);
      assert.match(error.details.join("\n"), /Expected headers:/);
      assert.match(error.details.join("\n"), /Received headers: DocumentodeLiquidacao;CodigoNotadeEmpenho/);
      return true;
    }
  );
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

function createMockFile(name, contents, type = "text/csv") {
  return {
    name,
    type,
    async arrayBuffer() {
      return Buffer.from(contents, "utf-8");
    }
  };
}

function createFailedBatchSupabaseMock(state) {
  return {
    storage: {
      from() {
        return {
          async upload() {
            state.storageUploads += 1;
            return { error: null };
          }
        };
      }
    },
    from(table) {
      assert.equal(table, "import_batches");

      return {
        insert(payload) {
          state.insertedBatches.push(payload);
          return {
            select() {
              return {
                async single() {
                  return {
                    data: { id: `batch-${state.insertedBatches.length}`, ...payload },
                    error: null
                  };
                }
              };
            }
          };
        }
      };
    }
  };
}

test("structural validation fails before storage upload and still records a failed batch", async () => {
  const state = {
    insertedBatches: [],
    storageUploads: 0
  };

  const file = createMockFile("2026_NEDL.csv", "Wrong,Header\n1,2");

  await assert.rejects(
    () =>
      processSiafeUpload({
        file,
        reportType: REPORT_TYPES.NE_DL,
        yearScope: "2026",
        supabaseClient: createFailedBatchSupabaseMock(state)
      }),
    ImportValidationError
  );

  assert.equal(state.storageUploads, 0);
  assert.equal(state.insertedBatches.length, 1);
  assert.equal(state.insertedBatches[0].status, "failed");
  assert.deepEqual(state.insertedBatches[0].source_headers, ["Wrong", "Header"]);
});

function createSuccessfulImportSupabaseMock(state) {
  let batch = null;

  function createImportBatchQuery() {
    return {
      select() {
        return this;
      },
      eq() {
        return this;
      },
      async maybeSingle() {
        return { data: null, error: null };
      },
      async single() {
        return { data: batch, error: null };
      }
    };
  }

  return {
    storage: {
      from(bucket) {
        state.storageBuckets.push(bucket);

        return {
          async upload(path) {
            state.storageUploads.push(path);
            return { error: null };
          }
        };
      }
    },
    from(table) {
      if (table === "normalized_ne_dl_rows") {
        return {
          async insert(rows) {
            state.normalizedRows.push(...rows);
            return { error: null };
          }
        };
      }

      assert.equal(table, "import_batches");

      return {
        insert(payload) {
          batch = { id: "batch-success", ...payload };
          state.insertedBatches.push(payload);

          return createImportBatchQuery();
        },
        update(payload) {
          state.updatedBatches.push(payload);
          batch = { ...batch, ...payload };

          return {
            eq() {
              return createImportBatchQuery();
            }
          };
        },
        select() {
          return createImportBatchQuery();
        }
      };
    }
  };
}

test("processSiafeUpload accepts form labels and semicolon-delimited SIAFE exports", async () => {
  const header = REPORT_SCHEMAS[REPORT_TYPES.NE_DL].headers;
  const row = header.map((column) => {
    const values = {
      DocumentodeLiquidacao: "DL-1",
      CodigoNotadeEmpenho: "NE-1",
      NUMERO_PROCESSO: "PROC-1",
      "Valor Original": "10,00",
      "Valor Liquido": "10,00",
      "Valor Bruto": "10,00",
      "Valor Retido": "0,00",
      "Valor Pago": "10,00",
      "Valor Liquidado a Pagar": "0,00",
      "Valor Liquido2": "10,00"
    };

    return values[column] ?? `${column}-value`;
  });

  const state = {
    insertedBatches: [],
    normalizedRows: [],
    storageBuckets: [],
    storageUploads: [],
    updatedBatches: []
  };

  const result = await processSiafeUpload({
    file: createMockFile("2025_NEDL.csv", `${header.join(";")}\n${row.join(";")}`),
    reportType: "NE+DL",
    yearScope: "2025",
    supabaseClient: createSuccessfulImportSupabaseMock(state)
  });

  assert.equal(state.insertedBatches[0].report_type, REPORT_TYPES.NE_DL);
  assert.equal(state.storageBuckets[0], "siafe-imports");
  assert.equal(state.normalizedRows[0].codigo_nota_empenho, "NE-1");
  assert.equal(state.normalizedRows[0].valor_original, 10);
  assert.equal(result.reportType, "NE+DL");
  assert.equal(result.status, "success");
});

test("finalizeBatchSuccess uses the active-year database finalizer for 2026 replacements", async () => {
  const state = {
    rpcCalls: [],
    fetchedIds: []
  };

  const supabase = {
    async rpc(name, payload) {
      state.rpcCalls.push({ name, payload });
      return { data: { active_batch_id: payload.p_new_batch_id }, error: null };
    },
    from(table) {
      assert.equal(table, "import_batches");

      return {
        select() {
          return this;
        },
        eq(field, value) {
          if (field === "id") {
            state.fetchedIds.push(value);
          }

          return this;
        },
        async single() {
          return {
            data: {
              id: "batch-2026",
              status: "success",
              report_type: REPORT_TYPES.NE_DL,
              year_scope: "2026",
              normalized_row_count: 12,
              is_active: true
            },
            error: null
          };
        }
      };
    }
  };

  const batch = await finalizeBatchSuccess({
    supabase,
    batchId: "batch-2026",
    reportType: REPORT_TYPES.NE_DL,
    yearScope: "2026",
    header: ["DocumentodeLiquidacao"],
    processedRowCount: 12,
    normalizedRowCount: 12
  });

  assert.equal(state.rpcCalls[0].name, "finalize_siafe_active_import");
  assert.equal(state.rpcCalls[0].payload.p_new_batch_id, "batch-2026");
  assert.equal(state.rpcCalls[0].payload.p_report_type, REPORT_TYPES.NE_DL);
  assert.equal(state.rpcCalls[0].payload.p_year_scope, "2026");
  assert.deepEqual(state.fetchedIds, ["batch-2026"]);
  assert.equal(batch.is_active, true);
  assert.equal(batch.status, "success");
});

test("finalizeBatchSuccess keeps the non-2026 path simple for historical scopes", async () => {
  const state = {
    updatedPayloads: []
  };

  const supabase = {
    from(table) {
      assert.equal(table, "import_batches");

      return {
        update(payload) {
          state.updatedPayloads.push(payload);
          return {
            eq() {
              return {
                select() {
                  return {
                    async single() {
                      return {
                        data: {
                          id: "batch-2025",
                          report_type: REPORT_TYPES.DL_OB,
                          year_scope: "2025",
                          ...payload
                        },
                        error: null
                      };
                    }
                  };
                }
              };
            }
          };
        }
      };
    }
  };

  const batch = await finalizeBatchSuccess({
    supabase,
    batchId: "batch-2025",
    reportType: REPORT_TYPES.DL_OB,
    yearScope: "2025",
    header: ["OrdemBancaria"],
    processedRowCount: 4,
    normalizedRowCount: 4
  });

  assert.equal(state.updatedPayloads[0].status, "success");
  assert.equal(state.updatedPayloads[0].is_active, true);
  assert.equal(batch.year_scope, "2025");
});
