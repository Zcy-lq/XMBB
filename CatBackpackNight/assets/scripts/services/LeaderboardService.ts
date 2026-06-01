import { SaveManager } from '../core/SaveManager';
import { WechatError, wechatService } from './WechatService';

export type LeaderboardKey = 'highestWave' | 'battlePower' | 'weeklyWave';
export type LeaderboardResultState = 'success' | 'failed' | 'mock' | 'unavailable';

export interface LeaderboardEntry {
  playerId: string;
  nickname: string;
  avatarUrl?: string;
  score: number;
  rank: number;
  updatedAt: number;
}

export interface LeaderboardSubmitResult {
  state: LeaderboardResultState;
  key: LeaderboardKey;
  score: number;
  message?: string;
  rawError?: unknown;
}

export interface LeaderboardMessageResult {
  state: LeaderboardResultState;
  command: string;
  message?: string;
}

export class LeaderboardService {
  private static singleton: LeaderboardService | null = null;
  private mockEntries: LeaderboardEntry[] = [
    { playerId: 'mock_1', nickname: '露营猫猫', score: 30, rank: 1, updatedAt: Date.now() },
    { playerId: 'mock_2', nickname: '背包高手', score: 22, rank: 2, updatedAt: Date.now() },
    { playerId: 'mock_3', nickname: '守夜新人', score: 12, rank: 3, updatedAt: Date.now() },
  ];

  public static get instance(): LeaderboardService {
    if (!LeaderboardService.singleton) {
      LeaderboardService.singleton = new LeaderboardService();
    }
    return LeaderboardService.singleton;
  }

  public submitHighestWave(wave?: number): Promise<LeaderboardSubmitResult> {
    const save = SaveManager.instance.getSnapshot();
    return this.submitScore('highestWave', wave ?? save.progress.highestWave);
  }

  public async submitScore(key: LeaderboardKey, score: number): Promise<LeaderboardSubmitResult> {
    const safeScore = Math.max(0, Math.floor(score));
    const runtime = wechatService.getRuntime();
    if (!runtime?.setUserCloudStorage) {
      this.upsertMockEntry(key, safeScore);
      return {
        state: 'mock',
        key,
        score: safeScore,
        message: '当前不是微信环境，已写入编辑器 Mock 排行榜。',
      };
    }

    return new Promise<LeaderboardSubmitResult>((resolve) => {
      runtime.setUserCloudStorage?.({
        KVDataList: [
          {
            key,
            value: JSON.stringify({
              score: safeScore,
              updatedAt: Date.now(),
            }),
          },
        ],
        success: () => resolve({ state: 'success', key, score: safeScore }),
        fail: (error: WechatError) =>
          resolve({
            state: 'failed',
            key,
            score: safeScore,
            message: wechatService.errorMessage(error, '排行榜分数提交失败。'),
            rawError: error,
          }),
      });
    });
  }

  public requestFriendLeaderboard(key: LeaderboardKey = 'highestWave'): LeaderboardMessageResult {
    return this.postOpenDataMessage('showFriendLeaderboard', { key });
  }

  public requestHideLeaderboard(): LeaderboardMessageResult {
    return this.postOpenDataMessage('hideFriendLeaderboard', {});
  }

  public postOpenDataMessage(command: string, data: Record<string, unknown>): LeaderboardMessageResult {
    const context = wechatService.getRuntime()?.getOpenDataContext?.();
    if (!context) {
      return {
        state: 'mock',
        command,
        message: '当前不是微信环境，排行榜开放数据域消息已进入 Mock。',
      };
    }
    context.postMessage({
      command,
      data,
      sentAt: Date.now(),
    });
    return { state: 'success', command };
  }

  public getMockLeaderboard(): LeaderboardEntry[] {
    return this.mockEntries.map((entry) => ({ ...entry }));
  }

  public setMockLeaderboard(entries: LeaderboardEntry[]): void {
    this.mockEntries = this.sortEntries(entries);
  }

  private upsertMockEntry(key: LeaderboardKey, score: number): void {
    const save = SaveManager.instance.getSnapshot();
    const playerId = save.player.localId;
    const nickname = save.player.nickname;
    const others = this.mockEntries.filter((entry) => entry.playerId !== playerId);
    this.mockEntries = this.sortEntries([
      ...others,
      {
        playerId,
        nickname,
        score,
        rank: 0,
        updatedAt: Date.now(),
      },
    ]);
    wechatService.setStorage(`leaderboard.${key}`, this.mockEntries);
  }

  private sortEntries(entries: LeaderboardEntry[]): LeaderboardEntry[] {
    return entries
      .map((entry) => ({ ...entry }))
      .sort((a, b) => b.score - a.score || a.updatedAt - b.updatedAt)
      .map((entry, index) => ({ ...entry, rank: index + 1 }));
  }
}

export const leaderboardService = LeaderboardService.instance;
