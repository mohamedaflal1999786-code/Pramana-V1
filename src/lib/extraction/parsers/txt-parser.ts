/**
 * Pramana-V1 Plain Text Parser
 * Team: Unknown GenZ
 *
 * Extracts text from TXT files, preserving line numbers, character start and end offsets.
 */

import type { ParsedPage } from "../types";

export interface TxtParseResult {
  fullText: string;
  lines: {
    lineNumber: number;
    text: string;
    charStart: number;
    charEnd: number;
  }[];
  pages: ParsedPage[];
}

export function parseTxtDocument(buffer: Buffer): TxtParseResult {
  const fullText = buffer.toString("utf8");
  const rawLines = fullText.split(/\r?\n/);
  const lines: TxtParseResult["lines"] = [];

  let currentOffset = 0;
  rawLines.forEach((lineText, idx) => {
    const start = currentOffset;
    const end = start + lineText.length;
    lines.push({
      lineNumber: idx + 1,
      text: lineText,
      charStart: start,
      charEnd: end,
    });
    currentOffset = end + 1; // +1 for newline character
  });

  return {
    fullText,
    lines,
    pages: [
      {
        pageNumber: 1,
        text: fullText,
        charCount: fullText.length,
        isScannedOrImage: false,
      },
    ],
  };
}
