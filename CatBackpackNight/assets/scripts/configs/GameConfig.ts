import { CurrencyKey } from '../data/GameTypes';

export const GAME_TITLE = '猫猫背包守夜';
export const SAVE_KEY = 'CatBackpackNight.save.v1';
export const DESIGN_WIDTH = 750;
export const DESIGN_HEIGHT = 1334;
export const BATTLE_ENERGY_COST = 5;
export const DEFAULT_BATTLE_SECONDS = 45;

export const RESOURCE_KEYS: CurrencyKey[] = ['gold', 'purpleGem', 'blueGem', 'energy', 'pawCoin'];

export const BOTTOM_NAV_ITEMS = [
  { key: 'shop', label: '商店', iconKey: 'icon_shop' },
  { key: 'bag', label: '背包', iconKey: 'icon_bag' },
  { key: 'battle', label: '战斗', iconKey: 'icon_battle' },
  { key: 'talent', label: '天赋', iconKey: 'icon_talent' },
  { key: 'pet', label: '宠物', iconKey: 'icon_pet' },
] as const;
