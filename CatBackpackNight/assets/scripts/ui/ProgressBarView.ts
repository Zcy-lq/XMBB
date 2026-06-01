import { _decorator, Label, ProgressBar as CocosProgressBar, Sprite } from 'cc';
import { BaseUIComponent } from './BaseUIComponent';
import { ProgressBarData } from './UITypes';
import { clamp01, UIColors } from './UITheme';

const { ccclass, property } = _decorator;

@ccclass('ProgressBarView')
export class ProgressBarView extends BaseUIComponent {
  @property(CocosProgressBar)
  public progressBar: CocosProgressBar | null = null;

  @property(Sprite)
  public fillSprite: Sprite | null = null;

  @property(Label)
  public label: Label | null = null;

  public apply(data: ProgressBarData): void {
    const max = Math.max(1, data.max);
    const progress = clamp01(data.value / max);
    if (this.progressBar) {
      this.progressBar.progress = progress;
    }
    this.setText(this.label, data.label ?? `${Math.floor(data.value)}/${Math.floor(max)}`);
    this.setSpriteColor(this.fillSprite, this.colorFor(data.color ?? 'gold'));
  }

  private colorFor(key: NonNullable<ProgressBarData['color']>) {
    return {
      gold: UIColors.buttonGold,
      green: UIColors.successGreen,
      red: UIColors.warningRed,
      blue: UIColors.actionBlue,
    }[key];
  }
}

