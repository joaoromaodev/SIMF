# 🏛️ Design System e Identidade Visual - SIMF (SEDUC/PA)

Este documento atua como o **Guia Definitivo de UI/UX** para o desenvolvimento do SIMF (Sistema Integrado de Monitoramento Financeiro) da Secretaria de Estado de Educação do Pará (SEDUC/PA). 

**Qualquer código Front-End gerado (Next.js/Tailwind CSS) DEVE respeitar estritamente estas diretrizes baseadas no Manual Oficial do Governo do Estado do Pará.**

---

## 1. Paleta de Cores Oficiais

[cite_start]A marca do Governo utiliza as cores da bandeira do estado[cite: 27, 28, 29, 30]. No Tailwind CSS do projeto, elas estão mapeadas da seguinte forma:

* **🔵 Azul Institucional (Primária):**
    * [cite_start]HEX: `#0071CE` [cite: 128]
    * Uso: Cor principal de fundos corporativos (como a Sidebar), botões de ação primária e cabeçalhos de destaque.
    * Classe Tailwind sugerida: `bg-para-blue`, `text-para-blue`.

* **🔴 Vermelho Institucional (Apoio/Destaque):**
    * [cite_start]HEX: `#EB2939` [cite: 124]
    * Uso: Detalhes da marca e botões de destaque específicos (ex: "Atualizar Base"). *Nota de UX Financeiro: Usar com cautela em painéis de dados para não remeter a "saldo negativo" ou "erro".*
    * Classe Tailwind sugerida: `bg-para-red`, `text-para-red`.

* **⚪ Branco (Base/Contraste):**
    * [cite_start]HEX: `#FFFFFF` [cite: 130]
    * Uso: Cor de fundos dos painéis de conteúdo e textos sobre a cor Azul Institucional.

* **⚫ Tons Neutros (Apoio UI):**
    * Para manter a sobriedade financeira, utilize a escala de cinzas `slate` do Tailwind (`slate-50` para fundos de página, `slate-800` para textos corporativos).

---

## 2. Tipografia

[cite_start]A família tipográfica oficial do Governo do Estado do Pará é a **Avenir Next**[cite: 136].

* **Regra de Aplicação:** Sempre que possível, a stack de fontes do projeto deve priorizar a família Avenir Next.
* [cite_start]**Hierarquia de Assinaturas (Secretarias):** Conforme o manual, ao escrever o nome das secretarias e diretorias, deve-se usar o seguinte peso[cite: 387, 388]:
    * [cite_start]Prefixo (ex: "Secretaria de"): `Avenir Next Regular` [cite: 387]
    * [cite_start]Nome (ex: "Educação" / "Planejamento"): `Avenir Next Bold` [cite: 388, 198, 207]
    * *Exemplo em Tailwind:* `<span className="font-normal">Secretaria de </span><span className="font-bold">Educação</span>`

---

## 3. Diretrizes de UX e Interface (Regras Rigorosas)

1.  **Estética "Clean" e Governamental:** O design deve transmitir transparência e seriedade. O uso de "Dark Mode" nos componentes de conteúdo está proibido; a área de trabalho deve ser limpa, clara e focada nos dados.
2.  **Sidebar (Menu Lateral):** * Deve utilizar o Azul Institucional (`bg-para-blue`) em seu estado principal, com textos em branco (`text-white`).
    * **Indicador de Página Ativa:** O link ativo na navegação deve possuir um fundo sutil integrado à paleta corporativa (ex: `bg-white/20` ou `bg-blue-800`) e deve **obrigatoriamente** receber uma borda branca esquerda (`border-l-4 border-white`) para clareza visual.
3.  **Proibição de Emojis:** Sendo um sistema financeiro (SAPF/SEDUC), **É TERMINANTEMENTE PROIBIDO o uso de emojis** (ex: 📊, ⚙️, 💰) no código fonte gerado.
4.  **Iconografia:** Toda iconografia deve ser feita via SVGs inline (estilo *Lucide Icons* ou *Heroicons*), utilizando `stroke="currentColor"` e um traço minimalista (stroke-width 1.5 ou 2).
5.  **Indicadores Matemáticos (KPIs):** Valores monetários e quantitativos em dashboards (como CPAG e CLIQ) devem utilizar cores institucionais (Azul ou Slate-800), com fontes de peso forte (`font-black` ou `font-bold`).

---
*Fim das Diretrizes. @Copilot: Ao ler este arquivo, confirme seu entendimento e aplique as regras imediatamente em suas próximas gerações de código Front-End.*