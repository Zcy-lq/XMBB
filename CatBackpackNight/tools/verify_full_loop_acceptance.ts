import { createDefaultSave } from '../assets/scripts/data/DefaultSave';
import { GameSaveData } from '../assets/scripts/data/GameTypes';
import { BattleRewardSystem } from '../assets/scripts/game/BattleRewardSystem';
import { BattleSessionModel } from '../assets/scripts/game/BattleSessionModel';
import { GameConfigRepository, getDefaultGameLogicConfigs } from '../assets/scripts/game/GameConfigRepository';
import { InventorySystem } from '../assets/scripts/game/InventorySystem';
import { MailSystem } from '../assets/scripts/game/MailSystem';
import { ProgressionSystem } from '../assets/scripts/game/ProgressionSystem';
import { ShopSystem } from '../assets/scripts/game/ShopSystem';

interface CheckRow {
  step: string;
  passed: boolean;
  detail: string;
}

const checks: CheckRow[] = [];

function check(step: string, passed: boolean, detail: string): void {
  checks.push({ step, passed, detail });
}

function cloneSave(save: GameSaveData): GameSaveData {
  return JSON.parse(JSON.stringify(save)) as GameSaveData;
}

function seededRng(seed: number): () => number {
  let state = seed % 2147483647;
  return () => {
    state = (state * 48271) % 2147483647;
    return state / 2147483647;
  };
}

const save = createDefaultSave(1710000000000);
const repo = new GameConfigRepository(getDefaultGameLogicConfigs());
const progression = new ProgressionSystem(repo);
const inventory = new InventorySystem(repo);
const shop = new ShopSystem(repo, progression);
const battleRewards = new BattleRewardSystem(repo, progression);
const mail = new MailSystem(repo);
progression.syncConfiguredSaveRows(save);

check('clear_save', !save.settings.acceptedAgreement && save.progress.currentWave === 1, 'fresh default save starts at login gate and wave 1');

const blockedStart = !save.settings.acceptedAgreement;
check('agreement_gate_blocks_start', blockedStart, 'start is blocked until agreement is accepted');

save.settings.acceptedAgreement = true;
check('accept_agreement_enters_home', save.settings.acceptedAgreement, 'agreement accepted in save state');

const powerBeforeGrowth = progression.getPower(save);
const firstStart = battleRewards.startBattle(save, save.progress.currentWave);
check('start_first_battle', firstStart.ok && firstStart.data?.wave === 1, firstStart.message);

const firstSession = new BattleSessionModel(save, repo, { battleId: firstStart.data?.battleId, rng: seededRng(11) });
for (let i = 0; i < 160 && firstSession.state.status === 'running'; i += 1) {
  firstSession.tick(0.5);
}
check('first_battle_reaches_settlement', firstSession.state.status === 'victory', `status=${firstSession.state.status}`);

const goldBeforeReward = save.currencies.gold;
const settlement = battleRewards.settle(save, {
  battleId: firstStart.data?.battleId ?? 'full_loop_first_battle',
  wave: firstSession.state.wave,
  status: firstSession.state.status,
  defeatedMonsters: firstSession.state.defeatedMonsters,
  rng: seededRng(12),
});
check('claim_reward_once', settlement.ok && save.currencies.gold > goldBeforeReward, settlement.message);

const goldBeforeDoubleReward = save.currencies.gold;
const adTaskProgressBefore = save.dailyTasks.find((task) => task.id === 'daily_ad_1')?.progress ?? 0;
const doubleReward = battleRewards.claimDoubleReward(save, {
  battleId: firstStart.data?.battleId ?? 'full_loop_first_battle',
  wave: firstSession.state.wave,
  status: firstSession.state.status,
  defeatedMonsters: firstSession.state.defeatedMonsters,
  adState: 'success',
});
check(
  'battle_double_reward_after_ad',
  doubleReward.ok &&
    save.currencies.gold > goldBeforeDoubleReward &&
    (save.daily.adPlacementCounts?.battle_reward_double ?? 0) === 1 &&
    (save.dailyTasks.find((task) => task.id === 'daily_ad_1')?.progress ?? 0) > adTaskProgressBefore,
  doubleReward.message,
);

const doubleRewardAgain = battleRewards.claimDoubleReward(save, {
  battleId: firstStart.data?.battleId ?? 'full_loop_first_battle',
  wave: firstSession.state.wave,
  status: firstSession.state.status,
  defeatedMonsters: firstSession.state.defeatedMonsters,
  adState: 'success',
});
check(
  'battle_double_duplicate_blocked',
  !doubleRewardAgain.ok && doubleRewardAgain.reason === 'already_claimed',
  doubleRewardAgain.message,
);

const cancelledDoubleSave = cloneSave(save);
const cancelledDoubleBefore = JSON.stringify({
  currencies: cancelledDoubleSave.currencies,
  dailyTasks: cancelledDoubleSave.dailyTasks,
  adPlacementCounts: cancelledDoubleSave.daily.adPlacementCounts,
  claimedRewardIds: cancelledDoubleSave.progress.claimedRewardIds,
});
const cancelledDouble = battleRewards.claimDoubleReward(cancelledDoubleSave, {
  battleId: 'full_loop_cancelled_ad',
  wave: firstSession.state.wave,
  status: firstSession.state.status,
  defeatedMonsters: firstSession.state.defeatedMonsters,
  adState: 'cancelled',
});
check(
  'battle_double_cancelled_ad_no_mutation',
  !cancelledDouble.ok &&
    cancelledDouble.reason === 'ad_not_completed' &&
    JSON.stringify({
      currencies: cancelledDoubleSave.currencies,
      dailyTasks: cancelledDoubleSave.dailyTasks,
      adPlacementCounts: cancelledDoubleSave.daily.adPlacementCounts,
      claimedRewardIds: cancelledDoubleSave.progress.claimedRewardIds,
    }) === cancelledDoubleBefore,
  cancelledDouble.message,
);

const duplicateSettlement = battleRewards.settle(save, {
  battleId: firstStart.data?.battleId ?? 'full_loop_first_battle',
  wave: firstSession.state.wave,
  status: firstSession.state.status,
  defeatedMonsters: firstSession.state.defeatedMonsters,
});
check('duplicate_reward_blocked', !duplicateSettlement.ok && duplicateSettlement.reason === 'already_claimed', duplicateSettlement.message);

const defeatSave = cloneSave(save);
const defeatWaveBefore = defeatSave.progress.currentWave;
const defeatEnergyBefore = defeatSave.currencies.energy;
const defeatStart = battleRewards.startBattle(defeatSave, defeatWaveBefore);
const defeatSettlement = battleRewards.settle(defeatSave, {
  battleId: defeatStart.data?.battleId ?? 'full_loop_defeat_battle',
  wave: defeatWaveBefore,
  status: 'defeat',
  defeatedMonsters: 1,
});
check(
  'defeat_settlement_no_wave_advance',
  defeatStart.ok && defeatSettlement.ok && defeatSettlement.data?.victory === false && defeatSave.progress.currentWave === defeatWaveBefore,
  `wave=${defeatSave.progress.currentWave}, energy=${defeatEnergyBefore}->${defeatSave.currencies.energy}, ${defeatSettlement.message}`,
);

const merge = inventory.mergeWeapon(save, 'weapon_sword', 1);
if (merge.ok) {
  progression.recordEvent(save, 'weaponMerge', 1);
}
check('backpack_merge', merge.ok && save.inventory.some((item) => item.itemId === 'weapon_sword' && item.level === 2), merge.message);

const mergeFailureBefore = JSON.stringify(save.inventory);
const mergeFailure = inventory.mergeWeapon(save, 'weapon_bow', 2);
check(
  'merge_failure_no_mutation',
  !mergeFailure.ok && mergeFailure.reason === 'insufficient_item' && JSON.stringify(save.inventory) === mergeFailureBefore,
  mergeFailure.message,
);

const petUpgrade = progression.upgradePet(save, 'pet_shadow_cat');
check('selected_pet_upgrade', petUpgrade.ok && petUpgrade.data?.pet.id === 'pet_shadow_cat', petUpgrade.message);

const petFailureSave = cloneSave(save);
petFailureSave.inventory = petFailureSave.inventory.filter((item) => item.itemId !== 'pet_material_common');
const petFailureBefore = JSON.stringify(petFailureSave);
const petUpgradeFailure = progression.upgradePet(petFailureSave, 'pet_shadow_cat');
check(
  'pet_upgrade_failure_no_mutation',
  !petUpgradeFailure.ok && petUpgradeFailure.reason === 'insufficient_item' && JSON.stringify(petFailureSave) === petFailureBefore,
  petUpgradeFailure.message,
);

const talentUpgrade = progression.upgradeTalent(save, 'attack_power_01');
check('selected_talent_upgrade', talentUpgrade.ok && talentUpgrade.data?.node.id === 'attack_power_01', talentUpgrade.message);

const talentFailureSave = createDefaultSave(1710000000000);
progression.syncConfiguredSaveRows(talentFailureSave);
const talentFailureBefore = JSON.stringify(talentFailureSave);
const talentPrerequisite = progression.upgradeTalent(talentFailureSave, 'attack_speed_01');
check(
  'talent_prerequisite_blocked',
  !talentPrerequisite.ok && talentPrerequisite.reason === 'prerequisite_missing' && JSON.stringify(talentFailureSave) === talentFailureBefore,
  talentPrerequisite.message,
);

const powerAfterGrowth = progression.getPower(save);
check('power_changes_after_growth', powerAfterGrowth > powerBeforeGrowth, `${powerBeforeGrowth} -> ${powerAfterGrowth}`);

check(
  'task_progress_updates',
  (save.dailyTasks.find((task) => task.id === 'daily_battle_3')?.progress ?? 0) >= 1 &&
    (save.dailyTasks.find((task) => task.id === 'daily_merge_5')?.progress ?? 0) >= 1,
  JSON.stringify(save.dailyTasks),
);

const taskGemBefore = save.currencies.purpleGem;
const taskClaim = progression.claimDailyTask(save, 'daily_login');
check('task_claim', taskClaim.ok && save.currencies.purpleGem > taskGemBefore, taskClaim.message);
const taskClaimAgain = progression.claimDailyTask(save, 'daily_login');
check('task_duplicate_blocked', !taskClaimAgain.ok && taskClaimAgain.reason === 'already_claimed', taskClaimAgain.message);
progression.recordEvent(save, 'battleComplete', 2);
progression.recordEvent(save, 'weaponMerge', 4);
const battleTaskClaim = progression.claimDailyTask(save, 'daily_battle_3');
const mergeTaskClaim = progression.claimDailyTask(save, 'daily_merge_5');
check('task_multi_claim_progression', battleTaskClaim.ok && mergeTaskClaim.ok, `${battleTaskClaim.message}; ${mergeTaskClaim.message}`);
const activityGoldBefore = save.currencies.gold;
const activityChestClaim = progression.claimActivityChest(save, 'activity_30');
check(
  'activity_chest_claim',
  activityChestClaim.ok && save.daily.activityClaimedIds.includes('activity_30') && save.currencies.gold > activityGoldBefore,
  activityChestClaim.message,
);
const activityChestAgain = progression.claimActivityChest(save, 'activity_30');
check('activity_chest_duplicate_blocked', !activityChestAgain.ok && activityChestAgain.reason === 'already_claimed', activityChestAgain.message);

progression.recordEvent(save, 'highestWave', 5);
const achievementGemBefore = save.currencies.purpleGem;
const achievementClaim = progression.claimAchievement(save, 'wave_5');
check('achievement_claim', achievementClaim.ok && save.currencies.purpleGem > achievementGemBefore, achievementClaim.message);
const achievementClaimAgain = progression.claimAchievement(save, 'wave_5');
check('achievement_duplicate_blocked', !achievementClaimAgain.ok && achievementClaimAgain.reason === 'already_claimed', achievementClaimAgain.message);

const mailGoldBefore = save.currencies.gold;
const unclaimedDeleteBefore = JSON.stringify(save.mails);
const unclaimedDelete = mail.deleteMail(save, 'mail_maintenance');
check(
  'mail_unclaimed_delete_blocked',
  !unclaimedDelete.ok && unclaimedDelete.reason === 'not_ready' && JSON.stringify(save.mails) === unclaimedDeleteBefore,
  unclaimedDelete.message,
);
const mailClaim = mail.claimMail(save, 'mail_login_gift', 1710000000000);
check('mail_claim', mailClaim.ok && save.currencies.gold > mailGoldBefore, mailClaim.message);
const mailClaimAgain = mail.claimMail(save, 'mail_login_gift', 1710000000000);
check('mail_duplicate_blocked', !mailClaimAgain.ok && mailClaimAgain.reason === 'already_claimed', mailClaimAgain.message);
const mailDelete = mail.deleteMail(save, 'mail_login_gift');
check('mail_delete_after_claim', mailDelete.ok && !save.mails.some((row) => row.id === 'mail_login_gift'), mailDelete.message);
const mailGemBefore = save.currencies.purpleGem;
const mailClaimAll = mail.claimAllMails(save, 1710000000000);
check(
  'mail_claim_all',
  mailClaimAll.ok && mailClaimAll.data?.claimed.includes('mail_maintenance') && save.currencies.purpleGem > mailGemBefore,
  mailClaimAll.message,
);
const mailClaimAllAgain = mail.claimAllMails(save, 1710000000000);
check('mail_claim_all_duplicate_blocked', !mailClaimAllAgain.ok && mailClaimAllAgain.reason === 'not_ready', mailClaimAllAgain.message);
const mailDeleteAll = mail.deleteClaimedAndEmptyMails(save);
check(
  'mail_delete_all_safe',
  mailDeleteAll.ok && !save.mails.some((row) => row.claimed || row.attachments.length === 0),
  mailDeleteAll.message,
);

const shopGoldBefore = save.currencies.gold;
const shopBuy = shop.buy(save, 'daily_free_gold');
check('shop_free_good_once', shopBuy.ok && save.currencies.gold > shopGoldBefore, shopBuy.message);
const shopBuyAgain = shop.buy(save, 'daily_free_gold');
check('shop_duplicate_limit_blocked', !shopBuyAgain.ok && ['already_claimed', 'daily_limit_reached'].includes(shopBuyAgain.reason ?? ''), shopBuyAgain.message);
const paidShopGemBefore = save.currencies.purpleGem;
const paidShopMaterialBefore =
  save.inventory.find((item) => item.itemId === 'pet_material_common' && item.itemType === 'material' && item.level === 1)?.count ?? 0;
const paidShopBuy = shop.buy(save, 'daily_pet_food');
const paidShopMaterialAfter =
  save.inventory.find((item) => item.itemId === 'pet_material_common' && item.itemType === 'material' && item.level === 1)?.count ?? 0;
check(
  'shop_paid_purchase_deducts_and_grants',
  paidShopBuy.ok && save.currencies.purpleGem < paidShopGemBefore && paidShopMaterialAfter > paidShopMaterialBefore,
  paidShopBuy.message,
);

const shopFailureSave = cloneSave(save);
shopFailureSave.currencies.purpleGem = 0;
const shopFailureBefore = JSON.stringify({ currencies: shopFailureSave.currencies, inventory: shopFailureSave.inventory, daily: shopFailureSave.daily });
const shopFailure = shop.buy(shopFailureSave, 'daily_pet_food');
const shopFailureAfter = JSON.stringify({ currencies: shopFailureSave.currencies, inventory: shopFailureSave.inventory, daily: shopFailureSave.daily });
check(
  'shop_insufficient_resource_no_mutation',
  !shopFailure.ok && shopFailure.reason === 'insufficient_currency' && shopFailureAfter === shopFailureBefore,
  shopFailure.message,
);

save.settings.musicEnabled = false;
save.settings.powerSavingEnabled = true;

const secondStart = battleRewards.startBattle(save, save.progress.currentWave);
check('start_second_battle_after_growth', secondStart.ok && (secondStart.data?.wave ?? 0) >= 2, secondStart.message);

const restored = cloneSave(save);
progression.syncConfiguredSaveRows(restored);
check(
  'restart_restore_save',
  restored.settings.acceptedAgreement &&
    restored.progress.currentWave >= 2 &&
    restored.pets.find((pet) => pet.id === 'pet_shadow_cat')?.level === 2 &&
    (restored.talents.find((node) => node.id === 'attack_power_01')?.level ?? 0) >= 1 &&
    restored.inventory.some((item) => item.itemId === 'weapon_sword' && item.level === 2) &&
    restored.settings.musicEnabled === false &&
    restored.settings.powerSavingEnabled === true,
  `wave=${restored.progress.currentWave}, pet=${restored.pets.find((pet) => pet.id === 'pet_shadow_cat')?.level}, talent=${restored.talents.find((node) => node.id === 'attack_power_01')?.level}, settings=${JSON.stringify(restored.settings)}`,
);

check(
  'settings_persist_after_restart',
  restored.settings.musicEnabled === false && restored.settings.powerSavingEnabled === true,
  JSON.stringify(restored.settings),
);

const noNegativeCurrency = Object.values(restored.currencies).every((value) => value >= 0);
check('economy_non_negative', noNegativeCurrency, JSON.stringify(restored.currencies));

const failed = checks.filter((row) => !row.passed);
console.log(`[full-loop-acceptance] ${JSON.stringify({ passed: failed.length === 0, checks: checks.length, failed: failed.length })}`);
for (const row of checks) {
  console.log(`[full-loop-acceptance] ${row.passed ? 'PASS' : 'FAIL'} ${row.step}: ${row.detail}`);
}

if (failed.length > 0) {
  process.exit(1);
}
