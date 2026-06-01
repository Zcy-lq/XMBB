import { _decorator, builtinResMgr, Color, Component, Label, Layers, Node, Sprite, SpriteFrame, UITransform } from 'cc';
import { RouteId } from '../data/GameTypes';
import { GameEvents } from '../game/GameEvents';
import { BattleSessionState } from '../game/BattleSessionModel';
import { eventBus } from '../core/EventBus';
import { SceneRouter } from '../core/SceneRouter';
import { DESIGN_HEIGHT, DESIGN_WIDTH, UIColors } from './UITheme';
import { UISkeletonBuilder } from './UISkeletonBuilder';

const { ccclass, property } = _decorator;

@ccclass('UIManager')
export class UIManager extends Component {
  public static instance: UIManager | null = null;

  @property(Node)
  public screenRoot: Node | null = null;

  @property(Node)
  public modalRoot: Node | null = null;

  @property(Node)
  public toastRoot: Node | null = null;

  private skeletonBuilder: UISkeletonBuilder | null = null;
  private unsubscribeRouteChanged: (() => void) | null = null;
  private unsubscribeToast: (() => void) | null = null;

  protected onLoad(): void {
    UIManager.instance = this;
    this.ensureLayers();
    this.unsubscribeRouteChanged = eventBus.on(GameEvents.RouteChanged, (state: { route: RouteId }) => {
      this.showScreen(state.route);
    });
    this.unsubscribeToast = eventBus.on(GameEvents.Toast, (payload: { message?: string }) => {
      const message = String(payload?.message ?? '');
      if (message) {
        this.renderToast(message);
      }
    });
  }

  protected onDestroy(): void {
    if (UIManager.instance === this) {
      UIManager.instance = null;
    }
    this.unsubscribeRouteChanged?.();
    this.unsubscribeToast?.();
  }

  public showScreen(route: RouteId): void {
    this.ensureLayers();
    this.skeletonBuilder!.screenKey = route;
    this.skeletonBuilder!.rebuild();
  }

  public updateBattleState(state: BattleSessionState): void {
    this.ensureLayers();
    this.skeletonBuilder?.setBattleState(state);
  }

  public showToast(message: string): void {
    eventBus.emit(GameEvents.Toast, { message });
    console.log(`[UIManager] Toast: ${message}`);
  }

  public navigate(route: RouteId): void {
    void SceneRouter.instance.go(route);
  }

  private ensureLayers(): void {
    this.screenRoot = this.screenRoot ?? this.createLayer('ScreenRoot', 20);
    this.modalRoot = this.modalRoot ?? this.createLayer('ModalRoot', 60);
    this.toastRoot = this.toastRoot ?? this.createLayer('ToastRoot', 70);
    this.skeletonBuilder = this.screenRoot.getComponent(UISkeletonBuilder) ?? this.screenRoot.addComponent(UISkeletonBuilder);
  }

  private createLayer(name: string, zIndex: number): Node {
    const node = new Node(name);
    node.layer = Layers.Enum.UI_2D;
    node.parent = this.node;
    node.setSiblingIndex(zIndex);
    const transform = node.addComponent(UITransform);
    transform.setContentSize(DESIGN_WIDTH, DESIGN_HEIGHT);
    return node;
  }

  private renderToast(message: string): void {
    this.ensureLayers();
    if (!this.toastRoot) {
      return;
    }

    this.toastRoot.removeAllChildren();

    const card = new Node('Toast_Card');
    card.layer = Layers.Enum.UI_2D;
    card.parent = this.toastRoot;
    card.setPosition(0, 378, 0);
    const cardTransform = card.addComponent(UITransform);
    cardTransform.setContentSize(560, 78);
    const cardSprite = card.addComponent(Sprite);
    const spriteFrame = builtinResMgr.get<SpriteFrame>('builtin-2d-sprite');
    if (spriteFrame) {
      cardSprite.spriteFrame = spriteFrame;
    }
    cardSprite.sizeMode = Sprite.SizeMode.CUSTOM;
    cardSprite.color = new Color(28, 24, 20, 238);

    const labelNode = new Node('Toast_Message');
    labelNode.layer = Layers.Enum.UI_2D;
    labelNode.parent = card;
    const labelTransform = labelNode.addComponent(UITransform);
    labelTransform.setContentSize(520, 64);
    const label = labelNode.addComponent(Label);
    label.string = message;
    label.fontSize = 28;
    label.lineHeight = 34;
    label.color = UIColors.whiteText;
    label.useSystemFont = true;
    label.fontFamily = 'sans-serif';
    label.isBold = true;
    label.enableWrapText = true;
    label.overflow = Label.Overflow.SHRINK;
    label.horizontalAlign = Label.HorizontalAlign.CENTER;
    label.verticalAlign = Label.VerticalAlign.CENTER;

    this.scheduleOnce(() => {
      if (card.isValid) {
        card.removeFromParent();
        card.destroy();
      }
    }, 1.8);
  }
}
