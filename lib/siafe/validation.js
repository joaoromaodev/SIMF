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
    errors.push("Report type must be one of `NE`, `NEDL`, or `DLOB`.");
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

function cleanHeader(header) {
  return header.map((column) => column.trim());
}

export function resolveHeaders(reportType, header) {
  const schema = REPORT_SCHEMAS[normalizeReportType(reportType)];

  if (!schema) {
    throw new ImportValidationError("Unsupported report type.", [
      "The selected report type does not match a configured import schema."
    ]);
  }

  const cleanedHeader = cleanHeader(header);
  const canonicalIndexByField = {};
  const headerByField = {};
  const extraHeaders = [];
  const aliasMatches = [];
  const duplicateBindings = [];

  cleanedHeader.forEach((column, index) => {
    const binding = schema.headerBindings[column];

    if (!binding) {
      extraHeaders.push(column);
      return;
    }

    if (canonicalIndexByField[binding.canonicalField] != null) {
      duplicateBindings.push(
        `Headers \`${headerByField[binding.canonicalField]}\` and \`${column}\` both map to canonical field \`${binding.canonicalField}\`.`
      );
      return;
    }

    canonicalIndexByField[binding.canonicalField] = index;
    headerByField[binding.canonicalField] = column;

    if (binding.via === "alias") {
      aliasMatches.push({
        header: column,
        canonicalField: binding.canonicalField,
        preferredHeader: binding.preferredHeader
      });
    }
  });

  const missingRequiredFields = schema.requiredFields.filter(
    (canonicalField) => canonicalIndexByField[canonicalField] == null
  );

  const details = [];

  if (missingRequiredFields.length > 0) {
    details.push(
      `Missing required headers: ${missingRequiredFields
        .map((canonicalField) => schema.preferredHeaderByField[canonicalField])
        .join(", ")}`
    );
  }

  if (duplicateBindings.length > 0) {
    details.push(...duplicateBindings);
  }

  if (details.length > 0) {
    details.push(
      `Expected required headers: ${schema.requiredFields
        .map((canonicalField) => schema.preferredHeaderByField[canonicalField])
        .join(" | ")}`
    );
    details.push(`Received headers: ${cleanedHeader.length > 0 ? cleanedHeader.join(" | ") : "(none)"}`);

    throw new ImportValidationError(
      "The CSV headers do not satisfy the minimum structural contract for this report type.",
      details
    );
  }

  const warnings = [];

  if (extraHeaders.length > 0) {
    warnings.push(`Ignored extra columns: ${extraHeaders.join(", ")}`);
  }

  if (aliasMatches.length > 0) {
    warnings.push(
      `Applied header aliases: ${aliasMatches
        .map(({ header, preferredHeader }) => `${header} -> ${preferredHeader}`)
        .join(", ")}`
    );
  }

  return {
    ok: true,
    expected: schema.headers,
    actual: cleanedHeader,
    canonicalIndexByField,
    headerByField,
    missingRequiredFields,
    extraHeaders,
    aliasMatches,
    warnings
  };
}

export function validateHeaders(reportType, header) {
  return resolveHeaders(reportType, header);
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

  if (REPORT_SCHEMAS[canonicalReportType]) {
    return canonicalReportType;
  }

  return reportType;
}
