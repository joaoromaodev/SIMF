import { REPORT_SCHEMAS, REPORT_TYPES } from "./schemas.js";

function parseDecimal(value) {
  if (value == null) {
    return null;
  }

  const stringValue = String(value).trim();

  if (!stringValue) {
    return null;
  }

  const sanitized = stringValue
    .replace(/\s/g, "")
    .replace(/\.(?=\d{3}(\D|$))/g, "")
    .replace(",", ".");

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

export function normalizeRow(reportType, header, values, context) {
  const rawRow = mapRowFromHeader(header, values);
  const rowNumber = context.rowNumber;
  const batchId = context.batchId;

  if (reportType === REPORT_TYPES.NE_DL) {
    return {
      import_batch_id: batchId,
      source_row_number: rowNumber,
      year_scope: context.yearScope,
      numero_processo: toText(rawRow.NUMERO_PROCESSO),
      codigo_nota_empenho: toText(rawRow.CodigoNotadeEmpenho),
      documento_liquidacao: toText(rawRow.DocumentodeLiquidacao),
      codigo_plano_interno: toText(rawRow.CodigoPlanoInterno),
      codigo_projeto_atividade: toText(rawRow.CodigoProjetoAtividade),
      codigo_natureza_despesa: toText(rawRow.CodigoNaturezaDaDespesa),
      codigo_fonte_recurso: toText(rawRow.CodigoFonteDeRecurso),
      codigo_detalhamento_fr: toText(rawRow.CodigoDetalhamentoFr),
      codigo_unidade_gestora: toText(rawRow.InstituicaoCodigoUnidadeGestora),
      valor_original: parseDecimal(rawRow["Valor Original"]),
      valor_liquido: parseDecimal(rawRow["Valor Liquido"]),
      valor_bruto: parseDecimal(rawRow["Valor Bruto"]),
      valor_retido: parseDecimal(rawRow["Valor Retido"]),
      valor_pago: parseDecimal(rawRow["Valor Pago"]),
      valor_liquidado_a_pagar: parseDecimal(rawRow["Valor Liquidado a Pagar"]),
      valor_liquido_2: parseDecimal(rawRow["Valor Liquido2"]),
      raw_row: rawRow
    };
  }

  if (reportType === REPORT_TYPES.DL_OB) {
    return {
      import_batch_id: batchId,
      source_row_number: rowNumber,
      year_scope: context.yearScope,
      numero_processo: toText(rawRow.NUMERO_PROCESSO),
      documento_liquidacao: toText(rawRow.DocumentodeLiquidacao),
      ordem_bancaria: toText(rawRow.OrdemBancaria),
      ob_credor_documento: toText(rawRow.CredorDocumento),
      ob_credor_nome: toText(rawRow.Credor_Nome),
      dl_documento_credor: toText(rawRow.DocumentoCredor),
      dl_nome_credor: toText(rawRow.NomeCredor),
      data_pagamento: parseDate(rawRow.DatadoPagamento),
      codigo_fonte_recurso: toText(rawRow.CodigoFonteDeRecurso),
      codigo_detalhamento_fr: toText(rawRow.CodigoDetalhamentoFr),
      codigo_unidade_gestora: toText(rawRow.CodigoUnidadeGestora),
      valor: parseDecimal(rawRow.Valor),
      raw_row: rawRow
    };
  }

  throw new Error(`Unsupported report type for normalization: ${reportType}`);
}

export function normalizeRows(reportType, header, rows, context) {
  if (!REPORT_SCHEMAS[reportType]) {
    throw new Error(`Unsupported report type: ${reportType}`);
  }

  return rows.map((values, index) =>
    normalizeRow(reportType, header, values, {
      ...context,
      rowNumber: index + 2
    })
  );
}
