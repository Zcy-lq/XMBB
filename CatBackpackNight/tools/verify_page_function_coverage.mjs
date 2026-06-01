import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (...segments) => fs.readFileSync(path.join(projectRoot, ...segments), 'utf8');

const gameTypes = read('assets', 'scripts', 'data', 'GameTypes.ts');
const routeConfig = read('assets', 'scripts', 'configs', 'RouteConfig.ts');
const uiBuilder = read('assets', 'scripts', 'ui', 'UISkeletonBuilder.ts');
const baseScene = read('assets', 'scripts', 'scenes', 'BaseSceneEntry.ts');
const screenshotDir = path.join(projectRoot, 'tmp', 'final_mobile_pages_after_ui_pass');

const routes = [
  'login',
  'home',
  'battlePrepare',
  'battle',
  'merge',
  'mergeGuide',
  'explore',
  'guild',
  'backpack',
  'shop',
  'pet',
  'petDetail',
  'talent',
  'dailyTask',
  'achievement',
  'mail',
  'mailDetail',
  'settings',
  'policyModal',
  'confirmModal',
  'toastModal',
  'pauseModal',
  'skillChoice',
  'victory',
  'defeat',
];

const screenshotByRoute = {
  login: '01_login.png',
  home: '02_home.png',
  battlePrepare: '03_battle_prepare.png',
  battle: '04_battle.png',
  pauseModal: '05_pause_modal.png',
  skillChoice: '06_skill_choice.png',
  victory: '07_victory.png',
  defeat: '08_defeat.png',
  backpack: '09_backpack.png',
  mergeGuide: '10_merge_guide.png',
  shop: '11_shop.png',
  pet: '12_pet.png',
  petDetail: '13_pet_detail.png',
  talent: '14_talent.png',
  dailyTask: '15_daily_task.png',
  achievement: '16_achievement.png',
  mail: '17_mail.png',
  mailDetail: '18_mail_detail.png',
  settings: '19_settings.png',
  policyModal: '20_policy_modal.png',
  confirmModal: '21_confirm_modal.png',
  toastModal: '22_toast_modal.png',
};

const routeBuilderMethods = {
  login: 'buildLogin',
  home: 'buildHome',
  battlePrepare: 'buildBattlePrepare',
  battle: 'buildBattle',
  merge: 'buildMerge',
  mergeGuide: 'buildMergeGuide',
  explore: 'buildExplore',
  guild: 'buildGuild',
  backpack: 'buildBackpack',
  shop: 'buildShop',
  pet: 'buildPet',
  petDetail: 'buildPetDetail',
  talent: 'buildTalent',
  dailyTask: 'buildDailyTask',
  achievement: 'buildAchievement',
  mail: 'buildMail',
  mailDetail: 'buildMailDetail',
  settings: 'buildSettings',
  policyModal: 'buildPolicyModal',
  confirmModal: 'buildConfirmModal',
  toastModal: 'buildToastModal',
  pauseModal: 'buildPauseModal',
  skillChoice: 'buildSkillChoice',
  victory: 'buildVictoryReward',
  defeat: 'buildDefeatReward',
};

const pageContracts = {
  login: ['Button_StartGame', 'Button_ToggleAgreement', 'Button_PolicyAgree', "SceneRouter.instance.go('home')"],
  home: ['TopEntry_DailyTask', 'TopEntry_Mail', 'LeftEntry_Backpack', 'LeftEntry_Shop', 'Button_StartBattle', "NavButton_merge')) return 'merge'"],
  battlePrepare: ['BattlePrepare_HeroCat', 'Button_Back_BattlePrepare', 'Button_Close_BattlePrepare', 'Button_StartBattle', 'gameLogic.startBattle()', "SceneRouter.instance.go('battle')", "return 'home'"],
  battle: ['Button_BattlePause', "'Button_BattlePause')) return 'pauseModal'", 'Button_AutoMerge', 'updateBattleLiveState'],
  merge: ['Button_MergeConfirm', 'gameLogic.autoMergeAll()', "this.addBottomNav('merge')"],
  mergeGuide: ['MergeGuide_Modal', 'Button_MergeGuideConfirm', 'Button_MergeGuideHelp', 'settings.mergeGuideSeen', 'draft.settings.mergeGuideSeen = true'],
  explore: ['Explore_MapPanel', 'Button_ExploreStart', '探索系统暂未开放'],
  guild: ['Guild_MainPanel', 'Button_GuildCheckIn', 'Button_GuildHelp'],
  backpack: ['Button_Merge', 'Button_OpenChest', 'Button_BackpackSort', 'gameLogic.openChest()'],
  shop: ['Button_RefreshShopSmall', 'buyShopGoodsFromButton', 'Button_ShopAddCurrency', 'gameLogic.refreshShop'],
  pet: ['Button_PetSelect_', 'Button_PetLevelUp', 'Button_PetDeploy', 'gameLogic.upgradePet'],
  petDetail: ['Button_PetDetailUpgrade', 'Button_PetDetailDeploy', 'Button_PetDetailBackList', "Button_PetDetailBackList') || name.includes('Button_PetDetailDeploy')) return 'pet'"],
  talent: ['Button_TalentSelect_', 'Button_TalentLearn', 'Button_TalentReset', 'gameLogic.upgradeTalent'],
  dailyTask: ['Button_DailyTaskClaim_', 'Button_ActivityChest_', 'gameLogic.claimDailyTask', 'gameLogic.claimActivityChest'],
  achievement: ['Button_AchievementClaim_', 'Button_AchievementClaimAll', 'gameLogic.claimAchievement', 'gameLogic.claimAllAchievements'],
  mail: ['Button_MailOpen_', 'Button_MailClaim_', 'Button_MailClaimAll', 'Button_MailDeleteAll', 'gameLogic.claimAllMails'],
  mailDetail: ['Button_MailDetailClaim', 'Button_MailDetailDelete', 'Button_MailDetailReply', 'getSelectedMail'],
  settings: ['Button_Settings_Privacy', 'Settings_VersionPanel', 'versionConfig.appVersion', 'Button_SettingsLogout', 'toggleSettingFromButton', 'SaveManager.instance.reset()'],
  policyModal: ['Policy_ScrollTextArea', 'Button_PolicyAgree', 'Button_PolicyDisagree', 'Button_PolicyClose'],
  confirmModal: ['Confirm_Modal', 'Button_ConfirmCancel', 'Button_ConfirmOk', 'Button_ConfirmClose'],
  toastModal: ['ToastCard_Info', 'ToastCard_Success', 'ToastCard_Warning', 'ToastCard_Error'],
  pauseModal: ['Button_PauseContinue', 'Button_PauseRestart', 'Button_PauseHome', "SceneRouter.instance.go('home')"],
  skillChoice: ['Button_SkillChoiceClose', 'Button_RefreshVideo', 'Button_SkillChoiceAutoMerge', '_Choose'],
  victory: ['Button_RewardDouble', 'Button_RewardConfirm', 'Reward_Chest_rt_item_chest', "SceneRouter.instance.go('home')"],
  defeat: ['Button_DefeatRetry', 'Button_DefeatUpgrade', 'Button_DefeatHome', "SceneRouter.instance.go('battlePrepare')"],
};

const failures = [];

function fail(message) {
  failures.push(message);
}

function requireIncludes(source, token, label) {
  if (!source.includes(token)) {
    fail(`${label} is missing required token: ${token}`);
  }
}

function requireMatch(source, pattern, label) {
  if (!pattern.test(source)) {
    fail(`${label} is missing required pattern: ${pattern}`);
  }
}

for (const route of routes) {
  requireMatch(gameTypes, new RegExp(`\\|\\s*'${route}'`), `RouteId ${route}`);
  requireMatch(routeConfig, new RegExp(`${route}:\\s*\\{[^}]*id:\\s*'${route}'`, 's'), `RouteConfig ${route}`);
  requireIncludes(baseScene, `'${route}'`, `BaseScene preview allow-list ${route}`);

  const builderMethod = routeBuilderMethods[route];
  requireMatch(uiBuilder, new RegExp(`${route}:\\s*\\(\\)\\s*=>\\s*this\\.${builderMethod}\\(\\)`), `UISkeletonBuilder route ${route}`);
  requireMatch(uiBuilder, new RegExp(`private ${builderMethod}\\(\\): void`), `UISkeletonBuilder method ${builderMethod}`);
}

for (const [route, screenshotName] of Object.entries(screenshotByRoute)) {
  const screenshotPath = path.join(screenshotDir, screenshotName);
  if (!fs.existsSync(screenshotPath)) {
    fail(`Route ${route} is missing screenshot evidence: tmp/final_mobile_pages_after_ui_pass/${screenshotName}`);
  }
}

for (const [route, tokens] of Object.entries(pageContracts)) {
  for (const token of tokens) {
    requireIncludes(uiBuilder, token, `Page function contract ${route}`);
  }
}

for (const forbidden of [
  "pet: () => this.buildPlaceholder",
  "talent: () => this.buildPlaceholder",
  "dailyTask: () => this.buildPlaceholder",
  "achievement: () => this.buildPlaceholder",
  "mail: () => this.buildPlaceholder",
  "settings: () => this.buildPlaceholder",
]) {
  if (uiBuilder.includes(forbidden)) {
    fail(`Design-backed route still points to placeholder: ${forbidden}`);
  }
}

if (failures.length > 0) {
  console.error('[page-function-coverage] FAIL');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`[page-function-coverage] PASS ${routes.length} routes, ${Object.keys(screenshotByRoute).length} screenshots, and ${Object.keys(pageContracts).length} page function contracts verified.`);
