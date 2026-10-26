
import { NextResponse } from "next/server";
import { extractPdfText } from "@/app/lib/pdf-reader";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Please upload a PDF file." },
        { status: 400 }
      );
    }

    if (
      file.type !== "application/pdf" &&
      !file.name.toLowerCase().endsWith(".pdf")
    ) {
      return NextResponse.json(
        { error: "Only PDF files are supported." },
        { status: 400 }
      );
    }

    const maxSize = 10 * 1024 * 1024;

    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "Please upload a PDF smaller than 10 MB." },
        { status: 413 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const text = await extractPdfText(buffer);

    if (!text || !text.trim()) {
      return NextResponse.json(
        {
          error:
            "No readable text was found. This PDF may contain scanned images.",
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      fileName: file.name,
      text: text.trim(),
      characters: text.trim().length,
    });
  } catch (error) {
    console.error("PDF extraction failed:", error);

    return NextResponse.json(
      { error: "Could not read this PDF. Please try another file." },
      { status: 500 }
    );
  }
}
