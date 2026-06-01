import { ClaimableProgressSave, GameSaveData, PetSave, RewardPayload, TalentNodeSave } from '../data/GameTypes';
import { DailyTaskConfig, PetConfig, PetLevelCostRule, ProgressEventType, TalentNodeConfig } from './GameConfigTypes';
import { GameConfigRepository } from './GameConfigRepository';
import { failure, GameLogicResult, success } from './GameLogicResult';
import {
  getPetBonus,
  getTalentBonus,
  getCurrency,
  grantRewards,
  mergeBonuses,
  removeInventoryItem,
  spendCurrency,
} from './GameLogicUtils';

export interface ClaimResult {
  id: string;
  rewards: RewardPayload[];
}

export interface PetUpgradeResult {
  pet: PetSave;
  nextCost: PetUpgradeCost | null;
}

export interface PetUpgradeCost {
  petMaterial: number;
  gold: number;
  blueGem: number;
}

export interface TalentUpgradeResult {
  node: TalentNodeSave;
  remainingTalentPoints: number;
}

export class ProgressionSystem {
  public constructor(private readonly repo: GameConfigRepository) {}

  public syncConfiguredSaveRows(save: GameSaveData): void {
    for (const task of this.repo.configs.tasks.dailyTasks) {
      if (!save.dailyTasks.some((row) => row.id === task.id)) {
        save.dailyTasks.push({ id: task.id, progress: task.id === 'daily_login' ? 1 : 0, claimed: false });
      }
    }
    for (const achievement of this.repo.configs.tasks.achievements) {
      if (!save.achievements.some((row) => row.id === achievement.id)) {
        save.achievements.push({ id: achievement.id, progress: 0, claimed: false });
      }
    }
    for (const petConfig of this.repo.configs.pets.pets) {
      if (!save.pets.some((pet) => pet.id === petConfig.id)) {
        save.pets.push({
          id: petConfig.id,
          level: 1,
          stars: 1,
          owned: petConfig.defaultOwned,
          deployed: false,
          fragments: 0,
        });
      }
    }
    for (const talent of this.repo.configs.talents.nodes) {
      if (!save.talents.some((node) => node.id === talent.id)) {
        save.talents.push({ id: talent.id, level: 0 });
      }
    }
    this.syncPetUnlocks(save);
  }

  public recordEvent(save: GameSaveData, event: ProgressEventType, amount = 1): void {
    const safeAmount = Math.max(0, Math.floor(amount));
    for (const task of this.repo.configs.tasks.dailyTasks) {
      if (task.event === event) {
        this.applyProgress(save.dailyTasks, task.id, task.mode, safeAmount, task.target);
      }
    }
    for (const achievement of this.repo.configs.tasks.achievements) {
      if (achievement.event === event) {
        this.applyProgress(save.achievements, achievement.id, achievement.mode, safeAmount, achievement.target);
      }
    }
  }

  public claimDailyTask(save: GameSaveData, taskId: string): GameLogicResult<ClaimResult> {
    const config = this.repo.configs.tasks.dailyTasks.find((task) => task.id === taskId);
    if (!config) {
      return failure('config_missing', `missing daily task config: ${taskId}`);
    }
    const row = this.getClaimableRow(save.dailyTasks, taskId);
    if (row.claimed) {
      return failure('already_claimed', 'daily task reward already claimed');
    }
    if (row.progress < config.target) {
      return failure('not_ready', 'daily task is not complete');
    }
    const grant = grantRewards(save, config.rewards, this.repo);
    if (!grant.ok) {
      return failure(grant.reason ?? 'invalid_input', grant.message);
    }
    row.claimed = true;
    return success({ id: taskId, rewards: config.rewards }, 'daily task claimed');
  }

  public claimActivityChest(save: GameSaveData, chestId: string): GameLogicResult<ClaimResult> {
    const config = this.repo.configs.tasks.activityChests.find((chest) => chest.id === chestId);
    if (!config) {
      return failure('config_missing', `missing activity chest config: ${chestId}`);
    }
    save.daily.activityClaimedIds ??= [];
    if (save.daily.activityClaimedIds.includes(chestId)) {
      return failure('already_claimed', 'activity chest already claimed');
    }
    if (this.getClaimedActivity(save) < config.activity) {
      return failure('not_ready', 'activity is not enough');
    }
    const grant = grantRewards(save, config.rewards, this.repo);
    if (!grant.ok) {
      return failure(grant.reason ?? 'invalid_input', grant.message);
    }
    save.daily.activityClaimedIds.push(chestId);
    return success({ id: chestId, rewards: config.rewards }, 'activity chest claimed');
  }

  public claimAchievement(save: GameSaveData, achievementId: string): GameLogicResult<ClaimResult> {
    const config = this.repo.configs.tasks.achievements.find((achievement) => achievement.id === achievementId);
    if (!config) {
      return failure('config_missing', `missing achievement config: ${achievementId}`);
    }
    const row = this.getClaimableRow(save.achievements, achievementId);
    if (row.claimed) {
      return failure('already_claimed', 'achievement reward already claimed');
    }
    if (row.progress < config.target) {
      return failure('not_ready', 'achievement is not complete');
    }
    const grant = grantRewards(save, config.rewards, this.repo);
    if (!grant.ok) {
      return failure(grant.reason ?? 'invalid_input', grant.message);
    }
    row.claimed = true;
    return success({ id: achievementId, rewards: config.rewards }, 'achievement claimed');
  }

  public claimAllAchievements(save: GameSaveData): GameLogicResult<ClaimResult[]> {
    const claimed: ClaimResult[] = [];
    for (const config of this.repo.configs.tasks.achievements) {
      const row = this.getClaimableRow(save.achievements, config.id);
      if (row.claimed || row.progress < config.target) {
        continue;
      }
      const grant = grantRewards(save, config.rewards, this.repo);
      if (!grant.ok) {
        return failure(grant.reason ?? 'invalid_input', grant.message);
      }
      row.claimed = true;
      claimed.push({ id: config.id, rewards: config.rewards });
    }
    if (claimed.length === 0) {
      return failure('not_ready', 'no achievement can be claimed');
    }
    return success(claimed, 'achievements claimed');
  }

  public getClaimedActivity(save: GameSaveData): number {
    return this.repo.configs.tasks.dailyTasks.reduce((sum, task) => {
      const row = save.dailyTasks.find((saved) => saved.id === task.id);
      return row?.claimed ? sum + task.activity : sum;
    }, 0);
  }

  public deployPet(save: GameSaveData, petId: string): GameLogicResult<PetSave> {
    const pet = this.getPetSave(save, petId);
    if (!pet) {
      return failure('config_missing', `missing pet save: ${petId}`);
    }
    if (!pet.owned) {
      return failure('not_owned', 'pet is not owned');
    }
    for (const row of save.pets) {
      row.deployed = row.id === petId;
    }
    return success(pet, 'pet deployed');
  }

  public upgradePet(save: GameSaveData, petId: string): GameLogicResult<PetUpgradeResult> {
    const pet = this.getPetSave(save, petId);
    const config = this.repo.getPet(petId);
    if (!pet || !config) {
      return failure('config_missing', `missing pet config: ${petId}`);
    }
    if (!pet.owned) {
      return failure('not_owned', 'pet is not owned');
    }
    if (pet.level >= config.maxLevel) {
      return failure('max_level', 'pet already reached max level');
    }
    const cost = this.getPetUpgradeCost(config, pet.level);
    if (!cost) {
      return failure('config_missing', `missing pet cost: ${petId} lv${pet.level}`);
    }
    const materialStack = save.inventory.find(
      (item) => item.itemId === this.repo.configs.pets.materialItemId && item.itemType === 'material' && item.level === 1,
    );
    if (!materialStack || materialStack.count < cost.petMaterial) {
      return failure('insufficient_item', `${this.repo.configs.pets.materialItemId} not enough`);
    }
    if (getCurrency(save, 'gold') < cost.gold) {
      return failure('insufficient_currency', 'gold not enough');
    }
    if (getCurrency(save, 'blueGem') < cost.blueGem) {
      return failure('insufficient_currency', 'blueGem not enough');
    }

    const materialResult = removeInventoryItem(save, this.repo.configs.pets.materialItemId, cost.petMaterial, 1, 'material');
    if (!materialResult.ok) {
      return materialResult as GameLogicResult<PetUpgradeResult>;
    }
    if (cost.gold > 0) {
      const spendGold = spendCurrency(save, { currency: 'gold', amount: cost.gold });
      if (!spendGold.ok) {
        return spendGold as GameLogicResult<PetUpgradeResult>;
      }
    }
    if (cost.blueGem > 0) {
      const spendBlueGem = spendCurrency(save, { currency: 'blueGem', amount: cost.blueGem });
      if (!spendBlueGem.ok) {
        return spendBlueGem as GameLogicResult<PetUpgradeResult>;
      }
    }

    pet.level += 1;
    this.recordEvent(save, 'petLevel', pet.level);
    return success({ pet, nextCost: this.getPetUpgradeCost(config, pet.level) }, 'pet upgraded');
  }

  public getPetUpgradeCost(config: PetConfig, currentLevel: number): PetUpgradeCost | null {
    const rule = config.levelCost.find((row) => currentLevel >= row.from && currentLevel <= row.to);
    if (!rule) {
      return null;
    }
    const offset = currentLevel - rule.from;
    return {
      petMaterial: Math.max(0, Math.floor(rule.petMaterialBase + rule.petMaterialPerLevel * offset)),
      gold: Math.max(0, Math.floor(rule.goldBase + rule.goldPerLevel * offset)),
      blueGem: Math.max(0, Math.floor(rule.blueGemBase + rule.blueGemPerLevel * offset)),
    };
  }

  public syncPetUnlocks(save: GameSaveData): void {
    for (const config of this.repo.configs.pets.pets) {
      const pet = this.getPetSave(save, config.id);
      if (!pet || pet.owned) {
        continue;
      }
      if (config.unlock.type === 'default' || (config.unlock.type === 'wave' && save.progress.highestWave >= config.unlock.wave)) {
        pet.owned = true;
      }
    }
  }

  public upgradeTalent(save: GameSaveData, nodeId: string): GameLogicResult<TalentUpgradeResult> {
    const config = this.repo.getTalent(nodeId);
    if (!config) {
      return failure('config_missing', `missing talent config: ${nodeId}`);
    }
    const node = this.getTalentSave(save, nodeId);
    if (node.level >= config.maxLevel) {
      return failure('max_level', 'talent is already max level');
    }
    const missingRequirement = this.getMissingTalentRequirement(save, config);
    if (missingRequirement) {
      return failure('prerequisite_missing', `requires ${missingRequirement.id} lv${missingRequirement.level}`);
    }
    const cost = config.costPerLevel[node.level] ?? config.costPerLevel[config.costPerLevel.length - 1] ?? 1;
    if (save.progress.talentPoints < cost) {
      return failure('insufficient_currency', 'talent point not enough');
    }
    save.progress.talentPoints -= cost;
    node.level += 1;
    return success({ node, remainingTalentPoints: save.progress.talentPoints }, 'talent upgraded');
  }

  public resetTalents(save: GameSaveData, branch?: TalentNodeConfig['branch']): GameLogicResult<{ refunded: number }> {
    const nodeIds = this.repo.configs.talents.nodes.filter((node) => !branch || node.branch === branch).map((node) => node.id);
    let refunded = 0;
    for (const id of nodeIds) {
      const config = this.repo.getTalent(id);
      const saved = this.getTalentSave(save, id);
      if (!config || saved.level <= 0) {
        continue;
      }
      for (let i = 0; i < saved.level; i += 1) {
        refunded += config.costPerLevel[i] ?? config.costPerLevel[config.costPerLevel.length - 1] ?? 1;
      }
      saved.level = 0;
    }
    save.progress.talentPoints += refunded;
    return success({ refunded }, 'talents reset');
  }

  public getCombatBonuses(save: GameSaveData) {
    return mergeBonuses(getTalentBonus(save, this.repo), getPetBonus(save, this.repo));
  }

  public getPower(save: GameSaveData): number {
    const weaponPower = save.inventory.reduce((sum, item) => {
      if (item.itemType !== 'weapon') {
        return sum;
      }
      return sum + (this.repo.getWeaponLevel(item.itemId, item.level)?.power ?? 0) * item.count;
    }, 0);
    const petPower = save.pets.reduce((sum, pet) => {
      if (!pet.owned) {
        return sum;
      }
      const config = this.repo.getPet(pet.id);
      return config ? sum + config.basePower + Math.max(0, pet.level - 1) * config.powerPerLevel : sum;
    }, 0);
    const talentPower = save.talents.reduce((sum, node) => sum + node.level * this.repo.configs.talents.powerPerLevel, 0);
    return Math.floor(weaponPower + petPower + talentPower);
  }

  private applyProgress(rows: ClaimableProgressSave[], id: string, mode: 'increment' | 'max', amount: number, target: number): void {
    let row = rows.find((saved) => saved.id === id);
    if (!row) {
      row = { id, progress: 0, claimed: false };
      rows.push(row);
    }
    row.progress = mode === 'max' ? Math.max(row.progress, amount) : Math.min(target, row.progress + amount);
  }

  private getClaimableRow(rows: ClaimableProgressSave[], id: string): ClaimableProgressSave {
    let row = rows.find((saved) => saved.id === id);
    if (!row) {
      row = { id, progress: 0, claimed: false };
      rows.push(row);
    }
    return row;
  }

  private getPetSave(save: GameSaveData, petId: string): PetSave | null {
    return save.pets.find((pet) => pet.id === petId) ?? null;
  }

  private getTalentSave(save: GameSaveData, nodeId: string): TalentNodeSave {
    let node = save.talents.find((saved) => saved.id === nodeId);
    if (!node) {
      node = { id: nodeId, level: 0 };
      save.talents.push(node);
    }
    return node;
  }

  private getMissingTalentRequirement(save: GameSaveData, config: TalentNodeConfig) {
    return config.requires.find((requirement) => this.getTalentSave(save, requirement.id).level < requirement.level) ?? null;
  }
}
