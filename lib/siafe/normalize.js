import { REPORT_SCHEMAS, REPORT_TYPES, normalizeReportType } from "./schemas.js";

function assertHeaderResolution(headerResolution, reportType) {
  if (headerResolution?.headerByField) {
    return;
  }

  throw new Error(
    `normalizeRows requires a resolved header map for report type ${reportType}. Resolve headers before normalizing rows.`
  );
}

function parseDecimal(value) {
  if (value == null) {
    return null;
  }

  const stringValue = String(value).trim();

  if (!stringValue || stringValue === "#null") {
    return null;
  }

  const withoutSymbol = stringValue.replace(/R\$\s*/g, "").trim();

  const hasAmericanFormat =
    /,\d{3}\./.test(withoutSymbol) ||
    /^\d{1,3}(,\d{3})*(\.\d+)?$/.test(withoutSymbol);

  let sanitized;
  if (hasAmericanFormat) {
    sanitized = withoutSymbol.replace(/,/g, "");
  } else {
    sanitized = withoutSymbol
      .replace(/\s/g, "")
      .replace(/\.(?=\d{3}(\D|$))/g, "")
      .replace(",", ".");
  }

  const parsed = Number.parseFloat(sanitized);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseDate(value) {
  if (value == null) {
    return null;
  }

  const stringValue = String(value).trim();

  if (!stringValue) {
    return null;
  }

  const slashMatch = /^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/.exec(stringValue);

  if (slashMatch) {
    const day = slashMatch[1].padStart(2, "0");
    const month = slashMatch[2].padStart(2, "0");
    const year = slashMatch[3].length === 2 ? `20${slashMatch[3]}` : slashMatch[3];

    return `${year}-${month}-${day}`;
  }

  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(stringValue);

  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  }

  return null;
}

function toText(value) {
  if (value == null) {
    return null;
  }

  const trimmed = String(value).trim();
  return trimmed.length > 0 ? trimmed : null;
}

function mapRowFromHeader(header, values) {
  return header.reduce((row, column, index) => {
    row[column.trim()] = values[index] ?? "";
    return row;
  }, {});
}

function getCanonicalValue(rawRow, headerResolution, canonicalField) {
  const column = headerResolution.headerByField[canonicalField];

  if (!column) {
    return null;
  }

  return rawRow[column];
}

export function normalizeRow(reportType, header, values, context, headerResolution) {
  const canonicalReportType = normalizeReportType(reportType);
  assertHeaderResolution(headerResolution, canonicalReportType);
  const rawRow = mapRowFromHeader(header, values);
  const rowNumber = context.rowNumber;
  const batchId = context.batchId;

  if (canonicalReportType === REPORT_TYPES.NE) {
    return {
      import_batch_id: batchId,
      source_row_number: rowNumber,
      year_scope: context.yearScope,
      codigo_nota_empenho: toText(getCanonicalValue(rawRow, headerResolution, "codigo_nota_empenho")),
      data_empenho: parseDate(getCanonicalValue(rawRow, headerResolution, "data_empenho")),
      nome_usuario_criou: toText(getCanonicalValue(rawRow, headerResolution, "nome_usuario_criou")),
      codigo_unidade_gestora: toText(getCanonicalValue(rawRow, headerResolution, "codigo_unidade_gestora")),
      numero_processo: toText(getCanonicalValue(rawRow, headerResolution, "numero_processo")),
      valor_original: parseDecimal(getCanonicalValue(rawRow, headerResolution, "valor_original")),
      valor_corrente: parseDecimal(getCanonicalValue(rawRow, headerResolution, "valor_corrente")),
      saldo_a_liquidar: parseDecimal(getCanonicalValue(rawRow, headerResolution, "saldo_a_liquidar")),
      quantidade: parseDecimal(getCanonicalValue(rawRow, headerResolution, "quantidade")),
      raw_row: rawRow
    };
  }

  if (canonicalReportType === REPORT_TYPES.NEDL) {
    return {
      import_batch_id: batchId,
      source_row_number: rowNumber,
      year_scope: context.yearScope,
      documento_liquidacao: toText(getCanonicalValue(rawRow, headerResolution, "documento_liquidacao")),
      data_liquidacao: parseDate(getCanonicalValue(rawRow, headerResolution, "data_liquidacao")),
      codigo_nota_empenho: toText(getCanonicalValue(rawRow, headerResolution, "codigo_nota_empenho")),
      codigo_natureza_despesa: toText(getCanonicalValue(rawRow, headerResolution, "codigo_natureza_despesa")),
      nome_fonte_recurso: toText(getCanonicalValue(rawRow, headerResolution, "nome_fonte_recurso")),
      codigo_fonte_recurso: toText(getCanonicalValue(rawRow, headerResolution, "codigo_fonte_recurso")),
      nome_detalhamento_fr: toText(getCanonicalValue(rawRow, headerResolution, "nome_detalhamento_fr")),
      codigo_detalhamento_fr: toText(getCanonicalValue(rawRow, headerResolution, "codigo_detalhamento_fr")),
      numero_processo: toText(getCanonicalValue(rawRow, headerResolution, "numero_processo")),
      codigo_projeto_atividade: toText(getCanonicalValue(rawRow, headerResolution, "codigo_projeto_atividade")),
      credor_nome: toText(getCanonicalValue(rawRow, headerResolution, "credor_nome")),
      contrato: toText(getCanonicalValue(rawRow, headerResolution, "contrato")),
      convenio: toText(getCanonicalValue(rawRow, headerResolution, "convenio")),
      valor_original: parseDecimal(getCanonicalValue(rawRow, headerResolution, "valor_original")),
      valor_liquido: parseDecimal(getCanonicalValue(rawRow, headerResolution, "valor_liquido")),
      valor_bruto: parseDecimal(getCanonicalValue(rawRow, headerResolution, "valor_bruto")),
      valor_retido: parseDecimal(getCanonicalValue(rawRow, headerResolution, "valor_retido")),
      valor_pago: parseDecimal(getCanonicalValue(rawRow, headerResolution, "valor_pago")),
      valor_liquidado_a_pagar: parseDecimal(getCanonicalValue(rawRow, headerResolution, "valor_liquidado_a_pagar")),
      raw_row: rawRow
    };
  }

  if (canonicalReportType === REPORT_TYPES.DLOB) {
    return {
      import_batch_id: batchId,
      source_row_number: rowNumber,
      year_scope: context.yearScope,
      ordem_bancaria: toText(getCanonicalValue(rawRow, headerResolution, "ordem_bancaria")),
      data_pagamento: parseDate(getCanonicalValue(rawRow, headerResolution, "data_pagamento")),
      documento_liquidacao: toText(getCanonicalValue(rawRow, headerResolution, "documento_liquidacao")),
      codigo_unidade_gestora: toText(getCanonicalValue(rawRow, headerResolution, "codigo_unidade_gestora")),
      nome_usuario_criou: toText(getCanonicalValue(rawRow, headerResolution, "nome_usuario_criou")),
      finalidade: toText(getCanonicalValue(rawRow, headerResolution, "finalidade")),
      valor: parseDecimal(getCanonicalValue(rawRow, headerResolution, "valor")),
      raw_row: rawRow
    };
  }

  throw new Error(`Unsupported report type for normalization: ${canonicalReportType}`);
}

export function normalizeRows(reportType, header, rows, context, headerResolution) {
  const canonicalReportType = normalizeReportType(reportType);

  if (!REPORT_SCHEMAS[canonicalReportType]) {
    throw new Error(`Unsupported report type: ${canonicalReportType}`);
  }

  assertHeaderResolution(headerResolution, canonicalReportType);

  return rows.map((values, index) =>
    normalizeRow(
      canonicalReportType,
      header,
      values,
      {
        ...context,
        rowNumber: index + 2
      },
      headerResolution
    )
  );
}
