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

function buildNeHeader(overrides = {}) {
  return [
    overrides.codigo_nota_empenho ?? "CodigoNotadeEmpenho",
    "DatadoEmpenho",
    "NomeUsuarioQueCriou",
    overrides.codigo_unidade_gestora ?? "InstituicaoCodigoUnidadeGestora",
    overrides.numero_processo ?? "NUMERO_PROCESSO",
    "Valor Original",
    "Valor Corrente",
    "Saldo a Liquidar",
    "Quantidade"
  ];
}

function buildNedlHeader(overrides = {}) {
  return [
    overrides.documento_liquidacao ?? "DocumentodeLiquidacao",
    "DatadaLiquidacao",
    overrides.codigo_nota_empenho ?? "CodigoNotadeEmpenho",
    "CodigoNaturezaDaDespesa",
    "NomeFonteDeRecurso",
    "CodigoFonteDeRecurso",
    "NomeDetalhamentoFr",
    "CodigoDetalhamentoFr",
    overrides.numero_processo ?? "NUMERO_PROCESSO",
    "CodigoProjetoAtividade",
    overrides.credor_nome ?? "NomeCredor",
    "CONTRATO",
    "CONVENIO",
    "Valor Original",
    "Valor Liquido",
    "Valor Bruto",
    "Valor Retido",
    "Valor Pago",
    "Valor Liquidado a Pagar"
  ];
}

function buildDlobHeader(overrides = {}) {
  return [
    overrides.ordem_bancaria ?? "OrdemBancaria",
    "DatadoPagamento",
    overrides.documento_liquidacao ?? "DocumentodaLiquidacao",
    "CodigoUnidadeGestora",
    "NomeUsuarioQueCriou",
    "Finalidade",
    "Valor"
  ];
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
      batch = {
        ...batch,
        status: "success",
        source_headers: payload.p_source_headers,
        processed_row_count: payload.p_processed_row_count,
        normalized_row_count: payload.p_normalized_row_count,
        is_active: true
      };
      return { data: { active_batch_id: payload.p_new_batch_id }, error: null };
    },
    from(table) {
      if (["normalized_ne_rows", "normalized_nedl_rows", "normalized_dlob_rows"].includes(table)) {
        return {
          async insert(rows) {
            state.normalizedTable = table;
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

test("validate upload selection enforces the nine official filenames", () => {
  const expected = [
    ["2023_2024", REPORT_TYPES.NE, "2023_2024_NE.csv"],
    ["2025", REPORT_TYPES.NE, "2025_NE.csv"],
    ["2026", REPORT_TYPES.NE, "2026_NE.csv"],
    ["2023_2024", REPORT_TYPES.NEDL, "2023_2024_NEDL.csv"],
    ["2025", REPORT_TYPES.NEDL, "2025_NEDL.csv"],
    ["2026", REPORT_TYPES.NEDL, "2026_NEDL.csv"],
    ["2023_2024", REPORT_TYPES.DLOB, "2023_2024_DLOB.csv"],
    ["2025", REPORT_TYPES.DLOB, "2025_DLOB.csv"],
    ["2026", REPORT_TYPES.DLOB, "2026_DLOB.csv"]
  ];

  for (const [yearScope, reportType, fileName] of expected) {
    assert.equal(getExpectedFileName(reportType, yearScope), fileName);
    assert.equal(validateUploadSelection({ fileName, reportType, yearScope }).ok, true);
  }
});

test("legacy report labels normalize to official report types", () => {
  assert.equal(normalizeReportType("NE+DL"), REPORT_TYPES.NEDL);
  assert.equal(normalizeReportType("NE_DL"), REPORT_TYPES.NEDL);
  assert.equal(normalizeReportType("DL+OB"), REPORT_TYPES.DLOB);
  assert.equal(normalizeReportType("DL_OB"), REPORT_TYPES.DLOB);
  assert.equal(getExpectedFileName("NE+DL", "2026"), "2026_NEDL.csv");
  assert.equal(getExpectedFileName("DL_OB", "2026"), "2026_DLOB.csv");
});

test("validate upload selection rejects wrong filename, extension, and report type", () => {
  const result = validateUploadSelection({
    fileName: "notes.xlsx",
    reportType: "UNKNOWN",
    yearScope: "2025"
  });

  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /Only `.csv` files are supported/);
  assert.match(result.errors.join("\n"), /Report type must be one of `NE`, `NEDL`, or `DLOB`/);
  assert.doesNotMatch(result.errors.join("\n"), /NE\+DL|DL\+OB/);
});

test("NE validates required headers and warns for extra columns", () => {
  const header = [
    "Valor Original",
    "CodigoNotadeEmpenho",
    "ColunaExtra",
    "NUMERO_PROCESSO",
    "DatadoEmpenho"
  ];

  const resolved = validateHeaders(REPORT_TYPES.NE, header);

  assert.equal(resolved.canonicalIndexByField.codigo_nota_empenho, 1);
  assert.equal(resolved.canonicalIndexByField.numero_processo, 3);
  assert.deepEqual(resolved.extraHeaders, ["ColunaExtra"]);
  assert.match(resolved.warnings[0], /Ignored extra columns/);
});

test("NE fails when CodigoNotadeEmpenho or NUMERO_PROCESSO is missing", () => {
  assert.throws(
    () => validateHeaders(REPORT_TYPES.NE, buildNeHeader({ codigo_nota_empenho: "OutraColuna" })),
    (error) => {
      assert.equal(error instanceof ImportValidationError, true);
      assert.match(error.details.join("\n"), /Missing required headers: CodigoNotadeEmpenho/);
      return true;
    }
  );

  assert.throws(
    () => validateHeaders(REPORT_TYPES.NE, buildNeHeader({ numero_processo: "OutraColuna" })),
    (error) => {
      assert.equal(error instanceof ImportValidationError, true);
      assert.match(error.details.join("\n"), /Missing required headers: NUMERO_PROCESSO/);
      return true;
    }
  );
});

test("NE accepts CodigoUnidadeGestora as a controlled alias", () => {
  const resolved = validateHeaders(
    REPORT_TYPES.NE,
    buildNeHeader({ codigo_unidade_gestora: "CodigoUnidadeGestora" })
  );

  assert.equal(resolved.headerByField.codigo_unidade_gestora, "CodigoUnidadeGestora");
  assert.equal(resolved.aliasMatches[0].preferredHeader, "InstituicaoCodigoUnidadeGestora");
  assert.match(resolved.warnings.join("\n"), /Applied header aliases/);
});

test("NEDL validates liquidation, empenho, and process headers", () => {
  const resolved = validateHeaders(REPORT_TYPES.NEDL, buildNedlHeader());

  assert.equal(resolved.headerByField.documento_liquidacao, "DocumentodeLiquidacao");
  assert.equal(resolved.headerByField.codigo_nota_empenho, "CodigoNotadeEmpenho");
  assert.equal(resolved.headerByField.numero_processo, "NUMERO_PROCESSO");
});

test("NEDL accepts Credor_Nome as a controlled alias for NomeCredor", () => {
  const resolved = validateHeaders(REPORT_TYPES.NEDL, buildNedlHeader({ credor_nome: "Credor_Nome" }));

  assert.equal(resolved.headerByField.credor_nome, "Credor_Nome");
  assert.match(resolved.warnings.join("\n"), /Applied header aliases/);
});

test("NEDL fails when required headers are missing", () => {
  assert.throws(
    () => validateHeaders(REPORT_TYPES.NEDL, buildNedlHeader({ documento_liquidacao: "OutraColuna" })),
    (error) => {
      assert.equal(error instanceof ImportValidationError, true);
      assert.match(error.details.join("\n"), /Missing required headers: DocumentodeLiquidacao/);
      return true;
    }
  );

  assert.throws(
    () => validateHeaders(REPORT_TYPES.NEDL, buildNedlHeader({ codigo_nota_empenho: "OutraColuna" })),
    (error) => {
      assert.equal(error instanceof ImportValidationError, true);
      assert.match(error.details.join("\n"), /Missing required headers: CodigoNotadeEmpenho/);
      return true;
    }
  );
});

test("DLOB validates OB and liquidation document without NUMERO_PROCESSO", () => {
  const resolved = validateHeaders(REPORT_TYPES.DLOB, buildDlobHeader());

  assert.equal(resolved.headerByField.ordem_bancaria, "OrdemBancaria");
  assert.equal(resolved.headerByField.documento_liquidacao, "DocumentodaLiquidacao");
  assert.equal(resolved.headerByField.numero_processo, undefined);
});

test("DLOB does not require NUMERO_PROCESSO even when the header is absent", () => {
  const header = ["OrdemBancaria", "DocumentodaLiquidacao", "NUMERO_PROCESSO", "Valor"];
  const resolved = validateHeaders(REPORT_TYPES.DLOB, header);

  assert.equal(resolved.missingRequiredFields.length, 0);
  assert.deepEqual(resolved.extraHeaders, ["NUMERO_PROCESSO"]);
  assert.match(resolved.warnings[0], /Ignored extra columns/);
});

test("DLOB accepts legacy DocumentodeLiquidacao as a controlled alias", () => {
  const resolved = validateHeaders(
    REPORT_TYPES.DLOB,
    buildDlobHeader({ documento_liquidacao: "DocumentodeLiquidacao" })
  );

  assert.equal(resolved.headerByField.documento_liquidacao, "DocumentodeLiquidacao");
  assert.equal(resolved.aliasMatches[0].preferredHeader, "DocumentodaLiquidacao");
});

test("DLOB fails when OrdemBancaria or DocumentodaLiquidacao is missing", () => {
  assert.throws(
    () => validateHeaders(REPORT_TYPES.DLOB, buildDlobHeader({ ordem_bancaria: "OutraColuna" })),
    (error) => {
      assert.equal(error instanceof ImportValidationError, true);
      assert.match(error.details.join("\n"), /Missing required headers: OrdemBancaria/);
      return true;
    }
  );

  assert.throws(
    () => validateHeaders(REPORT_TYPES.DLOB, buildDlobHeader({ documento_liquidacao: "OutraColuna" })),
    (error) => {
      assert.equal(error instanceof ImportValidationError, true);
      assert.match(error.details.join("\n"), /Missing required headers: DocumentodaLiquidacao/);
      return true;
    }
  );
});

test("header resolution blocks duplicate mappings to the same canonical field", () => {
  assert.throws(
    () =>
      resolveHeaders(REPORT_TYPES.NE, [
        "CodigoNotadeEmpenho",
        "NUMERO_PROCESSO",
        "InstituicaoCodigoUnidadeGestora",
        "CodigoUnidadeGestora"
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
  const header = REPORT_SCHEMAS[REPORT_TYPES.NE].headers;
  const row = header.map((column) => {
    const values = {
      CodigoNotadeEmpenho: "NE-1",
      NUMERO_PROCESSO: "PROC-1",
      "Valor Original": "10,00"
    };

    return values[column] ?? `${column}-value`;
  });
  const csvText = `${header.join(";")}\r\n${row.join(";")}`;
  const parsed = parseCsv(csvText);
  const valorOriginalIndex = header.indexOf("Valor Original");

  assert.equal(detectCsvDelimiter(csvText), ";");
  assert.deepEqual(parsed.header, header);
  assert.equal(parsed.rows[0][valorOriginalIndex], "10,00");
  assert.equal(validateHeaders(REPORT_TYPES.NE, parsed.header).ok, true);
});

test("parse csv strips UTF-8 BOM from the first header", () => {
  const header = REPORT_SCHEMAS[REPORT_TYPES.DLOB].headers;
  const csvText = `\ufeff${header.join(",")}\r\n${header.map((column) => `${column}-value`).join(",")}`;
  const parsed = parseCsv(csvText);

  assert.deepEqual(parsed.header, header);
  assert.equal(validateHeaders(REPORT_TYPES.DLOB, parsed.header).ok, true);
});

test("validate headers reports the required contract and received header set", () => {
  assert.throws(
    () => validateHeaders(REPORT_TYPES.NEDL, ["DocumentodeLiquidacao;CodigoNotadeEmpenho"]),
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
        REPORT_TYPES.DLOB,
        ["OrdemBancaria", "DocumentodaLiquidacao"],
        [["OB-1", "DL-1"]],
        {
          batchId: "batch-1",
          yearScope: "2026"
        }
      ),
    /requires a resolved header map/
  );
});

test("normalize rows maps NE fields, dates, money, and year scope", () => {
  const header = buildNeHeader();
  const rows = [["NE-1", "17/04/2026", "Usuario", "UG-1", "PROC-1", "R$ 6,092.04", "1.234,56", "10,00", "2"]];
  const headerResolution = resolveHeaders(REPORT_TYPES.NE, header);

  const normalized = normalizeRows(
    REPORT_TYPES.NE,
    header,
    rows,
    {
      batchId: "batch-ne",
      yearScope: "2026"
    },
    headerResolution
  );

  assert.equal(normalized[0].codigo_nota_empenho, "NE-1");
  assert.equal(normalized[0].numero_processo, "PROC-1");
  assert.equal(normalized[0].data_empenho, "2026-04-17");
  assert.equal(normalized[0].valor_original, 6092.04);
  assert.equal(normalized[0].valor_corrente, 1234.56);
  assert.equal(normalized[0].saldo_a_liquidar, 10);
  assert.equal(normalized[0].quantidade, 2);
  assert.equal(normalized[0].import_batch_id, "batch-ne");
  assert.equal(normalized[0].source_row_number, 2);
  assert.equal(normalized[0].year_scope, "2026");
  assert.equal(normalized[0].raw_row.CodigoNotadeEmpenho, "NE-1");
});

test("normalize rows parses short SIAFE dates in NE, NEDL, and DLOB", () => {
  const neHeader = buildNeHeader();
  const neHeaderResolution = resolveHeaders(REPORT_TYPES.NE, neHeader);
  const shortDateCases = [
    ["1/1/21", "2021-01-01"],
    ["01/01/21", "2021-01-01"],
    ["1/01/21", "2021-01-01"],
    ["01/1/21", "2021-01-01"],
    ["1/1/2021", "2021-01-01"]
  ];

  for (const [input, expected] of shortDateCases) {
    const [normalizedNe] = normalizeRows(
      REPORT_TYPES.NE,
      neHeader,
      [["NE-1", input, "Usuario", "UG-1", "PROC-1", "10", "10", "10", "1"]],
      {
        batchId: "batch-ne",
        yearScope: "2026"
      },
      neHeaderResolution
    );

    assert.equal(normalizedNe.data_empenho, expected);
  }

  const nedlHeader = buildNedlHeader();
  const [normalizedNedl] = normalizeRows(
    REPORT_TYPES.NEDL,
    nedlHeader,
    [[
      "DL-1",
      "1/1/21",
      "NE-1",
      "ND-1",
      "Fonte",
      "FR-1",
      "Detalhamento",
      "DFR-1",
      "PROC-1",
      "PA-1",
      "Credor",
      "Contrato",
      "Convenio",
      "10",
      "9",
      "10",
      "1",
      "4",
      "6"
    ]],
    {
      batchId: "batch-nedl",
      yearScope: "2026"
    },
    resolveHeaders(REPORT_TYPES.NEDL, nedlHeader)
  );

  assert.equal(normalizedNedl.data_liquidacao, "2021-01-01");

  const dlobHeader = buildDlobHeader();
  const [normalizedDlob] = normalizeRows(
    REPORT_TYPES.DLOB,
    dlobHeader,
    [["OB-1", "1/1/21", "DL-1", "UG-1", "Usuario", "Finalidade", "10"]],
    {
      batchId: "batch-dlob",
      yearScope: "2026"
    },
    resolveHeaders(REPORT_TYPES.DLOB, dlobHeader)
  );

  assert.equal(normalizedDlob.data_pagamento, "2021-01-01");
});

test("normalize rows preserves accepted full slash and ISO date formats", () => {
  const header = buildNeHeader();
  const headerResolution = resolveHeaders(REPORT_TYPES.NE, header);
  const rows = [
    ["NE-1", "17/04/2026", "Usuario", "UG-1", "PROC-1", "10", "10", "10", "1"],
    ["NE-2", "2026-04-17", "Usuario", "UG-1", "PROC-2", "10", "10", "10", "1"]
  ];

  const normalized = normalizeRows(
    REPORT_TYPES.NE,
    header,
    rows,
    {
      batchId: "batch-ne",
      yearScope: "2026"
    },
    headerResolution
  );

  assert.equal(normalized[0].data_empenho, "2026-04-17");
  assert.equal(normalized[1].data_empenho, "2026-04-17");
});

test("normalize rows maps NEDL fields including NomeCredor to credor_nome", () => {
  const header = buildNedlHeader();
  const rows = [[
    "DL-1",
    "17/04/2026",
    "NE-1",
    "ND-1",
    "Fonte",
    "FR-1",
    "Detalhamento",
    "DFR-1",
    "PROC-1",
    "PA-1",
    "Credor",
    "Contrato",
    "Convenio",
    "10.00",
    "9.00",
    "10.00",
    "1.00",
    "4.00",
    "6.00"
  ]];
  const headerResolution = resolveHeaders(REPORT_TYPES.NEDL, header);

  const normalized = normalizeRows(
    REPORT_TYPES.NEDL,
    header,
    rows,
    {
      batchId: "batch-nedl",
      yearScope: "2026"
    },
    headerResolution
  );

  assert.equal(normalized[0].documento_liquidacao, "DL-1");
  assert.equal(normalized[0].codigo_nota_empenho, "NE-1");
  assert.equal(normalized[0].numero_processo, "PROC-1");
  assert.equal(normalized[0].data_liquidacao, "2026-04-17");
  assert.equal(normalized[0].credor_nome, "Credor");
  assert.equal(normalized[0].valor_bruto, 10);
});

test("normalize rows maps DLOB DocumentodaLiquidacao and never emits numero_processo", () => {
  const header = buildDlobHeader();
  const rows = [["OB-1", "18/04/2026", "DL-1", "UG-1", "Usuario", "Finalidade", "R$ 6,092.04"]];
  const headerResolution = resolveHeaders(REPORT_TYPES.DLOB, header);

  const normalized = normalizeRows(
    REPORT_TYPES.DLOB,
    header,
    rows,
    {
      batchId: "batch-dlob",
      yearScope: "2026"
    },
    headerResolution
  );

  assert.equal(normalized[0].ordem_bancaria, "OB-1");
  assert.equal(normalized[0].documento_liquidacao, "DL-1");
  assert.equal(normalized[0].data_pagamento, "2026-04-18");
  assert.equal(normalized[0].valor, 6092.04);
  assert.equal(Object.hasOwn(normalized[0], "numero_processo"), false);
});

test("normalize rows fills down DLOB OrdemBancaria and DatadoPagamento", () => {
  const header = buildDlobHeader();
  const rows = [
    ["2026160101OB02875", "13/02/2026", "2026160101DL000641", "160101", "USER", "Pagamento A", "R$ 1,000.00"],
    [" ", " ", "2026160101DL000642", "160101", "USER", "Pagamento B", "R$ 2,000.00"]
  ];
  const headerResolution = resolveHeaders(REPORT_TYPES.DLOB, header);

  const normalized = normalizeRows(
    REPORT_TYPES.DLOB,
    header,
    rows,
    {
      batchId: "batch-dlob",
      yearScope: "2026"
    },
    headerResolution
  );

  assert.equal(normalized[0].ordem_bancaria, "2026160101OB02875");
  assert.equal(normalized[0].data_pagamento, "2026-02-13");
  assert.equal(normalized[0].documento_liquidacao, "2026160101DL000641");
  assert.equal(normalized[0].source_row_number, 2);
  assert.equal(normalized[1].ordem_bancaria, "2026160101OB02875");
  assert.equal(normalized[1].data_pagamento, "2026-02-13");
  assert.equal(normalized[1].documento_liquidacao, "2026160101DL000642");
  assert.equal(normalized[1].source_row_number, 3);
  assert.equal(normalized[1].raw_row.OrdemBancaria, " ");
  assert.equal(normalized[1].raw_row.DatadoPagamento, " ");
  assert.equal(Object.hasOwn(normalized[1], "numero_processo"), false);
});

test("normalize rows does not invent DLOB fill down values on the first row", () => {
  const header = buildDlobHeader();
  const rows = [
    ["", "", "DL-0", "UG-1", "Usuario", "Sem agrupamento anterior", "10.00"],
    ["OB-1", "18/04/2026", "DL-1", "UG-1", "Usuario", "Finalidade", "20.00"]
  ];
  const headerResolution = resolveHeaders(REPORT_TYPES.DLOB, header);

  const normalized = normalizeRows(
    REPORT_TYPES.DLOB,
    header,
    rows,
    {
      batchId: "batch-dlob",
      yearScope: "2026"
    },
    headerResolution
  );

  assert.equal(normalized[0].ordem_bancaria, null);
  assert.equal(normalized[0].data_pagamento, null);
  assert.equal(normalized[0].documento_liquidacao, "DL-0");
  assert.equal(normalized[1].ordem_bancaria, "OB-1");
  assert.equal(normalized[1].data_pagamento, "2026-04-18");
});

test("normalize rows does not apply DLOB fill down to NE or NEDL", () => {
  const neHeader = buildNeHeader();
  const normalizedNe = normalizeRows(
    REPORT_TYPES.NE,
    neHeader,
    [
      ["NE-1", "18/04/2026", "Usuario", "UG-1", "PROC-1", "10", "10", "10", "1"],
      ["NE-2", "", "Usuario", "UG-1", "PROC-2", "10", "10", "10", "1"]
    ],
    {
      batchId: "batch-ne",
      yearScope: "2026"
    },
    resolveHeaders(REPORT_TYPES.NE, neHeader)
  );

  assert.equal(normalizedNe[0].data_empenho, "2026-04-18");
  assert.equal(normalizedNe[1].data_empenho, null);

  const nedlHeader = buildNedlHeader();
  const normalizedNedl = normalizeRows(
    REPORT_TYPES.NEDL,
    nedlHeader,
    [
      ["DL-1", "18/04/2026", "NE-1", "ND-1", "Fonte", "FR-1", "Detalhamento", "DFR-1", "PROC-1", "PA-1", "Credor", "Contrato", "Convenio", "10", "9", "10", "1", "4", "6"],
      ["DL-2", "", "NE-2", "ND-1", "Fonte", "FR-1", "Detalhamento", "DFR-1", "PROC-2", "PA-1", "Credor", "Contrato", "Convenio", "10", "9", "10", "1", "4", "6"]
    ],
    {
      batchId: "batch-nedl",
      yearScope: "2026"
    },
    resolveHeaders(REPORT_TYPES.NEDL, nedlHeader)
  );

  assert.equal(normalizedNedl[0].data_liquidacao, "2026-04-18");
  assert.equal(normalizedNedl[1].data_liquidacao, null);
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
        reportType: REPORT_TYPES.NEDL,
        yearScope: "2026",
        supabaseClient: createFailedBatchSupabaseMock(state)
      }),
    ImportValidationError
  );

  assert.equal(state.storageUploads, 0);
  assert.equal(state.insertedBatches.length, 1);
  assert.equal(state.insertedBatches[0].report_type, REPORT_TYPES.NEDL);
  assert.equal(state.insertedBatches[0].status, "failed");
  assert.deepEqual(state.insertedBatches[0].source_headers, ["Wrong", "Header"]);
});

test("processSiafeUpload persists NE rows in normalized_ne_rows", async () => {
  const header = ["CodigoNotadeEmpenho", "DatadoEmpenho", "NUMERO_PROCESSO", "Valor Original"];
  const row = ["NE-1", "17/04/2026", "PROC-1", "10.00"];
  const state = {
    insertedBatches: [],
    normalizedRows: [],
    normalizedTable: null,
    storageBuckets: [],
    storageUploads: [],
    updatedBatches: [],
    rpcCalls: []
  };

  const result = await processSiafeUpload({
    file: createMockFile("2026_NE.csv", `${header.join(";")}\n${row.join(";")}`),
    reportType: REPORT_TYPES.NE,
    yearScope: "2026",
    supabaseClient: createSuccessfulImportSupabaseMock(state)
  });

  assert.equal(state.insertedBatches[0].report_type, REPORT_TYPES.NE);
  assert.equal(state.normalizedTable, "normalized_ne_rows");
  assert.equal(state.normalizedRows[0].codigo_nota_empenho, "NE-1");
  assert.equal(state.normalizedRows[0].numero_processo, "PROC-1");
  assert.equal(state.normalizedRows[0].year_scope, "2026");
  assert.equal(state.rpcCalls[0].payload.p_report_type, REPORT_TYPES.NE);
  assert.equal(result.reportType, REPORT_TYPES.NE);
});

test("processSiafeUpload persists NEDL rows in normalized_nedl_rows with warnings", async () => {
  const header = [
    "DocumentodeLiquidacao",
    "CodigoNotadeEmpenho",
    "NUMERO_PROCESSO",
    "Credor_Nome",
    "ColunaExtra"
  ];
  const row = ["DL-1", "NE-1", "PROC-1", "Credor", "IGNORAR"];
  const state = {
    insertedBatches: [],
    normalizedRows: [],
    normalizedTable: null,
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

  assert.equal(state.insertedBatches[0].report_type, REPORT_TYPES.NEDL);
  assert.equal(state.storageBuckets[0], "siafe-imports");
  assert.equal(state.normalizedTable, "normalized_nedl_rows");
  assert.equal(state.normalizedRows[0].documento_liquidacao, "DL-1");
  assert.equal(state.normalizedRows[0].codigo_nota_empenho, "NE-1");
  assert.equal(state.normalizedRows[0].credor_nome, "Credor");
  assert.equal(result.reportType, REPORT_TYPES.NEDL);
  assert.equal(result.status, "success");
  assert.match(result.warnings.join("\n"), /Ignored extra columns/);
  assert.match(result.warnings.join("\n"), /Applied header aliases/);
});

test("processSiafeUpload persists DLOB rows in normalized_dlob_rows without numero_processo", async () => {
  const header = ["OrdemBancaria", "DatadoPagamento", "DocumentodaLiquidacao", "Valor"];
  const row = ["OB-1", "05/04/2026", "DL-1", "10.00"];
  const state = {
    insertedBatches: [],
    normalizedRows: [],
    normalizedTable: null,
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

  assert.equal(state.insertedBatches[0].report_type, REPORT_TYPES.DLOB);
  assert.equal(state.normalizedTable, "normalized_dlob_rows");
  assert.equal(state.normalizedRows[0].ordem_bancaria, "OB-1");
  assert.equal(state.normalizedRows[0].documento_liquidacao, "DL-1");
  assert.equal(state.normalizedRows[0].data_pagamento, "2026-04-05");
  assert.equal(Object.hasOwn(state.normalizedRows[0], "numero_processo"), false);
  assert.equal(state.rpcCalls[0].name, "finalize_siafe_active_import");
  assert.equal(state.rpcCalls[0].payload.p_report_type, REPORT_TYPES.DLOB);
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
        file: createMockFile(undefined, "OrdemBancaria,DocumentodaLiquidacao\nOB-1,DL-1"),
        reportType: REPORT_TYPES.DLOB,
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
              report_type: REPORT_TYPES.NEDL,
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
    reportType: REPORT_TYPES.NEDL,
    yearScope: "2026",
    header: ["DocumentodeLiquidacao"],
    processedRowCount: 12,
    normalizedRowCount: 12
  });

  assert.equal(state.rpcCalls[0].name, "finalize_siafe_active_import");
  assert.equal(state.rpcCalls[0].payload.p_new_batch_id, "batch-2026");
  assert.equal(state.rpcCalls[0].payload.p_report_type, REPORT_TYPES.NEDL);
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
                          report_type: REPORT_TYPES.DLOB,
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
    reportType: REPORT_TYPES.DLOB,
    yearScope: "2025",
    header: ["OrdemBancaria"],
    processedRowCount: 4,
    normalizedRowCount: 4
  });

  assert.equal(state.updatedPayloads[0].status, "success");
  assert.equal(state.updatedPayloads[0].is_active, true);
  assert.equal(batch.year_scope, "2025");
});
