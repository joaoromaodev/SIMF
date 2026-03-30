import test from "node:test";
import assert from "node:assert/strict";

import { parseCsv } from "../lib/siafe/csv.js";
import { finalizeBatchSuccess, processSiafeUpload } from "../lib/siafe/importer.js";
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
