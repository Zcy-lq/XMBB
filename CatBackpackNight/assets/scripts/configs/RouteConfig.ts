import { RouteId } from '../data/GameTypes';

export interface RouteConfig {
  id: RouteId;
  sceneName: 'Login' | 'Home' | 'BattlePrepare' | 'Battle';
  title: string;
  bottomNavActive?: 'home' | 'battle' | 'merge' | 'explore' | 'guild';
  requiresAgreement?: boolean;
}

export const ROUTE_CONFIGS: Record<RouteId, RouteConfig> = {
  login: { id: 'login', sceneName: 'Login', title: '登录' },
  home: { id: 'home', sceneName: 'Home', title: '主页', bottomNavActive: 'home', requiresAgreement: true },
  battlePrepare: { id: 'battlePrepare', sceneName: 'BattlePrepare', title: '准备战斗', requiresAgreement: true },
  battle: { id: 'battle', sceneName: 'Battle', title: '战斗', requiresAgreement: true },
  merge: { id: 'merge', sceneName: 'Home', title: '合成', bottomNavActive: 'merge', requiresAgreement: true },
  mergeGuide: { id: 'mergeGuide', sceneName: 'Home', title: '合成提示', bottomNavActive: 'merge', requiresAgreement: true },
  explore: { id: 'explore', sceneName: 'Home', title: '探索', bottomNavActive: 'explore', requiresAgreement: true },
  guild: { id: 'guild', sceneName: 'Home', title: '公会', bottomNavActive: 'guild', requiresAgreement: true },
  backpack: { id: 'backpack', sceneName: 'Home', title: '背包', bottomNavActive: 'merge', requiresAgreement: true },
  shop: { id: 'shop', sceneName: 'Home', title: '商店', bottomNavActive: 'home', requiresAgreement: true },
  pet: { id: 'pet', sceneName: 'Home', title: '宠物', bottomNavActive: 'guild', requiresAgreement: true },
  petDetail: { id: 'petDetail', sceneName: 'Home', title: '宠物详情', bottomNavActive: 'guild', requiresAgreement: true },
  talent: { id: 'talent', sceneName: 'Home', title: '天赋', bottomNavActive: 'explore', requiresAgreement: true },
  dailyTask: { id: 'dailyTask', sceneName: 'Home', title: '每日任务', bottomNavActive: 'explore', requiresAgreement: true },
  achievement: { id: 'achievement', sceneName: 'Home', title: '成就', requiresAgreement: true },
  mail: { id: 'mail', sceneName: 'Home', title: '邮件', requiresAgreement: true },
  mailDetail: { id: 'mailDetail', sceneName: 'Home', title: '邮件详情', requiresAgreement: true },
  settings: { id: 'settings', sceneName: 'Home', title: '设置', requiresAgreement: true },
  policyModal: { id: 'policyModal', sceneName: 'Login', title: '用户协议与隐私政策', requiresAgreement: false },
  confirmModal: { id: 'confirmModal', sceneName: 'Home', title: '确认操作', requiresAgreement: true },
  toastModal: { id: 'toastModal', sceneName: 'Home', title: '提示弹窗', requiresAgreement: true },
  pauseModal: { id: 'pauseModal', sceneName: 'Battle', title: '暂停', requiresAgreement: true },
  skillChoice: { id: 'skillChoice', sceneName: 'Battle', title: '选择技能', requiresAgreement: true },
  victory: { id: 'victory', sceneName: 'Battle', title: '胜利', requiresAgreement: true },
  defeat: { id: 'defeat', sceneName: 'Battle', title: '失败', requiresAgreement: true },
};

export function getRouteConfig(route: RouteId): RouteConfig {
  return ROUTE_CONFIGS[route];
}
