import { createDefaultSave, getLocalDateKey } from '../assets/scripts/data/DefaultSave';
import { GameSaveData } from '../assets/scripts/data/GameTypes';
import { calculateDefaultRedDots } from '../assets/scripts/core/DefaultRedDotRules';
import { BattleRewardSystem } from '../assets/scripts/game/BattleRewardSystem';
import { BattleSessionModel } from '../assets/scripts/game/BattleSessionModel';
import { refreshDailySaveIfNeeded } from '../assets/scripts/game/DailyResetSystem';
import { EconomySystem } from '../assets/scripts/game/EconomySystem';
import { GameConfigRepository, getDefaultGameLogicConfigs } from '../assets/scripts/game/GameConfigRepository';
import { InventorySystem } from '../assets/scripts/game/InventorySystem';
import { MailSystem } from '../assets/scripts/game/MailSystem';
import { ProgressionSystem } from '../assets/scripts/game/ProgressionSystem';
import { ShopSystem } from '../assets/scripts/game/ShopSystem';

declare const process: { exit(code?: number): never };

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

function tickSessionThroughSkillChoices(session: BattleSessionModel, ticks: number, deltaSec: number): void {
  for (let i = 0; i < ticks && session.state.status === 'running'; i += 1) {
    const events = session.tick(deltaSec);
    if (events.some((event) => event.type === 'skillReady')) {
      session.applySkillChoice(0);
    }
  }
}

const save = createDefaultSave(1710000000000);
const repo = new GameConfigRepository(getDefaultGameLogicConfigs());
const progression = new ProgressionSystem(repo);
const inventory = new InventorySystem(repo);
const economy = new EconomySystem(repo);
const shop = new ShopSystem(repo, progression);
const battleRewards = new BattleRewardSystem(repo, progression);
const mail = new MailSystem(repo);
progression.syncConfiguredSaveRows(save);

const releaseEnergyRepo = new GameConfigRepository({
  ...repo.configs,
  levels: {
    ...repo.configs.levels,
    battle: {
      ...repo.configs.levels.battle,
      unlimitedEnergyInDevelopment: false,
    },
  },
});
const releaseEnergyProgression = new ProgressionSystem(releaseEnergyRepo);
const releaseEnergyBattleRewards = new BattleRewardSystem(releaseEnergyRepo, releaseEnergyProgression);

check('clear_save', !save.settings.acceptedAgreement && save.progress.currentWave === 1, 'fresh default save starts at login gate and wave 1');

const blockedStart = !save.settings.acceptedAgreement;
check('agreement_gate_blocks_start', blockedStart, 'start is blocked until agreement is accepted');

save.settings.acceptedAgreement = true;
check('accept_agreement_enters_home', save.settings.acceptedAgreement, 'agreement accepted in save state');

const powerBeforeGrowth = progression.getPower(save);
const firstStart = battleRewards.startBattle(save, save.progress.currentWave);
check('start_first_battle', firstStart.ok && firstStart.data?.wave === 1, firstStart.message);

const releaseNoEnergySave = createDefaultSave(1710000000000);
releaseEnergyProgression.syncConfiguredSaveRows(releaseNoEnergySave);
releaseNoEnergySave.currencies.energy = 0;
const releaseNoEnergyBefore = JSON.stringify({ currencies: releaseNoEnergySave.currencies, progress: releaseNoEnergySave.progress, stats: releaseNoEnergySave.stats });
const releaseNoEnergyStart = releaseEnergyBattleRewards.startBattle(releaseNoEnergySave, releaseNoEnergySave.progress.currentWave);
check(
  'release_energy_insufficient_blocks_start_no_mutation',
  !releaseNoEnergyStart.ok &&
    releaseNoEnergyStart.reason === 'insufficient_currency' &&
    JSON.stringify({ currencies: releaseNoEnergySave.currencies, progress: releaseNoEnergySave.progress, stats: releaseNoEnergySave.stats }) === releaseNoEnergyBefore,
  releaseNoEnergyStart.message,
);
const releaseEnergySave = createDefaultSave(1710000000000);
releaseEnergyProgression.syncConfiguredSaveRows(releaseEnergySave);
const releaseEnergyBefore = releaseEnergySave.currencies.energy;
const releaseEnergyStart = releaseEnergyBattleRewards.startBattle(releaseEnergySave, releaseEnergySave.progress.currentWave);
check(
  'release_energy_start_spends_configured_cost',
  releaseEnergyStart.ok &&
    releaseEnergyStart.data?.energyCost === repo.configs.levels.battle.energyCost &&
    releaseEnergySave.currencies.energy === releaseEnergyBefore - repo.configs.levels.battle.energyCost,
  releaseEnergyStart.message,
);

const firstSession = new BattleSessionModel(save, repo, { battleId: firstStart.data?.battleId, rng: seededRng(11) });
tickSessionThroughSkillChoices(firstSession, 160, 0.5);
check('first_battle_reaches_settlement', firstSession.state.status === 'victory', `status=${firstSession.state.status}`);

const battleControlSession = new BattleSessionModel(save, repo, { battleId: 'full_loop_control_session', rng: seededRng(31) });
battleControlSession.pause();
const pausedElapsed = battleControlSession.state.elapsedSeconds;
const pausedEvents = battleControlSession.tick(5);
battleControlSession.resume();
const resumedEvents = battleControlSession.tick(0.5);
check(
  'battle_pause_resume_blocks_and_restores_ticks',
  pausedEvents.length === 0 && battleControlSession.state.elapsedSeconds > pausedElapsed && resumedEvents.length > 0,
  `pausedEvents=${pausedEvents.length}, resumedEvents=${resumedEvents.length}, elapsed=${battleControlSession.state.elapsedSeconds}`,
);
battleControlSession.setAutoMerge(false);
const autoMergeOff = battleControlSession.state.autoMergeEnabled === false;
battleControlSession.setAutoMerge(true);
check('battle_auto_merge_toggle_state', autoMergeOff && battleControlSession.state.autoMergeEnabled === true, `${battleControlSession.state.autoMergeEnabled}`);

const skillSession = new BattleSessionModel(save, repo, { battleId: 'full_loop_skill_session', rng: seededRng(32) });
const skillReadyEvents = skillSession.tick(repo.configs.levels.battle.skillChoiceAtSecond);
const skillDamageBefore = skillSession.state.weaponSlots[0]?.damage ?? 0;
const skillApply = skillSession.applySkill('skill_flame_power');
const skillApplyAgain = skillSession.applySkill('skill_flame_power');
const skillDamageAfter = skillSession.state.weaponSlots[0]?.damage ?? 0;
check(
  'skill_choice_offer_apply_and_duplicate_block',
  skillReadyEvents.some((event) => event.type === 'skillReady') &&
    skillApply.ok &&
    !skillApplyAgain.ok &&
    skillSession.state.activeSkillIds.includes('skill_flame_power') &&
    skillDamageAfter > skillDamageBefore,
  `${skillApply.message}; duplicate=${skillApplyAgain.message}; damage=${skillDamageBefore}->${skillDamageAfter}`,
);

const skillFlowSession = new BattleSessionModel(save, repo, { battleId: 'full_loop_skill_flow_session', rng: seededRng(33) });
const skillFlowReadyEvents = skillFlowSession.tick(repo.configs.levels.battle.skillChoiceAtSecond);
const skillFlowPausedAfterReady = skillFlowSession.state.paused;
const skillFlowChoices = skillFlowSession.getSkillChoices();
const skillFlowReroll = skillFlowSession.rerollSkillChoices();
const skillFlowChoicesAfterReroll = skillFlowSession.getSkillChoices();
const skillFlowRerollAgain = skillFlowSession.rerollSkillChoices();
const skillFlowApplyChoice = skillFlowSession.applySkillChoice(0);
check(
  'skill_choice_reroll_once_and_apply_choice',
  skillFlowReadyEvents.some((event) => event.type === 'skillReady') &&
    skillFlowPausedAfterReady === true &&
    skillFlowChoices.length === 3 &&
    skillFlowReroll.ok &&
    skillFlowChoicesAfterReroll.length === 3 &&
    skillFlowSession.state.skillRerollsRemaining === 0 &&
    !skillFlowRerollAgain.ok &&
    skillFlowRerollAgain.message.includes('used') &&
    skillFlowApplyChoice.ok &&
    skillFlowSession.state.paused === false &&
    skillFlowSession.state.activeSkillIds.includes(skillFlowApplyChoice.data?.id ?? ''),
  `${skillFlowReroll.message}; second=${skillFlowRerollAgain.message}; apply=${skillFlowApplyChoice.message}`,
);

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

const firstClearSave = createDefaultSave(1710000000000);
progression.syncConfiguredSaveRows(firstClearSave);
firstClearSave.progress.highestWave = 4;
firstClearSave.progress.currentWave = 5;
const firstClearBlueGemBefore = firstClearSave.currencies.blueGem;
const firstClearTalentPointsBefore = firstClearSave.progress.talentPoints;
const firstClear = battleRewards.settle(firstClearSave, {
  battleId: 'full_loop_key_wave_first_clear',
  wave: 5,
  status: 'victory',
  defeatedMonsters: 10,
  rng: seededRng(41),
});
const firstClearAgain = battleRewards.settle(firstClearSave, {
  battleId: 'full_loop_key_wave_first_clear',
  wave: 5,
  status: 'victory',
  defeatedMonsters: 10,
});
check(
  'first_clear_key_wave_rewards_and_idempotency',
  firstClear.ok &&
    firstClear.data?.firstClear === true &&
    firstClearSave.currencies.blueGem > firstClearBlueGemBefore &&
    firstClearSave.progress.talentPoints > firstClearTalentPointsBefore &&
    firstClearSave.progress.currentWave === 6 &&
    !firstClearAgain.ok &&
    firstClearAgain.reason === 'already_claimed',
  `${firstClear.message}; duplicate=${firstClearAgain.message}`,
);

const defeatSave = cloneSave(save);
const defeatWaveBefore = defeatSave.progress.currentWave;
const defeatEnergyBefore = defeatSave.currencies.energy;
const defeatStart = battleRewards.startBattle(defeatSave, defeatWaveBefore);
const defeatSettlement = battleRewards.settle(defeatSave, {
  battleId: defeatStart.data?.battleId ?? 'full_loop_defeat_battle',
  wave: defeatWaveBefore,
  status: 'fail',
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

const chestSave = cloneSave(save);
const chestGoldBefore = chestSave.currencies.gold;
const chestCountBefore = chestSave.inventory.find((item) => item.itemId === 'item_chest' && item.itemType === 'chest')?.count ?? 0;
const weaponCountBeforeChest = chestSave.inventory.filter((item) => item.itemType === 'weapon').reduce((sum, item) => sum + item.count, 0);
const chestOpen = inventory.openChest(chestSave, 'item_chest', () => 0);
const chestCountAfter = chestSave.inventory.find((item) => item.itemId === 'item_chest' && item.itemType === 'chest')?.count ?? 0;
const weaponCountAfterChest = chestSave.inventory.filter((item) => item.itemType === 'weapon').reduce((sum, item) => sum + item.count, 0);
check(
  'open_chest_consumes_cost_and_grants_reward',
  chestOpen.ok && chestSave.currencies.gold < chestGoldBefore && chestCountAfter === chestCountBefore - 1 && weaponCountAfterChest > weaponCountBeforeChest,
  chestOpen.message,
);
const noGoldChestSave = cloneSave(save);
noGoldChestSave.currencies.gold = 0;
const noGoldChestBefore = JSON.stringify({ currencies: noGoldChestSave.currencies, inventory: noGoldChestSave.inventory });
const noGoldChestOpen = inventory.openChest(noGoldChestSave, 'item_chest', () => 0);
check(
  'open_chest_insufficient_gold_no_mutation',
  !noGoldChestOpen.ok &&
    noGoldChestOpen.reason === 'insufficient_currency' &&
    JSON.stringify({ currencies: noGoldChestSave.currencies, inventory: noGoldChestSave.inventory }) === noGoldChestBefore,
  noGoldChestOpen.message,
);
const noChestSave = cloneSave(save);
noChestSave.inventory = noChestSave.inventory.filter((item) => item.itemId !== 'item_chest');
const noChestBefore = JSON.stringify({ currencies: noChestSave.currencies, inventory: noChestSave.inventory });
const noChestOpen = inventory.openChest(noChestSave, 'item_chest', () => 0);
check(
  'open_chest_missing_chest_no_mutation',
  !noChestOpen.ok &&
    noChestOpen.reason === 'insufficient_item' &&
    JSON.stringify({ currencies: noChestSave.currencies, inventory: noChestSave.inventory }) === noChestBefore,
  noChestOpen.message,
);

const petUpgrade = progression.upgradePet(save, 'pet_shadow_cat');
check('selected_pet_upgrade', petUpgrade.ok && petUpgrade.data?.pet.id === 'pet_shadow_cat', petUpgrade.message);

const petPowerSave = createDefaultSave(1710000000000);
progression.syncConfiguredSaveRows(petPowerSave);
const petPowerBefore = progression.getPower(petPowerSave);
progression.upgradePet(petPowerSave, 'pet_shadow_cat');
const petPowerAfter = progression.getPower(petPowerSave);
check('pet_upgrade_increases_power', petPowerAfter > petPowerBefore, `${petPowerBefore} -> ${petPowerAfter}`);

const petDeploySave = cloneSave(save);
const petDeploy = progression.deployPet(petDeploySave, 'pet_shadow_cat');
check(
  'pet_deploy_switch_single_active',
  petDeploy.ok &&
    petDeploySave.pets.find((pet) => pet.id === 'pet_shadow_cat')?.deployed === true &&
    petDeploySave.pets.filter((pet) => pet.deployed).length === 1,
  petDeploy.message,
);
const lockedPetDeploySave = cloneSave(save);
const lockedPetDeployBefore = JSON.stringify(lockedPetDeploySave.pets);
const lockedPetDeploy = progression.deployPet(lockedPetDeploySave, 'pet_moon_fox');
check(
  'pet_deploy_locked_blocked_no_mutation',
  !lockedPetDeploy.ok && lockedPetDeploy.reason === 'not_owned' && JSON.stringify(lockedPetDeploySave.pets) === lockedPetDeployBefore,
  lockedPetDeploy.message,
);

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

const talentPowerSave = createDefaultSave(1710000000000);
progression.syncConfiguredSaveRows(talentPowerSave);
const talentPowerBefore = progression.getPower(talentPowerSave);
progression.upgradeTalent(talentPowerSave, 'attack_power_01');
const talentPowerAfter = progression.getPower(talentPowerSave);
check('talent_upgrade_increases_power', talentPowerAfter > talentPowerBefore, `${talentPowerBefore} -> ${talentPowerAfter}`);

const talentResetSave = cloneSave(save);
const talentPointsBeforeReset = talentResetSave.progress.talentPoints;
const talentReset = progression.resetTalents(talentResetSave, 'attack');
check(
  'talent_reset_refunds_branch_points',
  talentReset.ok &&
    talentReset.data?.refunded === 1 &&
    talentResetSave.progress.talentPoints === talentPointsBeforeReset + 1 &&
    (talentResetSave.talents.find((node) => node.id === 'attack_power_01')?.level ?? 0) === 0,
  talentReset.message,
);

const talentFailureSave = createDefaultSave(1710000000000);
progression.syncConfiguredSaveRows(talentFailureSave);
const talentFailureBefore = JSON.stringify(talentFailureSave);
const talentPrerequisite = progression.upgradeTalent(talentFailureSave, 'attack_speed_01');
check(
  'talent_prerequisite_blocked',
  !talentPrerequisite.ok && talentPrerequisite.reason === 'prerequisite_missing' && JSON.stringify(talentFailureSave) === talentFailureBefore,
  talentPrerequisite.message,
);
const talentMaxSave = createDefaultSave(1710000000000);
progression.syncConfiguredSaveRows(talentMaxSave);
const attackPowerMax = repo.getTalent('attack_power_01')?.maxLevel ?? 3;
const talentMaxNode = talentMaxSave.talents.find((node) => node.id === 'attack_power_01');
if (talentMaxNode) {
  talentMaxNode.level = attackPowerMax;
}
talentMaxSave.progress.talentPoints = 99;
const talentMaxBefore = JSON.stringify(talentMaxSave);
const talentMaxUpgrade = progression.upgradeTalent(talentMaxSave, 'attack_power_01');
check(
  'talent_max_level_blocked_no_mutation',
  !talentMaxUpgrade.ok && talentMaxUpgrade.reason === 'max_level' && JSON.stringify(talentMaxSave) === talentMaxBefore,
  talentMaxUpgrade.message,
);

const powerAfterGrowth = progression.getPower(save);
check('power_changes_after_growth', powerAfterGrowth > powerBeforeGrowth, `${powerBeforeGrowth} -> ${powerAfterGrowth}`);
const battlePreparationAfterGrowth = {
  ...{
    myPower: progression.getPower(save),
  },
  weaponPreview: save.inventory
    .filter((item) => item.itemType === 'weapon')
    .map((item) => ({
      itemId: item.itemId,
      level: item.level,
      count: item.count,
      power: repo.getWeaponLevel(item.itemId, item.level)?.power ?? 0,
    }))
    .sort((a, b) => b.power - a.power)
    .slice(0, 10),
};
check(
  'battle_preparation_reflects_growth_and_weapon_preview',
  battlePreparationAfterGrowth.myPower === powerAfterGrowth &&
    battlePreparationAfterGrowth.weaponPreview.some((item) => item.itemId === 'weapon_sword' && item.level === 2 && item.count >= 1),
  JSON.stringify(battlePreparationAfterGrowth),
);

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

const claimAllAchievementSave = createDefaultSave(1710000000000);
progression.syncConfiguredSaveRows(claimAllAchievementSave);
progression.recordEvent(claimAllAchievementSave, 'highestWave', 20);
progression.recordEvent(claimAllAchievementSave, 'weaponMerge', 100);
progression.recordEvent(claimAllAchievementSave, 'monsterKill', 1000);
const claimAllAchievementGemBefore = claimAllAchievementSave.currencies.purpleGem;
const claimAllAchievements = progression.claimAllAchievements(claimAllAchievementSave);
check(
  'achievement_claim_all_multi_and_idempotent',
  claimAllAchievements.ok &&
    (claimAllAchievements.data?.length ?? 0) >= 4 &&
    claimAllAchievementSave.currencies.purpleGem > claimAllAchievementGemBefore &&
    claimAllAchievementSave.achievements.filter((achievement) => achievement.claimed).length >= 4 &&
    !progression.claimAllAchievements(claimAllAchievementSave).ok,
  claimAllAchievements.message,
);

const redDotSave = createDefaultSave(1710000000000);
progression.syncConfiguredSaveRows(redDotSave);
progression.recordEvent(redDotSave, 'highestWave', 1);
const redDotsPartial = calculateDefaultRedDots(redDotSave, repo.configs);
progression.recordEvent(redDotSave, 'highestWave', 5);
const redDotsReady = calculateDefaultRedDots(redDotSave, repo.configs);
progression.claimAchievement(redDotSave, 'wave_5');
const redDotsAfterClaim = calculateDefaultRedDots(redDotSave, repo.configs);
check(
  'red_dot_claimable_thresholds_and_clear',
  redDotsPartial.achievement === false && redDotsReady.achievement === true && redDotsAfterClaim.achievement === false,
  JSON.stringify({ partial: redDotsPartial.achievement, ready: redDotsReady.achievement, afterClaim: redDotsAfterClaim.achievement }),
);

const mailRedDotSave = createDefaultSave(1710000000000);
const mailRedDotsBefore = calculateDefaultRedDots(mailRedDotSave, repo.configs).mail;
mail.claimAllMails(mailRedDotSave, 1710000000000);
const mailRedDotsAfter = calculateDefaultRedDots(mailRedDotSave, repo.configs).mail;
check(
  'mail_red_dot_count_drops_after_claim_all',
  typeof mailRedDotsBefore === 'number' && typeof mailRedDotsAfter === 'number' && mailRedDotsBefore > mailRedDotsAfter,
  JSON.stringify({ before: mailRedDotsBefore, after: mailRedDotsAfter }),
);

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

const paidShopLimitSave = createDefaultSave(1710000000000);
progression.syncConfiguredSaveRows(paidShopLimitSave);
paidShopLimitSave.currencies.purpleGem = 1000;
const paidLimitFirst = shop.buy(paidShopLimitSave, 'daily_pet_food');
const paidLimitSecond = shop.buy(paidShopLimitSave, 'daily_pet_food');
const paidLimitThird = shop.buy(paidShopLimitSave, 'daily_pet_food');
const paidLimitBeforeFourth = JSON.stringify({ currencies: paidShopLimitSave.currencies, inventory: paidShopLimitSave.inventory, daily: paidShopLimitSave.daily });
const paidLimitFourth = shop.buy(paidShopLimitSave, 'daily_pet_food');
check(
  'shop_paid_daily_limit_blocked_no_mutation',
  paidLimitFirst.ok &&
    paidLimitSecond.ok &&
    paidLimitThird.ok &&
    !paidLimitFourth.ok &&
    paidLimitFourth.reason === 'daily_limit_reached' &&
    JSON.stringify({ currencies: paidShopLimitSave.currencies, inventory: paidShopLimitSave.inventory, daily: paidShopLimitSave.daily }) === paidLimitBeforeFourth,
  paidLimitFourth.message,
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
const specialOfferSave = createDefaultSave(1710000000000);
progression.syncConfiguredSaveRows(specialOfferSave);
const specialOfferBefore = JSON.stringify({ currencies: specialOfferSave.currencies, inventory: specialOfferSave.inventory, daily: specialOfferSave.daily });
const specialOffer = shop.buy(specialOfferSave, 'special_placeholder');
check(
  'shop_special_offer_unavailable_no_mutation',
  !specialOffer.ok &&
    specialOffer.reason === 'unavailable' &&
    JSON.stringify({ currencies: specialOfferSave.currencies, inventory: specialOfferSave.inventory, daily: specialOfferSave.daily }) === specialOfferBefore,
  specialOffer.message,
);

const refreshCancelSave = cloneSave(save);
const refreshCancelBefore = JSON.stringify({ currencies: refreshCancelSave.currencies, daily: refreshCancelSave.daily, dailyTasks: refreshCancelSave.dailyTasks });
const refreshCancel = shop.refresh(refreshCancelSave, 'cancel', new Date('2024-03-10T08:00:00'));
check(
  'shop_refresh_cancelled_ad_no_mutation',
  !refreshCancel.ok &&
    refreshCancel.reason === 'ad_not_completed' &&
    JSON.stringify({ currencies: refreshCancelSave.currencies, daily: refreshCancelSave.daily, dailyTasks: refreshCancelSave.dailyTasks }) === refreshCancelBefore,
  refreshCancel.message,
);
const refreshLimitSave = createDefaultSave(1710000000000);
progression.syncConfiguredSaveRows(refreshLimitSave);
refreshLimitSave.currencies.purpleGem = 1000;
const adTaskBeforeRefresh = refreshLimitSave.dailyTasks.find((task) => task.id === 'daily_ad_1')?.progress ?? 0;
const refreshAd = shop.refresh(refreshLimitSave, 'success', new Date('2024-03-10T08:00:00'));
const refreshManualOne = shop.refresh(refreshLimitSave, 'not_requested', new Date('2024-03-10T08:05:00'));
const refreshManualTwo = shop.refresh(refreshLimitSave, 'not_requested', new Date('2024-03-10T08:10:00'));
const refreshBeforeLimit = JSON.stringify({ currencies: refreshLimitSave.currencies, daily: refreshLimitSave.daily });
const refreshLimit = shop.refresh(refreshLimitSave, 'not_requested', new Date('2024-03-10T08:15:00'));
check(
  'shop_refresh_ad_success_then_daily_limit',
  refreshAd.ok &&
    refreshManualOne.ok &&
    refreshManualTwo.ok &&
    (refreshLimitSave.daily.adPlacementCounts?.shop_refresh ?? 0) === 1 &&
    (refreshLimitSave.dailyTasks.find((task) => task.id === 'daily_ad_1')?.progress ?? 0) > adTaskBeforeRefresh &&
    !refreshLimit.ok &&
    refreshLimit.reason === 'daily_limit_reached' &&
    JSON.stringify({ currencies: refreshLimitSave.currencies, daily: refreshLimitSave.daily }) === refreshBeforeLimit,
  refreshLimit.message,
);
const refreshNow = new Date('2024-03-10T08:15:00');
const nextRefreshAt = shop.getNextRefreshAt(refreshNow);
check(
  'shop_refresh_countdown_next_time_is_future',
  nextRefreshAt > refreshNow.getTime() && nextRefreshAt - refreshNow.getTime() <= 24 * 60 * 60 * 1000,
  `${refreshNow.getTime()} -> ${nextRefreshAt}`,
);

const energySave = cloneSave(save);
const energyMax = repo.configs.levels.battle.energyMax;
const intervalMs = repo.configs.levels.battle.energyRecoverIntervalSec * 1000;
energySave.currencies.energy = 0;
energySave.progress.lastEnergyRecoverAt = 1710000000000;
const recoveredOnce = economy.recoverEnergy(energySave, 1710000000000 + intervalMs * 2 + 1000);
const recoveredToCap = economy.recoverEnergy(energySave, 1710000000000 + intervalMs * 100);
check(
  'energy_recovery_interval_and_cap',
  recoveredOnce === 2 && recoveredToCap === energyMax - 2 && energySave.currencies.energy === energyMax,
  `once=${recoveredOnce}, cap=${recoveredToCap}, energy=${energySave.currencies.energy}`,
);

const exploreSave = createDefaultSave(1710000000000);
progression.syncConfiguredSaveRows(exploreSave);
const exploreBefore = cloneSave(exploreSave);
const exploreMaterialBefore = exploreBefore.inventory.find((item) => item.itemId === 'pet_material_common')?.count ?? 0;
const exploreClaim = progression.claimExploreReward(exploreSave);
const exploreAfter = cloneSave(exploreSave);
const exploreMaterialAfter = exploreAfter.inventory.find((item) => item.itemId === 'pet_material_common')?.count ?? 0;
check(
  'explore_claim_consumes_energy_and_grants_rewards',
  exploreClaim.ok &&
    exploreAfter.daily.exploreClaimed === true &&
    exploreAfter.currencies.energy === exploreBefore.currencies.energy - 3 &&
    exploreAfter.currencies.gold > exploreBefore.currencies.gold &&
    exploreMaterialAfter > exploreMaterialBefore &&
    exploreAfter.stats.exploreCount === 1,
  exploreClaim.message,
);
const exploreDuplicateBefore = JSON.stringify(exploreSave);
const exploreDuplicate = progression.claimExploreReward(exploreSave);
check(
  'explore_daily_duplicate_blocked_no_mutation',
  !exploreDuplicate.ok && exploreDuplicate.reason === 'already_claimed' && JSON.stringify(exploreSave) === exploreDuplicateBefore,
  exploreDuplicate.message,
);
const exploreNoEnergySave = createDefaultSave(1710000000000);
progression.syncConfiguredSaveRows(exploreNoEnergySave);
exploreNoEnergySave.currencies.energy = 0;
const exploreNoEnergyBefore = JSON.stringify(exploreNoEnergySave);
const exploreNoEnergy = progression.claimExploreReward(exploreNoEnergySave);
check(
  'explore_insufficient_energy_no_mutation',
  !exploreNoEnergy.ok && exploreNoEnergy.reason === 'insufficient_currency' && JSON.stringify(exploreNoEnergySave) === exploreNoEnergyBefore,
  exploreNoEnergy.message,
);

const guildSave = createDefaultSave(1710000000000);
progression.syncConfiguredSaveRows(guildSave);
guildSave.currencies.energy = 10;
const guildBefore = cloneSave(guildSave);
const guildCheckIn = progression.claimGuildCheckIn(guildSave);
const guildAfterCheckIn = cloneSave(guildSave);
check(
  'guild_check_in_once_grants_reward',
  guildCheckIn.ok &&
    guildAfterCheckIn.daily.guildCheckInClaimed === true &&
    guildAfterCheckIn.currencies.pawCoin > guildBefore.currencies.pawCoin &&
    guildAfterCheckIn.stats.guildContribution > guildBefore.stats.guildContribution,
  guildCheckIn.message,
);
const guildHelpBefore = cloneSave(guildSave);
const guildHelp = progression.claimGuildHelp(guildSave);
const guildAfterHelp = cloneSave(guildSave);
check(
  'guild_help_once_grants_reward',
  guildHelp.ok &&
    guildAfterHelp.daily.guildHelpClaimed === true &&
    guildAfterHelp.currencies.energy > guildHelpBefore.currencies.energy &&
    guildAfterHelp.stats.guildContribution > guildHelpBefore.stats.guildContribution,
  guildHelp.message,
);
const guildDuplicateBefore = JSON.stringify(guildSave);
const guildCheckInDuplicate = progression.claimGuildCheckIn(guildSave);
const guildHelpDuplicate = progression.claimGuildHelp(guildSave);
check(
  'guild_daily_duplicate_blocked_no_mutation',
  !guildCheckInDuplicate.ok &&
    guildCheckInDuplicate.reason === 'already_claimed' &&
    !guildHelpDuplicate.ok &&
    guildHelpDuplicate.reason === 'already_claimed' &&
    JSON.stringify(guildSave) === guildDuplicateBefore,
  `${guildCheckInDuplicate.message}; ${guildHelpDuplicate.message}`,
);

const stageSave = createDefaultSave(1710000000000);
progression.syncConfiguredSaveRows(stageSave);
stageSave.progress.highestWave = 5;
stageSave.progress.currentWave = 3;
const stageNext = progression.selectBattleWave(stageSave, 1);
const stagePrev = progression.selectBattleWave(stageSave, -1);
check(
  'stage_select_within_unlocked_bounds',
  stageNext.ok &&
    stageNext.data?.wave === 4 &&
    stagePrev.ok &&
    stagePrev.data?.wave === 3 &&
    stageSave.progress.currentWave === 3,
  `${stageNext.message}; ${stagePrev.message}`,
);
const stageLockedBefore = JSON.stringify(stageSave);
const stageLocked = progression.selectBattleWave(stageSave, 99);
check(
  'stage_select_locked_or_out_of_bounds_no_mutation',
  !stageLocked.ok && stageLocked.reason === 'not_ready' && JSON.stringify(stageSave) === stageLockedBefore,
  stageLocked.message,
);

const dailyRefreshSave = cloneSave(save);
const nextDay = new Date('2024-03-10T08:00:00');
dailyRefreshSave.daily.dateKey = '2024-03-09';
dailyRefreshSave.daily.freeGoldClaimed = true;
dailyRefreshSave.daily.adWatchCount = 4;
dailyRefreshSave.daily.shopRefreshCount = 3;
dailyRefreshSave.daily.activityClaimedIds = ['activity_30'];
dailyRefreshSave.daily.exploreClaimed = true;
dailyRefreshSave.daily.guildCheckInClaimed = true;
dailyRefreshSave.daily.guildHelpClaimed = true;
dailyRefreshSave.daily.shopPurchaseCounts = { daily_free_gold: 1, daily_pet_food: 3 };
dailyRefreshSave.daily.adPlacementCounts = { battle_reward_double: 2, shop_refresh: 1 };
dailyRefreshSave.dailyTasks = dailyRefreshSave.dailyTasks.map((task) => ({ ...task, progress: 999, claimed: true }));
const didRefreshDaily = refreshDailySaveIfNeeded(dailyRefreshSave, nextDay);
const didRefreshAgain = refreshDailySaveIfNeeded(dailyRefreshSave, nextDay);
check(
  'daily_refresh_resets_tasks_and_limits_once',
  didRefreshDaily &&
    !didRefreshAgain &&
    dailyRefreshSave.daily.dateKey === getLocalDateKey(nextDay) &&
    !dailyRefreshSave.daily.freeGoldClaimed &&
    dailyRefreshSave.daily.shopRefreshCount === 0 &&
    dailyRefreshSave.daily.activityClaimedIds.length === 0 &&
    !dailyRefreshSave.daily.exploreClaimed &&
    !dailyRefreshSave.daily.guildCheckInClaimed &&
    !dailyRefreshSave.daily.guildHelpClaimed &&
    Object.keys(dailyRefreshSave.daily.shopPurchaseCounts ?? {}).length === 0 &&
    Object.keys(dailyRefreshSave.daily.adPlacementCounts ?? {}).length === 0 &&
    dailyRefreshSave.dailyTasks.every((task) => !task.claimed && task.progress === (task.id === 'daily_login' ? 1 : 0)),
  JSON.stringify({ daily: dailyRefreshSave.daily, tasks: dailyRefreshSave.dailyTasks }),
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
