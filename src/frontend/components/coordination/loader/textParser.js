/**
 * TEXT PARSER
 * 
 * Parses text and code files.
 * 
 * CRITICAL: Preserves exact content with line-by-line addressing.
 */

/**
 * Parse text/code file
 * 
 * @param arrayBuffer File content
 * @param baseMetadata Base file metadata
 * @param fileType FileType enum value
 * @returns ParseResult
 */
export async function parseTextFile(arrayBuffer, baseMetadata, fileType) {
  try {
    // 1. Decode text content
    const decoder = new TextDecoder('utf-8');
    const text = decoder.decode(arrayBuffer);
    
    // 2. Split into lines (preserving line numbers for addressing)
    const lines = text.split('\n');
    
    // 3. Create line→locus mappings
    const lineMappings = lines.map((content, index) => ({
      lineNumber: index + 1,
      content,
      // Placeholder for locus mapping (can be filled when user selects a line):
      mappedFilamentId: null,
      mappedCommitIndex: null,
    }));
    
    // 4. Extract basic statistics
    const summary = {
      lineCount: lines.length,
      characterCount: text.length,
      nonEmptyLines: lines.filter(line => line.trim().length > 0).length,
      language: detectLanguage(baseMetadata.filename, fileType),
    };
    
    return {
      semanticContent: {
        text,
        lines,
        lineMappings,
        language: summary.language,
      },
      summary,
    };
    
  } catch (error) {
    console.error('[TextParser] Parse failed:', error);
    
    // Return minimal evidence (no semantic extraction)
    return {
      semanticContent: null,
      summary: null,
      error: error.message,
    };
  }
}

/**
 * Detect programming language from filename
 */
function detectLanguage(filename, fileType) {
  const ext = filename.split('.').pop()?.toLowerCase();
  
  const languageMap = {
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    py: 'python',
    java: 'java',
    c: 'c',
    cpp: 'cpp',
    h: 'c',
    hpp: 'cpp',
    go: 'go',
    rs: 'rust',
    rb: 'ruby',
    php: 'php',
    html: 'html',
    css: 'css',
    json: 'json',
    xml: 'xml',
    yaml: 'yaml',
    yml: 'yaml',
    md: 'markdown',
    txt: 'plaintext',
  };
  
  return languageMap[ext] || 'plaintext';
}

/**
 * Get line content by line number
 */
export function getLineContent(semanticContent, lineNumber) {
  if (!semanticContent?.lines) return null;
  
  // Lines are 1-indexed
  return semanticContent.lines[lineNumber - 1] || null;
}

/**
 * Map line to filament endpoint
 */
export function mapLineToFilament(lineMappings, lineNumber, filamentId, commitIndex) {
  const mapping = lineMappings.find(m => m.lineNumber === lineNumber);
  
  if (!mapping) {
    throw new Error(`Line mapping not found: line ${lineNumber}`);
  }
  
  mapping.mappedFilamentId = filamentId;
  mapping.mappedCommitIndex = commitIndex;
  
  return mapping;
}
