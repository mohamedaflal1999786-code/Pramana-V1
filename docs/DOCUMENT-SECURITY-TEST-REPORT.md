# Document Security Test Report — Phase 05
**Pramana-V1 Healthcare Intelligence Platform**
**Date:** November 25, 2026
**Lead Organization:** Unknown GenZ
**Test Harness:** `scripts/test-phase5-pipeline.ts`

---

## 1. Executive Summary
The Phase 05 Ingestion and Storage Pipeline was subjected to 12 automated security and extraction tests. All 12 tests passed successfully (100% pass rate).

---

## 2. Test Execution Results

| # | Test Module | Objective | Result | Grounding Verification |
| :--- | :--- | :--- | :---: | :--- |
| **1** | Native Text Ingestion | Line & char offset extraction | **PASS** | `lineIndex: 0`, `startOffset: 13` |
| **2** | FHIR R4 Ingestion | JSONPath preservation | **PASS** | `Bundle.entry[0].resource(MedicationRequest)...` |
| **3** | HL7 v2 Ingestion | ER7 segment extraction | **PASS** | `RXE-2[1]`, `AL1-3[1]`, `OBX-3[1]` |
| **4** | XML / XXE Defense | Malicious entity rejection | **PASS** | `<!ENTITY>` tags detected and rejected |
| **5** | PDF Signature Check | Magic byte validation | **PASS** | `%PDF-` header enforced |
| **6** | Image Validation | Binary signature enforcement | **PASS** | PNG `\x89PNG` and JPG `\xFF\xD8\xFF` validated |
| **7** | Size Boundary Check | >25MB file rejection | **PASS** | Blocked before RAM/Storage consumption |
| **8** | Malware / Executable | Dangerous file rejection | **PASS** | Blocked `.exe` / `application/x-msdownload` |
| **9** | SHA-256 Duplication | Hash deduplication | **PASS** | Cryptographic hash collision blocked duplicate |
| **10** | Private Cloud Storage | Signed URL generation | **PASS** | Direct access denied; 300s signed URL valid |
| **11** | Provenance Persistence | Coordinate storage in DB | **PASS** | Coordinates verified in `clinical_entities` |
| **12** | Human Review Flow | Review status transition | **PASS** | Entity transitioned from `unverified` to `verified` |

---

## 3. Storage Security Audit
- Bucket `clinical-documents` verified as private (`public = false`).
- Bucket `extracted-artifacts` verified as private (`public = false`).
- Bucket `discharge-exports` verified as private (`public = false`).
- Direct HTTP requests to raw Supabase storage paths return HTTP 400/403.
- Signed URLs expire after 300 seconds and include HMAC-SHA256 signatures.
