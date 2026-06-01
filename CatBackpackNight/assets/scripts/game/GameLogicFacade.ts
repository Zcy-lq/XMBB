import { SaveManager } from '../core/SaveManager';
import { eventBus } from '../core/EventBus';
import { CurrencyState, GameSaveData, MailSave, PetSave, RewardPayload } from '../data/GameTypes';
import { BattleSessionModel } from './BattleSessionModel';
import { BattleRewardSystem, BattleSettlementInput, BattleSettlementResult, BattleStartResult } from './BattleRewardSystem';
import { EconomySystem } from './EconomySystem';
import { GameLogicConfigs, ProgressEventType } from './GameConfigTypes';
import { GameConfigRepository, getDefaultGameLogicConfigs } from './GameConfigRepository';
import { failure, GameLogicResult, success } from './GameLogicResult';
import { cloneSave, ensureProgressRuntimeFields, grantRewards } from './GameLogicUtils';
import { GameEvents, GameEventName } from './GameEvents';
import { InventorySystem, MergeResult, OpenChestResult } from './InventorySystem';
import { ClaimResult, PetUpgradeResult, ProgressionSystem, TalentUpgradeResult } from './ProgressionSystem';
import { AdCompletionState, ShopPurchaseResult, ShopSystem, ShopRefreshResult } from './ShopSystem';

export interface BattlePreparationInfo {
  chapterId: string;
  chapterTitle: string;
  maxWave: number;
  wave: number;
  recommendedPower: number;
  myPower: number;
  energyCost: number;
  energyMax: number;
  weaponPreview: { itemId: string; level: number; count: number; power: number }[];
}

export interface GameLogicSnapshot {
  save: GameSaveData;
  battlePreparation: BattlePreparationInfo;
  claimedActivity: number;
}

export class GameLogicFacade {
  public readonly repo: GameConfigRepository;
  public readonly economy: EconomySystem;
  public readonly inventory: InventorySystem;
  public readonly progression: ProgressionSystem;
  public readonly shop: ShopSystem;
  public readonly battleRewards: BattleRewardSystem;
  private activeBattleStart: BattleStartResult | null = null;

  public constructor(
    configs: GameLogicConfigs = getDefaultGameLogicConfigs(),
    private readonly saveManager = SaveManager.instance,
  ) {
    this.repo = new GameConfigRepository(configs);
    this.economy = new EconomySystem(this.repo);
    this.inventory = new InventorySystem(this.repo);
    this.progression = new ProgressionSystem(this.repo);
    this.shop = new ShopSystem(this.repo, this.progression);
    this.battleRewards = new BattleRewardSystem(this.repo, this.progression);
  }

  public getSnapshot(): GameLogicSnapshot {
    const save = this.getPreparedSnapshot();
    return {
      save,
      battlePreparation: this.getBattlePreparation(save.progress.currentWave, save),
      claimedActivity: this.progression.getClaimedActivity(save),
    };
  }

  public getBattlePreparation(wave = this.saveManager.getSnapshot().progress.currentWave, snapshot?: GameSaveData): BattlePreparationInfo {
    const save = snapshot ?? this.getPreparedSnapshot();
    const chapterId = save.progress.chapterId;
    const chapter = this.repo.getChapter(chapterId);
    const waveConfig = this.repo.getWave(chapterId, wave);
    const weaponPreview = save.inventory
      .filter((item) => item.itemType === 'weapon')
      .map((item) => ({
        itemId: item.itemId,
        level: item.level,
        count: item.count,
        power: this.repo.getWeaponLevel(item.itemId, item.level)?.power ?? 0,
      }))
      .sort((a, b) => b.power - a.power)
      .slice(0, 10);
    return {
      chapterId,
      chapterTitle: chapter?.displayName ?? '黑夜森林',
      maxWave: chapter?.maxWave ?? 30,
      wave,
      recommendedPower: waveConfig?.recommendedPower ?? 0,
      myPower: this.progression.getPower(save),
      energyCost: this.repo.getBattleEnergyCost(),
      energyMax: this.repo.configs.levels.battle.energyMax,
      weaponPreview,
    };
  }

  public createBattleSession(options: { battleId?: string; rng?: () => number } = {}): BattleSessionModel {
    return new BattleSessionModel(this.getPreparedSnapshot(), this.repo, {
      ...options,
      battleId: options.battleId ?? this.activeBattleStart?.battleId,
    });
  }

  public startBattle(wave?: number): GameLogicResult<BattleStartResult> {
    if (this.activeBattleStart) {
      return success(this.activeBattleStart, 'battle already started');
    }
    const result = this.commit('battle-start', GameEvents.BattleStart, (save) => this.battleRewards.startBattle(save, wave ?? save.progress.currentWave));
    this.activeBattleStart = result.ok ? result.data ?? null : null;
    return result;
  }

  public getActiveBattleStart(): BattleStartResult | null {
    return this.activeBattleStart;
  }

  public clearActiveBattle(battleId?: string): void {
    if (!battleId || this.activeBattleStart?.battleId === battleId) {
      this.activeBattleStart = null;
    }
  }

  public settleBattle(input: BattleSettlementInput): GameLogicResult<BattleSettlementResult> {
    return this.commit(input.status === 'victory' ? 'battle-win' : 'battle-fail', input.status === 'victory' ? GameEvents.BattleWin : GameEvents.BattleFail, (save) =>
      this.battleRewards.settle(save, input),
    );
  }

  public mergeWeapon(itemId: string, level: number): GameLogicResult<MergeResult> {
    return this.commit('weapon-merge', GameEvents.WeaponMerge, (save) => {
      const result = this.inventory.mergeWeapon(save, itemId, level);
      if (result.ok) {
        this.progression.recordEvent(save, 'weaponMerge', 1);
      }
      return result;
    });
  }

  public autoMergeAll(): GameLogicResult<MergeResult[]> {
    return this.commit('weapon-auto-merge', GameEvents.WeaponMerge, (save) => {
      const results = this.inventory.autoMergeAll(save);
      if (results.length === 0) {
        return failure('not_ready', 'no mergeable weapons');
      }
      this.progression.recordEvent(save, 'weaponMerge', results.length);
      return success(results, 'auto merge completed');
    });
  }

  public openChest(chestId?: string): GameLogicResult<OpenChestResult> {
    return this.commit('chest-open', GameEvents.ChestOpen, (save) => this.inventory.openChest(save, chestId));
  }

  public buyShopGoods(goodsId: string, options: { adState?: AdCompletionState } = {}): GameLogicResult<ShopPurchaseResult> {
    return this.commit('shop-buy', GameEvents.ShopBuy, (save) => this.shop.buy(save, goodsId, options));
  }

  public refreshShop(adState: AdCompletionState = 'not_requested'): GameLogicResult<ShopRefreshResult> {
    return this.commit('shop-refresh', GameEvents.ShopRefresh, (save) => this.shop.refresh(save, adState));
  }

  public deployPet(petId: string): GameLogicResult<PetSave> {
    return this.commit('pet-deploy', GameEvents.PetDeploy, (save) => this.progression.deployPet(save, petId));
  }

  public upgradePet(petId: string): GameLogicResult<PetUpgradeResult> {
    return this.commit('pet-upgrade', GameEvents.PetUpgrade, (save) => this.progression.upgradePet(save, petId));
  }

  public upgradeTalent(nodeId: string): GameLogicResult<TalentUpgradeResult> {
    return this.commit('talent-upgrade', GameEvents.TalentUpgrade, (save) => this.progression.upgradeTalent(save, nodeId));
  }

  public resetTalents(branch?: 'attack' | 'defense' | 'utility'): GameLogicResult<{ refunded: number }> {
    return this.commit('talent-reset', GameEvents.TalentReset, (save) => this.progression.resetTalents(save, branch));
  }

  public claimDailyTask(taskId: string): GameLogicResult<ClaimResult> {
    return this.commit('task-claim', GameEvents.TaskClaim, (save) => this.progression.claimDailyTask(save, taskId));
  }

  public claimActivityChest(chestId: string): GameLogicResult<ClaimResult> {
    return this.commit('activity-claim', GameEvents.TaskClaim, (save) => this.progression.claimActivityChest(save, chestId));
  }

  public claimAchievement(achievementId: string): GameLogicResult<ClaimResult> {
    return this.commit('achievement-claim', GameEvents.AchievementClaim, (save) => this.progression.claimAchievement(save, achievementId));
  }

  public claimAllAchievements(): GameLogicResult<ClaimResult[]> {
    return this.commit('achievement-claim-all', GameEvents.AchievementClaim, (save) => this.progression.claimAllAchievements(save));
  }

  public recordProgressEvent(event: ProgressEventType, amount = 1): GameLogicResult {
    return this.commit('progress-event', GameEvents.SaveChanged, (save) => {
      this.progression.recordEvent(save, event, amount);
      return success(undefined, 'progress recorded');
    });
  }

  public recoverEnergy(now = Date.now()): GameLogicResult<{ recovered: number; energy: number }> {
    return this.commit('energy-recover', GameEvents.SaveChanged, (save) => {
      const recovered = this.economy.recoverEnergy(save, now);
      return success({ recovered, energy: save.currencies.energy }, 'energy recovered');
    });
  }

  public claimMail(mailId: string): GameLogicResult<{ mail: MailSave; rewards: RewardPayload[] }> {
    return this.commit('mail-claim', GameEvents.MailClaim, (save) => {
      const mail = save.mails.find((row) => row.id === mailId);
      if (!mail) {
        return failure('config_missing', `missing mail: ${mailId}`);
      }
      if (mail.claimed) {
        return failure('already_claimed', 'mail already claimed');
      }
      if (mail.expireAt <= Date.now()) {
        return failure('unavailable', 'mail expired');
      }
      if (mail.attachments.length === 0) {
        mail.read = true;
        mail.claimed = true;
        return success({ mail, rewards: [] }, 'mail read');
      }
      const grant = grantRewards(save, mail.attachments, this.repo);
      if (!grant.ok) {
        return failure(grant.reason ?? 'invalid_input', grant.message);
      }
      mail.read = true;
      mail.claimed = true;
      return success({ mail, rewards: mail.attachments }, 'mail claimed');
    });
  }

  public claimAllMails(): GameLogicResult<{ claimed: string[]; rewards: RewardPayload[] }> {
    return this.commit('mail-claim-all', GameEvents.MailClaim, (save) => {
      const claimed: string[] = [];
      const rewards: RewardPayload[] = [];
      for (const mail of save.mails) {
        if (mail.claimed || mail.expireAt <= Date.now() || mail.attachments.length === 0) {
          continue;
        }
        const grant = grantRewards(save, mail.attachments, this.repo);
        if (!grant.ok) {
          return failure(grant.reason ?? 'invalid_input', grant.message);
        }
        mail.read = true;
        mail.claimed = true;
        claimed.push(mail.id);
        rewards.push(...mail.attachments);
      }
      if (claimed.length === 0) {
        return failure('not_ready', 'no mail attachments can be claimed');
      }
      return success({ claimed, rewards }, 'mails claimed');
    });
  }

  public deleteClaimedAndEmptyMails(): GameLogicResult<{ deleted: string[] }> {
    return this.commit('mail-delete', GameEvents.SaveChanged, (save) => {
      const deletable = save.mails.filter((mail) => mail.claimed || mail.attachments.length === 0);
      save.mails = save.mails.filter((mail) => !deletable.includes(mail));
      return success({ deleted: deletable.map((mail) => mail.id) }, 'mails deleted');
    });
  }

  private getPreparedSnapshot(): GameSaveData {
    const save = this.saveManager.getSnapshot();
    ensureProgressRuntimeFields(save);
    this.progression.syncConfiguredSaveRows(save);
    return save;
  }

  private commit<T>(reason: string, eventName: GameEventName, updater: (save: GameSaveData) => GameLogicResult<T>): GameLogicResult<T> {
    const draft = cloneSave(this.getPreparedSnapshot());
    const result = updater(draft);
    if (!result.ok) {
      this.emitGameplayEvent(eventName, result, this.saveManager.getSnapshot());
      return result;
    }
    this.saveManager.replace(draft, reason);
    const nextSave = this.saveManager.getSnapshot();
    this.emitGameplayEvent(eventName, result, nextSave);
    return result;
  }

  private emitGameplayEvent(eventName: GameEventName, result: GameLogicResult<unknown>, save: GameSaveData): void {
    const payload = {
      playerId: save.player.localId,
      currentWave: save.progress.currentWave,
      resources: cloneCurrencies(save.currencies),
      result: result.ok ? 'success' : 'fail',
      errorCode: result.reason,
      message: result.message,
      data: result.data,
    };
    eventBus.emit(eventName, payload);
  }
}

function cloneCurrencies(currencies: CurrencyState): CurrencyState {
  return { ...currencies };
}

export const gameLogic = new GameLogicFacade();
