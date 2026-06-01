import { _decorator, Button, Color, Component, Label, Node, Sprite, tween, UIOpacity, Vec3 } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('BaseUIComponent')
export class BaseUIComponent extends Component {
  @property(Node)
  public contentRoot: Node | null = null;

  protected setText(label: Label | null | undefined, value: string | number | null | undefined): void {
    if (!label) {
      return;
    }
    label.string = value === null || value === undefined ? '' : `${value}`;
  }

  protected setVisible(target: Node | Component | null | undefined, visible: boolean): void {
    if (!target) {
      return;
    }
    const node = target instanceof Node ? target : target.node;
    node.active = visible;
  }

  protected setButtonInteractable(button: Button | null | undefined, interactable: boolean): void {
    if (!button) {
      return;
    }
    button.interactable = interactable;
  }

  protected setOpacity(node: Node | null | undefined, opacity: number): void {
    if (!node) {
      return;
    }
    const uiOpacity = node.getComponent(UIOpacity) ?? node.addComponent(UIOpacity);
    uiOpacity.opacity = Math.max(0, Math.min(255, opacity));
  }

  protected setSpriteColor(sprite: Sprite | null | undefined, color: Color): void {
    if (!sprite) {
      return;
    }
    sprite.color = color;
  }

  protected playPressFeedback(target: Node | null | undefined = this.node): void {
    if (!target) {
      return;
    }
    tween(target)
      .to(0.06, { scale: new Vec3(0.96, 0.96, 1) })
      .to(0.08, { scale: new Vec3(1, 1, 1) })
      .start();
  }
}

