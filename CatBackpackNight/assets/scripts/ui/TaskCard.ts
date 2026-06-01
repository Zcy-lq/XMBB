import { _decorator, instantiate, Label, Node, Prefab } from 'cc';
import { BaseUIComponent } from './BaseUIComponent';
import { TaskButtonState, TaskCardData } from './UITypes';
import { UIButton } from './UIButton';
import { ProgressBarView } from './ProgressBarView';
import { RewardCard } from './RewardCard';

const { ccclass, property } = _decorator;

@ccclass('TaskCard')
export class TaskCard extends BaseUIComponent {
  @property(Label)
  public titleLabel: Label | null = null;

  @property(Label)
  public subtitleLabel: Label | null = null;

  @property(ProgressBarView)
  public progressBar: ProgressBarView | null = null;

  @property(UIButton)
  public actionButton: UIButton | null = null;

  @property(Node)
  public rewardRoot: Node | null = null;

  @property(Prefab)
  public rewardCardPrefab: Prefab | null = null;

  @property([RewardCard])
  public rewardCards: RewardCard[] = [];

  private data: TaskCardData | null = null;

  public apply(data: TaskCardData): void {
    this.data = data;
    this.setText(this.titleLabel, data.title);
    this.setText(this.subtitleLabel, data.subtitle ?? '');
    this.setVisible(this.subtitleLabel, Boolean(data.subtitle));
    this.progressBar?.apply(data.progress);
    this.ensureRewardCount(data.rewards.length);
    this.rewardCards.forEach((card, index) => {
      const reward = data.rewards[index];
      this.setVisible(card, Boolean(reward));
      if (reward) {
        card.apply(reward);
      }
    });
    this.actionButton?.apply(this.buttonData(data.buttonState));
  }

  private buttonData(state: TaskButtonState) {
    const text = {
      go: '前往',
      claim: '领取',
      claimed: '已领取',
      locked: '未完成',
    }[state];
    return {
      text,
      variant: state === 'claim' ? 'green' : 'blue',
      state: state === 'claimed' ? 'claimed' : state === 'locked' ? 'disabled' : 'normal',
      onClick: () => {
        if (this.data) {
          this.data.onAction?.(this.data);
        }
      },
    } as const;
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

