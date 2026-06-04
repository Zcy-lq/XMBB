import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const workspaceRoot = path.resolve(projectRoot, '..');
const annotatedDesignDir = path.join(workspaceRoot, '设计图_AI全页面2K标注版');
const legacyDesignDir = path.join(workspaceRoot, '设计图');
const expectedAnnotatedPageCount = 22;
const expectedAnnotatedDesigns = [
  '01_LOGIN_登录页.png',
  '02_HOME_主页.png',
  '03_BATTLE_PREPARE_战斗准备.png',
  '04_BATTLE_战斗界面.png',
  '05_PAUSE_MODAL_暂停弹窗.png',
  '06_SKILL_CHOICE_技能选择弹窗.png',
  '07_VICTORY_胜利结算.png',
  '08_DEFEAT_失败结算.png',
  '09_BACKPACK_背包.png',
  '10_MERGE_GUIDE_合成提示.png',
  '11_SHOP_商店.png',
  '12_PET_宠物.png',
  '13_PET_DETAIL_宠物详情.png',
  '14_TALENT_天赋.png',
  '15_DAILY_TASK_每日任务.png',
  '16_ACHIEVEMENT_成就.png',
  '17_MAIL_邮件.png',
  '18_MAIL_DETAIL_邮件详情弹窗.png',
  '19_SETTINGS_设置.png',
  '20_POLICY_MODAL_协议隐私弹窗.png',
  '21_CONFIRM_MODAL_通用确认弹窗.png',
  '22_TOAST_MODAL_提示弹窗.png',
];
const uiBuilderPath = path.join(projectRoot, 'assets', 'scripts', 'ui', 'UISkeletonBuilder.ts');

const failures = [];

function fail(priority, page, issue, evidence, owner, suggestedFix) {
  failures.push({ priority, page, issue, evidence, owner, suggestedFix });
}

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
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

function assertIncludes(source, token, page, issue, owner, suggestedFix) {
  if (!source.includes(token)) {
    fail('P0', page, issue, `Missing token: ${token}`, owner, suggestedFix);
  }
}

function assertNotIncludes(source, token, page, issue, owner, suggestedFix) {
  if (source.includes(token)) {
    fail('P0', page, issue, `Forbidden old token still present: ${token}`, owner, suggestedFix);
  }
}

function listDesignImages(directory) {
  if (!fs.existsSync(directory)) {
    return [];
  }
  return fs.readdirSync(directory)
    .filter((name) => /\.(png|jpg|jpeg)$/i.test(name))
    .map((name) => {
      const filePath = path.join(directory, name);
      return { name, filePath, size: name.toLowerCase().endsWith('.png') ? pngSize(filePath) : null };
    });
}

if (!fs.existsSync(annotatedDesignDir)) {
  fail(
    'P0',
    'ALL',
    'Annotated 22-page design reference directory is missing.',
    path.relative(workspaceRoot, annotatedDesignDir),
    'ProductAgent/UIUXAgent',
    'Create the AI annotated design reference directory and place all 22 page references there.',
  );
}

if (!fs.existsSync(uiBuilderPath)) {
  fail(
    'P0',
    'ALL',
    'UISkeletonBuilder is missing.',
    path.relative(projectRoot, uiBuilderPath),
    'ClientArchAgent/UIUXAgent',
    'Restore the UI builder before running page design audits.',
  );
}

let annotatedDesignImages = [];
let legacyDesignImages = [];
if (fs.existsSync(annotatedDesignDir)) {
  annotatedDesignImages = listDesignImages(annotatedDesignDir);

  const annotatedNames = new Set(annotatedDesignImages.map((image) => image.name));
  const missingAnnotatedDesigns = expectedAnnotatedDesigns.filter((name) => !annotatedNames.has(name));
  if (annotatedDesignImages.length < expectedAnnotatedPageCount || missingAnnotatedDesigns.length > 0) {
    fail(
      'P0',
      'ALL',
      'The full 22-page AI annotated design reference set is incomplete.',
      `Found ${annotatedDesignImages.length}/${expectedAnnotatedPageCount} annotated image(s) in ${path.relative(workspaceRoot, annotatedDesignDir)}. Missing: ${missingAnnotatedDesigns.join(', ') || 'none by exact filename'}`,
      'ProductAgent/UIUXAgent',
      'Restore every numbered annotated page reference before claiming UI delivery.',
    );
  }

  const readablePngSheets = annotatedDesignImages.filter((image) => image.size);
  if (readablePngSheets.length < expectedAnnotatedPageCount) {
    fail(
      'P1',
      'ALL',
      'Some annotated design sheets do not have readable PNG dimensions.',
      `Readable PNG sheets found: ${readablePngSheets.length}/${expectedAnnotatedPageCount}`,
      'UIUXAgent',
      'Use valid PNG references for all 22 launch pages.',
    );
  }
}
legacyDesignImages = listDesignImages(legacyDesignDir);

if (fs.existsSync(uiBuilderPath)) {
  const ui = read(uiBuilderPath);

  for (const token of [
    "if (name === 'Bg_LoginNight') return 'rt_bg_login_night_safe';",
    "if (name === 'Bg_HomeCamp') return 'rt_bg_home_camp_safe';",
    'this.designRoot.setScale(1, 1, 1);',
    'Login_TitleArt',
    'Button_StartGame',
    'Button_ToggleAgreement',
    'Login_AgreementPlate',
    'AgeBadge_16',
    'Login_HealthNotice',
  ]) {
    assertIncludes(ui, token, 'LOGIN_01', 'Login page does not satisfy the reference contract.', 'UIUXAgent/AssetAgent', 'Use the generated login background/title art and keep consent/start/age/health nodes visible.');
  }

  for (const token of [
    "this.addCampCabin('Login_Cabin'",
    "this.addCampfire('Login_Fire'",
    'Login_LoadPanel',
    'Login_LoadProgress',
    'Login_LoadStep_',
    'Login_ActionPanel',
    'Button_WechatLogin',
  ]) {
    assertNotIncludes(ui, token, 'LOGIN_01', 'Login page still contains non-reference loading or secondary CTA layout.', 'UIUXAgent/AssetAgent', 'Keep LOGIN_01 as logo, background scene, hero cat, one start button, agreement, age badge, and health notice.');
  }

  for (const token of [
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
    "this.addBottomNav('battle')",
    'NavButton_shop',
    'NavButton_backpack',
    'NavButton_battle',
    'NavButton_talent',
    'NavButton_pet',
  ]) {
    assertIncludes(ui, token, 'HOME_01', 'Home page does not match the annotated HOME_01 layout.', 'UIUXAgent', 'Rebuild the home page around top resources, top function row, left/right feature rails, stage selector, start CTA, and the design bottom nav.');
  }

  for (const token of [
    'Home_StageCard',
    'Home_CampBriefPanel',
    'Home_DailyTaskSummary',
    'Home_MailSummary',
    'Home_SupplySummary',
    'Home_SideRail',
    "this.addBottomNav('home')",
    "{ key: 'home', label: '主界面' }",
    "{ key: 'merge', label: '合成' }",
    "{ key: 'explore', label: '探索' }",
    "{ key: 'guild', label: '公会' }",
    "{ key: 'settings', label: '设置' }",
    "this.addCampCabin('Home_Cabin'",
    "this.addCampfire('Home_Fire'",
  ]) {
    assertNotIncludes(ui, token, 'HOME_01', 'Home page still contains the old non-reference layout.', 'UIUXAgent', 'Remove the old summary-card/right-only rail layout and rebuild against HOME_01.');
  }

  for (const token of [
    "if (name.includes('TopEntry_CheckIn')",
    "if (name.includes('TopEntry_DailyTask')",
    "if (name.includes('TopEntry_Mail')",
    "if (name.includes('LeftEntry_Shop')",
    "if (name.includes('LeftEntry_Backpack')",
    "if (name.includes('RightEntry_Settings')",
    "if (name.includes('NavButton_battle')) return 'battlePrepare';",
    "if (name.includes('NavButton_shop')) return 'shop';",
    "if (name.includes('NavButton_backpack')) return 'backpack';",
    "if (name.includes('NavButton_talent')) return 'talent';",
    "if (name.includes('NavButton_pet')) return 'pet';",
    "if (name.includes('NavIcon_shop')) return UIAssetKeys.icons.shop;",
    "if (name.includes('NavIcon_backpack')) return UIAssetKeys.icons.backpack;",
    "if (name.includes('NavIcon_battle')) return UIAssetKeys.icons.battle;",
    "if (name.includes('NavIcon_talent')) return UIAssetKeys.icons.talent;",
    "if (name.includes('NavIcon_pet')) return UIAssetKeys.icons.pet;",
  ]) {
    assertIncludes(ui, token, 'HOME_01', 'Home page visual entry is missing a routed interaction.', 'UIUXAgent/ClientArchAgent', 'Bind each HOME_01 interactive entry to an existing route or safe placeholder route.');
  }

  for (const token of [
    'private buildDailyTask()',
    'private buildMail()',
    'private buildAchievement()',
    'private buildPet()',
    'private buildTalent()',
    'private buildSettings()',
    'private buildMerge()',
    'private buildExplore()',
    'private buildGuild()',
    'DailyTask_ActivityPanel',
    'Mail_ListPanel',
    'Achievement_SummaryPanel',
    'Pet_ShowcasePanel',
    'Talent_PointPanel',
    'Settings_MainPanel',
    'Merge_MainPanel',
    'Explore_MapPanel',
    'Guild_MainPanel',
  ]) {
    assertIncludes(ui, token, 'SECONDARY_PAGES', 'A referenced design page is still missing a real UI screen.', 'UIUXAgent', 'Replace generic placeholder screens with real page skeletons and basic interaction nodes.');
  }

  for (const token of [
    "pet: () => this.buildPlaceholder",
    "talent: () => this.buildPlaceholder",
    "dailyTask: () => this.buildPlaceholder",
    "achievement: () => this.buildPlaceholder",
    "mail: () => this.buildPlaceholder",
    "settings: () => this.buildPlaceholder",
  ]) {
    assertNotIncludes(ui, token, 'SECONDARY_PAGES', 'A referenced design page is still routed to a generic placeholder.', 'UIUXAgent', 'Route each design-backed page to a dedicated build method.');
  }
}

if (failures.length > 0) {
  console.error('[design-reference-audit] FAIL: page implementation does not match current design references.');
  for (const failure of failures) {
    console.error(`[design-reference-audit] ${failure.priority} ${failure.page}`);
    console.error(`  Issue: ${failure.issue}`);
    console.error(`  Evidence: ${failure.evidence}`);
    console.error(`  Owner Agent: ${failure.owner}`);
    console.error(`  Suggested Fix: ${failure.suggestedFix}`);
  }
  process.exit(1);
}

const legacySuffix = legacyDesignImages.length > 0 ? ` plus ${legacyDesignImages.length} legacy reference image(s)` : '';
console.log(`[design-reference-audit] PASS: LOGIN_01, HOME_01, and secondary page skeleton contracts checked against ${annotatedDesignImages.length}/${expectedAnnotatedPageCount} annotated design page(s)${legacySuffix}.`);
