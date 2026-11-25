# API Reference — Document Ingestion & Storage
**Phase 05 API Specification**
**Team:** Unknown GenZ

---

## Server Actions (`src/lib/actions/document-actions.ts`)

### 1. `uploadClinicalDocumentAction(formData: FormData): Promise<DocumentUploadResponse>`
Ingests a single file with validation, duplicate detection, storage persistence, parsing, and entity extraction.
- **Form Data Fields**:
  - `file`: `File` (Binary document)
  - `documentType`: `DocumentType` (`discharge_summary`, `progress_note`, etc.)
  - `title`: `string` (Optional custom document name)
  - `patientId`: `string` (UUID of the patient)
- **Response**:
  ```typescript
  {
    success: boolean;
    documentId?: string;
    versionNumber?: number;
    sha256Hash?: string;
    title?: string;
    entityCount?: number;
    error?: string;
  }
  ```

### 2. `listClinicalDocumentsAction(): Promise<{ documents: DocumentListItem[] }>`
Retrieves all documents for the current authenticated user's organization with version number and entity counts.

### 3. `getDocumentDetailsAction(documentId: string): Promise<DocumentDetailResult>`
Fetches complete document metadata, current version SHA-256 hash, short-lived signed URL (300s TTL), and all extracted clinical entities.

### 4. `reviewEntityAction(entityId: string, status: "verified" | "rejected" | "clarification_needed", notes?: string): Promise<{ success: boolean }>`
Transitions an extracted entity's clinical review status and registers audit provenance.

### 5. `deleteClinicalDocumentAction(documentId: string): Promise<{ success: boolean }>`
Deletes a document from the database and removes all physical files from `clinical-documents` private storage.
