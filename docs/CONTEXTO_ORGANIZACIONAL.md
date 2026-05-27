# SIMF — Contexto Organizacional

> Este arquivo é o "cérebro institucional" do projeto. Contém o contexto político,
> organizacional e relacional que não está no código. Deve ser carregado como
> Project Knowledge no Claude Project SIMF.
>
> Preencha ou complete as seções marcadas com [PREENCHER].

---

## 1. O que é o SIMF

Sistema Integrado de Monitoramento Financeiro da SEDUC/PA (Secretaria de Estado de
Educação do Pará). Plataforma web interna desenvolvida para centralizar o acompanhamento
da execução orçamentária, pagamentos e contas bancárias das equipes da SAPF
(Secretaria Adjunta de Planejamento e Finanças).

Opera em `simf.seduc.pa.gov.br` (rede interna). Acesso restrito a servidores autorizados.

O sistema está em produção e em uso ativo pelas equipes da DFIN e DPPC.

---

## 2. Estrutura Organizacional

### SEDUC/PA
Secretaria de Estado de Educação do Pará.

### SAPF — Secretaria Adjunta de Planejamento e Finanças
Unidade gestora do SIMF. Subdividida em:

**DFIN — Diretoria de Finanças**
- Módulos do SIMF: CEO (Execução Orçamentária) e ACONT (Contas Bancárias)
- [FRANZ]
- **Franz** — [DIRETOR DA DFIN] — responsável por assinar e encaminhar o
  memorando de solicitação de integração com o SIAFE para Sandro (SIAFE)

**DPPC — Diretoria de Pagamento e Prestação de Contas**
- Módulos do SIMF: CLIQ (Liquidações) e CPAG (Pagamentos)
- **Cláudia** — [DIRETORA DA DPPC] — diretora da DPPC, co-signatária do memorando
  para integração SIAFE

---

## 3. Pessoas-chave

| Nome     | Lotação       | Papel no projeto                                                      |
|----------|---------------|-----------------------------------------------------------------------|
| Franz    | DFIN/SAPF     | Solicitante formal da integração SIAFE; validação das funcionalidades |
| Cláudia  | DPPC/SAPF     | Co-gestora do sistema; módulos CLIQ e CPAG                            |
| Sandro   | SIAFE      | Acesso ao banco de dados do SIAFE; responsável por criar a view/query integrada |
| Ricardo  | MONTREAL      | Infraestrutura da VM (Ubuntu 24.04, IP 192.168.200.74)                |
| [MAX] | MONTREAL | REPRESENTANTE DA MONTREAL CHEFE                                                        |

---

## 4. Situação com Sandro / Integração SIAFE

### O que queremos
Eliminar a importação manual de 9 relatórios do SIAFE. A solução ideal é:
```
SIAFE (banco de dados) → View/Query criada por Sandro → Supabase → SIMF (tempo real)
```

### Duas frentes de dados
1. **Fluxo de Pagamento:** cadeia NE → Liquidação (DL) → Ordem Bancária (OB) de todas as UGs
2. **Movimentação de Contas:** extrato bancário, disponibilidade, razão contábil e aplicação financeira

### Status atual
- Memorando formal foi redigido (Franz + Cláudia → Sandro via chefia)
- O documento está em `MEMORANDO_SIMF_SIAFE_2026.docx`
- AINDA EM PROCEDIMENTO DE ENVIO

### O que Sandro precisaria fazer
- Criar uma view/query consolidada no banco do SIAFE (PostgreSQL ou Oracle)
- Cobrir todas as UGs (Unidades Gestoras) vinculadas à SEDUC
- Disponibilizar via pglink, API ou ETL agendado para o Supabase do SIMF
- Dados de NE, DL, OB e movimentações bancárias por conta/fonte

---

## 5. Montreal

MONTREAL É A EMPRESA NA QUAL SOU CONTRATADO E TRABALHA TERCEIRIZADA PRA SEDUC. EU FICO NO SETOR DA SEDUC DA DPPC ATENTENDO TODA A SECRETARIA ADJUNTA SAPF

---

## 6. Situação dos Diretores e Chefias

PRECISAM ENTENDER MELHOR ESPECIFICAMENTE O SISTEMA MAS JÁ ENTENDEM Q É UMA FORMA DE VISUALIZAÇÃO QUE VAI DAR MAIS AGILIDADE NA TOMADA DE DECISÃO DOS COORDENADORES DELES

---

## 7. Infraestrutura de Produção

```
simf.seduc.pa.gov.br (DNS interno)
  └─► 192.168.200.74 (VM Ubuntu 24.04 — Ricardo/SETIC)
        ├─► Nginx (porta 80) → proxy reverso
        └─► PM2 → Next.js (porta 3000)
```

**Banco de dados:** Supabase Cloud (projeto dedicado SIMF)
**Repositório:** github.com/joaoromaodev/SIMF (branch main = produção)

**Para atualizar o servidor:**
```bash
ssh joaoneto@192.168.200.74
cd ~/simf && git pull origin main && npm run build && pm2 restart simf
```

---

## 8. Estado atual do projeto (maio/2026)

### Operacional em produção
- CEO — Coord. de Execução Orçamentária (DFIN)
- CLIQ — Controle de Liquidações (DPPC)
- CPAG — Controle de Pagamentos (DPPC)
- ACONT — Controle de Contas Bancárias (DFIN) [dados de demonstração]

### Em andamento
- Redesign visual completo (tasks em `docs/REDESIGN_TASKS.md`)
- Integração direta com SIAFE (aguardando Sandro/TI)

### Planejado (sem prazo)
- CPED — Prestação de Contas (depende de relatórios do SIAFEM/federal)
- CCONT — Contabilidade
- CTES — Tesouraria
- Notificações automáticas, relatórios agendados, dashboard executivo

---

## 9. Pendências e decisões abertas

TER Q DAR UM JEITO DE MELHORAR A ALIMENTAÇÃO DO SISTEMA, TALVEZ MANDANDO O SANDRO IMPUTAR DIRETAMENTE OS RELATÓRIOS NECESSÁRIOS PRO SISTEMA

Exemplos de formato:
- [ ] Memorando para Sandro: aguardando envio formal pela chefia
- [ ] Montreal: [descreva]
- [ ] Demonstração para chefias: agendar após redesign visual
- [ ] Acesso ACONT com dados reais: depende de importação dos saldos de 2026
