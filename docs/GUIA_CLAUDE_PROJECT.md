# Como montar o Claude Project SIMF

## Objetivo

Criar um projeto no Claude.ai onde o chat funciona como **consultor e tomador de
decisões** do SIMF — lida com questões institucionais, emails, estratégia com Sandro,
comunicação com diretores, Montreal, etc.

O Claude Code (este terminal) fica restrito à parte de código.

---

## Passo 1 — Criar o projeto

1. Abrir [claude.ai](https://claude.ai)
2. Menu lateral → **"Projects"** → **"New Project"**
3. Nomear: `SIMF — SEDUC/PA`

---

## Passo 2 — Carregar o Project Knowledge

Faça upload dos seguintes arquivos do repositório (em ordem de importância):

| Arquivo | Por que carregar |
|---|---|
| `docs/CONTEXTO_ORGANIZACIONAL.md` | Contexto institucional, pessoas, pendências — **preencha antes** |
| `docs/DOCUMENTACAO.md` | Documentação técnica completa do sistema |
| `MEMORANDO_SIMF_SIAFE_2026.docx` | Memorando para Sandro — referência para follow-up |
| `docs/REDESIGN_TASKS.md` | Estado atual do redesign visual |

> **Importante:** preencha o `CONTEXTO_ORGANIZACIONAL.md` antes de fazer upload.
> As seções marcadas com `[PREENCHER]` são o coração do contexto que o chat precisa.

---

## Passo 3 — Project Instructions (system prompt)

Cole isso no campo **"Project Instructions"** (ícone de engrenagem dentro do projeto):

```
Você é o consultor estratégico e institucional do SIMF — Sistema Integrado de
Monitoramento Financeiro da SEDUC/PA.

Seu papel:
- Ajudar a tomar decisões sobre o projeto: prioridades, comunicação institucional,
  estratégia com parceiros (Sandro/SETIC, chefias, fornecedores)
- Redigir ou revisar documentos formais: memorandos, emails, ofícios, apresentações
- Analisar situações e sugerir abordagens para avançar o projeto
- Ser um interlocutor para pensar em voz alta sobre os desafios do projeto

Você NÃO escreve código. Para demandas técnicas (bugs, novas funcionalidades,
banco de dados), o usuário usa o Claude Code separadamente.

Contexto completo do projeto está nos arquivos carregados no Project Knowledge.
Consulte-os sempre que precisar de detalhes sobre o sistema, as pessoas envolvidas
ou as pendências abertas.

Seja direto, prático e objetivo. Quando não souber algo, peça mais contexto em vez
de inventar. Quando tiver mais de uma abordagem possível, apresente as opções com
prós e contras.
```

---

## Passo 4 — Primeira mensagem para estabelecer contexto adicional

Ao abrir o chat pela primeira vez, mande uma mensagem assim para complementar o
que está nos arquivos:

```
Leu os arquivos? Antes de começarmos, vou te atualizar com o que não está
documentado ainda:

[Descreva aqui o que você sabe sobre Montreal]
[Descreva a situação atual com Sandro — memorando foi enviado? qual o retorno?]
[Descreva como estão as chefias — Franz e Cláudia já viram o sistema? qual foi
a reação? há pressão de prazo?]
[Qualquer outro contexto que você queira que ele saiba]

A partir de agora, toda vez que eu precisar de ajuda com decisões, comunicação
institucional ou estratégia do projeto, vou consultar você aqui. Para código, uso
o Claude Code separadamente.
```

---

## Como usar no dia a dia

**Traz pro chat do projeto:**
- Redigir email para Sandro cobrando retorno
- Preparar apresentação do SIMF para as chefias
- Decidir prioridade entre funcionalidades
- Analisar resposta da Montreal e sugerir próximo passo
- Criar pauta para reunião com DFIN/DPPC
- Redigir memorandos, ofícios, justificativas

**Leva pro Claude Code:**
- Bugs e correções
- Novas funcionalidades
- Alterações no banco de dados
- Deploy e infraestrutura
- Qualquer coisa que envolva arquivo de código

---

## Mantendo o contexto atualizado

Quando algo mudar de relevância (Sandro confirmou integração, chefia pediu nova
funcionalidade, Montreal respondeu, etc.), atualize o `CONTEXTO_ORGANIZACIONAL.md`
no repositório e faça um novo upload no Project Knowledge.

Isso garante que o contexto do chat nunca fica desatualizado.
