import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const runtimeIndexPath = path.join(projectRoot, 'assets', 'configs', 'assets_runtime.json');
const qualityPath = path.join(projectRoot, 'assets', 'configs', 'runtime_asset_quality.json');

const failures = [];
const warnings = [];

function fail(message) {
  failures.push(message);
}

function warn(message) {
  warnings.push(message);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function normalizePath(value) {
  return String(value ?? '').replace(/\\/g, '/').toLowerCase();
}

function matchesAny(value, patterns) {
  const normalized = normalizePath(value);
  return patterns.some((pattern) => normalized.includes(String(pattern).toLowerCase()));
}

function buildStatusMap(quality) {
  const statusMap = new Map();
  const statuses = quality.statuses ?? {};

  for (const [status, ids] of Object.entries(statuses)) {
    if (!Array.isArray(ids)) {
      fail(`runtime_asset_quality.json status "${status}" must be an array.`);
      continue;
    }

    for (const id of ids) {
      if (typeof id !== 'string' || id.length === 0) {
        fail(`runtime_asset_quality.json status "${status}" contains an invalid id.`);
        continue;
      }

      const previous = statusMap.get(id);
      if (previous && previous !== status) {
        statusMap.set(id, `${previous}+${status}`);
        continue;
      }

      statusMap.set(id, status);
    }
  }

  return statusMap;
}

if (!fs.existsSync(runtimeIndexPath)) {
  fail(`Missing runtime index: ${path.relative(projectRoot, runtimeIndexPath)}`);
}

if (!fs.existsSync(qualityPath)) {
  fail(`Missing runtime quality file: ${path.relative(projectRoot, qualityPath)}`);
}

let summary = {
  total: 0,
  productionCandidate: 0,
  runtimePlaceholder: 0,
  temporaryAlias: 0,
  needsDecomposition: 0,
  combinedStatus: 0,
  missingPlanned: 0,
};

if (failures.length === 0) {
  const runtimeIndex = readJson(runtimeIndexPath);
  const quality = readJson(qualityPath);
  const entries = Array.isArray(runtimeIndex.assets) ? runtimeIndex.assets : [];
  const statusMap = buildStatusMap(quality);
  const developmentOnlyPathPatterns = quality.pathPolicy?.developmentOnlyPathPatterns ?? [];
  const testFileNamePatterns = quality.pathPolicy?.testFileNamePatterns ?? [];
  const productionRuntimeRoot = normalizePath(quality.pathPolicy?.productionRuntimeRoot ?? 'assets/textures/runtime');
  const defaultStatus = quality.defaultStatus ?? 'productionCandidate';

  summary.total = entries.length;

  for (const entry of entries) {
    const id = entry?.id;
    const finalPath = entry?.finalPath;

    if (typeof id !== 'string' || id.length === 0) {
      fail('Runtime asset entry is missing id.');
      continue;
    }

    if (typeof finalPath !== 'string' || finalPath.length === 0) {
      fail(`${id} is missing finalPath.`);
      continue;
    }

    const normalizedFinalPath = normalizePath(finalPath);
    const baseName = normalizePath(path.basename(finalPath));

    if (!normalizedFinalPath.startsWith(`${productionRuntimeRoot}/`)) {
      fail(`${id}.finalPath must stay under ${quality.pathPolicy?.productionRuntimeRoot}: ${finalPath}`);
    }

    if (matchesAny(finalPath, developmentOnlyPathPatterns)) {
      fail(`${id}.finalPath points at development-only art: ${finalPath}`);
    }

    if (matchesAny(baseName, testFileNamePatterns)) {
      fail(`${id}.finalPath looks like a test or QA artifact: ${finalPath}`);
    }

    const status = statusMap.get(id) ?? defaultStatus;
    if (status.includes('+')) {
      summary.combinedStatus += 1;
      warn(`${id} has combined quality statuses: ${status}`);
    } else if (Object.prototype.hasOwnProperty.call(summary, status)) {
      summary[status] += 1;
    } else {
      warn(`${id} has unknown quality status "${status}".`);
    }
  }

  for (const planned of quality.plannedMissing ?? []) {
    if (planned?.id && !entries.some((entry) => entry.id === planned.id)) {
      summary.missingPlanned += 1;
    }
  }
}

for (const warning of warnings) {
  console.warn(`[runtime-asset-quality] WARN ${warning}`);
}

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(`[runtime-asset-quality] FAIL ${failure}`);
  }
  process.exit(1);
}

console.log(`[runtime-asset-quality] ${JSON.stringify(summary)}`);
