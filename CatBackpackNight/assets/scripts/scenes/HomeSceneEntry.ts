import { _decorator } from 'cc';
import { RouteId } from '../data/GameTypes';
import { GameEvents } from '../game/GameEvents';
import { AnalyticsService } from '../services/AnalyticsService';
import { SceneRouter } from '../core/SceneRouter';
import { BaseSceneEntry } from './BaseSceneEntry';

const { ccclass } = _decorator;

@ccclass('HomeSceneEntry')
export class HomeSceneEntry extends BaseSceneEntry {
  public screenKey: RouteId = 'home';

  public openRoute(route: RouteId): void {
    void SceneRouter.instance.go(route);
  }

  public openBattlePrepare(): void {
    AnalyticsService.instance.track(GameEvents.BattlePrepareOpen);
    void SceneRouter.instance.go('battlePrepare');
  }
}
