import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const batchPath = path.join(projectRoot, 'assets', 'configs', 'asset_generation_batch_p0.json');
const statePath = path.join(projectRoot, 'assets', 'configs', 'asset_pipeline_state.json');
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
  return String(value ?? '').replace(/\\/g, '/');
}

function lowerPath(value) {
  return normalizePath(value).toLowerCase();
}

function matchesAny(value, patterns) {
  const normalized = lowerPath(value);
  return patterns.some((pattern) => normalized.includes(String(pattern).toLowerCase()));
}

function assertProjectRelative(filePath, label) {
  const resolved = path.resolve(projectRoot, filePath);
  if (!resolved.startsWith(projectRoot + path.sep)) {
    fail(`${label} escapes project root: ${filePath}`);
  }
  return resolved;
}

function readPngMetadata(filePath) {
  const buffer = fs.readFileSync(filePath);
  const signature = buffer.subarray(0, 8).toString('hex');
  if (signature !== '89504e470d0a1a0a') {
    throw new Error('not a PNG file');
  }

  let offset = 8;
  let width = 0;
  let height = 0;
  let colorType = null;
  let hasTransparencyChunk = false;

  while (offset + 12 <= buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.subarray(offset + 4, offset + 8).toString('ascii');
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;

    if (dataEnd + 4 > buffer.length) {
      throw new Error(`corrupt PNG chunk ${type}`);
    }

    if (type === 'IHDR') {
      width = buffer.readUInt32BE(dataStart);
      height = buffer.readUInt32BE(dataStart + 4);
      colorType = buffer[dataStart + 9];
    }

    if (type === 'tRNS') {
      hasTransparencyChunk = true;
    }

    if (type === 'IEND') {
      break;
    }

    offset = dataEnd + 4;
  }

  return {
    width,
    height,
    colorType,
    hasAlpha: colorType === 4 || colorType === 6 || hasTransparencyChunk,
  };
}

for (const requiredPath of [batchPath, statePath, qualityPath]) {
  if (!fs.existsSync(requiredPath)) {
    fail(`Missing required file: ${path.relative(projectRoot, requiredPath)}`);
  }
}

let summary = {
  tasks: 0,
  specsPrepared: 0,
  candidatePngs: 0,
  generatedStatuses: 0,
  orphanPngs: 0,
};

if (failures.length === 0) {
  const batch = readJson(batchPath);
  const state = readJson(statePath);
  const quality = readJson(qualityPath);
  const tasks = Array.isArray(batch.tasks) ? batch.tasks : [];
  const tasksById = new Map(tasks.map((task) => [task.id, task]));
  const statuses = state.statuses ?? {};
  const artifacts = state.artifacts ?? {};
  const stagingRoot = normalizePath(batch.stagingRoot);
  const stagingAbs = assertProjectRelative(stagingRoot, 'batch.stagingRoot');
  const testFilePatterns = quality.pathPolicy?.testFileNamePatterns ?? [];
  const generatedLikeStatuses = new Set([
    'candidate_generated',
    'asset_audit_failed',
    'asset_audit_passed',
    'static_checks_failed',
    'static_checks_passed',
    'screenshot_failed',
    'screenshot_passed',
    'visual_compare_failed',
    'visual_compare_passed',
    'accepted',
    'promoted',
  ]);

  summary.tasks = tasks.length;

  for (const task of tasks) {
    const status = statuses[task.id];
    const artifact = artifacts[task.id];
    const candidatePath = normalizePath(task.candidatePath);
    const outputPath = normalizePath(task.outputPath);

    if (status === 'candidate_spec_prepared' || generatedLikeStatuses.has(status)) {
      summary.specsPrepared += 1;

      if (!artifact || typeof artifact !== 'object') {
        fail(`${task.id} has status ${status} but no artifact entry.`);
      } else {
        const specPath = normalizePath(artifact.specPath);
        const artifactCandidatePath = normalizePath(artifact.candidatePath);
        const finalPath = normalizePath(artifact.finalPath);
        const sourcePath = normalizePath(artifact.sourcePath);
        const alphaWorkPath = normalizePath(artifact.alphaWorkPath);

        if (artifactCandidatePath !== candidatePath) {
          fail(`${task.id} artifact candidatePath does not match batch candidatePath.`);
        }

        if (finalPath !== outputPath) {
          fail(`${task.id} artifact finalPath does not match batch outputPath.`);
        }

        if (!specPath.endsWith(`${task.id}.prompt.md`)) {
          fail(`${task.id} specPath must end with ${task.id}.prompt.md.`);
        }

        const specAbs = assertProjectRelative(specPath, `${task.id}.specPath`);
        if (!fs.existsSync(specAbs)) {
          fail(`${task.id} spec file is missing: ${specPath}`);
        } else {
          const specText = fs.readFileSync(specAbs, 'utf8');
          for (const requiredText of [task.id, candidatePath, outputPath]) {
            if (!specText.includes(requiredText)) {
              fail(`${task.id} spec file must mention ${requiredText}.`);
            }
          }
        }

        if (generatedLikeStatuses.has(status)) {
          for (const [label, value] of [
            ['sourcePath', sourcePath],
            ['alphaWorkPath', alphaWorkPath],
          ]) {
            if (!value || value === 'undefined' || value === 'null') {
              warn(`${task.id} generated candidate has no ${label}; source traceability is reduced.`);
              continue;
            }
            const supportAbs = assertProjectRelative(value, `${task.id}.${label}`);
            if (!fs.existsSync(supportAbs)) {
              fail(`${task.id} generated candidate ${label} is missing: ${value}`);
            }
          }
        }
      }
    }

    const candidateAbs = assertProjectRelative(candidatePath, `${task.id}.candidatePath`);
    if (fs.existsSync(candidateAbs)) {
      summary.candidatePngs += 1;

      if (!candidatePath.startsWith(`${stagingRoot}/`)) {
        fail(`${task.id} candidate must stay under stagingRoot: ${candidatePath}`);
      }

      if (matchesAny(path.basename(candidatePath), testFilePatterns)) {
        fail(`${task.id} candidate file name looks like a test/screenshot artifact: ${candidatePath}`);
      }

      try {
        const png = readPngMetadata(candidateAbs);
        if (png.width !== task.size?.width || png.height !== task.size?.height) {
          fail(`${task.id} candidate size ${png.width}x${png.height} must be ${task.size?.width}x${task.size?.height}.`);
        }

        if (task.transparent && !png.hasAlpha) {
          fail(`${task.id} is declared transparent but PNG has no alpha channel or transparency chunk.`);
        }

        if (!task.transparent && png.hasAlpha) {
          warn(`${task.id} is declared opaque but PNG carries transparency metadata.`);
        }
      } catch (error) {
        fail(`${task.id} candidate is not a valid PNG: ${error.message}`);
      }
    } else if (generatedLikeStatuses.has(status)) {
      fail(`${task.id} has status ${status} but candidate PNG is missing: ${candidatePath}`);
    }

    if (generatedLikeStatuses.has(status)) {
      summary.generatedStatuses += 1;
    }
  }

  if (fs.existsSync(stagingAbs)) {
    for (const entry of fs.readdirSync(stagingAbs, { withFileTypes: true })) {
      if (!entry.isFile() || !entry.name.toLowerCase().endsWith('.png')) {
        continue;
      }

      const id = entry.name.replace(/\.png$/i, '');
      if (!tasksById.has(id)) {
        summary.orphanPngs += 1;
        fail(`Staging directory contains PNG not declared in active batch: ${normalizePath(path.join(stagingRoot, entry.name))}`);
      }

      if (matchesAny(entry.name, testFilePatterns)) {
        fail(`Staging directory contains test/screenshot-looking PNG: ${entry.name}`);
      }
    }
  }
}

for (const warning of warnings) {
  console.warn(`[asset-candidates] WARN ${warning}`);
}

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(`[asset-candidates] FAIL ${failure}`);
  }
  process.exit(1);
}

console.log(`[asset-candidates] ${JSON.stringify(summary)}`);
