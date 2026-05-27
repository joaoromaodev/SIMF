# SIMF — Documentação do Sistema

**Sistema Integrado de Monitoramento Financeiro**
Secretaria de Estado de Educação do Pará — SEDUC/PA
Secretaria Adjunta de Planejamento e Finanças — SAPF

---

## 1. O que é o SIMF

O SIMF é uma plataforma web de monitoramento financeiro interno da SEDUC/PA, desenvolvida para centralizar o acompanhamento da execução orçamentária, pagamentos e contas bancárias das equipes da SAPF — substituindo o processo manual de extração de relatórios do SIAFE.

O sistema está em operação em `simf.seduc.pa.gov.br` (servidor interno da Secretaria) e é acessível exclusivamente por servidores autorizados.

---

## 2. Arquitetura

| Camada       | Tecnologia                          |
|--------------|-------------------------------------|
| Frontend     | Next.js 15 (App Router)             |
| Estilização  | Tailwind CSS                        |
| Banco        | Supabase (PostgreSQL)               |
| Auth         | Supabase Auth + profiles (roles)    |
| Servidor     | Ubuntu 24.04 LTS · PM2 · Nginx      |
| Domínio      | simf.seduc.pa.gov.br (DNS interno)  |

**Fluxo de dados atual:**
```
SIAFE (extração manual) → Importação via painel → Supabase → SIMF
```

**Fluxo ideal (futuro):**
```
SIAFE (banco de dados) → View/Query direta → Supabase → SIMF (tempo real)
```

---

## 3. Módulos

### 3.1 CEO — Coord. de Execução Orçamentária (DFIN)
**Status:** Operacional

Acompanha os empenhos gerados no exercício selecionado.

- Filtro de ano de exercício (2023–2026)
- Busca por número de processo ou NE
- Paginação de 50 registros por página
- Exportação XLSX e PDF com todos os registros
- Coluna `year_scope` permite separar 2023/2024 do período atual

**Fonte de dados:** `vw_ne_active` (view do Supabase)

---

### 3.2 CLIQ — Controle de Liquidações (DPPC)
**Status:** Operacional

Monitora o ciclo de liquidação dos empenhos.

- **Aba 1 — Empenhos a Liquidar:** DLs com saldo pendente filtradas por ano, com status (sem pagamento / pagamento parcial)
- **Aba 2 — Liquidados a Pagar (Histórico):** filtros cruzados por credor, processo, empenho e fonte
- **Aba 3 — Recursos (Saldo):** em construção — integração futura com SIMAS
- KPIs: total em liquidação e quantidade de liquidados a pagar por exercício
- Gráfico de distribuição por fonte de recurso
- Exportação XLSX e PDF por aba ativa

**Fonte de dados:** `vw_liquidados_a_pagar`, RPCs `fn_cliq_kpis`, `fn_cliq_por_fonte`

---

### 3.3 CPAG — Controle de Pagamentos (DPPC)
**Status:** Operacional

Acompanha o fluxo de pagamentos após a liquidação.

- **Aba 1 — Liquidados a Pagar:** DLs com saldo pendente filtradas por ano
- **Aba 2 — Monitoramento de OBs:** pagamentos realizados com confirmação manual, vínculo NEDL, filtros por credor/processo/documento
- **Aba 3 — Recursos (Saldo):** em construção
- KPIs filtrados por ano: total pago confirmado, total a pagar, OBs emitidas/confirmadas/pendentes
- Confirmação manual de pagamento (toggle) por Ordem Bancária
- Exportação XLSX e PDF por aba ativa

**Fonte de dados:** `vw_monitoramento_pagamentos`, `vw_liquidados_a_pagar`, RPC `fn_cpag_kpis`

---

### 3.4 ACONT — Controle de Contas Bancárias (DFIN)
**Status:** Operacional (dados de demonstração)

Monitora as contas bancárias da SEDUC junto a BB, Banpará e CEF.

- Hub por banco com KPIs de disponibilidade e contas ativas/inativas
- Listagem de contas com saldos por exercício (Disponibilidade, Razão, Extrato CC)
- Conferência automática de saldos com tolerância de R$ 0,05
- Detalhe de conta: extrato de movimentações, 3 KPIs e badge de conferência
- Relatórios consolidados: posição de saldos, divergências, consolidado por fonte
- Seletor de exercício (2022–2026) com dados filtrados por ano
- Exportação em 5 formatos (extrato, consolidado, posição, divergências, movimentações)
- Contas inativas aparecem com badge e visual acinzentado (sem conferência)

**Tabelas:** `acont_contas`, `acont_saldos`, `acont_extrato`
**RPCs:** `fn_acont_kpis_banco`, `fn_acont_resumo_banco`, `fn_acont_posicao_saldos`, `fn_acont_consolidado_fonte`

---

## 4. Autenticação e Controle de Acesso

| Role   | Acesso                                              |
|--------|-----------------------------------------------------|
| admin  | Todos os módulos + painel de usuários + importação  |
| user   | Todos os módulos (somente leitura)                  |

- Autenticação via Supabase Auth (email + senha)
- Role armazenado na tabela `profiles` (nunca no client)
- Middleware Next.js intercepta rotas `/dashboard/*` e exige sessão válida
- Admins veem "Usuários" e "Atualizar Base" na sidebar

---

## 5. Importação de Dados

O painel de importação (`/dashboard/import`, visível apenas para admins) permite enviar arquivos XLSX extraídos do SIAFE para atualizar a base. Os arquivos são processados por uma API route que normaliza e insere os dados nas tabelas canônicas.

**Relatórios atualmente importados manualmente (9 no total):**

| Relatório              | Frequência   | Módulo destino |
|------------------------|--------------|----------------|
| Notas de Empenho (NE)  | Diária       | CEO            |
| NEDL (NE+DL)           | Diária       | CLIQ / CPAG    |
| DL+OB                  | Diária       | CPAG           |
| Saldos bancários       | Mensal       | ACONT          |
| Extrato BB             | Mensal       | ACONT          |
| Extrato Banpará        | Mensal       | ACONT          |
| Extrato CEF            | Mensal       | ACONT          |
| Posição de aplicações  | Mensal       | ACONT          |
| Razão contábil         | Mensal       | ACONT          |

---

## 6. Cenário Ideal de Funcionamento

O cenário ideal elimina toda a extração manual via integração direta com o banco de dados do SIAFE:

```
SIAFE (PostgreSQL/Oracle) 
  └─► View consolidada criada por Sandro (TI/SETIC)
        ├─► NEs + Liquidações + OBs de todas as UGs
        └─► Movimentações bancárias por conta/fonte
              └─► Supabase (replicação via pglink ou ETL agendado)
                    └─► SIMF (tempo real, sem intervenção humana)
```

**Benefícios:**
- Dados em tempo real sem extração manual
- Visibilidade de OBs de outras UGs (atualmente invisíveis)
- Eliminação de 9 relatórios manuais
- Conferência automática sem risco de erro humano

---

## 7. Possíveis Atualizações Futuras

### 7.1 CPED — Coord. de Prestação de Contas
Dependência: relatórios do SIAFEM (sistema federal).
Quando disponível, o módulo cobriria:
- Prestações de contas de convênios e transferências federais
- Status de aprovação/reprovação por processo
- Alertas de prazo e pendências

### 7.2 CCONT — Coord. de Contabilidade
- Escrituração contábil e demonstrativos financeiros
- Conciliação de contas por natureza de despesa

### 7.3 CTES — Coord. de Tesouraria
- Fluxo de caixa consolidado
- Autorização eletrônica de pagamentos (substituição de processo físico)

### 7.4 Integração Direta SIAFE
- View/query unificada fornecida por Sandro (TI/SETIC)
- Elimina importação manual
- Solicitação formal enviada via memorando DFIN/DPPC

### 7.5 Outras melhorias identificadas
- Notificações automáticas (divergências, vencimentos, saldos críticos)
- Relatórios agendados por email
- Dashboard executivo para chefias (visão macro sem detalhes operacionais)
- App mobile (visualização de KPIs)
- Suporte a múltiplos exercícios simultâneos no ACONT

---

## 8. Infraestrutura de Produção

```
Internet / Rede Interna SEDUC
  └─► simf.seduc.pa.gov.br (DNS interno)
        └─► 192.168.200.74 (VM Ubuntu 24.04)
              ├─► Nginx (porta 80) → proxy reverso
              └─► PM2 → Next.js (porta 3000)
```

**Atualização do sistema:**
```bash
ssh joaoneto@192.168.200.74
cd ~/simf && git pull origin main && npm run build && pm2 restart simf
```

**Banco de dados:** Supabase Cloud (projeto dedicado SIMF)

---

## 9. Equipe

| Função               | Responsável         |
|----------------------|---------------------|
| Desenvolvimento      | SAPF/DFIN           |
| Infraestrutura (VM)  | Ricardo (TI/SETIC)  |
| Dados SIAFE          | Sandro (TI/SETIC)   |
| Gestão do sistema    | DFIN + DPPC         |
