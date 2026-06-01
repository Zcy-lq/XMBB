import { UIAssetKeys } from './UIAssetKeys';

export type HubNavKey = 'shop' | 'bag' | 'battle' | 'talent' | 'pet';

export interface HubNavLayout {
  key: HubNavKey;
  label: string;
  iconText: string;
  iconKey: string;
  badge?: boolean | number;
}

export interface HomeSideEntryLayout {
  label: string;
  iconText: string;
  route: 'dailyTask' | 'mail' | 'achievement';
  badge?: boolean | number;
}

export interface ShopGoodLayout {
  id: string;
  name: string;
  amount: string;
  iconText: string;
  iconKey: string;
  priceIcon: string;
  priceText: string;
  priceKind: 'free' | 'gold' | 'purpleGem' | 'blueGem' | 'ad' | 'locked';
}

export interface BackpackItemLayout {
  id: string;
  itemId: string;
  name: string;
  iconText: string;
  iconKey: string;
  level: number;
  count: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  attack: number;
  description: string;
}

export const HUB_NAV_ITEMS: HubNavLayout[] = [
  { key: 'shop', label: '商店', iconText: '铺', iconKey: UIAssetKeys.icons.shop, badge: true },
  { key: 'bag', label: '背包', iconText: '包', iconKey: UIAssetKeys.icons.backpack },
  { key: 'battle', label: '战斗', iconText: '剑', iconKey: UIAssetKeys.icons.battle, badge: true },
  { key: 'talent', label: '天赋', iconText: '书', iconKey: UIAssetKeys.icons.talent, badge: true },
  { key: 'pet', label: '宠物', iconText: '猫', iconKey: UIAssetKeys.icons.pet },
];

export const HOME_SIDE_ENTRIES: HomeSideEntryLayout[] = [
  { label: '签到', iconText: '签', route: 'dailyTask', badge: true },
  { label: '任务', iconText: '卷', route: 'dailyTask', badge: true },
  { label: '邮件', iconText: '信', route: 'mail' },
  { label: '排行', iconText: '冠', route: 'achievement', badge: true },
];

export const SHOP_TABS = ['每日商店', '钻石商店', '特惠礼包'];

export const SHOP_GOODS: ShopGoodLayout[] = [
  {
    id: 'daily_free_gold',
    name: '金币',
    amount: 'x5000',
    iconText: '金',
    iconKey: UIAssetKeys.icons.gold,
    priceIcon: '金',
    priceText: '免费',
    priceKind: 'free',
  },
  {
    id: 'daily_pet_food',
    name: '强化石',
    amount: 'x20',
    iconText: '石',
    iconKey: UIAssetKeys.items.enhanceStone,
    priceIcon: '紫',
    priceText: '50',
    priceKind: 'purpleGem',
  },
  {
    id: 'daily_pet_egg',
    name: '宠物蛋',
    amount: 'x1',
    iconText: '蛋',
    iconKey: UIAssetKeys.items.petEgg,
    priceIcon: '紫',
    priceText: '300',
    priceKind: 'purpleGem',
  },
  {
    id: 'daily_chest',
    name: '武器宝箱',
    amount: 'x1',
    iconText: '箱',
    iconKey: UIAssetKeys.items.chest,
    priceIcon: '蓝',
    priceText: '200',
    priceKind: 'blueGem',
  },
  {
    id: 'daily_blue_gem',
    name: '钻石',
    amount: 'x100',
    iconText: '钻',
    iconKey: UIAssetKeys.icons.blueGem,
    priceIcon: '蓝',
    priceText: '6',
    priceKind: 'blueGem',
  },
  {
    id: 'daily_energy',
    name: '体力',
    amount: 'x20',
    iconText: '体',
    iconKey: UIAssetKeys.items.potion,
    priceIcon: '蓝',
    priceText: '10',
    priceKind: 'blueGem',
  },
];

export const BACKPACK_TABS = ['1', '2', '3', '锁'];

export const BACKPACK_ITEMS: BackpackItemLayout[] = [
  {
    id: 'weapon_sword_demo',
    itemId: 'weapon_sword',
    name: '短剑',
    iconText: '剑',
    iconKey: UIAssetKeys.items.sword,
    level: 1,
    count: 2,
    rarity: 'common',
    attack: 18,
    description: '近战短剑，适合守住营火前线。',
  },
  {
    id: 'weapon_bow_demo',
    itemId: 'weapon_bow',
    name: '木弓',
    iconText: '弓',
    iconKey: UIAssetKeys.items.bow,
    level: 1,
    count: 1,
    rarity: 'common',
    attack: 16,
    description: '射出稳定箭矢，优先攻击靠前敌人。',
  },
  {
    id: 'weapon_staff_demo',
    itemId: 'weapon_staff',
    name: '藤木杖',
    iconText: '杖',
    iconKey: UIAssetKeys.items.staff,
    level: 1,
    count: 1,
    rarity: 'rare',
    attack: 22,
    description: '凝聚月光法术，攻击随机敌人。',
  },
  {
    id: 'weapon_spear_demo',
    itemId: 'weapon_spear',
    name: '鱼骨矛',
    iconText: '矛',
    iconKey: UIAssetKeys.items.spear,
    level: 2,
    count: 1,
    rarity: 'rare',
    attack: 32,
    description: '发射鱼骨箭，攻击直线上的敌人。',
  },
  {
    id: 'weapon_fishbone_bow_demo',
    itemId: 'weapon_fishbone_bow',
    name: '鱼骨弓',
    iconText: '骨',
    iconKey: UIAssetKeys.items.fishboneBow,
    level: 1,
    count: 1,
    rarity: 'epic',
    attack: 28,
    description: '带有猫爪护符的稀有远程武器。',
  },
  {
    id: 'item_chest_demo',
    itemId: 'item_chest',
    name: '武器宝箱',
    iconText: '箱',
    iconKey: UIAssetKeys.items.chest,
    level: 1,
    count: 1,
    rarity: 'legendary',
    attack: 0,
    description: '打开后获得随机守夜武器。',
  },
  {
    id: 'item_energy_demo',
    itemId: 'item_energy_potion',
    name: '体力药水',
    iconText: '药',
    iconKey: UIAssetKeys.items.potion,
    level: 1,
    count: 3,
    rarity: 'rare',
    attack: 0,
    description: '恢复体力，用于继续挑战夜晚森林。',
  },
  {
    id: 'item_stone_demo',
    itemId: 'item_enhance_stone',
    name: '强化石',
    iconText: '石',
    iconKey: UIAssetKeys.items.enhanceStone,
    level: 1,
    count: 20,
    rarity: 'rare',
    attack: 0,
    description: '武器和宠物成长会用到的通用材料。',
  },
];

