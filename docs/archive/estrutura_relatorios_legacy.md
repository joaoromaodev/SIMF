**NEDL \= CUBOS DE LIQUIDAÇÃO**

**NEDL:**

**{DocumentodeLiquidacao, DatadaLiquidacao,CodigoNotadeEmpenho,CodigoNaturezaDaDespesa,CodigoFonteDeRecurso,CodigoDetalhamentoFr,NUMERO\_PROCESSO,CodigoProjetoAtividade,InstituicaoCodigoUnidadeGestora,Credor\_Nome,CONTRATO,CONVENIO,Valor Original,Valor Liquido,Valor Bruto,Valor Retido,Valor Pago,Valor Liquidado a Pagar,Valor Liquido2}**

**\#\# 2026\_NEDL MDX:**

**WITH**  
**SET \[\~ROWS\_DocumentosdeLiquidacao\_DocumentosdeLiquidacao.DocumentosdeLiquidacao\] AS**  
    **{\[DocumentosdeLiquidacao\].\[DocumentodeLiquidacao\].Members}**  
**SET \[\~ROWS\_DocumentosdeLiquidacao\_DocumentosdeLiquidacao.DatasdeLiquidacao\] AS**  
    **{\[DocumentosdeLiquidacao.DatasdeLiquidacao\].\[DatadaLiquidacao\].Members}**  
**SET \[\~ROWS\_NotadeEmpenho\_NotadeEmpenho.CodigoNotadeEmpenho\] AS**  
    **{\[NotadeEmpenho.CodigoNotadeEmpenho\].\[CodigoNotadeEmpenho\].Members}**  
**SET \[\~ROWS\_naturezadadespesa\_naturezadadespesa.CodigoNaturezaDaDespesa\] AS**  
    **{\[naturezadadespesa.CodigoNaturezaDaDespesa\].\[CodigoNaturezaDaDespesa\].Members}**  
**SET \[\~ROWS\_fontederecurso\_fontederecurso.CodigoFonteDeRecurso\] AS**  
    **{\[fontederecurso.CodigoFonteDeRecurso\].\[CodigoFonteDeRecurso\].Members}**  
**SET \[\~ROWS\_DetalhamentoFr\_DetalhamentoFr.CodigoDetalhamentoFr\] AS**  
    **{\[DetalhamentoFr.CodigoDetalhamentoFr\].\[CodigoDetalhamentoFr\].Members}**  
**SET \[\~ROWS\_InformacoesExtrasdoEmpenho\_InformacoesExtrasdoEmpenho.NumeroProcesso\] AS**  
    **{\[InformacoesExtrasdoEmpenho.NumeroProcesso\].\[NUMERO\_PROCESSO\].Members}**  
**SET \[\~ROWS\_projetoatividade\_projetoatividade.CodigoProjetoAtividade\] AS**  
    **{\[projetoatividade.CodigoProjetoAtividade\].\[CodigoProjetoAtividade\].Members}**  
**SET \[\~ROWS\_InstituicoesUnidadeGestora\_InstituicoesUnidadeGestora.InstituicaoCodigoUnidadeGestora\] AS**  
    **{\[InstituicoesUnidadeGestora.InstituicaoCodigoUnidadeGestora\].\[160101\]}**  
**SET \[\~ROWS\_DetalhesdaLiquidacao\_DetalhesdaLiquidacao.NomeCredordaRetencao\] AS**  
    **{\[DetalhesdaLiquidacao.NomeCredordaRetencao\].\[NomeCredor\].Members}**  
**SET \[\~ROWS\_InformacoesExtrasdoEmpenho\_InformacoesExtrasdoEmpenho.Contrato\] AS**  
    **{\[InformacoesExtrasdoEmpenho.Contrato\].\[CONTRATO\].Members}**  
**SET \[\~ROWS\_InformacoesExtrasdoEmpenho\_InformacoesExtrasdoEmpenho.Convenio\] AS**  
    **{\[InformacoesExtrasdoEmpenho.Convenio\].\[CONVENIO\].Members}**  
**SELECT**  
**NON EMPTY {\[Measures\].\[Valor Original\], \[Measures\].\[Valor Liquido\], \[Measures\].\[Valor Bruto\], \[Measures\].\[Valor Retido\], \[Measures\].\[Valor Pago\], \[Measures\].\[Valor Liquidado a Pagar\], \[Measures\].\[Valor Liquido2\]} ON COLUMNS,**  
**NON EMPTY NonEmptyCrossJoin(\[\~ROWS\_DocumentosdeLiquidacao\_DocumentosdeLiquidacao.DocumentosdeLiquidacao\], NonEmptyCrossJoin(\[\~ROWS\_DocumentosdeLiquidacao\_DocumentosdeLiquidacao.DatasdeLiquidacao\], NonEmptyCrossJoin(\[\~ROWS\_NotadeEmpenho\_NotadeEmpenho.CodigoNotadeEmpenho\], NonEmptyCrossJoin(\[\~ROWS\_naturezadadespesa\_naturezadadespesa.CodigoNaturezaDaDespesa\], NonEmptyCrossJoin(\[\~ROWS\_fontederecurso\_fontederecurso.CodigoFonteDeRecurso\], NonEmptyCrossJoin(\[\~ROWS\_DetalhamentoFr\_DetalhamentoFr.CodigoDetalhamentoFr\], NonEmptyCrossJoin(\[\~ROWS\_InformacoesExtrasdoEmpenho\_InformacoesExtrasdoEmpenho.NumeroProcesso\], NonEmptyCrossJoin(\[\~ROWS\_projetoatividade\_projetoatividade.CodigoProjetoAtividade\], NonEmptyCrossJoin(\[\~ROWS\_InstituicoesUnidadeGestora\_InstituicoesUnidadeGestora.InstituicaoCodigoUnidadeGestora\], NonEmptyCrossJoin(\[\~ROWS\_DetalhesdaLiquidacao\_DetalhesdaLiquidacao.NomeCredordaRetencao\], NonEmptyCrossJoin(\[\~ROWS\_InformacoesExtrasdoEmpenho\_InformacoesExtrasdoEmpenho.Contrato\], \[\~ROWS\_InformacoesExtrasdoEmpenho\_InformacoesExtrasdoEmpenho.Convenio\]))))))))))) ON ROWS**  
**FROM \[CUBO\_2026\_OLAP\_LIQUIDACAO\]**

**\#\# 2025\_NEDL MDX:**

**WITH**  
**SET \[\~ROWS\_DocumentosdeLiquidacao\_DocumentosdeLiquidacao.DocumentosdeLiquidacao\] AS**  
    **{\[DocumentosdeLiquidacao\].\[DocumentodeLiquidacao\].Members}**  
**SET \[\~ROWS\_DocumentosdeLiquidacao\_DocumentosdeLiquidacao.DatasdeLiquidacao\] AS**  
    **{\[DocumentosdeLiquidacao.DatasdeLiquidacao\].\[DatadaLiquidacao\].Members}**  
**SET \[\~ROWS\_NotadeEmpenho\_NotadeEmpenho.CodigoNotadeEmpenho\] AS**  
    **{\[NotadeEmpenho.CodigoNotadeEmpenho\].\[CodigoNotadeEmpenho\].Members}**  
**SET \[\~ROWS\_naturezadadespesa\_naturezadadespesa.CodigoNaturezaDaDespesa\] AS**  
    **{\[naturezadadespesa.CodigoNaturezaDaDespesa\].\[CodigoNaturezaDaDespesa\].Members}**  
**SET \[\~ROWS\_fontederecurso\_fontederecurso.CodigoFonteDeRecurso\] AS**  
    **{\[fontederecurso.CodigoFonteDeRecurso\].\[CodigoFonteDeRecurso\].Members}**  
**SET \[\~ROWS\_DetalhamentoFr\_DetalhamentoFr.CodigoDetalhamentoFr\] AS**  
    **{\[DetalhamentoFr.CodigoDetalhamentoFr\].\[CodigoDetalhamentoFr\].Members}**  
**SET \[\~ROWS\_InformacoesExtrasdoEmpenho\_InformacoesExtrasdoEmpenho.NumeroProcesso\] AS**  
    **{\[InformacoesExtrasdoEmpenho.NumeroProcesso\].\[NUMERO\_PROCESSO\].Members}**  
**SET \[\~ROWS\_projetoatividade\_projetoatividade.CodigoProjetoAtividade\] AS**  
    **{\[projetoatividade.CodigoProjetoAtividade\].\[CodigoProjetoAtividade\].Members}**  
**SET \[\~ROWS\_InstituicoesUnidadeGestora\_InstituicoesUnidadeGestora.InstituicaoCodigoUnidadeGestora\] AS**  
    **{\[InstituicoesUnidadeGestora.InstituicaoCodigoUnidadeGestora\].\[160101\]}**  
**SET \[\~ROWS\_Credor\_Documento\_Credor\_Documento.Credor\_Nome\] AS**  
    **{\[Credor\_Documento.Credor\_Nome\].\[Credor\_Nome\].Members}**  
**SET \[\~ROWS\_InformacoesExtrasdoEmpenho\_InformacoesExtrasdoEmpenho.Contrato\] AS**  
    **{\[InformacoesExtrasdoEmpenho.Contrato\].\[CONTRATO\].Members}**  
**SET \[\~ROWS\_InformacoesExtrasdoEmpenho\_InformacoesExtrasdoEmpenho.Convenio\] AS**  
    **{\[InformacoesExtrasdoEmpenho.Convenio\].\[CONVENIO\].Members}**  
**SELECT**  
**NON EMPTY {\[Measures\].\[Valor Original\], \[Measures\].\[Valor Liquido\], \[Measures\].\[Valor Bruto\], \[Measures\].\[Valor Retido\], \[Measures\].\[Valor Pago\], \[Measures\].\[Valor Liquidado a Pagar\], \[Measures\].\[Valor Liquido2\]} ON COLUMNS,**  
**NON EMPTY NonEmptyCrossJoin(\[\~ROWS\_DocumentosdeLiquidacao\_DocumentosdeLiquidacao.DocumentosdeLiquidacao\], NonEmptyCrossJoin(\[\~ROWS\_DocumentosdeLiquidacao\_DocumentosdeLiquidacao.DatasdeLiquidacao\], NonEmptyCrossJoin(\[\~ROWS\_NotadeEmpenho\_NotadeEmpenho.CodigoNotadeEmpenho\], NonEmptyCrossJoin(\[\~ROWS\_naturezadadespesa\_naturezadadespesa.CodigoNaturezaDaDespesa\], NonEmptyCrossJoin(\[\~ROWS\_fontederecurso\_fontederecurso.CodigoFonteDeRecurso\], NonEmptyCrossJoin(\[\~ROWS\_DetalhamentoFr\_DetalhamentoFr.CodigoDetalhamentoFr\], NonEmptyCrossJoin(\[\~ROWS\_InformacoesExtrasdoEmpenho\_InformacoesExtrasdoEmpenho.NumeroProcesso\], NonEmptyCrossJoin(\[\~ROWS\_projetoatividade\_projetoatividade.CodigoProjetoAtividade\], NonEmptyCrossJoin(\[\~ROWS\_InstituicoesUnidadeGestora\_InstituicoesUnidadeGestora.InstituicaoCodigoUnidadeGestora\], NonEmptyCrossJoin(\[\~ROWS\_Credor\_Documento\_Credor\_Documento.Credor\_Nome\], NonEmptyCrossJoin(\[\~ROWS\_InformacoesExtrasdoEmpenho\_InformacoesExtrasdoEmpenho.Contrato\], \[\~ROWS\_InformacoesExtrasdoEmpenho\_InformacoesExtrasdoEmpenho.Convenio\]))))))))))) ON ROWS**  
**FROM \[CUBO\_2025\_OLAP\_LIQUIDACAO\]**

**\#\# 2023\_2024\_NEDL MDX:**

**WITH**  
**SET \[\~ROWS\_DocumentosdeLiquidacao\_DocumentosdeLiquidacao.DocumentosdeLiquidacao\] AS**  
    **{\[DocumentosdeLiquidacao\].\[DocumentodeLiquidacao\].Members}**  
**SET \[\~ROWS\_DocumentosdeLiquidacao\_DocumentosdeLiquidacao.DatasdeLiquidacao\] AS**  
    **{\[DocumentosdeLiquidacao.DatasdeLiquidacao\].\[DatadaLiquidacao\].Members}**  
**SET \[\~ROWS\_NotadeEmpenho\_NotadeEmpenho.CodigoNotadeEmpenho\] AS**  
    **{\[NotadeEmpenho.CodigoNotadeEmpenho\].\[CodigoNotadeEmpenho\].Members}**  
**SET \[\~ROWS\_naturezadadespesa\_naturezadadespesa.CodigoNaturezaDaDespesa\] AS**  
    **{\[naturezadadespesa.CodigoNaturezaDaDespesa\].\[CodigoNaturezaDaDespesa\].Members}**  
**SET \[\~ROWS\_fontederecurso\_fontederecurso.CodigoFonteDeRecurso\] AS**  
    **{\[fontederecurso.CodigoFonteDeRecurso\].\[CodigoFonteDeRecurso\].Members}**  
**SET \[\~ROWS\_DetalhamentoFr\_DetalhamentoFr.CodigoDetalhamentoFr\] AS**  
    **{\[DetalhamentoFr.CodigoDetalhamentoFr\].\[CodigoDetalhamentoFr\].Members}**  
**SET \[\~ROWS\_InformacoesExtrasdoEmpenho\_InformacoesExtrasdoEmpenho.NumeroProcesso\] AS**  
    **{\[InformacoesExtrasdoEmpenho.NumeroProcesso\].\[NUMERO\_PROCESSO\].Members}**  
**SET \[\~ROWS\_projetoatividade\_projetoatividade.CodigoProjetoAtividade\] AS**  
    **{\[projetoatividade.CodigoProjetoAtividade\].\[CodigoProjetoAtividade\].Members}**  
**SET \[\~ROWS\_InstituicoesUnidadeGestora\_InstituicoesUnidadeGestora.InstituicaoCodigoUnidadeGestora\] AS**  
    **{\[InstituicoesUnidadeGestora.InstituicaoCodigoUnidadeGestora\].\[160101\]}**  
**SET \[\~ROWS\_Credor\_Documento\_Credor\_Documento.Credor\_Nome\] AS**  
    **{\[Credor\_Documento.Credor\_Nome\].\[Credor\_Nome\].Members}**  
**SET \[\~ROWS\_InformacoesExtrasdoEmpenho\_InformacoesExtrasdoEmpenho.Contrato\] AS**  
    **{\[InformacoesExtrasdoEmpenho.Contrato\].\[CONTRATO\].Members}**  
**SET \[\~ROWS\_InformacoesExtrasdoEmpenho\_InformacoesExtrasdoEmpenho.Convenio\] AS**  
    **{\[InformacoesExtrasdoEmpenho.Convenio\].\[CONVENIO\].Members}**  
**SELECT**  
**NON EMPTY {\[Measures\].\[Valor Original\], \[Measures\].\[Valor Liquido\], \[Measures\].\[Valor Bruto\], \[Measures\].\[Valor Retido\], \[Measures\].\[Valor Pago\], \[Measures\].\[Valor Liquidado a Pagar\], \[Measures\].\[Valor Liquido2\]} ON COLUMNS,**  
**NON EMPTY NonEmptyCrossJoin(\[\~ROWS\_DocumentosdeLiquidacao\_DocumentosdeLiquidacao.DocumentosdeLiquidacao\], NonEmptyCrossJoin(\[\~ROWS\_DocumentosdeLiquidacao\_DocumentosdeLiquidacao.DatasdeLiquidacao\], NonEmptyCrossJoin(\[\~ROWS\_NotadeEmpenho\_NotadeEmpenho.CodigoNotadeEmpenho\], NonEmptyCrossJoin(\[\~ROWS\_naturezadadespesa\_naturezadadespesa.CodigoNaturezaDaDespesa\], NonEmptyCrossJoin(\[\~ROWS\_fontederecurso\_fontederecurso.CodigoFonteDeRecurso\], NonEmptyCrossJoin(\[\~ROWS\_DetalhamentoFr\_DetalhamentoFr.CodigoDetalhamentoFr\], NonEmptyCrossJoin(\[\~ROWS\_InformacoesExtrasdoEmpenho\_InformacoesExtrasdoEmpenho.NumeroProcesso\], NonEmptyCrossJoin(\[\~ROWS\_projetoatividade\_projetoatividade.CodigoProjetoAtividade\], NonEmptyCrossJoin(\[\~ROWS\_InstituicoesUnidadeGestora\_InstituicoesUnidadeGestora.InstituicaoCodigoUnidadeGestora\], NonEmptyCrossJoin(\[\~ROWS\_Credor\_Documento\_Credor\_Documento.Credor\_Nome\], NonEmptyCrossJoin(\[\~ROWS\_InformacoesExtrasdoEmpenho\_InformacoesExtrasdoEmpenho.Contrato\], \[\~ROWS\_InformacoesExtrasdoEmpenho\_InformacoesExtrasdoEmpenho.Convenio\]))))))))))) ON ROWS**  
**FROM \[COA2023\_CUBO\_OLAP\_LIQUIDACAO\]**

**DLOB \= CUBOS DE ORDEM BANCÁRIA**

**DLOB:**

**OrdemBancaria,CredorDocumento,Credor\_Nome,DatadoPagamento,CodigoFonteDeRecurso,CodigoDetalhamentoFr,DocumentodaLiquidacao, DatadeLiquidacao,NUMERO\_PROCESSO,CodigoUnidadeGestora,CodigoProjetoAtividade,CodigoNaturezaDaDespesa,NomeNaturezaDaDespesa,NomeElementoDeDespesa,Valor**

**\#\# 2026\_DLOB MDX:**

**WITH**  
**SET \[\~ROWS\_OrdensBancarias\_OrdensBancarias.OrdemBancaria\] AS**  
    **{\[OrdensBancarias.OrdemBancaria\].\[OrdemBancaria\].Members}**  
**SET \[\~ROWS\_CredorDocumento\_CredorDocumento.Credor\_Documento\] AS**  
    **{\[CredorDocumento.Credor\_Documento\].\[CredorDocumento\].Members}**  
**SET \[\~ROWS\_CredorDocumento\_CredorDocumento.Credor\_Nome\] AS**  
    **{\[CredorDocumento.Credor\_Nome\].\[Credor\_Nome\].Members}**  
**SET \[\~ROWS\_OrdensBancarias\_OrdensBancarias.DatadoPagamento\] AS**  
    **{\[OrdensBancarias.DatadoPagamento\].\[DatadoPagamento\].Members}**  
**SET \[\~ROWS\_FonteDeRecurso\_FonteDeRecurso.CodigoFonteDeRecurso\] AS**  
    **{\[FonteDeRecurso.CodigoFonteDeRecurso\].\[CodigoFonteDeRecurso\].Members}**  
**SET \[\~ROWS\_DetalhamentoFr\_DetalhamentoFr.CodigoDetalhamentoFr\] AS**  
    **{\[DetalhamentoFr.CodigoDetalhamentoFr\].\[CodigoDetalhamentoFr\].Members}**  
**SET \[\~ROWS\_DocumentosdeLiquidacao\_DocumentosdeLiquidacao.DocumentosdeLiquidacao\] AS**  
    **{\[DocumentosdeLiquidacao\].\[DocumentodeLiquidacao\].Members}**  
**SET \[\~ROWS\_DocumentosdeLiquidacao\_DocumentosdeLiquidacao.DatasdeLiquidacao\] AS**  
    **{\[DocumentosdeLiquidacao.DatasdeLiquidacao\].\[DatadaLiquidacao\].Members}**  
**SET \[\~ROWS\_InformacoesExtrasdoEmpenho\_InformacoesExtrasdoEmpenho.NumeroProcesso\] AS**  
    **{\[InformacoesExtrasdoEmpenho.NumeroProcesso\].\[NUMERO\_PROCESSO\].Members}**  
**SET \[\~ROWS\_UnidadeGestora\_UnidadeGestora.CodigoUnidadeGestora\] AS**  
    **{\[UnidadeGestora.CodigoUnidadeGestora\].\[160101\]}**  
**SET \[\~ROWS\_ProjetoAtividade\_ProjetoAtividade.CodigoProjetoAtividade\] AS**  
    **{\[ProjetoAtividade.CodigoProjetoAtividade\].\[CodigoProjetoAtividade\].Members}**  
**SET \[\~ROWS\_NaturezaDaDespesa\_NaturezaDaDespesa.CodigoNaturezaDaDespesa\] AS**  
    **{\[NaturezaDaDespesa.CodigoNaturezaDaDespesa\].\[CodigoNaturezaDaDespesa\].Members}**  
**SET \[\~ROWS\_NaturezaDaDespesa\_NaturezaDaDespesa.NomeNaturezaDaDespesa\] AS**  
    **{\[NaturezaDaDespesa.NomeNaturezaDaDespesa\].\[NomeNaturezaDaDespesa\].Members}**  
**SET \[\~ROWS\_ElementoDeDespesa\_ElementoDeDespesa.NomeElementoDeDespesa\] AS**  
    **{\[ElementoDeDespesa.NomeElementoDeDespesa\].\[NomeElementoDeDespesa\].Members}**  
**SELECT**  
**NON EMPTY {\[Measures\].\[Valor\]} ON COLUMNS,**  
**NON EMPTY NonEmptyCrossJoin(\[\~ROWS\_OrdensBancarias\_OrdensBancarias.OrdemBancaria\], NonEmptyCrossJoin(\[\~ROWS\_CredorDocumento\_CredorDocumento.Credor\_Documento\], NonEmptyCrossJoin(\[\~ROWS\_CredorDocumento\_CredorDocumento.Credor\_Nome\], NonEmptyCrossJoin(\[\~ROWS\_OrdensBancarias\_OrdensBancarias.DatadoPagamento\], NonEmptyCrossJoin(\[\~ROWS\_FonteDeRecurso\_FonteDeRecurso.CodigoFonteDeRecurso\], NonEmptyCrossJoin(\[\~ROWS\_DetalhamentoFr\_DetalhamentoFr.CodigoDetalhamentoFr\], NonEmptyCrossJoin(\[\~ROWS\_DocumentosdeLiquidacao\_DocumentosdeLiquidacao.DocumentosdeLiquidacao\], NonEmptyCrossJoin(\[\~ROWS\_DocumentosdeLiquidacao\_DocumentosdeLiquidacao.DatasdeLiquidacao\], NonEmptyCrossJoin(\[\~ROWS\_InformacoesExtrasdoEmpenho\_InformacoesExtrasdoEmpenho.NumeroProcesso\], NonEmptyCrossJoin(\[\~ROWS\_UnidadeGestora\_UnidadeGestora.CodigoUnidadeGestora\], NonEmptyCrossJoin(\[\~ROWS\_ProjetoAtividade\_ProjetoAtividade.CodigoProjetoAtividade\], NonEmptyCrossJoin(\[\~ROWS\_NaturezaDaDespesa\_NaturezaDaDespesa.CodigoNaturezaDaDespesa\], NonEmptyCrossJoin(\[\~ROWS\_NaturezaDaDespesa\_NaturezaDaDespesa.NomeNaturezaDaDespesa\], \[\~ROWS\_ElementoDeDespesa\_ElementoDeDespesa.NomeElementoDeDespesa\]))))))))))))) ON ROWS**  
**FROM \[CUBO\_2026\_ORDEM\_BANCARIA\]**

**\#\# 2025\_DLOB MDX:**

**WITH**  
**SET \[\~ROWS\_OrdensBancarias\_OrdensBancarias.OrdemBancaria\] AS**  
    **{\[OrdensBancarias.OrdemBancaria\].\[OrdemBancaria\].Members}**  
**SET \[\~ROWS\_CredorDocumento\_CredorDocumento.Credor\_Documento\] AS**  
    **{\[CredorDocumento.Credor\_Documento\].\[CredorDocumento\].Members}**  
**SET \[\~ROWS\_CredorDocumento\_CredorDocumento.Credor\_Nome\] AS**  
    **{\[CredorDocumento.Credor\_Nome\].\[Credor\_Nome\].Members}**  
**SET \[\~ROWS\_OrdensBancarias\_OrdensBancarias.DatadoPagamento\] AS**  
    **{\[OrdensBancarias.DatadoPagamento\].\[DatadoPagamento\].Members}**  
**SET \[\~ROWS\_FonteDeRecurso\_FonteDeRecurso.CodigoFonteDeRecurso\] AS**  
    **{\[FonteDeRecurso.CodigoFonteDeRecurso\].\[CodigoFonteDeRecurso\].Members}**  
**SET \[\~ROWS\_DetalhamentoFr\_DetalhamentoFr.CodigoDetalhamentoFr\] AS**  
    **{\[DetalhamentoFr.CodigoDetalhamentoFr\].\[CodigoDetalhamentoFr\].Members}**  
**SET \[\~ROWS\_DocumentosdeLiquidacao\_DocumentosdeLiquidacao.DocumentosdeLiquidacao\] AS**  
    **{\[DocumentosdeLiquidacao\].\[DocumentodeLiquidacao\].Members}**  
**SET \[\~ROWS\_DocumentosdeLiquidacao\_DocumentosdeLiquidacao.DatasdeLiquidacao\] AS**  
    **{\[DocumentosdeLiquidacao.DatasdeLiquidacao\].\[DatadaLiquidacao\].Members}**  
**SET \[\~ROWS\_InformacoesExtrasdoEmpenho\_InformacoesExtrasdoEmpenho.NumeroProcesso\] AS**  
    **{\[InformacoesExtrasdoEmpenho.NumeroProcesso\].\[NUMERO\_PROCESSO\].Members}**  
**SET \[\~ROWS\_UnidadeGestora\_UnidadeGestora.CodigoUnidadeGestora\] AS**  
    **{\[UnidadeGestora.CodigoUnidadeGestora\].\[160101\]}**  
**SET \[\~ROWS\_ProjetoAtividade\_ProjetoAtividade.CodigoProjetoAtividade\] AS**  
    **{\[ProjetoAtividade.CodigoProjetoAtividade\].\[CodigoProjetoAtividade\].Members}**  
**SET \[\~ROWS\_NaturezaDaDespesa\_NaturezaDaDespesa.CodigoNaturezaDaDespesa\] AS**  
    **{\[NaturezaDaDespesa.CodigoNaturezaDaDespesa\].\[CodigoNaturezaDaDespesa\].Members}**  
**SET \[\~ROWS\_NaturezaDaDespesa\_NaturezaDaDespesa.NomeNaturezaDaDespesa\] AS**  
    **{\[NaturezaDaDespesa.NomeNaturezaDaDespesa\].\[NomeNaturezaDaDespesa\].Members}**  
**SET \[\~ROWS\_ElementoDeDespesa\_ElementoDeDespesa.NomeElementoDeDespesa\] AS**  
    **{\[ElementoDeDespesa.NomeElementoDeDespesa\].\[NomeElementoDeDespesa\].Members}**  
**SELECT**  
**NON EMPTY {\[Measures\].\[Valor\]} ON COLUMNS,**  
**NON EMPTY NonEmptyCrossJoin(\[\~ROWS\_OrdensBancarias\_OrdensBancarias.OrdemBancaria\], NonEmptyCrossJoin(\[\~ROWS\_CredorDocumento\_CredorDocumento.Credor\_Documento\], NonEmptyCrossJoin(\[\~ROWS\_CredorDocumento\_CredorDocumento.Credor\_Nome\], NonEmptyCrossJoin(\[\~ROWS\_OrdensBancarias\_OrdensBancarias.DatadoPagamento\], NonEmptyCrossJoin(\[\~ROWS\_FonteDeRecurso\_FonteDeRecurso.CodigoFonteDeRecurso\], NonEmptyCrossJoin(\[\~ROWS\_DetalhamentoFr\_DetalhamentoFr.CodigoDetalhamentoFr\], NonEmptyCrossJoin(\[\~ROWS\_DocumentosdeLiquidacao\_DocumentosdeLiquidacao.DocumentosdeLiquidacao\], NonEmptyCrossJoin(\[\~ROWS\_DocumentosdeLiquidacao\_DocumentosdeLiquidacao.DatasdeLiquidacao\], NonEmptyCrossJoin(\[\~ROWS\_InformacoesExtrasdoEmpenho\_InformacoesExtrasdoEmpenho.NumeroProcesso\], NonEmptyCrossJoin(\[\~ROWS\_UnidadeGestora\_UnidadeGestora.CodigoUnidadeGestora\], NonEmptyCrossJoin(\[\~ROWS\_ProjetoAtividade\_ProjetoAtividade.CodigoProjetoAtividade\], NonEmptyCrossJoin(\[\~ROWS\_NaturezaDaDespesa\_NaturezaDaDespesa.CodigoNaturezaDaDespesa\], NonEmptyCrossJoin(\[\~ROWS\_NaturezaDaDespesa\_NaturezaDaDespesa.NomeNaturezaDaDespesa\], \[\~ROWS\_ElementoDeDespesa\_ElementoDeDespesa.NomeElementoDeDespesa\]))))))))))))) ON ROWS**  
**FROM \[CUBO\_2025\_ORDEM\_BANCARIA\]**

**\#\# 2023\_2024\_DLOB MDX:**

**WITH**  
**SET \[\~ROWS\_OrdensBancarias\_OrdensBancarias.OrdemBancaria\] AS**  
    **{\[OrdensBancarias.OrdemBancaria\].\[OrdemBancaria\].Members}**  
**SET \[\~ROWS\_CredorDocumento\_CredorDocumento.Credor\_Documento\] AS**  
    **{\[CredorDocumento.Credor\_Documento\].\[CredorDocumento\].Members}**  
**SET \[\~ROWS\_CredorDocumento\_CredorDocumento.Credor\_Nome\] AS**  
    **{\[CredorDocumento.Credor\_Nome\].\[Credor\_Nome\].Members}**  
**SET \[\~ROWS\_OrdensBancarias\_OrdensBancarias.DatadoPagamento\] AS**  
    **{\[OrdensBancarias.DatadoPagamento\].\[DatadoPagamento\].Members}**  
**SET \[\~ROWS\_FonteDeRecurso\_FonteDeRecurso.CodigoFonteDeRecurso\] AS**  
    **{\[FonteDeRecurso.CodigoFonteDeRecurso\].\[CodigoFonteDeRecurso\].Members}**  
**SET \[\~ROWS\_DetalhamentoFr\_DetalhamentoFr.CodigoDetalhamentoFr\] AS**  
    **{\[DetalhamentoFr.CodigoDetalhamentoFr\].\[CodigoDetalhamentoFr\].Members}**  
**SET \[\~ROWS\_DocumentosdeLiquidacao\_DocumentosdeLiquidacao.DocumentosdeLiquidacao\] AS**  
    **{\[DocumentosdeLiquidacao\].\[DocumentodeLiquidacao\].Members}**  
**SET \[\~ROWS\_DocumentosdeLiquidacao\_DocumentosdeLiquidacao.DatasdeLiquidacao\] AS**  
    **{\[DocumentosdeLiquidacao.DatasdeLiquidacao\].\[DatadaLiquidacao\].Members}**  
**SET \[\~ROWS\_InformacoesExtrasdoEmpenho\_InformacoesExtrasdoEmpenho.NumeroProcesso\] AS**  
    **{\[InformacoesExtrasdoEmpenho.NumeroProcesso\].\[NUMERO\_PROCESSO\].Members}**  
**SET \[\~ROWS\_UnidadeGestora\_UnidadeGestora.CodigoUnidadeGestora\] AS**  
    **{\[UnidadeGestora.CodigoUnidadeGestora\].\[160101\]}**  
**SET \[\~ROWS\_ProjetoAtividade\_ProjetoAtividade.CodigoProjetoAtividade\] AS**  
    **{\[ProjetoAtividade.CodigoProjetoAtividade\].\[CodigoProjetoAtividade\].Members}**  
**SET \[\~ROWS\_NaturezaDaDespesa\_NaturezaDaDespesa.CodigoNaturezaDaDespesa\] AS**  
    **{\[NaturezaDaDespesa.CodigoNaturezaDaDespesa\].\[CodigoNaturezaDaDespesa\].Members}**  
**SET \[\~ROWS\_NaturezaDaDespesa\_NaturezaDaDespesa.NomeNaturezaDaDespesa\] AS**  
    **{\[NaturezaDaDespesa.NomeNaturezaDaDespesa\].\[NomeNaturezaDaDespesa\].Members}**  
**SET \[\~ROWS\_ElementoDeDespesa\_ElementoDeDespesa.NomeElementoDeDespesa\] AS**  
    **{\[ElementoDeDespesa.NomeElementoDeDespesa\].\[NomeElementoDeDespesa\].Members}**  
**SELECT**  
**NON EMPTY {\[Measures\].\[Valor\]} ON COLUMNS,**  
**NON EMPTY NonEmptyCrossJoin(\[\~ROWS\_OrdensBancarias\_OrdensBancarias.OrdemBancaria\], NonEmptyCrossJoin(\[\~ROWS\_CredorDocumento\_CredorDocumento.Credor\_Documento\], NonEmptyCrossJoin(\[\~ROWS\_CredorDocumento\_CredorDocumento.Credor\_Nome\], NonEmptyCrossJoin(\[\~ROWS\_OrdensBancarias\_OrdensBancarias.DatadoPagamento\], NonEmptyCrossJoin(\[\~ROWS\_FonteDeRecurso\_FonteDeRecurso.CodigoFonteDeRecurso\], NonEmptyCrossJoin(\[\~ROWS\_DetalhamentoFr\_DetalhamentoFr.CodigoDetalhamentoFr\], NonEmptyCrossJoin(\[\~ROWS\_DocumentosdeLiquidacao\_DocumentosdeLiquidacao.DocumentosdeLiquidacao\], NonEmptyCrossJoin(\[\~ROWS\_DocumentosdeLiquidacao\_DocumentosdeLiquidacao.DatasdeLiquidacao\], NonEmptyCrossJoin(\[\~ROWS\_InformacoesExtrasdoEmpenho\_InformacoesExtrasdoEmpenho.NumeroProcesso\], NonEmptyCrossJoin(\[\~ROWS\_UnidadeGestora\_UnidadeGestora.CodigoUnidadeGestora\], NonEmptyCrossJoin(\[\~ROWS\_ProjetoAtividade\_ProjetoAtividade.CodigoProjetoAtividade\], NonEmptyCrossJoin(\[\~ROWS\_NaturezaDaDespesa\_NaturezaDaDespesa.CodigoNaturezaDaDespesa\], NonEmptyCrossJoin(\[\~ROWS\_NaturezaDaDespesa\_NaturezaDaDespesa.NomeNaturezaDaDespesa\], \[\~ROWS\_ElementoDeDespesa\_ElementoDeDespesa.NomeElementoDeDespesa\]))))))))))))) ON ROWS**  
**FROM \[COA2023\_CUBO\_ORDEM\_BANCARIA\]**

- **NECESSÁRIO UM RELATÓRIO DO CUBO DE NE PARA VER QUAIS NE’S AINDA NÃO TEM DL?**  
- **QUAIS CAMPOS NECESSÁRIOS?**

