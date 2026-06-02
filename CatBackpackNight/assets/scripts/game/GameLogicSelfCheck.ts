import { createDefaultSave } from '../data/DefaultSave';
import { BattleSessionModel } from './BattleSessionModel';
import { BattleRewardSystem } from './BattleRewardSystem';
import { GameConfigRepository, getDefaultGameLogicConfigs } from './GameConfigRepository';
import { InventorySystem } from './InventorySystem';
import { ProgressionSystem } from './ProgressionSystem';
import { ShopSystem } from './ShopSystem';

export interface GameLogicSelfCheckItem {
  name: string;
  passed: boolean;
  detail: string;
}

export interface GameLogicSelfCheckReport {
  passed: boolean;
  checks: GameLogicSelfCheckItem[];
}

export function runGameLogicSelfCheck(): GameLogicSelfCheckReport {
  const save = createDefaultSave(1710000000000);
  const repo = new GameConfigRepository(getDefaultGameLogicConfigs());
  const progression = new ProgressionSystem(repo);
  const inventory = new InventorySystem(repo);
  const shop = new ShopSystem(repo, progression);
  const battleRewards = new BattleRewardSystem(repo, progression);
  progression.syncConfiguredSaveRows(save);

  const checks: GameLogicSelfCheckItem[] = [];
  const check = (name: string, passed: boolean, detail: string) => checks.push({ name, passed, detail });

  save.currencies.energy = 0;
  const start = battleRewards.startBattle(save, 1);
  check('dev_unlimited_energy_start', start.ok && start.data?.energyCost === 0 && save.currencies.energy === 0, start.message);

  const session = new BattleSessionModel(save, repo, { battleId: start.data?.battleId, rng: seededRng(7) });
  for (let i = 0; i < 120 && session.state.status === 'running'; i += 1) {
    const events = session.tick(0.5);
    if (events.some((event) => event.type === 'skillReady')) {
      session.applySkillChoice(0);
    }
  }
  check('battle_session_finishes', session.state.status !== 'running', `status=${session.state.status}`);
  const hasWeaponVisualMetadata = session.state.weaponSlots.every((slot) => Boolean(slot.weaponType && slot.displayName && slot.iconId));
  check('battle_weapon_visual_metadata', hasWeaponVisualMetadata, JSON.stringify(session.state.weaponSlots.map((slot) => ({ itemId: slot.itemId, weaponType: slot.weaponType }))));

  const visualSession = new BattleSessionModel(save, repo, { battleId: 'self_check_visual_battle', rng: seededRng(11) });
  let attackVisualSeen = false;
  for (let i = 0; i < 24 && !attackVisualSeen; i += 1) {
    visualSession.tick(0.25);
    attackVisualSeen = visualSession.state.attackVisuals.some((visual) => visual.targetUids.length > 0 && visual.weaponType);
  }
  check('battle_attack_visuals_emit', attackVisualSeen, `visuals=${visualSession.state.attackVisuals.length}`);

  const settlement = battleRewards.settle(save, {
    battleId: start.data?.battleId ?? 'self_check_battle',
    wave: 1,
    status: session.state.status,
    defeatedMonsters: session.state.defeatedMonsters,
    rng: seededRng(8),
  });
  check('battle_settlement_claims_once', settlement.ok, settlement.message);
  const duplicateSettlement = battleRewards.settle(save, {
    battleId: start.data?.battleId ?? 'self_check_battle',
    wave: 1,
    status: session.state.status,
    defeatedMonsters: session.state.defeatedMonsters,
  });
  check('battle_duplicate_blocked', !duplicateSettlement.ok && duplicateSettlement.reason === 'already_claimed', duplicateSettlement.message);

  const merge = inventory.mergeWeapon(save, 'weapon_sword', 1);
  if (merge.ok) {
    progression.recordEvent(save, 'weaponMerge', 1);
  }
  check('weapon_merge', merge.ok && save.inventory.some((item) => item.itemId === 'weapon_sword' && item.level === 2), merge.message);

  const shopBuy = shop.buy(save, 'daily_free_gold');
  const shopBuyAgain = shop.buy(save, 'daily_free_gold');
  check('shop_free_gold_once', shopBuy.ok && !shopBuyAgain.ok && shopBuyAgain.reason === 'daily_limit_reached', shopBuyAgain.message);

  const petUpgrade = progression.upgradePet(save, 'pet_black_cat');
  check('pet_upgrade', petUpgrade.ok && (petUpgrade.data?.pet.level ?? 1) === 2, petUpgrade.message);

  const talentUpgrade = progression.upgradeTalent(save, 'attack_power_01');
  check('talent_upgrade', talentUpgrade.ok && save.progress.talentPoints >= 0, talentUpgrade.message);

  const loginTask = progression.claimDailyTask(save, 'daily_login');
  const loginTaskAgain = progression.claimDailyTask(save, 'daily_login');
  check('daily_task_idempotent', loginTask.ok && !loginTaskAgain.ok && loginTaskAgain.reason === 'already_claimed', loginTaskAgain.message);

  const noNegativeCurrency = Object.values(save.currencies).every((value) => value >= 0);
  check('no_negative_currency', noNegativeCurrency, JSON.stringify(save.currencies));

  return {
    passed: checks.every((item) => item.passed),
    checks,
  };
}

function seededRng(seed: number): () => number {
  let state = seed % 2147483647;
  return () => {
    state = (state * 48271) % 2147483647;
    return state / 2147483647;
  };
}
