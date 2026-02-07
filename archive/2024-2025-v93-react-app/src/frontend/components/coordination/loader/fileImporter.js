/**
 * FILE IMPORTER
 * 
 * Universal file loader that never rejects.
 * 
 * CRITICAL INVARIANTS:
 * 1. No file is ever rejected (unknown types become evidence objects)
 * 2. All imports produce deterministic hashes
 * 3. Every imported file creates a root evidence filament
 * 4. Parsing is versioned (parser changes are tracked)
 */

import { parseExcelFile } from './excelParser.js';
import { parseTextFile } from './textParser.js';
import { createBinaryEvidence } from './binaryHandler.js';
import { createEvidenceFilament } from './evidenceFilament.js';
import { createFileFilament } from '../model/fileFilamentCreator.js';

/**
 * File type categories
 */
export const FileType = {
  EXCEL: 'excel',
  TEXT: 'text',
  CODE: 'code',
  IMAGE: 'image',
  VIDEO: 'video',
  AUDIO: 'audio',
  PDF: 'pdf',
  ARCHIVE: 'archive',
  BINARY: 'binary',
  UNKNOWN: 'unknown',
};

/**
 * Detect file type from extension and MIME type
 */
export function detectFileType(file) {
  const ext = file.name.split('.').pop()?.toLowerCase();
  const mime = file.type;
  
  // Excel files
  if (
    ext === 'xlsx' ||
    ext === 'xls' ||
    ext === 'xlsm' ||
    mime === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    mime === 'application/vnd.ms-excel'
  ) {
    return FileType.EXCEL;
  }
  
  // Text files
  if (
    ext === 'txt' ||
    ext === 'md' ||
    ext === 'markdown' ||
    mime === 'text/plain' ||
    mime === 'text/markdown'
  ) {
    return FileType.TEXT;
  }
  
  // Code files
  if (
    ext === 'js' ||
    ext === 'jsx' ||
    ext === 'ts' ||
    ext === 'tsx' ||
    ext === 'py' ||
    ext === 'java' ||
    ext === 'c' ||
    ext === 'cpp' ||
    ext === 'go' ||
    ext === 'rs' ||
    ext === 'rb' ||
    ext === 'php' ||
    ext === 'html' ||
    ext === 'css' ||
    ext === 'json' ||
    ext === 'xml' ||
    ext === 'yaml' ||
    ext === 'yml' ||
    mime.startsWith('application/javascript') ||
    mime.startsWith('application/json') ||
    mime.startsWith('text/')
  ) {
    return FileType.CODE;
  }
  
  // Images
  if (
    ext === 'png' ||
    ext === 'jpg' ||
    ext === 'jpeg' ||
    ext === 'gif' ||
    ext === 'svg' ||
    ext === 'webp' ||
    mime.startsWith('image/')
  ) {
    return FileType.IMAGE;
  }
  
  // Video
  if (
    ext === 'mp4' ||
    ext === 'webm' ||
    ext === 'mov' ||
    ext === 'avi' ||
    mime.startsWith('video/')
  ) {
    return FileType.VIDEO;
  }
  
  // Audio
  if (
    ext === 'mp3' ||
    ext === 'wav' ||
    ext === 'ogg' ||
    ext === 'flac' ||
    mime.startsWith('audio/')
  ) {
    return FileType.AUDIO;
  }
  
  // PDF
  if (ext === 'pdf' || mime === 'application/pdf') {
    return FileType.PDF;
  }
  
  // Archives
  if (
    ext === 'zip' ||
    ext === 'tar' ||
    ext === 'gz' ||
    ext === 'rar' ||
    ext === '7z' ||
    mime.startsWith('application/zip') ||
    mime.startsWith('application/x-tar')
  ) {
    return FileType.ARCHIVE;
  }
  
  // Binary (executables, etc.)
  if (
    ext === 'exe' ||
    ext === 'dll' ||
    ext === 'so' ||
    ext === 'dylib' ||
    mime.startsWith('application/octet-stream')
  ) {
    return FileType.BINARY;
  }
  
  // Unknown (but still accepted)
  return FileType.UNKNOWN;
}

/**
 * Compute deterministic hash for file content
 * 
 * Uses Web Crypto API for SHA-256
 */
export async function computeFileHash(arrayBuffer) {
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Import file (universal entry point)
 * 
 * @param file File object from drag/drop or input
 * @returns ImportResult { filament, fileType, metadata }
 */
export async function importFile(file) {
  try {
    const startTime = Date.now();
    
    // 1. Detect file type
    const fileType = detectFileType(file);
    
    // 2. Read file content
    const arrayBuffer = await file.arrayBuffer();
    
    // 3. Compute deterministic hash
    const contentHash = await computeFileHash(arrayBuffer);
    
    // 4. Create base metadata
    const baseMetadata = {
      filename: file.name,
      fileType,
      size: file.size,
      contentHash,
      importedAt: Date.now(),
      parserVersion: '1.0.0', // Track parser version for replay
    };
    
    // 5. Parse based on type
    let parseResult;
    
    switch (fileType) {
      case FileType.EXCEL:
        parseResult = await parseExcelFile(arrayBuffer, baseMetadata);
        break;
        
      case FileType.TEXT:
      case FileType.CODE:
        parseResult = await parseTextFile(arrayBuffer, baseMetadata, fileType);
        break;
        
      case FileType.IMAGE:
      case FileType.VIDEO:
      case FileType.AUDIO:
      case FileType.PDF:
      case FileType.ARCHIVE:
      case FileType.BINARY:
      case FileType.UNKNOWN:
      default:
        parseResult = await createBinaryEvidence(arrayBuffer, baseMetadata, fileType);
        break;
    }
    
    // 6. Create evidence filament (always, for any file type)
    const evidenceFilament = createEvidenceFilament({
      ...baseMetadata,
      ...parseResult,
    });
    
    // 7. Create file filament if semantic extraction succeeded
    let fileFilament = null;
    if (parseResult.semanticContent) {
      fileFilament = createFileFilament({
        ...baseMetadata,
        ...parseResult,
        evidenceRef: {
          filamentId: evidenceFilament.filamentId,
          commitIndex: 0,
        },
      });
    }
    
    const importTime = Date.now() - startTime;
    
    return {
      success: true,
      evidenceFilament,
      fileFilament,
      fileType,
      metadata: {
        ...baseMetadata,
        importTime,
        hasSemanticExtraction: !!parseResult.semanticContent,
      },
    };
    
  } catch (error) {
    console.error('[FileImporter] Import failed:', error);
    
    // CRITICAL: Even on error, create a minimal evidence filament
    // (Never reject a file completely)
    try {
      const fallbackMetadata = {
        filename: file.name,
        fileType: FileType.UNKNOWN,
        size: file.size,
        contentHash: 'error-' + Date.now(),
        importedAt: Date.now(),
        parserVersion: '1.0.0',
        error: error.message,
      };
      
      const evidenceFilament = createEvidenceFilament(fallbackMetadata);
      
      return {
        success: false,
        evidenceFilament,
        fileFilament: null,
        fileType: FileType.UNKNOWN,
        metadata: fallbackMetadata,
        error: error.message,
      };
      
    } catch (fallbackError) {
      console.error('[FileImporter] Fallback failed:', fallbackError);
      throw fallbackError;
    }
  }
}

/**
 * Import multiple files (batch)
 * 
 * @param files Array of File objects
 * @returns Array of ImportResults
 */
export async function importFiles(files) {
  const results = [];
  
  for (const file of files) {
    const result = await importFile(file);
    results.push(result);
  }
  
  return results;
}

/**
 * Get import statistics
 */
export function getImportStats(results) {
  const stats = {
    total: results.length,
    success: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    withSemanticExtraction: results.filter(r => r.metadata.hasSemanticExtraction).length,
    byType: {},
  };
  
  results.forEach(result => {
    const type = result.fileType;
    stats.byType[type] = (stats.byType[type] || 0) + 1;
  });
  
  return stats;
}
