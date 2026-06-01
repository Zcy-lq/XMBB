export const GameEvents = {
  RouteBeforeChange: 'route:before-change',
  RouteChanged: 'route:changed',
  RouteFailed: 'route:failed',

  SaveLoaded: 'save:loaded',
  SaveChanged: 'save:changed',
  DailyRefresh: 'time:daily-refresh',
  Tick: 'time:tick',

  RedDotChanged: 'reddot:changed',
  Toast: 'ui:toast',
  ModalOpen: 'ui:modal-open',

  LoginStart: 'login_start',
  LoginEnterHome: 'login_enter_home',
  BattlePrepareOpen: 'battle_prepare_open',
  BattleStart: 'battle_start',
  BattleWin: 'battle_win',
  BattleFail: 'battle_fail',
  RewardClaim: 'reward_claim',
  RewardDoubleAdStart: 'reward_double_ad_start',
  RewardDoubleAdResult: 'reward_double_ad_result',
  WeaponMerge: 'weapon_merge',
  ChestOpen: 'chest_open',
  ShopBuy: 'shop_buy',
  ShopRefresh: 'shop_refresh',
  PetUpgrade: 'pet_upgrade',
  PetDeploy: 'pet_deploy',
  TalentUpgrade: 'talent_upgrade',
  TalentReset: 'talent_reset',
  TaskClaim: 'task_claim',
  AchievementClaim: 'achievement_claim',
  MailClaim: 'mail_claim',
  SettingChange: 'setting_change',
} as const;

export type GameEventName = (typeof GameEvents)[keyof typeof GameEvents];

