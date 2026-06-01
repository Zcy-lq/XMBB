export type ResourceKey = 'gold' | 'purpleGem' | 'blueGem' | 'energy' | 'pawCoin';
export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';
export type RedDotType = 'dot' | 'number' | 'exclamation';
export type ButtonVariant = 'primary' | 'green' | 'blue' | 'brown' | 'danger';
export type ButtonState =
  | 'normal'
  | 'pressed'
  | 'disabled'
  | 'loading'
  | 'claimed'
  | 'locked'
  | 'insufficient';

export type HeaderButtonKind = 'none' | 'back' | 'close' | 'help' | 'settings';
export type UIActionHandler<T = unknown> = (payload?: T) => void;

export interface UICost {
  iconKey: ResourceKey | string;
  amount: number;
}

export interface UIButtonData {
  text: string;
  iconKey?: string;
  cost?: UICost | null;
  disabled?: boolean;
  state?: ButtonState;
  variant?: ButtonVariant;
  onClick?: UIActionHandler;
}

export interface WoodHeaderData {
  title: string;
  leftButton?: HeaderButtonKind;
  rightButton?: HeaderButtonKind;
  showPawDecor?: boolean;
  onLeft?: UIActionHandler<HeaderButtonKind>;
  onRight?: UIActionHandler<HeaderButtonKind>;
}

export interface ResourceBarData {
  gold?: number;
  purpleGem?: number;
  blueGem?: number;
  energy?: number;
  pawCoin?: number;
  visibleKeys?: ResourceKey[];
  plusEnabled?: boolean;
  onPlus?: UIActionHandler<ResourceKey>;
}

export interface RedDotData {
  type?: RedDotType;
  count?: number;
  visible?: boolean;
}

export interface UITabData {
  key: string;
  label: string;
  locked?: boolean;
  badge?: number | boolean;
}

export interface BottomNavItem {
  key: string;
  label: string;
  iconKey?: string;
  badge?: number | boolean;
}

export interface TabBarData {
  tabs: UITabData[];
  activeKey: string;
  onSelect?: UIActionHandler<string>;
}

export interface BottomNavData {
  items: BottomNavItem[];
  activeKey: string;
  onSelect?: UIActionHandler<string>;
}

export interface ProgressBarData {
  value: number;
  max: number;
  color?: 'gold' | 'green' | 'red' | 'blue';
  label?: string;
}

export interface ItemCardData {
  id: string;
  iconKey: string;
  name: string;
  level?: number;
  count?: number;
  rarity?: Rarity;
  selected?: boolean;
  locked?: boolean;
  mergeCandidate?: boolean;
}

export interface ItemGridData {
  columns: number;
  items: ItemCardData[];
  selectedId?: string;
  pageIndex?: number;
  lockedPages?: number[];
  onSelect?: UIActionHandler<ItemCardData>;
}

export interface PetCardData {
  id: string;
  portraitKey: string;
  name: string;
  level: number;
  stars: number;
  rarity?: Rarity;
  locked?: boolean;
  condition?: string;
  deployed?: boolean;
  selected?: boolean;
  onSelect?: UIActionHandler<PetCardData>;
}

export interface RewardData {
  iconKey: string;
  amount: number;
  locked?: boolean;
  rarity?: Rarity;
}

export type TaskButtonState = 'go' | 'claim' | 'claimed' | 'locked';

export interface TaskCardData {
  id: string;
  title: string;
  subtitle?: string;
  progress: ProgressBarData;
  rewards: RewardData[];
  buttonState: TaskButtonState;
  onAction?: UIActionHandler<TaskCardData>;
}

export interface ToggleRowData {
  iconKey?: string;
  label: string;
  enabled: boolean;
  storageKey?: string;
  onToggle?: UIActionHandler<boolean>;
}

export interface ModalButtonData extends UIButtonData {
  role?: 'confirm' | 'cancel' | 'danger';
}

export interface ModalViewData {
  title: string;
  message?: string;
  buttons?: ModalButtonData[];
  closeOnMask?: boolean;
}

export interface RewardModalData extends ModalViewData {
  rewards: RewardData[];
  doubleClaimButton?: UIButtonData;
  confirmButton?: UIButtonData;
}

