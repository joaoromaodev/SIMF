export const REPORT_TYPES = {
  NE_DL: "NE_DL",
  DL_OB: "DL_OB"
};

export const YEAR_SCOPES = ["2023_2024", "2025", "2026"];

function buildSchema({
  key,
  label,
  fileCode,
  normalizedTable,
  fields
}) {
  const fieldEntries = Object.entries(fields);
  const fieldMap = {};
  const preferredHeaderByField = {};
  const aliasesByField = {};
  const headerBindings = {};

  for (const [canonicalField, config] of fieldEntries) {
    const preferredHeader = config.preferredHeader;
    const aliases = config.aliases ?? [];

    preferredHeaderByField[canonicalField] = preferredHeader;
    aliasesByField[canonicalField] = aliases;
    fieldMap[preferredHeader] = canonicalField;
    headerBindings[preferredHeader] = {
      canonicalField,
      preferredHeader,
      via: "preferred"
    };

    for (const alias of aliases) {
      headerBindings[alias] = {
        canonicalField,
        preferredHeader,
        via: "alias"
      };
    }
  }

  return {
    key,
    label,
    fileCode,
    normalizedTable,
    headers: fieldEntries.map(([, config]) => config.preferredHeader),
    fieldMap,
    fields,
    requiredFields: fieldEntries
      .filter(([, config]) => config.required)
      .map(([canonicalField]) => canonicalField),
    optionalFields: fieldEntries
      .filter(([, config]) => !config.required)
      .map(([canonicalField]) => canonicalField),
    preferredHeaderByField,
    aliasesByField,
    headerBindings
  };
}

export const REPORT_SCHEMAS = {
  [REPORT_TYPES.NE_DL]: buildSchema({
    key: REPORT_TYPES.NE_DL,
    label: "NE+DL",
    fileCode: "NEDL",
    normalizedTable: "normalized_ne_dl_rows",
    fields: {
      documento_liquidacao: {
        required: true,
        preferredHeader: "DocumentodeLiquidacao"
      },
      data_liquidacao: {
        required: false,
        preferredHeader: "DatadaLiquidacao"
      },
      codigo_nota_empenho: {
        required: true,
        preferredHeader: "CodigoNotadeEmpenho"
      },
      numero_processo: {
        required: true,
        preferredHeader: "NUMERO_PROCESSO"
      },
      codigo_natureza_despesa: {
        required: false,
        preferredHeader: "CodigoNaturezaDaDespesa"
      },
      codigo_fonte_recurso: {
        required: false,
        preferredHeader: "CodigoFonteDeRecurso"
      },
      codigo_detalhamento_fr: {
        required: false,
        preferredHeader: "CodigoDetalhamentoFr"
      },
      codigo_projeto_atividade: {
        required: false,
        preferredHeader: "CodigoProjetoAtividade"
      },
      codigo_unidade_gestora: {
        required: false,
        preferredHeader: "CodigoUnidadeGestora",
        aliases: ["InstituicaoCodigoUnidadeGestora"]
      },
      credor_nome: {
        required: false,
        preferredHeader: "Credor_Nome",
        aliases: ["NomeCredor"]
      },
      contrato: {
        required: false,
        preferredHeader: "CONTRATO"
      },
      convenio: {
        required: false,
        preferredHeader: "CONVENIO"
      },
      valor_original: {
        required: false,
        preferredHeader: "Valor Original"
      },
      valor_liquido: {
        required: false,
        preferredHeader: "Valor Liquido"
      },
      valor_bruto: {
        required: false,
        preferredHeader: "Valor Bruto"
      },
      valor_retido: {
        required: false,
        preferredHeader: "Valor Retido"
      },
      valor_pago: {
        required: false,
        preferredHeader: "Valor Pago"
      },
      valor_liquidado_a_pagar: {
        required: false,
        preferredHeader: "Valor Liquidado a Pagar"
      },
      valor_liquido_2: {
        required: false,
        preferredHeader: "Valor Liquido2"
      }
    }
  }),
  [REPORT_TYPES.DL_OB]: buildSchema({
    key: REPORT_TYPES.DL_OB,
    label: "DL+OB",
    fileCode: "DLOB",
    normalizedTable: "normalized_dl_ob_rows",
    fields: {
      documento_liquidacao: {
        required: true,
        preferredHeader: "DocumentodeLiquidacao"
      },
      data_liquidacao: {
        required: false,
        preferredHeader: "DatadaLiquidacao"
      },
      numero_processo: {
        required: true,
        preferredHeader: "NUMERO_PROCESSO"
      },
      ordem_bancaria: {
        required: false,
        preferredHeader: "OrdemBancaria"
      },
      ob_credor_documento: {
        required: false,
        preferredHeader: "CredorDocumento"
      },
      ob_credor_nome: {
        required: false,
        preferredHeader: "Credor_Nome"
      },
      data_pagamento: {
        required: false,
        preferredHeader: "DatadoPagamento"
      },
      codigo_fonte_recurso: {
        required: false,
        preferredHeader: "CodigoFonteDeRecurso"
      },
      codigo_detalhamento_fr: {
        required: false,
        preferredHeader: "CodigoDetalhamentoFr"
      },
      codigo_unidade_gestora: {
        required: false,
        preferredHeader: "CodigoUnidadeGestora"
      },
      codigo_projeto_atividade: {
        required: false,
        preferredHeader: "CodigoProjetoAtividade"
      },
      codigo_natureza_despesa: {
        required: false,
        preferredHeader: "CodigoNaturezaDaDespesa"
      },
      nome_natureza_despesa: {
        required: false,
        preferredHeader: "NomeNaturezaDaDespesa"
      },
      nome_elemento_despesa: {
        required: false,
        preferredHeader: "NomeElementoDeDespesa"
      },
      valor: {
        required: false,
        preferredHeader: "Valor"
      }
    }
  })
};

export function normalizeReportType(reportType) {
  if (typeof reportType !== "string") {
    return reportType;
  }

  const trimmedReportType = reportType.trim();

  if (trimmedReportType === "NE+DL") {
    return REPORT_TYPES.NE_DL;
  }

  if (trimmedReportType === "DL+OB") {
    return REPORT_TYPES.DL_OB;
  }

  return trimmedReportType;
}

export function getExpectedFileName(reportType, yearScope) {
  const schema = REPORT_SCHEMAS[normalizeReportType(reportType)];

  if (!schema || !YEAR_SCOPES.includes(yearScope)) {
    return null;
  }

  return `${yearScope}_${schema.fileCode}.csv`;
}
