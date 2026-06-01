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

const duplicateSettlement = battleRewards.settle(save, {
  battleId: firstStart.data?.battleId ?? 'full_loop_first_battle',
  wave: firstSession.state.wave,
  status: firstSession.state.status,
  defeatedMonsters: firstSession.state.defeatedMonsters,
});
check('duplicate_reward_blocked', !duplicateSettlement.ok && duplicateSettlement.reason === 'already_claimed', duplicateSettlement.message);

const merge = inventory.mergeWeapon(save, 'weapon_sword', 1);
if (merge.ok) {
  progression.recordEvent(save, 'weaponMerge', 1);
}
check('backpack_merge', merge.ok && save.inventory.some((item) => item.itemId === 'weapon_sword' && item.level === 2), merge.message);

const petUpgrade = progression.upgradePet(save, 'pet_shadow_cat');
check('selected_pet_upgrade', petUpgrade.ok && petUpgrade.data?.pet.id === 'pet_shadow_cat', petUpgrade.message);

const talentUpgrade = progression.upgradeTalent(save, 'attack_power_01');
check('selected_talent_upgrade', talentUpgrade.ok && talentUpgrade.data?.node.id === 'attack_power_01', talentUpgrade.message);

const powerAfterGrowth = progression.getPower(save);
check('power_changes_after_growth', powerAfterGrowth > powerBeforeGrowth, `${powerBeforeGrowth} -> ${powerAfterGrowth}`);

const mailGoldBefore = save.currencies.gold;
const mailClaim = mail.claimMail(save, 'mail_login_gift', 1710000000000);
check('mail_claim', mailClaim.ok && save.currencies.gold > mailGoldBefore, mailClaim.message);
const mailClaimAgain = mail.claimMail(save, 'mail_login_gift', 1710000000000);
check('mail_duplicate_blocked', !mailClaimAgain.ok && mailClaimAgain.reason === 'already_claimed', mailClaimAgain.message);
const mailDelete = mail.deleteMail(save, 'mail_login_gift');
check('mail_delete_after_claim', mailDelete.ok && !save.mails.some((row) => row.id === 'mail_login_gift'), mailDelete.message);

const shopGoldBefore = save.currencies.gold;
const shopBuy = shop.buy(save, 'daily_free_gold');
check('shop_free_good_once', shopBuy.ok && save.currencies.gold > shopGoldBefore, shopBuy.message);
const shopBuyAgain = shop.buy(save, 'daily_free_gold');
check('shop_duplicate_limit_blocked', !shopBuyAgain.ok && ['already_claimed', 'daily_limit_reached'].includes(shopBuyAgain.reason ?? ''), shopBuyAgain.message);

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
    restored.inventory.some((item) => item.itemId === 'weapon_sword' && item.level === 2),
  `wave=${restored.progress.currentWave}, pet=${restored.pets.find((pet) => pet.id === 'pet_shadow_cat')?.level}, talent=${restored.talents.find((node) => node.id === 'attack_power_01')?.level}`,
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
