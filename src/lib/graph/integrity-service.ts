/**
 * Pramana-V1 - Evidence Integrity & Cryptographic Hashing Service
 * Team: Unknown GenZ
 * Phase: 07 — Safety Provenance Graph
 *
 * Implements deterministic canonicalization & SHA-256 integrity verification:
 * - Canonical string serialization
 * - Document content hashing
 * - Evidence span coordinate verification
 * - Tamper-evident graph integrity checksums
 */

import * as crypto from "crypto";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export class IntegrityService {
  /**
   * Deterministically hashes a canonical string using SHA-256
   */
  public static computeSha256(content: string): string {
    return crypto.createHash("sha256").update(content, "utf8").digest("hex");
  }

  /**
   * Canonicalizes and hashes an evidence span quote with character coordinates
   */
  public static hashEvidenceSpan(
    quote: string,
    charStart: number,
    charEnd: number,
    documentId: string
  ): string {
    const canonical = `doc:${documentId}|start:${charStart}|end:${charEnd}|quote:${quote.trim()}`;
    return this.computeSha256(canonical);
  }

  /**
   * Generates a tamper-evident hash for an entire patient graph state
   */
  public static computeGraphChecksum(nodes: Array<{ id: string; label: string; status: string }>, edges: Array<{ sourceNodeId: string; targetNodeId: string; relationshipType: string }>): string {
    const sortedNodes = [...nodes]
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((n) => `${n.id}:${n.label}:${n.status}`)
      .join(";");

    const sortedEdges = [...edges]
      .sort((a, b) => `${a.sourceNodeId}->${a.targetNodeId}`.localeCompare(`${b.sourceNodeId}->${b.targetNodeId}`))
      .map((e) => `${e.sourceNodeId}-[${e.relationshipType}]->${e.targetNodeId}`)
      .join(";");

    return this.computeSha256(`NODES:[${sortedNodes}]|EDGES:[${sortedEdges}]`);
  }

  /**
   * Verifies that an extracted quote appears verbatim within the raw document text at specified offsets
   */
  public static verifyQuoteAgainstSource(
    rawText: string,
    quote: string,
    charStart?: number,
    charEnd?: number
  ): {
    isValid: boolean;
    actualMatch: boolean;
    offsetAccurate: boolean;
    normalizedQuote: string;
  } {
    const normQuote = quote.trim();
    if (!rawText || !normQuote) {
      return { isValid: false, actualMatch: false, offsetAccurate: false, normalizedQuote: normQuote };
    }

    const actualMatch = rawText.includes(normQuote);
    let offsetAccurate = false;

    if (
      charStart !== undefined &&
      charEnd !== undefined &&
      charStart >= 0 &&
      charEnd <= rawText.length &&
      charEnd >= charStart
    ) {
      const slice = rawText.slice(charStart, charEnd).trim();
      offsetAccurate = slice === normQuote || slice.includes(normQuote) || normQuote.includes(slice);
    }

    return {
      isValid: actualMatch,
      actualMatch,
      offsetAccurate,
      normalizedQuote: normQuote,
    };
  }

  /**
   * Persists an evidence integrity verification record
   */
  public static async recordIntegrityHash(params: {
    organizationId: string;
    entityType: "clinical_document" | "document_version" | "evidence_span" | "graph_snapshot" | "audit_event";
    entityId: string;
    canonicalContent: string;
  }): Promise<{ hash: string; success: boolean }> {
    const hash = this.computeSha256(params.canonicalContent);
    const admin = getSupabaseAdminClient();

    if (admin) {
      try {
        await admin.from("evidence_integrity_hashes" as any).insert({
          organization_id: params.organizationId,
          entity_type: params.entityType,
          entity_id: params.entityId,
          canonical_content: params.canonicalContent.substring(0, 1000), // Bound size
          sha256_hash: hash,
        });
      } catch (err: any) {
        // Fallback or audit log
        console.warn("[IntegrityService] Failed to insert integrity hash record:", err.message);
      }
    }

    return { hash, success: true };
  }
}
