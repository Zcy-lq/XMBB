import { GameSaveData, RewardPayload } from '../data/GameTypes';
import { ShopGoodsConfig } from './GameConfigTypes';
import { GameConfigRepository } from './GameConfigRepository';
import { failure, GameLogicResult, success } from './GameLogicResult';
import {
  ensureProgressRuntimeFields,
  getCurrency,
  getDailyCounter,
  grantRewards,
  hasInventorySpaceForRewards,
  incrementAdPlacement,
  setDailyCounter,
  spendCurrency,
} from './GameLogicUtils';
import { ProgressionSystem } from './ProgressionSystem';

export type AdCompletionState = 'success' | 'cancel' | 'no_fill' | 'error' | 'not_requested';

export interface ShopPurchaseOptions {
  adState?: AdCompletionState;
}

export interface ShopPurchaseResult {
  goodsId: string;
  rewards: RewardPayload[];
  purchaseCount: number;
}

export interface ShopRefreshResult {
  refreshCount: number;
  nextRefreshAt: number;
}

export class ShopSystem {
  public constructor(
    private readonly repo: GameConfigRepository,
    private readonly progression: ProgressionSystem,
  ) {}

  public buy(save: GameSaveData, goodsId: string, options: ShopPurchaseOptions = {}): GameLogicResult<ShopPurchaseResult> {
    ensureProgressRuntimeFields(save);
    const goods = this.repo.getGoods(goodsId);
    if (!goods) {
      return failure('config_missing', `missing goods config: ${goodsId}`);
    }
    const tabEnabled = this.repo.isShopTabEnabled(goods.tabId);
    if (!tabEnabled || goods.payment.type === 'unavailable') {
      return failure('unavailable', 'goods is not available');
    }
    if (goods.dailyLimit <= 0) {
      return failure('unavailable', 'goods has no purchase quota');
    }

    const currentCount = getDailyCounter(save, goodsId);
    if (currentCount >= goods.dailyLimit) {
      return failure('daily_limit_reached', 'daily purchase limit reached');
    }
    if (goods.payment.type === 'free' && goods.id === 'daily_free_gold' && save.daily.freeGoldClaimed) {
      return failure('already_claimed', 'daily free gold already claimed');
    }

    const paymentCheck = this.checkPayment(save, goods, options.adState ?? 'not_requested');
    if (!paymentCheck.ok) {
      return paymentCheck as GameLogicResult<ShopPurchaseResult>;
    }
    const rewardCheck = hasInventorySpaceForRewards(save, goods.rewards, this.repo);
    if (!rewardCheck.ok) {
      return rewardCheck as GameLogicResult<ShopPurchaseResult>;
    }

    const pay = this.applyPayment(save, goods, options.adState ?? 'not_requested');
    if (!pay.ok) {
      return pay as GameLogicResult<ShopPurchaseResult>;
    }
    const grant = grantRewards(save, goods.rewards, this.repo);
    if (!grant.ok) {
      return failure(grant.reason ?? 'invalid_input', grant.message);
    }

    setDailyCounter(save, goodsId, currentCount + 1);
    if (goods.payment.type === 'free' && goods.id === 'daily_free_gold') {
      save.daily.freeGoldClaimed = true;
    }
    return success({ goodsId, rewards: goods.rewards, purchaseCount: currentCount + 1 }, 'shop purchase success');
  }

  public refresh(save: GameSaveData, adState: AdCompletionState = 'not_requested', now = new Date()): GameLogicResult<ShopRefreshResult> {
    ensureProgressRuntimeFields(save);
    if (save.daily.shopRefreshCount >= this.repo.configs.shop.manualRefreshLimit) {
      return failure('daily_limit_reached', 'daily shop refresh limit reached');
    }

    const canUseAd = save.daily.shopRefreshCount < this.repo.configs.shop.adRefreshFreeCount;
    if (canUseAd && adState === 'success') {
      incrementAdPlacement(save, 'shop_refresh');
      this.progression.recordEvent(save, 'adWatch', 1);
    } else {
      if (canUseAd && adState !== 'not_requested') {
        return failure('ad_not_completed', 'ad refresh was not completed');
      }
      const pay = spendCurrency(save, this.repo.configs.shop.manualRefreshCost);
      if (!pay.ok) {
        return pay as GameLogicResult<ShopRefreshResult>;
      }
    }

    save.daily.shopRefreshCount += 1;
    return success(
      {
        refreshCount: save.daily.shopRefreshCount,
        nextRefreshAt: this.getNextRefreshAt(now),
      },
      'shop refreshed',
    );
  }

  public getNextRefreshAt(now = new Date()): number {
    const next = new Date(now);
    const refreshHour = this.repo.configs.shop.nextRefreshHour;
    next.setHours(refreshHour, 0, 0, 0);
    if (next.getTime() <= now.getTime()) {
      next.setDate(next.getDate() + 1);
    }
    return next.getTime();
  }

  private checkPayment(save: GameSaveData, goods: ShopGoodsConfig, adState: AdCompletionState): GameLogicResult {
    if (goods.payment.type === 'free') {
      return success();
    }
    if (goods.payment.type === 'ad') {
      return adState === 'success' ? success() : failure('ad_not_completed', 'ad was not completed');
    }
    if (goods.payment.type === 'currency') {
      const currency = goods.payment.currency;
      const amount = goods.payment.amount ?? 0;
      if (!currency) {
        return failure('config_missing', `missing payment currency: ${goods.id}`);
      }
      if (getCurrency(save, currency) < amount) {
        return failure('insufficient_currency', `${currency} not enough`);
      }
      return success();
    }
    return failure('unavailable', 'goods is unavailable');
  }

  private applyPayment(save: GameSaveData, goods: ShopGoodsConfig, adState: AdCompletionState): GameLogicResult {
    if (goods.payment.type === 'currency') {
      return spendCurrency(save, {
        currency: goods.payment.currency!,
        amount: goods.payment.amount ?? 0,
      });
    }
    if (goods.payment.type === 'ad') {
      if (adState !== 'success') {
        return failure('ad_not_completed', 'ad was not completed');
      }
      incrementAdPlacement(save, goods.id);
      this.progression.recordEvent(save, 'adWatch', 1);
    }
    return success();
  }
}
