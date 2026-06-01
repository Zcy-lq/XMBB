import { CurrencyKey, GameSaveData, RewardPayload } from '../data/GameTypes';
import { CurrencyCost } from './GameConfigTypes';
import { GameConfigRepository } from './GameConfigRepository';
import { failure, GameLogicResult, success } from './GameLogicResult';
import {
  ensureProgressRuntimeFields,
  getCurrency,
  grantCurrency,
  grantRewards,
  spendCurrency,
} from './GameLogicUtils';

export interface EnergyRecoveryConfig {
  maxEnergy: number;
  recoverIntervalSec: number;
}

export class EconomySystem {
  private readonly energy: EnergyRecoveryConfig;

  public constructor(
    private readonly repo: GameConfigRepository,
    energy?: EnergyRecoveryConfig,
  ) {
    this.energy = energy ?? {
      maxEnergy: this.repo.configs.levels.battle.energyMax,
      recoverIntervalSec: this.repo.configs.levels.battle.energyRecoverIntervalSec,
    };
  }

  public canSpend(save: GameSaveData, cost: CurrencyCost): GameLogicResult {
    if (getCurrency(save, cost.currency) < cost.amount) {
      return failure('insufficient_currency', `${cost.currency} not enough`);
    }
    return success();
  }

  public spend(save: GameSaveData, cost: CurrencyCost): GameLogicResult {
    return spendCurrency(save, cost);
  }

  public grant(save: GameSaveData, currency: CurrencyKey, amount: number): void {
    grantCurrency(save, currency, amount);
  }

  public grantRewards(save: GameSaveData, rewards: RewardPayload[]): GameLogicResult<RewardPayload[]> {
    return grantRewards(save, rewards, this.repo);
  }

  public recoverEnergy(save: GameSaveData, now = Date.now()): number {
    ensureProgressRuntimeFields(save, now);
    const current = getCurrency(save, 'energy');
    if (current >= this.energy.maxEnergy) {
      save.currencies.energy = this.energy.maxEnergy;
      save.progress.lastEnergyRecoverAt = now;
      return 0;
    }

    const last = save.progress.lastEnergyRecoverAt ?? now;
    const elapsedSec = Math.max(0, Math.floor((now - last) / 1000));
    const recovered = Math.floor(elapsedSec / this.energy.recoverIntervalSec);
    if (recovered <= 0) {
      return 0;
    }

    const nextEnergy = Math.min(this.energy.maxEnergy, current + recovered);
    save.currencies.energy = nextEnergy;
    save.progress.lastEnergyRecoverAt = last + recovered * this.energy.recoverIntervalSec * 1000;
    if (nextEnergy >= this.energy.maxEnergy) {
      save.progress.lastEnergyRecoverAt = now;
    }
    return nextEnergy - current;
  }
}
