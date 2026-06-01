import { CurrencyKey, RewardPayload } from '../data/GameTypes';

export type BattleBonusType =
  | 'attackPercent'
  | 'cooldownPercent'
  | 'critRate'
  | 'critDamage'
  | 'campHpPercent'
  | 'campHeal'
  | 'defenseFlat'
  | 'damageReductionPercent'
  | 'campRegen'
  | 'extraTargets'
  | 'goldPercent'
  | 'expPercent'
  | 'petMaterialPercent'
  | 'chestDiscountPercent'
  | 'shopDiscountPercent'
  | 'energyCapFlat';

export interface CurrencyCost {
  currency: CurrencyKey;
  amount: number;
}

export interface WeightedReward {
  weight: number;
  reward: RewardPayload;
}

export interface WeaponLevelConfig {
  level: number;
  damage: number;
  cooldownSec: number;
  power: number;
  targets: number;
  critRateBonus: number;
}

export interface WeaponConfig {
  id: string;
  displayName: string;
  iconId: string;
  weaponType: string;
  targetRule: 'front' | 'lowestHp' | 'highestHp' | 'random';
  dropWeight: number;
  mergeable: boolean;
  levels: WeaponLevelConfig[];
}

export interface ItemStackConfig {
  id: string;
  displayName: string;
  itemType: 'material' | 'chest' | 'consumable';
  stackLimit: number;
}

export interface ChestConfig extends ItemStackConfig {
  openCost: CurrencyCost;
  loot: WeightedReward[];
}

export interface ConsumableConfig extends ItemStackConfig {
  useRewards: RewardPayload[];
}

export interface ItemConfigDocument {
  schemaVersion: number;
  inventoryCapacity: number;
  maxWeaponLevel: number;
  defaultChestId: string;
  weapons: WeaponConfig[];
  materials: ItemStackConfig[];
  chests: ChestConfig[];
  consumables: ConsumableConfig[];
}

export interface MonsterConfig {
  id: string;
  displayName: string;
  assetId: string;
  baseHp: number;
  baseAttack: number;
  moveSpeed: number;
  attackIntervalSec: number;
  rewardWeight: number;
}

export interface MonsterWeightConfig {
  monsterId: string;
  weight: number;
}

export interface WaveConfig {
  wave: number;
  recommendedPower: number;
  durationSec: number;
  spawnIntervalSec: number;
  maxSpawn: number;
  hpScale: number;
  attackScale: number;
  rewardMultiplier: number;
  monsterWeights: MonsterWeightConfig[];
  eliteMonsterId?: string;
}

export interface ChapterConfig {
  id: string;
  displayName: string;
  maxWave: number;
  waves: WaveConfig[];
}

export interface SkillEffectConfig {
  type: BattleBonusType;
  value: number;
}

export interface SkillConfig {
  id: string;
  displayName: string;
  quality: string;
  weight: number;
  effects: SkillEffectConfig[];
}

export interface BattleBaseConfig {
  energyCost: number;
  unlimitedEnergyInDevelopment?: boolean;
  energyMax: number;
  energyRecoverIntervalSec: number;
  durationSec: number;
  campBaseHp: number;
  weaponSlotCount: number;
  monsterCap: number;
  failEnergyRefund: number;
  skillChoiceAtSecond: number;
  damageNumberLimit: number;
  damageNumberLifeSec: number;
  retryTargetDelaySec: number;
  baseCritRate: number;
  baseCritDamage: number;
  maxCritRate: number;
  minCooldownMultiplier: number;
  minWeaponCooldownSec: number;
  minCampDamageMultiplier: number;
  eliteMonsterMultiplier: number;
  rewardDoubleMultiplier: number;
  rewardDoubleDailyLimit: number;
}

export interface RewardRulesConfig {
  victoryGoldBase: number;
  victoryGoldPerWave: number;
  victoryExpBase: number;
  victoryExpPerWave: number;
  failGoldRatio: number;
  failExpRatio: number;
  firstClearGoldRatio: number;
  petMaterialStartWave: number;
  petMaterialBase: number;
  petMaterialPerWave: number;
  keyWaveBlueGem: number;
  keyWaves: number[];
  talentPointWaves: number[];
  weaponDropStartWave: number;
  weaponDropChancePermille: number;
}

export interface LevelConfigDocument {
  schemaVersion: number;
  battle: BattleBaseConfig;
  rewardRules: RewardRulesConfig;
  monsters: MonsterConfig[];
  chapters: ChapterConfig[];
  skills: SkillConfig[];
}

export interface PetUnlockConfig {
  type: 'default' | 'wave' | 'future';
  wave: number;
}

export interface PetEffectConfig {
  type: BattleBonusType;
  base: number;
  perLevel: number;
}

export interface PetLevelCostRule {
  from: number;
  to: number;
  petMaterialBase: number;
  petMaterialPerLevel: number;
  goldBase: number;
  goldPerLevel: number;
  blueGemBase: number;
  blueGemPerLevel: number;
}

export interface PetConfig {
  id: string;
  displayName: string;
  quality: string;
  iconId: string;
  defaultOwned: boolean;
  unlock: PetUnlockConfig;
  maxLevel: number;
  basePower: number;
  powerPerLevel: number;
  effect: PetEffectConfig;
  levelCost: PetLevelCostRule[];
}

export interface PetConfigDocument {
  schemaVersion: number;
  maxDeployedPets: number;
  materialItemId: string;
  pets: PetConfig[];
}

export interface ShopPaymentConfig {
  type: 'free' | 'currency' | 'ad' | 'unavailable';
  currency?: CurrencyKey;
  amount?: number;
}

export interface ShopTabConfig {
  id: string;
  displayName: string;
  enabled: boolean;
}

export interface ShopGoodsConfig {
  id: string;
  tabId: string;
  slot: number;
  displayName: string;
  payment: ShopPaymentConfig;
  dailyLimit: number;
  rewards: RewardPayload[];
}

export interface ShopConfigDocument {
  schemaVersion: number;
  nextRefreshHour: number;
  manualRefreshLimit: number;
  adRefreshFreeCount: number;
  manualRefreshCost: CurrencyCost;
  tabs: ShopTabConfig[];
  goods: ShopGoodsConfig[];
}

export type ProgressEventType =
  | 'login'
  | 'battleComplete'
  | 'weaponMerge'
  | 'monsterKill'
  | 'adWatch'
  | 'highestWave'
  | 'petLevel';

export interface ClaimableConfig {
  id: string;
  displayName?: string;
  event: ProgressEventType;
  target: number;
  mode: 'increment' | 'max';
  rewards: RewardPayload[];
}

export interface DailyTaskConfig extends ClaimableConfig {
  activity: number;
}

export interface ActivityChestConfig {
  id: string;
  activity: number;
  rewards: RewardPayload[];
}

export interface TaskConfigDocument {
  schemaVersion: number;
  dailyTasks: DailyTaskConfig[];
  activityChests: ActivityChestConfig[];
  achievements: ClaimableConfig[];
}

export interface TalentRequirementConfig {
  id: string;
  level: number;
}

export interface TalentEffectConfig {
  type: BattleBonusType;
  valuePerLevel: number;
}

export interface TalentNodeConfig {
  id: string;
  branch: 'attack' | 'defense' | 'utility';
  displayName: string;
  maxLevel: number;
  costPerLevel: number[];
  requires: TalentRequirementConfig[];
  effects: TalentEffectConfig[];
}

export interface TalentConfigDocument {
  schemaVersion: number;
  powerPerLevel: number;
  resetCost: CurrencyCost;
  nodes: TalentNodeConfig[];
}

export interface GameLogicConfigs {
  items: ItemConfigDocument;
  pets: PetConfigDocument;
  levels: LevelConfigDocument;
  shop: ShopConfigDocument;
  tasks: TaskConfigDocument;
  talents: TalentConfigDocument;
}
