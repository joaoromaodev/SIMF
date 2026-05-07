SIMF — Roadmap de Reestruturação Supabase para 3 Universos SIAFE
1. Contexto

O SIMF é um MVP voltado à ingestão, validação, normalização e disponibilização de relatórios CSV extraídos do SIAFE para uso em painéis e BI.

A arquitetura atual já possui uma base funcional com:

Next.js;
Supabase/PostgreSQL;
Supabase Storage;
importação manual de CSV;
controle de batches;
normalização de NE_DL e DL_OB;
política especial de substituição dos dados ativos de 2026;
testes automatizados;
views iniciais para consumo do painel.

Contudo, o projeto passa agora a trabalhar formalmente com 3 universos de relatório:

NE
NEDL
DLOB

E com 9 arquivos CSV, considerando os três escopos temporais:

2023_2024
2025
2026

O objetivo desta reestruturação é adaptar o Supabase e o pipeline de ingestão para uma arquitetura mais simples, auditável, evolutiva e adequada ao BI, sem depender de uma camada canônica física completa neste momento.

2. Decisões já consolidadas
2.1 Universos oficiais

Os tipos internos finais serão:

NE
NEDL
DLOB

Os nomes antigos:

NE_DL
DL_OB

devem ser tratados como legados, se necessário, apenas para compatibilidade durante a transição.

2.2 Arquivos esperados

O sistema deverá processar os seguintes arquivos:

2023_2024_NE.csv
2025_NE.csv
2026_NE.csv

2023_2024_NEDL.csv
2025_NEDL.csv
2026_NEDL.csv

2023_2024_DLOB.csv
2025_DLOB.csv
2026_DLOB.csv
2.3 Campos finais por relatório
NE
CodigoNotadeEmpenho
DatadoEmpenho
NomeUsuarioQueCriou
InstituicaoCodigoUnidadeGestora
NUMERO_PROCESSO
Valor Original
Valor Corrente
Saldo a Liquidar
Quantidade
NEDL
DocumentodeLiquidacao
DatadaLiquidacao
CodigoNotadeEmpenho
CodigoNaturezaDaDespesa
NomeFonteDeRecurso
CodigoFonteDeRecurso
NomeDetalhamentoFr
CodigoDetalhamentoFr
NUMERO_PROCESSO
CodigoProjetoAtividade
NomeCredor
CONTRATO
CONVENIO
Valor Original
Valor Liquido
Valor Bruto
Valor Retido
Valor Pago
Valor Liquidado a Pagar
DLOB
OrdemBancaria
DatadoPagamento
DocumentodaLiquidacao
CodigoUnidadeGestora
NomeUsuarioQueCriou
Finalidade
Valor
2.4 Regra sobre NUMERO_PROCESSO

O campo NUMERO_PROCESSO será usado da seguinte forma:

Universo	Possui NUMERO_PROCESSO?	Uso
NE	Sim	Fonte principal do vínculo administrativo
NEDL	Sim	Apoio, validação e enriquecimento
DLOB	Não	Não deve ser usado nem exigido

O vínculo do DLOB com o processo será derivado por encadeamento:

DLOB.DocumentodaLiquidacao
  → NEDL.DocumentodeLiquidacao
  → NEDL.CodigoNotadeEmpenho
  → NE.CodigoNotadeEmpenho
  → NE.NUMERO_PROCESSO
2.5 Chaves de cruzamento
Relação	Chave
NE ↔ NEDL	CodigoNotadeEmpenho
NEDL ↔ DLOB	DocumentodeLiquidacao / DocumentodaLiquidacao
Processo administrativo	NUMERO_PROCESSO, preferencialmente vindo de NE

O campo DocumentodaLiquidacao do DLOB deve ser tratado como a chave equivalente ao DocumentodeLiquidacao do NEDL.

2.6 Política dos históricos

Durante a fase de desenvolvimento:

permitir limpeza e recarga dos históricos

Após estabilização e validação da base:

travar históricos após carga validada

Regra pretendida:

Escopo	Política durante desenvolvimento	Política após estabilização
2023_2024	Pode limpar/recarregar	Histórico travado
2025	Pode limpar/recarregar	Histórico travado
2026	Substituição integral por universo	Substituição integral por universo
2.7 Estratégia de views

A decisão atual é iniciar com views comuns, não materialized views.

Materialized views poderão ser avaliadas futuramente apenas se houver problema real de performance.

2.8 Confirmações manuais no painel

A funcionalidade de confirmação/manualização de pagamentos deve permanecer como tabela auxiliar, não como camada canônica completa.

Exemplo:

marcacoes_pagamento

Essa tabela deve complementar views de pagamento, mas não deve exigir a criação de entidades canônicas físicas para todo o fluxo.

3. Modelo-alvo Supabase

A arquitetura recomendada passa a ter três camadas principais:

1. Controle de importação
2. Tabelas normalizadas por universo
3. Views SQL para BI e qualidade

Modelo geral:

CSV
 ↓
import_batches
 ↓
normalized_ne_rows
normalized_nedl_rows
normalized_dlob_rows
 ↓
views SQL
 ↓
painel / BI

A camada canônica física completa, com tabelas como processos, notas_empenho, documentos_liquidacao e ordens_bancarias, não deve ser priorizada neste momento.

4. Camada de controle de importação
4.1 import_batches

A tabela import_batches deve continuar existindo como controle central de ingestão.

Ela deve registrar:

id
report_type
year_scope
original_file_name
storage_bucket
storage_path
status
validation_errors
source_headers
processed_row_count
normalized_row_count
is_active
replaced_batch_id
started_at
finished_at
created_at
updated_at
4.2 report_type

O tipo de relatório deve passar a aceitar:

NE
NEDL
DLOB
4.3 year_scope

Manter os escopos:

2023_2024
2025
2026
4.4 Política de batch ativo

Para 2026:

deve existir apenas um batch ativo de sucesso por report_type/year_scope

Para históricos, durante desenvolvimento:

permitir limpeza e recarga

Após estabilização:

bloquear substituição automática dos históricos
5. Camada normalizada
5.1 normalized_ne_rows

Tabela normalizada do universo NE.

Campos sugeridos
id
import_batch_id
source_row_number
year_scope

codigo_nota_empenho
data_empenho
nome_usuario_criou
codigo_unidade_gestora
numero_processo

valor_original
valor_corrente
saldo_a_liquidar
quantidade

raw_row
created_at
Origem dos campos
Campo normalizado	Campo CSV
codigo_nota_empenho	CodigoNotadeEmpenho
data_empenho	DatadoEmpenho
nome_usuario_criou	NomeUsuarioQueCriou
codigo_unidade_gestora	InstituicaoCodigoUnidadeGestora
numero_processo	NUMERO_PROCESSO
valor_original	Valor Original
valor_corrente	Valor Corrente
saldo_a_liquidar	Saldo a Liquidar
quantidade	Quantidade
Índices recomendados
import_batch_id
year_scope
codigo_nota_empenho
numero_processo
5.2 normalized_nedl_rows

Tabela normalizada do universo NEDL.

Campos sugeridos
id
import_batch_id
source_row_number
year_scope

documento_liquidacao
data_liquidacao
codigo_nota_empenho
codigo_natureza_despesa
nome_fonte_recurso
codigo_fonte_recurso
nome_detalhamento_fr
codigo_detalhamento_fr
numero_processo
codigo_projeto_atividade
credor_nome
contrato
convenio

valor_original
valor_liquido
valor_bruto
valor_retido
valor_pago
valor_liquidado_a_pagar

raw_row
created_at
Origem dos campos
Campo normalizado	Campo CSV
documento_liquidacao	DocumentodeLiquidacao
data_liquidacao	DatadaLiquidacao
codigo_nota_empenho	CodigoNotadeEmpenho
codigo_natureza_despesa	CodigoNaturezaDaDespesa
nome_fonte_recurso	NomeFonteDeRecurso
codigo_fonte_recurso	CodigoFonteDeRecurso
nome_detalhamento_fr	NomeDetalhamentoFr
codigo_detalhamento_fr	CodigoDetalhamentoFr
numero_processo	NUMERO_PROCESSO
codigo_projeto_atividade	CodigoProjetoAtividade
credor_nome	NomeCredor
contrato	CONTRATO
convenio	CONVENIO
valor_original	Valor Original
valor_liquido	Valor Liquido
valor_bruto	Valor Bruto
valor_retido	Valor Retido
valor_pago	Valor Pago
valor_liquidado_a_pagar	Valor Liquidado a Pagar
Índices recomendados
import_batch_id
year_scope
codigo_nota_empenho
documento_liquidacao
numero_processo
5.3 normalized_dlob_rows

Tabela normalizada do universo DLOB.

Campos sugeridos
id
import_batch_id
source_row_number
year_scope

ordem_bancaria
data_pagamento
documento_liquidacao
codigo_unidade_gestora
nome_usuario_criou
finalidade
valor

raw_row
created_at
Origem dos campos
Campo normalizado	Campo CSV
ordem_bancaria	OrdemBancaria
data_pagamento	DatadoPagamento
documento_liquidacao	DocumentodaLiquidacao
codigo_unidade_gestora	CodigoUnidadeGestora
nome_usuario_criou	NomeUsuarioQueCriou
finalidade	Finalidade
valor	Valor
Índices recomendados
import_batch_id
year_scope
documento_liquidacao
ordem_bancaria
Regra importante

normalized_dlob_rows não deve possuir numero_processo como campo obrigatório.

Se a tabela atual possuir esse campo por legado, ele não deve ser usado na nova lógica de vínculo.

6. Views SQL recomendadas
6.1 Views de batches ativos

Criar uma view base para evitar repetição de lógica:

vw_active_import_batches

Regra:

status = 'success'
e
(
  year_scope <> '2026'
  ou is_active = true
)
6.2 Views normalizadas ativas

Criar:

vw_ne_active
vw_nedl_active
vw_dlob_active

Essas views devem filtrar apenas linhas pertencentes a batches válidos.

6.3 View de execução financeira

Criar:

vw_execucao_financeira

Objetivo: visão ampla para painel e BI.

Deve relacionar:

NE → NEDL por CodigoNotadeEmpenho
NEDL → DLOB por DocumentodeLiquidacao

Campos recomendados:

numero_processo
codigo_nota_empenho
documento_liquidacao
ordem_bancaria

data_empenho
data_liquidacao
data_pagamento

codigo_unidade_gestora
credor_nome
contrato
convenio
finalidade

valor_empenhado_original
valor_empenhado_corrente
saldo_a_liquidar

valor_liquidado_bruto
valor_liquidado_liquido
valor_retido
valor_pago_nedl
valor_liquidado_a_pagar_nedl

valor_pago_ob
6.4 View de liquidados a pagar

Criar ou revisar:

vw_liquidados_a_pagar

Regra central:

uma DL só é considerada quitada quando a soma das OBs vinculadas
atinge ou supera o Valor Bruto da DL

Cálculo recomendado:

saldo_liquidado_a_pagar =
  greatest(valor_bruto - soma_ob, 0)

A view deve retornar apenas DLs com saldo positivo.

6.5 View de pagamentos

Criar ou revisar:

vw_pagamentos

Objetivo: listar OBs enriquecidas com dados de DL, NE e processo.

O processo deve ser derivado por:

DLOB.documento_liquidacao
  → NEDL.documento_liquidacao
  → NEDL.codigo_nota_empenho
  → NE.codigo_nota_empenho
  → NE.numero_processo
6.6 View de monitoramento de pagamentos

Criar ou revisar:

vw_monitoramento_pagamentos

Essa view pode fazer left join com marcacoes_pagamento.

Campos possíveis:

numero_processo
codigo_nota_empenho
documento_liquidacao
ordem_bancaria
credor_nome
data_liquidacao
data_pagamento
valor
confirmado_manualmente
confirmado_por
confirmado_em
observacao
6.7 Views de qualidade

Criar views de diagnóstico:

vw_status_carga_relatorios
vw_nedl_sem_ne
vw_dlob_sem_nedl
vw_divergencia_processo_ne_nedl
vw_status_carga_relatorios

Deve indicar quais dos 9 relatórios esperados foram carregados com sucesso.

vw_nedl_sem_ne

Deve listar registros NEDL cujo CodigoNotadeEmpenho não encontra correspondente em NE.

vw_dlob_sem_nedl

Deve listar registros DLOB cujo DocumentodaLiquidacao não encontra correspondente em NEDL.

vw_divergencia_processo_ne_nedl

Deve listar casos em que NE.NUMERO_PROCESSO e NEDL.NUMERO_PROCESSO divergem para a mesma nota de empenho.

7. Roadmap incremental
Incremento 1 — Contrato final dos relatórios
Objetivo

Formalizar o contrato dos 9 arquivos e preparar a documentação do novo modelo.

Entregas
Documentar os 3 universos:
NE;
NEDL;
DLOB.
Documentar os 9 arquivos esperados.
Documentar campos finais por relatório.
Documentar obrigatoriedade dos campos.
Documentar que DLOB não possui NUMERO_PROCESSO.
Documentar chaves de cruzamento.
Documentar estratégia de views comuns.
Critérios de aceite
O contrato dos relatórios está descrito no repositório.
As decisões pacificadas estão registradas.
As pendências, se houver, estão destacadas.
Nenhuma migration ou alteração funcional é feita neste incremento, se ele for apenas documental.
Incremento 2 — Reestruturação dos tipos e batches
Objetivo

Preparar o Supabase para aceitar os tipos internos finais:

NE
NEDL
DLOB
Entregas
Ajustar tipo/enum siafe_report_type.
Adaptar import_batches para os novos tipos.
Definir estratégia de compatibilidade com tipos antigos, se necessário.
Preservar year_scope.
Preservar status, is_active, replaced_batch_id.
Critérios de aceite
O banco aceita batches dos três universos.
A regra de batch ativo por report_type/year_scope continua válida.
Não há dependência obrigatória dos nomes antigos NE_DL e DL_OB.
Incremento 3 — Tabelas normalizadas dos 3 universos
Objetivo

Criar a nova base normalizada.

Entregas
Criar normalized_ne_rows.
Criar ou ajustar normalized_nedl_rows.
Criar ou ajustar normalized_dlob_rows.
Remover a exigência de NUMERO_PROCESSO do DLOB.
Adicionar índices de cruzamento.
Preservar raw_row para rastreabilidade.
Critérios de aceite
Cada universo possui tabela normalizada própria.
Os campos dos CSVs estão mapeados para nomes canônicos internos.
O DLOB não depende de NUMERO_PROCESSO.
Os principais joins são suportados por índices.
Incremento 4 — Finalização atômica de importação
Objetivo

Adaptar a finalização dos imports para os três universos.

Entregas
Atualizar finalize_siafe_active_import.
Garantir substituição integral de 2026 por universo.
Garantir que a substituição de 2026_NE não afete NEDL nem DLOB.
Manter rastreabilidade dos batches substituídos.
Durante desenvolvimento, permitir limpeza e recarga dos históricos.
Critérios de aceite
Um novo upload de 2026_NE.csv substitui apenas o batch ativo de NE/2026.
O mesmo vale para NEDL/2026 e DLOB/2026.
Batches anteriores permanecem rastreáveis.
Linhas normalizadas antigas do universo substituído são removidas ou desativadas conforme a estratégia definida.
Incremento 5 — Pipeline de ingestão Next.js
Objetivo

Adaptar o pipeline de upload para os 9 relatórios.

Entregas
Atualizar schemas em código.
Atualizar validação de tipo.
Atualizar validação de nome do arquivo.
Atualizar normalização.
Atualizar formulário de upload.
Atualizar mensagens de erro e warnings.
Garantir parsing monetário do formato R$ 6,092.04.
Garantir parsing de datas.
Critérios de aceite
O formulário permite selecionar NE, NEDL e DLOB.
O sistema aceita os 9 nomes de arquivo esperados.
Cada arquivo é normalizado para sua tabela correta.
Upload inválido gera batch failed, quando aplicável.
DLOB sem NUMERO_PROCESSO é aceito.
Incremento 6 — Views ativas
Objetivo

Criar views intermediárias para consumo seguro das tabelas normalizadas.

Entregas
vw_active_import_batches.
vw_ne_active.
vw_nedl_active.
vw_dlob_active.
Critérios de aceite
As views retornam somente dados de batches válidos.
Para 2026, apenas o batch ativo é considerado.
Para históricos, os dados carregados e válidos são considerados conforme política vigente.
Incremento 7 — Views de BI
Objetivo

Criar as views principais do painel.

Entregas
vw_execucao_financeira.
vw_liquidados_a_pagar.
vw_pagamentos.
vw_monitoramento_pagamentos.
Critérios de aceite
O painel consegue consultar empenhos, liquidações e pagamentos.
O processo da OB é derivado corretamente por DL → NE.
A regra de quitação por soma de OBs é aplicada.
Pagamentos manuais, se houver, entram via tabela auxiliar.
Incremento 8 — Views de qualidade e auditoria
Objetivo

Criar mecanismos de diagnóstico e validação da base.

Entregas
vw_status_carga_relatorios.
vw_nedl_sem_ne.
vw_dlob_sem_nedl.
vw_divergencia_processo_ne_nedl.
Critérios de aceite
É possível saber se os 9 relatórios foram carregados.
É possível identificar NEDLs sem NE correspondente.
É possível identificar DLOBs sem NEDL correspondente.
É possível identificar divergência de processo entre NE e NEDL.
Incremento 9 — Validação operacional com os 9 CSVs
Objetivo

Validar a reestruturação em ambiente Supabase.

Entregas
Limpar base de desenvolvimento.
Aplicar migrations.
Subir os 9 arquivos.
Validar import_batches.
Validar tabelas normalizadas.
Validar views ativas.
Validar views de BI.
Validar views de qualidade.
Corrigir inconsistências encontradas.
Critérios de aceite
Os 9 arquivos são importados com sucesso.
O painel consulta as views corretamente.
Não há dependência de NUMERO_PROCESSO no DLOB.
Liquidados a pagar refletem corretamente pagamentos parciais e totais.
Inconsistências são visíveis em views próprias.
Incremento 10 — Hardening pós-validação
Objetivo

Estabilizar o modelo após validação real.

Entregas
Revisar índices.
Avaliar performance das views.
Avaliar necessidade de materialized views.
Travar históricos após validação.
Atualizar documentação final.
Remover ou isolar legados, se necessário.
Critérios de aceite
Histórico validado está protegido.
Views críticas performam adequadamente.
Documentação reflete o estado real.
O projeto está pronto para continuidade incremental.
8. Riscos e cuidados
8.1 Risco de quebrar o que já funciona

A arquitetura atual já possui pipeline funcional para NE_DL e DL_OB. A reestruturação deve ser feita de forma incremental, evitando mudanças amplas sem testes.

8.2 Risco de duplicidade conceitual

Durante a transição, pode haver coexistência de nomes antigos e novos:

NE_DL / NEDL
DL_OB / DLOB

É importante definir uma estratégia clara de migração.

8.3 Risco de inconsistência entre views

Se cada view repetir sua própria regra de batch ativo, podem surgir divergências.

Por isso, recomenda-se criar views intermediárias:

vw_ne_active
vw_nedl_active
vw_dlob_active
8.4 Risco de performance

Views comuns são adequadas para o MVP, mas podem ficar pesadas conforme o volume de dados.

Mitigação:

começar com views comuns
avaliar índices
materializar apenas gargalos reais
8.5 Risco de vínculo incorreto da OB

Como o DLOB não possui NUMERO_PROCESSO, o vínculo da OB com o processo depende da qualidade do join por DocumentodaLiquidacao.

Mitigação:

vw_dlob_sem_nedl
9. Estratégia de validação
9.1 Validação técnica

Executar:

npm test
npm run build
9.2 Validação no Supabase

Verificar:

select * from import_batches order by created_at desc;
select * from normalized_ne_rows limit 50;
select * from normalized_nedl_rows limit 50;
select * from normalized_dlob_rows limit 50;
9.3 Validação de carga esperada

Consultar:

select * from vw_status_carga_relatorios;
9.4 Validação de inconsistências

Consultar:

select * from vw_nedl_sem_ne;
select * from vw_dlob_sem_nedl;
select * from vw_divergencia_processo_ne_nedl;
9.5 Validação de BI

Consultar:

select * from vw_execucao_financeira limit 50;
select * from vw_liquidados_a_pagar limit 50;
select * from vw_pagamentos limit 50;
select * from vw_monitoramento_pagamentos limit 50;
10. Decisão arquitetural principal

A decisão central deste roadmap é:

O SIMF não priorizará, neste momento, uma camada canônica física completa.

A base do painel será formada por tabelas normalizadas por universo e views SQL de BI/qualidade.

Modelo adotado:

CSV
 ↓
import_batches
 ↓
normalized_ne_rows
normalized_nedl_rows
normalized_dlob_rows
 ↓
views SQL
 ↓
painel
11. Próximo passo recomendado

Antes de implementação, recomenda-se solicitar ao Codex uma varredura orientada pelo roadmap, sem alterar arquivos.