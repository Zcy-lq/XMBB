import { AudioManager } from '../core/AudioManager';
import { RedDotManager } from '../core/RedDotManager';
import { ResourceManager } from '../core/ResourceManager';
import { SaveManager } from '../core/SaveManager';
import { TimeManager } from '../core/TimeManager';
import { GameEvents } from '../game/GameEvents';
import { eventBus } from '../core/EventBus';
import runtimeAssetIndex from '../../configs/assets_runtime.json';
import { AdService } from './AdService';
import { ShareService } from './ShareService';
import { WechatService } from './WechatService';

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
    });
    AdService.instance.configure({ defaultMockOutcome: 'success', mockDelayMs: 300 });
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
