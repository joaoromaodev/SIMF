import { REPORT_SCHEMAS, REPORT_TYPES } from "./schemas.js";

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

  const slashMatch = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(stringValue);

  if (slashMatch) {
    return `${slashMatch[3]}-${slashMatch[2]}-${slashMatch[1]}`;
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
    row[column] = values[index] ?? "";
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
  assertHeaderResolution(headerResolution, reportType);
  const rawRow = mapRowFromHeader(header, values);
  const rowNumber = context.rowNumber;
  const batchId = context.batchId;

  if (reportType === REPORT_TYPES.NE_DL) {
    return {
      import_batch_id: batchId,
      source_row_number: rowNumber,
      year_scope: context.yearScope,
      numero_processo: toText(getCanonicalValue(rawRow, headerResolution, "numero_processo")),
      codigo_nota_empenho: toText(getCanonicalValue(rawRow, headerResolution, "codigo_nota_empenho")),
      documento_liquidacao: toText(getCanonicalValue(rawRow, headerResolution, "documento_liquidacao")),
      data_liquidacao: parseDate(getCanonicalValue(rawRow, headerResolution, "data_liquidacao")),
      codigo_projeto_atividade: toText(getCanonicalValue(rawRow, headerResolution, "codigo_projeto_atividade")),
      codigo_natureza_despesa: toText(getCanonicalValue(rawRow, headerResolution, "codigo_natureza_despesa")),
      codigo_fonte_recurso: toText(getCanonicalValue(rawRow, headerResolution, "codigo_fonte_recurso")),
      codigo_detalhamento_fr: toText(getCanonicalValue(rawRow, headerResolution, "codigo_detalhamento_fr")),
      codigo_unidade_gestora: toText(getCanonicalValue(rawRow, headerResolution, "codigo_unidade_gestora")),
      credor_nome: toText(getCanonicalValue(rawRow, headerResolution, "credor_nome")),
      contrato: toText(getCanonicalValue(rawRow, headerResolution, "contrato")),
      convenio: toText(getCanonicalValue(rawRow, headerResolution, "convenio")),
      valor_original: parseDecimal(getCanonicalValue(rawRow, headerResolution, "valor_original")),
      valor_liquido: parseDecimal(getCanonicalValue(rawRow, headerResolution, "valor_liquido")),
      valor_bruto: parseDecimal(getCanonicalValue(rawRow, headerResolution, "valor_bruto")),
      valor_retido: parseDecimal(getCanonicalValue(rawRow, headerResolution, "valor_retido")),
      valor_pago: parseDecimal(getCanonicalValue(rawRow, headerResolution, "valor_pago")),
      valor_liquidado_a_pagar: parseDecimal(getCanonicalValue(rawRow, headerResolution, "valor_liquidado_a_pagar")),
      valor_liquido_2: parseDecimal(getCanonicalValue(rawRow, headerResolution, "valor_liquido_2")),
      raw_row: rawRow
    };
  }

  if (reportType === REPORT_TYPES.DL_OB) {
    return {
      import_batch_id: batchId,
      source_row_number: rowNumber,
      year_scope: context.yearScope,
      numero_processo: toText(getCanonicalValue(rawRow, headerResolution, "numero_processo")),
      documento_liquidacao: toText(getCanonicalValue(rawRow, headerResolution, "documento_liquidacao")),
      data_liquidacao: parseDate(getCanonicalValue(rawRow, headerResolution, "data_liquidacao")),
      ordem_bancaria: toText(getCanonicalValue(rawRow, headerResolution, "ordem_bancaria")),
      ob_credor_documento: toText(getCanonicalValue(rawRow, headerResolution, "ob_credor_documento")),
      ob_credor_nome: toText(getCanonicalValue(rawRow, headerResolution, "ob_credor_nome")),
      data_pagamento: parseDate(getCanonicalValue(rawRow, headerResolution, "data_pagamento")),
      codigo_fonte_recurso: toText(getCanonicalValue(rawRow, headerResolution, "codigo_fonte_recurso")),
      codigo_detalhamento_fr: toText(getCanonicalValue(rawRow, headerResolution, "codigo_detalhamento_fr")),
      codigo_unidade_gestora: toText(getCanonicalValue(rawRow, headerResolution, "codigo_unidade_gestora")),
      codigo_projeto_atividade: toText(getCanonicalValue(rawRow, headerResolution, "codigo_projeto_atividade")),
      codigo_natureza_despesa: toText(getCanonicalValue(rawRow, headerResolution, "codigo_natureza_despesa")),
      nome_natureza_despesa: toText(getCanonicalValue(rawRow, headerResolution, "nome_natureza_despesa")),
      nome_elemento_despesa: toText(getCanonicalValue(rawRow, headerResolution, "nome_elemento_despesa")),
      valor: parseDecimal(getCanonicalValue(rawRow, headerResolution, "valor")),
      raw_row: rawRow
    };
  }

  throw new Error(`Unsupported report type for normalization: ${reportType}`);
}

export function normalizeRows(reportType, header, rows, context, headerResolution) {
  if (!REPORT_SCHEMAS[reportType]) {
    throw new Error(`Unsupported report type: ${reportType}`);
  }

  assertHeaderResolution(headerResolution, reportType);

  return rows.map((values, index) =>
    normalizeRow(
      reportType,
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
