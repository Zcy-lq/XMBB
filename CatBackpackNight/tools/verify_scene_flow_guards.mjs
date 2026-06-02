import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const facadePath = path.join(projectRoot, 'assets', 'scripts', 'game', 'GameLogicFacade.ts');
const uiBuilderPath = path.join(projectRoot, 'assets', 'scripts', 'ui', 'UISkeletonBuilder.ts');
const battleScenePath = path.join(projectRoot, 'assets', 'scripts', 'scenes', 'BattleSceneEntry.ts');
const baseScenePath = path.join(projectRoot, 'assets', 'scripts', 'scenes', 'BaseSceneEntry.ts');
const homeScenePath = path.join(projectRoot, 'assets', 'scripts', 'scenes', 'HomeSceneEntry.ts');
const uiManagerPath = path.join(projectRoot, 'assets', 'scripts', 'ui', 'UIManager.ts');
const runtimeSpriteLoaderPath = path.join(projectRoot, 'assets', 'scripts', 'ui', 'RuntimeSpriteLoader.ts');
const homeSceneAssetPath = path.join(projectRoot, 'assets', 'scenes', 'Home.scene');
const levelsPath = path.join(projectRoot, 'assets', 'configs', 'levels.json');
const runtimeQualityPath = path.join(projectRoot, 'assets', 'configs', 'runtime_asset_quality.json');
const assetReviewCenterPath = path.join(projectRoot, 'assets', 'configs', 'asset_review_center.json');
const assetReviewToolPath = path.join(projectRoot, 'tools', 'asset_review_center.mjs');
const packagePath = path.join(projectRoot, 'package.json');
const defaultSavePath = path.join(projectRoot, 'assets', 'scripts', 'data', 'DefaultSave.ts');
const saveManagerPath = path.join(projectRoot, 'assets', 'scripts', 'core', 'SaveManager.ts');
const redDotManagerPath = path.join(projectRoot, 'assets', 'scripts', 'core', 'RedDotManager.ts');
const defaultRedDotRulesPath = path.join(projectRoot, 'assets', 'scripts', 'core', 'DefaultRedDotRules.ts');
const dailyResetSystemPath = path.join(projectRoot, 'assets', 'scripts', 'game', 'DailyResetSystem.ts');
const fullLoopAcceptancePath = path.join(projectRoot, 'tools', 'verify_full_loop_acceptance.ts');
const wechatBuildOutputPath = path.join(projectRoot, 'tools', 'verify_wechat_build_output.mjs');
const uiDesignParityPath = path.join(projectRoot, 'tools', 'verify_ui_design_parity.mjs');
const pageFunctionCoveragePath = path.join(projectRoot, 'tools', 'verify_page_function_coverage.mjs');
const mobileResiliencePath = path.join(projectRoot, 'tools', 'verify_mobile_resilience_contracts.mjs');
const releaseCompliancePath = path.join(projectRoot, 'tools', 'verify_release_compliance.mjs');
const launchEvidencePath = path.join(projectRoot, 'tools', 'verify_launch_evidence.mjs');
const previewImportMapPath = path.join(projectRoot, 'temp', 'programming', 'packer-driver', 'targets', 'preview', 'import-map.json');

const failures = [];

function fail(message) {
  failures.push(message);
}

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function readPngSize(filePath) {
  const bytes = fs.readFileSync(filePath);
  if (bytes.length < 24 || bytes.toString('ascii', 1, 4) !== 'PNG') {
    fail(`Invalid PNG file: ${path.relative(projectRoot, filePath)}`);
    return null;
  }
  return {
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
  };
}

function readPngRgba(filePath) {
  const bytes = fs.readFileSync(filePath);
  const width = bytes.readUInt32BE(16);
  const height = bytes.readUInt32BE(20);
  let bitDepth = 0;
  let colorType = 0;
  const idatChunks = [];
  let offset = 8;

  while (offset + 12 <= bytes.length) {
    const length = bytes.readUInt32BE(offset);
    const type = bytes.toString('ascii', offset + 4, offset + 8);
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;
    if (type === 'IHDR') {
      bitDepth = bytes[dataStart + 8];
      colorType = bytes[dataStart + 9];
    } else if (type === 'IDAT') {
      idatChunks.push(bytes.subarray(dataStart, dataEnd));
    } else if (type === 'IEND') {
      break;
    }
    offset = dataEnd + 4;
  }

  if (bitDepth !== 8 || colorType !== 6) {
    fail(`Unsupported PNG format for chroma-key transparency check: ${path.relative(projectRoot, filePath)}`);
    return null;
  }

  const inflated = zlib.inflateSync(Buffer.concat(idatChunks));
  const bytesPerPixel = 4;
  const stride = width * bytesPerPixel;
  const rgba = Buffer.alloc(height * stride);
  let sourceOffset = 0;

  for (let y = 0; y < height; y += 1) {
    const filter = inflated[sourceOffset];
    sourceOffset += 1;
    const rowOffset = y * stride;
    const previousRowOffset = rowOffset - stride;
    for (let x = 0; x < stride; x += 1) {
      const raw = inflated[sourceOffset + x];
      const left = x >= bytesPerPixel ? rgba[rowOffset + x - bytesPerPixel] : 0;
      const up = y > 0 ? rgba[previousRowOffset + x] : 0;
      const upLeft = y > 0 && x >= bytesPerPixel ? rgba[previousRowOffset + x - bytesPerPixel] : 0;
      let value = raw;
      if (filter === 1) {
        value = raw + left;
      } else if (filter === 2) {
        value = raw + up;
      } else if (filter === 3) {
        value = raw + Math.floor((left + up) / 2);
      } else if (filter === 4) {
        const p = left + up - upLeft;
        const pa = Math.abs(p - left);
        const pb = Math.abs(p - up);
        const pc = Math.abs(p - upLeft);
        value = raw + (pa <= pb && pa <= pc ? left : pb <= pc ? up : upLeft);
      } else if (filter !== 0) {
        fail(`Unsupported PNG filter ${filter} in ${path.relative(projectRoot, filePath)}`);
        return null;
      }
      rgba[rowOffset + x] = value & 0xff;
    }
    sourceOffset += stride;
  }

  return { width, height, rgba };
}

function countOpaqueChromaGreenPixels(filePath) {
  const image = readPngRgba(filePath);
  if (!image) {
    return 0;
  }

  let count = 0;
  for (let index = 0; index < image.rgba.length; index += 4) {
    const r = image.rgba[index];
    const g = image.rgba[index + 1];
    const b = image.rgba[index + 2];
    const a = image.rgba[index + 3];
    if (a > 48 && g > 160 && r < 125 && b < 125 && g > r + 55 && g > b + 55) {
      count += 1;
    }
  }
  return count;
}

function countOpaqueNearBlackPixels(filePath) {
  const image = readPngRgba(filePath);
  if (!image) {
    return 0;
  }

  let count = 0;
  for (let index = 0; index < image.rgba.length; index += 4) {
    const r = image.rgba[index];
    const g = image.rgba[index + 1];
    const b = image.rgba[index + 2];
    const a = image.rgba[index + 3];
    if (a > 48 && r < 4 && g < 4 && b < 4) {
      count += 1;
    }
  }
  return count;
}

function readRuntimeSpriteUuid(id) {
  const metaPath = path.join(projectRoot, 'assets', 'textures', 'runtime', `${id}.png.meta`);
  if (!fs.existsSync(metaPath)) {
    fail(`Missing runtime sprite meta: ${path.relative(projectRoot, metaPath)}`);
    return null;
  }

  const meta = JSON.parse(read(metaPath));
  return meta?.subMetas?.['6c48a']?.uuid ?? null;
}

function findMojibakeTokens(source) {
  const mojibakeTokens = [
    '鍟嗗簵',
    '鑳屽寘',
    '瀹犵墿',
    '浣撳姏',
    '鎺ㄨ崘',
    '鎴樺姏',
    '閽荤煶',
    '钃濋捇',
    '鐚?',
    '鉁?',
    '鈴?',
    '鈿?',
    '鈽?',
    '锛?',
    '銆',
    '榛戝',
    '涓荤晫闈?',
    '鐜╁鍚嶅瓧',
    '瀹堝',
    '钀ュ',
    '娆㈣',
    '闅愮',
    '闃呰',
    '骞垮',
    '鏈€',
    '绱',
    '娓告',
    '閫氬',
    '鏄熺',
    '鐔婄',
    '灏忛',
    '鍏',
  ];
  const found = mojibakeTokens.filter((token) => source.includes(token));
  if (/[\ue000-\uf8ff\ufffd]/u.test(source)) {
    found.push('private-use-or-replacement-character');
  }
  return found;
}

function readActivePreviewChunkForSource(sourceRelativePath) {
  if (!fs.existsSync(previewImportMapPath)) {
    return null;
  }

  const importMap = JSON.parse(read(previewImportMapPath));
  const sourceKey = sourceRelativePath.replace(/\\/g, '/');
  const hit = Object.entries(importMap.imports ?? {}).find(([key]) => key.replace(/\\/g, '/').endsWith(sourceKey));
  if (!hit) {
    return null;
  }

  return path.resolve(path.dirname(previewImportMapPath), hit[1]);
}

function collectPreviewChunkValues(node, values = new Set()) {
  if (!node || typeof node !== 'object') {
    return values;
  }

  for (const value of Object.values(node)) {
    if (typeof value === 'string') {
      if (value.startsWith('./chunks/') && value.endsWith('.js')) {
        values.add(value);
      }
    } else {
      collectPreviewChunkValues(value, values);
    }
  }

  return values;
}

function readMappedPreviewUiChunks() {
  if (!fs.existsSync(previewImportMapPath)) {
    return [];
  }

  const importMap = JSON.parse(read(previewImportMapPath));
  return [...collectPreviewChunkValues(importMap)]
    .map((chunkValue) => path.resolve(path.dirname(previewImportMapPath), chunkValue))
    .filter((chunkPath) => {
      if (!fs.existsSync(chunkPath)) {
        return false;
      }

      const chunkSource = read(chunkPath);
      return chunkSource.includes('UISkeletonBuilder') && chunkSource.includes('Battle_HPBar');
    });
}

for (const filePath of [facadePath, uiBuilderPath, battleScenePath, baseScenePath, homeScenePath, uiManagerPath, runtimeSpriteLoaderPath, homeSceneAssetPath, levelsPath, runtimeQualityPath, assetReviewCenterPath, assetReviewToolPath, packagePath, defaultSavePath, saveManagerPath, redDotManagerPath, defaultRedDotRulesPath, dailyResetSystemPath, fullLoopAcceptancePath, wechatBuildOutputPath, uiDesignParityPath, pageFunctionCoveragePath, mobileResiliencePath, releaseCompliancePath, launchEvidencePath]) {
  if (!fs.existsSync(filePath)) {
    fail(`Missing required file: ${path.relative(projectRoot, filePath)}`);
  }
}

if (failures.length === 0) {
  const facade = read(facadePath);
  const uiBuilder = read(uiBuilderPath);
  const battleScene = read(battleScenePath);
  const baseScene = read(baseScenePath);
  const homeScene = read(homeScenePath);
  const uiManager = read(uiManagerPath);
  const runtimeSpriteLoader = read(runtimeSpriteLoaderPath);
  const runtimeSpriteAssets = read(path.join(projectRoot, 'assets', 'scripts', 'ui', 'RuntimeSpriteAssets.ts'));
  const homeSceneAsset = read(homeSceneAssetPath);
  const levels = JSON.parse(read(levelsPath));
  const runtimeQuality = JSON.parse(read(runtimeQualityPath));
  const assetReviewCenter = JSON.parse(read(assetReviewCenterPath));
  const packageJson = JSON.parse(read(packagePath));
  const defaultSave = read(defaultSavePath);
  const saveManager = read(saveManagerPath);
  const redDotManager = read(redDotManagerPath);
  const defaultRedDotRules = read(defaultRedDotRulesPath);
  const dailyResetSystem = read(dailyResetSystemPath);
  const fullLoopAcceptance = read(fullLoopAcceptancePath);
  const wechatBuildOutput = read(wechatBuildOutputPath);
  const uiDesignParity = read(uiDesignParityPath);
  const pageFunctionCoverage = read(pageFunctionCoveragePath);
  const mobileResilience = read(mobileResiliencePath);
  const releaseCompliance = read(releaseCompliancePath);
  const launchEvidence = read(launchEvidencePath);

  for (const [label, source] of Object.entries({
    'UISkeletonBuilder.ts': uiBuilder,
    'BattleSceneEntry.ts': battleScene,
    'DefaultSave.ts': defaultSave,
    'levels.json': read(levelsPath),
    'package.json': read(packagePath),
  })) {
    const badTokens = findMojibakeTokens(source);
    if (badTokens.length > 0) {
      fail(`${label} contains mojibake in visible player-facing text: ${badTokens.join(', ')}`);
    }
  }

  if (!saveManager.includes('refreshDailySaveIfNeeded(this.saveData')) {
    fail('SaveManager must use the testable DailyResetSystem helper for daily refresh logic.');
  }

  for (const dailyResetToken of ['shopPurchaseCounts: {}', 'adPlacementCounts: {}', "progress: task.id === 'daily_login' ? 1 : 0"]) {
    if (!dailyResetSystem.includes(dailyResetToken)) {
      fail(`DailyResetSystem is missing required reset behavior: ${dailyResetToken}`);
    }
  }

  if (!redDotManager.includes('createDefaultRedDotRules()')) {
    fail('RedDotManager must register config-backed default red dot rules.');
  }

  for (const redDotToken of ['achievementTargets', 'dailyTaskTargets', 'calculateDefaultRedDots', 'config.requires.every']) {
    if (!defaultRedDotRules.includes(redDotToken)) {
      fail(`DefaultRedDotRules is missing required launch red-dot behavior: ${redDotToken}`);
    }
  }

  if (/achievement\.progress\s*>\s*0/.test(defaultRedDotRules) || /achievement\.progress\s*>\s*0/.test(redDotManager)) {
    fail('Achievement red dots must wait for the configured target threshold, not any partial progress.');
  }

  const previewUiChunks = new Set(readMappedPreviewUiChunks());
  const activePreviewUiChunk = readActivePreviewChunkForSource('assets/scripts/ui/UISkeletonBuilder.ts');
  if (activePreviewUiChunk && fs.existsSync(activePreviewUiChunk)) {
    previewUiChunks.add(activePreviewUiChunk);
  }

  for (const activePreviewUiChunk of previewUiChunks) {
    const sourceMtime = fs.statSync(uiBuilderPath).mtimeMs;
    const chunkMtime = fs.statSync(activePreviewUiChunk).mtimeMs;
    const activePreviewUiChunkSource = read(activePreviewUiChunk);
    const badPreviewTokens = findMojibakeTokens(activePreviewUiChunkSource);
    const chunkLabel = path.relative(projectRoot, activePreviewUiChunk);

    if (chunkMtime + 1000 < sourceMtime) {
      fail(`Mapped Cocos preview UISkeletonBuilder chunk is older than source: ${chunkLabel}. Rebuild Browser Preview before judging the home page.`);
    }

    if (badPreviewTokens.length > 0) {
      fail(`Mapped Cocos preview UISkeletonBuilder chunk contains mojibake: ${badPreviewTokens.join(', ')}. Rebuild Browser Preview before judging the home page.`);
    }

    if (!activePreviewUiChunkSource.includes("this.addProgressBar('Battle_HPBar', 30, 487, 300, 32")) {
      fail(`Mapped Cocos preview UISkeletonBuilder chunk has stale Battle_HPBar placement: ${chunkLabel}. Run npm run refresh:preview-ui.`);
    }

    if (!activePreviewUiChunkSource.includes("this.replaceProgressFill('Battle_HPBar', 30, 487, 300, 32")) {
      fail(`Mapped Cocos preview UISkeletonBuilder chunk has stale Battle_HPBar live update placement: ${chunkLabel}. Run npm run refresh:preview-ui.`);
    }

    if (!activePreviewUiChunkSource.includes("const fillX = name === 'Battle_HPBar' ? x : x - width / 2 + 4 + fillWidth / 2;")) {
      fail(`Mapped Cocos preview UISkeletonBuilder chunk has stale Battle_HPBar fill centering: ${chunkLabel}. Run npm run refresh:preview-ui.`);
    }
  }

  if (!facade.includes('private activeBattleStart: BattleStartResult | null = null;')) {
    fail('GameLogicFacade must track activeBattleStart.');
  }

  if (!/private commit<T>\([^)]*\)[\s\S]*?const draft = cloneSave\(this\.getPreparedSnapshot\(\)\);[\s\S]*?const result = updater\(draft\);[\s\S]*?if \(!result\.ok\) \{[\s\S]*?return result;[\s\S]*?this\.saveManager\.replace\(draft, reason\);/.test(facade)) {
    fail('GameLogicFacade.commit must clone the save, return failed results before replace, and replace only after success.');
  }

  if (!/public startBattle\([^)]*\)[\s\S]*?if \(this\.activeBattleStart\)[\s\S]*?return success\(this\.activeBattleStart/.test(facade)) {
    fail('GameLogicFacade.startBattle must return the active battle instead of charging energy twice.');
  }

  if (!/public createBattleSession\([^)]*\)[\s\S]*?battleId: options\.battleId \?\? this\.activeBattleStart\?\.battleId/.test(facade)) {
    fail('GameLogicFacade.createBattleSession must reuse the active battleId.');
  }

  if (!battleScene.includes('const existingBattle = gameLogic.getActiveBattleStart();')) {
    fail('BattleSceneEntry must inspect active battle state before creating a session.');
  }

  if (!battleScene.includes('gameLogic.clearActiveBattle(battleId);')) {
    fail('BattleSceneEntry must clear active battle after successful settlement.');
  }

  if (!battleScene.includes('this.uiManager?.updateBattleState(this.session.state);')) {
    fail('BattleSceneEntry must push live BattleSessionState into UI every battle tick.');
  }

  if (!/protected update\(deltaSec: number\): void[\s\S]*?this\.tickBattle\(deltaSec\)/.test(battleScene)) {
    fail('BattleSceneEntry must drive battle simulation from Component.update(deltaSec); zero-interval schedule can stall in preview.');
  }

  if (battleScene.includes('this.schedule(this.battleTick, 0);')) {
    fail('BattleSceneEntry must not use schedule(..., 0) for the main battle loop.');
  }

  if (homeSceneAsset.includes('"screenKey": "battlePrepare"') || homeSceneAsset.includes('BattlePrepareSceneEntry')) {
    fail('Home.scene must not include BattlePrepareSceneEntry; it causes preview battle screens to render without BattleSceneEntry ticking.');
  }

  if (!baseScene.includes("import { getRouteConfig } from '../configs/RouteConfig';")) {
    fail('BaseSceneEntry must inspect route configs before honoring ?screen preview overrides.');
  }

  if (!/requestedScreenKey !== this\.screenKey[\s\S]*?getRouteConfig\(requestedScreenKey\)[\s\S]*?SceneRouter\.instance\.replace\(requestedScreenKey/.test(baseScene)) {
    fail('BaseSceneEntry must route ?screen=battle to the matching scene instead of drawing battle UI inside the wrong scene.');
  }

  if (!baseScene.includes('__xmbbPreviewScreenConsumed')) {
    fail('BaseSceneEntry must consume ?screen preview overrides only once so button navigation is not forced back to the preview route.');
  }

  if (!uiManager.includes('public updateBattleState(state: BattleSessionState): void')) {
    fail('UIManager must expose updateBattleState for live battle rendering.');
  }

  if (!uiManager.includes('this.skeletonBuilder?.setBattleState(state);')) {
    fail('UIManager.updateBattleState must forward state to UISkeletonBuilder.');
  }

  if (!/eventBus\.on\(GameEvents\.Toast[\s\S]*?this\.renderToast/.test(uiManager)) {
    fail('UIManager must render GameEvents.Toast visibly instead of logging only.');
  }

  if (!/private renderToast\(message: string\): void[\s\S]*?Toast_Message[\s\S]*?Label/.test(uiManager)) {
    fail('UIManager must create a visible toast label for blocked actions such as insufficient energy.');
  }

  if (/openBattlePrepare\(\)[\s\S]*?currencies\.energy <[\s\S]*?return;[\s\S]*?SceneRouter\.instance\.go\('battlePrepare'\)/.test(homeScene)) {
    fail('HomeSceneEntry.openBattlePrepare must always open the prepare page; energy is checked when starting battle.');
  }

  for (const battleUiToken of [
    'private battleState: BattleSessionState | null = null;',
    'private battleLiveLayer: Node | null = null;',
    'public setBattleState(state: BattleSessionState): void',
    'private updateBattleLiveState(): void',
    'private getBattleLiveLayer(): Node',
    'const battleState = this.battleState',
    'battleState.secondsLeft',
    'battleState.campHp',
    'battleState.monsters',
    'battleState.damageNumbers',
    'battleState.attackVisuals',
    'battleState.weaponSlots',
    'this.syncBattleMonster',
    'this.syncBattleAttackVisual',
    'this.syncBattleDamageNumber',
    'monster.deathAgeSec',
  ]) {
    if (!uiBuilder.includes(battleUiToken)) {
      fail(`Battle UI must render live session data instead of static art: ${battleUiToken}`);
    }
  }

  for (const staleBattleLiteral of ["label: '第10波'", "value: '132'", "value: '339'", "label: '⏱ 00:45'", "label: '10 / 10'"]) {
    if (uiBuilder.includes(staleBattleLiteral)) {
      fail(`Battle UI still contains stale static combat literal: ${staleBattleLiteral}`);
    }
  }

  if (!uiBuilder.includes("this.addRect({ name: 'Battle_HPHeart', width: 58, height: 58, x: -160, y: 487")) {
    fail('Battle_HPHeart must stay inside the compact battle HUD instead of sitting in the left safe-area gutter.');
  }

  if (!uiBuilder.includes("this.addProgressBar('Battle_HPBar', 30, 487, 300, 32")) {
    fail('Battle_HPBar must be a compact centered HUD bar; a full-width bar spills into the battle side gutter.');
  }

  if (!uiBuilder.includes("this.replaceProgressFill('Battle_HPBar', 30, 487, 300, 32")) {
    fail('Battle_HPBar live fill updates must use the same compact HUD position as the static bar.');
  }

  if (!uiBuilder.includes("const fillX = name === 'Battle_HPBar' ? x : x - width / 2 + 4 + fillWidth / 2;")) {
    fail('Battle_HPBar fill must stay centered so low HP values do not render a loose bar in the left battle gutter.');
  }

  const setBattleStateStart = uiBuilder.indexOf('public setBattleState(state: BattleSessionState): void');
  const setBattleStateEnd = uiBuilder.indexOf('\n\n  private buildLogin', setBattleStateStart);
  const setBattleStateBody = setBattleStateStart >= 0 && setBattleStateEnd > setBattleStateStart
    ? uiBuilder.slice(setBattleStateStart, setBattleStateEnd)
    : '';
  if (setBattleStateBody.includes('this.rebuild();')) {
    fail('UISkeletonBuilder.setBattleState must not rebuild the whole battle screen; it must update a live layer to prevent flashing.');
  }

  const updateBattleLiveStart = uiBuilder.indexOf('private updateBattleLiveState(): void');
  const updateBattleLiveEnd = uiBuilder.indexOf('\n\n  private getBattleLiveLayer', updateBattleLiveStart);
  const updateBattleLiveBody = updateBattleLiveStart >= 0 && updateBattleLiveEnd > updateBattleLiveStart
    ? uiBuilder.slice(updateBattleLiveStart, updateBattleLiveEnd)
    : '';
  if (updateBattleLiveBody.includes('removeAllChildren')) {
    fail('UISkeletonBuilder.updateBattleLiveState must not clear and recreate the whole live layer every tick; that causes visible flashing.');
  }

  for (const liveSyncToken of [
    'private syncBattleHero',
    'private syncBattleMonster',
    'private syncBattleAttackVisual',
    'private syncBattleDamageNumber',
    'private syncLiveRect',
    'private pruneBattleLiveLayer',
  ]) {
    if (!uiBuilder.includes(liveSyncToken)) {
      fail(`Battle live UI must update persistent moving nodes: ${liveSyncToken}`);
    }
  }

  for (const battleEffectToken of [
    'BattleAttackVisualState',
    'attackVisuals: BattleAttackVisualState[]',
    "type: 'spawn' | 'attack' | 'damage'",
    'weaponType: BattleWeaponType',
    'private pushAttackVisual',
    'private updateAttackVisuals',
    'Battle_Attack_Slash',
    'Battle_Attack_Arrow',
    'Battle_Attack_Staff',
    'Battle_Attack_Pierce',
    'Battle_Attack_Random',
    '_MuzzleFlash',
    '_FlightTrail',
    'hitProgress',
    'getBattleHeroAttackImpulse',
    'getBattleMonsterHitImpulse',
    'rt_fx_bullet',
    'rt_fx_hit',
    'rt_monster_ghost',
    'rt_monster_skeleton',
    'rt_monster_goblin',
  ]) {
    if (!uiBuilder.includes(battleEffectToken) && !read(path.join(projectRoot, 'assets', 'scripts', 'game', 'BattleSessionModel.ts')).includes(battleEffectToken)) {
      fail(`Battle runtime must include independent weapon and monster effects: ${battleEffectToken}`);
    }
  }

  for (const runtimeLoaderToken of [
    "import runtimeAssetIndex from '../../configs/assets_runtime.json';",
    'finalPath?: string',
    'runtimeAssetPathById',
    'loadRuntimeSpriteFrameFromPath',
    'assetManager.loadRemote<ImageAsset>',
  ]) {
    if (!runtimeSpriteLoader.includes(runtimeLoaderToken)) {
      fail(`RuntimeSpriteLoader must fall back to PNG finalPath for freshly generated runtime battle assets: ${runtimeLoaderToken}`);
    }
  }

  for (const id of [
    'rt_bg_battle_forest_safe',
    'rt_bg_battle_prepare_safe',
    'rt_cat_hero_battle',
    'rt_monster_ghost',
    'rt_monster_skeleton',
    'rt_monster_goblin',
    'rt_fx_bullet',
    'rt_fx_slash',
    'rt_fx_pierce',
    'rt_fx_magic_orb',
    'rt_fx_hit',
    'rt_fx_fire',
  ]) {
    const uuid = readRuntimeSpriteUuid(id);
    if (uuid && !runtimeSpriteAssets.includes(`"${id}": "${uuid}"`)) {
      fail(`RuntimeSpriteAssets must match current .meta UUID for ${id}: ${uuid}`);
    }
  }

  for (const id of [
    'rt_monster_ghost',
    'rt_monster_skeleton',
    'rt_monster_goblin',
    'rt_fx_bullet',
    'rt_fx_slash',
    'rt_fx_pierce',
    'rt_fx_magic_orb',
    'rt_fx_hit',
    'rt_fx_fire',
  ]) {
    const filePath = path.join(projectRoot, 'assets', 'textures', 'runtime', `${id}.png`);
    const chromaPixels = countOpaqueChromaGreenPixels(filePath);
    if (chromaPixels > 32) {
      fail(`Battle runtime asset still contains opaque chroma-key green pixels: ${id} (${chromaPixels})`);
    }
    const blackPixels = countOpaqueNearBlackPixels(filePath);
    if (blackPixels > 4096) {
      fail(`Battle runtime asset still contains opaque keyed-out black background pixels: ${id} (${blackPixels})`);
    }
  }

  if (battleScene.includes('uiRefreshTimer')) {
    fail('BattleSceneEntry must push live UI state every Component.update instead of throttling movement into visible jumps.');
  }

  if (!battleScene.includes('this.uiManager?.updateBattleState(this.session.state);')) {
    fail('BattleSceneEntry must push each battle tick to UIManager for continuous movement.');
  }

  if (!facade.includes('this.repo.getBattleEnergyCost()')) {
    fail('GameLogicFacade battle preparation must expose development unlimited-energy cost.');
  }

  if (!read(path.join(projectRoot, 'assets', 'configs', 'levels.json')).includes('"unlimitedEnergyInDevelopment": true')) {
    fail('levels.json must keep development unlimited energy enabled until production balancing is restored.');
  }

  for (const dynamicBattleName of [
    "name.includes('Battle_Monster')",
    "name.includes('Battle_MonsterHp')",
    "name.includes('Battle_Damage')",
    "name.includes('Battle_HPBar_Fill')",
    "name.includes('BattleWeapon_Live') && !name.includes('rt_battle_weapon_')",
  ]) {
    if (!uiBuilder.includes(dynamicBattleName)) {
      fail(`UISkeletonBuilder runtime sprite resolver must exempt live battle primitives: ${dynamicBattleName}`);
    }
  }

  if (!uiBuilder.includes("if (name.includes('Pet_SelectedCat_Sprite')) return 'rt_avatar_cat';")) {
    fail('Pet screen selected character must resolve to a production runtime cat sprite instead of an empty placeholder card.');
  }

  if (!uiBuilder.includes("if (name.includes('Pet_Icon_')) return 'rt_avatar_cat';")) {
    fail('Pet list cards must use a runtime pet/avatar sprite so the page is not text-only.');
  }

  for (const petScreenSnippet of ['Pet_SelectedPortraitFrame', 'Pet_ListTitle', 'Pet_CardState_', '出战中']) {
    if (!uiBuilder.includes(petScreenSnippet)) {
      fail(`Pet screen must include readable polished card/list state: ${petScreenSnippet}`);
    }
  }

  for (const routePanelMapping of [
    "name.includes('DailyTask_Row_')",
    "name.includes('Mail_Row_')",
    "name.includes('Settings_Row_')",
    "name.includes('Merge_MainPanel')",
    "name.includes('Explore_Card_')",
    "name.includes('Guild_MainPanel')",
    "name.includes('Achievement_Row_')",
    "name.includes('Reward_TitleBanner')",
    "name.includes('SkillCard_')",
  ]) {
    if (!uiBuilder.includes(routePanelMapping)) {
      fail(`Core route panel/card must resolve to a runtime panel asset for visual completeness: ${routePanelMapping}`);
    }
  }

  if (!uiBuilder.includes("if (name.includes('Guild_MascotCat_Sprite')) return 'rt_avatar_cat';")) {
    fail('Guild screen mascot must resolve to a visible runtime avatar sprite.');
  }

  if (uiBuilder.includes("color: card[5] ? UIColors.textBrown : UIColors.whiteText")) {
    fail('Explore locked-card titles must stay dark on parchment runtime cards.');
  }

  if (uiBuilder.includes("card[5] ? new Color(94, 61, 38, 255) : new Color(232, 222, 198, 230)")) {
    fail('Explore locked-card descriptions must stay dark on parchment runtime cards.');
  }

  if (!uiBuilder.includes('RouteBackdrop_${key}_Canopy')) {
    fail('Commercial route polish helper must create a named canopy layer for screenshot/debug inspection.');
  }

  for (const commercialBackdropSnippet of [
    "this.addCommercialRouteBackdrop('Talent')",
    "this.addCommercialRouteBackdrop('DailyTask')",
    "this.addCommercialRouteBackdrop('Mail')",
    "this.addCommercialRouteBackdrop('Settings')",
    "this.addCommercialRouteBackdrop('Merge')",
    "this.addCommercialRouteBackdrop('Explore')",
    "this.addCommercialRouteBackdrop('Guild')",
    "this.addCommercialRouteBackdrop('Achievement')",
    "this.addCommercialRouteBackdrop('Reward')",
    "this.addCommercialRouteBackdrop('SkillChoice')",
  ]) {
    if (!uiBuilder.includes(commercialBackdropSnippet)) {
      fail(`Commercial route polish must include a staged backdrop layer: ${commercialBackdropSnippet}`);
    }
  }

  for (const talentPolishSnippet of [
    'Talent_TreePanel',
    'Talent_PathLine_',
    'Talent_DetailPanel',
    'Talent_NodeDesc_',
    'Button_TalentReset',
  ]) {
    if (!uiBuilder.includes(talentPolishSnippet)) {
      fail(`Talent page must read as a finished talent tree, not scattered labels: ${talentPolishSnippet}`);
    }
  }

  for (const rewardPolishSnippet of [
    'Reward_SummaryPanel',
    'Reward_Card_Gold',
    'Reward_Card_Diamond',
    'Reward_Card_Equip',
    'Reward_DoubleBadge',
  ]) {
    if (!uiBuilder.includes(rewardPolishSnippet)) {
      fail(`Reward page must show concrete reward cards and summary polish: ${rewardPolishSnippet}`);
    }
  }

  for (const skillChoicePolishSnippet of [
    'SkillChoice_Subtitle',
    'SkillChoice_RerollChip',
    '${name}_Rarity',
    '${name}_IconFrame',
    '${name}_Type',
  ]) {
    if (!uiBuilder.includes(skillChoicePolishSnippet)) {
      fail(`Skill-choice page must show polished card hierarchy and reroll state: ${skillChoicePolishSnippet}`);
    }
  }

  const battleFieldIndex = uiBuilder.indexOf("name.includes('Battle_FieldArt')");
  const battlePreviewIndex = uiBuilder.indexOf("name.includes('BattlePrepare_PreviewArt')");
  const panelDarkIndex = uiBuilder.indexOf("name.includes('Battle_') || name.includes('BattlePrepare_')");
  const battleMonsterIndex = uiBuilder.indexOf("name.includes('Battle_Monster')");
  if (battleFieldIndex < 0 || battlePreviewIndex < 0 || battleMonsterIndex < 0) {
    fail('UISkeletonBuilder must contain explicit battle art and live primitive exceptions.');
  } else if (panelDarkIndex >= 0 && !(battleFieldIndex < panelDarkIndex && battlePreviewIndex < panelDarkIndex && battleMonsterIndex < panelDarkIndex)) {
    fail('UISkeletonBuilder battle art and live primitive exceptions must appear before broad battle panel fallback.');
  }

  if (!uiBuilder.includes("import { SceneRouter } from '../core/SceneRouter';")) {
    fail('UISkeletonBuilder must route homepage buttons through SceneRouter.');
  }

  if (!uiBuilder.includes("import { SaveManager } from '../core/SaveManager';")) {
    fail('UISkeletonBuilder login screen must read and persist agreement state through SaveManager.');
  }

  if (!uiBuilder.includes('this.designRoot.setScale(1, 1, 1);')) {
    fail('UISkeletonBuilder must not shrink the design root after Cocos design resolution is applied.');
  }

  if (!uiBuilder.includes('private handleButtonAction(name: string): boolean')) {
    fail('UISkeletonBuilder must keep core homepage actions out of the generic local route fallback.');
  }

  if (/if \(name\.includes\('Button_StartGame'\)\) return 'home';/.test(uiBuilder)) {
    fail('Login start button must not bypass the agreement gate through the generic route fallback.');
  }

  if (!/handleButtonAction\(name: string\)[\s\S]*?Button_StartGame[\s\S]*?acceptedAgreement[\s\S]*?SaveManager\.instance\.setAgreementAccepted\(true\)[\s\S]*?SceneRouter\.instance\.go\('home'\)/.test(uiBuilder)) {
    fail('Login start must enforce agreement acceptance, persist it, and route home only through handleButtonAction.');
  }

  for (const loginNode of [
    'Login_TitleArt',
    'Button_StartGame',
    'Login_AgreementPlate',
    'Button_ToggleAgreement',
    'AgeBadge_16',
    'Login_HealthNotice',
  ]) {
    if (!uiBuilder.includes(loginNode)) {
      fail(`Login screen is missing LOGIN_01 reference node: ${loginNode}`);
    }
  }

  for (const forbiddenLoginNode of [
    'Login_LoadPanel',
    'Login_LoadProgress',
    'Login_LoadStep_',
    'Login_ActionPanel',
    'Button_WechatLogin',
  ]) {
    if (uiBuilder.includes(forbiddenLoginNode)) {
      fail(`Login screen contains non-reference loading or secondary CTA node: ${forbiddenLoginNode}`);
    }
  }

  for (const homeNode of [
    'Home_TopFunctionBar',
    'TopEntry_CheckIn',
    'TopEntry_DailyTask',
    'TopEntry_Mail',
    'TopEntry_Event',
    'TopEntry_FirstGift',
    'Home_LeftFeatureRail',
    'LeftEntry_Shop',
    'LeftEntry_Backpack',
    'LeftEntry_Pet',
    'LeftEntry_Talent',
    'Home_RightFeatureRail',
    'RightEntry_Achievement',
    'RightEntry_Illustration',
    'RightEntry_Settings',
    'Home_StageSelector',
    'Button_StagePrev',
    'Button_StageNext',
    'Home_CurrentStage',
    'Home_CurrentWave',
  ]) {
    if (!uiBuilder.includes(homeNode)) {
      fail(`Homepage is missing HOME_01 reference node: ${homeNode}`);
    }
  }

  if (!uiBuilder.includes("if (name.includes('Login_TitleArt')) return 'rt_logo_title';")) {
    fail('Login title art must use the generated rt_logo_title runtime sprite instead of plain text only.');
  }

  for (const bakedBackgroundDuplicate of [
    "this.addStars();\n    this.addRect({ name: 'Home_MoonAccent'",
    "this.addCampCabin('Login_Cabin'",
    "this.addCampfire('Login_Fire'",
    "this.addCampCabin('Home_Cabin'",
    "this.addCampfire('Home_Fire'",
  ]) {
    if (uiBuilder.includes(bakedBackgroundDuplicate)) {
      fail(`Login/home must use image backgrounds instead of duplicate code-drawn scenery: ${bakedBackgroundDuplicate}`);
    }
  }

  if (!/Home_StageSelector[\s\S]*?UIAssetKeys\.panels\.darkGlass/.test(uiBuilder)) {
    fail('Homepage stage selector must use the generated dark glass panel contract.');
  }

  if (!/handleButtonAction\(name: string\)[\s\S]*?gameLogic\.startBattle\(\)[\s\S]*?SceneRouter\.instance\.go\('battle'\)/.test(uiBuilder)) {
    fail('Battle prepare start button must call gameLogic.startBattle before routing to battle.');
  }

  const startBattleAction = /handleButtonAction\(name: string\)([\s\S]*?)private claimDailyTaskFromButton/.exec(uiBuilder)?.[1] ?? '';
  if (!/AnalyticsService\.instance\.track\(GameEvents\.BattlePrepareOpen\)[\s\S]*?SceneRouter\.instance\.go\('battlePrepare'\)/.test(startBattleAction)) {
    fail('Home start battle button must route to battlePrepare so the click visibly advances.');
  }

  if (/snapshot\.save\.currencies\.energy < snapshot\.battlePreparation\.energyCost[\s\S]*?SceneRouter\.instance\.go\('battlePrepare'\)/.test(startBattleAction)) {
    fail('Home start battle button must not block battlePrepare navigation on insufficient energy.');
  }

  if (uiBuilder.includes('this.screenKey = route;') || uiBuilder.includes('this.rebuild();\n    });\n  }\n\n  private addButtonBehavior')) {
    fail('UISkeletonBuilder route buttons must not only mutate screenKey and rebuild locally.');
  }

  for (const expectedRoute of ["'settings'", "'dailyTask'", "'mail'", "'achievement'"]) {
    if (!uiBuilder.includes(`return ${expectedRoute};`)) {
      fail(`Homepage route mapping is missing ${expectedRoute}.`);
    }
  }

  if (!uiBuilder.includes("if (name.includes('NavButton_battle')) return 'battlePrepare';")) {
    fail('Homepage bottom battle nav must route to battlePrepare instead of returning to home.');
  }

  for (const expectedBottomRoute of [
    "if (name.includes('NavButton_merge')) return 'merge';",
    "if (name.includes('NavButton_explore')) return 'explore';",
    "if (name.includes('NavButton_guild')) return 'guild';",
    "if (name.includes('NavIcon_home')) return UIAssetKeys.icons.home;",
    "if (name.includes('NavIcon_home')) return 'rt_cabin';",
  ]) {
    if (!uiBuilder.includes(expectedBottomRoute)) {
      fail(`HOME_01 bottom nav mapping is missing design-specific behavior: ${expectedBottomRoute}`);
    }
  }

  if (!uiBuilder.includes('RedDotManager.instance.recalculate(save)')) {
    fail('Homepage red dots must be derived from RedDotManager instead of hard-coded booleans.');
  }

  if (uiBuilder.includes("this.addSideEntry('Rank', '成就', 308, -220, true)") || !uiBuilder.includes("!!redDots.achievement")) {
    fail('Homepage achievement entry must use RedDotManager state instead of a hard-coded red dot.');
  }

  for (const hardCodedEconomyText of ['体力 x5', '钻石 x5', '推荐战力：12345', '我的战力：12500']) {
    if (uiBuilder.includes(hardCodedEconomyText)) {
      fail(`Homepage and battle-prepare economy text must come from battlePreparation, not hard-coded "${hardCodedEconomyText}".`);
    }
  }

  for (const requiredDynamicText of ['battleInfo.energyCost', 'battleInfo.energyMax', 'battleInfo.chapterTitle', 'battleInfo.myPower']) {
    if (!uiBuilder.includes(requiredDynamicText)) {
      fail(`Homepage/battle-prepare UI is missing dynamic battlePreparation field: ${requiredDynamicText}.`);
    }
  }

  const firstChapterName = levels?.chapters?.[0]?.displayName;
  if (firstChapterName === 'Night Forest' || !String(firstChapterName ?? '').includes('黑夜森林')) {
    fail('Home chapter title must use the localized commercial chapter name, not the old English placeholder.');
  }

  if (!uiBuilder.includes("value.includes('玩家名字')")) {
    fail('Homepage must normalize persisted placeholder player names before rendering.');
  }

  for (const homeAction of [
    "this.addTopEntry('CheckIn'",
    "this.addTopEntry('DailyTask'",
    "this.addTopEntry('Mail'",
    "this.addTopEntry('Event'",
    "this.addTopEntry('FirstGift'",
    "this.addFeatureEntry('Left', 'Shop'",
    "this.addFeatureEntry('Left', 'Backpack'",
    "this.addFeatureEntry('Left', 'Pet'",
    "this.addFeatureEntry('Left', 'Talent'",
    "this.addFeatureEntry('Right', 'Achievement'",
    "this.addFeatureEntry('Right', 'Illustration'",
    "this.addFeatureEntry('Right', 'Settings'",
  ]) {
    if (!uiBuilder.includes(homeAction)) {
      fail(`Homepage is missing required HOME_01 entry: ${homeAction}`);
    }
  }

  for (const pageToken of [
    'private buildDailyTask()',
    'private buildMail()',
    'private buildAchievement()',
    'private buildPet()',
    'private buildTalent()',
    'private buildSettings()',
  ]) {
    if (!uiBuilder.includes(pageToken)) {
      fail(`Design-backed secondary route is missing a dedicated page builder: ${pageToken}`);
    }
  }

  for (const placeholderRoute of [
    "pet: () => this.buildPlaceholder",
    "talent: () => this.buildPlaceholder",
    "dailyTask: () => this.buildPlaceholder",
    "achievement: () => this.buildPlaceholder",
    "mail: () => this.buildPlaceholder",
    "settings: () => this.buildPlaceholder",
  ]) {
    if (uiBuilder.includes(placeholderRoute)) {
      fail(`Design-backed secondary route must not use generic placeholder UI: ${placeholderRoute}`);
    }
  }

  if (uiBuilder.includes('后续由对应系统 Agent 接入真实数据')) {
    fail('MVP UI action buttons must not use deferred fake-data toast copy.');
  }

  for (const requiredAction of [
    'gameLogic.claimDailyTask',
    'gameLogic.claimActivityChest',
    'gameLogic.claimExploreReward',
    'gameLogic.claimGuildCheckIn',
    'gameLogic.claimGuildHelp',
    'gameLogic.selectBattleWave',
    'gameLogic.claimMail',
    'gameLogic.claimAllMails',
    'gameLogic.deleteMail',
    'gameLogic.claimAchievement',
    'gameLogic.upgradePet',
    'gameLogic.deployPet',
    'gameLogic.upgradeTalent',
    'gameLogic.autoMergeAll',
    'gameLogic.openChest',
    'gameLogic.buyShopGoods',
    'gameLogic.refreshShop',
    'SaveManager.instance.update',
    'SaveManager.instance.reset',
  ]) {
    if (!uiBuilder.includes(requiredAction)) {
      fail(`MVP UI action buttons must call real gameplay/save behavior: ${requiredAction}`);
    }
  }

  for (const requiredFacadeAction of [
    'public claimExploreReward',
    'public claimGuildCheckIn',
    'public claimGuildHelp',
    'public selectBattleWave',
  ]) {
    if (!facade.includes(requiredFacadeAction)) {
      fail(`GameLogicFacade is missing required launch action: ${requiredFacadeAction}`);
    }
  }

  for (const forbiddenPlaceholderCopy of [
    '探索系统暂未开放',
    '公会签到暂未开放',
    '公会互助暂未开放',
    '章节切换暂未开放',
  ]) {
    if (uiBuilder.includes(forbiddenPlaceholderCopy)) {
      fail(`Launch page action still uses placeholder copy: ${forbiddenPlaceholderCopy}`);
    }
  }

  for (const requiredHandler of [
    'private claimDailyTaskFromButton',
    'private claimAchievementFromButton',
    'private claimMailFromButton',
    'private buyShopGoodsFromButton',
    'private getSelectedMail',
    'private getSelectedPetId',
    'private getSelectedTalentNodeId',
    'private toggleSettingFromButton',
    'private reportActionResult',
  ]) {
    if (!uiBuilder.includes(requiredHandler)) {
      fail(`UISkeletonBuilder is missing dedicated MVP action handler: ${requiredHandler}`);
    }
  }

  for (const forbiddenFixedAction of [
    "gameLogic.upgradePet('pet_black_cat')",
    "gameLogic.deployPet('pet_black_cat')",
    "gameLogic.upgradeTalent('attack_power_01')",
  ]) {
    if (uiBuilder.includes(forbiddenFixedAction)) {
      fail(`Launch-critical UI action must use selected UI/save state instead of a fixed sample id: ${forbiddenFixedAction}`);
    }
  }

  for (const selectedActionToken of [
    'Button_MailOpen_',
    'this.getSelectedMail()',
    'Button_PetSelect_',
    'Button_TalentSelect_',
    'this.getSelectedPetId()',
    'this.getSelectedTalentNodeId()',
  ]) {
    if (!uiBuilder.includes(selectedActionToken)) {
      fail(`Launch-critical selected-state UI must expose selected action flow: ${selectedActionToken}`);
    }
  }

  for (const mergeGuideToken of [
    'mergeGuideSeen: false',
    "if (name === 'Button_Merge') return SaveManager.instance.load().settings.mergeGuideSeen ? 'merge' : 'mergeGuide'",
    'draft.settings.mergeGuideSeen = true',
  ]) {
    if (!uiBuilder.includes(mergeGuideToken) && !defaultSave.includes(mergeGuideToken)) {
      fail(`First merge tutorial must be one-time and persisted: ${mergeGuideToken}`);
    }
  }

  for (const requiredVisibleButtonHandler of [
    "name.includes('Button_ShopAddCurrency')",
    "name.includes('Button_BackpackSort')",
    "name.includes('Button_MergeGuideHelp')",
    "name.includes('Button_ExploreStart')",
    "name.includes('Button_GuildCheckIn')",
    "name.includes('Button_GuildHelp')",
    "name.includes('Button_StagePrev')",
    "name.includes('Button_StageNext')",
    "name.includes('Button_RewardDouble')",
    "name.includes('Button_RefreshVideo')",
  ]) {
    if (!uiBuilder.includes(requiredVisibleButtonHandler)) {
      fail(`Visible MVP button must be functional or explicitly disabled: ${requiredVisibleButtonHandler}`);
    }
  }

  const buildMailDetailStart = uiBuilder.indexOf('private buildMailDetail()');
  const buildMailDetailEnd = uiBuilder.indexOf('\n\n  private buildPolicyModal', buildMailDetailStart);
  const buildMailDetailBody = buildMailDetailStart >= 0 && buildMailDetailEnd > buildMailDetailStart
    ? uiBuilder.slice(buildMailDetailStart, buildMailDetailEnd)
    : '';
  if (!buildMailDetailBody.includes('const selectedMail = this.getSelectedMail()')) {
    fail('Mail detail must render the selected mail instead of fixed sample content.');
  }
  for (const forbiddenMailDetailLiteral of [
    "value: '守夜补给已送达'",
    "value: '发件人：营地管家",
    "value: '亲爱的守夜者",
    "'+300', 'rt_icon_gold'",
  ]) {
    if (buildMailDetailBody.includes(forbiddenMailDetailLiteral)) {
      fail(`Mail detail still contains fixed sample content instead of selected mail data: ${forbiddenMailDetailLiteral}`);
    }
  }

  const placeholderIds = new Set(runtimeQuality?.statuses?.runtimePlaceholder ?? []);
  const firstDeliveryRuntimeIds = [
    'rt_bg_login_night_safe',
    'rt_bg_home_camp_safe',
    'rt_btn_yellow',
    'rt_btn_green',
    'rt_panel_bottom_nav',
    'rt_panel_resource_pill',
    'rt_panel_wood_header',
    'rt_btn_nav_active',
    'rt_btn_nav_inactive',
    'rt_icon_energy',
  ];
  for (const id of firstDeliveryRuntimeIds) {
    if (placeholderIds.has(id)) {
      fail(`First-delivery login/home runtime asset must not remain runtimePlaceholder: ${id}`);
    }
  }

  for (const id of [
    'rt_icon_side_checkin',
    'rt_icon_side_task',
    'rt_icon_side_mail',
    'rt_icon_side_rank',
    'rt_icon_nav_battle',
    'rt_cabin',
    'rt_item_weapon_chest',
    'rt_item_lantern',
    'rt_avatar_cat',
  ]) {
    if (placeholderIds.has(id)) {
      fail(`Homepage P0 icon must be independently generated and cannot remain runtimePlaceholder: ${id}`);
    }
  }

  for (const [id, expected] of Object.entries({
    rt_bg_login_night_safe: { width: 720, height: 1280 },
    rt_bg_home_camp_safe: { width: 720, height: 1280 },
    rt_btn_yellow: { width: 320, height: 112 },
    rt_panel_bottom_nav: { width: 720, height: 160 },
  })) {
    const assetPath = path.join(projectRoot, 'assets', 'textures', 'runtime', `${id}.png`);
    if (!fs.existsSync(assetPath)) {
      fail(`First-delivery runtime PNG missing: ${path.relative(projectRoot, assetPath)}`);
      continue;
    }
    const size = readPngSize(assetPath);
    if (size && (size.width !== expected.width || size.height !== expected.height)) {
      fail(`First-delivery runtime PNG has wrong size: ${id} expected ${expected.width}x${expected.height}, got ${size.width}x${size.height}`);
    }
  }

  if (packageJson.scripts?.['asset:review'] !== 'node tools/asset_review_center.mjs') {
    fail('package.json must expose npm run asset:review for the central asset acceptance queue.');
  }

  if (!packageJson.scripts?.['verify:full-loop']?.includes('tools/verify_full_loop_acceptance.ts')) {
    fail('package.json must expose npm run verify:full-loop for launch-loop acceptance.');
  }

  if (!packageJson.scripts?.['verify:wechat-build']?.includes('tools/verify_wechat_build_output.mjs')) {
    fail('package.json must expose npm run verify:wechat-build for Cocos WeChat build output acceptance.');
  }

  if (!packageJson.scripts?.['verify:design-parity']?.includes('tools/verify_ui_design_parity.mjs')) {
    fail('package.json must expose npm run verify:design-parity for 22-page UI launch evidence.');
  }

  if (!packageJson.scripts?.['verify:page-functions']?.includes('tools/verify_page_function_coverage.mjs')) {
    fail('package.json must expose npm run verify:page-functions for route/page function coverage.');
  }

  if (!packageJson.scripts?.['verify:mobile-resilience']?.includes('tools/verify_mobile_resilience_contracts.mjs')) {
    fail('package.json must expose npm run verify:mobile-resilience for safe-area, long-text, scroll, and route-switch coverage.');
  }

  if (!packageJson.scripts?.['verify:release-compliance']?.includes('tools/verify_release_compliance.mjs')) {
    fail('package.json must expose npm run verify:release-compliance for WeChat release compliance coverage.');
  }

  if (!packageJson.scripts?.['verify:launch-evidence']?.includes('tools/verify_launch_evidence.mjs')) {
    fail('package.json must expose npm run verify:launch-evidence for final WeChat/manual launch evidence coverage.');
  }

  if (!packageJson.scripts?.['workflow:check']?.includes('verify:design-parity')) {
    fail('package.json workflow:check must include the 22-page UI design parity gate.');
  }

  if (!packageJson.scripts?.['workflow:check']?.includes('verify:page-functions')) {
    fail('package.json workflow:check must include the page function coverage gate.');
  }

  if (!packageJson.scripts?.['workflow:check']?.includes('verify:mobile-resilience')) {
    fail('package.json workflow:check must include the mobile resilience gate.');
  }

  if (!packageJson.scripts?.['workflow:check']?.includes('verify:release-compliance')) {
    fail('package.json workflow:check must include the release compliance gate.');
  }

  if (!packageJson.scripts?.['workflow:check']?.includes('verify:launch-evidence')) {
    fail('package.json workflow:check must include the launch evidence gate.');
  }

  for (const fullLoopToken of [
    'agreement_gate_blocks_start',
    'start_first_battle',
    'release_energy_insufficient_blocks_start_no_mutation',
    'release_energy_start_spends_configured_cost',
    'first_battle_reaches_settlement',
    'battle_pause_resume_blocks_and_restores_ticks',
    'battle_auto_merge_toggle_state',
    'skill_choice_offer_apply_and_duplicate_block',
    'battle_double_reward_after_ad',
    'battle_double_duplicate_blocked',
    'battle_double_cancelled_ad_no_mutation',
    'duplicate_reward_blocked',
    'first_clear_key_wave_rewards_and_idempotency',
    'defeat_settlement_no_wave_advance',
    'backpack_merge',
    'merge_failure_no_mutation',
    'open_chest_consumes_cost_and_grants_reward',
    'open_chest_insufficient_gold_no_mutation',
    'open_chest_missing_chest_no_mutation',
    'selected_pet_upgrade',
    'pet_upgrade_increases_power',
    'pet_deploy_switch_single_active',
    'pet_deploy_locked_blocked_no_mutation',
    'pet_upgrade_failure_no_mutation',
    'selected_talent_upgrade',
    'talent_upgrade_increases_power',
    'talent_reset_refunds_branch_points',
    'talent_prerequisite_blocked',
    'talent_max_level_blocked_no_mutation',
    'battle_preparation_reflects_growth_and_weapon_preview',
    'task_progress_updates',
    'task_claim',
    'task_duplicate_blocked',
    'task_multi_claim_progression',
    'activity_chest_claim',
    'activity_chest_duplicate_blocked',
    'achievement_claim',
    'achievement_duplicate_blocked',
    'achievement_claim_all_multi_and_idempotent',
    'red_dot_claimable_thresholds_and_clear',
    'mail_red_dot_count_drops_after_claim_all',
    'mail_unclaimed_delete_blocked',
    'mail_claim',
    'mail_claim_all',
    'mail_claim_all_duplicate_blocked',
    'mail_delete_all_safe',
    'shop_free_good_once',
    'shop_insufficient_resource_no_mutation',
    'shop_paid_purchase_deducts_and_grants',
    'shop_paid_daily_limit_blocked_no_mutation',
    'shop_special_offer_unavailable_no_mutation',
    'shop_refresh_cancelled_ad_no_mutation',
    'shop_refresh_ad_success_then_daily_limit',
    'shop_refresh_countdown_next_time_is_future',
    'energy_recovery_interval_and_cap',
    'explore_claim_consumes_energy_and_grants_rewards',
    'explore_daily_duplicate_blocked_no_mutation',
    'explore_insufficient_energy_no_mutation',
    'guild_check_in_once_grants_reward',
    'guild_help_once_grants_reward',
    'guild_daily_duplicate_blocked_no_mutation',
    'stage_select_within_unlocked_bounds',
    'stage_select_locked_or_out_of_bounds_no_mutation',
    'daily_refresh_resets_tasks_and_limits_once',
    'start_second_battle_after_growth',
    'restart_restore_save',
    'settings_persist_after_restart',
    'economy_non_negative',
  ]) {
    if (!fullLoopAcceptance.includes(fullLoopToken)) {
      fail(`Full-loop launch acceptance script is missing required check: ${fullLoopToken}`);
    }
  }

  for (const wechatBuildToken of [
    'build/wechatgame',
    'game.js',
    'game.json',
    'project.config.json',
    'deviceOrientation',
    'compileType',
    'miniprogramRoot',
    'wechat-build-output',
  ]) {
    if (!wechatBuildOutput.includes(wechatBuildToken)) {
      fail(`WeChat build output verification script is missing required check: ${wechatBuildToken}`);
    }
  }

  for (const designParityToken of [
    'expectedScreenshots',
    '01_login.png',
    '22_toast_modal.png',
    'verify_login_design_parity.mjs',
    'verify_system_modal_design_parity.mjs',
    'minScreenshotWidth',
    'targetPortraitAspect',
    'ui-design-parity',
  ]) {
    if (!uiDesignParity.includes(designParityToken)) {
      fail(`UI design parity verification script is missing required check: ${designParityToken}`);
    }
  }

  for (const pageFunctionToken of [
    'page-function-coverage',
    'routes',
    'screenshotByRoute',
    'pageContracts',
    'Button_StartGame',
    'Button_StartBattle',
    'Button_MailClaimAll',
    'Button_TalentLearn',
    'Button_DefeatRetry',
    'settings.mergeGuideSeen',
    'draft.settings.mergeGuideSeen = true',
  ]) {
    if (!pageFunctionCoverage.includes(pageFunctionToken)) {
      fail(`Page function coverage script is missing required check: ${pageFunctionToken}`);
    }
  }

  for (const mobileResilienceToken of [
    'mobile-resilience',
    'ResolutionPolicy.FIXED_WIDTH',
    "this.addScrollPanel('MailDetail_Content'",
    "this.addScrollPanel('Talent_Tree'",
    'gameLogic.repo.configs.talents.nodes',
    'resolveButtonRoute returns undeclared route',
    'private clearGeneratedUi',
    'child.destroy()',
    'powerSavingUiIntervalSec',
    'shouldUpdateBattleUi',
  ]) {
    if (!mobileResilience.includes(mobileResilienceToken)) {
      fail(`Mobile resilience verification script is missing required check: ${mobileResilienceToken}`);
    }
  }

  for (const releaseComplianceToken of [
    'release-compliance',
    'BLOCKED_INPUT',
    'platform.reviewMode',
    'grantRewardOnlyOnCompletedRewardedVideo',
    "adService.showRewardedAd('battle_reward_double')",
    "adService.showRewardedAd('daily_task_ad')",
    'claimBattleDoubleReward',
  ]) {
    if (!releaseCompliance.includes(releaseComplianceToken)) {
      fail(`Release compliance verification script is missing required check: ${releaseComplianceToken}`);
    }
  }

  for (const launchEvidenceToken of [
    'launch-evidence',
    'BLOCKED_EVIDENCE',
    'wechatDevToolsImport',
    'fullLoopRuntime',
    'uiDesignSignoff',
    'realDeviceSmoke',
    'performanceSmoke',
    'XMBB_RELEASE_FINAL',
  ]) {
    if (!launchEvidence.includes(launchEvidenceToken)) {
      fail(`Launch evidence verification script is missing required check: ${launchEvidenceToken}`);
    }
  }

  if (!Array.isArray(assetReviewCenter.reviewBuckets?.usable) || !assetReviewCenter.reviewBuckets.usable.includes('productionCandidate')) {
    fail('asset_review_center.json must define usable asset statuses.');
  }

  if (!Array.isArray(assetReviewCenter.reviewBuckets?.needsReview) || !assetReviewCenter.reviewBuckets.needsReview.includes('temporaryAlias')) {
    fail('asset_review_center.json must route temporary aliases through human/QA review.');
  }

  if (!Array.isArray(assetReviewCenter.rejectReasons) || !assetReviewCenter.rejectReasons.includes('too_fake')) {
    fail('asset_review_center.json must support rejecting fake-looking generated assets.');
  }

  const assetReviewTool = read(assetReviewToolPath);
  for (const requiredToken of ['asset_review_center.json', 'runtime_asset_quality.json', 'asset_pipeline_state.json', 'usable', 'needsReview', 'queuedForGeneration']) {
    if (!assetReviewTool.includes(requiredToken)) {
      fail(`asset_review_center.mjs is missing required review-center behavior token: ${requiredToken}`);
    }
  }
}

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(`[scene-flow-guards] FAIL ${failure}`);
  }
  process.exit(1);
}

console.log('[scene-flow-guards] battle start, settlement, and battle art guard checks passed.');
