import { GameSaveData } from '../data/GameTypes';
import { eventBus } from '../core/EventBus';
import { SaveManager } from '../core/SaveManager';

export interface AnalyticsPayload {
  eventName: string;
  playerId: string;
  currentWave: number;
  resources: GameSaveData['currencies'];
  result?: string;
  errorCode?: string;
  extras?: Record<string, unknown>;
}

export class AnalyticsService {
  private static singleton: AnalyticsService | null = null;

  public static get instance(): AnalyticsService {
    if (!AnalyticsService.singleton) {
      AnalyticsService.singleton = new AnalyticsService();
    }
    return AnalyticsService.singleton;
  }

  public track(eventName: string, extras?: Record<string, unknown>): AnalyticsPayload {
    const save = SaveManager.instance.getSnapshot();
    const payload: AnalyticsPayload = {
      eventName,
      playerId: save.player.localId,
      currentWave: save.progress.currentWave,
      resources: save.currencies,
      extras,
    };
    eventBus.emit(`analytics:${eventName}`, payload);
    console.log('[Analytics]', payload);
    return payload;
  }
}

export const analyticsService = AnalyticsService.instance;

