import { sys } from 'cc';
import { SAVE_KEY } from '../configs/GameConfig';
import { createDefaultSave } from '../data/DefaultSave';
import { GameSaveData } from '../data/GameTypes';
import { refreshDailySaveIfNeeded } from '../game/DailyResetSystem';
import { GameEvents } from '../game/GameEvents';
import { eventBus } from './EventBus';

type MutableSaveUpdater = (draft: GameSaveData) => void;

export class SaveManager {
  private static singleton: SaveManager | null = null;
  private saveData: GameSaveData = createDefaultSave();
  private loaded = false;

  public static get instance(): SaveManager {
    if (!SaveManager.singleton) {
      SaveManager.singleton = new SaveManager();
    }
    return SaveManager.singleton;
  }

  public load(): GameSaveData {
    if (this.loaded) {
      return this.getSnapshot();
    }

    const raw = sys.localStorage.getItem(SAVE_KEY);
    if (!raw) {
      this.saveData = createDefaultSave();
      this.persist(false);
      this.loaded = true;
      eventBus.emit(GameEvents.SaveLoaded, this.getSnapshot());
      return this.getSnapshot();
    }

    try {
      const parsed = JSON.parse(raw) as Partial<GameSaveData>;
      this.saveData = this.mergeSave(createDefaultSave(), parsed);
      this.refreshDailyIfNeeded();
    } catch (error) {
      console.warn('[SaveManager] Failed to parse local save, creating a fresh save.', error);
      this.saveData = createDefaultSave();
      this.persist(false);
    }

    this.loaded = true;
    eventBus.emit(GameEvents.SaveLoaded, this.getSnapshot());
    return this.getSnapshot();
  }

  public getSnapshot(): GameSaveData {
    return this.clone(this.saveData);
  }

  public update(updater: MutableSaveUpdater, reason = 'manual'): GameSaveData {
    this.ensureLoaded();
    const draft = this.clone(this.saveData);
    updater(draft);
    draft.updatedAt = Date.now();
    this.saveData = draft;
    this.persist(false);
    eventBus.emit(GameEvents.SaveChanged, { reason, save: this.getSnapshot() });
    return this.getSnapshot();
  }

  public replace(nextSave: GameSaveData, reason = 'replace'): void {
    this.saveData = this.mergeSave(createDefaultSave(), nextSave);
    this.saveData.updatedAt = Date.now();
    this.loaded = true;
    this.persist(false);
    eventBus.emit(GameEvents.SaveChanged, { reason, save: this.getSnapshot() });
  }

  public reset(): GameSaveData {
    this.saveData = createDefaultSave();
    this.loaded = true;
    this.persist(false);
    eventBus.emit(GameEvents.SaveChanged, { reason: 'reset', save: this.getSnapshot() });
    return this.getSnapshot();
  }

  public setAgreementAccepted(accepted: boolean): void {
    this.update((draft) => {
      draft.settings.acceptedAgreement = accepted;
    }, 'agreement');
  }

  public refreshDailyIfNeeded(now = new Date()): boolean {
    this.ensureLoaded(false);
    if (!refreshDailySaveIfNeeded(this.saveData, now)) {
      return false;
    }
    this.saveData.updatedAt = Date.now();
    this.persist(false);
    eventBus.emit(GameEvents.DailyRefresh, this.getSnapshot());
    eventBus.emit(GameEvents.SaveChanged, { reason: 'daily-refresh', save: this.getSnapshot() });
    return true;
  }

  private ensureLoaded(autoLoad = true): void {
    if (this.loaded || !autoLoad) {
      return;
    }
    this.load();
  }

  private persist(emitChanged = true): void {
    sys.localStorage.setItem(SAVE_KEY, JSON.stringify(this.saveData));
    if (emitChanged) {
      eventBus.emit(GameEvents.SaveChanged, { reason: 'persist', save: this.getSnapshot() });
    }
  }

  private mergeSave(base: GameSaveData, partial: Partial<GameSaveData>): GameSaveData {
    return this.deepMerge(base, partial) as GameSaveData;
  }

  private deepMerge<T>(base: T, partial: Partial<T> | undefined): T {
    if (partial === undefined || partial === null) {
      return this.clone(base);
    }
    if (Array.isArray(base)) {
      return this.clone(partial) as T;
    }
    if (typeof base !== 'object' || base === null) {
      return (partial as T) ?? base;
    }

    const result: Record<string, unknown> = { ...(base as Record<string, unknown>) };
    const source = partial as Record<string, unknown>;
    for (const key of Object.keys(source)) {
      const baseValue = result[key];
      const sourceValue = source[key];
      if (Array.isArray(baseValue)) {
        result[key] = Array.isArray(sourceValue) ? this.clone(sourceValue) : baseValue;
        continue;
      }
      if (typeof baseValue === 'object' && baseValue !== null && typeof sourceValue === 'object' && sourceValue !== null) {
        result[key] = this.deepMerge(baseValue, sourceValue as Partial<typeof baseValue>);
        continue;
      }
      result[key] = sourceValue;
    }
    return result as T;
  }

  private clone<T>(value: T): T {
    return JSON.parse(JSON.stringify(value)) as T;
  }
}

export const saveManager = SaveManager.instance;
