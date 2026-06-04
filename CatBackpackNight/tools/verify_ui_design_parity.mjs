import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const workspaceRoot = path.resolve(projectRoot, '..');
const screenshotDir = path.join(projectRoot, 'tmp', 'final_mobile_pages_after_ui_pass');
const screenshotFreshnessSources = [
  'assets/scripts/ui/UISkeletonBuilder.ts',
  'assets/scripts/scenes/BattleSceneEntry.ts',
  'assets/scripts/game/BattleSessionModel.ts',
  'assets/scripts/game/GameEvents.ts',
  'assets/scripts/game/GameConfigRepository.ts',
  'assets/scripts/configs/RouteConfig.ts',
  'assets/configs/levels.json',
  'tools/refresh_cocos_preview_ui_chunk.mjs',
].map((relativePath) => path.join(projectRoot, relativePath));
const expectedScreenshots = [
  '01_login.png',
  '02_home.png',
  '03_battle_prepare.png',
  '04_battle.png',
  '05_pause_modal.png',
  '06_skill_choice.png',
  '07_victory.png',
  '08_defeat.png',
  '09_backpack.png',
  '10_merge_guide.png',
  '11_shop.png',
  '12_pet.png',
  '13_pet_detail.png',
  '14_talent.png',
  '15_daily_task.png',
  '16_achievement.png',
  '17_mail.png',
  '18_mail_detail.png',
  '19_settings.png',
  '20_policy_modal.png',
  '21_confirm_modal.png',
  '22_toast_modal.png',
];
const parityScripts = [
  'audit_design_reference.mjs',
  'verify_login_design_parity.mjs',
  'verify_home_design_parity.mjs',
  'verify_battle_prepare_design_parity.mjs',
  'verify_battle_design_parity.mjs',
  'verify_modal_result_design_parity.mjs',
  'verify_inventory_shop_pet_design_parity.mjs',
  'verify_system_modal_design_parity.mjs',
];
const minScreenshotWidth = 720;
const minScreenshotHeight = 1280;
const targetPortraitAspect = 750 / 1334;
const aspectTolerance = 0.02;
const failures = [];
const newestFreshnessSourceMs = Math.max(...screenshotFreshnessSources.map((filePath) => fs.statSync(filePath).mtimeMs));

function fail(message) {
  failures.push(message);
}

function pngSize(filePath) {
  const bytes = fs.readFileSync(filePath);
  if (bytes.length < 24 || bytes.toString('ascii', 1, 4) !== 'PNG') {
    return null;
  }
  return {
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
  };
}

for (const scriptName of parityScripts) {
  const scriptPath = path.join(projectRoot, 'tools', scriptName);
  if (!fs.existsSync(scriptPath)) {
    fail(`Missing design parity script: tools/${scriptName}`);
    continue;
  }
  const result = spawnSync(process.execPath, [scriptPath], {
    cwd: projectRoot,
    encoding: 'utf8',
  });
  if (result.stdout.trim()) {
    console.log(result.stdout.trim());
  }
  if (result.stderr.trim()) {
    console.error(result.stderr.trim());
  }
  if (result.status !== 0) {
    fail(`Design parity script failed: tools/${scriptName}`);
  }
}

if (!fs.existsSync(screenshotDir)) {
  fail(`Missing screenshot evidence directory: ${path.relative(workspaceRoot, screenshotDir)}`);
} else {
  const screenshotNames = new Set(fs.readdirSync(screenshotDir).filter((name) => /\.png$/i.test(name)));
  for (const screenshotName of expectedScreenshots) {
    const screenshotPath = path.join(screenshotDir, screenshotName);
    if (!screenshotNames.has(screenshotName)) {
      fail(`Missing 22-page screenshot evidence: ${path.relative(projectRoot, screenshotPath)}`);
      continue;
    }
    const size = pngSize(screenshotPath);
    if (!size) {
      fail(`Screenshot evidence is not a valid PNG: ${path.relative(projectRoot, screenshotPath)}`);
      continue;
    }
    if (size.width < minScreenshotWidth || size.height < minScreenshotHeight) {
      fail(
        `Screenshot evidence must be at least ${minScreenshotWidth}x${minScreenshotHeight}: ${path.relative(projectRoot, screenshotPath)} is ${size.width}x${size.height}`,
      );
    }
    const aspect = size.width / size.height;
    if (Math.abs(aspect - targetPortraitAspect) > aspectTolerance) {
      fail(`Screenshot evidence must use the 9:16 portrait launch aspect: ${path.relative(projectRoot, screenshotPath)} is ${size.width}x${size.height}`);
    }
    const byteSize = fs.statSync(screenshotPath).size;
    if (byteSize < 100_000) {
      fail(`Screenshot evidence is suspiciously small: ${path.relative(projectRoot, screenshotPath)} has ${byteSize} bytes`);
    }
    if (fs.statSync(screenshotPath).mtimeMs < newestFreshnessSourceMs) {
      fail(`Screenshot evidence is stale and must be recaptured after UI/source changes: ${path.relative(projectRoot, screenshotPath)}`);
    }
  }
}

if (failures.length > 0) {
  console.error('[ui-design-parity] FAIL');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`[ui-design-parity] PASS ${expectedScreenshots.length}/22 screenshots and ${parityScripts.length} static parity scripts verified.`);
