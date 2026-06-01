import { _decorator, Label, Node } from 'cc';
import { BaseUIComponent } from './BaseUIComponent';
import { RedDotData, RedDotType } from './UITypes';

const { ccclass, property } = _decorator;

@ccclass('RedDot')
export class RedDot extends BaseUIComponent {
  @property(Label)
  public countLabel: Label | null = null;

  @property(Node)
  public dotOnlyNode: Node | null = null;

  public apply(data: RedDotData): void {
    const visible = data.visible ?? Boolean(data.count);
    const type: RedDotType = data.type ?? (typeof data.count === 'number' ? 'number' : 'dot');
    const count = data.count ?? 0;

    this.node.active = visible;
    if (!visible) {
      return;
    }

    this.setVisible(this.dotOnlyNode, type === 'dot');
    this.setVisible(this.countLabel, type !== 'dot');

    if (type === 'exclamation') {
      this.setText(this.countLabel, '!');
      return;
    }

    if (type === 'number') {
      this.setText(this.countLabel, count > 99 ? '99+' : count);
    }
  }
}

