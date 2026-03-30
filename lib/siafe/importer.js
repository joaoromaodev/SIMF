import { parseCsv } from "./csv.js";
import { normalizeRows } from "./normalize.js";
import { REPORT_SCHEMAS, YEAR_SCOPES } from "./schemas.js";
import {
  ImportValidationError,
  ensureStaticScopeCanImport,
  summarizeReportType,
  validateHeaders,
  validateUploadSelection
} from "./validation.js";
import { getSupabaseAdminClient } from "../supabase/server.js";

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

async function uploadOriginalFile(supabase, file) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filePath = `${timestamp}-${file.name}`;
  const fileBuffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(filePath, fileBuffer, {
    contentType: file.type || "text/csv",
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

async function replaceActiveYearRows(supabase, reportSchema, previousBatchId, newBatchId) {
  const { error: deleteError } = await supabase
    .from(reportSchema.normalizedTable)
    .delete()
    .eq("import_batch_id", previousBatchId);

  if (deleteError) {
    throw new Error(`Failed to clear prior active rows: ${deleteError.message}`);
  }

  const { error: deactivateError } = await supabase
    .from("import_batches")
    .update({
      is_active: false,
      replaced_batch_id: newBatchId,
      finished_at: new Date().toISOString()
    })
    .eq("id", previousBatchId);

  if (deactivateError) {
    throw new Error(`Failed to deactivate prior active batch: ${deactivateError.message}`);
  }
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

export async function processSiafeUpload({ file, reportType, yearScope }) {
  const fileName = file?.name;
  const selectionValidation = validateUploadSelection({ fileName, reportType, yearScope });
  const supabase = getSupabaseAdminClient();
  const safeBatchSeed = getSafeBatchSeed(reportType, yearScope);

  let batch = null;

  if (!selectionValidation.ok) {
    await createBatchRecord(supabase, {
      report_type: safeBatchSeed.report_type,
      year_scope: safeBatchSeed.year_scope,
      original_file_name: fileName ?? "unknown.csv",
      storage_bucket: null,
      storage_path: null,
      status: "failed",
      validation_errors: toJsonErrorDetails(selectionValidation.errors),
      source_headers: [],
      processed_row_count: 0,
      normalized_row_count: 0,
      is_active: false,
      finished_at: new Date().toISOString()
    });

    throw new ImportValidationError(
      "The upload request does not meet the file or naming contract.",
      selectionValidation.errors
    );
  }

  try {
    const storagePath = await uploadOriginalFile(supabase, file);
    batch = await createBatchRecord(supabase, {
      report_type: reportType,
      year_scope: yearScope,
      original_file_name: fileName,
      storage_bucket: STORAGE_BUCKET,
      storage_path: storagePath,
      status: "processing",
      validation_errors: [],
      source_headers: [],
      processed_row_count: 0,
      normalized_row_count: 0,
      is_active: false
    });

    const existingActiveBatch = await getActiveBatch(supabase, reportType, yearScope);
    ensureStaticScopeCanImport(existingActiveBatch, yearScope);

    const csvText = await file.text();
    const { header, rows } = parseCsv(csvText);
    validateHeaders(reportType, header);

    const reportSchema = REPORT_SCHEMAS[reportType];
    const normalizedRows = normalizeRows(reportType, header, rows, {
      batchId: batch.id,
      yearScope
    });

    await insertNormalizedRows(supabase, reportSchema, normalizedRows);

    if (yearScope === "2026" && existingActiveBatch?.id) {
      await replaceActiveYearRows(supabase, reportSchema, existingActiveBatch.id, batch.id);
    }

    batch = await updateBatchRecord(supabase, batch.id, {
      status: "success",
      source_headers: header,
      processed_row_count: rows.length,
      normalized_row_count: normalizedRows.length,
      validation_errors: [],
      is_active: true,
      finished_at: new Date().toISOString()
    });

    return mapBatchResponse(batch);
  } catch (error) {
    if (batch?.id) {
      const details = Array.isArray(error?.details) ? error.details : [error.message];

      await updateBatchRecord(supabase, batch.id, {
        status: "failed",
        source_headers: [],
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
