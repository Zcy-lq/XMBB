import { _decorator } from 'cc';
import { GameEvents } from '../game/GameEvents';
import { BattleSessionModel, BattleStatus } from '../game/BattleSessionModel';
import { gameLogic } from '../game/GameLogicFacade';
import { SceneRouter } from '../core/SceneRouter';
import { AnalyticsService } from '../services/AnalyticsService';
import { BaseSceneEntry } from './BaseSceneEntry';

const { ccclass } = _decorator;

@ccclass('BattleSceneEntry')
export class BattleSceneEntry extends BaseSceneEntry {
  public screenKey = 'battle' as const;
  private session: BattleSessionModel | null = null;
  private settlementStarted = false;

  protected onSceneReady(): void {
    const existingBattle = gameLogic.getActiveBattleStart();
    if (!existingBattle) {
      const start = gameLogic.startBattle();
      if (!start.ok) {
        this.uiManager?.showToast(start.reason === 'insufficient_currency' ? '体力不足' : start.message);
        void SceneRouter.instance.go('home');
        return;
      }
      AnalyticsService.instance.track(GameEvents.BattleStart, { payload: start.data });
    }

    this.session = gameLogic.createBattleSession();
    this.settlementStarted = false;
    this.uiManager?.updateBattleState(this.session.state);
  }

  protected update(deltaSec: number): void {
    this.tickBattle(deltaSec);
  }

  public pause(): void {
    this.session?.pause();
  }

  public resume(): void {
    this.session?.resume();
  }

  public completeMockWin(): void {
    this.finishBattle('victory');
  }

  public completeMockFail(): void {
    this.finishBattle('fail');
  }

  public exitToHome(): void {
    void SceneRouter.instance.go('home');
  }

  private tickBattle(deltaSec: number): void {
    if (!this.session || this.settlementStarted) {
      return;
    }
    this.session.tick(deltaSec);
    this.uiManager?.updateBattleState(this.session.state);
    if (this.session.state.status !== 'running') {
      this.uiManager?.updateBattleState(this.session.state);
      this.finishBattle(this.session.state.status);
    }
  }

  private finishBattle(status: Exclude<BattleStatus, 'running'>): void {
    if (this.settlementStarted) {
      return;
    }
    this.settlementStarted = true;

    const battleId = this.session?.state.battleId ?? gameLogic.getActiveBattleStart()?.battleId;
    if (!battleId) {
      this.uiManager?.showToast('battle session missing');
      void SceneRouter.instance.go('home');
      return;
    }

    const result = gameLogic.settleBattle({
      battleId,
      chapterId: this.session?.state.chapterId,
      wave: this.session?.state.wave ?? gameLogic.getSnapshot().save.progress.currentWave,
      status,
      defeatedMonsters: this.session?.state.defeatedMonsters ?? 0,
    });
    if (!result.ok) {
      this.uiManager?.showToast(result.message);
      gameLogic.clearActiveBattle(battleId);
      void SceneRouter.instance.go('home');
      return;
    }

    gameLogic.clearActiveBattle(battleId);
    AnalyticsService.instance.track(status === 'victory' ? GameEvents.BattleWin : GameEvents.BattleFail, { payload: result.data });
    void SceneRouter.instance.go(status === 'victory' ? 'victory' : 'defeat');
  }
}
