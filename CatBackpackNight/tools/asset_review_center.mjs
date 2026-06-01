import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const reviewConfigPath = path.join(projectRoot, 'assets', 'configs', 'asset_review_center.json');
const runtimeQualityPath = path.join(projectRoot, 'assets', 'configs', 'runtime_asset_quality.json');
const pipelineStatePath = path.join(projectRoot, 'assets', 'configs', 'asset_pipeline_state.json');
const generationBatchPath = path.join(projectRoot, 'assets', 'configs', 'asset_generation_batch_p0.json');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function normalizePath(relativePath) {
  return relativePath ? relativePath.replaceAll('\\', '/') : relativePath;
}

function relativeToProject(absolutePath) {
  return normalizePath(path.relative(projectRoot, absolutePath));
}

function listRuntimeAssetIds(runtimeRoot) {
  const absoluteRoot = path.join(projectRoot, runtimeRoot);
  if (!fs.existsSync(absoluteRoot)) {
    return [];
  }

  return fs
    .readdirSync(absoluteRoot)
    .filter((fileName) => fileName.endsWith('.png'))
    .map((fileName) => path.basename(fileName, '.png'))
    .sort();
}

function ensureEntry(entries, id) {
  if (!entries.has(id)) {
    entries.set(id, {
      id,
      sourceStatuses: [],
      qualityStatuses: [],
      pipelineStatus: undefined,
      priority: undefined,
      category: undefined,
      outputPath: undefined,
      candidatePath: undefined,
      finalExists: false,
      notes: [],
    });
  }
  return entries.get(id);
}

function addStatus(entry, source, status) {
  if (!status) {
    return;
  }
  const value = `${source}:${status}`;
  if (!entry.sourceStatuses.includes(value)) {
    entry.sourceStatuses.push(value);
  }
}

function classifyEntry(entry, buckets) {
  const qualityStatuses = entry.qualityStatuses;
  const statuses = [entry.pipelineStatus, ...qualityStatuses].filter(Boolean);

  if (statuses.some((status) => buckets.blocked.includes(status))) {
    return 'blocked';
  }
  if (statuses.some((status) => buckets.mustRegenerate.includes(status))) {
    return 'mustRegenerate';
  }
  if (statuses.some((status) => buckets.needsReview.includes(status))) {
    return 'needsReview';
  }
  if (statuses.some((status) => buckets.queuedForGeneration.includes(status)) || (!entry.finalExists && entry.candidatePath)) {
    return 'queuedForGeneration';
  }
  if (statuses.some((status) => buckets.usable.includes(status)) || entry.finalExists) {
    return 'usable';
  }
  return 'queuedForGeneration';
}

function compactEntry(entry) {
  return {
    id: entry.id,
    priority: entry.priority,
    category: entry.category,
    pipelineStatus: entry.pipelineStatus,
    qualityStatuses: entry.qualityStatuses,
    outputPath: entry.outputPath,
    candidatePath: entry.candidatePath,
    finalExists: entry.finalExists,
    notes: entry.notes,
  };
}

const reviewConfig = readJson(reviewConfigPath);
const runtimeQuality = readJson(runtimeQualityPath);
const pipelineState = readJson(pipelineStatePath);
const generationBatch = readJson(generationBatchPath);
const entries = new Map();
const runtimeRoot = reviewConfig.sourceFiles.runtimeRoot;
const runtimeIds = new Set(listRuntimeAssetIds(runtimeRoot));

for (const id of runtimeIds) {
  const entry = ensureEntry(entries, id);
  entry.finalExists = true;
  entry.outputPath = `${runtimeRoot}/${id}.png`;
  entry.qualityStatuses.push(runtimeQuality.defaultStatus ?? 'productionCandidate');
  addStatus(entry, 'runtime', runtimeQuality.defaultStatus ?? 'productionCandidate');
}

for (const [status, ids] of Object.entries(runtimeQuality.statuses ?? {})) {
  for (const id of ids) {
    const entry = ensureEntry(entries, id);
    if (!entry.qualityStatuses.includes(status)) {
      entry.qualityStatuses.push(status);
    }
    if (runtimeIds.has(id)) {
      entry.finalExists = true;
      entry.outputPath = entry.outputPath ?? `${runtimeRoot}/${id}.png`;
    }
    addStatus(entry, 'quality', status);
  }
}

for (const planned of runtimeQuality.plannedMissing ?? []) {
  const entry = ensureEntry(entries, planned.id);
  entry.priority = entry.priority ?? planned.priority;
  entry.outputPath = entry.outputPath ?? planned.suggestedPath;
  entry.notes.push(planned.reason);
  addStatus(entry, 'plannedMissing', 'pending');
}

for (const [id, status] of Object.entries(pipelineState.statuses ?? {})) {
  const entry = ensureEntry(entries, id);
  entry.pipelineStatus = status;
  addStatus(entry, 'pipeline', status);
}

for (const task of generationBatch.tasks ?? []) {
  const entry = ensureEntry(entries, task.id);
  entry.priority = entry.priority ?? task.priority;
  entry.category = entry.category ?? task.category;
  entry.outputPath = entry.outputPath ?? normalizePath(task.outputPath);
  entry.candidatePath = entry.candidatePath ?? normalizePath(task.candidatePath);
  if (entry.outputPath && fs.existsSync(path.join(projectRoot, entry.outputPath))) {
    entry.finalExists = true;
  }
  addStatus(entry, 'batch', task.priority);
}

const buckets = {
  usable: [],
  needsReview: [],
  mustRegenerate: [],
  queuedForGeneration: [],
  blocked: [],
};

for (const entry of [...entries.values()].sort((left, right) => left.id.localeCompare(right.id))) {
  const bucket = classifyEntry(entry, reviewConfig.reviewBuckets);
  buckets[bucket].push(compactEntry(entry));
}

const nextQueued = buckets.queuedForGeneration.find((entry) => entry.id === pipelineState.loop?.activeTask) ?? buckets.queuedForGeneration[0] ?? null;
const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  activeBatch: pipelineState.activeBatch,
  activeTask: pipelineState.loop?.activeTask,
  nextAssetForContinuousGeneration: nextQueued?.id ?? null,
  totals: Object.fromEntries(Object.entries(buckets).map(([bucket, values]) => [bucket, values.length])),
  buckets,
  policy: {
    requiresHumanConfirmationBeforePromotion: reviewConfig.humanConfirmationPolicy.requiresConfirmationBeforePromotion,
    rejectReasons: reviewConfig.rejectReasons,
  },
};

const shouldWrite = process.argv.includes('--write');
const shouldPrintJson = process.argv.includes('--json') || shouldWrite;

if (shouldWrite) {
  const outputPath = path.join(projectRoot, reviewConfig.outputPolicy.optionalWritePath);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  report.writtenTo = relativeToProject(outputPath);
}

if (shouldPrintJson) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log(`[asset-review] activeBatch=${report.activeBatch} activeTask=${report.activeTask ?? 'none'} next=${report.nextAssetForContinuousGeneration ?? 'none'}`);
  console.log(`[asset-review] usable=${report.totals.usable} needsReview=${report.totals.needsReview} mustRegenerate=${report.totals.mustRegenerate} queuedForGeneration=${report.totals.queuedForGeneration} blocked=${report.totals.blocked}`);
  console.log(`[asset-review] humanConfirmationBeforePromotion=${report.policy.requiresHumanConfirmationBeforePromotion} rejectReasons=${report.policy.rejectReasons.join(',')}`);
}
