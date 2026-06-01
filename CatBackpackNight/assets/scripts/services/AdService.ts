import { GameEvents } from '../game/GameEvents';
import { eventBus } from '../core/EventBus';
import { AnalyticsService } from './AnalyticsService';
import { WechatError, WechatRewardedVideoAd, wechatService } from './WechatService';

export type AdState = 'ready' | 'loading' | 'cancelled' | 'failed' | 'no_inventory' | 'unavailable' | 'rewarded';
export type RewardedAdOutcome = 'success' | 'cancelled' | 'failed' | 'no_inventory' | 'unavailable';
export type MockRewardedAdOutcome = 'success' | 'cancelled' | 'failed' | 'no_inventory';

export interface RewardedAdPlacement {
  placementId: string;
  adUnitId?: string;
  enabled?: boolean;
}

export interface AdServiceConfig {
  placements?: RewardedAdPlacement[];
  defaultMockOutcome?: MockRewardedAdOutcome;
  mockDelayMs?: number;
}

export interface RewardedAdResult {
  placementId: string;
  state: AdState;
  outcome: RewardedAdOutcome;
  success: boolean;
  message?: string;
  errorCode?: string;
  rawError?: unknown;
  mock?: boolean;
}

export class AdService {
  private static singleton: AdService | null = null;
  private placements = new Map<string, RewardedAdPlacement>();
  private adInstances = new Map<string, WechatRewardedVideoAd>();
  private mockRewardedAds = true;
  private defaultMockOutcome: MockRewardedAdOutcome = 'success';
  private mockDelayMs = 300;

  public static get instance(): AdService {
    if (!AdService.singleton) {
      AdService.singleton = new AdService();
    }
    return AdService.singleton;
  }

  public configure(config: AdServiceConfig): void {
    this.defaultMockOutcome = config.defaultMockOutcome ?? this.defaultMockOutcome;
    this.mockDelayMs = config.mockDelayMs ?? this.mockDelayMs;
    for (const placement of config.placements ?? []) {
      this.registerPlacement(placement);
    }
  }

  public registerPlacement(placement: RewardedAdPlacement): void {
    this.placements.set(placement.placementId, {
      enabled: true,
      ...placement,
    });
  }

  public setMockRewardedAds(enabled: boolean): void {
    this.mockRewardedAds = enabled;
  }

  public setMockRewardedOutcome(outcome: MockRewardedAdOutcome): void {
    this.defaultMockOutcome = outcome;
  }

  public getRewardedState(): AdState {
    if (!wechatService.isWechatRuntime()) {
      return this.mockRewardedAds ? 'ready' : 'unavailable';
    }
    return this.placements.size > 0 ? 'ready' : 'unavailable';
  }

  public async showRewardedAd(placementId: string): Promise<RewardedAdResult> {
    eventBus.emit(GameEvents.RewardDoubleAdStart, { placementId });
    AnalyticsService.instance.track(GameEvents.RewardDoubleAdStart, { placementId });

    const placement = this.resolvePlacement(placementId);
    let result: RewardedAdResult;

    if (placement.enabled === false) {
      result = this.createResult(placementId, 'unavailable', '广告位已关闭。');
    } else if (!wechatService.isWechatRuntime()) {
      result = await this.showMockRewardedAd(placementId);
    } else if (!placement.adUnitId) {
      result = this.createResult(placementId, 'unavailable', '广告位未配置 adUnitId。');
    } else {
      result = await this.showWechatRewardedAd(placementId, placement.adUnitId);
    }

    eventBus.emit(GameEvents.RewardDoubleAdResult, result);
    AnalyticsService.instance.track(GameEvents.RewardDoubleAdResult, {
      placementId,
      outcome: result.outcome,
      state: result.state,
      errorCode: result.errorCode,
    });
    return result;
  }

  private resolvePlacement(placementId: string): RewardedAdPlacement {
    return this.placements.get(placementId) ?? { placementId, enabled: true };
  }

  private async showMockRewardedAd(placementId: string): Promise<RewardedAdResult> {
    if (!this.mockRewardedAds) {
      return this.createResult(placementId, 'unavailable', '编辑器 Mock 广告已关闭。', undefined, undefined, true);
    }
    await this.delay(this.mockDelayMs);
    switch (this.defaultMockOutcome) {
      case 'cancelled':
        return this.createResult(placementId, 'cancelled', 'Mock：玩家中途关闭广告。', undefined, undefined, true);
      case 'failed':
        return this.createResult(placementId, 'failed', 'Mock：广告播放失败。', 'MOCK_FAILED', undefined, true);
      case 'no_inventory':
        return this.createResult(placementId, 'no_inventory', 'Mock：暂无广告库存。', 'MOCK_NO_INVENTORY', undefined, true);
      case 'success':
      default:
        return this.createResult(placementId, 'rewarded', 'Mock：广告观看完成。', undefined, undefined, true);
    }
  }

  private async showWechatRewardedAd(placementId: string, adUnitId: string): Promise<RewardedAdResult> {
    const runtime = wechatService.getRuntime();
    if (!runtime?.createRewardedVideoAd) {
      return this.createResult(placementId, 'unavailable', '当前微信基础库不支持激励视频广告。');
    }

    const ad = this.getOrCreateAd(placementId, adUnitId);
    return new Promise<RewardedAdResult>((resolve) => {
      let settled = false;
      let timeoutId: number | null = null;

      const finish = (result: RewardedAdResult): void => {
        if (settled) {
          return;
        }
        settled = true;
        if (timeoutId !== null) {
          clearTimeout(timeoutId);
        }
        ad.offClose?.(onClose);
        ad.offError?.(onError);
        resolve(result);
      };

      const onClose = (closeResult?: { isEnded?: boolean }): void => {
        if (closeResult?.isEnded || closeResult === undefined) {
          finish(this.createResult(placementId, 'rewarded', '广告观看完成。'));
          return;
        }
        finish(this.createResult(placementId, 'cancelled', '玩家未看完广告，不能发放激励奖励。'));
      };

      const onError = (error: WechatError): void => {
        finish(this.classifyWechatError(placementId, error));
      };

      ad.onClose?.(onClose);
      ad.onError?.(onError);
      timeoutId = setTimeout(() => {
        finish(this.createResult(placementId, 'failed', '广告等待超时，请稍后再试。', 'AD_TIMEOUT'));
      }, 120000) as unknown as number;

      void this.tryShowAd(ad).catch((error) => {
        finish(this.classifyWechatError(placementId, error));
      });
    });
  }

  private getOrCreateAd(placementId: string, adUnitId: string): WechatRewardedVideoAd {
    const cached = this.adInstances.get(placementId);
    if (cached) {
      return cached;
    }
    const runtime = wechatService.getRuntime();
    const ad = runtime!.createRewardedVideoAd!({ adUnitId, multiton: true });
    this.adInstances.set(placementId, ad);
    return ad;
  }

  private async tryShowAd(ad: WechatRewardedVideoAd): Promise<void> {
    if (!ad.show) {
      throw { errMsg: '激励视频广告实例缺少 show 方法。' };
    }
    try {
      await this.callAdMethod(() => ad.show!());
    } catch {
      await this.callAdMethod(() => ad.load?.());
      await this.callAdMethod(() => ad.show!());
    }
  }

  private async callAdMethod(method: () => Promise<void> | void | undefined): Promise<void> {
    const result = method();
    if (result && typeof (result as Promise<void>).then === 'function') {
      await result;
    }
  }

  private classifyWechatError(placementId: string, error: unknown): RewardedAdResult {
    const typed = (error ?? {}) as WechatError;
    const code = typed.errCode ?? typed.errno;
    const codeText = code !== undefined ? `${code}` : undefined;
    const message = wechatService.errorMessage(error, '广告播放失败。');
    if (this.isNoInventoryError(codeText, message)) {
      return this.createResult(placementId, 'no_inventory', '暂无广告库存，请稍后再试。', codeText, error);
    }
    return this.createResult(placementId, 'failed', message, codeText, error);
  }

  private isNoInventoryError(codeText: string | undefined, message: string): boolean {
    const normalized = message.toLowerCase();
    return (
      codeText === '1004' ||
      codeText === '1006' ||
      codeText === '1007' ||
      normalized.includes('no ad') ||
      normalized.includes('no advertisement') ||
      normalized.includes('暂无广告') ||
      normalized.includes('无广告')
    );
  }

  private createResult(
    placementId: string,
    state: AdState,
    message?: string,
    errorCode?: string,
    rawError?: unknown,
    mock = false,
  ): RewardedAdResult {
    const outcome: RewardedAdOutcome =
      state === 'rewarded' ? 'success' : state === 'cancelled' ? 'cancelled' : state === 'no_inventory' ? 'no_inventory' : state === 'unavailable' ? 'unavailable' : 'failed';
    return {
      placementId,
      state,
      outcome,
      success: outcome === 'success',
      message,
      errorCode,
      rawError,
      mock,
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const adService = AdService.instance;
