import test from "node:test";
import assert from "node:assert/strict";

import { getSupabaseAdminClient } from "../lib/supabase/server.js";

let supabase = null;
try {
  supabase = getSupabaseAdminClient();
} catch {
  supabase = null;
}

const describeOrSkip = supabase ? test.describe : test.describe.skip;

async function createBatch(reportType, yearScope, originalFileName, options = {}) {
  const { data, error } = await supabase
    .from("import_batches")
    .insert({
      report_type: reportType,
      year_scope: yearScope,
      original_file_name: originalFileName,
      status: options.status ?? "success",
      source_headers: [],
      validation_errors: [],
      processed_row_count: 0,
      normalized_row_count: 0,
      is_active: options.isActive ?? false
    })
    .select()
    .single();

  assert.equal(error, null, `Failed to create import batch: ${error?.message ?? error}`);
  return data;
}

async function cleanupEntities({ processIds = [], notaIds = [], documentoIds = [], ordemIds = [], batchIds = [] }) {
  for (const ordem of ordemIds) {
    await supabase.from("ordens_bancarias").delete().eq("ordem_bancaria", ordem);
  }

  for (const documento of documentoIds) {
    await supabase.from("documentos_liquidacao").delete().eq("documento_liquidacao", documento);
  }

  for (const nota of notaIds) {
    await supabase.from("notas_empenho").delete().eq("codigo_nota_empenho", nota);
  }

  for (const proc of processIds) {
    await supabase.from("processos").delete().eq("numero_processo", proc);
  }

  for (const batchId of batchIds) {
    await supabase.from("import_batches").delete().eq("id", batchId);
  }
}

async function insertNormalizedNeDlRow(batchId, row) {
  const { error } = await supabase.from("normalized_ne_dl_rows").insert({
    import_batch_id: batchId,
    source_row_number: 1,
    year_scope: "2026",
    raw_row: row,
    ...row
  });
  assert.equal(error, null, `Failed to insert normalized NE+DL row: ${error?.message ?? error}`);
}

async function insertNormalizedDlObRow(batchId, row) {
  const { error } = await supabase.from("normalized_dl_ob_rows").insert({
    import_batch_id: batchId,
    source_row_number: 1,
    year_scope: "2026",
    raw_row: row,
    ...row
  });
  assert.equal(error, null, `Failed to insert normalized DL+OB row: ${error?.message ?? error}`);
}

const testSuiteTitle = "SIAFE lineage consolidation integration";

describeOrSkip(testSuiteTitle, () => {
  const cleanupContext = {
    processIds: [],
    notaIds: [],
    documentoIds: [],
    ordemIds: [],
    batchIds: []
  };

  test.afterEach(async () => {
    await cleanupEntities(cleanupContext);
    cleanupContext.processIds = [];
    cleanupContext.notaIds = [];
    cleanupContext.documentoIds = [];
    cleanupContext.ordemIds = [];
    cleanupContext.batchIds = [];
  });

  test("Full Hierarchy Consolidation", async () => {
    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const processId = `PROC-${uniqueSuffix}`;
    const notaId = `NE-${uniqueSuffix}`;
    const documentoId = `DL-${uniqueSuffix}`;
    const ordemId = `OB-${uniqueSuffix}`;

    cleanupContext.processIds.push(processId);
    cleanupContext.notaIds.push(notaId);
    cleanupContext.documentoIds.push(documentoId);
    cleanupContext.ordemIds.push(ordemId);

    const batchNeDl = await createBatch("NE_DL", "2025", `ne-dl-${uniqueSuffix}.csv`);
    const batchDlOb = await createBatch("DL_OB", "2025", `dl-ob-${uniqueSuffix}.csv`);

    cleanupContext.batchIds.push(batchNeDl.id, batchDlOb.id);

    await insertNormalizedNeDlRow(batchNeDl.id, {
      numero_processo: processId,
      codigo_nota_empenho: notaId,
      documento_liquidacao: documentoId,
      data_liquidacao: "2026-04-15",
      credor_nome: "Credor NEDL",
      codigo_fonte_recurso: "F1",
      codigo_detalhamento_fr: "D1",
      codigo_unidade_gestora: "UG1",
      valor_original: 1200.0,
      valor_liquido: 1100.0,
      valor_bruto: 1300.0,
      valor_retido: 100.0,
      valor_pago: 1050.0,
      valor_liquidado_a_pagar: 50.0,
      valor_liquido_2: 1095.0
    });

    await insertNormalizedDlObRow(batchDlOb.id, {
      numero_processo: processId,
      documento_liquidacao: documentoId,
      ordem_bancaria: ordemId,
      ob_credor_documento: "11122233344",
      ob_credor_nome: "Fornecedor OB",
      dl_documento_credor: "55566677788",
      dl_nome_credor: "Fornecedor DL",
      data_pagamento: "2026-04-01",
      codigo_fonte_recurso: "F1",
      codigo_detalhamento_fr: "D1",
      codigo_unidade_gestora: "UG1",
      valor: 1500.0
    });

    const { error: rpcError } = await supabase.rpc("consolidate_siafe_lineage");
    assert.equal(rpcError, null, `Procedure failed: ${rpcError?.message ?? rpcError}`);

    const { data: processos, error: processError } = await supabase
      .from("processos")
      .select("*")
      .eq("numero_processo", processId);
    assert.equal(processError, null);
    assert.equal(processos.length, 1);

    const { data: notas, error: notaError } = await supabase
      .from("notas_empenho")
      .select("*")
      .eq("codigo_nota_empenho", notaId);
    assert.equal(notaError, null);
    assert.equal(notas.length, 1);
    assert.equal(notas[0].numero_processo, processId);

    const { data: documentos, error: docError } = await supabase
      .from("documentos_liquidacao")
      .select("*")
      .eq("documento_liquidacao", documentoId);
    assert.equal(docError, null);
    assert.equal(documentos.length, 1);
    assert.equal(documentos[0].numero_processo, processId);
    assert.equal(documentos[0].codigo_nota_empenho, notaId);
    assert.equal(documentos[0].data_liquidacao, "2026-04-15");
    assert.equal(documentos[0].dl_documento_credor, "55566677788");
    assert.equal(documentos[0].dl_nome_credor, "Fornecedor DL");
    assert.equal(Number(documentos[0].valor), 1500.0);

    const { data: ordens, error: ordemError } = await supabase
      .from("ordens_bancarias")
      .select("*")
      .eq("ordem_bancaria", ordemId);
    assert.equal(ordemError, null);
    assert.equal(ordens.length, 1);
    assert.equal(ordens[0].documento_liquidacao, documentoId);
    assert.equal(ordens[0].numero_processo, processId);
    assert.equal(ordens[0].codigo_nota_empenho, notaId);
    assert.equal(ordens[0].ob_credor_documento, "11122233344");
    assert.equal(ordens[0].ob_credor_nome, "Fornecedor OB");
  });

  test("Partial Matches (DL without OB)", async () => {
    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const processId = `PROC-PARTIAL-${uniqueSuffix}`;
    const notaId = `NE-PARTIAL-${uniqueSuffix}`;
    const documentoId = `DL-PARTIAL-${uniqueSuffix}`;

    cleanupContext.processIds.push(processId);
    cleanupContext.notaIds.push(notaId);
    cleanupContext.documentoIds.push(documentoId);

    const batchNeDl = await createBatch("NE_DL", "2025", `ne-dl-partial-${uniqueSuffix}.csv`);
    cleanupContext.batchIds.push(batchNeDl.id);

    await insertNormalizedNeDlRow(batchNeDl.id, {
      numero_processo: processId,
      codigo_nota_empenho: notaId,
      documento_liquidacao: documentoId,
      data_liquidacao: "2026-04-16",
      credor_nome: "Credor NEDL sem OB",
      codigo_fonte_recurso: "F2",
      codigo_detalhamento_fr: "D2",
      codigo_unidade_gestora: "UG2",
      valor_original: 900.0,
      valor_liquido: 850.0,
      valor_bruto: 950.0,
      valor_retido: 50.0,
      valor_pago: 850.0,
      valor_liquidado_a_pagar: 0.0,
      valor_liquido_2: 845.0
    });

    const { error: rpcError } = await supabase.rpc("consolidate_siafe_lineage");
    assert.equal(rpcError, null, `Procedure failed for partial match: ${rpcError?.message ?? rpcError}`);

    const { data: processos, error: processError } = await supabase
      .from("processos")
      .select("*")
      .eq("numero_processo", processId);
    assert.equal(processError, null);
    assert.equal(processos.length, 1);

    const { data: notas, error: notaError } = await supabase
      .from("notas_empenho")
      .select("*")
      .eq("codigo_nota_empenho", notaId);
    assert.equal(notaError, null);
    assert.equal(notas.length, 1);
    assert.equal(notas[0].numero_processo, processId);

    const { data: documentos, error: docError } = await supabase
      .from("documentos_liquidacao")
      .select("*")
      .eq("documento_liquidacao", documentoId);
    assert.equal(docError, null);
    assert.equal(documentos.length, 1);
    assert.equal(documentos[0].numero_processo, processId);
    assert.equal(documentos[0].codigo_nota_empenho, notaId);
    assert.equal(documentos[0].data_liquidacao, "2026-04-16");
    assert.equal(documentos[0].dl_nome_credor, null);
    assert.equal(documentos[0].valor, null);

    const { data: ordens, error: ordemError } = await supabase
      .from("ordens_bancarias")
      .select("*")
      .eq("documento_liquidacao", documentoId);
    assert.equal(ordemError, null);
    assert.equal(ordens.length, 0);
  });

  test("Canonical reconciliation removes orphan OBs and keeps CPAG saldo rules", async () => {
    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const processId = `PROC-CPAG-${uniqueSuffix}`;
    const notaA = `NE-A-${uniqueSuffix}`;
    const notaB = `NE-B-${uniqueSuffix}`;
    const notaC = `NE-C-${uniqueSuffix}`;
    const dlA = `DL-A-${uniqueSuffix}`;
    const dlB = `DL-B-${uniqueSuffix}`;
    const dlC = `DL-C-${uniqueSuffix}`;
    const obB = `OB-B-${uniqueSuffix}`;
    const obC = `OB-C-${uniqueSuffix}`;

    cleanupContext.processIds.push(processId);
    cleanupContext.notaIds.push(notaA, notaB, notaC);
    cleanupContext.documentoIds.push(dlA, dlB, dlC);
    cleanupContext.ordemIds.push(obB, obC);

    const batchNeDl = await createBatch("NE_DL", "2025", `ne-dl-cpag-${uniqueSuffix}.csv`);
    const batchDlOb = await createBatch("DL_OB", "2025", `dl-ob-cpag-${uniqueSuffix}.csv`);
    cleanupContext.batchIds.push(batchNeDl.id, batchDlOb.id);

    await insertNormalizedNeDlRow(batchNeDl.id, {
      numero_processo: processId,
      codigo_nota_empenho: notaA,
      documento_liquidacao: dlA,
      data_liquidacao: "2026-04-10",
      codigo_fonte_recurso: "F-CPAG",
      codigo_unidade_gestora: "UG-CPAG",
      valor_bruto: 100.0
    });
    await insertNormalizedNeDlRow(batchNeDl.id, {
      numero_processo: processId,
      codigo_nota_empenho: notaB,
      documento_liquidacao: dlB,
      data_liquidacao: "2026-04-11",
      codigo_fonte_recurso: "F-CPAG",
      codigo_unidade_gestora: "UG-CPAG",
      valor_bruto: 100.0
    });
    await insertNormalizedNeDlRow(batchNeDl.id, {
      numero_processo: processId,
      codigo_nota_empenho: notaC,
      documento_liquidacao: dlC,
      data_liquidacao: "2026-04-12",
      codigo_fonte_recurso: "F-CPAG",
      codigo_unidade_gestora: "UG-CPAG",
      valor_bruto: 100.0
    });

    await insertNormalizedDlObRow(batchDlOb.id, {
      numero_processo: processId,
      documento_liquidacao: dlB,
      ordem_bancaria: obB,
      data_liquidacao: "2026-04-11",
      data_pagamento: "2026-04-13",
      valor: 40.0
    });
    await insertNormalizedDlObRow(batchDlOb.id, {
      numero_processo: processId,
      documento_liquidacao: dlC,
      ordem_bancaria: obC,
      data_liquidacao: "2026-04-12",
      data_pagamento: "2026-04-14",
      valor: 100.0
    });

    const { error: firstRpcError } = await supabase.rpc("consolidate_siafe_lineage");
    assert.equal(firstRpcError, null, `Initial reconciliation failed: ${firstRpcError?.message ?? firstRpcError}`);

    const { data: firstViewRows, error: firstViewError } = await supabase
      .from("vw_liquidados_a_pagar")
      .select("documento_liquidacao, data_liquidacao, valor_liquidado_a_pagar, valor_ja_pago_obs")
      .in("documento_liquidacao", [dlA, dlB, dlC]);

    assert.equal(firstViewError, null);
    assert.deepEqual(
      firstViewRows.map((row) => row.documento_liquidacao).sort(),
      [dlA, dlB]
    );
    assert.equal(firstViewRows.find((row) => row.documento_liquidacao === dlA)?.valor_ja_pago_obs, "0.00");
    assert.equal(firstViewRows.find((row) => row.documento_liquidacao === dlA)?.valor_liquidado_a_pagar, "100.00");
    assert.equal(firstViewRows.find((row) => row.documento_liquidacao === dlB)?.valor_ja_pago_obs, "40.00");
    assert.equal(firstViewRows.find((row) => row.documento_liquidacao === dlB)?.valor_liquidado_a_pagar, "60.00");
    assert.equal(firstViewRows.find((row) => row.documento_liquidacao === dlB)?.data_liquidacao, "2026-04-11");

    const { error: deleteBatchError } = await supabase
      .from("import_batches")
      .delete()
      .eq("id", batchDlOb.id);
    assert.equal(deleteBatchError, null);
    cleanupContext.batchIds = cleanupContext.batchIds.filter((id) => id !== batchDlOb.id);

    const { error: secondRpcError } = await supabase.rpc("consolidate_siafe_lineage");
    assert.equal(secondRpcError, null, `Second reconciliation failed: ${secondRpcError?.message ?? secondRpcError}`);

    const { data: remainingOrdens, error: remainingOrdensError } = await supabase
      .from("ordens_bancarias")
      .select("ordem_bancaria")
      .in("ordem_bancaria", [obB, obC]);
    assert.equal(remainingOrdensError, null);
    assert.equal(remainingOrdens.length, 0);

    const { data: secondViewRows, error: secondViewError } = await supabase
      .from("vw_liquidados_a_pagar")
      .select("documento_liquidacao, valor_liquidado_a_pagar, valor_ja_pago_obs")
      .in("documento_liquidacao", [dlA, dlB, dlC]);
    assert.equal(secondViewError, null);
    assert.deepEqual(
      secondViewRows.map((row) => row.documento_liquidacao).sort(),
      [dlA, dlB, dlC]
    );
    assert.equal(secondViewRows.find((row) => row.documento_liquidacao === dlB)?.valor_ja_pago_obs, "0.00");
    assert.equal(secondViewRows.find((row) => row.documento_liquidacao === dlC)?.valor_liquidado_a_pagar, "100.00");
  });

  test("vw_monitoramento_pagamentos avoids linking OB by processo when documento_liquidacao is null", async () => {
    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const processId = `PROC-MON-${uniqueSuffix}`;
    const dl1 = `DL-MON-1-${uniqueSuffix}`;
    const dl2 = `DL-MON-2-${uniqueSuffix}`;
    const obId = `OB-MON-${uniqueSuffix}`;

    cleanupContext.processIds.push(processId);
    cleanupContext.documentoIds.push(dl1, dl2);
    cleanupContext.ordemIds.push(obId);

    const { error: processoError } = await supabase.from("processos").insert({ numero_processo: processId });
    assert.equal(processoError, null);

    const { error: dlInsertError } = await supabase.from("documentos_liquidacao").insert([
      {
        documento_liquidacao: dl1,
        numero_processo: processId,
        data_liquidacao: "2026-04-01",
        dl_nome_credor: "Credor DL 1"
      },
      {
        documento_liquidacao: dl2,
        numero_processo: processId,
        data_liquidacao: "2026-04-02",
        dl_nome_credor: "Credor DL 2"
      }
    ]);
    assert.equal(dlInsertError, null);

    const { error: obInsertError } = await supabase.from("ordens_bancarias").insert({
      ordem_bancaria: obId,
      numero_processo: processId,
      documento_liquidacao: null,
      ob_credor_nome: "Credor da OB",
      data_pagamento: "2026-04-03",
      valor: 25.0
    });
    assert.equal(obInsertError, null);

    const { data: monitoramentoRows, error: monitoramentoError } = await supabase
      .from("vw_monitoramento_pagamentos")
      .select("numero_processo, documento_liquidacao, credor, data_liquidacao")
      .eq("ordem_bancaria", obId);

    assert.equal(monitoramentoError, null);
    assert.equal(monitoramentoRows.length, 1);
    assert.equal(monitoramentoRows[0].numero_processo, processId);
    assert.equal(monitoramentoRows[0].documento_liquidacao, null);
    assert.equal(monitoramentoRows[0].credor, "Credor da OB");
    assert.equal(monitoramentoRows[0].data_liquidacao, null);
  });
});
