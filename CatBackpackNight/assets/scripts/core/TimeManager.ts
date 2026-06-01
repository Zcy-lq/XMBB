import { getLocalDateKey } from '../data/DefaultSave';
import { GameEvents } from '../game/GameEvents';
import { eventBus } from './EventBus';
import { SaveManager } from './SaveManager';

export class TimeManager {
  private static singleton: TimeManager | null = null;
  private intervalId: number | null = null;
  private lastDateKey = getLocalDateKey();
  private elapsedSeconds = 0;

  public static get instance(): TimeManager {
    if (!TimeManager.singleton) {
      TimeManager.singleton = new TimeManager();
    }
    return TimeManager.singleton;
  }

  public start(tickMs = 1000): void {
    if (this.intervalId !== null) {
      return;
    }
    this.lastDateKey = getLocalDateKey();
    this.intervalId = setInterval(() => this.tick(), tickMs) as unknown as number;
  }

  public stop(): void {
    if (this.intervalId === null) {
      return;
    }
    clearInterval(this.intervalId);
    this.intervalId = null;
  }

  public now(): number {
    return Date.now();
  }

  public getTodayKey(): string {
    return getLocalDateKey();
  }

  public getNextDailyRefreshTime(now = new Date()): number {
    const next = new Date(now);
    next.setHours(24, 0, 0, 0);
    return next.getTime();
  }

  public formatCountdown(targetTime: number, now = Date.now()): string {
    const seconds = Math.max(0, Math.ceil((targetTime - now) / 1000));
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${`${h}`.padStart(2, '0')}:${`${m}`.padStart(2, '0')}:${`${s}`.padStart(2, '0')}`;
  }

  private tick(): void {
    this.elapsedSeconds += 1;
    const dateKey = getLocalDateKey();
    eventBus.emit(GameEvents.Tick, {
      now: Date.now(),
      elapsedSeconds: this.elapsedSeconds,
      dateKey,
    });

    if (dateKey !== this.lastDateKey) {
      this.lastDateKey = dateKey;
      SaveManager.instance.refreshDailyIfNeeded();
    }
  }
}

export const timeManager = TimeManager.instance;

