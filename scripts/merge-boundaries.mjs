/**
 * Merge all country boundary GeoJSON files into a single FeatureCollection.
 * Run once: node scripts/merge-boundaries.mjs
 * Output: data/boundaries/all-countries.geojson
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const countriesDir = path.resolve(__dirname, '..', 'data', 'boundaries', 'countries');
const outFile = path.resolve(__dirname, '..', 'data', 'boundaries', 'all-countries.geojson');

async function merge() {
    const files = (await fs.readdir(countriesDir)).filter(f => f.endsWith('.geojson'));
    console.log(`Merging ${files.length} country files...`);

    const allFeatures = [];
    let skipped = 0;

    for (const file of files) {
        try {
            const raw = await fs.readFile(path.join(countriesDir, file), 'utf-8');
            const geojson = JSON.parse(raw);

            const normalize = (props) => {
                props._src = file.replace('.geojson', '');
                if (!props.shapeISO && props.shapeGroup) props.shapeISO = props.shapeGroup;
            };

            if (geojson.type === 'FeatureCollection' && geojson.features) {
                for (const f of geojson.features) {
                    f.properties = f.properties || {};
                    normalize(f.properties);
                }
                allFeatures.push(...geojson.features);
            } else if (geojson.type === 'Feature') {
                geojson.properties = geojson.properties || {};
                normalize(geojson.properties);
                allFeatures.push(geojson);
            }
        } catch (e) {
            console.warn(`  SKIP ${file}: ${e.message}`);
            skipped++;
        }
    }

    const merged = {
        type: 'FeatureCollection',
        features: allFeatures,
    };

    await fs.writeFile(outFile, JSON.stringify(merged));
    const sizeMB = (Buffer.byteLength(JSON.stringify(merged)) / 1024 / 1024).toFixed(1);
    console.log(`Done: ${allFeatures.length} features, ${sizeMB} MB, ${skipped} skipped`);
    console.log(`Output: ${outFile}`);
}

merge();
