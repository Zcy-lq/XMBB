import itemsConfig from '../../configs/items.json';
import levelsConfig from '../../configs/levels.json';
import petsConfig from '../../configs/pets.json';
import shopConfig from '../../configs/shop.json';
import talentsConfig from '../../configs/talents.json';
import tasksConfig from '../../configs/tasks.json';
import { InventoryItemSave } from '../data/GameTypes';
import {
  ChapterConfig,
  ChestConfig,
  ConsumableConfig,
  GameLogicConfigs,
  ItemStackConfig,
  MonsterConfig,
  PetConfig,
  ShopGoodsConfig,
  SkillConfig,
  TalentNodeConfig,
  WaveConfig,
  WeaponConfig,
  WeaponLevelConfig,
} from './GameConfigTypes';

export function getDefaultGameLogicConfigs(): GameLogicConfigs {
  return {
    items: itemsConfig as GameLogicConfigs['items'],
    levels: levelsConfig as GameLogicConfigs['levels'],
    pets: petsConfig as GameLogicConfigs['pets'],
    shop: shopConfig as GameLogicConfigs['shop'],
    tasks: tasksConfig as GameLogicConfigs['tasks'],
    talents: talentsConfig as GameLogicConfigs['talents'],
  };
}

export class GameConfigRepository {
  public readonly configs: GameLogicConfigs;

  public constructor(configs: GameLogicConfigs = getDefaultGameLogicConfigs()) {
    this.configs = configs;
  }

  public getChapter(chapterId: string): ChapterConfig | null {
    return this.configs.levels.chapters.find((chapter) => chapter.id === chapterId) ?? null;
  }

  public getWave(chapterId: string, wave: number): WaveConfig | null {
    return this.getChapter(chapterId)?.waves.find((row) => row.wave === wave) ?? null;
  }

  public getBattleEnergyCost(): number {
    return this.configs.levels.battle.unlimitedEnergyInDevelopment ? 0 : this.configs.levels.battle.energyCost;
  }

  public getMonster(monsterId: string): MonsterConfig | null {
    return this.configs.levels.monsters.find((monster) => monster.id === monsterId) ?? null;
  }

  public getSkill(skillId: string): SkillConfig | null {
    return this.configs.levels.skills.find((skill) => skill.id === skillId) ?? null;
  }

  public getWeapon(weaponId: string): WeaponConfig | null {
    return this.configs.items.weapons.find((weapon) => weapon.id === weaponId) ?? null;
  }

  public getWeaponLevel(weaponId: string, level: number): WeaponLevelConfig | null {
    return this.getWeapon(weaponId)?.levels.find((row) => row.level === level) ?? null;
  }

  public getChest(chestId: string): ChestConfig | null {
    return this.configs.items.chests.find((chest) => chest.id === chestId) ?? null;
  }

  public getConsumable(itemId: string): ConsumableConfig | null {
    return this.configs.items.consumables.find((item) => item.id === itemId) ?? null;
  }

  public getStackItem(itemId: string): ItemStackConfig | null {
    return (
      this.configs.items.materials.find((item) => item.id === itemId) ??
      this.configs.items.chests.find((item) => item.id === itemId) ??
      this.configs.items.consumables.find((item) => item.id === itemId) ??
      null
    );
  }

  public getInventoryItemType(itemId: string): InventoryItemSave['itemType'] | null {
    if (this.getWeapon(itemId)) {
      return 'weapon';
    }
    const stack = this.getStackItem(itemId);
    return stack?.itemType ?? null;
  }

  public getPet(petId: string): PetConfig | null {
    return this.configs.pets.pets.find((pet) => pet.id === petId) ?? null;
  }

  public getTalent(nodeId: string): TalentNodeConfig | null {
    return this.configs.talents.nodes.find((node) => node.id === nodeId) ?? null;
  }

  public getGoods(goodsId: string): ShopGoodsConfig | null {
    return this.configs.shop.goods.find((goods) => goods.id === goodsId) ?? null;
  }

  public isShopTabEnabled(tabId: string): boolean {
    return this.configs.shop.tabs.find((tab) => tab.id === tabId)?.enabled ?? false;
  }
}
