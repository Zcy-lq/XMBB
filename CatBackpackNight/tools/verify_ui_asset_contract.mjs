import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const contractPath = path.join(projectRoot, 'assets', 'configs', 'ui_asset_contract.json');
const runtimeIndexPath = path.join(projectRoot, 'assets', 'configs', 'assets_runtime.json');
const qualityPath = path.join(projectRoot, 'assets', 'configs', 'runtime_asset_quality.json');
const screenPath = path.join(projectRoot, 'assets', 'configs', 'ui_runtime_assets.json');
const uiAssetKeysPath = path.join(projectRoot, 'assets', 'scripts', 'ui', 'UIAssetKeys.ts');

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

function extractUiProductKeys() {
  const source = fs.readFileSync(uiAssetKeysPath, 'utf8');
  return new Set([...source.matchAll(/:\s*'([^']+)'/g)].map((match) => match[1]));
}

function buildRuntimeMap(runtimeIndex) {
  const entries = Array.isArray(runtimeIndex.assets) ? runtimeIndex.assets : [];
  return new Map(entries.map((entry) => [entry.id, entry]));
}

function buildQualityStatusMap(quality) {
  const statusMap = new Map();
  for (const [status, ids] of Object.entries(quality.statuses ?? {})) {
    if (!Array.isArray(ids)) {
      fail(`runtime_asset_quality.json status "${status}" must be an array.`);
      continue;
    }

    for (const id of ids) {
      const current = statusMap.get(id) ?? [];
      if (!current.includes(status)) {
        current.push(status);
      }
      statusMap.set(id, current);
    }
  }
  return statusMap;
}

function collectScreenProductKeys(screenDeclarations) {
  const keys = new Set();
  for (const [screen, value] of Object.entries(screenDeclarations)) {
    if (screen === 'version' || screen === 'policy') {
      continue;
    }

    if (!Array.isArray(value)) {
      fail(`ui_runtime_assets.json screen "${screen}" must be an array.`);
      continue;
    }

    for (const productKey of value) {
      keys.add(productKey);
    }
  }
  return keys;
}

function matchesAny(value, patterns) {
  const normalized = normalizePath(value);
  return patterns.some((pattern) => normalized.includes(String(pattern).toLowerCase()));
}

for (const requiredPath of [contractPath, runtimeIndexPath, qualityPath, screenPath, uiAssetKeysPath]) {
  if (!fs.existsSync(requiredPath)) {
    fail(`Missing required file: ${path.relative(projectRoot, requiredPath)}`);
  }
}

let summary = {
  productKeys: 0,
  contractEntries: 0,
  currentRuntimeReady: 0,
  finalRuntimeReady: 0,
  missingFinalRuntime: 0,
  temporaryMappings: 0,
};

if (failures.length === 0) {
  const contract = readJson(contractPath);
  const runtimeIndex = readJson(runtimeIndexPath);
  const quality = readJson(qualityPath);
  const screenDeclarations = readJson(screenPath);
  const uiProductKeys = extractUiProductKeys();
  const runtimeMap = buildRuntimeMap(runtimeIndex);
  const statusMap = buildQualityStatusMap(quality);
  const screenProductKeys = collectScreenProductKeys(screenDeclarations);
  const plannedMissing = new Set((quality.plannedMissing ?? []).map((entry) => entry.id));
  const developmentOnlyPatterns = quality.pathPolicy?.developmentOnlyPathPatterns ?? [];
  const testFilePatterns = quality.pathPolicy?.testFileNamePatterns ?? [];

  const entries = Array.isArray(contract.entries) ? contract.entries : [];
  const entriesByProductKey = new Map();

  summary.productKeys = uiProductKeys.size;
  summary.contractEntries = entries.length;

  for (const entry of entries) {
    if (!entry || typeof entry !== 'object') {
      fail('ui_asset_contract.json contains a non-object entry.');
      continue;
    }

    const { productKey, currentRuntimeId, finalRuntimeId } = entry;

    if (typeof productKey !== 'string' || productKey.length === 0) {
      fail('ui_asset_contract.json entry is missing productKey.');
      continue;
    }

    if (entriesByProductKey.has(productKey)) {
      fail(`Duplicate contract entry for product key: ${productKey}`);
    }
    entriesByProductKey.set(productKey, entry);

    if (!uiProductKeys.has(productKey)) {
      fail(`Contract contains product key not declared in UIAssetKeys.ts: ${productKey}`);
    }

    if (typeof finalRuntimeId !== 'string' || !finalRuntimeId.startsWith('rt_')) {
      fail(`${productKey}.finalRuntimeId must be a runtime id starting with rt_.`);
    }

    if (currentRuntimeId !== null && (typeof currentRuntimeId !== 'string' || !currentRuntimeId.startsWith('rt_'))) {
      fail(`${productKey}.currentRuntimeId must be null or a runtime id starting with rt_.`);
    }

    if (currentRuntimeId && !runtimeMap.has(currentRuntimeId)) {
      fail(`${productKey}.currentRuntimeId is not present in assets_runtime.json: ${currentRuntimeId}`);
    } else if (currentRuntimeId) {
      summary.currentRuntimeReady += 1;
    }

    if (runtimeMap.has(finalRuntimeId)) {
      summary.finalRuntimeReady += 1;
    } else if (plannedMissing.has(finalRuntimeId)) {
      summary.missingFinalRuntime += 1;
    } else {
      fail(`${productKey}.finalRuntimeId is missing from both runtime assets and plannedMissing: ${finalRuntimeId}`);
    }

    if (currentRuntimeId && currentRuntimeId !== finalRuntimeId) {
      summary.temporaryMappings += 1;
      const statuses = statusMap.get(currentRuntimeId) ?? [];
      if (!statuses.includes('temporaryAlias')) {
        warn(`${productKey} maps through ${currentRuntimeId}, but that runtime id is not marked temporaryAlias.`);
      }
    }

    for (const runtimeId of [currentRuntimeId, finalRuntimeId].filter(Boolean)) {
      const runtimeEntry = runtimeMap.get(runtimeId);
      if (runtimeEntry?.finalPath) {
        const baseName = path.basename(runtimeEntry.finalPath);
        if (matchesAny(runtimeEntry.finalPath, developmentOnlyPatterns) || matchesAny(baseName, testFilePatterns)) {
          fail(`${productKey} points at development/test art through ${runtimeId}: ${runtimeEntry.finalPath}`);
        }
      }
    }
  }

  for (const productKey of uiProductKeys) {
    if (!entriesByProductKey.has(productKey)) {
      fail(`UIAssetKeys.ts product key lacks contract entry: ${productKey}`);
    }
  }

  for (const productKey of screenProductKeys) {
    if (!uiProductKeys.has(productKey)) {
      fail(`ui_runtime_assets.json references unknown UI product key: ${productKey}`);
    }
    if (!entriesByProductKey.has(productKey)) {
      fail(`ui_runtime_assets.json product key lacks contract entry: ${productKey}`);
    }
  }
}

for (const warning of warnings) {
  console.warn(`[ui-asset-contract] WARN ${warning}`);
}

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(`[ui-asset-contract] FAIL ${failure}`);
  }
  process.exit(1);
}

console.log(`[ui-asset-contract] ${JSON.stringify(summary)}`);
