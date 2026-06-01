import { GAME_TITLE } from '../configs/GameConfig';
import { eventBus } from '../core/EventBus';
import { GameEvents } from '../game/GameEvents';
import { WechatError, WechatSharePayload, wechatService } from './WechatService';

export type ShareResultState = 'shared' | 'failed' | 'mock';

export interface ShareConfig {
  defaultTitle?: string;
  defaultImageUrl?: string;
  defaultQuery?: string;
}

export interface ShareOptions {
  title?: string;
  imageUrl?: string;
  query?: string;
  channel?: string;
  extra?: Record<string, unknown>;
}

export interface ShareResult {
  state: ShareResultState;
  payload: WechatSharePayload;
  channel: string;
  message?: string;
  rawError?: unknown;
}

export class ShareService {
  private static singleton: ShareService | null = null;
  private config: ShareConfig = {
    defaultTitle: `${GAME_TITLE}：来营地一起守夜`,
    defaultImageUrl: '',
    defaultQuery: 'from=share',
  };

  public static get instance(): ShareService {
    if (!ShareService.singleton) {
      ShareService.singleton = new ShareService();
    }
    return ShareService.singleton;
  }

  public configure(config: ShareConfig): void {
    this.config = {
      ...this.config,
      ...config,
    };
  }

  public registerDefaultShare(): void {
    const runtime = wechatService.getRuntime();
    if (!runtime?.onShareAppMessage) {
      return;
    }
    runtime.onShareAppMessage(() => this.buildPayload({ channel: 'menu' }));
    this.showShareMenu();
  }

  public showShareMenu(): ShareResult {
    const payload = this.buildPayload({ channel: 'menu' });
    const runtime = wechatService.getRuntime();
    if (!runtime?.showShareMenu) {
      return {
        state: 'mock',
        payload,
        channel: 'menu',
        message: '当前不是微信环境，已跳过分享菜单注册。',
      };
    }
    runtime.showShareMenu({ withShareTicket: true, menus: ['shareAppMessage', 'shareTimeline'] });
    runtime.updateShareMenu?.({ withShareTicket: true });
    return { state: 'shared', payload, channel: 'menu', message: '分享菜单已注册。' };
  }

  public async shareAppMessage(options: ShareOptions = {}): Promise<ShareResult> {
    const channel = options.channel ?? 'button';
    const payload = this.buildPayload(options);
    const runtime = wechatService.getRuntime();

    if (!runtime?.shareAppMessage) {
      const result: ShareResult = {
        state: 'mock',
        payload,
        channel,
        message: '当前不是微信环境，已使用编辑器 Mock 分享。',
      };
      this.emitShareResult(result);
      return result;
    }

    return new Promise<ShareResult>((resolve) => {
      let settled = false;
      const finish = (result: ShareResult): void => {
        if (settled) {
          return;
        }
        settled = true;
        this.emitShareResult(result);
        resolve(result);
      };

      runtime.shareAppMessage?.({
        ...payload,
        success: () => finish({ state: 'shared', payload, channel, message: '分享面板已拉起。' }),
        fail: (error: WechatError) =>
          finish({
            state: 'failed',
            payload,
            channel,
            message: wechatService.errorMessage(error, '分享失败。'),
            rawError: error,
          }),
      });

      setTimeout(() => {
        finish({ state: 'shared', payload, channel, message: '分享面板已拉起。' });
      }, 800);
    });
  }

  public buildPayload(options: ShareOptions = {}): WechatSharePayload {
    const title = options.title ?? this.config.defaultTitle ?? GAME_TITLE;
    const imageUrl = options.imageUrl ?? this.config.defaultImageUrl;
    const query = this.mergeQuery(this.config.defaultQuery, options.query, options.channel);
    return {
      title,
      imageUrl,
      query,
    };
  }

  private mergeQuery(defaultQuery?: string, optionQuery?: string, channel?: string): string {
    const parts = [defaultQuery, optionQuery, channel ? `channel=${encodeURIComponent(channel)}` : ''].filter(Boolean);
    return parts.join('&');
  }

  private emitShareResult(result: ShareResult): void {
    eventBus.emit('share:result', result);
    if (result.state !== 'failed') {
      eventBus.emit(GameEvents.SettingChange, { type: 'share', channel: result.channel });
    }
  }
}

export const shareService = ShareService.instance;
