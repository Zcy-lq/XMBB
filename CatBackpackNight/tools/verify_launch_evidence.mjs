import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const finalMode = process.env.XMBB_RELEASE_FINAL === '1' || process.env.XMBB_LAUNCH_FINAL === '1';
const evidencePath = path.join(projectRoot, 'docs', 'launch_evidence', 'launch_evidence.json');
const templatePath = path.join(projectRoot, 'docs', 'launch_evidence', 'launch_evidence.template.json');
const failures = [];
const blockedEvidence = [];

const requiredRuntimeSteps = [
  'clear_save',
  'launch_login',
  'agreement_block',
  'accept_agreement_home',
  'open_battle_prepare',
  'start_battle',
  'reach_victory',
  'claim_reward_once',
  'double_reward_ad',
  'duplicate_claim_blocked',
  'backpack_merge',
  'pet_or_talent_upgrade',
  'power_changed',
  'start_second_battle',
  'restart_restore_save',
];

const expectedDesignPages = [
  '01 Login',
  '02 Home',
  '03 Battle Prepare',
  '04 Battle',
  '05 Pause Modal',
  '06 Skill Choice',
  '07 Victory',
  '08 Defeat',
  '09 Backpack',
  '10 Merge Guide',
  '11 Shop',
  '12 Pet',
  '13 Pet Detail',
  '14 Talent',
  '15 Daily Task',
  '16 Achievement',
  '17 Mail',
  '18 Mail Detail',
  '19 Settings',
  '20 Policy Modal',
  '21 Confirm Modal',
  '22 Toast Modal',
];

function rel(filePath) {
  return path.relative(projectRoot, filePath).replace(/\\/g, '/');
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function fail(message) {
  failures.push(message);
}

function block(label, reason) {
  const row = `${label}: ${reason}`;
  blockedEvidence.push(row);
  if (finalMode) {
    fail(`Final launch evidence is missing or incomplete: ${row}`);
  }
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function hasText(value) {
  return typeof value === 'string' && value.trim().length > 0 && !/^__.+__$/.test(value.trim());
}

function isExternalUrl(value) {
  return /^https?:\/\//i.test(String(value));
}

function assertStatusPass(section, value) {
  if (value?.status !== 'PASS') {
    block(section, `status must be PASS, got ${value?.status ?? 'missing'}`);
    return false;
  }
  return true;
}

function assertEvidenceFiles(section, files) {
  const list = asArray(files);
  if (list.length === 0) {
    block(section, 'at least one screenshot, log, or evidence file is required');
    return;
  }
  for (const file of list) {
    if (!hasText(file)) {
      block(section, 'evidence file path is blank or placeholder');
      continue;
    }
    if (isExternalUrl(file)) {
      continue;
    }
    const absolute = path.resolve(projectRoot, file);
    if (!fs.existsSync(absolute)) {
      block(section, `evidence file does not exist: ${rel(absolute)}`);
    }
  }
}

function validateWechatDevToolsImport(evidence) {
  const section = evidence.wechatDevToolsImport;
  if (!assertStatusPass('wechatDevToolsImport', section)) {
    return;
  }
  if (!hasText(section.devtoolsVersion)) {
    block('wechatDevToolsImport.devtoolsVersion', 'WeChat DevTools version must be recorded');
  }
  if (!hasText(section.appid) || section.appid === 'touristappid') {
    block('wechatDevToolsImport.appid', 'real or approved test AppID must be recorded');
  }
  if (section.projectPath !== 'build/wechatgame') {
    block('wechatDevToolsImport.projectPath', 'must point at build/wechatgame');
  }
  assertEvidenceFiles('wechatDevToolsImport.screenshots', section.screenshots);
  assertEvidenceFiles('wechatDevToolsImport.logs', section.logs);
}

function validateFullLoopRuntime(evidence) {
  const section = evidence.fullLoopRuntime;
  if (!assertStatusPass('fullLoopRuntime', section)) {
    return;
  }
  if (!['wechat-devtools', 'android-device', 'ios-device'].includes(section.runtime)) {
    block('fullLoopRuntime.runtime', 'runtime must be wechat-devtools, android-device, or ios-device');
  }
  const steps = asArray(section.steps);
  const rowsById = new Map(steps.map((step) => [step.id, step]));
  for (const stepId of requiredRuntimeSteps) {
    const step = rowsById.get(stepId);
    if (!step) {
      block(`fullLoopRuntime.steps.${stepId}`, 'required runtime loop step is missing');
      continue;
    }
    if (step.status !== 'PASS') {
      block(`fullLoopRuntime.steps.${stepId}`, `status must be PASS, got ${step.status ?? 'missing'}`);
    }
    assertEvidenceFiles(`fullLoopRuntime.steps.${stepId}.evidence`, step.evidence);
  }
}

function validateUiDesignSignoff(evidence) {
  const section = evidence.uiDesignSignoff;
  if (!assertStatusPass('uiDesignSignoff', section)) {
    return;
  }
  if (!hasText(section.reviewer)) {
    block('uiDesignSignoff.reviewer', 'manual reviewer name or role must be recorded');
  }
  const pages = asArray(section.pages);
  const rowsByPage = new Map(pages.map((page) => [page.page, page]));
  for (const pageName of expectedDesignPages) {
    const page = rowsByPage.get(pageName);
    if (!page) {
      block(`uiDesignSignoff.pages.${pageName}`, '22-page design signoff row is missing');
      continue;
    }
    if (page.status !== 'PASS') {
      block(`uiDesignSignoff.pages.${pageName}`, `status must be PASS, got ${page.status ?? 'missing'}`);
    }
    if (!hasText(page.designReference)) {
      block(`uiDesignSignoff.pages.${pageName}.designReference`, 'design reference path/name must be recorded');
    }
    assertEvidenceFiles(`uiDesignSignoff.pages.${pageName}.screenshot`, [page.screenshot]);
  }
}

function validateRealDeviceSmoke(evidence) {
  const section = evidence.realDeviceSmoke;
  if (!assertStatusPass('realDeviceSmoke', section)) {
    return;
  }
  const devices = asArray(section.devices);
  const hasAndroid = devices.some((device) => String(device.platform).toLowerCase() === 'android' && device.status === 'PASS');
  const hasIos = devices.some((device) => ['ios', 'iphone'].includes(String(device.platform).toLowerCase()) && device.status === 'PASS');
  if (!hasAndroid) {
    block('realDeviceSmoke.devices.android', 'at least one Android device must pass');
  }
  if (!hasIos) {
    block('realDeviceSmoke.devices.ios', 'at least one iPhone/iOS device must pass');
  }
  for (const [index, device] of devices.entries()) {
    if (device.status !== 'PASS') {
      block(`realDeviceSmoke.devices[${index}]`, `status must be PASS, got ${device.status ?? 'missing'}`);
    }
    if (!hasText(device.model) || !hasText(device.wechatVersion)) {
      block(`realDeviceSmoke.devices[${index}]`, 'model and WeChat version must be recorded');
    }
    assertEvidenceFiles(`realDeviceSmoke.devices[${index}].evidence`, [...asArray(device.screenshots), ...asArray(device.logs)]);
  }
}

function validatePerformanceSmoke(evidence) {
  const section = evidence.performanceSmoke;
  if (!assertStatusPass('performanceSmoke', section)) {
    return;
  }
  if (typeof section.averageFpsMin !== 'number' || section.averageFpsMin < 30) {
    block('performanceSmoke.averageFpsMin', 'average FPS floor must be recorded and at least 30');
  }
  if (typeof section.peakMemoryMbMax !== 'number' || section.peakMemoryMbMax <= 0) {
    block('performanceSmoke.peakMemoryMbMax', 'peak memory MB must be recorded');
  }
  if (typeof section.coldStartMsMax !== 'number' || section.coldStartMsMax <= 0) {
    block('performanceSmoke.coldStartMsMax', 'cold start time must be recorded');
  }
  assertEvidenceFiles('performanceSmoke.evidence', section.evidence);
}

if (!fs.existsSync(templatePath)) {
  fail(`Missing launch evidence template: ${rel(templatePath)}`);
}

if (!fs.existsSync(evidencePath)) {
  block('launch_evidence.json', `create ${rel(evidencePath)} from ${rel(templatePath)} after WeChat DevTools, design signoff, and device QA are complete`);
} else if (failures.length === 0) {
  const evidence = readJson(evidencePath);
  if (evidence.schemaVersion !== 1) {
    fail('launch_evidence.json schemaVersion must be 1');
  }
  if (evidence.generatedFromBuild !== 'build/wechatgame') {
    block('generatedFromBuild', 'must be build/wechatgame');
  }
  validateWechatDevToolsImport(evidence);
  validateFullLoopRuntime(evidence);
  validateUiDesignSignoff(evidence);
  validateRealDeviceSmoke(evidence);
  validatePerformanceSmoke(evidence);
}

for (const row of blockedEvidence) {
  console.error(`[launch-evidence] BLOCKED_EVIDENCE ${row}`);
}

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(`[launch-evidence] FAIL ${failure}`);
  }
  process.exit(1);
}

console.log(`[launch-evidence] CODE PASS blockedEvidence=${blockedEvidence.length} finalMode=${finalMode ? 'on' : 'off'}`);
