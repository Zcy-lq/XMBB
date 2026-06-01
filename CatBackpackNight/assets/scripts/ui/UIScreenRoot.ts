import { _decorator, Node, UITransform, Widget } from 'cc';
import { BaseUIComponent } from './BaseUIComponent';
import { DESIGN_HEIGHT, DESIGN_WIDTH } from './UITheme';

const { ccclass, property } = _decorator;

@ccclass('UIScreenRoot')
export class UIScreenRoot extends BaseUIComponent {
  @property(Node)
  public safeTopRoot: Node | null = null;

  @property(Node)
  public mainContentRoot: Node | null = null;

  @property(Node)
  public safeBottomRoot: Node | null = null;

  @property
  public designWidth = DESIGN_WIDTH;

  @property
  public designHeight = DESIGN_HEIGHT;

  public applySafeArea(safeTop = 0, safeBottom = 0): void {
    this.resizeNode(this.safeTopRoot, this.designWidth, 96 + safeTop);
    this.resizeNode(this.mainContentRoot, this.designWidth, this.designHeight - 246 - safeTop - safeBottom);
    this.resizeNode(this.safeBottomRoot, this.designWidth, 150 + safeBottom);
    this.refreshWidget(this.safeTopRoot);
    this.refreshWidget(this.mainContentRoot);
    this.refreshWidget(this.safeBottomRoot);
  }

  private resizeNode(node: Node | null, width: number, height: number): void {
    if (!node) {
      return;
    }
    const transform = node.getComponent(UITransform) ?? node.addComponent(UITransform);
    transform.setContentSize(width, Math.max(0, height));
  }

  private refreshWidget(node: Node | null): void {
    node?.getComponent(Widget)?.updateAlignment();
  }
}

