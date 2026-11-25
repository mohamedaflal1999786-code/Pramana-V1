/**
 * Pramana-V1 Native PDF Parser
 * Team: Unknown GenZ
 *
 * Extracts text page-by-page using pdf-parse, preserves page numbering,
 * character offsets, extracts metadata, and identifies scanned pages requiring OCR.
 */

// eslint-disable-next-line
const pdf = require("pdf-parse");
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

export async function parsePdfDocument(buffer: Buffer): Promise<PdfParseResult> {
  const pages: ParsedPage[] = [];
  let pageIndex = 1;

  // Custom page renderer to capture page-by-page text and detect image-only pages
  const options = {
    pagerender: function (pageData: any) {
      return pageData.getTextContent().then(function (textContent: any) {
        let lastY: number | null = null;
        let text = "";
        for (const item of textContent.items) {
          if (lastY === item.transform[5] || lastY === null) {
            text += item.str;
          } else {
            text += "\n" + item.str;
          }
          lastY = item.transform[5];
        }

        const trimmed = text.trim();
        const charCount = trimmed.length;
        const isScannedOrImage = charCount < 25; // Page has almost no native text

        pages.push({
          pageNumber: pageIndex++,
          text: trimmed,
          charCount,
          isScannedOrImage,
        });

        return text;
      });
    },
  };

  const parsed = await pdf(buffer, options);

  const hasScannedPages = pages.some((p) => p.isScannedOrImage);

  return {
    totalPages: parsed.numpages || pages.length,
    pages,
    fullText: parsed.text || "",
    metadata: {
      title: parsed.info?.Title,
      author: parsed.info?.Author,
      creator: parsed.info?.Creator,
      pageCount: parsed.numpages || pages.length,
    },
    hasScannedPages,
  };
}
