import { director } from 'cc';
import { getRouteConfig } from '../configs/RouteConfig';
import { RouteId, RouteParams, RouteState } from '../data/GameTypes';
import { GameEvents } from '../game/GameEvents';
import { eventBus } from './EventBus';

export class SceneRouter {
  private static singleton: SceneRouter | null = null;
  private currentState: RouteState = { route: 'login', sceneName: 'Login' };
  private pendingState: RouteState | null = null;
  private history: RouteState[] = [];

  public static get instance(): SceneRouter {
    if (!SceneRouter.singleton) {
      SceneRouter.singleton = new SceneRouter();
    }
    return SceneRouter.singleton;
  }

  public get current(): RouteState {
    return { ...this.currentState };
  }

  public get currentRoute(): RouteId {
    return this.currentState.route;
  }

  public async go(route: RouteId, params?: RouteParams): Promise<void> {
    const config = getRouteConfig(route);
    const from = this.currentState;
    const next: RouteState = {
      route,
      sceneName: config.sceneName,
      params: { ...params, from: params?.from ?? from.route },
    };

    eventBus.emit(GameEvents.RouteBeforeChange, { from, to: next });

    return new Promise<void>((resolve) => {
      const commit = (): void => {
        this.currentState = next;
        this.history.push(next);
        eventBus.emit(GameEvents.RouteChanged, next);
        resolve();
      };

      if (from.sceneName === next.sceneName) {
        commit();
        return;
      }

      this.pendingState = next;
      director.loadScene(next.sceneName, () => {
        this.pendingState = null;
        commit();
      });
    });
  }

  public async replace(route: RouteId, params?: RouteParams): Promise<void> {
    if (this.history.length > 0) {
      this.history.pop();
    }
    await this.go(route, params);
  }

  public async back(fallback: RouteId = 'home'): Promise<void> {
    if (this.history.length <= 1) {
      await this.go(fallback);
      return;
    }

    this.history.pop();
    const previous = this.history.pop();
    await this.go(previous?.route ?? fallback, previous?.params);
  }

  public syncFromScene(sceneName: string): void {
    if (this.pendingState?.sceneName === sceneName) {
      this.currentState = this.pendingState;
      if (this.history.length === 0) {
        this.history.push(this.currentState);
      }
      return;
    }
    const route = sceneName === 'Login' ? 'login' : sceneName === 'Battle' ? 'battle' : sceneName === 'BattlePrepare' ? 'battlePrepare' : 'home';
    this.currentState = { route, sceneName };
    if (this.history.length === 0) {
      this.history.push(this.currentState);
    }
  }
}

export const sceneRouter = SceneRouter.instance;
