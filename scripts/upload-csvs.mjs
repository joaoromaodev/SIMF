/**
 * upload-csvs.mjs
 *
 * Envia os 9 CSVs da pasta csv/ para a API /api/imports da aplicação
 * já deployada na Vercel (develop ou produção).
 *
 * Uso:
 *   node scripts/upload-csvs.mjs https://SEU-PREVIEW.vercel.app
 *
 * Não requer .env.local — usa a URL da Vercel onde as credenciais
 * do Supabase já estão configuradas.
 */

import fs   from "fs";
import path from "path";

// ── URL base da aplicação ─────────────────────────────────────────────────────
const BASE_URL = process.argv[2]?.replace(/\/$/, "");

if (!BASE_URL) {
  console.error("\n❌  Informe a URL da Vercel como argumento.");
  console.error("    Exemplo: node scripts/upload-csvs.mjs https://simf-git-develop-xxx.vercel.app\n");
  process.exit(1);
}

// ── Ordem de upload: NE → NEDL → DLOB (respeitar dependências de join) ────────
const UPLOADS = [
  { file: "2023_2024_NE.csv",   reportType: "NE",   yearScope: "2023_2024" },
  { file: "2025_NE.csv",        reportType: "NE",   yearScope: "2025"      },
  { file: "2026_NE.csv",        reportType: "NE",   yearScope: "2026"      },
  { file: "2023_2024_NEDL.csv", reportType: "NEDL", yearScope: "2023_2024" },
  { file: "2025_NEDL.csv",      reportType: "NEDL", yearScope: "2025"      },
  { file: "2026_NEDL.csv",      reportType: "NEDL", yearScope: "2026"      },
  { file: "2023_2024_DLOB.csv", reportType: "DLOB", yearScope: "2023_2024" },
  { file: "2025_DLOB.csv",      reportType: "DLOB", yearScope: "2025"      },
  { file: "2026_DLOB.csv",      reportType: "DLOB", yearScope: "2026"      },
];

const CSV_DIR = path.resolve(process.cwd(), "csv");

// ── Utilitário: formatar bytes ─────────────────────────────────────────────────
function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ── Enviar um arquivo ─────────────────────────────────────────────────────────
async function uploadFile({ file, reportType, yearScope }) {
  const filePath = path.join(CSV_DIR, file);

  if (!fs.existsSync(filePath)) {
    return { ok: false, file, error: "Arquivo não encontrado em csv/" };
  }

  const fileBuffer  = fs.readFileSync(filePath);
  const fileSize    = formatBytes(fileBuffer.length);
  const { Blob }    = await import("buffer");
  const blob        = new Blob([fileBuffer], { type: "text/csv" });

  const formData = new FormData();
  formData.append("file",       blob,       file);
  formData.append("reportType", reportType);
  formData.append("yearScope",  yearScope);

  const res  = await fetch(`${BASE_URL}/api/imports`, { method: "POST", body: formData });
  const json = await res.json().catch(() => ({ message: "Resposta não-JSON" }));

  return { ok: res.ok, file, reportType, yearScope, fileSize, status: res.status, json };
}

// ── Main ──────────────────────────────────────────────────────────────────────
console.log(`\n🚀  SIMF — Upload de CSVs`);
console.log(`    URL : ${BASE_URL}`);
console.log(`    Dir : ${CSV_DIR}`);
console.log(`──────────────────────────────────────────────────────\n`);

let passou = 0;
let falhou = 0;

for (const upload of UPLOADS) {
  process.stdout.write(`  ▶  ${upload.file.padEnd(26)} (${upload.reportType} / ${upload.yearScope}) ... `);

  try {
    const result = await uploadFile(upload);

    if (result.ok) {
      const count = result.json?.batch?.normalizedRowCount ?? result.json?.normalizedRowCount ?? "?";
      console.log(`✅  ${result.fileSize}  →  ${count} linhas normalizadas`);
      if (result.json?.warnings?.length) {
        for (const w of result.json.warnings) {
          console.log(`        ⚠️   ${w}`);
        }
      }
      passou++;
    } else {
      console.log(`❌  HTTP ${result.status}`);
      console.log(`        ${result.json?.message ?? "(sem mensagem)"}`);
      if (Array.isArray(result.json?.errors)) {
        for (const e of result.json.errors) console.log(`        • ${e}`);
      }
      falhou++;
    }
  } catch (err) {
    console.log(`❌  ${err.message}`);
    falhou++;
  }
}

console.log(`\n──────────────────────────────────────────────────────`);
console.log(`  ✅  Enviados com sucesso : ${passou}`);
console.log(`  ❌  Falharam             : ${falhou}`);
console.log(`──────────────────────────────────────────────────────\n`);

if (falhou > 0) process.exit(1);
