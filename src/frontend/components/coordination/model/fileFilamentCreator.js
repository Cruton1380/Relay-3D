/**
 * FILE FILAMENT CREATOR
 * 
 * Creates file filaments for imported files with semantic extraction.
 * 
 * CRITICAL: File filaments are only created when semantic extraction succeeds.
 * Otherwise, only evidence filament exists.
 */

import { Filament, Commit } from './coordinationGraphModel.js';

/**
 * Create file filament for imported file
 * 
 * @param metadata File metadata + parse result
 * @returns Filament
 */
export function createFileFilament(metadata) {
  const fileId = sanitizeFilename(metadata.filename);
  const filamentId = `file.${fileId}`;
  
  const commits = [
    new Commit({
      filamentId,
      commitIndex: 0,
      ts: metadata.importedAt,
      actor: { kind: 'system', id: 'file-importer' },
      op: 'FILE_CREATED',
      locus: null,
      refs: {
        inputs: [],
        evidence: [
          {
            filamentId: metadata.evidenceRef.filamentId,
            commitIndex: metadata.evidenceRef.commitIndex,
          },
        ],
      },
      payload: {
        filename: metadata.filename,
        fileType: metadata.fileType,
        contentHash: metadata.contentHash,
        importedAt: metadata.importedAt,
      },
      tLevel: 'T1', // File is user-level (T1)
    }),
  ];
  
  return new Filament(filamentId, 'file', commits);
}

/**
 * Sanitize filename for filament ID
 */
function sanitizeFilename(filename) {
  // Remove extension and sanitize
  const nameWithoutExt = filename.replace(/\.[^.]+$/, '');
  return nameWithoutExt
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}
