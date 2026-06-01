import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const runtimeIndexPath = path.join(projectRoot, 'assets', 'configs', 'assets_runtime.json');
const referencePathPattern = /(?:^|\/)textures\/references(?:\/|$)/i;
const developmentPathPattern = /(?:^|\/)(tmp|temp|library|_cocos_cache_backup_[^/]*)(?:\/|$)/i;
const testFileNamePattern = /(^|[_-])(qa|test|screenshot|contact_sheet)([_-]|$)|cocos_window|os_screenshot/i;

function fail(message) {
  console.error(`[runtime-assets] ${message}`);
  process.exitCode = 1;
}

if (!fs.existsSync(runtimeIndexPath)) {
  fail(`Missing runtime asset index: ${path.relative(projectRoot, runtimeIndexPath)}`);
} else {
  const document = JSON.parse(fs.readFileSync(runtimeIndexPath, 'utf8'));
  const entries = Array.isArray(document.assets) ? document.assets : [];

  if (!document.runtimeOnly) {
    fail('assets_runtime.json must set "runtimeOnly": true.');
  }

  if (entries.length === 0) {
    fail('assets_runtime.json must contain at least one runtime asset.');
  }

  for (const entry of entries) {
    const fields = ['finalPath', 'placeholderPath', 'projectPath', 'sourcePath'];
    for (const field of fields) {
      const value = entry?.[field];
      if (typeof value === 'string' && referencePathPattern.test(value.replace(/\\/g, '/'))) {
        fail(`${entry.id ?? '<unknown>'}.${field} points at development reference art: ${value}`);
      }

      if (typeof value === 'string' && developmentPathPattern.test(value.replace(/\\/g, '/'))) {
        fail(`${entry.id ?? '<unknown>'}.${field} points at a development/test directory: ${value}`);
      }
    }

    if (typeof entry?.finalPath !== 'string' || entry.finalPath.length === 0) {
      fail(`${entry?.id ?? '<unknown>'} is missing finalPath.`);
      continue;
    }

    const assetFilePath = path.join(projectRoot, entry.finalPath.replace(/\//g, path.sep));
    if (!fs.existsSync(assetFilePath)) {
      fail(`${entry.id ?? '<unknown>'}.finalPath does not exist: ${entry.finalPath}`);
    }

    if (testFileNamePattern.test(path.basename(entry.finalPath))) {
      fail(`${entry.id ?? '<unknown>'}.finalPath looks like a QA screenshot or temporary image: ${entry.finalPath}`);
    }
  }
}

if (process.exitCode) {
  process.exit();
}

console.log('[runtime-assets] Runtime asset index is production-safe.');
