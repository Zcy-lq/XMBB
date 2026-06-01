import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const workspaceRoot = path.resolve(projectRoot, '..');
const designDir = path.join(workspaceRoot, '设计图');
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

if (!fs.existsSync(designDir)) {
  fail(
    'P0',
    'ALL',
    'Design reference directory is missing.',
    path.relative(workspaceRoot, designDir),
    'ProductAgent/UIUXAgent',
    'Create the design reference directory and place annotated page references there.',
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

let designImages = [];
if (fs.existsSync(designDir)) {
  designImages = fs.readdirSync(designDir)
    .filter((name) => /\.(png|jpg|jpeg)$/i.test(name))
    .map((name) => {
      const filePath = path.join(designDir, name);
      return { name, filePath, size: name.toLowerCase().endsWith('.png') ? pngSize(filePath) : null };
    });

  if (designImages.length < 2) {
    fail(
      'P0',
      'ALL',
      'Not enough page design references were found.',
      `Found ${designImages.length} image(s) in ${path.relative(workspaceRoot, designDir)}`,
      'ProductAgent/UIUXAgent',
      'Add at least LOGIN_01 and HOME_01 annotated design images before claiming UI delivery.',
    );
  }

  const portraitSheets = designImages.filter((image) => image.size && image.size.height > image.size.width);
  if (portraitSheets.length < 2) {
    fail(
      'P1',
      'ALL',
      'Design sheets do not look like portrait WeChat mini game references.',
      `Portrait PNG sheets found: ${portraitSheets.length}`,
      'UIUXAgent',
      'Use vertical annotated references for login and home pages.',
    );
  }
}

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
    "this.addBottomNav('home')",
    'NavButton_home',
    'NavButton_merge',
    'NavButton_explore',
    'NavButton_guild',
  ]) {
    assertIncludes(ui, token, 'HOME_01', 'Home page does not match the annotated HOME_01 layout.', 'UIUXAgent', 'Rebuild the home page around top resources, top function row, left/right feature rails, stage selector, start CTA, and home-active bottom nav.');
  }

  for (const token of [
    'Home_StageCard',
    'Home_CampBriefPanel',
    'Home_DailyTaskSummary',
    'Home_MailSummary',
    'Home_SupplySummary',
    'Home_SideRail',
    "this.addBottomNav('battle')",
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
    "if (name.includes('NavButton_home')) return 'home';",
    "if (name.includes('NavButton_battle')) return 'battlePrepare';",
    "if (name.includes('NavButton_merge')) return 'merge';",
    "if (name.includes('NavButton_explore')) return 'explore';",
    "if (name.includes('NavButton_guild')) return 'guild';",
    "if (name.includes('NavIcon_home')) return UIAssetKeys.icons.home;",
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

console.log(`[design-reference-audit] PASS: LOGIN_01, HOME_01, and secondary page skeleton contracts checked against ${designImages.length} design image(s).`);
