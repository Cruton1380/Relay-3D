/**
 * EVIDENCE FILAMENT CREATOR
 * 
 * Creates evidence filaments for imported files.
 * 
 * CRITICAL: Evidence filaments are the root of truth for all imported data.
 * Even if semantic extraction fails, the evidence filament preserves the raw content.
 */

import { Filament, Commit } from '../model/coordinationGraphModel.js';

/**
 * Create evidence filament for imported file
 * 
 * @param metadata File metadata + parse result
 * @returns Filament
 */
export function createEvidenceFilament(metadata) {
  const filamentId = `evidence.${sanitizeFilename(metadata.filename)}.${metadata.contentHash.slice(0, 8)}`;
  
  const commits = [
    new Commit({
      filamentId,
      commitIndex: 0,
      ts: metadata.importedAt,
      actor: { kind: 'system', id: 'file-importer' },
      op: 'EVIDENCE_CREATED',
      locus: null,
      refs: {
        inputs: [],
        evidence: [],
      },
      payload: {
        filename: metadata.filename,
        fileType: metadata.fileType,
        size: metadata.size,
        contentHash: metadata.contentHash,
        parserVersion: metadata.parserVersion,
        importedAt: metadata.importedAt,
        error: metadata.error || null,
      },
      tLevel: 'T2', // Evidence is audit-level (T2)
    }),
  ];
  
  // Add semantic extraction commit if available
  if (metadata.semanticContent) {
    commits.push(
      new Commit({
        filamentId,
        commitIndex: 1,
        ts: metadata.importedAt + 1,
        actor: { kind: 'system', id: 'file-parser' },
        op: 'SEMANTIC_EXTRACTION',
        locus: null,
        refs: {
          inputs: [{ filamentId, commitIndex: 0 }],
          evidence: [],
        },
        payload: {
          extractionType: metadata.fileType,
          extractedFields: Object.keys(metadata.semanticContent),
          summary: metadata.summary || null,
        },
        tLevel: 'T1', // Extracted content is user-level (T1)
      })
    );
  }
  
  return new Filament(filamentId, 'evidence', commits);
}

/**
 * Sanitize filename for filament ID
 */
function sanitizeFilename(filename) {
  return filename
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}
