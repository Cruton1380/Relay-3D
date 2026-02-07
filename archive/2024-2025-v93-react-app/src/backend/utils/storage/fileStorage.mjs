/**
 * File storage utilities
 */
import { promises as fs } from 'fs';
import path from 'path';

/**
 * Ensures a directory exists, creating it if necessary
 * @param {string} dirPath - Directory path
 * @returns {Promise<boolean>} True if successful
 */
export async function ensureDirectory(dirPath) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
    return true;
  } catch (error) {
    console.error(`Error creating directory ${dirPath}:`, error);
    return false;
  }
}

/**
 * Reads JSON data from a file
 * @param {string} filePath - Path to the JSON file
 * @param {object} defaultValue - Default value if file doesn't exist
 * @returns {Promise<object>} Parsed JSON data
 */
export async function readJsonFile(filePath, defaultValue = {}) {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      // File doesn't exist, return default value
      return defaultValue;
    }
    console.error(`Error reading JSON file ${filePath}:`, error);
    throw error;
  }
}

/**
 * Writes JSON data to a file
 * @param {string} filePath - Path to the JSON file
 * @param {object} data - Data to write
 * @param {boolean} pretty - Whether to format the JSON
 * @returns {Promise<boolean>} True if successful
 */
export async function writeJsonFile(filePath, data, pretty = false) {
  try {
    await ensureDirectory(path.dirname(filePath));
    const jsonString = pretty 
      ? JSON.stringify(data, null, 2) 
      : JSON.stringify(data);
    await fs.writeFile(filePath, jsonString, 'utf8');
    return true;
  } catch (error) {
    console.error(`Error writing JSON file ${filePath}:`, error);
    return false;
  }
}

/**
 * Appends a line to a file (useful for logs or JSONL files)
 * @param {string} filePath - Path to the file
 * @param {string|object} data - Data to append (objects will be stringified)
 * @returns {Promise<boolean>} True if successful
 */
export async function appendToFile(filePath, data) {
  try {
    await ensureDirectory(path.dirname(filePath));
    const line = typeof data === 'string' 
      ? data 
      : JSON.stringify(data);
    await fs.appendFile(filePath, line + '\n', 'utf8');
    return true;
  } catch (error) {
    console.error(`Error appending to file ${filePath}:`, error);
    return false;
  }
}

/**
 * Streams a file from one location to another
 * @param {string} sourcePath - Source file path
 * @param {string} destinationPath - Destination file path
 * @returns {Promise<boolean>} True if successful
 */
export async function streamFile(sourcePath, destinationPath) {
  try {
    await ensureDirectory(path.dirname(destinationPath));
    const source = createReadStream(sourcePath);
    const destination = createWriteStream(destinationPath);
    await pipeline(source, destination);
    return true;
  } catch (error) {
    console.error('Error streaming file', error);
    return false;
  }
}

// Check if a file exists
export async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

// Read file content
export async function readFile(filePath, encoding = 'utf8') {
  try {
    return await fs.readFile(filePath, encoding);
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    throw error;
  }
}

// Write content to file
export async function writeFile(filePath, content) {
  try {
    // Ensure directory exists
    const dir = path.dirname(filePath);
    await ensureDir(dir);
    
    // Write the file
    await fs.writeFile(filePath, content);
    return true;
  } catch (error) {
    console.error(`Error writing file ${filePath}:`, error);
    throw error;
  }
}

// Ensure a directory exists
export async function ensureDir(dirPath) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
    return true;
  } catch (error) {
    if (error.code === 'EEXIST') return true;
    console.error(`Error creating directory ${dirPath}:`, error);
    throw error;
  }
}

// Delete a file
export async function deleteFile(filePath) {
  try {
    await fs.unlink(filePath);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') return true; // File doesn't exist, which is fine
    console.error(`Error deleting file ${filePath}:`, error);
    throw error;
  }
}

// List files in a directory
export async function listFiles(dirPath, options = {}) {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    
    if (options.filesOnly) {
      return entries.filter(entry => entry.isFile()).map(entry => entry.name);
    }
    
    return entries.map(entry => ({
      name: entry.name,
      isDirectory: entry.isDirectory(),
      isFile: entry.isFile()
    }));
  } catch (error) {
    console.error(`Error listing files in ${dirPath}:`, error);
    throw error;
  }
}

/**
 * Safely reads JSON from a file with error handling and default values
 * @param {string} filePath - Path to the JSON file
 * @param {object} defaultValue - Default value if file doesn't exist or is invalid
 * @returns {Promise<object>} Parsed JSON data or default value
 */
export async function safeReadJSON(filePath, defaultValue = {}) {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return defaultValue;
    }
    console.error(`Error reading JSON file ${filePath}:`, error);
    return defaultValue;
  }
}

/**
 * Safely writes JSON to a file with error handling
 * @param {string} filePath - Path to write the JSON file
 * @param {object} data - Data to write as JSON
 * @returns {Promise<boolean>} True if successful
 */
export async function safeWriteJSON(filePath, data) {
  try {
    await ensureDirectory(path.dirname(filePath));
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error(`Error writing JSON file ${filePath}:`, error);
    throw error;
  }
}

// Data directory configuration
const DATA_DIR = process.env.DATA_DIR || './data';

/**
 * Gets the full path for a data file
 * @param {string} filename - Name of the data file
 * @returns {string} Full path to the data file
 */
export function getDataFilePath(filename) {
  return path.join(DATA_DIR, filename);
}

// Export fileUtils object for compatibility
export const fileUtils = {
  ensureDirectory,
  ensureDir,
  readJsonFile,
  writeJsonFile,
  safeReadJSON,
  safeWriteJSON,
  deleteFile,
  listFiles
};
