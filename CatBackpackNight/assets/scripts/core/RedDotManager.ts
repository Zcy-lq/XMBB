import { GameSaveData } from '../data/GameTypes';
import { GameEvents } from '../game/GameEvents';
import { eventBus } from './EventBus';
import { SaveManager } from './SaveManager';

export type RedDotValue = number | boolean;
export type RedDotRule = (save: GameSaveData) => RedDotValue;

const DAILY_TASK_TARGETS: Record<string, number> = {
  daily_login: 1,
  daily_battle_3: 3,
  daily_merge_5: 5,
  daily_kill_100: 100,
  daily_ad_1: 1,
};

export class RedDotManager {
  private static singleton: RedDotManager | null = null;
  private rules = new Map<string, RedDotRule>();
  private values = new Map<string, RedDotValue>();
  private defaultsRegistered = false;

  public static get instance(): RedDotManager {
    if (!RedDotManager.singleton) {
      RedDotManager.singleton = new RedDotManager();
    }
    return RedDotManager.singleton;
  }

  public register(key: string, rule: RedDotRule): void {
    this.rules.set(key, rule);
  }

  public unregister(key: string): void {
    this.rules.delete(key);
    this.values.delete(key);
  }

  public registerDefaultRules(): void {
    if (this.defaultsRegistered) {
      return;
    }
    this.defaultsRegistered = true;
    this.register('dailyTask', (save) =>
      save.dailyTasks.some((task) => !task.claimed && task.progress >= (DAILY_TASK_TARGETS[task.id] ?? 1)),
    );
    this.register('mail', (save) => save.mails.filter((mail) => !mail.read || (!mail.claimed && mail.attachments.length > 0)).length);
    this.register('backpack', (save) => save.inventory.some((item) => item.itemType === 'weapon' && item.count >= 2));
    this.register('pet', (save) => save.inventory.some((item) => item.itemId === 'pet_material_common' && item.count >= 10));
    this.register('talent', (save) => save.progress.talentPoints > 0);
    this.register('shop', (save) => !save.daily.freeGoldClaimed);
    this.register('battle', (save) => save.currencies.energy >= 5);
    this.register('achievement', (save) => save.achievements.some((achievement) => !achievement.claimed && achievement.progress > 0));
  }

  public recalculate(save = SaveManager.instance.getSnapshot()): Record<string, RedDotValue> {
    const next = new Map<string, RedDotValue>();
    for (const [key, rule] of this.rules.entries()) {
      next.set(key, rule(save));
    }

    const changed = this.hasChanged(next);
    this.values = next;
    const payload = this.getAll();
    if (changed) {
      eventBus.emit(GameEvents.RedDotChanged, payload);
    }
    return payload;
  }

  public get(key: string): RedDotValue {
    return this.values.get(key) ?? false;
  }

  public getAll(): Record<string, RedDotValue> {
    const result: Record<string, RedDotValue> = {};
    for (const [key, value] of this.values.entries()) {
      result[key] = value;
    }
    return result;
  }

  private hasChanged(next: Map<string, RedDotValue>): boolean {
    if (next.size !== this.values.size) {
      return true;
    }
    for (const [key, value] of next.entries()) {
      if (this.values.get(key) !== value) {
        return true;
      }
    }
    return false;
  }
}

export const redDotManager = RedDotManager.instance;
