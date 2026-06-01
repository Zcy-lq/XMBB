import { _decorator } from 'cc';
import { GameEvents } from '../game/GameEvents';
import { AnalyticsService } from '../services/AnalyticsService';
import { SaveManager } from '../core/SaveManager';
import { SceneRouter } from '../core/SceneRouter';
import { BaseSceneEntry } from './BaseSceneEntry';

const { ccclass } = _decorator;

@ccclass('LoginSceneEntry')
export class LoginSceneEntry extends BaseSceneEntry {
  public screenKey = 'login' as const;

  public startGame(acceptedAgreement: boolean): void {
    AnalyticsService.instance.track(GameEvents.LoginStart, { acceptedAgreement });
    if (!acceptedAgreement) {
      this.uiManager?.showToast('请先阅读并同意用户协议和隐私政策');
      return;
    }
    SaveManager.instance.setAgreementAccepted(true);
    AnalyticsService.instance.track(GameEvents.LoginEnterHome);
    void SceneRouter.instance.go('home');
  }
}

