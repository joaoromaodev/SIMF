import { NextResponse } from "next/server";
import { processSiafeUpload } from "../../../lib/siafe/importer.js";

export async function POST(request) {
  const formData = await request.formData();
  const file = formData.get("file");
  const reportType = formData.get("reportType");
  const yearScope = formData.get("yearScope");

  if (!(file instanceof File)) {
    return NextResponse.json(
      {
        message: "A CSV file is required.",
        errors: ["Select a `.csv` file before submitting the import."]
      },
      { status: 400 }
    );
  }

  try {
    const result = await processSiafeUpload({ file, reportType, yearScope });

    return NextResponse.json({
      message: "The upload was validated, normalized, and persisted successfully.",
      batch: result
    });
  } catch (error) {
    const status = error?.statusCode ?? 500;
    const errors = Array.isArray(error?.details) ? error.details : [error.message];

    return NextResponse.json(
      {
        message: error?.publicMessage ?? "The upload could not be processed.",
        errors
      },
      { status }
    );
  }
}
