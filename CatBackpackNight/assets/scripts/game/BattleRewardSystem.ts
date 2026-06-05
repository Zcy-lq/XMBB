import { GameSaveData, RewardPayload } from '../data/GameTypes';
import { BattleStatus } from './BattleSessionModel';
import { GameConfigRepository } from './GameConfigRepository';
import { failure, failureFrom, GameLogicResult, success } from './GameLogicResult';
import {
  ensureProgressRuntimeFields,
  getCurrency,
  grantRewards,
  incrementAdPlacement,
  pickWeighted,
  rewardWithMultipliers,
  spendCurrency,
} from './GameLogicUtils';
import { ProgressionSystem } from './ProgressionSystem';
import { AdCompletionState } from './ShopSystem';

export interface BattleStartResult {
  battleId: string;
  chapterId: string;
  wave: number;
  energyCost: number;
}

export interface BattleSettlementInput {
  battleId: string;
  chapterId?: string;
  wave: number;
  status: BattleStatus;
  defeatedMonsters: number;
  adState?: AdCompletionState;
  rng?: () => number;
}

export interface BattleSettlementResult {
  battleId: string;
  chapterId: string;
  wave: number;
  status: BattleStatus;
  defeatedMonsters: number;
  victory: boolean;
  firstClear: boolean;
  doubleClaimed: boolean;
  rewards: RewardPayload[];
  nextWave: number;
  highestWave: number;
}

export interface BattleDoubleRewardInput {
  battleId: string;
  chapterId?: string;
  wave: number;
  status: BattleStatus;
  defeatedMonsters: number;
  adState: AdCompletionState;
}

export interface BattleDoubleRewardResult {
  battleId: string;
  adPlacementId: 'battle_reward_double';
  rewards: RewardPayload[];
}

export class BattleRewardSystem {
  public constructor(
    private readonly repo: GameConfigRepository,
    private readonly progression: ProgressionSystem,
  ) {}

  public startBattle(save: GameSaveData, wave = save.progress.currentWave): GameLogicResult<BattleStartResult> {
    const chapterId = save.progress.chapterId;
    if (!this.repo.getWave(chapterId, wave)) {
      return failure('config_missing', `missing wave config: ${chapterId} wave ${wave}`);
    }
    const energyCost = this.repo.getBattleEnergyCost();
    if (energyCost > 0 && getCurrency(save, 'energy') < energyCost) {
      return failure('insufficient_currency', 'energy not enough');
    }
    if (energyCost > 0) {
      const spend = spendCurrency(save, { currency: 'energy', amount: energyCost });
      if (!spend.ok) {
        return failureFrom<BattleStartResult>(spend);
      }
    }
    save.progress.currentWave = wave;
    save.stats.battleCount += 1;
    return success(
      {
        battleId: `battle_${Date.now()}_${wave}_${Math.floor(Math.random() * 100000)}`,
        chapterId,
        wave,
        energyCost,
      },
      'battle started',
    );
  }

  public settle(save: GameSaveData, input: BattleSettlementInput): GameLogicResult<BattleSettlementResult> {
    ensureProgressRuntimeFields(save);
    const victory = input.status === 'victory';
    const claimId = `battle:${input.battleId}`;
    if (save.progress.claimedRewardIds!.includes(claimId)) {
      return failure('already_claimed', 'battle settlement already claimed');
    }

    const chapterId = input.chapterId ?? save.progress.chapterId;
    const wave = this.repo.getWave(chapterId, input.wave);
    if (!wave) {
      return failure('config_missing', `missing wave config: ${chapterId} wave ${input.wave}`);
    }
    if (input.adState === 'success' && !this.canDoubleReward(save)) {
      return failure('daily_limit_reached', 'daily double reward ad limit reached');
    }

    const rewards = this.buildSettlementRewards(save, input, victory);
    const grant = grantRewards(save, rewards, this.repo);
    if (!grant.ok) {
      return failure(grant.reason ?? 'invalid_input', grant.message);
    }

    save.progress.claimedRewardIds!.push(claimId);
    save.stats.monsterKillCount += Math.max(0, Math.floor(input.defeatedMonsters));
    this.progression.recordEvent(save, 'battleComplete', 1);
    this.progression.recordEvent(save, 'monsterKill', input.defeatedMonsters);

    const firstClear = victory && input.wave > save.progress.highestWave;
    if (victory) {
      save.progress.highestWave = Math.max(save.progress.highestWave, input.wave);
      const chapter = this.repo.getChapter(chapterId);
      save.progress.currentWave = Math.min(chapter?.maxWave ?? input.wave, input.wave + 1);
      this.progression.recordEvent(save, 'highestWave', save.progress.highestWave);
      this.progression.syncPetUnlocks(save);
    }

    if (input.adState === 'success') {
      save.progress.claimedRewardIds!.push(`battle-double:${input.battleId}`);
      incrementAdPlacement(save, 'battle_reward_double');
      this.progression.recordEvent(save, 'adWatch', 1);
    }

    return success(
      {
        battleId: input.battleId,
        chapterId,
        wave: input.wave,
        status: input.status,
        defeatedMonsters: input.defeatedMonsters,
        victory,
        firstClear,
        doubleClaimed: input.adState === 'success',
        rewards,
        nextWave: save.progress.currentWave,
        highestWave: save.progress.highestWave,
      },
      'battle settled',
    );
  }

  public claimDoubleReward(save: GameSaveData, input: BattleDoubleRewardInput): GameLogicResult<BattleDoubleRewardResult> {
    ensureProgressRuntimeFields(save);
    if (input.adState !== 'success') {
      return failure('ad_not_completed', 'rewarded video was not completed');
    }
    if (input.status !== 'victory') {
      return failure('not_ready', 'double reward is only available after victory');
    }

    const claimId = `battle:${input.battleId}`;
    const doubleClaimId = `battle-double:${input.battleId}`;
    if (!save.progress.claimedRewardIds!.includes(claimId)) {
      return failure('not_ready', 'battle settlement must be claimed before double reward');
    }
    if (save.progress.claimedRewardIds!.includes(doubleClaimId)) {
      return failure('already_claimed', 'battle double reward already claimed');
    }
    if (!this.canDoubleReward(save)) {
      return failure('daily_limit_reached', 'daily double reward ad limit reached');
    }

    const rewards = this.buildDoubleRewardBonus(save, input);
    const grant = grantRewards(save, rewards, this.repo);
    if (!grant.ok) {
      return failure(grant.reason ?? 'invalid_input', grant.message);
    }

    save.progress.claimedRewardIds!.push(doubleClaimId);
    incrementAdPlacement(save, 'battle_reward_double');
    this.progression.recordEvent(save, 'adWatch', 1);
    return success({ battleId: input.battleId, adPlacementId: 'battle_reward_double', rewards }, 'battle double reward claimed');
  }

  private buildSettlementRewards(save: GameSaveData, input: BattleSettlementInput, victory: boolean): RewardPayload[] {
    const rules = this.repo.configs.levels.rewardRules;
    const battle = this.repo.configs.levels.battle;
    const wave = this.repo.getWave(input.chapterId ?? save.progress.chapterId, input.wave);
    const rewardMultiplier = wave?.rewardMultiplier ?? 1;
    const bonuses = this.progression.getCombatBonuses(save);
    const baseGold = Math.floor((rules.victoryGoldBase + input.wave * rules.victoryGoldPerWave) * rewardMultiplier);
    const baseExp = Math.floor((rules.victoryExpBase + input.wave * rules.victoryExpPerWave) * rewardMultiplier);
    const regular: RewardPayload[] = victory
      ? [
          { kind: 'currency', id: 'gold', amount: baseGold },
          { kind: 'exp', id: 'exp', amount: baseExp },
        ]
      : [
          { kind: 'currency', id: 'gold', amount: Math.floor(baseGold * rules.failGoldRatio) },
          { kind: 'exp', id: 'exp', amount: Math.floor(baseExp * rules.failExpRatio) },
          { kind: 'currency', id: 'energy', amount: battle.failEnergyRefund },
        ];

    if (victory && input.wave >= rules.petMaterialStartWave) {
      regular.push({
        kind: 'petMaterial',
        id: this.repo.configs.pets.materialItemId,
        amount: rules.petMaterialBase + input.wave * rules.petMaterialPerWave,
      });
    }
    if (victory && input.wave >= rules.weaponDropStartWave && (input.rng ?? Math.random)() * 1000 < rules.weaponDropChancePermille) {
      const weapon = pickWeighted(
        this.repo.configs.items.weapons.map((row) => ({ weight: row.dropWeight, row })),
        input.rng ?? Math.random,
      )?.row;
      if (weapon) {
        regular.push({ kind: 'weapon', id: weapon.id, amount: 1, level: 1 });
      }
    }

    const adjustedRegular = regular.map((reward) => rewardWithMultipliers(reward, bonuses));
    const rewards: RewardPayload[] = [...adjustedRegular];
    const firstClear = victory && input.wave > save.progress.highestWave;
    if (firstClear) {
      rewards.push({ kind: 'currency', id: 'gold', amount: Math.floor(baseGold * rules.firstClearGoldRatio) });
      if (rules.keyWaves.includes(input.wave)) {
        rewards.push({ kind: 'currency', id: 'blueGem', amount: rules.keyWaveBlueGem });
      }
      if (rules.talentPointWaves.includes(input.wave)) {
        rewards.push({ kind: 'talentPoint', id: 'talentPoint', amount: 1 });
      }
    }

    if (victory && input.adState === 'success' && this.canDoubleReward(save)) {
      const extraMultiplier = Math.max(0, battle.rewardDoubleMultiplier - 1);
      for (const reward of adjustedRegular) {
        if (reward.kind === 'currency' || reward.kind === 'exp' || reward.kind === 'petMaterial') {
          rewards.push({ ...reward, amount: Math.floor(reward.amount * extraMultiplier) });
        }
      }
    }
    return rewards;
  }

  private buildDoubleRewardBonus(save: GameSaveData, input: BattleDoubleRewardInput): RewardPayload[] {
    const rules = this.repo.configs.levels.rewardRules;
    const battle = this.repo.configs.levels.battle;
    const wave = this.repo.getWave(input.chapterId ?? save.progress.chapterId, input.wave);
    if (!wave) {
      return [];
    }

    const rewardMultiplier = wave.rewardMultiplier ?? 1;
    const bonuses = this.progression.getCombatBonuses(save);
    const baseGold = Math.floor((rules.victoryGoldBase + input.wave * rules.victoryGoldPerWave) * rewardMultiplier);
    const baseExp = Math.floor((rules.victoryExpBase + input.wave * rules.victoryExpPerWave) * rewardMultiplier);
    const regular: RewardPayload[] = [
      { kind: 'currency', id: 'gold', amount: baseGold },
      { kind: 'exp', id: 'exp', amount: baseExp },
    ];

    if (input.wave >= rules.petMaterialStartWave) {
      regular.push({
        kind: 'petMaterial',
        id: this.repo.configs.pets.materialItemId,
        amount: rules.petMaterialBase + input.wave * rules.petMaterialPerWave,
      });
    }

    const extraMultiplier = Math.max(0, battle.rewardDoubleMultiplier - 1);
    return regular
      .map((reward) => rewardWithMultipliers(reward, bonuses))
      .filter((reward) => reward.kind === 'currency' || reward.kind === 'exp' || reward.kind === 'petMaterial')
      .map((reward) => ({ ...reward, amount: Math.floor(reward.amount * extraMultiplier) }))
      .filter((reward) => reward.amount > 0);
  }

  private canDoubleReward(save: GameSaveData): boolean {
    ensureProgressRuntimeFields(save);
    const used = save.daily.adPlacementCounts?.battle_reward_double ?? 0;
    return used < this.repo.configs.levels.battle.rewardDoubleDailyLimit;
  }
}
