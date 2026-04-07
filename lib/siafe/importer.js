import { parseCsv } from "./csv.js";
import { normalizeRows } from "./normalize.js";
import { REPORT_SCHEMAS, YEAR_SCOPES, normalizeReportType } from "./schemas.js";
import {
  ImportValidationError,
  ensureStaticScopeCanImport,
  summarizeReportType,
  validateHeaders,
  validateUploadSelection
} from "./validation.js";

const STORAGE_BUCKET = process.env.SUPABASE_SIAFE_IMPORTS_BUCKET || "siafe-imports";

function toJsonErrorDetails(errors) {
  return (errors || []).map((message) => ({ message }));
}

function getSafeBatchSeed(reportType, yearScope) {
  return {
    report_type: REPORT_SCHEMAS[reportType] ? reportType : "NE_DL",
    year_scope: YEAR_SCOPES.includes(yearScope) ? yearScope : "2026"
  };
}

async function readUploadFile(file) {
  const fileBuffer = Buffer.from(await file.arrayBuffer());

  return {
    fileBuffer,
    csvText: fileBuffer.toString("utf-8")
  };
}

async function uploadOriginalFile(supabase, fileName, fileBuffer, fileType) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filePath = `${timestamp}-${fileName}`;

  const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(filePath, fileBuffer, {
    contentType: fileType || "text/csv",
    upsert: false
  });

  if (error) {
    throw new Error(`Failed to upload CSV to Supabase Storage: ${error.message}`);
  }

  return filePath;
}

async function createBatchRecord(supabase, payload) {
  const { data, error } = await supabase.from("import_batches").insert(payload).select().single();

  if (error) {
    throw new Error(`Failed to create import batch: ${error.message}`);
  }

  return data;
}

async function updateBatchRecord(supabase, batchId, payload) {
  const { data, error } = await supabase
    .from("import_batches")
    .update(payload)
    .eq("id", batchId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update import batch ${batchId}: ${error.message}`);
  }

  return data;
}

async function getBatchRecord(supabase, batchId) {
  const { data, error } = await supabase
    .from("import_batches")
    .select("*")
    .eq("id", batchId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch import batch ${batchId}: ${error.message}`);
  }

  return data;
}

async function getActiveBatch(supabase, reportType, yearScope) {
  const { data, error } = await supabase
    .from("import_batches")
    .select("id, report_type, year_scope, status, is_active")
    .eq("report_type", reportType)
    .eq("year_scope", yearScope)
    .eq("status", "success")
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to query existing import batches: ${error.message}`);
  }

  return data;
}

async function insertNormalizedRows(supabase, reportSchema, normalizedRows) {
  if (normalizedRows.length === 0) {
    return;
  }

  const { error } = await supabase.from(reportSchema.normalizedTable).insert(normalizedRows);

  if (error) {
    throw new Error(`Failed to persist normalized rows: ${error.message}`);
  }
}

function mapBatchResponse(batch) {
  return {
    id: batch.id,
    status: batch.status,
    reportType: summarizeReportType(batch.report_type),
    yearScope: batch.year_scope,
    normalizedRowCount: batch.normalized_row_count
  };
}

async function createFailedBatch(supabase, seed, payload) {
  await createBatchRecord(supabase, {
    report_type: seed.report_type,
    year_scope: seed.year_scope,
    original_file_name: payload.fileName ?? "unknown.csv",
    storage_bucket: null,
    storage_path: null,
    status: "failed",
    validation_errors: toJsonErrorDetails(payload.errors),
    source_headers: payload.header ?? [],
    processed_row_count: 0,
    normalized_row_count: 0,
    is_active: false,
    finished_at: new Date().toISOString()
  });
}

export async function finalizeBatchSuccess({
  supabase,
  batchId,
  reportType,
  yearScope,
  header,
  processedRowCount,
  normalizedRowCount
}) {
  if (yearScope === "2026") {
    const { error } = await supabase.rpc("finalize_siafe_active_import", {
      p_new_batch_id: batchId,
      p_report_type: reportType,
      p_year_scope: yearScope,
      p_source_headers: header,
      p_processed_row_count: processedRowCount,
      p_normalized_row_count: normalizedRowCount
    });

    if (error) {
      throw new Error(`Failed to finalize active-year replacement: ${error.message}`);
    }

    return getBatchRecord(supabase, batchId);
  }

  return updateBatchRecord(supabase, batchId, {
    status: "success",
    source_headers: header,
    processed_row_count: processedRowCount,
    normalized_row_count: normalizedRowCount,
    validation_errors: [],
    is_active: true,
    finished_at: new Date().toISOString()
  });
}

export async function processSiafeUpload({
  file,
  reportType,
  yearScope,
  supabaseClient
}) {
  const canonicalReportType = normalizeReportType(reportType);
  const fileName = file?.name;
  const safeBatchSeed = getSafeBatchSeed(canonicalReportType, yearScope);
  const selectionValidation = validateUploadSelection({
    fileName,
    reportType: canonicalReportType,
    yearScope
  });
  const supabase =
    supabaseClient ??
    (await import("../supabase/server.js")).getSupabaseAdminClient();

  let batch = null;
  let structuralHeader = [];

  if (!selectionValidation.ok) {
    await createFailedBatch(supabase, safeBatchSeed, {
      fileName,
      errors: selectionValidation.errors
    });

    throw new ImportValidationError(
      "The upload request does not meet the file or naming contract.",
      selectionValidation.errors
    );
  }

  try {
    const { fileBuffer, csvText } = await readUploadFile(file);
    const { header, rows } = parseCsv(csvText);
    structuralHeader = header;
    validateHeaders(reportType, header);

    const existingActiveBatch = await getActiveBatch(supabase, canonicalReportType, yearScope);
    ensureStaticScopeCanImport(existingActiveBatch, yearScope);

    batch = await createBatchRecord(supabase, {
      report_type: canonicalReportType,
      year_scope: yearScope,
      original_file_name: fileName,
      storage_bucket: null,
      storage_path: null,
      status: "processing",
      validation_errors: [],
      source_headers: header,
      processed_row_count: 0,
      normalized_row_count: 0,
      is_active: false
    });

    const storagePath = await uploadOriginalFile(supabase, fileName, fileBuffer, file.type);
    batch = await updateBatchRecord(supabase, batch.id, {
      storage_bucket: STORAGE_BUCKET,
      storage_path: storagePath
    });

    const reportSchema = REPORT_SCHEMAS[canonicalReportType];
    const normalizedRows = normalizeRows(canonicalReportType, header, rows, {
      batchId: batch.id,
      yearScope
    });

    await insertNormalizedRows(supabase, reportSchema, normalizedRows);

    batch = await finalizeBatchSuccess({
      supabase,
      batchId: batch.id,
      reportType: canonicalReportType,
      yearScope,
      header,
      processedRowCount: rows.length,
      normalizedRowCount: normalizedRows.length
    });

    return mapBatchResponse(batch);
  } catch (error) {
    if (!batch?.id && error instanceof ImportValidationError) {
      await createFailedBatch(supabase, safeBatchSeed, {
        fileName,
        errors: error.details,
        header: structuralHeader
      });
    } else if (batch?.id) {
      const details = Array.isArray(error?.details) ? error.details : [error.message];

      await updateBatchRecord(supabase, batch.id, {
        status: "failed",
        source_headers: structuralHeader,
        processed_row_count: 0,
        normalized_row_count: 0,
        validation_errors: toJsonErrorDetails(details),
        is_active: false,
        finished_at: new Date().toISOString()
      });
    }

    if (error instanceof ImportValidationError) {
      throw error;
    }

    throw new ImportValidationError("The CSV could not be imported.", [error.message], 500);
  }
}
