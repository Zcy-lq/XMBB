import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const finalMode = process.env.XMBB_RELEASE_FINAL === '1';
const failures = [];
const blockedInputs = [];

function rel(filePath) {
  return path.relative(projectRoot, filePath).replace(/\\/g, '/');
}

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function readJson(filePath) {
  return JSON.parse(read(filePath));
}

function fail(message) {
  failures.push(message);
}

function block(label, value, reason) {
  const row = `${label}: ${reason}${value ? ` (${value})` : ''}`;
  blockedInputs.push(row);
  if (finalMode) {
    fail(`Final release input is not configured: ${row}`);
  }
}

function isPlaceholder(value) {
  return typeof value !== 'string' || value.trim() === '' || /^__.+__$/.test(value) || value === 'touristappid';
}

function assertFile(filePath) {
  if (!fs.existsSync(filePath)) {
    fail(`Missing required release file: ${rel(filePath)}`);
  }
}

function assertIncludes(source, token, label) {
  if (!source.includes(token)) {
    fail(`${label} is missing required token: ${token}`);
  }
}

function assertNoMojibake(source, label) {
  const commonMojibake = [
    '鐚',
    '寰',
    '骞垮憡',
    '缂栬緫',
    '褰撳墠',
    '鏈幏',
    '鐜╁',
    '婵€鍔',
    '鏆傛棤',
    '鍚庣画',
    '浣撳姏',
    '閽荤煶',
  ];
  const found = commonMojibake.filter((token) => source.includes(token));
  if (found.length > 0 || /[\ufffd\ue000-\uf8ff]/u.test(source)) {
    fail(`${label} contains mojibake or replacement characters: ${found.join(', ') || 'private-use/replacement character'}`);
  }
}

const platformPath = path.join(projectRoot, 'assets', 'configs', 'platform.json');
const complianceServicePath = path.join(projectRoot, 'assets', 'scripts', 'services', 'ComplianceService.ts');
const wechatServicePath = path.join(projectRoot, 'assets', 'scripts', 'services', 'WechatService.ts');
const adServicePath = path.join(projectRoot, 'assets', 'scripts', 'services', 'AdService.ts');
const serviceLocatorPath = path.join(projectRoot, 'assets', 'scripts', 'services', 'ServiceLocator.ts');
const battleRewardsPath = path.join(projectRoot, 'assets', 'scripts', 'game', 'BattleRewardSystem.ts');
const gameLogicPath = path.join(projectRoot, 'assets', 'scripts', 'game', 'GameLogicFacade.ts');
const uiBuilderPath = path.join(projectRoot, 'assets', 'scripts', 'ui', 'UISkeletonBuilder.ts');
const levelsPath = path.join(projectRoot, 'assets', 'configs', 'levels.json');
const packagePath = path.join(projectRoot, 'package.json');

for (const filePath of [
  platformPath,
  complianceServicePath,
  wechatServicePath,
  adServicePath,
  serviceLocatorPath,
  battleRewardsPath,
  gameLogicPath,
  uiBuilderPath,
  levelsPath,
  packagePath,
]) {
  assertFile(filePath);
}

if (failures.length === 0) {
  const platform = readJson(platformPath);
  const complianceService = read(complianceServicePath);
  const wechatService = read(wechatServicePath);
  const adService = read(adServicePath);
  const serviceLocator = read(serviceLocatorPath);
  const battleRewards = read(battleRewardsPath);
  const gameLogic = read(gameLogicPath);
  const uiBuilder = read(uiBuilderPath);
  const levels = readJson(levelsPath);
  const packageJson = readJson(packagePath);

  for (const [label, source] of Object.entries({
    'ComplianceService.ts': complianceService,
    'WechatService.ts': wechatService,
    'AdService.ts': adService,
    'UISkeletonBuilder.ts': uiBuilder,
  })) {
    assertNoMojibake(source, label);
  }

  if (platform.version !== packageJson.version) {
    fail(`platform.json version must match package.json version: ${platform.version} !== ${packageJson.version}`);
  }
  if (platform.schemaVersion !== 1) {
    fail('platform.json schemaVersion must be 1.');
  }
  if (platform.reviewMode !== true) {
    fail('Current release candidate must keep platform.reviewMode=true until WeChat review credentials and legal URLs are configured.');
  }
  if (platform.reviewMode && platform.ads?.enabled !== false) {
    fail('Ads must be disabled while reviewMode=true.');
  }
  if (platform.fallbacks?.grantRewardOnlyOnCompletedRewardedVideo !== true) {
    fail('platform.fallbacks.grantRewardOnlyOnCompletedRewardedVideo must be true.');
  }
  if (levels.battle?.unlimitedEnergyInDevelopment === true) {
    fail('Default release candidate levels.json must charge battle energy; unlimitedEnergyInDevelopment cannot be true in committed release config.');
  }
  if (!Number.isFinite(levels.battle?.energyCost) || levels.battle.energyCost <= 0) {
    fail('Default release candidate levels.json must define a positive battle.energyCost.');
  }

  if (isPlaceholder(platform.wechat?.appid)) {
    block('wechat.appid', platform.wechat?.appid, 'requires the official WeChat Mini Game AppID before production upload');
  }
  if (isPlaceholder(platform.wechat?.privacyPolicyUrl)) {
    block('wechat.privacyPolicyUrl', platform.wechat?.privacyPolicyUrl, 'requires a production privacy policy URL');
  }
  if (isPlaceholder(platform.wechat?.userAgreementUrl)) {
    block('wechat.userAgreementUrl', platform.wechat?.userAgreementUrl, 'requires a production user agreement URL');
  }
  for (const [label, value] of Object.entries({
    rewardedVideoUnitId: platform.ads?.rewardedVideoUnitId,
    interstitialUnitId: platform.ads?.interstitialUnitId,
    bannerUnitId: platform.ads?.bannerUnitId,
  })) {
    if (platform.ads?.enabled && isPlaceholder(value)) {
      block(`ads.${label}`, value, 'ads are enabled but the production ad unit id is missing');
    }
  }

  for (const token of [
    "id: 'userAgreement'",
    "id: 'privacyPolicy'",
    "id: 'ageRating'",
    "id: 'healthyGame'",
    "requiredOnLogin: true",
    '用户协议',
    '隐私政策',
    '16+ CADPA',
    '适度游戏益脑，沉迷游戏伤身。合理安排时间，享受健康生活。',
    '请先阅读并同意用户协议和隐私政策。',
  ]) {
    assertIncludes(complianceService, token, 'ComplianceService.ts');
  }

  for (const token of [
    '当前不是微信环境，已使用编辑器 Mock 登录。',
    '微信登录未返回 code。',
    '用于展示头像和昵称',
    '玩家已关闭震动。',
    '本地存储写入失败。',
    '猫猫守夜员',
  ]) {
    assertIncludes(wechatService, token, 'WechatService.ts');
  }

  for (const token of [
    '广告位已关闭。',
    '广告位未配置 adUnitId。',
    '玩家未看完广告，不能发放激励奖励。',
    '暂无广告库存',
    '无广告',
    'grantRewardOnlyOnCompletedRewardedVideo',
  ]) {
    assertIncludes(adService, token, 'AdService.ts');
  }

  for (const token of [
    'platformConfig',
    'battle_reward_double',
    'daily_task_ad',
    'rewardedVideoUnitId',
  ]) {
    assertIncludes(serviceLocator, token, 'ServiceLocator.ts');
  }

  for (const token of [
    'public claimDoubleReward',
    'battle-double:',
    "input.adState === 'success'",
    "this.progression.recordEvent(save, 'adWatch', 1)",
  ]) {
    assertIncludes(battleRewards, token, 'BattleRewardSystem.ts');
  }

  for (const token of [
    'public claimBattleDoubleReward',
    'public getLastBattleSettlement',
    'lastBattleSettlement',
  ]) {
    assertIncludes(gameLogic, token, 'GameLogicFacade.ts');
  }

  for (const token of [
    "import { adService } from '../services/AdService';",
    'Login_AgreementPlate',
    'Button_ToggleAgreement',
    'AgeBadge_16',
    'Login_HealthNotice',
    "adService.showRewardedAd('battle_reward_double')",
    "adService.showRewardedAd('daily_task_ad')",
    'claimBattleDoubleReward',
  ]) {
    assertIncludes(uiBuilder, token, 'UISkeletonBuilder.ts');
  }
  if (uiBuilder.includes('广告占位')) {
    fail('UISkeletonBuilder.ts must not present or grant ad progress through placeholder copy.');
  }
  if (
    uiBuilder.includes("gameLogic.recordProgressEvent('adWatch', 1)") &&
    !/adService\.showRewardedAd\('daily_task_ad'\)[\s\S]*?if \(!adResult\.success\)[\s\S]*?return;[\s\S]*?gameLogic\.recordProgressEvent\('adWatch', 1\)/.test(uiBuilder)
  ) {
    fail('UISkeletonBuilder.ts must not grant adWatch progress without AdService success.');
  }

  const scriptSources = [
    ...fs.readdirSync(path.join(projectRoot, 'assets', 'scripts'), { recursive: true }),
  ]
    .filter((entry) => String(entry).endsWith('.ts'))
    .map((entry) => read(path.join(projectRoot, 'assets', 'scripts', entry)));
  const hardcodedWechatIds = scriptSources.join('\n').match(/\bwx[0-9a-f]{12,}\b/gi) ?? [];
  if (hardcodedWechatIds.length > 0) {
    fail(`TypeScript source must not hard-code production WeChat IDs: ${[...new Set(hardcodedWechatIds)].join(', ')}`);
  }

  if (packageJson.scripts?.['verify:release-compliance'] !== 'node tools/verify_release_compliance.mjs') {
    fail('package.json must expose npm run verify:release-compliance.');
  }
  if (!packageJson.scripts?.['workflow:check']?.includes('verify:release-compliance')) {
    fail('package.json workflow:check must include the release compliance gate.');
  }
}

for (const blockedInput of blockedInputs) {
  console.error(`[release-compliance] BLOCKED_INPUT ${blockedInput}`);
}

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(`[release-compliance] FAIL ${failure}`);
  }
  process.exit(1);
}

console.log(`[release-compliance] CODE PASS blockedInputs=${blockedInputs.length} finalMode=${finalMode ? 'on' : 'off'}`);
