# Instruções de Contexto - Projeto SIMF

## Stack Técnica
- Framework: Next.js (App Router)
- Backend/DB: Supabase (Postgres + Storage)
- Estilização: Tailwind CSS

## Regras de Negócio Fundamentais (NÃO VIOLAR)
1. **Hierarquia:** Processo > NE (Empenho) > DL (Liquidação) > OB (Ordem Bancária).
2. **Chave de Ligação:** Relatórios se cruzam pelo `documento_liquidacao`.
3. **Política 2026:** Uploads do ano de 2026 substituem integralmente os dados anteriores do mesmo tipo/ano.
4. **Persistência:** Primeiro salva o CSV bruto no Storage, depois normaliza em `normalized_ne_dl_rows` ou `normalized_dl_ob_rows`.

## Padrões de Código
- Use Server Components por padrão.
- Siga as definições de schema em `lib/siafe/schemas.js`.