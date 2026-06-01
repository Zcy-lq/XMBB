import { _decorator, instantiate, Label, Node, Prefab } from 'cc';
import { BaseUIComponent } from './BaseUIComponent';
import { ModalViewData } from './UITypes';
import { UIButton } from './UIButton';

const { ccclass, property } = _decorator;

@ccclass('ModalView')
export class ModalView extends BaseUIComponent {
  @property(Label)
  public titleLabel: Label | null = null;

  @property(Label)
  public messageLabel: Label | null = null;

  @property(Node)
  public maskNode: Node | null = null;

  @property(Node)
  public buttonRoot: Node | null = null;

  @property(Prefab)
  public buttonPrefab: Prefab | null = null;

  @property([UIButton])
  public buttons: UIButton[] = [];

  protected data: ModalViewData | null = null;

  public apply(data: ModalViewData): void {
    this.data = data;
    this.setText(this.titleLabel, data.title);
    this.setText(this.messageLabel, data.message ?? '');
    this.setVisible(this.messageLabel, Boolean(data.message));
    this.ensureButtonCount(data.buttons?.length ?? 0);
    this.buttons.forEach((button, index) => {
      const buttonData = data.buttons?.[index];
      this.setVisible(button, Boolean(buttonData));
      if (buttonData) {
        button.apply(buttonData);
      }
    });
  }

  public open(): void {
    this.node.active = true;
    this.setOpacity(this.node, 255);
  }

  public close(): void {
    this.node.active = false;
  }

  public handleMaskClick(): void {
    if (this.data?.closeOnMask) {
      this.close();
    }
  }

  private ensureButtonCount(count: number): void {
    const root = this.buttonRoot ?? this.node;
    while (this.buttons.length < count && this.buttonPrefab) {
      const node = instantiate(this.buttonPrefab);
      node.parent = root;
      const button = node.getComponent(UIButton);
      if (button) {
        this.buttons.push(button);
      }
    }
  }
}

