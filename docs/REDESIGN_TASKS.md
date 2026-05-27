# SIMF — Redesign Visual: Lista de Tasks

## Instruções para o agente

- Execute **uma task por vez**, na ordem listada.
- Ao concluir cada task, marque com `[x]` e faça um commit com mensagem descritiva.
- Se discordar de alguma decisão de design ou identificar uma abordagem melhor, **descreva sua sugestão antes de implementar** e aguarde confirmação — ou implemente a sua versão e explique o que mudou no commit.
- Não altere lógica de negócio, Server Actions, chamadas ao Supabase, middleware ou arquivos em `lib/`, `app/api/`, `app/actions/`, `app/auth/`.
- Mantenha props e estrutura dos componentes de abas (`cliq-tabs.jsx`, `cpag-tabs.jsx`, `ceo-tabs.jsx`) — pode melhorar apenas o estilo visual.

---

## Contexto do sistema

O SIMF é um sistema interno de gestão financeira da SEDUC/PA (Secretaria de Estado de Educação do Pará). Usuários são servidores públicos. O visual deve transmitir seriedade institucional, clareza em dados financeiros e identidade do Governo do Pará.

**Cores institucionais** (já no `tailwind.config.js`):
- `para-blue`: `#0071CE` — Azul do Governo do Pará
- `para-red`: `#EB2939` — Vermelho institucional

**Stack:** Next.js 15 App Router · Tailwind CSS v4 · Lucide React

---

## Tasks

### TASK 01 — Fonte global e tokens base
**Arquivo:** `app/layout.js`, `tailwind.config.js`, `app/globals.css`

- Substituir a fonte `Avenir Next` (não garantida em servidores) pela fonte **Inter** via `next/font/google`
- Aplicar a fonte no `<body>` via `className` do Next/font (não via CSS hardcoded)
- Em `tailwind.config.js`, expandir o tema com:
  - Escala de `borderRadius` personalizada: `card: '0.75rem'`, `panel: '1rem'`, `xl2: '1.25rem'`
  - Manter as cores `para-blue` e `para-red` existentes
  - Adicionar `para-blue-dark: '#0058a3'` e `para-blue-light: '#e8f2fc'`
- Em `globals.css`, adicionar variáveis CSS base:
  ```css
  :root {
    --radius-card: 0.75rem;
    --shadow-card: 0 1px 3px 0 rgb(0 0 0 / 0.07), 0 1px 2px -1px rgb(0 0 0 / 0.07);
    --shadow-panel: 0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.07);
  }
  ```

- [ ] **Concluído**

---

### TASK 02 — Componente de logo SVG
**Arquivo a criar:** `components/ui/simf-logo.jsx`

Crie um componente `<SimfLogo />` com duas variantes via prop `variant: "full" | "icon"`:

**Variant `"icon"`** (usado na sidebar recolhida):
- Ícone SVG 28×28px
- Forma: quadrado com bordas arredondadas, fundo `#0071CE`
- Dentro: letra **S** estilizada em branco, peso bold, ou símbolo geométrico simples (barra vertical + linha diagonal ascendente, evocando gráfico financeiro)
- Se tiver uma ideia melhor para o ícone, descreva e implemente

**Variant `"full"`** (usado na sidebar expandida e login):
- Ícone à esquerda + texto "SIMF" à direita em peso `font-black`, cor `slate-900`
- Abaixo do texto: linha `"SEDUC · Pará"` em `10px`, `text-slate-400`, `tracking-widest`, `uppercase`

Exporte como default. Props: `variant` (default `"full"`), `className`.

- [ ] **Concluído**

---

### TASK 03 — Página de login
**Arquivo:** `app/login/page.js`

Redesenhe mantendo toda a lógica (`LoginForm`, Supabase auth, redirect, estados de loading/error).

Layout desejado:
- Fundo: `bg-slate-50` com padrão sutil (pode ser grid de pontos via SVG background, ou gradiente muito suave — sem foto)
- Card centralizado: branco, sombra `--shadow-panel`, border `border-slate-200`, `rounded-2xl`, padding generoso
- Acima do card: `<SimfLogo variant="full" />` centralizado
- No card: título `"Acesso ao Sistema"` e o formulário existente (campos email + senha, botão Entrar, link "Esqueci minha senha")
- Botão "Entrar": fundo `para-blue` (#0071CE), texto branco, hover `para-blue-dark`
- Rodapé abaixo do card: "Acesso restrito · SEDUC/PA" em texto `slate-300`
- Preservar `<Suspense>` em volta do `<LoginForm />`

- [ ] **Concluído**

---

### TASK 04 — Página de recuperação de senha
**Arquivo:** `app/login/recuperar-senha/page.js`

Aplicar o mesmo layout e estilo da Task 03 (fundo, card, logo), mantendo toda a lógica existente.

- [ ] **Concluído**

---

### TASK 05 — Sidebar e topbar (DashboardShell)
**Arquivo:** `components/dashboard-shell.jsx`

Este é o componente visual mais importante. Redesenhe mantendo toda a lógica existente (colapso, localStorage, pathname ativo, logout, isAdmin).

**Sidebar:**
- Logo: usar `<SimfLogo variant="full" />` quando expandida e `<SimfLogo variant="icon" />` quando recolhida (substituir o markup atual)
- Fundo da sidebar: `#0071CE` (azul institucional cheio) — texto e ícones em branco/azul-claro
  - Se preferir manter fundo branco com azul nos itens ativos, descreva a alternativa
- Item ativo: destaque com fundo `white/15` (branco com 15% opacidade) + barra de 3px à esquerda em branco
- Item inativo: `text-white/70`, hover `bg-white/10`
- Seções DFIN / DPPC: label da seção em `white/40`, `text-[10px]`, `tracking-widest`, `uppercase`
- Rodapé da sidebar: avatar do usuário (iniciais) + email truncado + botão de logout — mover para cá a partir da topbar

**Topbar:**
- Simplificar: apenas o nome da seção atual à esquerda (pode ser fixo "SAPF" ou dinâmico)
- Remover avatar/email/logout da topbar (já estarão na sidebar)
- Manter badge "Admin" no canto direito se `isAdmin`
- Fundo branco, border-bottom `border-slate-100`

- [ ] **Concluído**

---

### TASK 06 — Landing page
**Arquivo:** `app/page.js`

Redesenhe mantendo a lógica de redirect para usuários autenticados.

Layout:
- **Header fixo:** logo `<SimfLogo variant="full" />` à esquerda + botão "Entrar →" à direita (link para `/login`, estilo `bg-para-blue text-white`)
- **Hero:** centralizado, padding vertical generoso
  - Badge: `"Sistema Interno · SEDUC/PA"` em pill azul-claro
  - Título: `"Monitoramento Financeiro"` em tamanho grande, font-black
  - Subtítulo: `"Acompanhamento de execução orçamentária, pagamentos e contas bancárias da SAPF."` em `text-slate-500`
  - CTA: botão grande `"Acessar o Sistema"` → `/login`
- **Grid de módulos:** 4 cards (CEO, CLIQ, CPAG, ACONT) com ícone Lucide, nome, diretoria e descrição de 1 linha. Não linkam para lugar nenhum (acesso exige login)
- **Footer:** `"© 2025 SEDUC/PA · Secretaria Adjunta de Planejamento e Finanças"` em texto pequeno cinza

- [ ] **Concluído**

---

### TASK 07 — Hub central do dashboard
**Arquivo:** `app/dashboard/page.js`

Redesenhe mantendo os dados e estrutura de seções (DFIN e DPPC).

- Header com ícone e título "Portal Principal" mantidos, estilo alinhado ao novo design
- Cards de diretoria: mais elegantes, com borda sutil, sombra `--shadow-card`, hover com lift suave
- Mini-módulos dentro de cada card: usar os ícones Lucide existentes, fundo `para-blue-light` (`#e8f2fc`), ícone em `para-blue`
- Badge "DFIN" / "DPPC": pill com `bg-para-blue-light text-para-blue`

- [ ] **Concluído**

---

### TASK 08 — Hub DFIN
**Arquivo:** `app/dashboard/dfin/page.js`

Redesenhe mantendo os links (CEO → `/dashboard/dfin/ceo`, ACONT → `/dashboard/acont`).

- Breadcrumb "← Portal Principal" mantido, estilo novo
- Cards CEO e ACONT: mesma linguagem visual da Task 07
- Badge "Operacional": `bg-emerald-50 text-emerald-700 border border-emerald-200`
- Footer com nota de dados mantida

- [ ] **Concluído**

---

### TASK 09 — Hub DPPC
**Arquivo:** `app/dashboard/dppc/page.js`

Redesenhe mantendo os links (CLIQ → `/dashboard/dppc/cliq`, CPAG → `/dashboard/dppc/cpag`).

- Mesma linguagem visual da Task 08
- Cards CLIQ e CPAG com ícones, badges e layout equivalente ao DFIN

- [ ] **Concluído**

---

## Notas finais

Após concluir todas as tasks, rode `npm run build` para verificar que não há erros de compilação antes do commit final.

Se encontrar qualquer inconsistência entre os componentes (ex: padding diferente entre hubs, cor de badge diferente entre módulos), corrija para garantir coesão visual entre todas as páginas.
