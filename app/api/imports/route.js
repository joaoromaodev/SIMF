import { NextResponse } from "next/server";
import { processSiafeUpload } from "../../../lib/siafe/importer.js";

export async function POST(request) {
  const formData = await request.formData();
  const file = formData.get("file");
  const reportType = formData.get("reportType");
  const yearScope = formData.get("yearScope");

  // LOG DE DEPURAÇÃO: Verifique o terminal do VS Code após clicar no botão
  console.log("DADOS RECEBIDOS PELO BACKEND:", { reportType, yearScope });

  if (!(file instanceof File)) {
    return NextResponse.json({ message: "Arquivo CSV é obrigatório." }, { status: 400 });
  }

  try {
    const result = await processSiafeUpload({ file, reportType, yearScope });
    return NextResponse.json({ message: "Relatório processado com sucesso.", batch: result });
  } catch (error) {
    console.error("ERRO NO PROCESSAMENTO:", error);
    return NextResponse.json({ 
      message: error?.publicMessage ?? "Erro ao processar o upload.", 
      errors: [error.message] 
    }, { status: error?.statusCode ?? 500 });
  }
}