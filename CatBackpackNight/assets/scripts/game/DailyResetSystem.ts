import { getLocalDateKey } from '../data/DefaultSave';
import { GameSaveData } from '../data/GameTypes';

export function refreshDailySaveIfNeeded(save: GameSaveData, now = new Date()): boolean {
  const today = getLocalDateKey(now);
  if (save.daily.dateKey === today) {
    return false;
  }

  save.daily = {
    dateKey: today,
    freeGoldClaimed: false,
    adWatchCount: 0,
    shopRefreshCount: 0,
    activityClaimedIds: [],
    exploreClaimed: false,
    guildCheckInClaimed: false,
    guildHelpClaimed: false,
    shopPurchaseCounts: {},
    adPlacementCounts: {},
  };
  save.dailyTasks = save.dailyTasks.map((task) => ({
    ...task,
    progress: task.id === 'daily_login' ? 1 : 0,
    claimed: false,
  }));
  return true;
}
