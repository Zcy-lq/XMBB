import { _decorator, Button, Label, Node, Sprite } from 'cc';
import { BaseUIComponent } from './BaseUIComponent';
import { ButtonState, ButtonVariant, UIButtonData } from './UITypes';
import { UIColors } from './UITheme';

const { ccclass, property } = _decorator;

@ccclass('UIButton')
export class UIButton extends BaseUIComponent {
  @property(Label)
  public labelText: Label | null = null;

  @property(Label)
  public labelCost: Label | null = null;

  @property(Node)
  public iconNode: Node | null = null;

  @property(Sprite)
  public background: Sprite | null = null;

  @property(Button)
  public button: Button | null = null;

  @property
  public variant: ButtonVariant = 'primary';

  private data: UIButtonData | null = null;
  private lastClickAt = 0;

  public apply(data: UIButtonData): void {
    this.data = data;
    this.variant = data.variant ?? this.variant;
    this.setText(this.labelText, data.text);
    this.setText(this.labelCost, data.cost ? `${data.cost.amount}` : '');
    this.setVisible(this.labelCost, Boolean(data.cost));
    this.setVisible(this.iconNode, Boolean(data.iconKey));
    this.applyVariant(this.variant);
    this.applyState(data.state ?? (data.disabled ? 'disabled' : 'normal'));
  }

  public handleClick(): void {
    const now = Date.now();
    if (!this.data || now - this.lastClickAt < 350) {
      return;
    }
    this.lastClickAt = now;

    const state = this.data.state ?? 'normal';
    if (this.data.disabled || state === 'disabled' || state === 'locked' || state === 'loading' || state === 'claimed') {
      return;
    }

    this.playPressFeedback();
    this.data.onClick?.();
  }

  private applyVariant(variant: ButtonVariant): void {
    const color = {
      primary: UIColors.buttonGold,
      green: UIColors.successGreen,
      blue: UIColors.actionBlue,
      brown: UIColors.wood,
      danger: UIColors.warningRed,
    }[variant];

    this.setSpriteColor(this.background, color);
  }

  private applyState(state: ButtonState): void {
    const interactable = state !== 'disabled' && state !== 'locked' && state !== 'loading' && state !== 'claimed';
    this.setButtonInteractable(this.button, interactable);
    this.setOpacity(this.node, interactable ? 255 : 150);

    if (state === 'loading') {
      this.setText(this.labelText, '处理中');
    }
    if (state === 'claimed') {
      this.setText(this.labelText, '已领取');
    }
  }
}

