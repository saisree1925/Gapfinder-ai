
type PDFParserInstance = {
  getText: () => Promise<{ text: string }>;
  destroy: () => Promise<void>;
};

type PDFParserConstructor = new (options: {
  data: Uint8Array;
}) => PDFParserInstance;

export async function extractPdfText(
  fileBuffer: Buffer
): Promise<string> {
  const pdfModule = (await import("pdf-parse")) as unknown as {
    PDFParse: PDFParserConstructor;
  };

  const parser = new pdfModule.PDFParse({
    data: new Uint8Array(fileBuffer),
  });

  try {
    const result = await parser.getText();
    const text = result.text.trim();

    if (!text) {
      throw new Error(
        "No readable text found. This PDF may contain scanned images."
      );
    }

    return text;
  } finally {
    await parser.destroy();
  }
}
