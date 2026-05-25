export const REPORT_TYPES = {
  NE: "NE",
  NEDL: "NEDL",
  DLOB: "DLOB",
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
  [REPORT_TYPES.NE]: buildSchema({
    key: REPORT_TYPES.NE,
    label: "NE - Notas de Empenho",
    fileCode: "NE",
    normalizedTable: "normalized_ne_rows",
    fields: {
      codigo_nota_empenho: {
        required: true,
        preferredHeader: "CodigoNotadeEmpenho"
      },
      data_empenho: {
        required: false,
        preferredHeader: "DatadoEmpenho"
      },
      nome_usuario_criou: {
        required: false,
        preferredHeader: "NomeUsuarioQueCriou"
      },
      codigo_unidade_gestora: {
        required: false,
        preferredHeader: "InstituicaoCodigoUnidadeGestora",
        aliases: ["CodigoUnidadeGestora"]
      },
      numero_processo: {
        required: true,
        preferredHeader: "NUMERO_PROCESSO"
      },
      valor_original: {
        required: false,
        preferredHeader: "Valor Original"
      },
      valor_corrente: {
        required: false,
        preferredHeader: "Valor Corrente"
      },
      saldo_a_liquidar: {
        required: false,
        preferredHeader: "Saldo a Liquidar"
      },
      quantidade: {
        required: false,
        preferredHeader: "Quantidade"
      }
    }
  }),
  [REPORT_TYPES.NEDL]: buildSchema({
    key: REPORT_TYPES.NEDL,
    label: "NEDL - Notas de Empenho e Documentos de Liquidação",
    fileCode: "NEDL",
    normalizedTable: "normalized_nedl_rows",
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
      codigo_natureza_despesa: {
        required: false,
        preferredHeader: "CodigoNaturezaDaDespesa"
      },
      nome_fonte_recurso: {
        required: false,
        preferredHeader: "NomeFonteDeRecurso"
      },
      codigo_fonte_recurso: {
        required: false,
        preferredHeader: "CodigoFonteDeRecurso"
      },
      nome_detalhamento_fr: {
        required: false,
        preferredHeader: "NomeDetalhamentoFr"
      },
      codigo_detalhamento_fr: {
        required: false,
        preferredHeader: "CodigoDetalhamentoFr"
      },
      numero_processo: {
        required: true,
        preferredHeader: "NUMERO_PROCESSO"
      },
      codigo_projeto_atividade: {
        required: false,
        preferredHeader: "CodigoProjetoAtividade"
      },
      credor_nome: {
        required: false,
        preferredHeader: "NomeCredor",
        aliases: ["Credor_Nome"]
      },
      contrato: {
        required: false,
        preferredHeader: "CONTRATO"
      },
      convenio: {
        required: false,
        preferredHeader: "CONVENIO"
      },
      codigo_unidade_gestora: {
        required: false,
        preferredHeader: "InstituicaoCodigoUnidadeGestora",
        aliases: ["CodigoUnidadeGestora"]
      },
      nome_usuario_criou: {
        required: false,
        preferredHeader: "NomeUsuarioQueCriou"
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
      }
    }
  }),
  [REPORT_TYPES.DLOB]: buildSchema({
    key: REPORT_TYPES.DLOB,
    label: "DLOB - Documentos de Liquidação e Ordens Bancárias",
    fileCode: "DLOB",
    normalizedTable: "normalized_dlob_rows",
    fields: {
      ordem_bancaria: {
        required: true,
        preferredHeader: "OrdemBancaria"
      },
      data_pagamento: {
        required: false,
        preferredHeader: "DatadoPagamento"
      },
      documento_liquidacao: {
        required: true,
        preferredHeader: "DocumentodaLiquidacao",
        aliases: ["DocumentodeLiquidacao"]
      },
      codigo_unidade_gestora: {
        required: false,
        preferredHeader: "CodigoUnidadeGestora"
      },
      nome_usuario_criou: {
        required: false,
        preferredHeader: "NomeUsuarioQueCriou"
      },
      finalidade: {
        required: false,
        preferredHeader: "Finalidade"
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
  const upperReportType = trimmedReportType.toUpperCase();

  if (upperReportType === "NE") {
    return REPORT_TYPES.NE;
  }

  if (upperReportType === "NEDL" || upperReportType === "NE+DL" || upperReportType === "NE_DL") {
    return REPORT_TYPES.NEDL;
  }

  if (upperReportType === "DLOB" || upperReportType === "DL+OB" || upperReportType === "DL_OB") {
    return REPORT_TYPES.DLOB;
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
