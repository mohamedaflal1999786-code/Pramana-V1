import fs from 'fs';
import { parsePdfDocument } from '../src/lib/extraction/parsers/pdf-parser';

async function run() {
  const buf = fs.readFileSync('valid_clinical_sample.pdf');
  console.log('Testing parsePdfDocument on valid_clinical_sample.pdf...');
  const res = await parsePdfDocument(buf);
  console.log('Total pages:', res.totalPages);
  console.log('Full text:', JSON.stringify(res.fullText));
  console.log('Has scanned pages:', res.hasScannedPages);
  console.log('SUCCESS: parsePdfDocument executed without DOMMatrix or errors!');
}

run().catch(err => {
  console.error('Test Failed with Error:', err);
  process.exit(1);
});
