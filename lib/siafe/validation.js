import {
  REPORT_SCHEMAS,
  REPORT_TYPES,
  YEAR_SCOPES,
  getExpectedFileName,
  normalizeReportType
} from "./schemas.js";

export class ImportValidationError extends Error {
  constructor(publicMessage, details, statusCode = 400) {
    super(publicMessage);
    this.publicMessage = publicMessage;
    this.details = Array.isArray(details) ? details : [details];
    this.statusCode = statusCode;
  }
}

export function validateUploadSelection({ fileName, reportType, yearScope }) {
  const errors = [];
  const canonicalReportType = normalizeReportType(reportType);

  if (!fileName?.toLowerCase().endsWith(".csv")) {
    errors.push("Only `.csv` files are supported.");
  }

  if (!REPORT_SCHEMAS[canonicalReportType]) {
    errors.push("Report type must be either `NE+DL` or `DL+OB`.");
  }

  if (!YEAR_SCOPES.includes(yearScope)) {
    errors.push("Year scope must be one of `2023_2024`, `2025`, or `2026`.");
  }

  const expectedFileName = getExpectedFileName(reportType, yearScope);

  if (expectedFileName && fileName !== expectedFileName) {
    errors.push(`Filename must match the fixed contract: expected \`${expectedFileName}\`.`);
  }

  return {
    ok: errors.length === 0,
    errors
  };
}

export function validateHeaders(reportType, header) {
  const schema = REPORT_SCHEMAS[normalizeReportType(reportType)];

  if (!schema) {
    throw new ImportValidationError("Unsupported report type.", [
      "The selected report type does not match a configured import schema."
    ]);
  }

  const expected = schema.headers;
  const cleanedHeader = header.map((column) => column.trim());

  const missing = expected.filter((column) => !cleanedHeader.includes(column));
  const extra = cleanedHeader.filter((column) => !expected.includes(column));
  const orderMismatch =
    missing.length === 0 &&
    extra.length === 0 &&
    expected.some((column, index) => cleanedHeader[index] !== column);

  if (missing.length > 0 || extra.length > 0 || orderMismatch) {
    const details = [];

    if (missing.length > 0) {
      details.push(`Missing required headers: ${missing.join(", ")}`);
    }

    if (extra.length > 0) {
      details.push(`Unexpected headers: ${extra.join(", ")}`);
    }

    if (orderMismatch) {
      details.push("Headers must preserve the exact expected column order.");
    }

    details.push(`Expected header count: ${expected.length}. Received header count: ${cleanedHeader.length}.`);
    details.push(`Expected headers: ${expected.join(" | ")}`);
    details.push(`Received headers: ${cleanedHeader.length > 0 ? cleanedHeader.join(" | ") : "(none)"}`);

    throw new ImportValidationError(
      "The CSV headers do not match the exact contract for this report type.",
      details
    );
  }

  return {
    ok: true,
    expected,
    actual: cleanedHeader
  };
}

export function ensureStaticScopeCanImport(existingActiveBatch, yearScope) {
  if (yearScope === "2026") {
    return;
  }

  if (existingActiveBatch) {
    throw new ImportValidationError(
      "Historical datasets are locked after the first successful import.",
      [
        `A successful active batch already exists for ${yearScope}. Historical scopes require an explicit administrative override outside the MVP flow.`
      ]
    );
  }
}

export function summarizeReportType(reportType) {
  const canonicalReportType = normalizeReportType(reportType);

  if (canonicalReportType === REPORT_TYPES.NE_DL) {
    return "NE+DL";
  }

  if (canonicalReportType === REPORT_TYPES.DL_OB) {
    return "DL+OB";
  }

  return reportType;
}
