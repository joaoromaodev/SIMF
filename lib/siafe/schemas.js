export const REPORT_TYPES = {
  NE_DL: "NE_DL",
  DL_OB: "DL_OB"
};

export const YEAR_SCOPES = ["2023_2024", "2025", "2026"];

const NE_DL_HEADERS = [
  "DocumentodeLiquidacao",
  "CodigoNotadeEmpenho",
  "CodigoPlanoInterno",
  "CodigoProjetoAtividade",
  "CodigoNaturezaDaDespesa",
  "CodigoFonteDeRecurso",
  "CodigoDetalhamentoFr",
  "NUMERO_PROCESSO",
  "InstituicaoCodigoUnidadeGestora",
  "Valor Original",
  "Valor Liquido",
  "Valor Bruto",
  "Valor Retido",
  "Valor Pago",
  "Valor Liquidado a Pagar",
  "Valor Liquido2"
];

const DL_OB_HEADERS = [
  "OrdemBancaria",
  "CredorDocumento",
  "Credor_Nome",
  "DatadoPagamento",
  "CodigoFonteDeRecurso",
  "CodigoDetalhamentoFr",
  "DocumentodeLiquidacao",
  "DocumentoCredor",
  "NomeCredor",
  "NUMERO_PROCESSO",
  "CodigoUnidadeGestora",
  "Valor"
];

export const REPORT_SCHEMAS = {
  [REPORT_TYPES.NE_DL]: {
    key: REPORT_TYPES.NE_DL,
    label: "NE+DL",
    fileCode: "NEDL",
    normalizedTable: "normalized_ne_dl_rows",
    headers: NE_DL_HEADERS,
    fieldMap: {
      DocumentodeLiquidacao: "documento_liquidacao",
      CodigoNotadeEmpenho: "codigo_nota_empenho",
      CodigoPlanoInterno: "codigo_plano_interno",
      CodigoProjetoAtividade: "codigo_projeto_atividade",
      CodigoNaturezaDaDespesa: "codigo_natureza_despesa",
      CodigoFonteDeRecurso: "codigo_fonte_recurso",
      CodigoDetalhamentoFr: "codigo_detalhamento_fr",
      NUMERO_PROCESSO: "numero_processo",
      InstituicaoCodigoUnidadeGestora: "codigo_unidade_gestora",
      "Valor Original": "valor_original",
      "Valor Liquido": "valor_liquido",
      "Valor Bruto": "valor_bruto",
      "Valor Retido": "valor_retido",
      "Valor Pago": "valor_pago",
      "Valor Liquidado a Pagar": "valor_liquidado_a_pagar",
      "Valor Liquido2": "valor_liquido_2"
    }
  },
  [REPORT_TYPES.DL_OB]: {
    key: REPORT_TYPES.DL_OB,
    label: "DL+OB",
    fileCode: "DLOB",
    normalizedTable: "normalized_dl_ob_rows",
    headers: DL_OB_HEADERS,
    fieldMap: {
      OrdemBancaria: "ordem_bancaria",
      CredorDocumento: "ob_credor_documento",
      Credor_Nome: "ob_credor_nome",
      DatadoPagamento: "data_pagamento",
      CodigoFonteDeRecurso: "codigo_fonte_recurso",
      CodigoDetalhamentoFr: "codigo_detalhamento_fr",
      DocumentodeLiquidacao: "documento_liquidacao",
      DocumentoCredor: "dl_documento_credor",
      NomeCredor: "dl_nome_credor",
      NUMERO_PROCESSO: "numero_processo",
      CodigoUnidadeGestora: "codigo_unidade_gestora",
      Valor: "valor"
    }
  }
};

export function getExpectedFileName(reportType, yearScope) {
  const schema = REPORT_SCHEMAS[reportType];

  if (!schema || !YEAR_SCOPES.includes(yearScope)) {
    return null;
  }

  return `${yearScope}_${schema.fileCode}.csv`;
}

