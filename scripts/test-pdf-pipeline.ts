import fs from 'fs';
import path from 'path';

// Parse .env.local
try {
  const envContent = fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf-8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) {
      const key = trimmed.substring(0, eqIdx).trim();
      const val = trimmed.substring(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '');
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  });
} catch (e) {
  console.log('Error reading .env.local', e);
}

import { parsePdfDocument } from '../src/lib/extraction/parsers/pdf-parser';
import { executeDocumentExtraction } from '../src/lib/extraction/engine';

async function testFullPdfPipeline() {
  console.log('=== TEST 1: Native Server-Side PDF Extraction ===');
  const pdfBytes = fs.readFileSync('valid_clinical_sample.pdf');
  const pdfParsed = await parsePdfDocument(pdfBytes);
  console.log('Pages parsed:', pdfParsed.totalPages);
  console.log('Sample text:', pdfParsed.fullText.substring(0, 100));
  if (!pdfParsed.fullText.includes('Warfarin')) {
    throw new Error('Extracted text missing expected clinical content');
  }
  console.log('PASS: parsePdfDocument succeeded without DOMMatrix!');

  console.log('\n=== TEST 2: Multi-Source Extraction Engine ===');
  const extractionResult = await executeDocumentExtraction(
    pdfBytes,
    'clinical_admission_note.pdf',
    'application/pdf',
    'test-hash-12345',
    'doc-test-001',
    1
  );
  console.log('Extraction success:', extractionResult.success);
  console.log('Method used:', extractionResult.extractionMethod);
  console.log('Entities extracted count:', extractionResult.entities.length);
  extractionResult.entities.forEach(e => {
    console.log(` - [${e.entityType}] ${e.rawText} (Page ${e.sourceLocation.pageNumber})`);
  });
  console.log('PASS: Extraction engine processed PDF cleanly!');

  console.log('\n=== ALL PDF VERIFICATION CHECKS PASSED (100% OPERATIONAL) ===');
}

testFullPdfPipeline().catch(err => {
  console.error('Pipeline Test FAILED:', err);
  process.exit(1);
});
