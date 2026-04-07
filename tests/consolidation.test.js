import test from "node:test";
import assert from "node:assert/strict";

import { getSupabaseAdminClient } from "../lib/supabase/server.js";

let supabase = null;
try {
  supabase = getSupabaseAdminClient();
} catch {
  supabase = null;
}

const testOrSkip = supabase ? test : test.skip;

async function createBatch(reportType, yearScope, originalFileName) {
  const { data, error } = await supabase
    .from("import_batches")
    .insert({
      report_type: reportType,
      year_scope: yearScope,
      original_file_name: originalFileName,
      status: "success",
      source_headers: [],
      validation_errors: [],
      processed_row_count: 0,
      normalized_row_count: 0,
      is_active: false
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

testOrSkip.describe(testSuiteTitle, () => {
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

    const batchNeDl = await createBatch("NE_DL", "2026", `ne-dl-${uniqueSuffix}.csv`);
    const batchDlOb = await createBatch("DL_OB", "2026", `dl-ob-${uniqueSuffix}.csv`);

    cleanupContext.batchIds.push(batchNeDl.id, batchDlOb.id);

    await insertNormalizedNeDlRow(batchNeDl.id, {
      numero_processo: processId,
      codigo_nota_empenho: notaId,
      documento_liquidacao: documentoId,
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

    const batchNeDl = await createBatch("NE_DL", "2026", `ne-dl-partial-${uniqueSuffix}.csv`);
    cleanupContext.batchIds.push(batchNeDl.id);

    await insertNormalizedNeDlRow(batchNeDl.id, {
      numero_processo: processId,
      codigo_nota_empenho: notaId,
      documento_liquidacao: documentoId,
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
    assert.equal(documentos[0].valor, null);

    const { data: ordens, error: ordemError } = await supabase
      .from("ordens_bancarias")
      .select("*")
      .eq("documento_liquidacao", documentoId);
    assert.equal(ordemError, null);
    assert.equal(ordens.length, 0);
  });
});
