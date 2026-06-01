import { SaveManager } from '../core/SaveManager';
import { eventBus } from '../core/EventBus';
import { GameEvents } from '../game/GameEvents';

export type ComplianceDocumentId = 'userAgreement' | 'privacyPolicy' | 'ageRating' | 'healthyGame';

export interface ComplianceDocument {
  id: ComplianceDocumentId;
  title: string;
  version: string;
  requiredOnLogin: boolean;
  summary: string;
  content: string[];
}

export interface ComplianceGateResult {
  allowed: boolean;
  missingDocumentIds: ComplianceDocumentId[];
  message?: string;
}

const COMPLIANCE_DOCUMENTS: ComplianceDocument[] = [
  {
    id: 'userAgreement',
    title: '用户协议',
    version: 'MVP-0.1',
    requiredOnLogin: true,
    summary: '说明账号、存档、虚拟奖励、行为规范和服务变更等基础规则。',
    content: [
      '玩家进入游戏前需要阅读并同意用户协议和隐私政策。',
      '游戏当前不接入真实支付；广告奖励只在完整观看激励视频后发放。',
      '请勿使用外挂、脚本或其他破坏公平体验的工具。',
      '本地 Mock 数据只用于编辑器预览，不代表线上微信账号数据。',
    ],
  },
  {
    id: 'privacyPolicy',
    title: '隐私政策',
    version: 'MVP-0.1',
    requiredOnLogin: true,
    summary: '说明登录 code、头像昵称授权、本地存档、广告与排行榜数据的使用边界。',
    content: [
      '微信登录会获取临时 code，用于后续服务端换取用户身份；客户端不硬编码 AppID 或密钥。',
      '头像昵称仅在玩家主动授权后用于游戏内展示。',
      '本地存档用于保存设置、资源、进度、任务和广告观看次数。',
      '排行榜预留使用微信开放数据域；提交内容仅包含分数、更新时间等必要字段。',
      '广告 SDK 由微信平台提供，广告填充、失败和取消状态均会明确返回。',
    ],
  },
  {
    id: 'ageRating',
    title: '适龄提示',
    version: 'MVP-0.1',
    requiredOnLogin: false,
    summary: '本游戏建议 16 周岁及以上用户体验。',
    content: [
      '适龄提示：16+ CADPA。',
      '游戏包含轻度幻想战斗、背包合成和宠物养成内容。',
      '未成年人请在监护人指导下合理安排游戏时间。',
    ],
  },
  {
    id: 'healthyGame',
    title: '健康游戏提示',
    version: 'MVP-0.1',
    requiredOnLogin: false,
    summary: '抵制不良游戏，拒绝盗版游戏。注意自我保护，谨防受骗上当。',
    content: [
      '适度游戏益脑，沉迷游戏伤身。',
      '合理安排时间，享受健康生活。',
      '请注意保护个人信息，不要向他人泄露验证码、账号或隐私资料。',
    ],
  },
];

export class ComplianceService {
  private static singleton: ComplianceService | null = null;

  public static get instance(): ComplianceService {
    if (!ComplianceService.singleton) {
      ComplianceService.singleton = new ComplianceService();
    }
    return ComplianceService.singleton;
  }

  public getDocuments(): ComplianceDocument[] {
    return COMPLIANCE_DOCUMENTS.map((document) => ({
      ...document,
      content: [...document.content],
    }));
  }

  public getDocument(id: ComplianceDocumentId): ComplianceDocument | null {
    const document = COMPLIANCE_DOCUMENTS.find((item) => item.id === id);
    return document ? { ...document, content: [...document.content] } : null;
  }

  public getLoginRequiredDocuments(): ComplianceDocument[] {
    return this.getDocuments().filter((document) => document.requiredOnLogin);
  }

  public hasAcceptedAgreement(): boolean {
    return SaveManager.instance.getSnapshot().settings.acceptedAgreement;
  }

  public setAgreementAccepted(accepted: boolean): void {
    SaveManager.instance.setAgreementAccepted(accepted);
    eventBus.emit(GameEvents.SettingChange, { type: 'agreement', accepted });
  }

  public canEnterGame(): ComplianceGateResult {
    if (this.hasAcceptedAgreement()) {
      return { allowed: true, missingDocumentIds: [] };
    }
    return {
      allowed: false,
      missingDocumentIds: this.getLoginRequiredDocuments().map((document) => document.id),
      message: '请先阅读并同意用户协议和隐私政策。',
    };
  }

  public openDocument(id: ComplianceDocumentId): ComplianceDocument | null {
    const document = this.getDocument(id);
    if (document) {
      eventBus.emit(GameEvents.ModalOpen, { type: 'compliance', document });
    }
    return document;
  }

  public getSettingsEntries(): Array<{ id: ComplianceDocumentId; label: string }> {
    return COMPLIANCE_DOCUMENTS.map((document) => ({
      id: document.id,
      label: document.title,
    }));
  }

  public getAgeRatingLabel(): string {
    return '16+ CADPA';
  }

  public getHealthyGameTip(): string {
    return '适度游戏益脑，沉迷游戏伤身。合理安排时间，享受健康生活。';
  }
}

export const complianceService = ComplianceService.instance;
