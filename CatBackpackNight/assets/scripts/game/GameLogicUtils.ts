import { CurrencyKey, GameSaveData, InventoryItemSave, RewardPayload } from '../data/GameTypes';
import { BattleBonusType, CurrencyCost, PetConfig, TalentNodeConfig } from './GameConfigTypes';
import { GameConfigRepository } from './GameConfigRepository';
import { failure, GameLogicResult, success } from './GameLogicResult';

export type BonusMap = Partial<Record<BattleBonusType, number>>;

export function cloneSave(save: GameSaveData): GameSaveData {
  return JSON.parse(JSON.stringify(save)) as GameSaveData;
}

export function ensureProgressRuntimeFields(save: GameSaveData, now = Date.now()): void {
  save.progress.claimedRewardIds ??= [];
  save.progress.lastEnergyRecoverAt ??= now;
  save.daily.shopPurchaseCounts ??= {};
  save.daily.adPlacementCounts ??= {};
}

export function getCurrency(save: GameSaveData, currency: CurrencyKey): number {
  return Math.max(0, save.currencies[currency] ?? 0);
}

export function grantCurrency(save: GameSaveData, currency: CurrencyKey, amount: number): void {
  save.currencies[currency] = Math.max(0, getCurrency(save, currency) + Math.max(0, Math.floor(amount)));
}

export function spendCurrency(save: GameSaveData, cost: CurrencyCost): GameLogicResult {
  const amount = Math.max(0, Math.floor(cost.amount));
  if (getCurrency(save, cost.currency) < amount) {
    return failure('insufficient_currency', `${cost.currency} not enough`);
  }
  save.currencies[cost.currency] = getCurrency(save, cost.currency) - amount;
  return success();
}

export function countInventorySlots(save: GameSaveData): number {
  return save.inventory.filter((item) => item.count > 0).length;
}

export function findInventoryStack(
  save: GameSaveData,
  itemId: string,
  level: number,
  itemType?: InventoryItemSave['itemType'],
): InventoryItemSave | null {
  return (
    save.inventory.find((item) => item.itemId === itemId && item.level === level && (!itemType || item.itemType === itemType)) ??
    null
  );
}

export function hasInventorySpaceForRewards(
  save: GameSaveData,
  rewards: RewardPayload[],
  repo: GameConfigRepository,
): GameLogicResult {
  let usedSlots = countInventorySlots(save);
  const plannedNewStacks = new Set<string>();
  for (const reward of rewards) {
    if (!['item', 'weapon', 'petMaterial'].includes(reward.kind) || reward.amount <= 0) {
      continue;
    }
    const itemId = reward.kind === 'petMaterial' ? repo.configs.pets.materialItemId : reward.id;
    const itemType = reward.kind === 'weapon' ? 'weapon' : repo.getInventoryItemType(itemId);
    if (!itemType) {
      return failure('config_missing', `missing item config: ${itemId}`);
    }
    const level = reward.kind === 'weapon' ? reward.level ?? 1 : 1;
    const stackKey = `${itemType}:${itemId}:${level}`;
    if (findInventoryStack(save, itemId, level, itemType) || plannedNewStacks.has(stackKey)) {
      continue;
    }
    plannedNewStacks.add(stackKey);
    usedSlots += 1;
    if (usedSlots > repo.configs.items.inventoryCapacity) {
      return failure('inventory_full', 'inventory is full');
    }
  }
  return success();
}

export function addInventoryItem(
  save: GameSaveData,
  itemId: string,
  itemType: InventoryItemSave['itemType'],
  amount: number,
  level = 1,
): InventoryItemSave {
  const safeAmount = Math.max(0, Math.floor(amount));
  const stack = findInventoryStack(save, itemId, level, itemType);
  if (stack) {
    stack.count += safeAmount;
    return stack;
  }

  const uid = `${itemId}_${level}_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
  const next: InventoryItemSave = {
    uid,
    itemId,
    itemType,
    level,
    count: safeAmount,
  };
  save.inventory.push(next);
  return next;
}

export function removeInventoryItem(
  save: GameSaveData,
  itemId: string,
  amount: number,
  level = 1,
  itemType?: InventoryItemSave['itemType'],
): GameLogicResult {
  const safeAmount = Math.max(0, Math.floor(amount));
  if (safeAmount <= 0) {
    return success();
  }
  const stack = findInventoryStack(save, itemId, level, itemType);
  if (!stack || stack.count < safeAmount) {
    return failure('insufficient_item', `${itemId} not enough`);
  }
  stack.count -= safeAmount;
  save.inventory = save.inventory.filter((item) => item.count > 0);
  return success();
}

export function grantRewards(save: GameSaveData, rewards: RewardPayload[], repo: GameConfigRepository): GameLogicResult<RewardPayload[]> {
  const spaceResult = hasInventorySpaceForRewards(save, rewards, repo);
  if (!spaceResult.ok) {
    return spaceResult as GameLogicResult<RewardPayload[]>;
  }

  for (const reward of rewards) {
    const amount = Math.max(0, Math.floor(reward.amount));
    if (amount <= 0) {
      continue;
    }
    if (reward.kind === 'currency') {
      grantCurrency(save, reward.id as CurrencyKey, amount);
      continue;
    }
    if (reward.kind === 'exp') {
      addExp(save, amount);
      continue;
    }
    if (reward.kind === 'talentPoint') {
      save.progress.talentPoints = Math.max(0, save.progress.talentPoints + amount);
      continue;
    }
    if (reward.kind === 'petMaterial') {
      addInventoryItem(save, repo.configs.pets.materialItemId, 'material', amount, 1);
      continue;
    }
    const itemType = reward.kind === 'weapon' ? 'weapon' : repo.getInventoryItemType(reward.id);
    if (!itemType) {
      return failure('config_missing', `missing item config: ${reward.id}`);
    }
    addInventoryItem(save, reward.id, itemType, amount, reward.kind === 'weapon' ? reward.level ?? 1 : 1);
  }

  return success(rewards, 'rewards granted');
}

export function addExp(save: GameSaveData, amount: number): void {
  let exp = save.player.exp + Math.max(0, Math.floor(amount));
  let level = save.player.level;
  let expMax = Math.max(1, save.player.expMax);
  while (exp >= expMax) {
    exp -= expMax;
    level += 1;
    expMax = Math.floor(expMax * 1.18 + 20);
  }
  save.player.exp = exp;
  save.player.level = level;
  save.player.expMax = expMax;
}

export function addBonus(target: BonusMap, type: BattleBonusType, value: number): void {
  target[type] = (target[type] ?? 0) + value;
}

export function getTalentBonus(save: GameSaveData, repo: GameConfigRepository): BonusMap {
  const result: BonusMap = {};
  for (const savedNode of save.talents) {
    const node = repo.getTalent(savedNode.id);
    if (!node || savedNode.level <= 0) {
      continue;
    }
    applyTalentNodeBonus(result, node, savedNode.level);
  }
  return result;
}

export function applyTalentNodeBonus(result: BonusMap, node: TalentNodeConfig, level: number): void {
  for (const effect of node.effects) {
    addBonus(result, effect.type, effect.valuePerLevel * level);
  }
}

export function getPetBonus(save: GameSaveData, repo: GameConfigRepository): BonusMap {
  const deployed = save.pets.find((pet) => pet.owned && pet.deployed);
  if (!deployed) {
    return {};
  }
  const config = repo.getPet(deployed.id);
  if (!config) {
    return {};
  }
  return getSinglePetBonus(config, deployed.level);
}

export function getSinglePetBonus(config: PetConfig, level: number): BonusMap {
  const result: BonusMap = {};
  addBonus(result, config.effect.type, config.effect.base + Math.max(0, level - 1) * config.effect.perLevel);
  return result;
}

export function mergeBonuses(...bonuses: BonusMap[]): BonusMap {
  const result: BonusMap = {};
  for (const bonus of bonuses) {
    for (const key of Object.keys(bonus) as BattleBonusType[]) {
      addBonus(result, key, bonus[key] ?? 0);
    }
  }
  return result;
}

export function rewardWithMultipliers(reward: RewardPayload, bonuses: BonusMap): RewardPayload {
  if (reward.kind === 'currency' && reward.id === 'gold') {
    return { ...reward, amount: Math.floor(reward.amount * (1 + (bonuses.goldPercent ?? 0))) };
  }
  if (reward.kind === 'exp') {
    return { ...reward, amount: Math.floor(reward.amount * (1 + (bonuses.expPercent ?? 0))) };
  }
  if (reward.kind === 'petMaterial') {
    return { ...reward, amount: Math.floor(reward.amount * (1 + (bonuses.petMaterialPercent ?? 0))) };
  }
  return reward;
}

export function pickWeighted<T extends { weight: number }>(rows: T[], rng: () => number = Math.random): T | null {
  const total = rows.reduce((sum, row) => sum + Math.max(0, row.weight), 0);
  if (total <= 0) {
    return rows[0] ?? null;
  }
  let cursor = rng() * total;
  for (const row of rows) {
    cursor -= Math.max(0, row.weight);
    if (cursor <= 0) {
      return row;
    }
  }
  return rows[rows.length - 1] ?? null;
}

export function getDailyCounter(save: GameSaveData, key: string): number {
  ensureProgressRuntimeFields(save);
  return save.daily.shopPurchaseCounts?.[key] ?? 0;
}

export function setDailyCounter(save: GameSaveData, key: string, value: number): void {
  ensureProgressRuntimeFields(save);
  save.daily.shopPurchaseCounts![key] = Math.max(0, Math.floor(value));
}

export function incrementAdPlacement(save: GameSaveData, placementId: string): void {
  ensureProgressRuntimeFields(save);
  save.daily.adPlacementCounts![placementId] = (save.daily.adPlacementCounts![placementId] ?? 0) + 1;
  save.daily.adWatchCount += 1;
  save.stats.adWatchCount += 1;
}
