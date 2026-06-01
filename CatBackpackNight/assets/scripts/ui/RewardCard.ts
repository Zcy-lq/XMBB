import { _decorator, Label, Node, Sprite } from 'cc';
import { BaseUIComponent } from './BaseUIComponent';
import { Rarity, RewardData } from './UITypes';
import { UIColors } from './UITheme';

const { ccclass, property } = _decorator;

@ccclass('RewardCard')
export class RewardCard extends BaseUIComponent {
  @property(Label)
  public amountLabel: Label | null = null;

  @property(Node)
  public lockNode: Node | null = null;

  @property(Sprite)
  public frameSprite: Sprite | null = null;

  public apply(data: RewardData): void {
    this.setText(this.amountLabel, data.amount > 1 ? `x${data.amount}` : data.amount);
    this.setVisible(this.lockNode, Boolean(data.locked));
    this.setOpacity(this.node, data.locked ? 145 : 255);
    this.setSpriteColor(this.frameSprite, this.rarityColor(data.rarity ?? 'common'));
  }

  private rarityColor(rarity: Rarity) {
    return {
      common: UIColors.wood,
      rare: UIColors.actionBlue,
      epic: UIColors.purpleGem,
      legendary: UIColors.highlightGold,
    }[rarity];
  }
}

