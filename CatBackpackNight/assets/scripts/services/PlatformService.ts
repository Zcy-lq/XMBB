declare const wx:
  | {
      getSystemInfoSync?: () => { safeArea?: { top: number; bottom: number }; screenHeight?: number };
      vibrateShort?: (options?: { type?: 'light' | 'medium' | 'heavy' }) => void;
      showToast?: (options: { title: string; icon?: 'success' | 'error' | 'loading' | 'none'; duration?: number }) => void;
    }
  | undefined;

export class PlatformService {
  private static singleton: PlatformService | null = null;

  public static get instance(): PlatformService {
    if (!PlatformService.singleton) {
      PlatformService.singleton = new PlatformService();
    }
    return PlatformService.singleton;
  }

  public isWechatRuntime(): boolean {
    return typeof wx !== 'undefined';
  }

  public getSafeAreaInsets(): { top: number; bottom: number } {
    if (typeof wx === 'undefined' || !wx.getSystemInfoSync) {
      return { top: 0, bottom: 0 };
    }
    const info = wx.getSystemInfoSync();
    if (!info.safeArea || !info.screenHeight) {
      return { top: 0, bottom: 0 };
    }
    return {
      top: info.safeArea.top,
      bottom: Math.max(0, info.screenHeight - info.safeArea.bottom),
    };
  }

  public vibrateShort(type: 'light' | 'medium' | 'heavy' = 'light'): void {
    if (typeof wx !== 'undefined' && wx.vibrateShort) {
      wx.vibrateShort({ type });
    }
  }

  public showToast(title: string, icon: 'success' | 'error' | 'loading' | 'none' = 'none'): void {
    if (typeof wx !== 'undefined' && wx.showToast) {
      wx.showToast({ title, icon, duration: 1600 });
      return;
    }
    console.log(`[Toast] ${title}`);
  }
}

export const platformService = PlatformService.instance;
