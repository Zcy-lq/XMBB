import { GameSaveData, InventoryItemSave, RewardPayload } from '../data/GameTypes';
import { GameConfigRepository } from './GameConfigRepository';
import { failure, failureFrom, GameLogicResult, success } from './GameLogicResult';
import {
  addInventoryItem,
  countInventorySlots,
  findInventoryStack,
  grantRewards,
  hasInventorySpaceForRewards,
  pickWeighted,
  removeInventoryItem,
  spendCurrency,
} from './GameLogicUtils';

export interface MergeResult {
  consumedItemId: string;
  resultItemId: string;
  resultLevel: number;
  inventory: InventoryItemSave[];
}

export interface OpenChestResult {
  chestId: string;
  rewards: RewardPayload[];
  inventory: InventoryItemSave[];
}

export class InventorySystem {
  public constructor(private readonly repo: GameConfigRepository) {}

  public getCapacity(): number {
    return this.repo.configs.items.inventoryCapacity;
  }

  public getUsedSlots(save: GameSaveData): number {
    return countInventorySlots(save);
  }

  public canAddRewards(save: GameSaveData, rewards: RewardPayload[]): GameLogicResult {
    return hasInventorySpaceForRewards(save, rewards, this.repo);
  }

  public mergeWeapon(save: GameSaveData, itemId: string, level: number): GameLogicResult<MergeResult> {
    const weapon = this.repo.getWeapon(itemId);
    if (!weapon || !weapon.mergeable) {
      return failure('config_missing', `missing mergeable weapon config: ${itemId}`);
    }
    if (level >= this.repo.configs.items.maxWeaponLevel) {
      return failure('max_level', 'weapon is already at max merge level');
    }
    if (!this.repo.getWeaponLevel(itemId, level + 1)) {
      return failure('config_missing', `missing weapon level config: ${itemId} lv${level + 1}`);
    }

    const stack = findInventoryStack(save, itemId, level, 'weapon');
    if (!stack || stack.count < 2) {
      return failure('insufficient_item', 'need two same weapons at the same level');
    }

    const result = removeInventoryItem(save, itemId, 2, level, 'weapon');
    if (!result.ok) {
      return failureFrom<MergeResult>(result);
    }
    addInventoryItem(save, itemId, 'weapon', 1, level + 1);
    save.stats.mergeCount += 1;

    return success(
      {
        consumedItemId: itemId,
        resultItemId: itemId,
        resultLevel: level + 1,
        inventory: save.inventory,
      },
      'weapon merged',
    );
  }

  public autoMergeAll(save: GameSaveData): MergeResult[] {
    const results: MergeResult[] = [];
    let merged = true;
    while (merged) {
      merged = false;
      const candidates = save.inventory
        .filter((item) => item.itemType === 'weapon' && item.count >= 2 && item.level < this.repo.configs.items.maxWeaponLevel)
        .sort((a, b) => a.level - b.level);
      const candidate = candidates[0];
      if (!candidate) {
        break;
      }
      const result = this.mergeWeapon(save, candidate.itemId, candidate.level);
      if (result.ok && result.data) {
        results.push(result.data);
        merged = true;
      }
    }
    return results;
  }

  public openChest(save: GameSaveData, chestId = this.repo.configs.items.defaultChestId, rng: () => number = Math.random): GameLogicResult<OpenChestResult> {
    const chest = this.repo.getChest(chestId);
    if (!chest) {
      return failure('config_missing', `missing chest config: ${chestId}`);
    }
    const chestStack = findInventoryStack(save, chestId, 1, 'chest');
    if (!chestStack || chestStack.count <= 0) {
      return failure('insufficient_item', 'chest not enough');
    }

    const picked = pickWeighted(chest.loot, rng);
    if (!picked) {
      return failure('config_missing', `empty chest loot: ${chestId}`);
    }
    const rewards = [picked.reward];
    const space = hasInventorySpaceForRewards(save, rewards, this.repo);
    if (!space.ok) {
      return failureFrom<OpenChestResult>(space);
    }

    const cost = spendCurrency(save, chest.openCost);
    if (!cost.ok) {
      return failureFrom<OpenChestResult>(cost);
    }
    const consume = removeInventoryItem(save, chestId, 1, 1, 'chest');
    if (!consume.ok) {
      return failureFrom<OpenChestResult>(consume);
    }
    const grant = grantRewards(save, rewards, this.repo);
    if (!grant.ok) {
      return failure(grant.reason ?? 'invalid_input', grant.message);
    }

    return success({ chestId, rewards, inventory: save.inventory }, 'chest opened');
  }
}
