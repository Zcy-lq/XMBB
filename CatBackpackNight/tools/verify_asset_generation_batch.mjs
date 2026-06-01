import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const batchPath = path.join(projectRoot, 'assets', 'configs', 'asset_generation_batch_p0.json');
const qualityPath = path.join(projectRoot, 'assets', 'configs', 'runtime_asset_quality.json');
const contractPath = path.join(projectRoot, 'assets', 'configs', 'ui_asset_contract.json');

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
  return String(value ?? '').replace(/\\/g, '/');
}

function lowerPath(value) {
  return normalizePath(value).toLowerCase();
}

function matchesAny(value, patterns) {
  const normalized = lowerPath(value);
  return patterns.some((pattern) => normalized.includes(String(pattern).toLowerCase()));
}

for (const requiredPath of [batchPath, qualityPath, contractPath]) {
  if (!fs.existsSync(requiredPath)) {
    fail(`Missing required file: ${path.relative(projectRoot, requiredPath)}`);
  }
}

let summary = {
  tasks: 0,
  transparent: 0,
  opaque: 0,
  nineSlice: 0,
  coversP0PlannedMissing: 0,
  coversContractMissingFinals: 0,
};

if (failures.length === 0) {
  const batch = readJson(batchPath);
  const quality = readJson(qualityPath);
  const contract = readJson(contractPath);
  const tasks = Array.isArray(batch.tasks) ? batch.tasks : [];
  const taskIds = new Set();
  const plannedMissingP0 = new Set(
    (quality.plannedMissing ?? [])
      .filter((entry) => entry.priority === 'p0')
      .map((entry) => entry.id),
  );
  const contractMissingFinals = new Set(
    (contract.entries ?? [])
      .filter((entry) => entry.currentRuntimeId !== entry.finalRuntimeId)
      .map((entry) => entry.finalRuntimeId),
  );
  const developmentOnlyPatterns = quality.pathPolicy?.developmentOnlyPathPatterns ?? [];
  const testFilePatterns = quality.pathPolicy?.testFileNamePatterns ?? [];

  summary.tasks = tasks.length;

  if (batch.targetRoot !== 'assets/textures/runtime') {
    fail('asset_generation_batch_p0.json targetRoot must be assets/textures/runtime.');
  }

  if (typeof batch.stagingRoot !== 'string' || !lowerPath(batch.stagingRoot).startsWith('tmp/asset_candidates/')) {
    fail('asset_generation_batch_p0.json stagingRoot must stay under tmp/asset_candidates/.');
  }

  if (tasks.length === 0) {
    fail('asset_generation_batch_p0.json must contain at least one task.');
  }

  for (const task of tasks) {
    if (!task || typeof task !== 'object') {
      fail('asset_generation_batch_p0.json contains a non-object task.');
      continue;
    }

    const id = task.id;
    const outputPath = normalizePath(task.outputPath);
    const candidatePath = normalizePath(task.candidatePath);

    if (typeof id !== 'string' || !id.startsWith('rt_')) {
      fail('Each asset generation task id must start with rt_.');
      continue;
    }

    if (taskIds.has(id)) {
      fail(`Duplicate asset generation task id: ${id}`);
    }
    taskIds.add(id);

    if (outputPath !== `assets/textures/runtime/${id}.png`) {
      fail(`${id}.outputPath must be assets/textures/runtime/${id}.png`);
    }

    if (!candidatePath.startsWith(`${batch.stagingRoot}/`) || !candidatePath.endsWith(`${id}.png`)) {
      fail(`${id}.candidatePath must stay under stagingRoot and end with ${id}.png`);
    }

    for (const checkedPath of [outputPath, candidatePath]) {
      if (matchesAny(path.basename(checkedPath), testFilePatterns)) {
        fail(`${id} has a test-looking output file name: ${checkedPath}`);
      }
    }

    if (matchesAny(outputPath, developmentOnlyPatterns)) {
      fail(`${id}.outputPath points at a development-only directory: ${outputPath}`);
    }

    if (typeof task.prompt !== 'string' || task.prompt.trim().length < 40) {
      fail(`${id}.prompt must be a descriptive production prompt.`);
    }

    if (!task.size || !Number.isInteger(task.size.width) || !Number.isInteger(task.size.height)) {
      fail(`${id}.size must include integer width and height.`);
    }

    if (typeof task.transparent !== 'boolean') {
      fail(`${id}.transparent must be a boolean.`);
    } else if (task.transparent) {
      summary.transparent += 1;
    } else {
      summary.opaque += 1;
    }

    if (!task.nineSlice || typeof task.nineSlice.enabled !== 'boolean') {
      fail(`${id}.nineSlice.enabled must be declared.`);
    } else if (task.nineSlice.enabled) {
      summary.nineSlice += 1;
      const insets = task.nineSlice.insets ?? {};
      for (const side of ['left', 'right', 'top', 'bottom']) {
        if (!Number.isInteger(insets[side]) || insets[side] <= 0) {
          fail(`${id}.nineSlice.insets.${side} must be a positive integer.`);
        }
      }
    }

    if (!Array.isArray(task.acceptance) || task.acceptance.length < 4) {
      fail(`${id}.acceptance must contain at least four checks.`);
    }

    if (task.transparent && !task.acceptance?.includes('pngHasAlpha')) {
      fail(`${id}.acceptance must include pngHasAlpha for transparent assets.`);
    }

    if (!task.transparent && !task.acceptance?.includes('opaqueBackground')) {
      fail(`${id}.acceptance must include opaqueBackground for opaque assets.`);
    }
  }

  for (const id of plannedMissingP0) {
    if (taskIds.has(id)) {
      summary.coversP0PlannedMissing += 1;
    } else {
      warn(`P0 planned missing runtime id is not in generation batch: ${id}`);
    }
  }

  for (const id of contractMissingFinals) {
    if (taskIds.has(id)) {
      summary.coversContractMissingFinals += 1;
    }
  }
}

for (const warning of warnings) {
  console.warn(`[asset-generation-batch] WARN ${warning}`);
}

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(`[asset-generation-batch] FAIL ${failure}`);
  }
  process.exit(1);
}

console.log(`[asset-generation-batch] ${JSON.stringify(summary)}`);
