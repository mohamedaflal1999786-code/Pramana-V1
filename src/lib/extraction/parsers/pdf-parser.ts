/**
 * Pramana-V1 Native Server-Side PDF Parser
 * Team: Unknown GenZ
 *
 * Extracts text page-by-page using unpdf (pure JS, serverless-safe, zero DOM/canvas dependencies).
 * Preserves page numbering, character offsets, extracts metadata, and identifies scanned pages requiring OCR.
 */


import type { ParsedPage } from "../types";

export interface PdfParseResult {
  totalPages: number;
  pages: ParsedPage[];
  fullText: string;
  metadata: {
    title?: string;
    author?: string;
    creator?: string;
    pageCount: number;
  };
  hasScannedPages: boolean;
}

export async function parsePdfDocument(buffer: Buffer | Uint8Array): Promise<PdfParseResult> {
  // unpdf strictly requires a standard Uint8Array (it explicitly rejects Buffer instances)
  const data = Buffer.isBuffer(buffer)
    ? new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength)
    : buffer instanceof Uint8Array
    ? buffer
    : new Uint8Array(buffer);

  const { extractText, getMeta, getDocumentProxy } = await import("unpdf");
  const pdf = await getDocumentProxy(data);
  try {
  // 1. Extract text page-by-page cleanly without DOMMatrix / canvas dependencies
  const { totalPages, text: pageTexts } = await extractText(pdf, { mergePages: false });

  // 2. Extract document metadata safely
  let metaInfo: Record<string, any> = {};
  try {
    const meta = await getMeta(pdf);
    metaInfo = meta?.info || {};
  } catch {
    // Non-fatal fallback for PDFs without standard metadata dictionary
  }

  const pages: ParsedPage[] = [];
  let fullText = "";
  let hasScannedPages = false;

  const rawPages = Array.isArray(pageTexts) ? pageTexts : [pageTexts || ""];

  rawPages.forEach((rawText, idx) => {
    const trimmed = (rawText || "").trim();
    const charCount = trimmed.length;
    const isScannedOrImage = charCount < 25; // Scanned or image-only page
    if (isScannedOrImage) {
      hasScannedPages = true;
    }

    pages.push({
      pageNumber: idx + 1,
      text: trimmed,
      charCount,
      isScannedOrImage,
    });

    fullText += (fullText ? "\n\n" : "") + trimmed;
  });

  return {
    totalPages: totalPages || pages.length,
    pages,
    fullText: fullText.trim(),
    metadata: {
      title: metaInfo.Title || metaInfo.title || undefined,
      author: metaInfo.Author || metaInfo.author || undefined,
      creator: metaInfo.Creator || metaInfo.creator || undefined,
      pageCount: totalPages || pages.length,
    },
    hasScannedPages,
  };
  } finally { await pdf.destroy(); }
}
