import { _decorator, Label, Node } from 'cc';
import { BaseUIComponent } from './BaseUIComponent';
import { ResourceBarData, ResourceKey } from './UITypes';
import { formatCompactNumber } from './UITheme';

const { ccclass, property } = _decorator;

@ccclass('ResourceBar')
export class ResourceBar extends BaseUIComponent {
  @property(Node)
  public goldNode: Node | null = null;

  @property(Label)
  public goldLabel: Label | null = null;

  @property(Node)
  public purpleGemNode: Node | null = null;

  @property(Label)
  public purpleGemLabel: Label | null = null;

  @property(Node)
  public blueGemNode: Node | null = null;

  @property(Label)
  public blueGemLabel: Label | null = null;

  @property(Node)
  public energyNode: Node | null = null;

  @property(Label)
  public energyLabel: Label | null = null;

  private data: ResourceBarData | null = null;

  public apply(data: ResourceBarData): void {
    this.data = data;
    const visible = new Set<ResourceKey>(data.visibleKeys ?? ['gold', 'purpleGem', 'blueGem', 'energy']);

    this.setVisible(this.goldNode, visible.has('gold'));
    this.setVisible(this.purpleGemNode, visible.has('purpleGem'));
    this.setVisible(this.blueGemNode, visible.has('blueGem'));
    this.setVisible(this.energyNode, visible.has('energy'));

    this.setText(this.goldLabel, formatCompactNumber(data.gold ?? 0));
    this.setText(this.purpleGemLabel, formatCompactNumber(data.purpleGem ?? 0));
    this.setText(this.blueGemLabel, formatCompactNumber(data.blueGem ?? 0));
    this.setText(this.energyLabel, formatCompactNumber(data.energy ?? 0));
  }

  public handlePlusGold(): void {
    this.data?.onPlus?.('gold');
  }

  public handlePlusPurpleGem(): void {
    this.data?.onPlus?.('purpleGem');
  }

  public handlePlusBlueGem(): void {
    this.data?.onPlus?.('blueGem');
  }

  public handlePlusEnergy(): void {
    this.data?.onPlus?.('energy');
  }
}

