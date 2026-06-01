import { _decorator } from 'cc';
import { BaseUIComponent } from './BaseUIComponent';
import { BottomNavData, BottomNavItem } from './UITypes';
import { UIButton } from './UIButton';
import { RedDot } from './RedDot';

const { ccclass, property } = _decorator;

@ccclass('BottomNav')
export class BottomNav extends BaseUIComponent {
  @property([UIButton])
  public navButtons: UIButton[] = [];

  @property([RedDot])
  public redDots: RedDot[] = [];

  private data: BottomNavData | null = null;

  public apply(data: BottomNavData): void {
    this.data = data;
    this.navButtons.forEach((button, index) => {
      const item = data.items[index];
      this.setVisible(button, Boolean(item));
      if (!item) {
        return;
      }
      button.apply({
        text: item.label,
        iconKey: item.iconKey,
        variant: item.key === data.activeKey ? 'primary' : 'brown',
        onClick: () => this.select(item),
      });
      this.redDots[index]?.apply({ visible: Boolean(item.badge), count: typeof item.badge === 'number' ? item.badge : 0, type: item.badge === true ? 'exclamation' : 'number' });
    });
  }

  private select(item: BottomNavItem): void {
    if (item.key === this.data?.activeKey) {
      return;
    }
    this.data?.onSelect?.(item.key);
  }
}

