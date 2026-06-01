import { _decorator, Label, Node } from 'cc';
import { BaseUIComponent } from './BaseUIComponent';
import { ToggleRowData } from './UITypes';

const { ccclass, property } = _decorator;

@ccclass('ToggleRow')
export class ToggleRow extends BaseUIComponent {
  @property(Label)
  public label: Label | null = null;

  @property(Label)
  public stateLabel: Label | null = null;

  @property(Node)
  public knobOnNode: Node | null = null;

  @property(Node)
  public knobOffNode: Node | null = null;

  private data: ToggleRowData | null = null;

  public apply(data: ToggleRowData): void {
    this.data = data;
    this.setText(this.label, data.label);
    this.setEnabled(data.enabled);
  }

  public handleClick(): void {
    if (!this.data) {
      return;
    }
    this.data.enabled = !this.data.enabled;
    this.setEnabled(this.data.enabled);
    this.playPressFeedback();
    this.data.onToggle?.(this.data.enabled);
  }

  private setEnabled(enabled: boolean): void {
    this.setText(this.stateLabel, enabled ? 'ON' : 'OFF');
    this.setVisible(this.knobOnNode, enabled);
    this.setVisible(this.knobOffNode, !enabled);
  }
}

