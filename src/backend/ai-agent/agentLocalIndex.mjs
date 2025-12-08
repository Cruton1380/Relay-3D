// backend/ai-agent/agentLocalIndex.mjs
/**
 * Local Semantic Index - Vector database for Relay codebase indexing
 * Provides semantic search over code, documentation, and schemas
 */

import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import logger from '../utils/logging/logger.mjs';

const indexLogger = logger.child({ module: 'ai-agent-local-index' });

/**
 * Local semantic index using vector embeddings
 */
export class AgentLocalIndex {
  constructor(options = {}) {
    this.baseDir = options.baseDir || path.join(process.cwd(), 'data', 'ai-agent');
    this.indexPath = path.join(this.baseDir, 'semantic-index');
    this.embeddingsPath = path.join(this.indexPath, 'embeddings.json');
    this.metadataPath = path.join(this.indexPath, 'metadata.json');
    this.codebasePath = options.codebasePath || process.cwd();
    
    this.embeddings = new Map();
    this.metadata = new Map();
    this.isInitialized = false;
    
    this.initialize();
  }

  /**
   * Initialize the semantic index
   */
  async initialize() {
    try {
      await fs.mkdir(this.indexPath, { recursive: true });
      
      // Load existing embeddings and metadata
      await this.loadIndex();
      
      this.isInitialized = true;
      indexLogger.info('Semantic index initialized', {
        embeddingsCount: this.embeddings.size,
        metadataCount: this.metadata.size
      });
    } catch (error) {
      indexLogger.error('Failed to initialize semantic index', { error });
      throw error;
    }
  }

  /**
   * Load existing index data
   */
  async loadIndex() {
    try {
      // Load embeddings
      try {
        const embeddingsContent = await fs.readFile(this.embeddingsPath, 'utf8');
        const embeddingsData = JSON.parse(embeddingsContent);
        this.embeddings = new Map(Object.entries(embeddingsData));
      } catch (error) {
        if (error.code !== 'ENOENT') {
          indexLogger.warn('Failed to load embeddings', { error });
        }
      }

      // Load metadata
      try {
        const metadataContent = await fs.readFile(this.metadataPath, 'utf8');
        const metadataData = JSON.parse(metadataContent);
        this.metadata = new Map(Object.entries(metadataData));
      } catch (error) {
        if (error.code !== 'ENOENT') {
          indexLogger.warn('Failed to load metadata', { error });
        }
      }
    } catch (error) {
      indexLogger.error('Failed to load index', { error });
    }
  }

  /**
   * Save index to disk
   */
  async saveIndex() {
    try {
      // Save embeddings
      const embeddingsData = Object.fromEntries(this.embeddings);
      await fs.writeFile(this.embeddingsPath, JSON.stringify(embeddingsData, null, 2));

      // Save metadata
      const metadataData = Object.fromEntries(this.metadata);
      await fs.writeFile(this.metadataPath, JSON.stringify(metadataData, null, 2));

      indexLogger.debug('Index saved to disk');
    } catch (error) {
      indexLogger.error('Failed to save index', { error });
      throw error;
    }
  }

  /**
   * Index the entire Relay codebase
   */
  async indexCodebase() {
    try {
      indexLogger.info('Starting codebase indexing', { path: this.codebasePath });

      const filesToIndex = await this.findIndexableFiles();
      let indexedCount = 0;

      for (const filePath of filesToIndex) {
        try {
          await this.indexFile(filePath);
          indexedCount++;
          
          if (indexedCount % 10 === 0) {
            indexLogger.info('Indexing progress', { indexed: indexedCount, total: filesToIndex.length });
          }
        } catch (error) {
          indexLogger.warn('Failed to index file', { filePath, error });
        }
      }

      await this.saveIndex();
      
      indexLogger.info('Codebase indexing completed', {
        totalFiles: filesToIndex.length,
        indexed: indexedCount,
        embeddings: this.embeddings.size
      });

      return {
        totalFiles: filesToIndex.length,
        indexed: indexedCount,
        success: true
      };
    } catch (error) {
      indexLogger.error('Codebase indexing failed', { error });
      throw error;
    }
  }

  /**
   * Find all files that should be indexed
   */
  async findIndexableFiles() {
    const indexableFiles = [];
    const extensions = ['.mjs', '.js', '.ts', '.md', '.json', '.sql', '.yaml', '.yml'];
    const ignoreDirs = ['node_modules', '.git', 'dist', 'build', 'coverage'];

    const walkDir = async (dir) => {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          
          if (entry.isDirectory()) {
            if (!ignoreDirs.includes(entry.name)) {
              await walkDir(fullPath);
            }
          } else if (entry.isFile()) {
            const ext = path.extname(entry.name);
            if (extensions.includes(ext)) {
              indexableFiles.push(fullPath);
            }
          }
        }
      } catch (error) {
        indexLogger.warn('Failed to walk directory', { dir, error });
      }
    };

    await walkDir(this.codebasePath);
    return indexableFiles;
  }

  /**
   * Index a single file
   */
  async indexFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const relativePath = path.relative(this.codebasePath, filePath);
      
      // Generate file hash for change detection
      const fileHash = crypto.createHash('sha256').update(content).digest('hex');
      const fileId = this.generateFileId(relativePath);

      // Check if file has changed
      const existingMetadata = this.metadata.get(fileId);
      if (existingMetadata && existingMetadata.hash === fileHash) {
        return; // File unchanged, skip indexing
      }

      // Extract meaningful chunks from the file
      const chunks = this.extractChunks(content, relativePath);
      
      // Generate embeddings for each chunk
      const chunkEmbeddings = [];
      for (const chunk of chunks) {
        const embedding = await this.generateEmbedding(chunk.content);
        chunkEmbeddings.push({
          ...chunk,
          embedding,
          id: this.generateChunkId(fileId, chunk.index)
        });
      }

      // Store embeddings
      for (const chunkEmb of chunkEmbeddings) {
        this.embeddings.set(chunkEmb.id, chunkEmb.embedding);
      }

      // Store metadata
      this.metadata.set(fileId, {
        filePath: relativePath,
        absolutePath: filePath,
        hash: fileHash,
        indexed: new Date().toISOString(),
        chunks: chunkEmbeddings.map(c => ({
          id: c.id,
          index: c.index,
          startLine: c.startLine,
          endLine: c.endLine,
          type: c.type,
          summary: c.summary
        })),
        fileType: this.detectFileType(relativePath),
        size: content.length
      });

      indexLogger.debug('File indexed', { 
        relativePath, 
        chunks: chunks.length,
        size: content.length 
      });
    } catch (error) {
      indexLogger.error('Failed to index file', { filePath, error });
      throw error;
    }
  }

  /**
   * Extract meaningful chunks from file content
   */
  extractChunks(content, filePath) {
    const chunks = [];
    const lines = content.split('\n');
    const fileType = this.detectFileType(filePath);

    if (fileType === 'javascript' || fileType === 'typescript') {
      // Extract functions, classes, and exports
      chunks.push(...this.extractJavaScriptChunks(lines));
    } else if (fileType === 'markdown') {
      // Extract sections by headers
      chunks.push(...this.extractMarkdownChunks(lines));
    } else if (fileType === 'json') {
      // Extract top-level objects
      chunks.push(...this.extractJSONChunks(content));
    } else {
      // Generic chunking by paragraphs/blocks
      chunks.push(...this.extractGenericChunks(lines));
    }

    return chunks.map((chunk, index) => ({
      ...chunk,
      index,
      filePath
    }));
  }

  /**
   * Extract JavaScript/TypeScript code chunks
   */
  extractJavaScriptChunks(lines) {
    const chunks = [];
    let currentChunk = null;
    let braceDepth = 0;
    let inFunction = false;
    let inClass = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Detect function/class/export starts
      if (trimmed.match(/^(export\s+)?(function|class|const\s+\w+\s*=|async\s+function)/)) {
        if (currentChunk) {
          chunks.push(currentChunk);
        }
        
        currentChunk = {
          startLine: i + 1,
          content: line + '\n',
          type: trimmed.includes('class') ? 'class' : 'function',
          summary: trimmed.substring(0, 100)
        };
        
        inFunction = !trimmed.includes('class');
        inClass = trimmed.includes('class');
      }

      // Track brace depth
      braceDepth += (line.match(/\{/g) || []).length;
      braceDepth -= (line.match(/\}/g) || []).length;

      if (currentChunk) {
        currentChunk.content += line + '\n';
        
        // End chunk when braces close
        if (braceDepth === 0 && (inFunction || inClass)) {
          currentChunk.endLine = i + 1;
          chunks.push(currentChunk);
          currentChunk = null;
          inFunction = false;
          inClass = false;
        }
      }

      // Extract comments and JSDoc
      if (trimmed.startsWith('/**') || trimmed.startsWith('//')) {
        chunks.push({
          startLine: i + 1,
          endLine: i + 1,
          content: line,
          type: 'comment',
          summary: trimmed.substring(0, 100)
        });
      }
    }

    if (currentChunk) {
      currentChunk.endLine = lines.length;
      chunks.push(currentChunk);
    }

    return chunks;
  }

  /**
   * Extract Markdown sections
   */
  extractMarkdownChunks(lines) {
    const chunks = [];
    let currentChunk = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Detect headers
      if (trimmed.match(/^#{1,6}\s+/)) {
        if (currentChunk) {
          currentChunk.endLine = i;
          chunks.push(currentChunk);
        }

        currentChunk = {
          startLine: i + 1,
          content: line + '\n',
          type: 'section',
          summary: trimmed.replace(/^#+\s*/, '')
        };
      } else if (currentChunk) {
        currentChunk.content += line + '\n';
      }
    }

    if (currentChunk) {
      currentChunk.endLine = lines.length;
      chunks.push(currentChunk);
    }

    return chunks;
  }

  /**
   * Extract JSON object chunks
   */
  extractJSONChunks(content) {
    try {
      const data = JSON.parse(content);
      const chunks = [];

      if (typeof data === 'object' && data !== null) {
        Object.entries(data).forEach(([key, value], index) => {
          chunks.push({
            startLine: 1,
            endLine: 1,
            content: JSON.stringify({ [key]: value }, null, 2),
            type: 'json-object',
            summary: `${key}: ${typeof value}`
          });
        });
      }

      return chunks;
    } catch (error) {
      return [{
        startLine: 1,
        endLine: 1,
        content: content.substring(0, 1000),
        type: 'json-invalid',
        summary: 'Invalid JSON content'
      }];
    }
  }

  /**
   * Extract generic text chunks
   */
  extractGenericChunks(lines) {
    const chunks = [];
    let currentChunk = null;
    const chunkSize = 50; // lines per chunk

    for (let i = 0; i < lines.length; i += chunkSize) {
      const chunkLines = lines.slice(i, i + chunkSize);
      chunks.push({
        startLine: i + 1,
        endLine: Math.min(i + chunkSize, lines.length),
        content: chunkLines.join('\n'),
        type: 'text-block',
        summary: chunkLines[0]?.trim().substring(0, 100) || 'Text block'
      });
    }

    return chunks;
  }

  /**
   * Generate embedding for text content (mock implementation)
   */
  async generateEmbedding(text) {
    // In production, this would call an embedding model like:
    // - OpenAI text-embedding-ada-002
    // - Sentence Transformers
    // - Local embedding model via Ollama
    
    // For now, return a mock embedding based on text hash
    const hash = crypto.createHash('sha256').update(text).digest();
    const embedding = Array.from(hash.slice(0, 384)).map(byte => (byte - 128) / 128);
    
    return embedding;
  }

  /**
   * Search the index semantically
   */
  async search(query, options = {}) {
    try {
      const { limit = 10, fileTypes = [], minScore = 0.7 } = options;
      
      // Generate embedding for query
      const queryEmbedding = await this.generateEmbedding(query);
      
      // Calculate similarities
      const results = [];
      
      for (const [chunkId, embedding] of this.embeddings) {
        const similarity = this.cosineSimilarity(queryEmbedding, embedding);
        
        if (similarity >= minScore) {
          const metadata = this.getChunkMetadata(chunkId);
          if (metadata && (!fileTypes.length || fileTypes.includes(metadata.fileType))) {
            results.push({
              chunkId,
              similarity,
              ...metadata
            });
          }
        }
      }

      // Sort by similarity and limit results
      results.sort((a, b) => b.similarity - a.similarity);
      const limitedResults = results.slice(0, limit);

      indexLogger.debug('Search completed', {
        query: query.substring(0, 50),
        totalResults: results.length,
        returnedResults: limitedResults.length
      });

      return {
        query,
        results: limitedResults,
        totalFound: results.length
      };
    } catch (error) {
      indexLogger.error('Search failed', { query, error });
      throw error;
    }
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  cosineSimilarity(a, b) {
    if (a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    if (normA === 0 || normB === 0) return 0;
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Get metadata for a chunk
   */
  getChunkMetadata(chunkId) {
    const fileId = chunkId.split(':')[0];
    const chunkIndex = parseInt(chunkId.split(':')[1]);
    
    const fileMetadata = this.metadata.get(fileId);
    if (!fileMetadata) return null;
    
    const chunkMetadata = fileMetadata.chunks.find(c => c.index === chunkIndex);
    if (!chunkMetadata) return null;
    
    return {
      ...chunkMetadata,
      filePath: fileMetadata.filePath,
      absolutePath: fileMetadata.absolutePath,
      fileType: fileMetadata.fileType
    };
  }

  /**
   * Detect file type from path
   */
  detectFileType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    
    if (['.mjs', '.js'].includes(ext)) return 'javascript';
    if (['.ts', '.tsx'].includes(ext)) return 'typescript';
    if (ext === '.md') return 'markdown';
    if (ext === '.json') return 'json';
    if (['.yaml', '.yml'].includes(ext)) return 'yaml';
    if (ext === '.sql') return 'sql';
    
    return 'text';
  }

  /**
   * Generate file ID from path
   */
  generateFileId(relativePath) {
    return crypto.createHash('sha256')
      .update(relativePath)
      .digest('hex')
      .substring(0, 16);
  }

  /**
   * Generate chunk ID
   */
  generateChunkId(fileId, chunkIndex) {
    return `${fileId}:${chunkIndex}`;
  }

  /**
   * Get index statistics
   */
  getStats() {
    return {
      totalFiles: this.metadata.size,
      totalChunks: this.embeddings.size,
      indexSize: JSON.stringify(Object.fromEntries(this.embeddings)).length,
      lastUpdated: new Date().toISOString()
    };
  }
}

export default AgentLocalIndex;
