import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const workspaceRoot = path.resolve(projectRoot, '..');
const statePath = path.join(projectRoot, 'assets', 'configs', 'asset_pipeline_state.json');
const batchPath = path.join(projectRoot, 'assets', 'configs', 'asset_generation_batch_p0.json');
const promptsPath = path.join(workspaceRoot, 'cat_game_agents_prompts.json');

const failures = [];
const warnings = [];

const statusPhase = {
  pending: null,
  candidate_spec_prepared: 'generate_candidates',
  candidate_generated: 'generate_candidates',
  asset_audit_failed: 'asset_audit',
  asset_audit_passed: 'asset_audit',
  static_checks_failed: 'static_checks',
  static_checks_passed: 'static_checks',
  screenshot_failed: 'browser_screenshots',
  screenshot_passed: 'browser_screenshots',
  visual_compare_failed: 'visual_compare',
  visual_compare_passed: 'visual_compare',
  accepted: 'promote_or_reject',
  promoted: 'promote_or_reject',
  blocked: null,
};

function fail(message) {
  failures.push(message);
}

function warn(message) {
  warnings.push(message);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function resolveProjectFile(relativePath) {
  return path.resolve(projectRoot, String(relativePath ?? '').replace(/\\/g, '/'));
}

for (const requiredPath of [statePath, batchPath, promptsPath]) {
  if (!fs.existsSync(requiredPath)) {
    fail(`Missing required file: ${path.relative(projectRoot, requiredPath)}`);
  }
}

let summary = {
  batchTasks: 0,
  trackedTasks: 0,
  pending: 0,
  activePhaseAgents: 0,
  conditionalAgents: 0,
};

if (failures.length === 0) {
  const state = readJson(statePath);
  const batch = readJson(batchPath);
  const prompts = readJson(promptsPath);
  const tasks = Array.isArray(batch.tasks) ? batch.tasks : [];
  const taskIds = new Set(tasks.map((task) => task.id));
  const statuses = state.statuses ?? {};
  const allowedStatuses = new Set(state.allowedStatuses ?? []);
  const agentNames = new Set((prompts.agents ?? []).map((agent) => agent.name));
  const executionOrder = prompts.execution_order ?? [];
  const phaseAgents = state.agentSchedule?.phaseAgents ?? {};
  const conditionalAgents = state.agentSchedule?.conditionalAgents ?? [];
  const artifacts = state.artifacts ?? {};
  const phaseOrder = state.loop?.phaseOrder ?? [];
  const phaseIndex = new Map(phaseOrder.map((phase, index) => [phase, index]));

  summary.batchTasks = tasks.length;
  summary.trackedTasks = Object.keys(statuses).length;
  summary.pending = Object.values(statuses).filter((status) => status === 'pending').length;
  summary.activePhaseAgents = (phaseAgents[state.loop?.currentPhase] ?? []).length;
  summary.conditionalAgents = conditionalAgents.length;

  if (state.activeBatch !== batch.batchId) {
    fail(`asset_pipeline_state.activeBatch must match asset_generation_batch_p0.batchId (${batch.batchId}).`);
  }

  if (!Array.isArray(state.loop?.phaseOrder) || state.loop.phaseOrder.length === 0) {
    fail('asset_pipeline_state.loop.phaseOrder must be a non-empty array.');
  } else if (!state.loop.phaseOrder.includes(state.loop.currentPhase)) {
    fail(`Current phase is not present in phaseOrder: ${state.loop.currentPhase}`);
  }

  if (allowedStatuses.size === 0) {
    fail('asset_pipeline_state.allowedStatuses must be non-empty.');
  }

  for (const id of taskIds) {
    if (!(id in statuses)) {
      fail(`Batch task lacks pipeline status: ${id}`);
      continue;
    }

    if (!allowedStatuses.has(statuses[id])) {
      fail(`${id} has unsupported pipeline status: ${statuses[id]}`);
    }

    const artifact = artifacts[id];
    const expectedPhase = statusPhase[statuses[id]];
    if (!artifact) {
      fail(`${id} lacks an artifact record.`);
    } else if (expectedPhase && artifact.phase !== expectedPhase) {
      fail(`${id} artifact.phase must be "${expectedPhase}" for status "${statuses[id]}", got "${artifact.phase}".`);
    } else if (artifact.finalPath) {
      const finalPath = resolveProjectFile(artifact.finalPath);
      const finalExists = fs.existsSync(finalPath);
      if (finalExists && statuses[id] !== 'promoted') {
        fail(`${id} has a runtime finalPath on disk but pipeline status is "${statuses[id]}"; mark it promoted or remove the runtime file from the active batch.`);
      }
      if (statuses[id] === 'promoted' && !finalExists) {
        fail(`${id} is promoted but its runtime finalPath is missing: ${artifact.finalPath}`);
      }
      if (statuses[id] === 'promoted' && /not generated/i.test(artifact.notes ?? '')) {
        fail(`${id} is promoted but artifact notes still say the runtime PNG was not generated.`);
      }
    }
  }

  for (const id of Object.keys(statuses)) {
    if (!taskIds.has(id)) {
      fail(`Pipeline status references task not present in active batch: ${id}`);
    }
  }

  for (const name of executionOrder) {
    if (!agentNames.has(name)) {
      fail(`execution_order references unknown agent: ${name}`);
    }
  }

  for (const phase of state.loop.phaseOrder ?? []) {
    const agents = phaseAgents[phase];
    if (!Array.isArray(agents) || agents.length === 0) {
      fail(`Phase "${phase}" must declare at least one owning agent.`);
      continue;
    }

    for (const agent of agents) {
      if (!agentNames.has(agent)) {
        fail(`Phase "${phase}" references unknown agent: ${agent}`);
      }
    }
  }

  for (const agentName of agentNames) {
    const usedInPhase = Object.values(phaseAgents).some((agents) => Array.isArray(agents) && agents.includes(agentName));
    const usedConditionally = conditionalAgents.some((entry) => entry.agent === agentName);
    if (!usedInPhase && !usedConditionally) {
      warn(`${agentName} is defined in prompts but not scheduled in the automated loop.`);
    }
  }

  for (const entry of conditionalAgents) {
    if (!agentNames.has(entry.agent)) {
      fail(`conditionalAgents references unknown agent: ${entry.agent}`);
    }
    if (typeof entry.when !== 'string' || entry.when.trim().length < 20) {
      fail(`${entry.agent} conditional trigger must describe when to run.`);
    }
  }

  const activeNonTerminalPhases = Object.entries(statuses)
    .filter(([, status]) => status !== 'promoted' && status !== 'blocked')
    .map(([, status]) => statusPhase[status])
    .filter(Boolean);
  const highestActivePhase = activeNonTerminalPhases.reduce((highest, phase) => {
    if (!highest) {
      return phase;
    }
    return phaseIndex.get(phase) > phaseIndex.get(highest) ? phase : highest;
  }, null);

  if (highestActivePhase && phaseIndex.get(state.loop.currentPhase) < phaseIndex.get(highestActivePhase)) {
    fail(`loop.currentPhase "${state.loop.currentPhase}" is behind active task phase "${highestActivePhase}".`);
  }

  const nextAction = state.loop?.nextAction ?? '';
  if (state.loop.currentPhase !== 'generate_candidates' && /Generate candidate PNGs.*candidate_generated/i.test(nextAction)) {
    fail('loop.nextAction still describes the initial candidate generation step after the loop moved past generate_candidates.');
  }
}

for (const warning of warnings) {
  console.warn(`[asset-pipeline-state] WARN ${warning}`);
}

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(`[asset-pipeline-state] FAIL ${failure}`);
  }
  process.exit(1);
}

console.log(`[asset-pipeline-state] ${JSON.stringify(summary)}`);
