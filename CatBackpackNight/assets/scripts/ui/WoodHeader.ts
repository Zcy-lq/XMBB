import { _decorator, Label, Node } from 'cc';
import { BaseUIComponent } from './BaseUIComponent';
import { HeaderButtonKind, WoodHeaderData } from './UITypes';

const { ccclass, property } = _decorator;

@ccclass('WoodHeader')
export class WoodHeader extends BaseUIComponent {
  @property(Label)
  public titleLabel: Label | null = null;

  @property(Node)
  public leftButtonNode: Node | null = null;

  @property(Node)
  public rightButtonNode: Node | null = null;

  @property(Node)
  public pawDecorLeft: Node | null = null;

  @property(Node)
  public pawDecorRight: Node | null = null;

  private data: WoodHeaderData | null = null;
  private leftKind: HeaderButtonKind = 'none';
  private rightKind: HeaderButtonKind = 'none';

  public apply(data: WoodHeaderData): void {
    this.data = data;
    this.leftKind = data.leftButton ?? 'back';
    this.rightKind = data.rightButton ?? 'help';
    this.setText(this.titleLabel, data.title);
    this.setVisible(this.leftButtonNode, this.leftKind !== 'none');
    this.setVisible(this.rightButtonNode, this.rightKind !== 'none');
    this.setVisible(this.pawDecorLeft, data.showPawDecor !== false);
    this.setVisible(this.pawDecorRight, data.showPawDecor !== false);
  }

  public handleLeftClick(): void {
    this.playPressFeedback(this.leftButtonNode);
    this.data?.onLeft?.(this.leftKind);
  }

  public handleRightClick(): void {
    this.playPressFeedback(this.rightButtonNode);
    this.data?.onRight?.(this.rightKind);
  }
}

