/**
 * Pramana-V1 Optical Character Recognition (OCR) Engine
 * Team: Unknown GenZ
 *
 * Performs optical character recognition using maintained Tesseract.js.
 * Extracts text, confidence scores, and token-level bounding boxes for JPG, PNG, and scanned documents.
 */

import { createWorker } from "tesseract.js";
import type { ParsedPage, BoundingBox } from "../types";

export interface OcrParseResult {
  text: string;
  confidence: number;
  blocks: {
    text: string;
    confidence: number;
    bbox: BoundingBox;
  }[];
  isLowConfidence: boolean;
}

export async function parseImageWithOcr(buffer: Buffer): Promise<OcrParseResult> {
  const worker = await createWorker("eng");

  try {
    const ret = await worker.recognize(buffer);
    const data = ret.data as any;
    const confidence = data.confidence || 0;
    const text = (data.text || "").trim();

    const blocks = (data.words || []).map((w: any) => ({
      text: w.text,
      confidence: w.confidence,
      bbox: {
        x0: w.bbox.x0,
        y0: w.bbox.y0,
        x1: w.bbox.x1,
        y1: w.bbox.y1,
      },
    }));

    await worker.terminate();

    return {
      text,
      confidence,
      blocks,
      isLowConfidence: confidence < 65,
    };
  } catch (err: any) {
    await worker.terminate();
    throw new Error(`OCR processing failed: ${err.message}`);
  }
}
