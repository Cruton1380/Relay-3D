import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

router.get('/test-channels', async (req, res) => {
  try {
    // Use demo-voting-data.json for test data
    const dataPath = path.join(__dirname, '../../../data/demo-voting-data.json');
    const data = await fs.readFile(dataPath, 'utf8');
    res.json(JSON.parse(data));
  } catch (error) {
    console.error('Error reading test data:', error);
    res.status(500).json({ error: 'Failed to load test data' });
  }
});

export default router; 
