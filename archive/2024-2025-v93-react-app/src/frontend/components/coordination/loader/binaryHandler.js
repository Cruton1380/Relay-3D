/**
 * BINARY HANDLER
 * 
 * Handles files without semantic extraction.
 * 
 * CRITICAL: No file is rejected. Unknown types become evidence objects.
 */

/**
 * Create binary evidence (no semantic extraction)
 * 
 * @param arrayBuffer File content
 * @param baseMetadata Base file metadata
 * @param fileType FileType enum value
 * @returns ParseResult
 */
export async function createBinaryEvidence(arrayBuffer, baseMetadata, fileType) {
  try {
    // For binary/unknown files, we store minimal metadata only
    // The raw content is referenced but not extracted
    
    const summary = {
      size: arrayBuffer.byteLength,
      type: fileType,
      note: 'Binary file stored as evidence without semantic extraction',
    };
    
    return {
      semanticContent: null, // No semantic extraction for binary/unknown
      summary,
    };
    
  } catch (error) {
    console.error('[BinaryHandler] Failed:', error);
    
    return {
      semanticContent: null,
      summary: null,
      error: error.message,
    };
  }
}

/**
 * Check if file type supports semantic extraction
 */
export function supportsSemanticExtraction(fileType) {
  const supportedTypes = ['excel', 'text', 'code'];
  return supportedTypes.includes(fileType);
}
