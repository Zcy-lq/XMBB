import { _decorator, Label, Sprite } from 'cc';
import { BaseUIComponent } from './BaseUIComponent';
import { UIColors } from './UITheme';

const { ccclass, property } = _decorator;

export type ToastKind = 'info' | 'success' | 'warning' | 'error';

@ccclass('Toast')
export class Toast extends BaseUIComponent {
  @property(Label)
  public messageLabel: Label | null = null;

  @property(Sprite)
  public background: Sprite | null = null;

  public show(message: string, kind: ToastKind = 'info', duration = 2): void {
    this.unscheduleAllCallbacks();
    this.node.active = true;
    this.setText(this.messageLabel, message);
    this.setSpriteColor(this.background, this.colorFor(kind));
    this.scheduleOnce(() => {
      this.node.active = false;
    }, duration);
  }

  private colorFor(kind: ToastKind) {
    return {
      info: UIColors.darkPanel,
      success: UIColors.successGreen,
      warning: UIColors.buttonGold,
      error: UIColors.warningRed,
    }[kind];
  }
}

