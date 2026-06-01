import { _decorator, Label, Node, Sprite } from 'cc';
import { BaseUIComponent } from './BaseUIComponent';
import { ItemCardData, Rarity } from './UITypes';
import { UIColors } from './UITheme';

const { ccclass, property } = _decorator;

@ccclass('ItemCard')
export class ItemCard extends BaseUIComponent {
  @property(Label)
  public levelLabel: Label | null = null;

  @property(Label)
  public countLabel: Label | null = null;

  @property(Node)
  public selectedGlow: Node | null = null;

  @property(Node)
  public lockNode: Node | null = null;

  @property(Node)
  public mergeGlow: Node | null = null;

  @property(Sprite)
  public rarityFrame: Sprite | null = null;

  private data: ItemCardData | null = null;
  private onSelect: ((data: ItemCardData) => void) | null = null;

  public apply(data: ItemCardData, onSelect?: (data: ItemCardData) => void): void {
    this.data = data;
    this.onSelect = onSelect ?? null;
    this.setText(this.levelLabel, data.level ? `Lv.${data.level}` : '');
    this.setText(this.countLabel, data.count && data.count > 1 ? data.count : '');
    this.setVisible(this.selectedGlow, Boolean(data.selected));
    this.setVisible(this.lockNode, Boolean(data.locked));
    this.setVisible(this.mergeGlow, Boolean(data.mergeCandidate));
    this.setSpriteColor(this.rarityFrame, this.rarityColor(data.rarity ?? 'common'));
  }

  public handleClick(): void {
    if (!this.data || this.data.locked) {
      return;
    }
    this.playPressFeedback();
    this.onSelect?.(this.data);
  }

  private rarityColor(rarity: Rarity) {
    return {
      common: UIColors.parchment,
      rare: UIColors.actionBlue,
      epic: UIColors.purpleGem,
      legendary: UIColors.highlightGold,
    }[rarity];
  }
}

