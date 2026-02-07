import fs from 'fs';
import path from 'path';

const root = process.cwd();
const configPath = path.join(root, 'config', 'forbidden-language.json');
const localConfigPath = path.join(root, 'config', 'forbidden-language.local.json');

const defaultConfig = {
  patterns: [],
  ignore: ['archive', 'node_modules', 'data', '.git']
};

function loadConfig() {
  try {
    const raw = fs.readFileSync(configPath, 'utf8');
    const base = { ...defaultConfig, ...JSON.parse(raw) };
    if (fs.existsSync(localConfigPath)) {
      try {
        const localRaw = fs.readFileSync(localConfigPath, 'utf8');
        const local = JSON.parse(localRaw);
        base.patterns = [
          ...(Array.isArray(base.patterns) ? base.patterns : []),
          ...(Array.isArray(local.patterns) ? local.patterns : [])
        ];
        base.ignore = [
          ...(Array.isArray(base.ignore) ? base.ignore : []),
          ...(Array.isArray(local.ignore) ? local.ignore : [])
        ];
      } catch (err) {
        console.warn(`[FORBIDDEN-LINT] Local config invalid: ${localConfigPath}`);
      }
    }
    return base;
  } catch (err) {
    console.warn(`[FORBIDDEN-LINT] Config not found or invalid: ${configPath}`);
    return defaultConfig;
  }
}

function shouldIgnoreDir(dirName, ignoreList) {
  return ignoreList.includes(dirName);
}

const allowedExts = new Set([
  '.md',
  '.js',
  '.mjs',
  '.jsx',
  '.ts',
  '.tsx',
  '.html',
  '.css',
  '.json',
  '.yml',
  '.yaml',
  '.txt',
  '.sh',
  '.ps1',
  '.bat'
]);

function isTextFile(filePath) {
  return allowedExts.has(path.extname(filePath));
}

function walkDir(dirPath, ignoreList, files = []) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      if (shouldIgnoreDir(entry.name, ignoreList)) continue;
      walkDir(fullPath, ignoreList, files);
    } else if (entry.isFile()) {
      if (isTextFile(fullPath)) {
        files.push(fullPath);
      }
    }
  }
  return files;
}

function lineInfoForIndex(text, index) {
  const prefix = text.slice(0, index);
  const line = prefix.split('\n').length;
  const col = index - prefix.lastIndexOf('\n');
  return { line, col };
}

function collectViolations(filePath, text, rules) {
  const violations = [];
  for (const rule of rules) {
    const pattern = rule.pattern;
    const flags = rule.flags || 'g';
    let regex = null;
    try {
      regex = new RegExp(pattern, flags);
    } catch (err) {
      console.warn(`[FORBIDDEN-LINT] Invalid regex skipped: ${pattern}`);
      continue;
    }
    let match;
    while ((match = regex.exec(text)) !== null) {
      const idx = match.index;
      const info = lineInfoForIndex(text, idx);
      const excerpt = text
        .slice(Math.max(0, idx - 40), Math.min(text.length, idx + 40))
        .replace(/\s+/g, ' ')
        .trim();
      violations.push({
        file: filePath,
        line: info.line,
        col: info.col,
        pattern,
        reason: rule.reason || 'Forbidden language',
        excerpt
      });
      if (violations.length >= 20) break;
    }
  }
  return violations;
}

function main() {
  const config = loadConfig();
  const rules = Array.isArray(config.patterns) ? config.patterns : [];
  if (rules.length === 0) {
    console.warn('[FORBIDDEN-LINT] No patterns configured. Add entries to config/forbidden-language.json.');
    process.exit(0);
  }
  const files = walkDir(root, config.ignore || defaultConfig.ignore);
  const violations = [];
  for (const filePath of files) {
    const text = fs.readFileSync(filePath, 'utf8');
    if (text.includes('\u0000')) continue;
    violations.push(...collectViolations(filePath, text, rules));
  }
  if (violations.length === 0) {
    console.log('[FORBIDDEN-LINT] ✅ No forbidden language found.');
    process.exit(0);
  }
  console.error(`[FORBIDDEN-LINT] ❌ ${violations.length} violation(s) found.`);
  for (const v of violations) {
    const relPath = path.relative(root, v.file);
    console.error(`- ${relPath}:${v.line}:${v.col} "${v.pattern}" — ${v.reason}`);
    console.error(`  ${v.excerpt}`);
  }
  process.exit(1);
}

main();
