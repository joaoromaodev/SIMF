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
  resolveHeaders,
  validateHeaders,
  validateUploadSelection
} from "../lib/siafe/validation.js";

function buildNeDlHeader(overrides = {}) {
  return [
    overrides.documento_liquidacao ?? "DocumentodeLiquidacao",
    overrides.data_liquidacao ?? "DatadaLiquidacao",
    overrides.codigo_nota_empenho ?? "CodigoNotadeEmpenho",
    overrides.numero_processo ?? "NUMERO_PROCESSO",
    "CodigoProjetoAtividade",
    "CodigoNaturezaDaDespesa",
    "CodigoFonteDeRecurso",
    "CodigoDetalhamentoFr",
    overrides.codigo_unidade_gestora ?? "CodigoUnidadeGestora",
    "Credor_Nome",
    "CONTRATO",
    "CONVENIO",
    "Valor Original",
    "Valor Liquido",
    "Valor Bruto",
    "Valor Retido",
    "Valor Pago",
    "Valor Liquidado a Pagar",
    "Valor Liquido2"
  ];
}

function buildDlObHeader(columns = {}) {
  return [
    columns.documento_liquidacao ?? "DocumentodeLiquidacao",
    columns.data_liquidacao ?? "DatadaLiquidacao",
    columns.numero_processo ?? "NUMERO_PROCESSO",
    columns.ordem_bancaria ?? "OrdemBancaria",
    "CredorDocumento",
    "Credor_Nome",
    "DatadoPagamento",
    "CodigoFonteDeRecurso",
    "CodigoDetalhamentoFr",
    "CodigoUnidadeGestora",
    "CodigoProjetoAtividade",
    "CodigoNaturezaDaDespesa",
    "NomeNaturezaDaDespesa",
    "NomeElementoDeDespesa",
    "Valor"
  ].filter(Boolean);
}

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
    async rpc(name, payload) {
      state.rpcCalls.push({ name, payload });
      return { data: { active_batch_id: payload.p_new_batch_id }, error: null };
    },
    from(table) {
      if (table === "normalized_ne_dl_rows" || table === "normalized_dl_ob_rows") {
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
  assert.match(result.errors.join("\n"), /Only `.csv` files are supported/);
  assert.match(result.errors.join("\n"), /Filename must match the fixed contract/);
});

test("validate upload selection still requires the uploaded file name", () => {
  const result = validateUploadSelection({
    fileName: undefined,
    reportType: REPORT_TYPES.NE_DL,
    yearScope: "2026"
  });

  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /Only `.csv` files are supported/);
});

test("NE_DL accepts columns out of order and extra columns", () => {
  const header = [
    "Valor Pago",
    "CodigoNotadeEmpenho",
    "ColunaExtra",
    "NUMERO_PROCESSO",
    "DocumentodeLiquidacao",
    "DatadaLiquidacao"
  ];

  const resolved = validateHeaders(REPORT_TYPES.NE_DL, header);

  assert.equal(resolved.canonicalIndexByField.documento_liquidacao, 4);
  assert.equal(resolved.canonicalIndexByField.codigo_nota_empenho, 1);
  assert.equal(resolved.canonicalIndexByField.numero_processo, 3);
  assert.deepEqual(resolved.extraHeaders, ["ColunaExtra"]);
  assert.match(resolved.warnings[0], /Ignored extra columns/);
});

test("NE_DL accepts CodigoUnidadeGestora as the preferred header", () => {
  const resolved = validateHeaders(REPORT_TYPES.NE_DL, buildNeDlHeader());

  assert.equal(resolved.headerByField.codigo_unidade_gestora, "CodigoUnidadeGestora");
  assert.equal(resolved.aliasMatches.length, 0);
});

test("NE_DL accepts InstituicaoCodigoUnidadeGestora as a known alias", () => {
  const resolved = validateHeaders(
    REPORT_TYPES.NE_DL,
    buildNeDlHeader({ codigo_unidade_gestora: "InstituicaoCodigoUnidadeGestora" })
  );

  assert.equal(resolved.headerByField.codigo_unidade_gestora, "InstituicaoCodigoUnidadeGestora");
  assert.equal(resolved.aliasMatches[0].preferredHeader, "CodigoUnidadeGestora");
  assert.match(resolved.warnings.join("\n"), /Applied header aliases/);
});

test("NE_DL fails when DocumentodeLiquidacao is missing", () => {
  assert.throws(
    () => validateHeaders(REPORT_TYPES.NE_DL, buildNeDlHeader({ documento_liquidacao: "OutraColuna" })),
    (error) => {
      assert.equal(error instanceof ImportValidationError, true);
      assert.match(error.details.join("\n"), /Missing required headers: DocumentodeLiquidacao/);
      return true;
    }
  );
});

test("NE_DL fails when CodigoNotadeEmpenho is missing", () => {
  assert.throws(
    () => validateHeaders(REPORT_TYPES.NE_DL, buildNeDlHeader({ codigo_nota_empenho: "OutraColuna" })),
    (error) => {
      assert.equal(error instanceof ImportValidationError, true);
      assert.match(error.details.join("\n"), /Missing required headers: CodigoNotadeEmpenho/);
      return true;
    }
  );
});

test("NE_DL fails when NUMERO_PROCESSO is missing", () => {
  assert.throws(
    () => validateHeaders(REPORT_TYPES.NE_DL, buildNeDlHeader({ numero_processo: "OutraColuna" })),
    (error) => {
      assert.equal(error instanceof ImportValidationError, true);
      assert.match(error.details.join("\n"), /Missing required headers: NUMERO_PROCESSO/);
      return true;
    }
  );
});

test("DL_OB accepts columns out of order and extra columns", () => {
  const header = [
    "Valor",
    "ColunaExtra",
    "NUMERO_PROCESSO",
    "DocumentodeLiquidacao",
    "DatadaLiquidacao"
  ];

  const resolved = validateHeaders(REPORT_TYPES.DL_OB, header);

  assert.equal(resolved.canonicalIndexByField.documento_liquidacao, 3);
  assert.equal(resolved.canonicalIndexByField.numero_processo, 2);
  assert.deepEqual(resolved.extraHeaders, ["ColunaExtra"]);
});

test("DL_OB fails when DocumentodeLiquidacao is missing", () => {
  assert.throws(
    () => validateHeaders(REPORT_TYPES.DL_OB, buildDlObHeader({ documento_liquidacao: "OutraColuna" })),
    (error) => {
      assert.equal(error instanceof ImportValidationError, true);
      assert.match(error.details.join("\n"), /Missing required headers: DocumentodeLiquidacao/);
      return true;
    }
  );
});

test("DL_OB fails when NUMERO_PROCESSO is missing", () => {
  assert.throws(
    () => validateHeaders(REPORT_TYPES.DL_OB, buildDlObHeader({ numero_processo: "OutraColuna" })),
    (error) => {
      assert.equal(error instanceof ImportValidationError, true);
      assert.match(error.details.join("\n"), /Missing required headers: NUMERO_PROCESSO/);
      return true;
    }
  );
});

test("DL_OB accepts missing ordem_bancaria because it is optional in this increment", () => {
  const header = [
    "DocumentodeLiquidacao",
    "DatadaLiquidacao",
    "NUMERO_PROCESSO",
    "CredorDocumento",
    "Credor_Nome",
    "DatadoPagamento",
    "CodigoFonteDeRecurso",
    "CodigoDetalhamentoFr",
    "CodigoUnidadeGestora",
    "Valor"
  ];
  const resolved = validateHeaders(REPORT_TYPES.DL_OB, header);

  assert.equal(resolved.missingRequiredFields.length, 0);
  assert.equal(resolved.headerByField.ordem_bancaria, undefined);
});

test("header resolution blocks duplicate mappings to the same canonical field", () => {
  assert.throws(
    () =>
      resolveHeaders(REPORT_TYPES.NE_DL, [
        "DocumentodeLiquidacao",
        "CodigoNotadeEmpenho",
        "NUMERO_PROCESSO",
        "CodigoUnidadeGestora",
        "InstituicaoCodigoUnidadeGestora"
      ]),
    (error) => {
      assert.equal(error instanceof ImportValidationError, true);
      assert.match(error.details.join("\n"), /both map to canonical field `codigo_unidade_gestora`/);
      return true;
    }
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
  const csvText = `${header.join(";")}\r\n${row.join(";")}`;
  const parsed = parseCsv(csvText);
  const valorOriginalIndex = header.indexOf("Valor Original");

  assert.equal(detectCsvDelimiter(csvText), ";");
  assert.deepEqual(parsed.header, header);
  assert.equal(parsed.rows[0][valorOriginalIndex], "10,00");
  assert.equal(validateHeaders("NE+DL", parsed.header).ok, true);
});

test("parse csv strips UTF-8 BOM from the first header", () => {
  const header = REPORT_SCHEMAS[REPORT_TYPES.DL_OB].headers;
  const csvText = `\ufeff${header.join(",")}\r\n${header.map((column) => `${column}-value`).join(",")}`;
  const parsed = parseCsv(csvText);

  assert.deepEqual(parsed.header, header);
  assert.equal(validateHeaders("DL+OB", parsed.header).ok, true);
});

test("validate headers reports the required contract and received header set", () => {
  assert.throws(
    () => validateHeaders("NE+DL", ["DocumentodeLiquidacao;CodigoNotadeEmpenho"]),
    (error) => {
      assert.equal(error instanceof ImportValidationError, true);
      assert.match(error.details.join("\n"), /Expected required headers:/);
      assert.match(error.details.join("\n"), /Received headers: DocumentodeLiquidacao;CodigoNotadeEmpenho/);
      return true;
    }
  );
});

test("normalize rows fails explicitly when called without a resolved header map", () => {
  assert.throws(
    () =>
      normalizeRows(
        REPORT_TYPES.DL_OB,
        ["DocumentodeLiquidacao", "NUMERO_PROCESSO"],
        [["DL-1", "PROC-1"]],
        {
          batchId: "batch-1",
          yearScope: "2026"
        }
      ),
    /requires a resolved header map/
  );
});

test("normalize rows uses the resolved canonical map and fills missing optional fields with null", () => {
  const header = [
    "CredorDocumento",
    "DocumentodeLiquidacao",
    "DatadaLiquidacao",
    "Valor",
    "NUMERO_PROCESSO",
    "Credor_Nome"
  ];
  const rows = [["111", "DL-1", "01/04/2026", "1.234,56", "PROC-1", "Credor OB"]];
  const headerResolution = resolveHeaders(REPORT_TYPES.DL_OB, header);

  const normalized = normalizeRows(
    REPORT_TYPES.DL_OB,
    header,
    rows,
    {
      batchId: "batch-1",
      yearScope: "2026"
    },
    headerResolution
  );

  assert.equal(normalized[0].numero_processo, "PROC-1");
  assert.equal(normalized[0].documento_liquidacao, "DL-1");
  assert.equal(normalized[0].data_liquidacao, "2026-04-01");
  assert.equal(normalized[0].ob_credor_documento, "111");
  assert.equal(normalized[0].ob_credor_nome, "Credor OB");
  assert.equal(normalized[0].ordem_bancaria, null);
  assert.equal(normalized[0].data_pagamento, null);
  assert.equal(normalized[0].valor, 1234.56);
});

test("normalize rows keeps DatadaLiquidacao optional for NE_DL and parses it when present", () => {
  const header = ["DocumentodeLiquidacao", "DatadaLiquidacao", "CodigoNotadeEmpenho", "NUMERO_PROCESSO"];
  const rows = [["DL-10", "17/04/2026", "NE-10", "PROC-10"]];
  const headerResolution = resolveHeaders(REPORT_TYPES.NE_DL, header);

  const normalized = normalizeRows(
    REPORT_TYPES.NE_DL,
    header,
    rows,
    {
      batchId: "batch-10",
      yearScope: "2026"
    },
    headerResolution
  );

  assert.equal(normalized[0].data_liquidacao, "2026-04-17");
});

test("normalize rows keeps DatadaLiquidacao null when absent in legacy files", () => {
  const header = ["DocumentodeLiquidacao", "CodigoNotadeEmpenho", "NUMERO_PROCESSO"];
  const rows = [["DL-20", "NE-20", "PROC-20"]];
  const headerResolution = resolveHeaders(REPORT_TYPES.NE_DL, header);

  const normalized = normalizeRows(
    REPORT_TYPES.NE_DL,
    header,
    rows,
    {
      batchId: "batch-20",
      yearScope: "2025"
    },
    headerResolution
  );

  assert.equal(normalized[0].data_liquidacao, null);
});

test("static scopes reject replacement when an active batch already exists", () => {
  assert.throws(
    () => ensureStaticScopeCanImport({ id: "existing-batch" }, "2025"),
    ImportValidationError
  );

  assert.doesNotThrow(() => ensureStaticScopeCanImport({ id: "existing-batch" }, "2026"));
});

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

test("processSiafeUpload persists NE_DL rows with flexible headers and warnings", async () => {
  const header = [
    "Valor Original",
    "DocumentodeLiquidacao",
    "DatadaLiquidacao",
    "CodigoNotadeEmpenho",
    "NUMERO_PROCESSO",
    "InstituicaoCodigoUnidadeGestora",
    "ColunaExtra"
  ];
  const row = ["10,00", "DL-1", "17/04/2026", "NE-1", "PROC-1", "UG-1", "IGNORAR"];
  const state = {
    insertedBatches: [],
    normalizedRows: [],
    storageBuckets: [],
    storageUploads: [],
    updatedBatches: [],
    rpcCalls: []
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
  assert.equal(state.normalizedRows[0].data_liquidacao, "2026-04-17");
  assert.equal(state.normalizedRows[0].codigo_unidade_gestora, "UG-1");
  assert.equal(state.normalizedRows[0].valor_original, 10);
  assert.equal(state.normalizedRows[0].valor_pago, null);
  assert.equal(result.reportType, "NE+DL");
  assert.equal(result.status, "success");
  assert.match(result.warnings.join("\n"), /Ignored extra columns/);
  assert.match(result.warnings.join("\n"), /Applied header aliases/);
});

test("processSiafeUpload keeps yearScope in the persisted normalized rows", async () => {
  const header = ["DocumentodeLiquidacao", "DatadaLiquidacao", "NUMERO_PROCESSO"];
  const row = ["DL-1", "05/04/2026", "PROC-1"];
  const state = {
    insertedBatches: [],
    normalizedRows: [],
    storageBuckets: [],
    storageUploads: [],
    updatedBatches: [],
    rpcCalls: []
  };

  await processSiafeUpload({
    file: createMockFile("2026_DLOB.csv", `${header.join(",")}\n${row.join(",")}`),
    reportType: "DL+OB",
    yearScope: "2026",
    supabaseClient: createSuccessfulImportSupabaseMock(state)
  });

  assert.equal(state.normalizedRows[0].year_scope, "2026");
  assert.equal(state.normalizedRows[0].data_liquidacao, "2026-04-05");
  assert.equal(state.rpcCalls[0].name, "finalize_siafe_active_import");
  assert.equal(state.rpcCalls[0].payload.p_year_scope, "2026");
});

test("processSiafeUpload still rejects an upload with no file name", async () => {
  const state = {
    insertedBatches: [],
    storageUploads: 0
  };

  await assert.rejects(
    () =>
      processSiafeUpload({
        file: createMockFile(undefined, "DocumentodeLiquidacao,NUMERO_PROCESSO\nDL-1,PROC-1"),
        reportType: REPORT_TYPES.DL_OB,
        yearScope: "2026",
        supabaseClient: createFailedBatchSupabaseMock(state)
      }),
    ImportValidationError
  );

  assert.equal(state.insertedBatches[0].original_file_name, "unknown.csv");
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
