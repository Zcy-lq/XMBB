export type RouteId =
  | 'login'
  | 'home'
  | 'battlePrepare'
  | 'battle'
  | 'merge'
  | 'mergeGuide'
  | 'explore'
  | 'guild'
  | 'backpack'
  | 'shop'
  | 'pet'
  | 'petDetail'
  | 'talent'
  | 'dailyTask'
  | 'achievement'
  | 'mail'
  | 'mailDetail'
  | 'settings'
  | 'policyModal'
  | 'confirmModal'
  | 'toastModal'
  | 'pauseModal'
  | 'skillChoice'
  | 'victory'
  | 'defeat';

export type CurrencyKey = 'gold' | 'purpleGem' | 'blueGem' | 'energy' | 'pawCoin';

export type RewardKind = 'currency' | 'item' | 'weapon' | 'petMaterial' | 'talentPoint' | 'exp';

export interface RewardPayload {
  kind: RewardKind;
  id: string;
  amount: number;
  level?: number;
}

export interface CurrencyState {
  gold: number;
  purpleGem: number;
  blueGem: number;
  energy: number;
  pawCoin: number;
}

export interface PlayerProfileSave {
  localId: string;
  nickname: string;
  level: number;
  exp: number;
  expMax: number;
}

export interface ProgressSave {
  chapterId: string;
  highestWave: number;
  currentWave: number;
  talentPoints: number;
  claimedRewardIds?: string[];
  lastEnergyRecoverAt?: number;
}

export interface InventoryItemSave {
  uid: string;
  itemId: string;
  itemType: 'weapon' | 'material' | 'chest' | 'consumable';
  level: number;
  count: number;
  locked?: boolean;
}

export interface PetSave {
  id: string;
  level: number;
  stars: number;
  owned: boolean;
  deployed: boolean;
  fragments: number;
}

export interface TalentNodeSave {
  id: string;
  level: number;
}

export interface ClaimableProgressSave {
  id: string;
  progress: number;
  claimed: boolean;
}

export interface MailSave {
  id: string;
  title: string;
  body: string;
  attachments: RewardPayload[];
  read: boolean;
  claimed: boolean;
  expireAt: number;
}

export interface SettingsSave {
  musicEnabled: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  powerSavingEnabled: boolean;
  acceptedAgreement: boolean;
}

export interface DailySave {
  dateKey: string;
  freeGoldClaimed: boolean;
  adWatchCount: number;
  shopRefreshCount: number;
  activityClaimedIds: string[];
  shopPurchaseCounts?: Record<string, number>;
  adPlacementCounts?: Record<string, number>;
}

export interface StatsSave {
  battleCount: number;
  mergeCount: number;
  monsterKillCount: number;
  adWatchCount: number;
}

export interface GameSaveData {
  schemaVersion: number;
  updatedAt: number;
  player: PlayerProfileSave;
  currencies: CurrencyState;
  progress: ProgressSave;
  inventory: InventoryItemSave[];
  pets: PetSave[];
  talents: TalentNodeSave[];
  dailyTasks: ClaimableProgressSave[];
  achievements: ClaimableProgressSave[];
  mails: MailSave[];
  settings: SettingsSave;
  daily: DailySave;
  stats: StatsSave;
}

export interface RouteParams {
  from?: RouteId;
  payload?: unknown;
}

export interface RouteState {
  route: RouteId;
  sceneName: string;
  params?: RouteParams;
}
