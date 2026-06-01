import { _decorator } from 'cc';
import { GameEvents } from '../game/GameEvents';
import { gameLogic } from '../game/GameLogicFacade';
import { SceneRouter } from '../core/SceneRouter';
import { AnalyticsService } from '../services/AnalyticsService';
import { BaseSceneEntry } from './BaseSceneEntry';

const { ccclass } = _decorator;

@ccclass('BattlePrepareSceneEntry')
export class BattlePrepareSceneEntry extends BaseSceneEntry {
  public screenKey = 'battlePrepare' as const;

  public startBattle(): void {
    const result = gameLogic.startBattle();
    if (!result.ok) {
      this.uiManager?.showToast(result.reason === 'insufficient_currency' ? '体力不足' : result.message);
      return;
    }

    AnalyticsService.instance.track(GameEvents.BattleStart, { payload: result.data });
    void SceneRouter.instance.go('battle');
  }

  public backHome(): void {
    void SceneRouter.instance.go('home');
  }
}
