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
- [PREENCHER: nome do(a) diretor(a) da DFIN]
- **Franz** — [PREENCHER: cargo exato] — responsável por assinar e encaminhar o
  memorando de solicitação de integração com o SIAFE para Sandro (TI/SETIC)

**DPPC — Diretoria de Pagamento e Prestação de Contas**
- Módulos do SIMF: CLIQ (Liquidações) e CPAG (Pagamentos)
- **Cláudia** — [PREENCHER: cargo exato] — diretora da DPPC, co-signatária do memorando
  para integração SIAFE

---

## 3. Pessoas-chave

| Nome     | Lotação       | Papel no projeto                                                      |
|----------|---------------|-----------------------------------------------------------------------|
| Franz    | DFIN/SAPF     | Solicitante formal da integração SIAFE; validação das funcionalidades |
| Cláudia  | DPPC/SAPF     | Co-gestora do sistema; módulos CLIQ e CPAG                            |
| Sandro   | TI/SETIC      | Acesso ao banco de dados do SIAFE; responsável por criar a view/query integrada |
| Ricardo  | TI/SETIC      | Infraestrutura da VM (Ubuntu 24.04, IP 192.168.200.74)                |
| [PREENCHER] | [PREENCHER] | [PREENCHER]                                                          |

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
- [PREENCHER: memorando já foi enviado? qual o retorno de Sandro? há prazo?]
- [PREENCHER: existem impedimentos técnicos ou políticos conhecidos?]

### O que Sandro precisaria fazer
- Criar uma view/query consolidada no banco do SIAFE (PostgreSQL ou Oracle)
- Cobrir todas as UGs (Unidades Gestoras) vinculadas à SEDUC
- Disponibilizar via pglink, API ou ETL agendado para o Supabase do SIMF
- Dados de NE, DL, OB e movimentações bancárias por conta/fonte

---

## 5. Montreal

[PREENCHER: descreva o contexto Montreal aqui — o que é, qual o relacionamento com o
SIMF, o que está pendente, quais emails/comunicações existem, qual o problema ou
oportunidade envolvendo essa empresa/sistema]

---

## 6. Situação dos Diretores e Chefias

[PREENCHER: o que as chefias (Franz, Cláudia e outros) já sabem sobre o SIMF?
Já fizeram demonstração? Qual foi a recepção? Há alguma demanda específica deles?
Há alguma resistência ou ceticismo a endereçar?]

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

[PREENCHER: liste aqui qualquer decisão pendente, problema em aberto ou ponto que
precisa de definição — técnica, política ou organizacional]

Exemplos de formato:
- [ ] Memorando para Sandro: aguardando envio formal pela chefia
- [ ] Montreal: [descreva]
- [ ] Demonstração para chefias: agendar após redesign visual
- [ ] Acesso ACONT com dados reais: depende de importação dos saldos de 2026
