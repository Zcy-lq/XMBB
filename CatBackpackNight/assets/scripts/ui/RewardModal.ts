import { _decorator, instantiate, Node, Prefab } from 'cc';
import { ModalView } from './ModalView';
import { RewardModalData } from './UITypes';
import { RewardCard } from './RewardCard';
import { UIButton } from './UIButton';

const { ccclass, property } = _decorator;

@ccclass('RewardModal')
export class RewardModal extends ModalView {
  @property(Node)
  public rewardRoot: Node | null = null;

  @property(Prefab)
  public rewardCardPrefab: Prefab | null = null;

  @property([RewardCard])
  public rewardCards: RewardCard[] = [];

  @property(UIButton)
  public doubleClaimButton: UIButton | null = null;

  @property(UIButton)
  public confirmButton: UIButton | null = null;

  public applyReward(data: RewardModalData): void {
    super.apply(data);
    this.ensureRewardCount(data.rewards.length);
    this.rewardCards.forEach((card, index) => {
      const reward = data.rewards[index];
      this.setVisible(card, Boolean(reward));
      if (reward) {
        card.apply(reward);
      }
    });
    if (data.doubleClaimButton) {
      this.doubleClaimButton?.apply(data.doubleClaimButton);
    }
    if (data.confirmButton) {
      this.confirmButton?.apply(data.confirmButton);
    }
  }

  private ensureRewardCount(count: number): void {
    const root = this.rewardRoot ?? this.node;
    while (this.rewardCards.length < count && this.rewardCardPrefab) {
      const node = instantiate(this.rewardCardPrefab);
      node.parent = root;
      const card = node.getComponent(RewardCard);
      if (card) {
        this.rewardCards.push(card);
      }
    }
  }
}

