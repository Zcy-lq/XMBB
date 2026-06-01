import { _decorator } from 'cc';
import { BaseUIComponent } from './BaseUIComponent';
import { TabBarData, UITabData } from './UITypes';
import { UIButton } from './UIButton';
import { RedDot } from './RedDot';

const { ccclass, property } = _decorator;

@ccclass('TabBar')
export class TabBar extends BaseUIComponent {
  @property([UIButton])
  public tabButtons: UIButton[] = [];

  @property([RedDot])
  public redDots: RedDot[] = [];

  private data: TabBarData | null = null;

  public apply(data: TabBarData): void {
    this.data = data;
    this.tabButtons.forEach((button, index) => {
      const tab = data.tabs[index];
      this.setVisible(button, Boolean(tab));
      if (!tab) {
        return;
      }
      button.apply({
        text: tab.label,
        variant: tab.key === data.activeKey ? 'primary' : 'brown',
        state: tab.locked ? 'locked' : 'normal',
        onClick: () => this.select(tab),
      });
      this.redDots[index]?.apply({ visible: Boolean(tab.badge), count: typeof tab.badge === 'number' ? tab.badge : 0, type: tab.badge === true ? 'exclamation' : 'number' });
    });
  }

  private select(tab: UITabData): void {
    if (tab.locked) {
      return;
    }
    this.data?.onSelect?.(tab.key);
  }
}

