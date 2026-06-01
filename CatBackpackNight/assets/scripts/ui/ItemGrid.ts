import { _decorator, instantiate, Node, Prefab } from 'cc';
import { BaseUIComponent } from './BaseUIComponent';
import { ItemGridData } from './UITypes';
import { ItemCard } from './ItemCard';

const { ccclass, property } = _decorator;

@ccclass('ItemGrid')
export class ItemGrid extends BaseUIComponent {
  @property(Prefab)
  public itemCardPrefab: Prefab | null = null;

  @property(Node)
  public gridRoot: Node | null = null;

  @property([ItemCard])
  public cards: ItemCard[] = [];

  private data: ItemGridData | null = null;

  public apply(data: ItemGridData): void {
    this.data = data;
    this.ensureCardCount(data.items.length);
    this.cards.forEach((card, index) => {
      const item = data.items[index];
      this.setVisible(card, Boolean(item));
      if (!item) {
        return;
      }
      card.apply(
        {
          ...item,
          selected: item.selected ?? item.id === data.selectedId,
        },
        (selected) => this.data?.onSelect?.(selected),
      );
    });
  }

  private ensureCardCount(count: number): void {
    const root = this.gridRoot ?? this.contentRoot ?? this.node;
    while (this.cards.length < count && this.itemCardPrefab) {
      const node = instantiate(this.itemCardPrefab);
      node.parent = root;
      const card = node.getComponent(ItemCard);
      if (card) {
        this.cards.push(card);
      }
    }
  }
}

