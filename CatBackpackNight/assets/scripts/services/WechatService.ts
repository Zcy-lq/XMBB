import { sys } from 'cc';
import { SaveManager } from '../core/SaveManager';

export type WechatRuntimeKind = 'wechat' | 'mock';
export type WechatLoginState = 'success' | 'failed' | 'mock';
export type WechatUserInfoState = 'authorized' | 'denied' | 'unavailable' | 'mock';
export type WechatVibrateType = 'light' | 'medium' | 'heavy';
export type WechatToastIcon = 'success' | 'error' | 'loading' | 'none';

export interface WechatError {
  errMsg?: string;
  errCode?: number;
  errno?: number;
  message?: string;
  [key: string]: unknown;
}

export interface WechatLoginResult {
  state: WechatLoginState;
  runtime: WechatRuntimeKind;
  code?: string;
  anonymousId: string;
  message?: string;
  raw?: unknown;
}

export interface WechatUserInfo {
  nickName: string;
  avatarUrl: string;
  gender?: number;
  country?: string;
  province?: string;
  city?: string;
  language?: string;
}

export interface WechatUserInfoResult {
  state: WechatUserInfoState;
  runtime: WechatRuntimeKind;
  userInfo?: WechatUserInfo;
  message?: string;
  raw?: unknown;
}

export interface WechatStorageResult {
  ok: boolean;
  runtime: WechatRuntimeKind;
  message?: string;
}

export interface WechatServiceConfig {
  appId?: string;
  storagePrefix?: string;
  mockNickname?: string;
  mockAvatarUrl?: string;
}

export interface WechatSafeAreaInsets {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface WechatSystemInfo {
  platform?: string;
  brand?: string;
  model?: string;
  version?: string;
  SDKVersion?: string;
  screenWidth?: number;
  screenHeight?: number;
  safeArea?: {
    top: number;
    bottom: number;
    left?: number;
    right?: number;
    width?: number;
    height?: number;
  };
  [key: string]: unknown;
}

export interface WechatRewardedVideoAd {
  load?: () => Promise<void> | void;
  show?: () => Promise<void> | void;
  destroy?: () => void;
  onLoad?: (handler: () => void) => void;
  offLoad?: (handler: () => void) => void;
  onError?: (handler: (error: WechatError) => void) => void;
  offError?: (handler: (error: WechatError) => void) => void;
  onClose?: (handler: (result?: { isEnded?: boolean }) => void) => void;
  offClose?: (handler: (result?: { isEnded?: boolean }) => void) => void;
}

export interface WechatOpenDataContext {
  postMessage: (message: Record<string, unknown>) => void;
}

export interface WechatRuntime {
  login?: (options: {
    timeout?: number;
    success?: (result: { code?: string; errMsg?: string }) => void;
    fail?: (error: WechatError) => void;
    complete?: (result: unknown) => void;
  }) => void;
  getUserProfile?: (options: {
    desc: string;
    lang?: string;
    success?: (result: { userInfo?: WechatUserInfo; errMsg?: string }) => void;
    fail?: (error: WechatError) => void;
    complete?: (result: unknown) => void;
  }) => void;
  getUserInfo?: (options: {
    lang?: string;
    success?: (result: { userInfo?: WechatUserInfo; errMsg?: string }) => void;
    fail?: (error: WechatError) => void;
    complete?: (result: unknown) => void;
  }) => void;
  getSystemInfoSync?: () => WechatSystemInfo;
  getLaunchOptionsSync?: () => Record<string, unknown>;
  vibrateShort?: (options?: { type?: WechatVibrateType }) => void;
  vibrateLong?: () => void;
  showToast?: (options: { title: string; icon?: WechatToastIcon; duration?: number }) => void;
  getStorageSync?: (key: string) => unknown;
  setStorageSync?: (key: string, value: unknown) => void;
  removeStorageSync?: (key: string) => void;
  createRewardedVideoAd?: (options: { adUnitId: string; multiton?: boolean }) => WechatRewardedVideoAd;
  showShareMenu?: (options?: {
    withShareTicket?: boolean;
    menus?: string[];
    success?: () => void;
    fail?: (error: WechatError) => void;
  }) => void;
  updateShareMenu?: (options?: {
    withShareTicket?: boolean;
    isPrivateMessage?: boolean;
    activityId?: string;
    templateInfo?: Record<string, unknown>;
  }) => void;
  onShareAppMessage?: (handler: () => WechatSharePayload) => void;
  shareAppMessage?: (options: WechatSharePayload & {
    success?: () => void;
    fail?: (error: WechatError) => void;
  }) => void;
  getOpenDataContext?: () => WechatOpenDataContext;
  setUserCloudStorage?: (options: {
    KVDataList: Array<{ key: string; value: string }>;
    success?: () => void;
    fail?: (error: WechatError) => void;
  }) => void;
}

export interface WechatSharePayload {
  title: string;
  imageUrl?: string;
  query?: string;
}

declare const wx: WechatRuntime | undefined;

const DEFAULT_CONFIG: Required<Pick<WechatServiceConfig, 'storagePrefix' | 'mockNickname' | 'mockAvatarUrl'>> = {
  storagePrefix: 'CatBackpackNight.',
  mockNickname: '猫猫守夜员',
  mockAvatarUrl: '',
};

export class WechatService {
  private static singleton: WechatService | null = null;
  private config: WechatServiceConfig = { ...DEFAULT_CONFIG };

  public static get instance(): WechatService {
    if (!WechatService.singleton) {
      WechatService.singleton = new WechatService();
    }
    return WechatService.singleton;
  }

  public configure(config: WechatServiceConfig): void {
    this.config = {
      ...this.config,
      ...config,
    };
  }

  public getRuntimeKind(): WechatRuntimeKind {
    return this.isWechatRuntime() ? 'wechat' : 'mock';
  }

  public isWechatRuntime(): boolean {
    return typeof wx !== 'undefined';
  }

  public getRuntime(): WechatRuntime | null {
    return typeof wx !== 'undefined' ? wx : null;
  }

  public getAppId(): string {
    return this.config.appId ?? '';
  }

  public getLaunchOptions(): Record<string, unknown> {
    const runtime = this.getRuntime();
    if (!runtime?.getLaunchOptionsSync) {
      return {};
    }
    try {
      return runtime.getLaunchOptionsSync();
    } catch (error) {
      console.warn('[WechatService] getLaunchOptionsSync failed.', error);
      return {};
    }
  }

  public getSystemInfo(): WechatSystemInfo | null {
    const runtime = this.getRuntime();
    if (!runtime?.getSystemInfoSync) {
      return null;
    }
    try {
      return runtime.getSystemInfoSync();
    } catch (error) {
      console.warn('[WechatService] getSystemInfoSync failed.', error);
      return null;
    }
  }

  public getSafeAreaInsets(): WechatSafeAreaInsets {
    const info = this.getSystemInfo();
    if (!info?.safeArea || !info.screenHeight || !info.screenWidth) {
      return { top: 0, bottom: 0, left: 0, right: 0 };
    }
    return {
      top: Math.max(0, info.safeArea.top),
      bottom: Math.max(0, info.screenHeight - info.safeArea.bottom),
      left: Math.max(0, info.safeArea.left ?? 0),
      right: Math.max(0, info.screenWidth - (info.safeArea.right ?? info.screenWidth)),
    };
  }

  public async login(timeout = 5000): Promise<WechatLoginResult> {
    const runtime = this.getRuntime();
    if (!runtime?.login) {
      return {
        state: 'mock',
        runtime: 'mock',
        code: `mock_login_code_${Date.now()}`,
        anonymousId: this.getOrCreateAnonymousId(),
        message: '当前不是微信环境，已使用编辑器 Mock 登录。',
      };
    }

    return new Promise<WechatLoginResult>((resolve) => {
      runtime.login?.({
        timeout,
        success: (result) => {
          if (!result.code) {
            resolve({
              state: 'failed',
              runtime: 'wechat',
              anonymousId: this.getOrCreateAnonymousId(),
              message: result.errMsg || '微信登录未返回 code。',
              raw: result,
            });
            return;
          }
          resolve({
            state: 'success',
            runtime: 'wechat',
            code: result.code,
            anonymousId: this.getOrCreateAnonymousId(),
            raw: result,
          });
        },
        fail: (error) => {
          resolve({
            state: 'failed',
            runtime: 'wechat',
            anonymousId: this.getOrCreateAnonymousId(),
            message: this.errorMessage(error, '微信登录失败。'),
            raw: error,
          });
        },
      });
    });
  }

  public async getUserProfile(desc = '用于展示头像和昵称'): Promise<WechatUserInfoResult> {
    const runtime = this.getRuntime();
    if (!runtime?.getUserProfile && !runtime?.getUserInfo) {
      return {
        state: 'mock',
        runtime: 'mock',
        userInfo: this.getMockUserInfo(),
        message: '当前不是微信环境，已使用编辑器 Mock 用户信息。',
      };
    }

    return new Promise<WechatUserInfoResult>((resolve) => {
      const success = (result: { userInfo?: WechatUserInfo; errMsg?: string }): void => {
        if (!result.userInfo) {
          resolve({
            state: 'unavailable',
            runtime: 'wechat',
            message: result.errMsg || '未获取到用户信息。',
            raw: result,
          });
          return;
        }
        resolve({
          state: 'authorized',
          runtime: 'wechat',
          userInfo: this.normalizeUserInfo(result.userInfo),
          raw: result,
        });
      };
      const fail = (error: WechatError): void => {
        resolve({
          state: 'denied',
          runtime: 'wechat',
          message: this.errorMessage(error, '用户取消或拒绝授权。'),
          raw: error,
        });
      };

      if (runtime.getUserProfile) {
        runtime.getUserProfile({ desc, lang: 'zh_CN', success, fail });
        return;
      }
      runtime.getUserInfo?.({ lang: 'zh_CN', success, fail });
    });
  }

  public vibrateShort(type: WechatVibrateType = 'light', respectSettings = true): WechatStorageResult {
    if (respectSettings && !this.isVibrationEnabled()) {
      return { ok: false, runtime: this.getRuntimeKind(), message: '玩家已关闭震动。' };
    }
    const runtime = this.getRuntime();
    if (runtime?.vibrateShort) {
      runtime.vibrateShort({ type });
      return { ok: true, runtime: 'wechat' };
    }
    console.log(`[WechatService] Mock vibrateShort: ${type}`);
    return { ok: true, runtime: 'mock', message: '编辑器 Mock 震动。' };
  }

  public vibrateLong(respectSettings = true): WechatStorageResult {
    if (respectSettings && !this.isVibrationEnabled()) {
      return { ok: false, runtime: this.getRuntimeKind(), message: '玩家已关闭震动。' };
    }
    const runtime = this.getRuntime();
    if (runtime?.vibrateLong) {
      runtime.vibrateLong();
      return { ok: true, runtime: 'wechat' };
    }
    console.log('[WechatService] Mock vibrateLong');
    return { ok: true, runtime: 'mock', message: '编辑器 Mock 长震动。' };
  }

  public showToast(title: string, icon: WechatToastIcon = 'none', duration = 1600): void {
    const runtime = this.getRuntime();
    if (runtime?.showToast) {
      runtime.showToast({ title, icon, duration });
      return;
    }
    console.log(`[Toast] ${title}`);
  }

  public setStorage<T>(key: string, value: T): WechatStorageResult {
    const normalizedKey = this.normalizeStorageKey(key);
    const runtime = this.getRuntime();
    try {
      if (runtime?.setStorageSync) {
        runtime.setStorageSync(normalizedKey, value);
        return { ok: true, runtime: 'wechat' };
      }
      sys.localStorage.setItem(normalizedKey, JSON.stringify(value));
      return { ok: true, runtime: 'mock' };
    } catch (error) {
      return { ok: false, runtime: this.getRuntimeKind(), message: this.errorMessage(error, '本地存储写入失败。') };
    }
  }

  public getStorage<T>(key: string, fallback: T): T {
    const normalizedKey = this.normalizeStorageKey(key);
    const runtime = this.getRuntime();
    try {
      if (runtime?.getStorageSync) {
        const value = runtime.getStorageSync(normalizedKey);
        return value === '' || value === undefined || value === null ? fallback : (value as T);
      }
      const raw = sys.localStorage.getItem(normalizedKey);
      if (raw === null || raw === undefined || raw === '') {
        return fallback;
      }
      try {
        return JSON.parse(raw) as T;
      } catch {
        return raw as T;
      }
    } catch (error) {
      console.warn('[WechatService] getStorage failed.', error);
      return fallback;
    }
  }

  public removeStorage(key: string): WechatStorageResult {
    const normalizedKey = this.normalizeStorageKey(key);
    const runtime = this.getRuntime();
    try {
      if (runtime?.removeStorageSync) {
        runtime.removeStorageSync(normalizedKey);
        return { ok: true, runtime: 'wechat' };
      }
      sys.localStorage.removeItem(normalizedKey);
      return { ok: true, runtime: 'mock' };
    } catch (error) {
      return { ok: false, runtime: this.getRuntimeKind(), message: this.errorMessage(error, '本地存储删除失败。') };
    }
  }

  public getOrCreateAnonymousId(): string {
    const key = 'anonymousId';
    const existing = this.getStorage<string>(key, '');
    if (existing) {
      return existing;
    }
    const next = `local_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
    this.setStorage(key, next);
    return next;
  }

  public normalizeStorageKey(key: string): string {
    const prefix = this.config.storagePrefix ?? DEFAULT_CONFIG.storagePrefix;
    return key.startsWith(prefix) ? key : `${prefix}${key}`;
  }

  public errorMessage(error: unknown, fallback: string): string {
    if (!error || typeof error !== 'object') {
      return fallback;
    }
    const typed = error as WechatError;
    return typed.errMsg || typed.message || fallback;
  }

  private getMockUserInfo(): WechatUserInfo {
    return {
      nickName: this.config.mockNickname ?? DEFAULT_CONFIG.mockNickname,
      avatarUrl: this.config.mockAvatarUrl ?? DEFAULT_CONFIG.mockAvatarUrl,
      gender: 0,
      language: 'zh_CN',
    };
  }

  private normalizeUserInfo(userInfo: WechatUserInfo): WechatUserInfo {
    return {
      nickName: userInfo.nickName || DEFAULT_CONFIG.mockNickname,
      avatarUrl: userInfo.avatarUrl || '',
      gender: userInfo.gender,
      country: userInfo.country,
      province: userInfo.province,
      city: userInfo.city,
      language: userInfo.language,
    };
  }

  private isVibrationEnabled(): boolean {
    try {
      return SaveManager.instance.getSnapshot().settings.vibrationEnabled;
    } catch {
      return true;
    }
  }
}

export const wechatService = WechatService.instance;
