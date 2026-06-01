import { _decorator, Label, Node, Sprite } from 'cc';
import { BaseUIComponent } from './BaseUIComponent';
import { PetCardData, Rarity } from './UITypes';
import { UIColors } from './UITheme';

const { ccclass, property } = _decorator;

@ccclass('PetCard')
export class PetCard extends BaseUIComponent {
  @property(Label)
  public nameLabel: Label | null = null;

  @property(Label)
  public levelLabel: Label | null = null;

  @property(Label)
  public conditionLabel: Label | null = null;

  @property(Node)
  public selectedGlow: Node | null = null;

  @property(Node)
  public lockNode: Node | null = null;

  @property(Node)
  public deployedTag: Node | null = null;

  @property([Node])
  public starNodes: Node[] = [];

  @property(Sprite)
  public rarityFrame: Sprite | null = null;

  private data: PetCardData | null = null;

  public apply(data: PetCardData): void {
    this.data = data;
    this.setText(this.nameLabel, data.locked ? '' : data.name);
    this.setText(this.levelLabel, data.locked ? '' : `Lv.${data.level}`);
    this.setText(this.conditionLabel, data.locked ? data.condition ?? '未解锁' : '');
    this.setVisible(this.selectedGlow, Boolean(data.selected));
    this.setVisible(this.lockNode, Boolean(data.locked));
    this.setVisible(this.deployedTag, Boolean(data.deployed));
    this.starNodes.forEach((star, index) => this.setVisible(star, index < data.stars && !data.locked));
    this.setSpriteColor(this.rarityFrame, this.rarityColor(data.rarity ?? 'common'));
  }

  public handleClick(): void {
    if (!this.data) {
      return;
    }
    this.playPressFeedback();
    this.data.onSelect?.(this.data);
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

