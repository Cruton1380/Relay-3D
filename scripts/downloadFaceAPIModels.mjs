/**
 * Script to download face-api.js models for biometric feature extraction
 */
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MODEL_BASE_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';
const MODEL_DIR = path.join(process.cwd(), 'public', 'models');

// Required models and their files
const REQUIRED_MODELS = {
  'face_recognition_model': [
    'face_recognition_model-shard1',
    'face_recognition_model-shard2', 
    'face_recognition_model-weights_manifest.json'
  ],
  'age_gender_model': [
    'age_gender_model-shard1',
    'age_gender_model-weights_manifest.json'
  ],
  'face_expression_model': [
    'face_expression_model-shard1',
    'face_expression_model-weights_manifest.json'
  ]
};

/**
 * Download a file from URL
 */
async function downloadFile(url, outputPath) {
  try {
    console.log(`Downloading ${url}...`);
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    await fs.writeFile(outputPath, buffer);
    console.log(`✓ Downloaded: ${path.basename(outputPath)}`);
  } catch (error) {
    console.error(`✗ Failed to download ${url}: ${error.message}`);
    throw error;
  }
}

/**
 * Download all required models
 */
async function downloadModels() {
  try {
    // Ensure models directory exists
    await fs.mkdir(MODEL_DIR, { recursive: true });
    console.log(`Models directory: ${MODEL_DIR}`);
    
    // Check existing files
    const existingFiles = await fs.readdir(MODEL_DIR);
    console.log(`Existing model files: ${existingFiles.length}`);
    
    let downloadedCount = 0;
    let skippedCount = 0;
    
    for (const [modelName, files] of Object.entries(REQUIRED_MODELS)) {
      console.log(`\n--- Processing ${modelName} ---`);
      
      for (const filename of files) {
        const outputPath = path.join(MODEL_DIR, filename);
        
        // Check if file already exists
        try {
          await fs.access(outputPath);
          console.log(`⚡ Already exists: ${filename}`);
          skippedCount++;
          continue;
        } catch {
          // File doesn't exist, download it
        }
        
        const url = `${MODEL_BASE_URL}/${filename}`;
        await downloadFile(url, outputPath);
        downloadedCount++;
        
        // Add small delay between downloads
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    console.log(`\n--- Download Summary ---`);
    console.log(`Downloaded: ${downloadedCount} files`);
    console.log(`Skipped: ${skippedCount} files`);
    console.log(`Total model files: ${downloadedCount + skippedCount}`);
    
    // Verify all required files are present
    const finalFiles = await fs.readdir(MODEL_DIR);
    const allRequired = Object.values(REQUIRED_MODELS).flat();
    const missing = allRequired.filter(file => !finalFiles.includes(file));
    
    if (missing.length === 0) {
      console.log(`\n✅ All required face-api.js models are ready!`);
    } else {
      console.log(`\n⚠️  Missing models: ${missing.join(', ')}`);
    }
    
  } catch (error) {
    console.error(`\n❌ Model download failed: ${error.message}`);
    process.exit(1);
  }
}

// Run if called directly
const isMainModule = import.meta.url === new URL(process.argv[1], 'file://').href;
if (isMainModule) {
  console.log('🚀 Starting face-api.js model download...\n');
  downloadModels().catch(console.error);
}

export { downloadModels };
