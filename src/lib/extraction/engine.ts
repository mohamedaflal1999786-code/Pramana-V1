/**
 * Pramana-V1 Unified Clinical Extraction Engine
 * Team: Unknown GenZ
 *
 * Orchestrates multi-format parsing, OCR, and coordinate-grounded entity extraction.
 * Guarantees that every extracted entity links back to immutable source document tokens.
 */

import { parsePdfDocument } from "./parsers/pdf-parser";
import { parseImageWithOcr } from "./parsers/ocr-parser";
import { parseTxtDocument } from "./parsers/txt-parser";
import { parseJsonFhirDocument } from "./parsers/json-fhir-parser";
import { parseHl7Document, parseXmlClinicalDocument } from "./parsers/xml-hl7-parser";
import type {
  DocumentExtractionResult,
  ExtractedEntity,
  ParsedPage,
  SupportedFormat,
} from "./types";

export const EXTRACTION_ENGINE_VERSION = "pramana-extractor-v1.2.0";

/**
 * Deterministic clinical term extractor from unstructured clinical narrative text
 */
function extractEntitiesFromText(
  text: string,
  pageNumber: number = 1,
  charOffsetStart: number = 0
): ExtractedEntity[] {
  const entities: ExtractedEntity[] = [];

  // 1. Medication & Dosage Patterns (e.g., "Metformin 500mg BID", "Lisinopril 10 mg daily", "Atorvastatin 40mg")
  const medRegex = /\b([A-Z][a-z]{3,20}(?:ol|in|ide|ate|one|ine|pam|mab|statin|pril|sartan|olol|mycin|cillin)?)\s+(\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml|units))\s*(?:(daily|bid|tid|qid|prn|once daily|at bedtime|po|iv))?/gi;
  let match: RegExpExecArray | null;

  while ((match = medRegex.exec(text)) !== null) {
    const raw = match[0];
    const drugName = match[1];
    const dose = match[2];
    const freq = match[3] || "";
    const start = charOffsetStart + match.index;
    const end = start + raw.length;

    entities.push({
      id: crypto.randomUUID(),
      entityType: "medication",
      rawText: raw,
      normalizedName: drugName,
      confidenceScore: 0.94,
      isVerified: false,
      reviewStatus: "unverified",
      sourceLocation: {
        pageNumber,
        charStart: start,
        charEnd: end,
      },
    });
  }

  // 2. Allergy Patterns (e.g., "Allergic to Penicillin", "NKDA", "Sulfa allergy")
  const allergyRegex = /(?:allergic to|allergy to|allergy:?)\s+([A-Za-z0-9\s-]{3,25})/gi;
  while ((match = allergyRegex.exec(text)) !== null) {
    const raw = match[0];
    const allergen = match[1].trim();
    const start = charOffsetStart + match.index;
    const end = start + raw.length;

    entities.push({
      id: crypto.randomUUID(),
      entityType: "allergy",
      rawText: raw,
      normalizedName: allergen,
      confidenceScore: 0.96,
      isVerified: false,
      reviewStatus: "unverified",
      sourceLocation: {
        pageNumber,
        charStart: start,
        charEnd: end,
      },
    });
  }

  // 3. Lab Value Patterns (e.g., "HbA1c: 7.2%", "Potassium: 4.8 mEq/L", "Creatinine: 1.2 mg/dL", "eGFR: 58")
  const labRegex = /\b(HbA1c|Potassium|Sodium|Creatinine|BUN|eGFR|WBC|Platelets|Hemoglobin|Glucose|INR|AST|ALT)\s*[:=]\s*(\d+(?:\.\d+)?)\s*([a-zA-Z/%]*)/gi;
  while ((match = labRegex.exec(text)) !== null) {
    const raw = match[0];
    const testName = match[1];
    const value = match[2];
    const unit = match[3] || "";
    const start = charOffsetStart + match.index;
    const end = start + raw.length;

    entities.push({
      id: crypto.randomUUID(),
      entityType: "lab_value",
      rawText: raw,
      normalizedName: testName,
      confidenceScore: 0.95,
      isVerified: false,
      reviewStatus: "unverified",
      sourceLocation: {
        pageNumber,
        charStart: start,
        charEnd: end,
      },
    });
  }

  return entities;
}

/**
 * Primary Extraction Orchestrator
 */
export async function executeDocumentExtraction(
  buffer: Buffer,
  filename: string,
  mimeType: string,
  sha256Hash: string,
  documentId: string = crypto.randomUUID(),
  versionNumber: number = 1
): Promise<DocumentExtractionResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  const lowerName = filename.toLowerCase();

  let detectedFormat: SupportedFormat = "txt";
  let fullText = "";
  let totalPages = 1;
  let pages: ParsedPage[] = [];
  let entities: ExtractedEntity[] = [];
  let extractionMethod: DocumentExtractionResult["extractionMethod"] = "native_text";

  try {
    // 1. PDF Documents
    if (lowerName.endsWith(".pdf") || mimeType === "application/pdf") {
      detectedFormat = "pdf";
      const pdfResult = await parsePdfDocument(buffer);
      totalPages = pdfResult.totalPages;
      pages = pdfResult.pages;
      fullText = pdfResult.fullText;
      extractionMethod = "native_text";

      // Extract entities page by page to track exact page numbers
      pages.forEach((p) => {
        const pageEntities = extractEntitiesFromText(p.text, p.pageNumber);
        entities.push(...pageEntities);
      });
    }

    // 2. Images (JPG, JPEG, PNG)
    else if (
      lowerName.endsWith(".jpg") ||
      lowerName.endsWith(".jpeg") ||
      lowerName.endsWith(".png") ||
      mimeType.startsWith("image/")
    ) {
      detectedFormat = lowerName.endsWith(".png") ? "png" : "jpg";
      extractionMethod = "tesseract_ocr";

      const ocrResult = await parseImageWithOcr(buffer);
      fullText = ocrResult.text;
      totalPages = 1;

      pages = [
        {
          pageNumber: 1,
          text: ocrResult.text,
          charCount: ocrResult.text.length,
          isScannedOrImage: true,
          ocrConfidence: ocrResult.confidence,
        },
      ];

      // Extract entities and associate with OCR bounding boxes
      const rawEntities = extractEntitiesFromText(ocrResult.text, 1);
      entities = rawEntities.map((ent) => {
        // Attempt to find bounding box in OCR words
        const matchingWord = ocrResult.blocks.find((b) =>
          ent.rawText.toLowerCase().includes(b.text.toLowerCase())
        );
        return {
          ...ent,
          sourceLocation: {
            ...ent.sourceLocation,
            isOcrDerived: true,
            confidenceScore: ocrResult.confidence,
            boundingBox: matchingWord?.bbox,
          },
        };
      });
    }

    // 3. JSON & FHIR Resources
    else if (lowerName.endsWith(".json") || mimeType === "application/json") {
      detectedFormat = "fhir";
      extractionMethod = "structured_fhir";

      const fhirResult = parseJsonFhirDocument(buffer);
      fullText = fhirResult.fullTextSummary;
      entities = fhirResult.entities;
      pages = [
        {
          pageNumber: 1,
          text: fullText,
          charCount: fullText.length,
          isScannedOrImage: false,
        },
      ];
    }

    // 4. HL7 v2 Pipe-Delimited
    else if (lowerName.endsWith(".hl7") || mimeType.includes("hl7")) {
      detectedFormat = "hl7";
      extractionMethod = "structured_hl7";

      const hl7Result = parseHl7Document(buffer);
      fullText = hl7Result.segmentsSummary;
      entities = hl7Result.entities;
      pages = [
        {
          pageNumber: 1,
          text: fullText,
          charCount: fullText.length,
          isScannedOrImage: false,
        },
      ];
    }

    // 5. XML / CDA Documents
    else if (lowerName.endsWith(".xml") || mimeType.includes("xml")) {
      detectedFormat = "xml";
      extractionMethod = "native_text";

      const xmlResult = parseXmlClinicalDocument(buffer);
      fullText = xmlResult.summary;
      entities = xmlResult.entities;
      pages = [
        {
          pageNumber: 1,
          text: fullText,
          charCount: fullText.length,
          isScannedOrImage: false,
        },
      ];
    }

    // 6. Plain Text (TXT)
    else {
      detectedFormat = "txt";
      extractionMethod = "native_text";

      const txtResult = parseTxtDocument(buffer);
      fullText = txtResult.fullText;
      pages = txtResult.pages;
      entities = extractEntitiesFromText(fullText, 1);
    }
  } catch (err: any) {
    errors.push(`Extraction failed: ${err.message}`);
  }

  if (!fullText.trim() && errors.length === 0) errors.push("No readable text extracted. Scanned PDFs require OCR or a text-based replacement.");
  const duration = Date.now() - startTime;

  return {
    success: errors.length === 0,
    documentId,
    versionNumber,
    sha256Hash,
    mimeType,
    detectedFormat,
    totalPages,
    pages,
    fullText,
    entities,
    extractionMethod,
    engineVersion: EXTRACTION_ENGINE_VERSION,
    processingDurationMs: duration,
    errors,
  };
}
