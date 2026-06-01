import { GameSaveData } from '../data/GameTypes';
import { createDefaultRedDotRules, RedDotRule, RedDotValue } from './DefaultRedDotRules';
import { GameEvents } from '../game/GameEvents';
import { eventBus } from './EventBus';
import { SaveManager } from './SaveManager';

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
    for (const [key, rule] of Object.entries(createDefaultRedDotRules())) {
      this.register(key, rule);
    }
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
