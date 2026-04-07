import { NextResponse } from "next/server";
import { processSiafeUpload } from "../../../lib/siafe/importer.js";

export async function POST(request) {
  const formData = await request.formData();
  const file = formData.get("file");
  const reportType = formData.get("reportType");
  const yearScope = formData.get("yearScope");

  if (!(file instanceof File)) {
    return NextResponse.json({ message: "Arquivo CSV é obrigatório." }, { status: 400 });
  }

  try {
    const result = await processSiafeUpload({ file, reportType, yearScope });
    return NextResponse.json({ message: "Relatório processado com sucesso.", batch: result });
  } catch (error) {
    return NextResponse.json({ 
      message: error?.publicMessage ?? "Erro ao processar o upload.", 
      errors: Array.isArray(error?.details) ? error.details : [error.message]
    }, { status: error?.statusCode ?? 500 });
  }
}
