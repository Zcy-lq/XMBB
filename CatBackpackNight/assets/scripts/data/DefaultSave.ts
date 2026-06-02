import { GameSaveData } from './GameTypes';

const DAY_MS = 24 * 60 * 60 * 1000;

export function getLocalDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function createDefaultSave(now = Date.now()): GameSaveData {
  return {
    schemaVersion: 1,
    updatedAt: now,
    player: {
      localId: `local_${now}`,
      nickname: '守夜小猫',
      level: 1,
      exp: 0,
      expMax: 100,
    },
    currencies: {
      gold: 1200,
      purpleGem: 60,
      blueGem: 0,
      energy: 30,
      pawCoin: 0,
    },
    progress: {
      chapterId: 'chapter_forest_night',
      highestWave: 1,
      currentWave: 1,
      talentPoints: 1,
      claimedRewardIds: [],
      lastEnergyRecoverAt: now,
    },
    inventory: [
      { uid: 'weapon_sword_1', itemId: 'weapon_sword', itemType: 'weapon', level: 1, count: 2 },
      { uid: 'weapon_bow_1', itemId: 'weapon_bow', itemType: 'weapon', level: 1, count: 1 },
      { uid: 'item_chest_1', itemId: 'item_chest', itemType: 'chest', level: 1, count: 1 },
      { uid: 'item_pet_mat_1', itemId: 'pet_material_common', itemType: 'material', level: 1, count: 20 },
    ],
    pets: [
      { id: 'pet_black_cat', level: 1, stars: 1, owned: true, deployed: true, fragments: 0 },
      { id: 'pet_shadow_cat', level: 1, stars: 1, owned: true, deployed: false, fragments: 0 },
      { id: 'pet_husky', level: 1, stars: 1, owned: true, deployed: false, fragments: 0 },
      { id: 'pet_panda', level: 1, stars: 1, owned: true, deployed: false, fragments: 0 },
      { id: 'pet_dog_general', level: 1, stars: 1, owned: true, deployed: false, fragments: 0 },
    ],
    talents: [
      { id: 'attack_power_01', level: 0 },
      { id: 'attack_speed_01', level: 0 },
      { id: 'crit_rate_01', level: 0 },
    ],
    dailyTasks: [
      { id: 'daily_login', progress: 1, claimed: false },
      { id: 'daily_battle_3', progress: 0, claimed: false },
      { id: 'daily_merge_5', progress: 0, claimed: false },
      { id: 'daily_kill_100', progress: 0, claimed: false },
      { id: 'daily_ad_1', progress: 0, claimed: false },
    ],
    achievements: [
      { id: 'wave_5', progress: 0, claimed: false },
      { id: 'wave_20', progress: 0, claimed: false },
      { id: 'merge_100', progress: 0, claimed: false },
      { id: 'kill_1000', progress: 0, claimed: false },
      { id: 'pet_level_10', progress: 0, claimed: false },
    ],
    mails: [
      {
        id: 'mail_login_gift',
        title: '守夜补给',
        body: '欢迎来到猫猫背包守夜，收下第一份营地补给。',
        attachments: [{ kind: 'currency', id: 'gold', amount: 500 }],
        read: false,
        claimed: false,
        expireAt: now + 30 * DAY_MS,
      },
      {
        id: 'mail_maintenance',
        title: '营地维护补偿',
        body: '感谢协助测试营地系统，补偿已放入附件。',
        attachments: [{ kind: 'currency', id: 'purpleGem', amount: 20 }],
        read: false,
        claimed: false,
        expireAt: now + 30 * DAY_MS,
      },
      {
        id: 'mail_event_preview',
        title: '活动预告',
        body: '限时活动入口将在后续版本开放。',
        attachments: [],
        read: false,
        claimed: true,
        expireAt: now + 30 * DAY_MS,
      },
    ],
    settings: {
      musicEnabled: true,
      soundEnabled: true,
      vibrationEnabled: true,
      powerSavingEnabled: false,
      acceptedAgreement: false,
      mergeGuideSeen: false,
    },
    daily: {
      dateKey: getLocalDateKey(new Date(now)),
      freeGoldClaimed: false,
      adWatchCount: 0,
      shopRefreshCount: 0,
      activityClaimedIds: [],
      exploreClaimed: false,
      guildCheckInClaimed: false,
      guildHelpClaimed: false,
      shopPurchaseCounts: {},
      adPlacementCounts: {},
    },
    stats: {
      battleCount: 0,
      mergeCount: 0,
      monsterKillCount: 0,
      adWatchCount: 0,
      exploreCount: 0,
      guildContribution: 0,
    },
  };
}
