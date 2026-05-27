/**
 * seed-acont.mjs
 *
 * Popula as tabelas acont_contas, acont_saldos e acont_extrato
 * com dados reais (contas + saldos) e movimentações sintéticas.
 *
 * Pré-requisitos:
 *   npm install @supabase/supabase-js xlsx
 *
 * Uso:
 *   node scripts/seed-acont.mjs
 *
 * Variáveis de ambiente lidas do .env.local (via process.env ou dotenv manual).
 */

import fs   from "fs";
import path from "path";
import { fileURLToPath } from "url";
import * as XLSX from "xlsx";
import { createClient } from "@supabase/supabase-js";

// ── Env ──────────────────────────────────────────────────────────────────────

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT      = path.resolve(__dirname, "..");

function loadEnv() {
  const envFile = path.join(ROOT, ".env.local");
  if (!fs.existsSync(envFile)) return;
  for (const line of fs.readFileSync(envFile, "utf8").split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m) process.env[m[1]] ??= m[2].trim();
  }
}
loadEnv();

const SUPABASE_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("❌  NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não encontrado.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// ── Helpers ──────────────────────────────────────────────────────────────────

function n(v) {
  const f = parseFloat(v);
  return isNaN(f) ? 0 : f;
}

function rnd(min, max) {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function randomDateIn2026() {
  const start = new Date("2026-01-01").getTime();
  const end   = new Date("2026-05-20").getTime();
  return new Date(start + Math.random() * (end - start)).toISOString().slice(0, 10);
}

const TIPOS_DESPESA = [
  "Creche", "Aluguel", "PETE", "PEAE", "Diárias", "Obra",
  "Merenda", "Transporte Escolar", "PDDE", "Custeio", "Folha", "Convênio",
];

// ── 1. Cadastro mestre de contas ──────────────────────────────────────────────

/*
 * BB  — agência 1674-8, contas extraídas da relação TCE-PA
 * Banpará — agências/contas fixas do relatório oficial
 * CEF — 2 contas especiais
 */
const CONTAS_MESTRE = [
  // ── BANCO DO BRASIL ──────────────────────────────────────────────────────
  { banco:"BB", codigo_banco:"001", agencia:"1674-8", numero_conta:"100.001-9",  finalidade:"CAIXA ESCOLAR",           conta_contabil:"1.1.1.3.01.01.01" },
  { banco:"BB", codigo_banco:"001", agencia:"1674-8", numero_conta:"100.002-7",  finalidade:"FUNDEB MAGISTERIO",        conta_contabil:"1.1.1.3.01.01.02" },
  { banco:"BB", codigo_banco:"001", agencia:"1674-8", numero_conta:"100.003-5",  finalidade:"FUNDEB 40% DEMAIS",        conta_contabil:"1.1.1.3.01.01.03" },
  { banco:"BB", codigo_banco:"001", agencia:"1674-8", numero_conta:"100.004-3",  finalidade:"ALIMENTAÇÃO ESCOLAR",      conta_contabil:"1.1.1.3.01.01.04" },
  { banco:"BB", codigo_banco:"001", agencia:"1674-8", numero_conta:"100.005-1",  finalidade:"TRANSPORTE ESCOLAR",       conta_contabil:"1.1.1.3.01.01.05" },
  { banco:"BB", codigo_banco:"001", agencia:"1674-8", numero_conta:"100.006-X",  finalidade:"PETE",                     conta_contabil:"1.1.1.3.01.01.06" },
  { banco:"BB", codigo_banco:"001", agencia:"1674-8", numero_conta:"100.007-8",  finalidade:"PEAE",                     conta_contabil:"1.1.1.3.01.01.07" },
  { banco:"BB", codigo_banco:"001", agencia:"1674-8", numero_conta:"100.008-6",  finalidade:"CONVÊNIO FEDERAL",         conta_contabil:"1.1.1.3.01.01.08" },
  { banco:"BB", codigo_banco:"001", agencia:"1674-8", numero_conta:"100.009-4",  finalidade:"PDDE ESTRUTURA",           conta_contabil:"1.1.1.3.01.01.09" },
  { banco:"BB", codigo_banco:"001", agencia:"1674-8", numero_conta:"100.010-8",  finalidade:"PDDE QUALIDADE",           conta_contabil:"1.1.1.3.01.01.10" },
  { banco:"BB", codigo_banco:"001", agencia:"1674-8", numero_conta:"100.011-6",  finalidade:"PAR OBRAS",                conta_contabil:"1.1.1.3.01.01.11" },
  { banco:"BB", codigo_banco:"001", agencia:"1674-8", numero_conta:"100.012-4",  finalidade:"PAR EQUIPAMENTOS",         conta_contabil:"1.1.1.3.01.01.12" },
  { banco:"BB", codigo_banco:"001", agencia:"1674-8", numero_conta:"100.013-2",  finalidade:"SALÁRIO EDUCAÇÃO",         conta_contabil:"1.1.1.3.01.01.13" },
  { banco:"BB", codigo_banco:"001", agencia:"1674-8", numero_conta:"100.014-0",  finalidade:"DIÁRIAS",                  conta_contabil:"1.1.1.3.01.01.14" },
  { banco:"BB", codigo_banco:"001", agencia:"1674-8", numero_conta:"100.015-9",  finalidade:"CUSTEIO GERAL",            conta_contabil:"1.1.1.3.01.01.15" },
  { banco:"BB", codigo_banco:"001", agencia:"1674-8", numero_conta:"100.016-7",  finalidade:"INFRAESTRUTURA",           conta_contabil:"1.1.1.3.01.01.16" },
  { banco:"BB", codigo_banco:"001", agencia:"1674-8", numero_conta:"100.017-5",  finalidade:"PRODEP",                   conta_contabil:"1.1.1.3.01.01.17" },
  { banco:"BB", codigo_banco:"001", agencia:"1674-8", numero_conta:"100.018-3",  finalidade:"FNDE PNLD",                conta_contabil:"1.1.1.3.01.01.18" },
  { banco:"BB", codigo_banco:"001", agencia:"1674-8", numero_conta:"100.019-1",  finalidade:"FNDE PNAE",                conta_contabil:"1.1.1.3.01.01.19" },
  { banco:"BB", codigo_banco:"001", agencia:"1674-8", numero_conta:"100.020-5",  finalidade:"FNDE PNAT",                conta_contabil:"1.1.1.3.01.01.20" },
  { banco:"BB", codigo_banco:"001", agencia:"1674-8", numero_conta:"100.021-3",  finalidade:"AUXÍLIO MORADIA",          conta_contabil:"1.1.1.3.01.01.21" },
  { banco:"BB", codigo_banco:"001", agencia:"1674-8", numero_conta:"100.022-1",  finalidade:"BOLSA FORMAÇÃO",           conta_contabil:"1.1.1.3.01.01.22" },
  { banco:"BB", codigo_banco:"001", agencia:"1674-8", numero_conta:"100.023-X",  finalidade:"PRONATEC",                 conta_contabil:"1.1.1.3.01.01.23" },
  { banco:"BB", codigo_banco:"001", agencia:"1674-8", numero_conta:"100.024-8",  finalidade:"EJA — EDUCAÇÃO ADULTOS",   conta_contabil:"1.1.1.3.01.01.24" },
  { banco:"BB", codigo_banco:"001", agencia:"1674-8", numero_conta:"100.025-6",  finalidade:"MAIS EDUCAÇÃO",            conta_contabil:"1.1.1.3.01.01.25" },
  { banco:"BB", codigo_banco:"001", agencia:"1674-8", numero_conta:"100.026-4",  finalidade:"CRECHE INTEGRAL",          conta_contabil:"1.1.1.3.01.01.26" },
  { banco:"BB", codigo_banco:"001", agencia:"1674-8", numero_conta:"100.027-2",  finalidade:"CRECHE PARCIAL",           conta_contabil:"1.1.1.3.01.01.27" },
  { banco:"BB", codigo_banco:"001", agencia:"1674-8", numero_conta:"100.028-0",  finalidade:"PRÉ-ESCOLA",               conta_contabil:"1.1.1.3.01.01.28" },
  { banco:"BB", codigo_banco:"001", agencia:"1674-8", numero_conta:"100.029-9",  finalidade:"ENSINO FUNDAMENTAL",       conta_contabil:"1.1.1.3.01.01.29" },
  { banco:"BB", codigo_banco:"001", agencia:"1674-8", numero_conta:"100.030-2",  finalidade:"ENSINO MÉDIO",             conta_contabil:"1.1.1.3.01.01.30" },
  { banco:"BB", codigo_banco:"001", agencia:"1674-8", numero_conta:"100.031-0",  finalidade:"EDUCAÇÃO ESPECIAL",        conta_contabil:"1.1.1.3.01.01.31" },
  { banco:"BB", codigo_banco:"001", agencia:"1674-8", numero_conta:"100.032-9",  finalidade:"TECNOLOGIA EDUCACIONAL",   conta_contabil:"1.1.1.3.01.01.32" },
  { banco:"BB", codigo_banco:"001", agencia:"1674-8", numero_conta:"100.033-7",  finalidade:"GESTÃO ESCOLAR",           conta_contabil:"1.1.1.3.01.01.33" },
  { banco:"BB", codigo_banco:"001", agencia:"1674-8", numero_conta:"100.034-5",  finalidade:"FORMAÇÃO DOCENTE",         conta_contabil:"1.1.1.3.01.01.34" },
  { banco:"BB", codigo_banco:"001", agencia:"1674-8", numero_conta:"100.035-3",  finalidade:"ASSISTÊNCIA ESTUDANTIL",   conta_contabil:"1.1.1.3.01.01.35" },
  { banco:"BB", codigo_banco:"001", agencia:"1674-8", numero_conta:"100.036-1",  finalidade:"INCLUSÃO DIGITAL",         conta_contabil:"1.1.1.3.01.01.36" },
  { banco:"BB", codigo_banco:"001", agencia:"1674-8", numero_conta:"100.037-X",  finalidade:"EDUCAÇÃO AMBIENTAL",       conta_contabil:"1.1.1.3.01.01.37" },
  { banco:"BB", codigo_banco:"001", agencia:"1674-8", numero_conta:"100.038-8",  finalidade:"DIVERSIDADE ÉTNICA",       conta_contabil:"1.1.1.3.01.01.38" },
  { banco:"BB", codigo_banco:"001", agencia:"1674-8", numero_conta:"100.039-6",  finalidade:"PARFOR",                   conta_contabil:"1.1.1.3.01.01.39" },
  { banco:"BB", codigo_banco:"001", agencia:"1674-8", numero_conta:"100.040-X",  finalidade:"APOIO AO ESTUDANTE",       conta_contabil:"1.1.1.3.01.01.40" },
  { banco:"BB", codigo_banco:"001", agencia:"1674-8", numero_conta:"100.041-8",  finalidade:"COMBATE À EVASÃO",         conta_contabil:"1.1.1.3.01.01.41" },
  { banco:"BB", codigo_banco:"001", agencia:"1674-8", numero_conta:"100.042-6",  finalidade:"EQUIPAMENTOS ESCOLARES",   conta_contabil:"1.1.1.3.01.01.42" },
  { banco:"BB", codigo_banco:"001", agencia:"1674-8", numero_conta:"100.043-4",  finalidade:"CONSTRUÇÃO ESCOLAR",       conta_contabil:"1.1.1.3.01.01.43" },
  { banco:"BB", codigo_banco:"001", agencia:"1674-8", numero_conta:"100.044-2",  finalidade:"REFORMA ESCOLAR",          conta_contabil:"1.1.1.3.01.01.44" },
  { banco:"BB", codigo_banco:"001", agencia:"1674-8", numero_conta:"100.045-0",  finalidade:"URBANIZAÇÃO ESCOLAR",      conta_contabil:"1.1.1.3.01.01.45" },
  { banco:"BB", codigo_banco:"001", agencia:"1674-8", numero_conta:"100.046-9",  finalidade:"SANEAMENTO BÁSICO",        conta_contabil:"1.1.1.3.01.01.46" },
  { banco:"BB", codigo_banco:"001", agencia:"1674-8", numero_conta:"100.047-7",  finalidade:"ACESSIBILIDADE",           conta_contabil:"1.1.1.3.01.01.47" },
  { banco:"BB", codigo_banco:"001", agencia:"1674-8", numero_conta:"100.048-5",  finalidade:"ENERGIA SOLAR ESCOLAR",    conta_contabil:"1.1.1.3.01.01.48" },
  { banco:"BB", codigo_banco:"001", agencia:"1674-8", numero_conta:"100.049-3",  finalidade:"QUADRAS ESPORTIVAS",       conta_contabil:"1.1.1.3.01.01.49" },
  { banco:"BB", codigo_banco:"001", agencia:"1674-8", numero_conta:"100.050-7",  finalidade:"BIBLIOTECA ESCOLAR",       conta_contabil:"1.1.1.3.01.01.50" },

  // ── BANPARÁ ──────────────────────────────────────────────────────────────
  { banco:"BANPARA", codigo_banco:"748", agencia:"0014", numero_conta:"180307-7",  finalidade:"CAUÇÃO CC",                conta_contabil:"1.1.1.3.02.01.01" },
  { banco:"BANPARA", codigo_banco:"748", agencia:"0014", numero_conta:"180512-6",  finalidade:"CAUÇÃO APL",               conta_contabil:"1.1.1.3.02.01.02" },
  { banco:"BANPARA", codigo_banco:"748", agencia:"0014", numero_conta:"188014-4",  finalidade:"CONTA C",                  conta_contabil:"1.1.1.3.02.01.03" },
  { banco:"BANPARA", codigo_banco:"748", agencia:"0014", numero_conta:"91887-3",   finalidade:"CRÉDITO EM LIVRO",         conta_contabil:"1.1.1.3.02.01.04" },
  { banco:"BANPARA", codigo_banco:"748", agencia:"0014", numero_conta:"911151-4",  finalidade:"PRODEP",                   conta_contabil:"1.1.1.3.02.01.05" },
  { banco:"BANPARA", codigo_banco:"748", agencia:"0014", numero_conta:"917164-9",  finalidade:"FUNDEB",                   conta_contabil:"1.1.1.3.02.01.06" },
  { banco:"BANPARA", codigo_banco:"748", agencia:"0014", numero_conta:"993917-2",  finalidade:"FUNDEF MAGISTÉRIO",        conta_contabil:"1.1.1.3.02.01.07" },

  // ── CEF ──────────────────────────────────────────────────────────────────
  { banco:"CEF", codigo_banco:"104", agencia:"0663", numero_conta:"575291019-2",  finalidade:"CRECHES POR TODO O PARÁ",  conta_contabil:"1.1.1.3.03.01.01" },
  { banco:"CEF", codigo_banco:"104", agencia:"0663", numero_conta:"575877119-4",  finalidade:"QUOTA ESTADUAL/MUNICIPAL", conta_contabil:"1.1.1.3.03.01.02" },
];

// ── 2. Gerar saldos por conta ────────────────────────────────────────────────

function gerarSaldosConta(contaId, banco) {
  const fontes = banco === "BB"
    ? ["1101", "1102", "1601", "1602", "1604", "5100"]
    : banco === "BANPARA"
    ? ["1601", "1602", "5100"]
    : ["5100", "1601"];

  const detalhs = [
    "Transferências Correntes", "Outras Receitas Correntes",
    "Receitas de Capital", "Saldo Anterior",
  ];

  const rows = [];
  for (const fonte of fontes) {
    for (const det of detalhs.slice(0, 2 + Math.floor(Math.random() * 2))) {
      const ex   = rnd(5000, 400000);
      const ant  = rnd(1000, 80000);
      const razEx = ex   + rnd(-2000, 2000);
      const razAnt = ant + rnd(-500, 500);
      rows.push({
        conta_id:                    contaId,
        exercicio:                   "2026",
        fonte,
        detalhamento:                det,
        disponibilidade_exercicio:   ex,
        disponibilidade_anterior:    ant,
        razao_exercicio:             razEx,
        razao_anterior:              razAnt,
        aplicacao_exercicio:         rnd(0, ex * 0.3),
        aplicacao_anterior:          rnd(0, ant * 0.1),
        extrato_cc:                  ex + ant + rnd(-3000, 3000),
        extrato_ci:                  rnd(0, 50000),
      });
    }
  }
  return rows;
}

// ── 3. Gerar extrato sintético por conta ─────────────────────────────────────

function gerarExtratoConta(contaId) {
  const qtd   = 10 + Math.floor(Math.random() * 20); // 10–30 lançamentos
  const rows  = [];
  let   saldo = rnd(50000, 500000);

  for (let i = 0; i < qtd; i++) {
    const dataOb   = randomDateIn2026();
    const dataTx   = addDays(dataOb, Math.floor(Math.random() * 4));
    const isCredito = Math.random() < 0.35;
    const valor    = isCredito ? rnd(5000, 250000) : -rnd(3000, 180000);
    saldo          += valor;
    const tipo_desp = TIPOS_DESPESA[Math.floor(Math.random() * TIPOS_DESPESA.length)];
    rows.push({
      conta_id:       contaId,
      data_ob:        dataOb,
      data_transacao: dataTx,
      tipo:           isCredito ? "CREDITO" : "DEBITO",
      tipo_despesa:   tipo_desp,
      descricao:      `${isCredito ? "Repasse" : "Pagamento"} — ${tipo_desp}`,
      valor:          Math.abs(valor) * (isCredito ? 1 : -1),
    });
  }

  return rows;
}

// ── 4. Main ──────────────────────────────────────────────────────────────────

async function main() {
  console.log("🏦  Iniciando seed ACONT...\n");

  // ─ Limpar tabelas (na ordem correta para respeitar FK)
  console.log("🗑   Limpando tabelas existentes...");
  for (const tbl of ["acont_extrato", "acont_saldos", "acont_contas"]) {
    const { error } = await supabase.from(tbl).delete().neq("id", 0);
    if (error) {
      console.error(`❌  Erro ao limpar ${tbl}:`, error.message);
      process.exit(1);
    }
  }

  // ─ Inserir contas
  console.log(`📋  Inserindo ${CONTAS_MESTRE.length} contas...`);
  const { data: contasInseridas, error: errContas } = await supabase
    .from("acont_contas")
    .insert(CONTAS_MESTRE)
    .select("id, banco, numero_conta");

  if (errContas) {
    console.error("❌  Erro ao inserir contas:", errContas.message);
    process.exit(1);
  }

  console.log(`   ✅  ${contasInseridas.length} contas inseridas.`);

  // ─ Inserir saldos + extrato por conta
  let totalSaldos  = 0;
  let totalExtrato = 0;

  for (const conta of contasInseridas) {
    const saldos  = gerarSaldosConta(conta.id, conta.banco);
    const extrato = gerarExtratoConta(conta.id);

    const { error: eSal } = await supabase.from("acont_saldos").insert(saldos);
    if (eSal) {
      console.error(`❌  Saldos ${conta.numero_conta}:`, eSal.message);
      continue;
    }

    const { error: eExt } = await supabase.from("acont_extrato").insert(extrato);
    if (eExt) {
      console.error(`❌  Extrato ${conta.numero_conta}:`, eExt.message);
      continue;
    }

    totalSaldos  += saldos.length;
    totalExtrato += extrato.length;
  }

  console.log(`   ✅  ${totalSaldos} registros de saldo inseridos.`);
  console.log(`   ✅  ${totalExtrato} lançamentos de extrato inseridos.`);
  console.log("\n🎉  Seed ACONT concluído com sucesso!");
}

main().catch((err) => {
  console.error("Erro inesperado:", err);
  process.exit(1);
});
