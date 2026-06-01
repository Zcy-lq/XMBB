import { GameSaveData } from '../data/GameTypes';
import { GameLogicConfigs, PetConfig } from '../game/GameConfigTypes';
import { getDefaultGameLogicConfigs } from '../game/GameConfigRepository';

export type RedDotValue = number | boolean;
export type RedDotRule = (save: GameSaveData) => RedDotValue;

export function createDefaultRedDotRules(configs: GameLogicConfigs = getDefaultGameLogicConfigs()): Record<string, RedDotRule> {
  const dailyTaskTargets = new Map(configs.tasks.dailyTasks.map((task) => [task.id, task.target]));
  const achievementTargets = new Map(configs.tasks.achievements.map((achievement) => [achievement.id, achievement.target]));

  return {
    dailyTask: (save) =>
      save.dailyTasks.some((task) => !task.claimed && task.progress >= (dailyTaskTargets.get(task.id) ?? 1)),
    mail: (save) => save.mails.filter((mail) => !mail.read || (!mail.claimed && mail.attachments.length > 0)).length,
    backpack: (save) => save.inventory.some((item) => item.itemType === 'weapon' && item.count >= 2),
    pet: (save) => {
      const materialCount =
        save.inventory.find((item) => item.itemId === configs.pets.materialItemId && item.itemType === 'material' && item.level === 1)?.count ?? 0;
      const minUpgradeableCost = configs.pets.pets
        .filter((config) => {
          const pet = save.pets.find((saved) => saved.id === config.id);
          return pet?.owned && pet.level < config.maxLevel;
        })
        .map((config) => {
          const pet = save.pets.find((saved) => saved.id === config.id);
          return pet ? getPetMaterialCostForNextLevel(config, pet.level) : Number.POSITIVE_INFINITY;
        })
        .reduce((min, cost) => Math.min(min, cost), Number.POSITIVE_INFINITY);
      return Number.isFinite(minUpgradeableCost) && materialCount >= minUpgradeableCost;
    },
    talent: (save) =>
      save.progress.talentPoints > 0 &&
      configs.talents.nodes.some((config) => {
        const node = save.talents.find((saved) => saved.id === config.id);
        const currentLevel = node?.level ?? 0;
        const cost = config.costPerLevel[currentLevel] ?? config.costPerLevel[config.costPerLevel.length - 1] ?? 1;
        return (
          currentLevel < config.maxLevel &&
          save.progress.talentPoints >= cost &&
          config.requires.every((requirement) => (save.talents.find((saved) => saved.id === requirement.id)?.level ?? 0) >= requirement.level)
        );
      }),
    shop: (save) =>
      configs.shop.goods.some(
        (goods) =>
          goods.payment.type === 'free' &&
          goods.dailyLimit > 0 &&
          configs.shop.tabs.some((tab) => tab.id === goods.tabId && tab.enabled) &&
          !save.daily.freeGoldClaimed &&
          (save.daily.shopPurchaseCounts?.[goods.id] ?? 0) < goods.dailyLimit,
      ),
    battle: (save) => save.currencies.energy >= configs.levels.battle.energyCost,
    achievement: (save) =>
      save.achievements.some((achievement) => !achievement.claimed && achievement.progress >= (achievementTargets.get(achievement.id) ?? 1)),
  };
}

export function calculateDefaultRedDots(save: GameSaveData, configs: GameLogicConfigs = getDefaultGameLogicConfigs()): Record<string, RedDotValue> {
  const values: Record<string, RedDotValue> = {};
  const rules = createDefaultRedDotRules(configs);
  for (const [key, rule] of Object.entries(rules)) {
    values[key] = rule(save);
  }
  return values;
}

function getPetMaterialCostForNextLevel(config: PetConfig, currentLevel: number): number {
  const rule = config.levelCost.find((row) => currentLevel >= row.from && currentLevel <= row.to);
  if (!rule) {
    return Number.POSITIVE_INFINITY;
  }
  const offset = currentLevel - rule.from;
  return Math.max(0, Math.floor(rule.petMaterialBase + rule.petMaterialPerLevel * offset));
}
