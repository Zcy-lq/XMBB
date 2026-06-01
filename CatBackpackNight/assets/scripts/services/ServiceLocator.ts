import { AudioManager } from '../core/AudioManager';
import { RedDotManager } from '../core/RedDotManager';
import { ResourceManager } from '../core/ResourceManager';
import { SaveManager } from '../core/SaveManager';
import { TimeManager } from '../core/TimeManager';
import { GameEvents } from '../game/GameEvents';
import { eventBus } from '../core/EventBus';
import runtimeAssetIndex from '../../configs/assets_runtime.json';
import platformConfig from '../../configs/platform.json';
import { AdService } from './AdService';
import { ShareService } from './ShareService';
import { WechatService } from './WechatService';

function isConfiguredRuntimeId(value: unknown): value is string {
  return typeof value === 'string' && value.trim() !== '' && !/^__.+__$/.test(value);
}

export class ServiceLocator {
  private static initialized = false;

  public static bootstrap(): void {
    if (ServiceLocator.initialized) {
      return;
    }
    ServiceLocator.initialized = true;

    const save = SaveManager.instance.load();
    WechatService.instance.configure({
      storagePrefix: 'CatBackpackNight.',
      mockNickname: save.player.nickname,
      appId: isConfiguredRuntimeId(platformConfig.wechat?.appid) ? platformConfig.wechat.appid : undefined,
    });

    const allowMockAds = platformConfig.fallbacks?.useMockOutsideWechat === true && !WechatService.instance.isWechatRuntime();
    const adsEnabled = platformConfig.ads?.enabled === true && platformConfig.reviewMode !== true;
    const rewardedVideoUnitId = isConfiguredRuntimeId(platformConfig.ads?.rewardedVideoUnitId)
      ? platformConfig.ads.rewardedVideoUnitId
      : undefined;
    AdService.instance.configure({
      defaultMockOutcome: 'success',
      mockDelayMs: 300,
      grantRewardOnlyOnCompletedRewardedVideo: platformConfig.fallbacks?.grantRewardOnlyOnCompletedRewardedVideo !== false,
      placements: [
        { placementId: 'battle_reward_double', adUnitId: rewardedVideoUnitId, enabled: adsEnabled || allowMockAds },
        { placementId: 'daily_task_ad', adUnitId: rewardedVideoUnitId, enabled: adsEnabled || allowMockAds },
      ],
    });
    AdService.instance.setMockRewardedAds(allowMockAds);
    ShareService.instance.registerDefaultShare();
    ResourceManager.instance.registerAssetIndex(runtimeAssetIndex);
    RedDotManager.instance.registerDefaultRules();
    RedDotManager.instance.recalculate(save);
    TimeManager.instance.start();
    AudioManager.instance.applySavedSettings();

    eventBus.on(GameEvents.SaveChanged, () => {
      RedDotManager.instance.recalculate();
    });
  }
}
