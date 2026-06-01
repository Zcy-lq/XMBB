import { _decorator, Camera, Canvas, Color, Component, director, Layers, Node, ResolutionPolicy, UITransform, view } from 'cc';
import { getRouteConfig } from '../configs/RouteConfig';
import { RouteId } from '../data/GameTypes';
import { SceneRouter } from '../core/SceneRouter';
import { ServiceLocator } from '../services/ServiceLocator';
import { UIManager } from '../ui/UIManager';
import { DESIGN_HEIGHT, DESIGN_WIDTH } from '../configs/GameConfig';

const { ccclass, property } = _decorator;

type PreviewGlobal = typeof globalThis & {
  __xmbbPreviewScreenConsumed?: boolean;
  location?: { search?: string };
};

@ccclass('BaseSceneEntry')
export class BaseSceneEntry extends Component {
  @property
  public screenKey: RouteId = 'home';

  @property
  public buildUISkeleton = true;

  protected uiManager: UIManager | null = null;

  protected onLoad(): void {
    const requestedScreenKey = this.resolvePreviewScreenKey();
    const sceneName = director.getScene()?.name ?? this.node.name;
    console.log(`[BaseSceneEntry] onLoad scene=${sceneName} screen=${requestedScreenKey}`);
    ServiceLocator.bootstrap();
    if (requestedScreenKey !== this.screenKey && getRouteConfig(requestedScreenKey).sceneName !== sceneName) {
      SceneRouter.instance.syncFromScene(sceneName);
      void SceneRouter.instance.replace(requestedScreenKey);
      return;
    }

    const screenKey = requestedScreenKey;
    if (screenKey === this.screenKey) {
      SceneRouter.instance.syncFromScene(sceneName);
    }
    this.uiManager = this.ensureUIManager();
    if (this.buildUISkeleton) {
      this.uiManager.showScreen(screenKey);
    }
    this.onSceneReady();
  }

  protected onSceneReady(): void {
    // Subclasses hook their own route and scene-specific events here.
  }

  protected ensureUIManager(): UIManager {
    const canvas = this.ensureCanvas();
    return canvas.getComponent(UIManager) ?? canvas.addComponent(UIManager);
  }

  protected ensureCanvas(): Node {
    const scene = director.getScene();
    let canvas = scene?.getChildByName('Canvas') ?? null;
    if (!canvas) {
      canvas = new Node('Canvas');
      canvas.layer = Layers.Enum.UI_2D;
      scene?.addChild(canvas);
    }

    const canvasComponent = canvas.getComponent(Canvas) ?? canvas.addComponent(Canvas);
    const transform = canvas.getComponent(UITransform) ?? canvas.addComponent(UITransform);
    transform.setContentSize(DESIGN_WIDTH, DESIGN_HEIGHT);
    canvasComponent.cameraComponent = this.ensureUICamera();
    view.setDesignResolutionSize(DESIGN_WIDTH, DESIGN_HEIGHT, ResolutionPolicy.FIXED_WIDTH);
    console.log(`[BaseSceneEntry] Canvas ready ${DESIGN_WIDTH}x${DESIGN_HEIGHT}`);
    return canvas;
  }

  private ensureUICamera(): Camera {
    const scene = director.getScene();
    let cameraNode = scene?.getChildByName('UICamera') ?? null;
    if (!cameraNode) {
      cameraNode = new Node('UICamera');
      cameraNode.layer = Layers.Enum.UI_2D;
      scene?.addChild(cameraNode);
    }
    cameraNode.setPosition(0, 0, 1000);
    const camera = cameraNode.getComponent(Camera) ?? cameraNode.addComponent(Camera);
    camera.visibility = Layers.Enum.UI_2D;
    camera.projection = Camera.ProjectionType.ORTHO;
    camera.orthoHeight = DESIGN_HEIGHT / 2;
    camera.clearFlags = Camera.ClearFlag.SOLID_COLOR;
    camera.clearColor = new Color(7, 26, 44, 255);
    console.log('[BaseSceneEntry] UI camera ready');
    return camera;
  }

  private resolvePreviewScreenKey(): RouteId {
    const fallback = this.screenKey;
    const previewGlobal = globalThis as PreviewGlobal;
    if (previewGlobal.__xmbbPreviewScreenConsumed) {
      return fallback;
    }

    const href = previewGlobal.location?.search ?? '';
    const match = /[?&]screen=([^&]+)/.exec(href);
    if (!match) {
      return fallback;
    }

    const route = decodeURIComponent(match[1]) as RouteId;
    const routes: RouteId[] = ['login', 'home', 'battlePrepare', 'battle', 'merge', 'mergeGuide', 'explore', 'guild', 'backpack', 'shop', 'pet', 'petDetail', 'talent', 'dailyTask', 'achievement', 'mail', 'mailDetail', 'settings', 'policyModal', 'confirmModal', 'toastModal', 'pauseModal', 'skillChoice', 'victory', 'defeat'];
    if (!routes.includes(route)) {
      return fallback;
    }

    previewGlobal.__xmbbPreviewScreenConsumed = true;
    return route;
  }
}
