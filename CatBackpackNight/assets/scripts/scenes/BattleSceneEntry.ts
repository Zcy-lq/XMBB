import { _decorator } from 'cc';
import { GameEvents } from '../game/GameEvents';
import { BattleSessionModel, BattleStatus } from '../game/BattleSessionModel';
import { gameLogic } from '../game/GameLogicFacade';
import { SceneRouter } from '../core/SceneRouter';
import { eventBus } from '../core/EventBus';
import { AnalyticsService } from '../services/AnalyticsService';
import { BaseSceneEntry } from './BaseSceneEntry';

const { ccclass } = _decorator;

@ccclass('BattleSceneEntry')
export class BattleSceneEntry extends BaseSceneEntry {
  public screenKey = 'battle' as const;
  private session: BattleSessionModel | null = null;
  private settlementStarted = false;
  private uiUpdateAccumulator = 0;
  private readonly powerSavingUiIntervalSec = 0.2;
  private unsubscribeSkillApply: (() => void) | null = null;
  private unsubscribeSkillReroll: (() => void) | null = null;
  private unsubscribeAutoMergeToggle: (() => void) | null = null;

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
    this.uiUpdateAccumulator = 0;
    this.bindSkillChoiceEvents();
    this.uiManager?.updateBattleState(this.session.state);
  }

  protected onDestroy(): void {
    this.unsubscribeSkillApply?.();
    this.unsubscribeSkillReroll?.();
    this.unsubscribeAutoMergeToggle?.();
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
    const events = this.session.tick(deltaSec);
    this.uiUpdateAccumulator += deltaSec;
    if (this.shouldUpdateBattleUi()) {
      this.uiUpdateAccumulator = 0;
      this.uiManager?.updateBattleState(this.session.state);
    }
    if (events.some((event) => event.type === 'skillReady')) {
      this.uiManager?.updateBattleState(this.session.state);
      void SceneRouter.instance.go('skillChoice');
      return;
    }
    if (this.session.state.status !== 'running') {
      this.uiManager?.updateBattleState(this.session.state);
      this.finishBattle(this.session.state.status);
    }
  }

  private shouldUpdateBattleUi(): boolean {
    const powerSavingEnabled = gameLogic.getSnapshot().save.settings.powerSavingEnabled;
    return !powerSavingEnabled || this.uiUpdateAccumulator >= this.powerSavingUiIntervalSec;
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

  private bindSkillChoiceEvents(): void {
    this.unsubscribeSkillApply?.();
    this.unsubscribeSkillReroll?.();
    this.unsubscribeAutoMergeToggle?.();
    this.unsubscribeSkillApply = eventBus.on<{ index?: number }>(GameEvents.SkillChoiceApplyRequested, (payload) => {
      this.applySkillChoice(payload?.index ?? 0);
    });
    this.unsubscribeSkillReroll = eventBus.on<{ cost?: number }>(GameEvents.SkillChoiceRerollRequested, (payload) => {
      this.rerollSkillChoices(payload?.cost ?? 20);
    });
    this.unsubscribeAutoMergeToggle = eventBus.on(GameEvents.BattleAutoMergeToggleRequested, () => {
      this.toggleBattleAutoMerge();
    });
  }

  private toggleBattleAutoMerge(): void {
    if (!this.session) {
      this.uiManager?.showToast('battle session missing');
      return;
    }

    const enabled = !this.session.state.autoMergeEnabled;
    this.session.setAutoMerge(enabled);
    this.uiManager?.showToast(enabled ? '自动合成已开启' : '自动合成已关闭');
    this.uiManager?.updateBattleState(this.session.state);
    void SceneRouter.instance.go(SceneRouter.instance.currentRoute === 'skillChoice' ? 'skillChoice' : 'battle');
  }

  private applySkillChoice(index: number): void {
    if (!this.session) {
      this.uiManager?.showToast('battle session missing');
      return;
    }
    const result = this.session.applySkillChoice(index);
    if (!result.ok) {
      this.uiManager?.showToast(result.message);
      return;
    }
    this.uiManager?.showToast(`已选择 ${result.data?.displayName ?? '技能'}`);
    this.uiManager?.updateBattleState(this.session.state);
    void SceneRouter.instance.go('battle');
  }

  private rerollSkillChoices(cost: number): void {
    if (!this.session) {
      this.uiManager?.showToast('battle session missing');
      return;
    }
    if (this.session.state.skillRerollsRemaining <= 0) {
      this.uiManager?.showToast('本轮技能已刷新过');
      return;
    }
    if (gameLogic.getSnapshot().save.currencies.purpleGem < cost) {
      this.uiManager?.showToast('钻石不足');
      return;
    }

    const spend = gameLogic.spendSkillRefreshCost(cost);
    if (!spend.ok) {
      this.uiManager?.showToast(spend.reason === 'insufficient_currency' ? '钻石不足' : spend.message);
      return;
    }
    const reroll = this.session.rerollSkillChoices();
    if (!reroll.ok) {
      this.uiManager?.showToast(reroll.message);
      return;
    }

    this.uiManager?.showToast('技能已刷新');
    this.uiManager?.updateBattleState(this.session.state);
    void SceneRouter.instance.go('skillChoice');
  }
}
