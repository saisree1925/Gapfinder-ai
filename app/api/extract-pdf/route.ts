
import { NextResponse } from "next/server";
import { extractPdfText } from "../../lib/pdf-reader";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Please select a PDF file." },
        { status: 400 }
      );
    }

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json(
        { error: "Please select a PDF file." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const text = await extractPdfText(buffer);

    if (!text.trim()) {
      return NextResponse.json(
        { error: "No readable text found. This PDF may be scanned." },
        { status: 422 }
      );
    }

    return NextResponse.json({
      filename: file.name,
      text,
      characters: text.length,
    });
  } catch (error) {
    console.error("PDF extraction failed:", error);

    return NextResponse.json(
      {
        error: error instanceof Error
          ? error.message
          : "Unable to read this PDF.",
      },
      { status: 500 }
    );
  }
}
