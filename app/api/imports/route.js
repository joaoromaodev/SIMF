import { NextResponse } from "next/server";
import { processSiafeUpload } from "../../../lib/siafe/importer.js";
import { createSupabaseSessionClient } from "../../../lib/supabase/session.js";

export async function POST(request) {
  // ── Auth: exige sessão válida ────────────────────────────────────────────
  const supabase = await createSupabaseSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { message: "Autenticação necessária." },
      { status: 401 }
    );
  }

  // ── Auth: exige role admin — lido de `profiles`, nunca do client ─────────
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "admin") {
    return NextResponse.json(
      { message: "Acesso negado. Apenas administradores podem importar relatórios." },
      { status: 403 }
    );
  }

  // ── Processamento ─────────────────────────────────────────────────────────
  const formData = await request.formData();
  const file       = formData.get("file");
  const reportType = formData.get("reportType");
  const yearScope  = formData.get("yearScope");

  if (!(file instanceof File)) {
    return NextResponse.json({ message: "Arquivo CSV é obrigatório." }, { status: 400 });
  }

  try {
    const result = await processSiafeUpload({
      file,
      reportType,
      yearScope,
      importedBy: user.id,   // registra responsável pela importação
    });
    return NextResponse.json({
      message:  "Relatório processado com sucesso.",
      batch:    result,
      warnings: result.warnings ?? [],
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: error?.publicMessage ?? "Erro ao processar o upload.",
        errors:  Array.isArray(error?.details) ? error.details : [error.message],
      },
      { status: error?.statusCode ?? 500 }
    );
  }
}
