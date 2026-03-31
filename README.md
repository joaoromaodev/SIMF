# README — Execução local e testes manuais do SIMF

> Este README foi elaborado com base no handoff do projeto SIMF e no estado atual informado da implementação.
> 
> Ele é um guia operacional para **subir a aplicação localmente e executar testes manuais do MVP atual**.
> 
> **Escopo deste README:** fundação da ingestão já implementada.
> 
> **Não cobre:** dashboard final, consolidação canônica completa, integração direta com SIAFE ou workflow administrativo.

---

## 1. Objetivo deste guia

Este documento orienta como:

- preparar o ambiente local;
- configurar as variáveis de ambiente;
- subir a aplicação Next.js;
- conectar ao Supabase;
- executar testes manuais do fluxo de ingestão já implementado;
- validar os comportamentos esperados do MVP atual.

---

## 2. Estado atual coberto por este README

Até o momento, o projeto já possui:

- aplicação em **Next.js**;
- integração com **Supabase**;
- upload manual de arquivos `.csv`;
- validação de:
  - extensão;
  - tipo de relatório;
  - nome exato do arquivo;
  - cabeçalhos esperados;
  - política por ano/escopo;
- armazenamento do CSV original no **Supabase Storage**;
- persistência de batches em `import_batches`;
- persistência de linhas normalizadas em:
  - `normalized_ne_dl_rows`
  - `normalized_dl_ob_rows`;
- regra especial para `2026`, com substituição integral do batch ativo por tipo;
- testes automatizados da fundação da ingestão.

---

## 3. Pré-requisitos

Antes de iniciar, garanta que você possui:

- **Node.js** instalado  
  - recomendado: versão LTS atual compatível com o projeto
- **npm** instalado
- acesso a um projeto **Supabase**
- bucket de Storage criado para os CSVs
- banco Supabase com as migrations já aplicadas
- variáveis de ambiente do projeto disponíveis

### Recomendação
Use uma versão de Node compatível com o projeto já implementado.
Se o repositório possuir arquivo `.nvmrc` ou definição no `package.json`, siga esse padrão.

---

## 4. Estruturas que devem existir no Supabase

Antes de rodar a aplicação, confirme que o ambiente Supabase já possui:

### Tabelas
- `import_batches`
- `normalized_ne_dl_rows`
- `normalized_dl_ob_rows`

### Storage
- bucket para armazenamento dos CSVs originais do SIAFE

### Lógica já esperada
- política de substituição integral para uploads válidos de `2026`
- finalização do batch ativo por tipo/ano conforme regra já implementada

> Se essas estruturas ainda não existirem no ambiente local/remoto, será necessário aplicar as migrations do projeto antes dos testes.

---

## 5. Variáveis de ambiente

Crie um arquivo `.env.local` na raiz do projeto (ou siga o padrão já adotado no repositório).

Exemplo base:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

### Observações
- `NEXT_PUBLIC_SUPABASE_URL`: URL do projeto Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: chave pública do Supabase
- `SUPABASE_SERVICE_ROLE_KEY`: chave server-side usada nas rotinas de ingestão, persistência e Storage

### Atenção
Os nomes exatos das variáveis devem ser confirmados no repositório.
Se o projeto usar nomes diferentes, siga os nomes já definidos no código.

---

## 6. Instalação das dependências

Na raiz do projeto:

```bash
npm install
```

Se o projeto usar lockfile, mantenha o instalador padrão já adotado.

---

## 7. Como rodar a aplicação localmente

Na raiz do projeto, execute o script de desenvolvimento.

Na maioria dos projetos Next.js, será um destes:

```bash
npm run dev
```

ou, se houver script específico:

```bash
npm run app:dev
```

Depois, abra no navegador:

```text
http://localhost:3000
```

> O nome exato do script deve ser confirmado no `package.json`.

---

## 8. Como confirmar que a aplicação subiu corretamente

Sinais esperados:

- a aplicação abre no navegador;
- a tela de upload é exibida;
- não há erro de build no terminal;
- não há erro de conexão com Supabase ao carregar a página;
- o endpoint/rota de importação está operacional.

Se houver erro logo no carregamento, revise:

- `.env.local`;
- URL e chaves do Supabase;
- existência das tabelas;
- bucket de Storage;
- migrations aplicadas.

---

## 9. Arquivos esperados no MVP atual

O sistema deve aceitar apenas os arquivos previstos no contrato atual.

### NEDL
- `2023_2024_NEDL.csv`
- `2025_NEDL.csv`
- `2026_NEDL.csv`

### DLOB
- `2023_2024_DLOB.csv`
- `2025_DLOB.csv`
- `2026_DLOB.csv`

Arquivos fora desse padrão devem falhar na validação.

---

## 10. Testes manuais recomendados

## 10.1 Teste 1 — upload válido de histórico NEDL

### Arquivo
- `2025_NEDL.csv` com cabeçalhos corretos

### Passos
1. Abrir a aplicação
2. Selecionar o arquivo `2025_NEDL.csv`
3. Executar o upload
4. Aguardar o resultado

### Resultado esperado
- upload aceito;
- batch criado em `import_batches`;
- arquivo salvo no Storage;
- linhas persistidas em `normalized_ne_dl_rows`;
- batch histórico tratado sem substituição especial de ativo `2026`.

---

## 10.2 Teste 2 — upload válido de histórico DLOB

### Arquivo
- `2025_DLOB.csv` com cabeçalhos corretos

### Resultado esperado
- upload aceito;
- batch criado em `import_batches`;
- arquivo salvo no Storage;
- linhas persistidas em `normalized_dl_ob_rows`.

---

## 10.3 Teste 3 — upload válido de 2026 NEDL

### Arquivo
- `2026_NEDL.csv`

### Resultado esperado
- upload aceito;
- batch criado;
- novo batch marcado como ativo para `report_type = NEDL` e `year_scope = 2026`;
- eventual batch anterior ativo do mesmo tipo/ano desativado;
- linhas normalizadas do batch ativo anterior removidas;
- histórico de batch preservado.

---

## 10.4 Teste 4 — upload válido de 2026 DLOB

### Arquivo
- `2026_DLOB.csv`

### Resultado esperado
- mesmo comportamento do teste anterior, agora para o tipo `DLOB`.

---

## 10.5 Teste 5 — arquivo com extensão inválida

### Exemplo
- `2026_NEDL.txt`

### Resultado esperado
- upload rejeitado;
- nenhum envio para o Storage;
- batch de falha criado, se esse comportamento já estiver implementado para esse ponto do fluxo.

---

## 10.6 Teste 6 — nome de arquivo inválido

### Exemplo
- `NEDL_2026.csv`
- `2026-nedl.csv`
- `relatorio_2026.csv`

### Resultado esperado
- upload rejeitado;
- erro de validação informando quebra do contrato de nome;
- arquivo não salvo no Storage;
- batch de falha registrado para rastreabilidade, conforme implementação atual.

---

## 10.7 Teste 7 — cabeçalho inválido

### Exemplo
Use um arquivo com:
- coluna faltando;
- coluna extra;
- coluna com nome alterado.

### Resultado esperado
- parsing até a etapa de validação estrutural;
- falha antes do upload ao Storage;
- batch de falha criado;
- nenhuma persistência de linhas normalizadas;
- nenhum arquivo estruturalmente inválido salvo no Storage.

---

## 10.8 Teste 8 — tentativa de histórico fora da política

### Exemplo
Subir novamente um histórico já tratado como estático, como `2025_NEDL.csv`, em desacordo com a política definida.

### Resultado esperado
Depende da regra já aplicada no projeto:
- ou rejeição por política de escopo anual;
- ou aceitação controlada apenas no cenário permitido.

> Validar o comportamento exato conforme a regra já codificada na implementação atual.

---

## 10.9 Teste 9 — rastreabilidade no banco após falha estrutural

### Cenário
Subir um CSV com cabeçalho inválido.

### Validar no banco
Verificar em `import_batches`:
- presença do batch;
- status de falha;
- mensagem/erro registrado;
- ausência de path de arquivo salvo, se esse for o contrato adotado.

---

## 10.10 Teste 10 — substituição integral de 2026

### Cenário
1. Subir um `2026_NEDL.csv` válido
2. Confirmar que virou batch ativo
3. Subir um novo `2026_NEDL.csv` válido, do mesmo tipo

### Resultado esperado
- somente o batch mais recente permanece ativo;
- batch anterior fica inativo;
- linhas normalizadas anteriores desse tipo/ano são removidas;
- histórico de batches permanece preservado.

Repita depois para `2026_DLOB.csv`.

---

## 11. Como validar os resultados no Supabase

## 11.1 Validar batches

Consultar `import_batches` e conferir:

- nome do arquivo;
- tipo do relatório;
- ano/escopo;
- status;
- quantidade de registros;
- ativo/inativo;
- mensagem de erro, quando houver;
- referência do arquivo no Storage, quando houver sucesso.

Exemplo de consulta:

```sql
select *
from import_batches
order by created_at desc;
```

---

## 11.2 Validar NEDL normalizado

```sql
select *
from normalized_ne_dl_rows
order by created_at desc
limit 50;
```

Validar especialmente:
- `documento_liquidacao`
- `codigo_nota_empenho`
- `numero_processo`

---

## 11.3 Validar DLOB normalizado

```sql
select *
from normalized_dl_ob_rows
order by created_at desc
limit 50;
```

Validar especialmente:
- `documento_liquidacao`
- `ordem_bancaria`
- `numero_processo`

---

## 11.4 Validar Storage

No painel do Supabase Storage, confirmar:

- presença do arquivo em casos de upload válido;
- ausência do arquivo em casos de falha estrutural antes do Storage.

---

## 12. Consultas úteis de validação

## 12.1 Ver batches ativos por tipo/ano

```sql
select report_type, year_scope, id, is_active, created_at
from import_batches
order by year_scope, report_type, created_at desc;
```

## 12.2 Contar linhas normalizadas por batch

> Ajuste os nomes das colunas conforme o schema real do projeto.

```sql
select import_batch_id, count(*)
from normalized_ne_dl_rows
group by import_batch_id
order by count(*) desc;
```

```sql
select import_batch_id, count(*)
from normalized_dl_ob_rows
group by import_batch_id
order by count(*) desc;
```

---

## 13. Problemas comuns

## 13.1 A aplicação sobe, mas o upload falha imediatamente
Verifique:
- `.env.local`
- chaves do Supabase
- permissões de Storage
- existência do bucket
- acesso server-side à service role

## 13.2 O upload falha antes do Storage
Isso pode ser esperado se houver:
- nome de arquivo inválido;
- cabeçalho inválido;
- extensão incorreta;
- quebra da política de escopo anual.

## 13.3 O arquivo vai para Storage, mas não persiste no banco
Verifique:
- permissões no banco;
- migrations;
- falha na rotina server-side;
- constraints não previstas no ambiente.

## 13.4 O batch de 2026 não substitui o anterior
Verifique:
- se a função/finalizador especial do `2026` foi aplicada no banco;
- se a migration corretiva foi executada;
- se o ambiente local está atualizado em relação ao apply corretivo.

---

## 14. Testes automatizados

Além dos testes manuais, é recomendável executar os testes automatizados já existentes no projeto.

Como os nomes exatos dos scripts não foram fornecidos neste handoff, procure no `package.json` por algo como:

```bash
npm test
```

ou

```bash
npm run test
```

ou ainda:

```bash
npm run test:unit
```

### O que os testes atuais devem cobrir
- falha estrutural antes do upload ao Storage;
- criação de batch de falha para erro estrutural;
- finalização especial do `2026`;
- manutenção do caminho simples para históricos;
- garantia do comportamento da política anual.

---

## 15. Checklist de teste manual mínimo antes do segundo apply

Antes de seguir para a consolidação canônica, recomenda-se validar manualmente:

- [ ] aplicação sobe localmente
- [ ] conexão com Supabase está funcionando
- [ ] upload válido de `2025_NEDL.csv`
- [ ] upload válido de `2025_DLOB.csv`
- [ ] upload válido de `2026_NEDL.csv`
- [ ] upload válido de `2026_DLOB.csv`
- [ ] falha estrutural antes do Storage funciona
- [ ] batch de falha é criado
- [ ] substituição integral do `2026` funciona
- [ ] linhas normalizadas aparecem nas tabelas corretas

---

## 16. O que ainda não deve ser esperado neste momento

Ao testar a aplicação atual, ainda **não** espere encontrar:

- tabelas canônicas:
  - `processos`
  - `notas_empenho`
  - `documentos_liquidacao`
  - `ordens_bancarias`
- tabela materializada:
  - `consolidated_siafe_lineage`
- merge da hierarquia `Processo > NE > DL > OB`
- camada final consumível por BI

Esses itens pertencem ao **segundo apply**.

---

## 17. Próximo passo após estes testes

Se os testes manuais acima passarem, o projeto estará pronto para avançar para o segundo apply, focado em:

- entidades canônicas;
- merge por `documento_liquidacao`;
- preservação de `numero_processo`;
- linhagem parcial, inclusive DL sem OB;
- tabela materializada `consolidated_siafe_lineage`;
- refresh/rebuild após importações válidas do `2026`.

---

## 18. Observação final

Este README é um guia operacional inicial.
Antes de consolidá-lo como documento oficial do repositório, vale revisar e ajustar:

- nomes exatos de scripts do `package.json`;
- nomes reais das variáveis de ambiente;
- nome exato do bucket do Storage;
- formato real das mensagens de erro e status;
- comandos reais de teste e migrations usados no projeto.
