import {
  _decorator,
  builtinResMgr,
  Button,
  Color,
  Label,
  Layers,
  Mask,
  Node,
  ScrollView,
  Sprite,
  SpriteFrame,
  UITransform,
  view,
} from 'cc';
import { BaseUIComponent } from './BaseUIComponent';
import { RedDotManager } from '../core/RedDotManager';
import { SaveManager } from '../core/SaveManager';
import { SceneRouter } from '../core/SceneRouter';
import { eventBus } from '../core/EventBus';
import versionConfig from '../../configs/version.json';
import { MailSave, RewardPayload, RouteId, SettingsSave } from '../data/GameTypes';
import { GameEvents } from '../game/GameEvents';
import { gameLogic } from '../game/GameLogicFacade';
import { BattleSessionState } from '../game/BattleSessionModel';
import { adService } from '../services/AdService';
import { AnalyticsService } from '../services/AnalyticsService';
import { RuntimeSpriteAssets, RuntimeSpriteAssetKey } from './RuntimeSpriteAssets';
import { loadRuntimeSpriteFrame } from './RuntimeSpriteLoader';
import { UIAssetKeys } from './UIAssetKeys';
import { resolveUIRuntimeSpriteKey } from './UIRuntimeAssetResolver';
import { badgeLabel, formatCompactNumber, UIColors } from './UITheme';

const { ccclass, property } = _decorator;

const DESIGN_WIDTH = 750;
const DESIGN_HEIGHT = 1334;

type TextAlign = 'left' | 'center' | 'right';
type VerticalAlign = 'top' | 'center' | 'bottom';
type ResourceKind = 'gold' | 'diamond' | 'blueGem' | 'energy' | 'pawCoin';
type NavKey = 'home' | 'battle' | 'merge' | 'explore' | 'guild' | 'shop' | 'backpack' | 'talent' | 'pet';

interface RectOptions {
  name: string;
  width: number;
  height: number;
  x: number;
  y: number;
  fill: Color;
  border?: Color;
  borderSize?: number;
  label?: string;
  fontSize?: number;
  textColor?: Color;
  align?: TextAlign;
  verticalAlign?: VerticalAlign;
  wrap?: boolean;
  outline?: boolean;
}

interface TextOptions {
  name: string;
  value: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  fontSize: number;
  color: Color;
  align?: TextAlign;
  verticalAlign?: VerticalAlign;
  wrap?: boolean;
  outline?: boolean;
}

interface ShopItemOptions {
  name: string;
  x: number;
  y: number;
  title: string;
  subtitle: string;
  price: string;
  tag?: string;
  color: Color;
}

interface InventoryItemOptions {
  name: string;
  icon: string;
  count?: string;
  selected?: boolean;
  rarity?: Color;
}

interface NavItem {
  key: NavKey;
  label: string;
}

@ccclass('UISkeletonBuilder')
export class UISkeletonBuilder extends BaseUIComponent {
  @property
  public screenKey = 'home';

  @property
  public buildOnLoad = false;

  private designRoot: Node | null = null;
  private battleState: BattleSessionState | null = null;
  private battleLiveLayer: Node | null = null;
  private renderRootOverride: Node | null = null;
  private selectedMailId: string | null = null;
  private selectedPetId: string | null = null;
  private selectedTalentNodeId: string | null = null;

  protected onLoad(): void {
    if (this.buildOnLoad) {
      this.rebuild();
    }
  }

  public rebuild(): void {
    this.clearGeneratedUi();
    this.battleLiveLayer = null;
    this.renderRootOverride = null;
    this.designRoot = new Node('DesignRoot');
    this.designRoot.layer = Layers.Enum.UI_2D;
    this.designRoot.parent = this.node;

    view.getVisibleSize();
    this.designRoot.setScale(1, 1, 1);

    const builders: Record<string, () => void> = {
      login: () => this.buildLogin(),
      home: () => this.buildHome(),
      battlePrepare: () => this.buildBattlePrepare(),
      battle: () => this.buildBattle(),
      merge: () => this.buildMerge(),
      mergeGuide: () => this.buildMergeGuide(),
      explore: () => this.buildExplore(),
      guild: () => this.buildGuild(),
      backpack: () => this.buildBackpack(),
      shop: () => this.buildShop(),
      pet: () => this.buildPet(),
      petDetail: () => this.buildPetDetail(),
      talent: () => this.buildTalent(),
      dailyTask: () => this.buildDailyTask(),
      achievement: () => this.buildAchievement(),
      mail: () => this.buildMail(),
      mailDetail: () => this.buildMailDetail(),
      settings: () => this.buildSettings(),
      policyModal: () => this.buildPolicyModal(),
      confirmModal: () => this.buildConfirmModal(),
      toastModal: () => this.buildToastModal(),
      pauseModal: () => this.buildPauseModal(),
      victory: () => this.buildVictoryReward(),
      defeat: () => this.buildDefeatReward(),
      skillChoice: () => this.buildSkillChoice(),
    };

    (builders[this.screenKey] ?? builders.home)();
  }

  public setBattleState(state: BattleSessionState): void {
    this.battleState = state;
    if (this.screenKey !== 'battle') {
      return;
    }

    if (!this.designRoot || !this.findNodeDeep(this.designRoot, 'Battle_FieldArt')) {
      return;
    }

    this.updateBattleLiveState();
  }

  private buildLogin(): void {
    const save = SaveManager.instance.load();
    const acceptedAgreement = save.settings.acceptedAgreement;

    this.addNightBackground('Bg_LoginNight');
    this.addRect({ name: 'Login_TitleArt', width: 650, height: 288, x: 0, y: 410, fill: new Color(255, 255, 255, 0) });
    this.addText({ name: 'Login_Slogan', value: '整理背包，守住今晚的营地', x: 0, y: 272, width: 520, height: 42, fontSize: 28, color: new Color(232, 222, 198, 235), outline: true });

    this.addRect({ name: 'Login_HeroShadow', width: 286, height: 44, x: -118, y: -206, fill: new Color(0, 0, 0, 80) });
    this.addCharacterStand('Hero_LoginCat', -118, -56, 286, 376, '守夜猫');

    this.addButton('Button_StartGame', '开始游戏', 0, -392, 488, 108, UIColors.buttonGold, UIColors.woodStroke, 48);
    this.addRect({ name: 'Login_AgreementPlate', width: 540, height: 54, x: -16, y: -508, fill: new Color(12, 18, 18, 132), border: new Color(247, 196, 92, 84), borderSize: 2 });
    this.addRect({
      name: 'Login_AgreementCheck',
      width: 34,
      height: 34,
      x: -266,
      y: -508,
      fill: acceptedAgreement ? new Color(112, 77, 46, 255) : new Color(255, 244, 205, 245),
      border: UIColors.whiteText,
      label: acceptedAgreement ? '✓' : '',
      fontSize: 24,
      textColor: acceptedAgreement ? UIColors.whiteText : UIColors.woodStroke,
    });
    const agreementHit = this.addRect({ name: 'Button_ToggleAgreement', width: 62, height: 62, x: -266, y: -508, fill: new Color(0, 0, 0, 0) });
    this.addButtonBehavior(agreementHit, 'Button_ToggleAgreement');
    this.addText({
      name: 'Login_Agreement',
      value: '我已阅读并同意《用户协议》和《隐私政策》',
      x: 12,
      y: -508,
      width: 474,
      height: 48,
      fontSize: 24,
      color: new Color(238, 232, 216, 235),
    });
    this.addRect({ name: 'AgeBadge_16', width: 92, height: 96, x: 304, y: -498, fill: UIColors.buttonGold, border: UIColors.whiteText, label: '16+\nCADPA\n适龄提示', fontSize: 18, textColor: UIColors.woodStroke, outline: false });
    this.addText({
      name: 'Login_HealthNotice',
      value: '抵制不良游戏，拒绝盗版游戏。注意自我保护，谨防受骗上当。\n适度游戏益脑，沉迷游戏伤身。合理安排时间，享受健康生活。',
      x: 0,
      y: -604,
      width: 660,
      height: 64,
      fontSize: 20,
      color: new Color(230, 230, 230, 220),
      wrap: true,
    });
  }

  private buildHome(): void {
    const snapshot = gameLogic.getSnapshot();
    const save = snapshot.save;
    const battleInfo = snapshot.battlePreparation;
    const highestWave = Math.max(save.progress.highestWave, save.progress.currentWave);
    const waveRatio = Math.min(1, highestWave / battleInfo.maxWave);
    const redDots = RedDotManager.instance.recalculate(save);

    this.addNightBackground('Bg_HomeCamp');
    this.addTopPlayerBar();

    this.addRect({ name: 'Home_TopFunctionBar', width: 528, height: 106, x: 0, y: 414, fill: new Color(12, 17, 18, 112), border: new Color(201, 247, 82, 132), borderSize: 3 });
    this.addTopEntry('CheckIn', '签到', -208, 414, !!redDots.dailyTask);
    this.addTopEntry('DailyTask', '每日任务', -104, 414, !!redDots.dailyTask);
    this.addTopEntry('Mail', '邮件', 0, 414, !!redDots.mail);
    this.addTopEntry('Event', '活动', 104, 414, !!redDots.achievement);
    this.addTopEntry('FirstGift', '首充礼包', 208, 414, false);

    this.addRect({ name: 'Home_LeftFeatureRail', width: 104, height: 474, x: -314, y: 16, fill: new Color(8, 14, 15, 20), border: new Color(201, 247, 82, 60), borderSize: 3 });
    this.addFeatureEntry('Left', 'Shop', '商店', -314, 164, false);
    this.addFeatureEntry('Left', 'Backpack', '背包', -314, 48, false);
    this.addFeatureEntry('Left', 'Pet', '宠物', -314, -68, false);
    this.addFeatureEntry('Left', 'Talent', '天赋', -314, -184, false);

    this.addRect({ name: 'Home_RightFeatureRail', width: 98, height: 356, x: 318, y: 6, fill: new Color(8, 14, 15, 20), border: new Color(66, 177, 247, 72), borderSize: 3 });
    this.addFeatureEntry('Right', 'Achievement', '成就', 318, 92, !!redDots.achievement);
    this.addFeatureEntry('Right', 'Illustration', '图鉴', 318, -28, false);
    this.addFeatureEntry('Right', 'Settings', '设置', 318, -148, false);

    this.addRect({ name: 'Home_SceneVignette', width: 690, height: 430, x: 0, y: -92, fill: new Color(0, 0, 0, 10) });
    this.addRect({ name: 'Home_HeroShadow', width: 332, height: 50, x: -110, y: -266, fill: new Color(0, 0, 0, 86) });
    this.addCharacterStand('Hero_HomeCat', -110, -96, 318, 384, '主角猫');

    this.addStageSelector(`普通 1-${save.progress.currentWave}`, highestWave, battleInfo.maxWave, waveRatio);
    this.addStartBattleCta(battleInfo.energyCost);
    this.addText({ name: 'Home_EnergyHint', value: `体力 ${save.currencies.energy}/${battleInfo.energyMax}  推荐战力 ${battleInfo.recommendedPower}`, x: 0, y: -532, width: 420, height: 30, fontSize: 20, color: new Color(246, 235, 201, 225), outline: true });
    this.addBottomNav('home');
  }

  private buildShop(): void {
    const save = gameLogic.getSnapshot().save;
    this.addNightBackground('Bg_Shop');
    this.addResourcePill('Gold', formatCompactNumber(save.currencies.gold), -214, 610, UIColors.buttonGold, '金');
    this.addResourcePill('Diamond', formatCompactNumber(save.currencies.purpleGem), -10, 610, UIColors.purpleGem, '钻');
    this.addResourcePill('BlueGem', formatCompactNumber(save.currencies.blueGem), 194, 610, UIColors.blueGem, '蓝');
    this.addButton('Button_ShopAddCurrency', '+', 330, 610, 54, 54, UIColors.woodLight, UIColors.woodStroke, 30);
    this.addRect({ name: 'Shop_Header', width: 540, height: 126, x: 0, y: 506, fill: UIColors.wood, border: UIColors.woodStroke, borderSize: 8, label: '商店', fontSize: 58, outline: true });
    this.addCharacterStand('ShopkeeperCat', 286, 498, 138, 166, '店猫');

    this.addTabs(['每日商店', '钻石商店', '特惠礼包'], ['Daily', 'Diamond', 'Bundle'], 0, 370, 668, 76, 0);
    this.addRect({ name: 'RedDot_ShopDailyTab', width: 28, height: 28, x: -108, y: 402, fill: UIColors.warningRed, border: UIColors.whiteText, borderSize: 2, label: '!', fontSize: 18 });
    this.addRect({ name: 'Shop_MainPanel', width: 710, height: 846, x: 0, y: -68, fill: new Color(28, 25, 20, 238), border: UIColors.woodStroke, borderSize: 8 });

    const cards: ShopItemOptions[] = [
      { name: 'GoodsGold', x: -224, y: 130, title: '金币', subtitle: 'x5000', price: '免费', tag: '每日', color: UIColors.buttonGold },
      { name: 'GoodsStone', x: 0, y: 130, title: '强化石', subtitle: 'x20', price: '钻石 50', color: UIColors.blueGem },
      { name: 'GoodsEgg', x: 224, y: 130, title: '宠物蛋', subtitle: 'x1', price: '钻石 300', tag: '热卖', color: UIColors.purpleGem },
      { name: 'GoodsChest', x: -224, y: -198, title: '武器宝箱', subtitle: 'x1', price: '蓝钻 200', color: new Color(198, 88, 34, 255) },
      { name: 'GoodsDiamond', x: 0, y: -198, title: '钻石', subtitle: 'x100', price: '蓝钻 6', color: UIColors.blueGem },
      { name: 'GoodsEnergy', x: 224, y: -198, title: '体力', subtitle: 'x20', price: '蓝钻 10', tag: '限购', color: UIColors.warningRed },
    ];
    cards.forEach((item) => this.addShopCard(item));

    this.addText({ name: 'Shop_ResetLabel', value: '刷新倒计时：12:34:56', x: 0, y: -416, width: 360, height: 38, fontSize: 28, color: UIColors.whiteText });
    this.addButton('Button_RefreshShopSmall', '刷新', 0, -474, 250, 70, UIColors.successGreen, UIColors.woodStroke, 30);
    this.addText({ name: 'Shop_FooterHint', value: '观看广告刷新商店', x: 0, y: -528, width: 360, height: 32, fontSize: 22, color: new Color(230, 220, 200, 230) });
  }

  private buildBackpack(): void {
    const save = gameLogic.getSnapshot().save;
    this.addRect({ name: 'Bg_BackpackParchment', width: DESIGN_WIDTH, height: DESIGN_HEIGHT, x: 0, y: 0, fill: new Color(231, 193, 135, 255) });
    this.addRect({ name: 'Backpack_Header', width: 720, height: 120, x: 0, y: 602, fill: UIColors.wood, border: UIColors.woodStroke, borderSize: 8, label: '背包', fontSize: 58, outline: true });
    this.addIconButton('Button_BackpackClose', '×', 318, 602);
    this.addTabs(['1', '2', '3', '锁'], ['Page1', 'Page2', 'Page3', 'Locked'], 0, 486, 660, 72, 0);

    this.addRect({ name: 'Backpack_InventoryPanel', width: 690, height: 650, x: 0, y: 138, fill: new Color(239, 205, 157, 255), border: new Color(130, 83, 45, 255), borderSize: 8 });
    this.addText({ name: 'Backpack_GridTitle', value: `当前容量 ${save.inventory.length} / 25`, x: -220, y: 420, width: 240, height: 36, fontSize: 24, color: UIColors.textBrown, align: 'left' });
    this.addButton('Button_BackpackSort', '整理', 252, 420, 120, 48, UIColors.woodLight, UIColors.woodStroke, 24);

    const items: InventoryItemOptions[] = save.inventory.slice(0, 25).map((item, index) => ({
      name: this.normalizeNodeKey(item.itemId),
      icon: this.getInventoryIcon(item.itemId, item.itemType),
      count: String(item.count),
      selected: index === 0,
      rarity: item.itemType === 'weapon' && item.level >= 2 ? UIColors.highlightGold : undefined,
    }));
    const selectedItem = save.inventory[0];

    for (let i = 0; i < 25; i += 1) {
      const col = i % 5;
      const row = Math.floor(i / 5);
      const x = -260 + col * 130;
      const y = 318 - row * 116;
      this.addInventoryCell(`Cell_${i + 1}`, x, y, items[i]);
    }

    this.addRect({ name: 'Backpack_ItemDetailPanel', width: 690, height: 322, x: 0, y: -466, fill: new Color(239, 205, 157, 255), border: new Color(130, 83, 45, 255), borderSize: 8 });
    this.addRect({ name: 'Backpack_SelectedIcon', width: 110, height: 110, x: -272, y: -392, fill: new Color(180, 220, 190, 255), border: UIColors.woodStroke, borderSize: 6 });
    if (selectedItem) {
      this.addRect({ name: `Backpack_SelectedIcon_${this.normalizeNodeKey(selectedItem.itemId)}_Icon`, width: 92, height: 92, x: -272, y: -392, fill: Color.WHITE });
    }
    this.addText({ name: 'Backpack_SelectedName', value: selectedItem ? `${this.getItemDisplayName(selectedItem.itemId)}  Lv.${selectedItem.level}` : '空背包', x: -14, y: -356, width: 285, height: 40, fontSize: 32, color: UIColors.textBrown, align: 'left' });
    this.addText({
      name: 'Backpack_SelectedStats',
      value: selectedItem ? `数量：${selectedItem.count}\n点击合成或开箱提升背包。` : '通过战斗、商店和邮件获得道具。',
      x: -14,
      y: -422,
      width: 285,
      height: 108,
      fontSize: 23,
      color: new Color(74, 48, 30, 255),
      align: 'left',
      wrap: true,
    });
    this.addButton('Button_Merge', '合成', 270, -386, 146, 70, UIColors.wood, UIColors.woodStroke, 28);
    this.addRect({ name: 'Backpack_MergeCost', width: 116, height: 34, x: 270, y: -438, fill: new Color(116, 67, 28, 220), border: UIColors.woodStroke, borderSize: 3, label: '爪币 98', fontSize: 19 });
    this.addButton('Button_OpenChest', '开箱', 270, -510, 146, 76, UIColors.buttonGold, UIColors.woodStroke, 28);
    this.addRect({ name: 'RedDot_OpenChest', width: 30, height: 30, x: 326, y: -475, fill: UIColors.warningRed, border: UIColors.whiteText, borderSize: 2, label: '1', fontSize: 18 });
    this.addRect({ name: 'Backpack_OpenCost', width: 124, height: 34, x: 270, y: -565, fill: new Color(116, 67, 28, 220), border: UIColors.woodStroke, borderSize: 3, label: '爪币 200', fontSize: 19 });
  }

  private buildMerge(): void {
    this.addNightBackground('Bg_Merge');
    this.addCommercialRouteBackdrop('Merge');
    this.addWoodHeader('合成');
    this.addRect({ name: 'Merge_MainPanel', width: 690, height: 720, x: 0, y: 70, fill: new Color(239, 205, 157, 246), border: UIColors.woodStroke, borderSize: 8 });
    this.addText({ name: 'Merge_Title', value: '可合成装备', x: -208, y: 380, width: 240, height: 44, fontSize: 32, color: UIColors.textBrown, align: 'left' });
    this.addProgressBar('Merge_Progress', -242, 328, 484, 20, 0.46, UIColors.buttonGold);
    this.addText({ name: 'Merge_ProgressText', value: '今日合成 0/5', x: 210, y: 328, width: 180, height: 32, fontSize: 24, color: UIColors.textBrown });
    this.addRect({ name: 'Merge_SourceA', width: 160, height: 160, x: -190, y: 142, fill: UIColors.parchment, border: UIColors.woodStroke, borderSize: 6 });
    this.addRect({ name: 'Merge_SourceA_Icon', width: 106, height: 106, x: -190, y: 158, fill: new Color(255, 255, 255, 0), border: UIColors.highlightGold, borderSize: 3 });
    this.addRect({ name: 'Merge_SourceB', width: 160, height: 160, x: 0, y: 142, fill: UIColors.parchment, border: UIColors.woodStroke, borderSize: 6 });
    this.addRect({ name: 'Merge_SourceB_Icon', width: 106, height: 106, x: 0, y: 158, fill: new Color(255, 255, 255, 0), border: UIColors.highlightGold, borderSize: 3 });
    this.addText({ name: 'Merge_ResultArrow', value: '>', x: 120, y: 160, width: 54, height: 54, fontSize: 48, color: UIColors.textBrown });
    this.addRect({ name: 'Merge_Result', width: 176, height: 176, x: 244, y: 142, fill: UIColors.buttonGold, border: UIColors.woodStroke, borderSize: 7 });
    this.addRect({ name: 'Merge_Result_Icon', width: 116, height: 116, x: 244, y: 160, fill: new Color(255, 255, 255, 0), border: UIColors.whiteText, borderSize: 3 });
    this.addText({ name: 'Merge_Hint', value: '相同装备可以合成为更高等级，消耗金币并记录每日任务进度。', x: 0, y: -80, width: 560, height: 84, fontSize: 25, color: UIColors.textBrown, wrap: true });
    this.addButton('Button_MergeConfirm', '一键合成', 0, -246, 360, 92, UIColors.buttonGold, UIColors.woodStroke, 36);
    this.addBottomNav('merge');
  }

  private buildMergeGuide(): void {
    this.buildBackpack();
    this.addRect({ name: 'MergeGuide_MaskLayer', width: DESIGN_WIDTH, height: DESIGN_HEIGHT, x: 0, y: 0, fill: new Color(0, 0, 0, 128) });
    this.addRect({ name: 'MergeGuide_Modal', width: 650, height: 700, x: 0, y: 42, fill: new Color(247, 225, 188, 250), border: UIColors.woodStroke, borderSize: 9 });
    this.addRect({ name: 'MergeGuide_TitleHeader', width: 328, height: 86, x: 0, y: 356, fill: UIColors.wood, border: UIColors.woodStroke, borderSize: 7, label: '合成提示', fontSize: 42, textColor: UIColors.whiteText, outline: true });
    this.addButton('Button_MergeGuideHelp', '?', 304, 326, 66, 66, UIColors.wood, UIColors.woodStroke, 30);
    this.addText({ name: 'MergeGuide_Intro', value: '拖动相同的物品进行合成，可获得更高级的物品！', x: 0, y: 268, width: 560, height: 38, fontSize: 24, color: UIColors.textBrown, outline: false });

    [-234, -118, -2, 114, 230].forEach((x, index) => {
      this.addInventoryCell(`MergeGuide_BackdropSlot_${index + 1}`, x, 170, undefined);
      this.addInventoryCell(`MergeGuide_BackdropSlot_${index + 6}`, x, 42, undefined);
      this.addInventoryCell(`MergeGuide_BackdropSlot_${index + 11}`, x, -86, undefined);
    });
    this.addRect({ name: 'MergeGuide_SourceA', width: 132, height: 150, x: -220, y: 42, fill: new Color(255, 246, 212, 255), border: UIColors.purpleGem, borderSize: 7 });
    this.addRect({ name: 'MergeGuide_SourceA_rt_item_weapon_fishbone_bow', width: 96, height: 96, x: -220, y: 60, fill: Color.WHITE });
    this.addText({ name: 'MergeGuide_SourceALevel', value: 'Lv.2', x: -220, y: -18, width: 90, height: 28, fontSize: 22, color: UIColors.whiteText, outline: true });
    this.addRect({ name: 'MergeGuide_SourceB', width: 132, height: 150, x: -18, y: 42, fill: new Color(255, 246, 212, 255), border: UIColors.actionBlue, borderSize: 7 });
    this.addRect({ name: 'MergeGuide_SourceB_rt_item_weapon_fishbone_bow', width: 96, height: 96, x: -18, y: 60, fill: Color.WHITE });
    this.addText({ name: 'MergeGuide_SourceBLevel', value: 'Lv.2', x: -18, y: -18, width: 90, height: 28, fontSize: 22, color: UIColors.whiteText, outline: true });
    this.addText({ name: 'MergeGuide_Arrow', value: '➜', x: 102, y: 32, width: 78, height: 56, fontSize: 52, color: UIColors.buttonGold, outline: true });
    this.addRect({ name: 'MergeGuide_Burst', width: 200, height: 260, x: 220, y: 58, fill: new Color(255, 214, 104, 64) });
    this.addText({ name: 'MergeGuide_SuccessText', value: '合成成功！', x: 220, y: 154, width: 190, height: 42, fontSize: 34, color: UIColors.warningRed, outline: true });
    this.addRect({ name: 'MergeGuide_ResultCard', width: 154, height: 226, x: 220, y: 22, fill: UIColors.parchment, border: UIColors.highlightGold, borderSize: 7 });
    this.addRect({ name: 'MergeGuide_Result_rt_item_weapon_fishbone_bow', width: 92, height: 92, x: 220, y: 70, fill: Color.WHITE });
    this.addText({ name: 'MergeGuide_ResultName', value: '鱼骨弩 Lv.3\n攻击力 +78\n攻速 1.45/s', x: 220, y: -30, width: 126, height: 86, fontSize: 18, color: UIColors.textBrown, wrap: true });
    this.addRect({ name: 'MergeGuide_ResultQuality', width: 78, height: 30, x: 220, y: -112, fill: UIColors.successGreen, border: UIColors.woodStroke, borderSize: 2, label: '优秀', fontSize: 18, textColor: UIColors.whiteText, outline: true });
    this.addButton('Button_MergeGuideConfirm', '知道了', 0, -284, 270, 78, UIColors.buttonGold, UIColors.woodStroke, 34);
  }

  private buildExplore(): void {
    this.addNightBackground('Bg_Explore');
    this.addCommercialRouteBackdrop('Explore');
    this.addWoodHeader('探索');
    this.addRect({ name: 'Explore_MapPanel', width: 690, height: 744, x: 0, y: 48, fill: new Color(23, 26, 24, 220), border: UIColors.woodStroke, borderSize: 8 });
    const cards = [
      ['Forest', '黑夜森林', '普通 1-1', -180, 194, true],
      ['Mine', '月石矿洞', '通关 1-10 解锁', 180, 194, false],
      ['Ruins', '古代遗迹', '通关 2-5 解锁', -180, -90, false],
      ['Harbor', '星灯港口', '活动开放', 180, -90, false],
    ] as const;
    cards.forEach((card) => {
      this.addRect({ name: `Explore_Card_${card[0]}`, width: 286, height: 222, x: card[3], y: card[4], fill: card[5] ? UIColors.parchment : new Color(90, 82, 70, 238), border: UIColors.woodStroke, borderSize: 6 });
      this.addText({ name: `Explore_Title_${card[0]}`, value: card[1], x: card[3], y: card[4] + 48, width: 230, height: 40, fontSize: 30, color: UIColors.textBrown });
      this.addText({ name: `Explore_State_${card[0]}`, value: card[2], x: card[3], y: card[4] - 18, width: 230, height: 58, fontSize: 23, color: new Color(94, 61, 38, 255), wrap: true });
    });
    this.addButton('Button_ExploreStart', '前往探索', 0, -430, 360, 88, UIColors.buttonGold, UIColors.woodStroke, 34);
    this.addBottomNav('explore');
  }

  private buildGuild(): void {
    this.addNightBackground('Bg_Guild');
    this.addCommercialRouteBackdrop('Guild');
    this.addWoodHeader('公会');
    this.addRect({ name: 'Guild_MainPanel', width: 690, height: 750, x: 0, y: 42, fill: new Color(239, 205, 157, 246), border: UIColors.woodStroke, borderSize: 8 });
    this.addText({ name: 'Guild_Name', value: '守夜小队', x: 0, y: 342, width: 420, height: 52, fontSize: 40, color: UIColors.textBrown });
    this.addCharacterStand('Guild_MascotCat', -194, 112, 230, 282, '公会猫');
    this.addRect({ name: 'Guild_InfoPanel', width: 358, height: 280, x: 146, y: 116, fill: new Color(255, 234, 191, 255), border: UIColors.woodStroke, borderSize: 5 });
    this.addText({ name: 'Guild_Level', value: '公会 Lv.1', x: 146, y: 196, width: 260, height: 38, fontSize: 30, color: UIColors.textBrown });
    this.addText({ name: 'Guild_Members', value: '成员 1/30', x: 146, y: 132, width: 260, height: 34, fontSize: 26, color: UIColors.textBrown });
    this.addText({ name: 'Guild_Contribution', value: '今日贡献 0/100', x: 146, y: 70, width: 260, height: 34, fontSize: 26, color: UIColors.textBrown });
    this.addButton('Button_GuildCheckIn', '公会签到', -138, -308, 248, 82, UIColors.buttonGold, UIColors.woodStroke, 32);
    this.addButton('Button_GuildHelp', '互助', 158, -308, 208, 82, UIColors.successGreen, UIColors.woodStroke, 32);
    this.addBottomNav('guild');
  }

  private buildBattle(): void {
    const battleState = this.battleState;
    const snapshot = gameLogic.getSnapshot();
    const wave = battleState ? battleState.wave : snapshot.save.progress.currentWave;
    const secondsLeft = battleState ? battleState.secondsLeft : 45;
    const campHp = battleState ? battleState.campHp : 10;
    const campHpMax = battleState ? battleState.campHpMax : 10;
    const hpRatio = campHpMax > 0 ? campHp / campHpMax : 0;

    this.addNightBackground('Bg_BattleForest');
    this.addRect({ name: 'Battle_FieldArt', width: 750, height: 920, x: 0, y: 25, fill: new Color(255, 255, 255, 0) });
    this.addRect({ name: 'Battle_TopDim', width: 750, height: 176, x: 0, y: 580, fill: new Color(4, 10, 14, 128) });
    this.addRect({ name: 'Battle_WavePlate', width: 270, height: 62, x: 0, y: 590, fill: new Color(23, 26, 24, 230), border: UIColors.woodStroke, borderSize: 5, label: `第 ${wave} 波`, fontSize: 35 });
    this.addRect({ name: 'Battle_TimerPlate', width: 190, height: 54, x: 0, y: 532, fill: new Color(23, 26, 24, 230), border: UIColors.woodStroke, borderSize: 4, label: `⏱ ${this.formatSeconds(secondsLeft)}`, fontSize: 29 });
    this.addButton('Button_BattlePause', 'Ⅱ', 318, 580, 82, 82, UIColors.actionBlue, UIColors.woodStroke, 38);
    this.addRect({ name: 'Battle_HPHeart', width: 58, height: 58, x: -160, y: 487, fill: UIColors.warningRed, border: UIColors.woodStroke, borderSize: 3, label: '♥', fontSize: 32 });
    this.addProgressBar('Battle_HPBar', 30, 487, 300, 32, hpRatio, UIColors.successGreen);
    this.addText({ name: 'Battle_HPText', value: `${Math.ceil(campHp)} / ${Math.ceil(campHpMax)}`, x: 30, y: 487, width: 160, height: 34, fontSize: 26, color: UIColors.whiteText, outline: true });
    this.addText({ name: 'Battle_KillCounter', value: `击败 ${battleState?.defeatedMonsters ?? 0}/${battleState?.spawnedMonsters ?? 0}`, x: -224, y: 532, width: 180, height: 32, fontSize: 24, color: UIColors.highlightGold, outline: true });
    this.addRect({ name: 'Battle_WeaponSlotBar', width: 720, height: 176, x: 0, y: -574, fill: new Color(23, 26, 24, 238), border: UIColors.woodStroke, borderSize: 8 });
    const slotPositions = [-292, -174, -56, 62, 180];
    for (let i = 0; i < slotPositions.length; i += 1) {
      this.addBattleWeaponSlot(`BattleWeapon_Static_${i + 1}`, slotPositions[i], -574, undefined, 0);
    }
    this.addButton('Button_AutoMerge', '自动\n合成', 306, -574, 96, 118, UIColors.wood, UIColors.woodStroke, 28);
    if (this.battleState?.monsters.some((monster) => monster.alive)) {
      this.updateBattleLiveState();
    } else {
      this.addBattleDesignPreviewLayer();
    }
  }

  private addBattleDesignPreviewLayer(): void {
    const previewBaseDamage = Math.max(48, Math.round(gameLogic.getSnapshot().battlePreparation.myPower / 9));

    if (!this.battleState) {
      this.addCharacterStand('BattleDemo_HeroCat', -218, 132, 188, 226, '守夜');
    }
    this.addRect({ name: 'BattleDemo_rt_monster_ghost_A', width: 92, height: 102, x: 130, y: 174, fill: new Color(255, 255, 255, 0) });
    this.addRect({ name: 'BattleDemo_rt_monster_goblin_A', width: 118, height: 128, x: 226, y: 60, fill: new Color(255, 255, 255, 0) });
    this.addRect({ name: 'BattleDemo_rt_monster_skeleton_A', width: 122, height: 136, x: 270, y: 218, fill: new Color(255, 255, 255, 0) });
    this.addText({ name: 'BattleDemo_Damage_Primary', value: `${previewBaseDamage}`, x: 76, y: 236, width: 86, height: 44, fontSize: 34, color: UIColors.buttonGold, outline: true });
    this.addText({ name: 'BattleDemo_Damage_FollowUp', value: `${Math.round(previewBaseDamage * 1.15)}`, x: 128, y: 100, width: 86, height: 44, fontSize: 34, color: UIColors.buttonGold, outline: true });
    this.addText({ name: 'BattleDemo_Damage_Critical', value: `${Math.round((previewBaseDamage * 23) / 10)}`, x: 222, y: -36, width: 86, height: 44, fontSize: 36, color: UIColors.buttonGold, outline: true });
  }

  private buildBattlePrepare(): void {
    const snapshot = gameLogic.getSnapshot();
    const battleInfo = snapshot.battlePreparation;

    this.addNightBackground('Bg_BattlePrepare');
    this.addIconButton('Button_Back_BattlePrepare', '←', -318, 592);
    this.addIconButton('Button_Close_BattlePrepare', '×', 318, 592);
    this.addText({ name: 'BattlePrepare_Title', value: `${battleInfo.chapterTitle}  第 ${battleInfo.wave} 波`, x: 0, y: 592, width: 520, height: 64, fontSize: 42, color: UIColors.whiteText, outline: true });
    this.addRect({ name: 'BattlePrepare_RecommendPower', width: 320, height: 62, x: 0, y: 532, fill: new Color(23, 26, 24, 230), border: UIColors.woodStroke, borderSize: 5, label: `推荐战力：${battleInfo.recommendedPower}`, fontSize: 30, textColor: UIColors.highlightGold, outline: true });
    this.addRect({ name: 'BattlePrepare_PreviewPanel', width: 690, height: 468, x: 0, y: 264, fill: new Color(23, 26, 24, 215), border: UIColors.woodStroke, borderSize: 7 });
    this.addRect({ name: 'BattlePrepare_PreviewArt', width: 658, height: 440, x: 0, y: 264, fill: new Color(255, 255, 255, 0) });
    this.addCharacterStand('BattlePrepare_HeroCat', -216, 214, 166, 202, '备战猫');
    this.addRect({ name: 'BattlePrepare_Enemy_rt_monster_ghost', width: 92, height: 104, x: 30, y: 260, fill: new Color(255, 255, 255, 0) });
    this.addRect({ name: 'BattlePrepare_Enemy_rt_monster_goblin', width: 112, height: 124, x: 190, y: 248, fill: new Color(255, 255, 255, 0) });
    this.addRect({ name: 'BattlePrepare_Chest_rt_item_chest', width: 104, height: 94, x: 126, y: 154, fill: new Color(255, 255, 255, 0) });
    this.addRect({ name: 'BattlePrepare_MyPowerPanel', width: 690, height: 74, x: 0, y: -22, fill: new Color(23, 26, 24, 225), border: UIColors.woodStroke, borderSize: 5, label: `我的战力 ${battleInfo.myPower}   VS   ${battleInfo.recommendedPower}`, fontSize: 30, textColor: UIColors.highlightGold, outline: true });
    this.addRect({ name: 'BattlePrepare_ItemGrid', width: 690, height: 260, x: 0, y: -204, fill: new Color(23, 26, 24, 230), border: UIColors.woodStroke, borderSize: 7 });
    this.addText({ name: 'BattlePrepare_WeaponHint', value: '背包中的武器将自动上阵', x: 0, y: -96, width: 560, height: 38, fontSize: 28, color: UIColors.whiteText, outline: true });
    this.addBattleWeaponSlot('PrepareWeapon_Sword', -276, -190, 'rt_battle_weapon_gold_sword', 1);
    this.addBattleWeaponSlot('PrepareWeapon_Bow', -138, -190, 'rt_battle_weapon_bow', 1);
    this.addBattleWeaponSlot('PrepareWeapon_Spear', 0, -190, 'rt_battle_weapon_spear', 1);
    this.addBattleWeaponSlot('PrepareWeapon_Orb', 138, -190, 'rt_battle_weapon_orb', 1);
    this.addBattleWeaponSlot('PrepareWeapon_Empty1', 276, -190, undefined, 0);
    this.addBattleWeaponSlot('PrepareWeapon_Sword2', -276, -320, 'rt_battle_weapon_sword', 1);
    this.addBattleWeaponSlot('PrepareWeapon_Shield', -138, -320, 'rt_battle_weapon_shield', 1);
    this.addBattleWeaponSlot('PrepareWeapon_Empty2', 0, -320, undefined, 0);
    this.addBattleWeaponSlot('PrepareWeapon_Empty3', 138, -320, undefined, 0);
    this.addBattleWeaponSlot('PrepareWeapon_Empty4', 276, -320, undefined, 0);
    this.addButton('Button_StartBattle', `开始战斗\n${this.formatEnergyCostLabel(battleInfo.energyCost)}`, 0, -510, 456, 114, UIColors.buttonGold, UIColors.woodStroke, 42);
    this.addRect({ name: 'BattlePrepare_AgreementCheck', width: 34, height: 34, x: -292, y: -622, fill: UIColors.successGreen, border: UIColors.whiteText, label: '✓', fontSize: 22 });
    this.addText({ name: 'BattlePrepare_Agreement', value: '我已阅读并同意《用户协议》和《隐私政策》', x: 24, y: -622, width: 520, height: 44, fontSize: 23, color: new Color(230, 230, 230, 230) });
    this.addRect({ name: 'AgeBadge_16_Prepare', width: 80, height: 86, x: 310, y: -604, fill: UIColors.buttonGold, border: UIColors.whiteText, label: '16+\nCADPA\n适龄提示', fontSize: 16, textColor: UIColors.woodStroke, outline: false });
  }

  private buildDailyTask(): void {
    const snapshot = gameLogic.getSnapshot();
    const save = snapshot.save;
    const activity = snapshot.claimedActivity;
    const maxActivity = 120;
    this.addNightBackground('Bg_DailyTask');
    this.addCommercialRouteBackdrop('DailyTask');
    this.addWoodHeader('每日任务');
    this.addTabs(['日常', '周常', '成就'], ['DailyTask', 'WeeklyTask', 'TaskAchievement'], 0, 468, 668, 76, 0);
    this.addRect({ name: 'DailyTask_ActivityPanel', width: 690, height: 150, x: 0, y: 334, fill: new Color(23, 26, 24, 230), border: UIColors.woodStroke, borderSize: 7 });
    this.addRect({ name: 'DailyTask_ActivityMedal', width: 112, height: 112, x: -280, y: 334, fill: new Color(62, 42, 28, 248), border: UIColors.highlightGold, borderSize: 5, label: `今日活跃\n${Math.min(maxActivity, activity)}\n/${maxActivity}`, fontSize: 22, textColor: UIColors.highlightGold, outline: true });
    this.addProgressBar('DailyTask_ActivityProgress', 126, 354, 424, 24, Math.min(1, activity / maxActivity), UIColors.buttonGold);
    ['30', '60', '90', '120'].forEach((mark, index) => {
      const x = -126 + index * 126;
      const chest = this.addRect({ name: `DailyTask_Chest_rt_item_chest_${mark}`, width: 58, height: 52, x, y: 330, fill: new Color(255, 255, 255, 0) });
      this.addButtonBehavior(chest, `Button_ActivityChest_${mark}`);
      this.addText({ name: `DailyTask_ChestMark_${mark}`, value: mark, x, y: 292, width: 58, height: 24, fontSize: 20, color: UIColors.highlightGold, outline: true });
    });

    const tasks = gameLogic.repo.configs.tasks.dailyTasks.slice(0, 5).map((task) => {
      const row = save.dailyTasks.find((saved) => saved.id === task.id);
      const progress = Math.min(task.target, row?.progress ?? 0);
      return {
        key: this.getDailyTaskUiKey(task.id),
        title: this.getDailyTaskTitle(task.id),
        desc: this.getDailyTaskDesc(task.id),
        count: `${progress}/${task.target}`,
        ratio: task.target > 0 ? progress / task.target : 0,
        claimed: row?.claimed === true,
        claimable: progress >= task.target && row?.claimed !== true,
      };
    });
    tasks.forEach((task, index) => {
      const y = 154 - index * 126;
      this.addRect({ name: `DailyTask_Row_${task.key}`, width: 690, height: 104, x: 0, y, fill: new Color(239, 205, 157, 246), border: UIColors.woodStroke, borderSize: 5 });
      this.addRect({ name: `DailyTask_Icon_${task.key}`, width: 60, height: 60, x: -304, y, fill: UIColors.buttonGold, border: UIColors.woodStroke, borderSize: 3 });
      this.addText({ name: `DailyTask_Title_${task.key}`, value: task.title, x: -140, y: y + 20, width: 230, height: 32, fontSize: 27, color: UIColors.textBrown, align: 'left' });
      this.addText({ name: `DailyTask_Desc_${task.key}`, value: task.desc, x: -104, y: y - 18, width: 302, height: 30, fontSize: 21, color: new Color(94, 61, 38, 255), align: 'left' });
      this.addProgressBar(`DailyTask_Progress_${task.key}`, 70, y - 21, 156, 14, task.ratio, UIColors.successGreen);
      this.addText({ name: `DailyTask_Count_${task.key}`, value: task.count, x: 70, y: y + 18, width: 120, height: 28, fontSize: 22, color: UIColors.textBrown });
      this.addRect({ name: `DailyTask_RewardPanel_${task.key}`, width: 112, height: 80, x: 184, y, fill: new Color(255, 240, 206, 222), border: new Color(188, 134, 76, 180), borderSize: 2 });
      this.addRect({ name: `DailyTask_RewardGold_rt_icon_paw_coin_${task.key}`, width: 36, height: 36, x: 164, y: y + 12, fill: Color.WHITE });
      this.addText({ name: `DailyTask_RewardGoldText_${task.key}`, value: 'x100', x: 164, y: y - 25, width: 58, height: 20, fontSize: 16, color: UIColors.textBrown });
      this.addRect({ name: `DailyTask_RewardGem_rt_icon_purple_gem_${task.key}`, width: 36, height: 36, x: 208, y: y + 12, fill: Color.WHITE });
      this.addButton(`Button_DailyTaskClaim_${task.key}`, task.claimed ? '已领' : task.claimable ? '领取' : '前往', 304, y, 92, 58, task.claimable ? UIColors.buttonGold : UIColors.actionBlue, UIColors.woodStroke, 23);
    });
    this.addRect({ name: 'DailyTask_RefreshTip', width: 250, height: 46, x: 0, y: -414, fill: new Color(23, 26, 24, 224), border: UIColors.highlightGold, borderSize: 3, label: '每日 0 点刷新', fontSize: 22, textColor: UIColors.highlightGold, outline: true });
  }

  private buildMail(): void {
    const save = gameLogic.getSnapshot().save;
    const selectedMailId = this.getSelectedMail()?.id ?? null;
    this.addNightBackground('Bg_Mail');
    this.addCommercialRouteBackdrop('Mail');
    this.addWoodHeader('邮件');
    this.addTabs(['全部', '奖励', '公告'], ['MailAll', 'MailReward', 'MailNotice'], 0, 468, 668, 76, 0);
    this.addRect({ name: 'Mail_ListPanel', width: 690, height: 728, x: 0, y: 46, fill: new Color(239, 205, 157, 246), border: UIColors.woodStroke, borderSize: 8 });
    const mails = save.mails.length > 0 ? save.mails.slice(0, 5) : [
      { id: 'welcome', title: '守夜补给已送达', read: false, claimed: false, attachments: [{ id: 'gold', amount: 300 }] },
      { id: 'notice', title: '营地公告', read: true, claimed: true, attachments: [] },
    ];
    mails.forEach((mail, index) => {
      const y = 328 - index * 118;
      const hasReward = mail.attachments.length > 0 && !mail.claimed;
      const selected = mail.id === selectedMailId;
      this.addRect({ name: `Mail_Row_${mail.id}`, width: 638, height: 96, x: 0, y, fill: new Color(255, 234, 191, 255), border: selected ? UIColors.actionBlue : new Color(146, 91, 48, 255), borderSize: selected ? 6 : 4 });
      this.addRect({ name: `Mail_Icon_${mail.id}`, width: 58, height: 58, x: -286, y, fill: hasReward ? UIColors.buttonGold : UIColors.parchment, border: UIColors.woodStroke, borderSize: 3, label: hasReward ? '!' : '', fontSize: 22 });
      this.addText({ name: `Mail_Title_${mail.id}`, value: mail.title, x: -60, y: y + 18, width: 350, height: 34, fontSize: 27, color: UIColors.textBrown, align: 'left' });
      this.addText({ name: `Mail_State_${mail.id}`, value: hasReward ? '附件待领取' : mail.read ? '已读' : '未读', x: -116, y: y - 18, width: 238, height: 28, fontSize: 21, color: new Color(94, 61, 38, 255), align: 'left' });
      const openHit = this.addRect({ name: `Button_MailOpen_${mail.id}`, width: 496, height: 96, x: -70, y, fill: new Color(0, 0, 0, 0) });
      this.addButtonBehavior(openHit, `Button_MailOpen_${mail.id}`);
      this.addButton(`Button_MailClaim_${mail.id}`, hasReward ? '领取' : '查看', 260, y, 116, 58, hasReward ? UIColors.buttonGold : UIColors.woodLight, UIColors.woodStroke, 24);
    });
    this.addRect({ name: 'Mail_EmptyStatePanel', width: 638, height: 116, x: 0, y: -292, fill: new Color(255, 234, 191, 246), border: new Color(188, 134, 76, 255), borderSize: 4 });
    this.addRect({ name: 'Mail_EmptyCat_rt_avatar_cat', width: 86, height: 86, x: -210, y: -292, fill: Color.WHITE });
    this.addText({ name: 'Mail_EmptyText', value: '暂时没有更多邮件\n完成任务或参与活动可获得邮件奖励', x: 74, y: -292, width: 360, height: 58, fontSize: 23, color: UIColors.textBrown, wrap: true, align: 'left' });
    this.addButton('Button_MailClaimAll', '一键领取', -138, -474, 246, 74, UIColors.successGreen, UIColors.woodStroke, 28);
    this.addButton('Button_MailDeleteAll', '一键删除', 138, -474, 246, 74, UIColors.warningRed, UIColors.woodStroke, 28);
  }

  private buildAchievement(): void {
    const save = gameLogic.getSnapshot().save;
    this.addNightBackground('Bg_Achievement');
    this.addCommercialRouteBackdrop('Achievement');
    this.addWoodHeader('成就');
    this.addTabs(['成长', '战斗', '收集'], ['Grow', 'Battle', 'Collect'], 0, 468, 668, 76, 0);
    this.addRect({ name: 'Achievement_SummaryPanel', width: 690, height: 126, x: 0, y: 344, fill: new Color(23, 26, 24, 226), border: UIColors.woodStroke, borderSize: 7 });
    const claimedCount = save.achievements.filter((row) => row.claimed).length;
    const totalAchievementCount = gameLogic.repo.configs.tasks.achievements.length;
    const totalRatio = totalAchievementCount > 0 ? claimedCount / totalAchievementCount : 0;
    this.addRect({ name: 'Achievement_TrophyIcon', width: 82, height: 82, x: -282, y: 344, fill: UIColors.buttonGold, border: UIColors.highlightGold, borderSize: 4, label: '杯', fontSize: 28, textColor: UIColors.textBrown });
    this.addText({ name: 'Achievement_TotalTitle', value: `已领奖励 ${claimedCount}/${totalAchievementCount}`, x: -118, y: 368, width: 250, height: 38, fontSize: 30, color: UIColors.highlightGold, outline: true });
    this.addText({ name: 'Achievement_TotalDesc', value: '完成成就可解锁头像框与钻石奖励', x: -72, y: 324, width: 314, height: 30, fontSize: 21, color: UIColors.whiteText, outline: true });
    this.addProgressBar('Achievement_TotalProgress', -82, 300, 310, 18, totalRatio, UIColors.buttonGold);
    this.addText({ name: 'Achievement_TotalPercent', value: `${Math.round(totalRatio * 100)}%`, x: 98, y: 300, width: 74, height: 26, fontSize: 20, color: UIColors.highlightGold, outline: true });
    this.addButton('Button_AchievementClaimAll', '一键领取', 270, 344, 132, 66, UIColors.successGreen, UIColors.woodStroke, 23);
    const rows = gameLogic.repo.configs.tasks.achievements.slice(0, 5).map((achievement) => {
      const row = save.achievements.find((saved) => saved.id === achievement.id);
      const progress = Math.min(achievement.target, row?.progress ?? 0);
      return {
        key: this.getAchievementUiKey(achievement.id),
        title: this.getAchievementTitle(achievement.id),
        desc: this.getAchievementDesc(achievement.id),
        ratio: achievement.target > 0 ? progress / achievement.target : 0,
        claimed: row?.claimed === true,
        claimable: progress >= achievement.target && row?.claimed !== true,
      };
    });
    rows.forEach((row, index) => {
      const y = 184 - index * 104;
      this.addRect({ name: `Achievement_Row_${row.key}`, width: 690, height: 92, x: 0, y, fill: new Color(239, 205, 157, 246), border: UIColors.woodStroke, borderSize: 5 });
      this.addRect({ name: `Achievement_Badge_${row.key}`, width: 68, height: 68, x: -294, y, fill: UIColors.buttonGold, border: UIColors.woodStroke, borderSize: 3 });
      this.addText({ name: `Achievement_Title_${row.key}`, value: row.title, x: -122, y: y + 20, width: 282, height: 32, fontSize: 27, color: UIColors.textBrown, align: 'left' });
      this.addText({ name: `Achievement_Desc_${row.key}`, value: row.desc, x: -116, y: y - 18, width: 294, height: 28, fontSize: 21, color: new Color(94, 61, 38, 255), align: 'left' });
      this.addProgressBar(`Achievement_Progress_${row.key}`, 112, y - 18, 150, 14, row.ratio, UIColors.buttonGold);
      this.addRect({ name: `Achievement_RewardGem_${row.key}_rt_icon_purple_gem`, width: 44, height: 44, x: 178, y: y + 14, fill: Color.WHITE });
      this.addText({ name: `Achievement_RewardGemText_${row.key}`, value: 'x50', x: 178, y: y - 28, width: 58, height: 22, fontSize: 17, color: UIColors.textBrown });
      this.addRect({ name: `Achievement_RewardCoin_${row.key}_rt_icon_paw_coin`, width: 44, height: 44, x: 224, y: y + 14, fill: Color.WHITE });
      this.addButton(`Button_AchievementClaim_${row.key}`, row.claimed ? '已领' : row.claimable ? '领取' : '查看', 274, y, 116, 58, row.claimable ? UIColors.buttonGold : UIColors.woodLight, UIColors.woodStroke, 24);
    });
    this.addRect({ name: 'Achievement_BottomClaimPanel', width: 520, height: 82, x: 0, y: -474, fill: UIColors.wood, border: UIColors.highlightGold, borderSize: 5 });
    this.addRect({ name: 'Achievement_BottomChest_rt_item_chest', width: 66, height: 58, x: -204, y: -474, fill: new Color(255, 255, 255, 0) });
    this.addButton('Button_AchievementClaimAllBottom', '一键领取全部可领奖励', 58, -474, 398, 70, UIColors.buttonGold, UIColors.woodStroke, 25);
    this.addRect({ name: 'Achievement_BottomClaimRedDot', width: 30, height: 30, x: 250, y: -446, fill: UIColors.warningRed, border: UIColors.whiteText, borderSize: 2, label: '3', fontSize: 18, textColor: UIColors.whiteText, outline: true });
  }

  private buildPet(): void {
    const save = gameLogic.getSnapshot().save;
    const selectedPetId = this.getSelectedPetId();
    const selectedPet = selectedPetId ? save.pets.find((pet) => pet.id === selectedPetId) : undefined;
    const selectedConfig = selectedPet ? gameLogic.repo.getPet(selectedPet.id) : undefined;
    const nextCost = selectedConfig && selectedPet ? gameLogic.progression.getPetUpgradeCost(selectedConfig, selectedPet.level) : null;
    const selectedOwned = selectedPet?.owned === true;
    const petMaterialCount = save.inventory.find((item) => item.itemId === 'pet_material_common')?.count ?? 0;
    this.addNightBackground('Bg_Pet');
    this.addCommercialRouteBackdrop('Pet');
    this.addWoodHeader('宠物');
    this.addRect({ name: 'Pet_ShowcasePanel', width: 690, height: 452, x: 0, y: 246, fill: new Color(20, 24, 22, 218), border: UIColors.woodStroke, borderSize: 8 });
    this.addRect({ name: 'Pet_SelectedPortraitFrame', width: 272, height: 350, x: -214, y: 244, fill: new Color(13, 20, 22, 210), border: UIColors.highlightGold, borderSize: 7 });
    this.addRect({ name: 'Pet_SelectedPortraitMoon', width: 222, height: 222, x: -214, y: 278, fill: new Color(255, 219, 112, 70) });
    this.addRect({ name: 'Pet_SelectedPortraitStage', width: 208, height: 54, x: -214, y: 92, fill: new Color(122, 76, 38, 180), border: new Color(255, 218, 122, 100), borderSize: 2 });
    this.addCharacterStand('Pet_SelectedCat', -214, 252, 226, 264, this.getPetDisplayName(selectedPet?.id ?? 'pet_black_cat'));
    this.addRect({ name: 'Pet_SelectedRarityBadge', width: 88, height: 36, x: 262, y: 392, fill: UIColors.purpleGem, border: UIColors.woodStroke, borderSize: 3, label: '史诗', fontSize: 21, textColor: UIColors.whiteText, outline: true });
    this.addText({ name: 'Pet_SelectedName', value: `${this.getPetDisplayName(selectedPet?.id ?? 'pet_black_cat')}  Lv.${selectedPet?.level ?? 1}`, x: 150, y: 382, width: 254, height: 44, fontSize: 34, color: UIColors.whiteText, outline: true, align: 'left' });
    this.addRect({ name: 'Pet_SelectedStarRow', width: 300, height: 54, x: 166, y: 314, fill: new Color(18, 20, 18, 190), border: UIColors.successGreen, borderSize: 3, label: '★ ★ ★ ★ ☆', fontSize: 33, textColor: UIColors.buttonGold, outline: true });
    const selectedPower = selectedConfig ? selectedConfig.basePower + Math.max(0, (selectedPet?.level ?? 1) - 1) * selectedConfig.powerPerLevel : 0;
    this.addRect({ name: 'Pet_SelectedPowerPanel', width: 300, height: 48, x: 166, y: 250, fill: new Color(28, 20, 14, 210), border: UIColors.woodStroke, borderSize: 3, label: `战力：${selectedPower}`, fontSize: 27, textColor: UIColors.highlightGold, outline: true });
    this.addRect({ name: 'Pet_SelectedSkillPanel', width: 300, height: 102, x: 166, y: 168, fill: new Color(20, 22, 20, 220), border: UIColors.actionBlue, borderSize: 5 });
    this.addRect({ name: 'Pet_SelectedSkillIcon', width: 70, height: 70, x: 44, y: 168, fill: UIColors.purpleGem, border: UIColors.woodStroke, borderSize: 4, label: '爪', fontSize: 30, textColor: UIColors.whiteText, outline: true });
    this.addText({ name: 'Pet_SelectedSkill', value: '暗影利爪  Lv.2\n对前方敌人造成伤害，并提升守夜收益。', x: 198, y: 168, width: 206, height: 74, fontSize: 20, color: new Color(246, 235, 201, 245), wrap: true, align: 'left', outline: true });
    this.addRect({ name: 'Pet_MaterialPanel', width: 300, height: 58, x: 166, y: 74, fill: new Color(20, 22, 20, 220), border: UIColors.highlightGold, borderSize: 4 });
    this.addText({ name: 'Pet_MaterialName', value: '灵兽精华', x: 70, y: 82, width: 146, height: 28, fontSize: 20, color: UIColors.whiteText, align: 'left', outline: true });
    this.addProgressBar('Pet_ExpProgress', 206, 62, 168, 18, selectedConfig ? Math.min(1, (selectedPet?.level ?? 1) / selectedConfig.maxLevel) : 0, UIColors.successGreen);
    this.addText({ name: 'Pet_MaterialCount', value: nextCost ? `${petMaterialCount}/${nextCost.petMaterial}` : '已满级', x: 206, y: 82, width: 112, height: 24, fontSize: 19, color: UIColors.highlightGold, outline: true });
    this.addButton('Button_PetLevelUp', selectedOwned ? nextCost ? '喂养升级' : '已满级' : '未解锁', -88, -4, 196, 66, selectedOwned ? UIColors.successGreen : UIColors.woodLight, UIColors.woodStroke, 27);
    this.addButton('Button_PetDeploy', selectedPet?.deployed ? '出战中' : '设为出战', 164, -4, 188, 66, selectedPet?.deployed ? UIColors.buttonGold : UIColors.successGreen, UIColors.woodStroke, 27);
    this.addRect({ name: 'Pet_ListPanel', width: 690, height: 346, x: 0, y: -286, fill: new Color(239, 205, 157, 246), border: UIColors.woodStroke, borderSize: 8 });
    this.addText({ name: 'Pet_ListTitle', value: '← 伙伴列表 →', x: 0, y: -130, width: 260, height: 38, fontSize: 29, color: UIColors.textBrown });
    save.pets.slice(0, 5).forEach((pet, index) => {
      const key = this.normalizeNodeKey(pet.id);
      const x = -268 + index * 134;
      const y = -300;
      const owned = pet.owned === true;
      const deployed = pet.deployed === true;
      const selected = pet.id === selectedPet?.id;
      this.addRect({
        name: `Pet_Card_${key}_${deployed ? 'Deployed' : owned ? 'Owned' : 'Locked'}`,
        width: 118,
        height: 226,
        x,
        y,
        fill: owned ? new Color(255, 234, 191, 255) : new Color(72, 66, 58, 230),
        border: selected ? UIColors.actionBlue : deployed ? UIColors.highlightGold : UIColors.woodStroke,
        borderSize: selected ? 8 : deployed ? 7 : 5,
      });
      this.addRect({
        name: `Pet_Icon_${key}`,
        width: 86,
        height: 86,
        x,
        y: y + 52,
        fill: owned ? new Color(255, 255, 255, 0) : new Color(70, 70, 70, 220),
        border: owned ? UIColors.highlightGold : new Color(120, 108, 90, 220),
        borderSize: 4,
      });
      this.addText({
        name: `Pet_Name_${key}`,
        value: owned ? this.getPetDisplayName(pet.id) : '未解锁',
        x,
        y: y - 22,
        width: 102,
        height: 32,
        fontSize: 20,
        color: owned ? UIColors.textBrown : UIColors.whiteText,
        outline: !owned,
      });
      this.addText({
        name: `Pet_CardState_${key}`,
        value: deployed ? '出战中' : owned ? `★ ★ ☆\nLv.${pet.level}` : '通关章节\n2-10解锁',
        x,
        y: y - 76,
        width: 104,
        height: 58,
        fontSize: 20,
        color: deployed ? UIColors.highlightGold : owned ? new Color(94, 61, 38, 255) : new Color(230, 220, 200, 230),
        wrap: true,
        outline: !owned || deployed,
      });
      if (deployed) {
        this.addRect({ name: `Pet_DeployedBadge_${key}`, width: 76, height: 30, x: x - 16, y: y + 98, fill: UIColors.successGreen, border: UIColors.woodStroke, borderSize: 2, label: '出战中', fontSize: 16 });
      }
      if (selected) {
        this.addRect({ name: `Pet_SelectedRing_${key}`, width: 102, height: 210, x, y, fill: new Color(255, 255, 255, 34), border: UIColors.actionBlue, borderSize: 3 });
      }
      const selectHit = this.addRect({ name: `Button_PetSelect_${key}`, width: 118, height: 226, x, y, fill: new Color(0, 0, 0, 0) });
      this.addButtonBehavior(selectHit, `Button_PetSelect_${pet.id}`);
    });
    this.addCommercialBottomNav('pet');
  }

  private buildPetDetail(): void {
    const save = gameLogic.getSnapshot().save;
    const selectedPetId = this.getSelectedPetId();
    const selectedPet = selectedPetId ? save.pets.find((pet) => pet.id === selectedPetId) : undefined;
    const selectedConfig = selectedPet ? gameLogic.repo.getPet(selectedPet.id) : undefined;
    const nextCost = selectedConfig && selectedPet ? gameLogic.progression.getPetUpgradeCost(selectedConfig, selectedPet.level) : null;
    const petName = this.getPetDisplayName(selectedPet?.id ?? 'pet_black_cat');
    this.addNightBackground('Bg_PetDetail');
    this.addCommercialRouteBackdrop('PetDetail');
    this.addWoodHeader('宠物详情');
    this.addIconButton('Button_PetDetailClose', '×', 318, 570);

    this.addRect({ name: 'PetDetail_PortraitFrame', width: 326, height: 418, x: -178, y: 236, fill: new Color(23, 26, 24, 215), border: UIColors.successGreen, borderSize: 7 });
    this.addRect({ name: 'PetDetail_MoonGlow', width: 286, height: 286, x: -178, y: 262, fill: new Color(255, 226, 138, 46) });
    this.addText({ name: 'PetDetail_CrescentMoon', value: '☾', x: -260, y: 360, width: 86, height: 96, fontSize: 78, color: new Color(255, 226, 138, 220), outline: true });
    this.addText({ name: 'PetDetail_StageStars', value: '✦    ✦  ✦', x: -172, y: 392, width: 214, height: 34, fontSize: 24, color: UIColors.highlightGold, outline: true });
    this.addCharacterStand('PetDetail_PortraitCat', -178, 246, 224, 250, petName);
    this.addText({ name: 'PetDetail_PedestalHint', value: '月夜守护', x: -178, y: 54, width: 180, height: 30, fontSize: 22, color: UIColors.highlightGold, outline: true });
    this.addRect({ name: 'PetDetail_InfoPanel', width: 262, height: 148, x: 190, y: 344, fill: new Color(23, 26, 24, 228), border: UIColors.actionBlue, borderSize: 6 });
    this.addRect({ name: 'PetDetail_RarityBadge', width: 88, height: 34, x: 108, y: 392, fill: UIColors.actionBlue, border: UIColors.woodStroke, borderSize: 2, label: '稀有', fontSize: 20, textColor: UIColors.whiteText, outline: true });
    this.addText({ name: 'PetDetail_Name', value: `${petName}\nLv.${selectedPet?.level ?? 8}`, x: 196, y: 340, width: 212, height: 84, fontSize: 35, color: UIColors.highlightGold, wrap: true, outline: true });
    this.addRect({ name: 'PetDetail_StarRow', width: 262, height: 58, x: 190, y: 238, fill: new Color(23, 26, 24, 218), border: UIColors.purpleGem, borderSize: 5, label: '★ ★ ★ ★ ☆', fontSize: 35, textColor: UIColors.buttonGold, outline: true });
    this.addRect({ name: 'PetDetail_AttributePanel', width: 262, height: 174, x: 190, y: 104, fill: new Color(23, 26, 24, 228), border: UIColors.woodStroke, borderSize: 5 });
    const petPower = selectedConfig ? selectedConfig.basePower + Math.max(0, (selectedPet?.level ?? 1) - 1) * selectedConfig.powerPerLevel : 0;
    this.addText({ name: 'PetDetail_Attributes', value: `属性\n战力        ${petPower}\n等级        ${selectedPet?.level ?? 1}\n星级        ${selectedPet?.stars ?? 0}\n碎片        ${selectedPet?.fragments ?? 0}`, x: 190, y: 104, width: 218, height: 144, fontSize: 22, color: UIColors.whiteText, wrap: true, outline: true });
    this.addRect({ name: 'PetDetail_SkillPanel', width: 584, height: 104, x: 0, y: -60, fill: new Color(23, 26, 24, 230), border: UIColors.purpleGem, borderSize: 6 });
    this.addText({ name: 'PetDetail_SkillText', value: '夜巡加护：战斗金币 +8%\n影爪猫在夜间巡逻，伙伴获得金币加成效果。', x: 50, y: -60, width: 430, height: 74, fontSize: 23, color: UIColors.whiteText, wrap: true, align: 'left', outline: true });
    this.addRect({ name: 'PetDetail_SkillIcon', width: 76, height: 76, x: -238, y: -60, fill: UIColors.purpleGem, border: UIColors.woodStroke, borderSize: 4, label: '爪', fontSize: 30, textColor: UIColors.whiteText, outline: true });
    this.addRect({ name: 'PetDetail_MaterialPanel', width: 650, height: 76, x: 0, y: -176, fill: new Color(23, 26, 24, 230), border: UIColors.blueGem, borderSize: 5 });
    this.addText({ name: 'PetDetail_MaterialTitle', value: '升级材料', x: -260, y: -176, width: 130, height: 34, fontSize: 24, color: UIColors.whiteText, outline: true });
    const materialCount = save.inventory.find((item) => item.itemId === 'pet_material_common')?.count ?? 0;
    const materialNeeded = nextCost?.petMaterial ?? 0;
    this.addProgressBar('PetDetail_MaterialProgress', 42, -176, 320, 24, materialNeeded > 0 ? Math.min(1, materialCount / materialNeeded) : 1, UIColors.successGreen);
    this.addText({ name: 'PetDetail_MaterialCount', value: nextCost ? `${materialCount}/${materialNeeded}` : '已满级', x: 42, y: -176, width: 130, height: 26, fontSize: 20, color: UIColors.whiteText, outline: true });
    this.addButton('Button_PetDetailUpgrade', selectedPet?.owned ? nextCost ? '升级' : '已满级' : '未解锁', -214, -284, 174, 82, selectedPet?.owned ? UIColors.buttonGold : UIColors.woodLight, UIColors.woodStroke, 29);
    this.addButton('Button_PetDetailDeploy', selectedPet?.deployed ? '出战中' : '设为出战', 0, -284, 208, 82, selectedPet?.deployed ? UIColors.buttonGold : UIColors.successGreen, UIColors.woodStroke, 30);
    this.addButton('Button_PetDetailBackList', '返回列表', 222, -284, 206, 82, UIColors.actionBlue, UIColors.woodStroke, 30);
    this.addRect({ name: 'PetDetail_EvolutionPreview', width: 650, height: 128, x: 0, y: -426, fill: new Color(23, 26, 24, 218), border: UIColors.warningRed, borderSize: 5 });
    this.addText({ name: 'PetDetail_EvolutionText', value: '当前形态       ➜       夜影猫\n★ ★ ??        ☆ ☆ ☆ ☆ ☆', x: 0, y: -426, width: 560, height: 88, fontSize: 22, color: UIColors.highlightGold, wrap: true, outline: true });
  }

  private buildTalent(): void {
    const save = gameLogic.getSnapshot().save;
    const selectedTalentNodeId = this.getSelectedTalentNodeId();
    const selectedTalentConfig = selectedTalentNodeId ? gameLogic.repo.getTalent(selectedTalentNodeId) : null;
    const selectedTalentSave = selectedTalentNodeId ? save.talents.find((row) => row.id === selectedTalentNodeId) : undefined;
    const selectedTalentLevel = selectedTalentSave?.level ?? 0;
    const nextTalentCost = selectedTalentConfig ? selectedTalentConfig.costPerLevel[selectedTalentLevel] ?? null : null;
    this.addNightBackground('Bg_Talent');
    this.addCommercialRouteBackdrop('Talent');
    this.addWoodHeader('天赋');
    this.addTabs(['攻击', '防御', '通用'], ['Attack', 'Defense', 'Common'], 0, 468, 668, 76, 0);
    this.addRect({ name: 'Talent_PointPanel', width: 690, height: 86, x: 0, y: 350, fill: new Color(23, 26, 24, 226), border: UIColors.woodStroke, borderSize: 6, label: `可用天赋点：${save.progress.talentPoints}`, fontSize: 31, textColor: UIColors.highlightGold, outline: true });
    this.addRect({ name: 'Talent_TreePanel', width: 690, height: 648, x: 0, y: -10, fill: new Color(18, 26, 28, 224), border: UIColors.woodStroke, borderSize: 8 });
    this.addRect({ name: 'Talent_DetailPanel', width: 690, height: 132, x: 0, y: -360, fill: new Color(239, 205, 157, 246), border: UIColors.woodStroke, borderSize: 7 });
    this.addText({ name: 'Talent_DetailTitle', value: selectedTalentConfig ? `${this.getTalentDisplayName(selectedTalentConfig.id)}  Lv.${selectedTalentLevel}/${selectedTalentConfig.maxLevel}` : '选择一个天赋节点', x: 0, y: -334, width: 594, height: 34, fontSize: 23, color: UIColors.textBrown });
    this.addText({ name: 'Talent_DetailHint', value: selectedTalentConfig ? `消耗：${nextTalentCost ?? 0} 天赋点。${selectedTalentConfig.requires.length > 0 ? '需要先点亮前置节点。' : '可作为前期开局强化。'}` : '点击天赋树节点后再学习或重置。', x: 0, y: -380, width: 594, height: 32, fontSize: 21, color: new Color(94, 61, 38, 255) });
    const talentNodes = gameLogic.repo.configs.talents.nodes;
    const branchOrder = ['attack', 'defense', 'utility'] as const;
    const branchLabels = { attack: '攻击', defense: '防御', utility: '通用' } as const;
    const branchColumns = { attack: -218, defense: 0, utility: 218 } as const;
    const maxBranchCount = Math.max(...branchOrder.map((branch) => talentNodes.filter((node) => node.branch === branch).length));
    const nodeGap = 148;
    const talentContentHeight = Math.max(920, 356 + Math.max(0, maxBranchCount - 1) * nodeGap + 210);
    const contentTop = talentContentHeight / 2;
    this.addScrollPanel('Talent_Tree', 0, -10, 650, 590, talentContentHeight, () => {
      branchOrder.forEach((branch) => {
        const x = branchColumns[branch];
        this.addRect({ name: `Talent_BranchHeader_${branch}`, width: 154, height: 44, x, y: contentTop - 48, fill: UIColors.wood, border: UIColors.woodStroke, borderSize: 4, label: branchLabels[branch], fontSize: 24, textColor: UIColors.whiteText, outline: true });
        const branchNodes = talentNodes.filter((node) => node.branch === branch);
        branchNodes.forEach((node, index) => {
          const y = contentTop - 146 - index * nodeGap;
          if (index > 0) {
            this.addRect({ name: `Talent_PathLine_${node.id}`, width: 14, height: 48, x, y: y + nodeGap / 2, fill: new Color(255, 211, 109, 230), border: new Color(80, 46, 24, 210), borderSize: 2 });
          }
          const saved = save.talents.find((row) => row.id === node.id);
          const level = saved?.level ?? 0;
          const learned = level > 0;
          const selected = node.id === selectedTalentNodeId;
          const nextCost = node.costPerLevel[level] ?? null;
          this.addRect({ name: `Talent_Node_${node.id}`, width: 122, height: 122, x, y, fill: learned ? UIColors.buttonGold : new Color(82, 72, 58, 232), border: selected ? UIColors.actionBlue : learned ? UIColors.highlightGold : UIColors.woodStroke, borderSize: selected ? 9 : learned ? 8 : 6 });
          this.addRect({ name: `Talent_NodeAura_${node.id}`, width: 92, height: 92, x, y: y + 8, fill: learned ? new Color(255, 230, 140, 70) : new Color(8, 14, 16, 80) });
          this.addText({ name: `Talent_Label_${node.id}`, value: `${this.getTalentDisplayName(node.id)}\nLv.${level}/${node.maxLevel}`, x, y: y + 12, width: 104, height: 58, fontSize: 21, color: learned ? UIColors.textBrown : UIColors.whiteText, outline: !learned, wrap: true });
          this.addText({ name: `Talent_NodeDesc_${node.id}`, value: nextCost === null ? '已满级' : `${this.getTalentEffectSummary(node.id)} · ${nextCost}点`, x, y: y - 52, width: 122, height: 30, fontSize: 15, color: learned ? UIColors.textBrown : new Color(232, 222, 198, 230), outline: !learned, wrap: true });
          if (selected) {
            this.addRect({ name: `Talent_SelectedRing_${node.id}`, width: 138, height: 138, x, y, fill: new Color(255, 255, 255, 28), border: UIColors.actionBlue, borderSize: 3 });
          }
          const selectHit = this.addRect({ name: `Button_TalentSelect_${node.id}`, width: 132, height: 132, x, y, fill: new Color(0, 0, 0, 0) });
          this.addButtonBehavior(selectHit, `Button_TalentSelect_${node.id}`);
        });
      });
    });
    this.addRect({ name: 'Talent_TreeScrollBar', width: 18, height: 520, x: 322, y: -10, fill: new Color(196, 154, 96, 120), border: new Color(146, 91, 48, 180), borderSize: 2 });
    this.addRect({ name: 'Talent_TreeScrollThumb', width: 14, height: 160, x: 322, y: 150, fill: new Color(255, 238, 206, 240), border: UIColors.woodStroke, borderSize: 2 });
    this.addButton('Button_TalentLearn', selectedTalentConfig && selectedTalentLevel >= selectedTalentConfig.maxLevel ? '已满级' : '学习/升级', -118, -502, 284, 70, UIColors.buttonGold, UIColors.woodStroke, 30);
    this.addButton('Button_TalentReset', '重置本系', 190, -502, 230, 70, UIColors.woodLight, UIColors.woodStroke, 27);
    this.addCommercialBottomNav('talent');
  }

  private buildSettings(): void {
    const settings = gameLogic.getSnapshot().save.settings;
    this.addNightBackground('Bg_Settings');
    this.addCommercialRouteBackdrop('Settings');
    this.addWoodHeader('设置');
    this.addRect({ name: 'Settings_MainPanel', width: 690, height: 772, x: 0, y: 24, fill: new Color(239, 205, 157, 248), border: UIColors.woodStroke, borderSize: 8 });
    this.addSettingsRow('Music', '背景音乐', settings.musicEnabled ? '开启' : '关闭', 272);
    this.addSettingsRow('Sfx', '音效', settings.soundEnabled ? '开启' : '关闭', 156);
    this.addSettingsRow('Vibrate', '震动', settings.vibrationEnabled ? '开启' : '关闭', 40);
    this.addSettingsRow('PowerSave', '省电模式', settings.powerSavingEnabled ? '开启' : '关闭', -76);
    this.addSettingsRow('Privacy', '隐私协议', '查看', -192);
    this.addSettingsRow('Service', '客服与反馈', '联系客服', -308);
    this.addRect({ name: 'Settings_VersionPanel', width: 620, height: 54, x: 0, y: -404, fill: UIColors.wood, border: UIColors.woodStroke, borderSize: 4, label: `当前版本    V${versionConfig.appVersion}`, fontSize: 24, textColor: UIColors.whiteText, outline: true });
    this.addButton('Button_SettingsLogout', '清理缓存并重新登录', 0, -492, 440, 76, UIColors.actionBlue, UIColors.woodStroke, 28);
    this.addRect({ name: 'Settings_SafeNotice', width: 620, height: 54, x: 0, y: -584, fill: new Color(12, 18, 18, 180), border: new Color(220, 220, 220, 110), borderSize: 3, label: '账户安全检测中...', fontSize: 22, textColor: UIColors.whiteText, outline: true });
  }

  private buildMailDetail(): void {
    const selectedMail = this.getSelectedMail();
    const attachments = selectedMail?.attachments ?? [];
    const hasClaimableAttachment = Boolean(selectedMail && attachments.length > 0 && !selectedMail.claimed);
    const canDelete = Boolean(selectedMail && (selectedMail.claimed || attachments.length === 0));
    this.buildMail();
    this.addRect({ name: 'MailDetail_MaskLayer', width: DESIGN_WIDTH, height: DESIGN_HEIGHT, x: 0, y: 0, fill: new Color(0, 0, 0, 146) });
    this.addRect({ name: 'MailDetail_Drawer', width: 520, height: 874, x: 84, y: -10, fill: new Color(247, 225, 188, 252), border: UIColors.woodStroke, borderSize: 9 });
    this.addRect({ name: 'MailDetail_TitleHeader', width: 332, height: 86, x: 84, y: 396, fill: UIColors.wood, border: UIColors.woodStroke, borderSize: 7, label: '邮件详情', fontSize: 42, textColor: UIColors.whiteText, outline: true });
    this.addButton('Button_MailDetailClose', '×', 324, 396, 70, 70, UIColors.wood, UIColors.woodStroke, 33);
    this.addRect({ name: 'MailDetail_InfoPanel', width: 430, height: 128, x: 84, y: 278, fill: UIColors.parchment, border: new Color(146, 91, 48, 255), borderSize: 5 });
    this.addRect({ name: 'MailDetail_EnvelopeIcon', width: 72, height: 72, x: -92, y: 278, fill: Color.WHITE, border: UIColors.woodStroke, borderSize: 3 });
    this.addText({ name: 'MailDetail_Title', value: selectedMail?.title ?? '暂无邮件', x: 116, y: 306, width: 272, height: 36, fontSize: 30, color: UIColors.textBrown, align: 'left' });
    this.addText({ name: 'MailDetail_Meta', value: selectedMail ? `发件人：营地管家\n状态：${selectedMail.claimed ? '已处理' : selectedMail.read ? '已读' : '未读'}` : '发件人：营地管家\n状态：无可查看邮件', x: 116, y: 260, width: 272, height: 54, fontSize: 21, color: new Color(94, 61, 38, 255), align: 'left', wrap: true });
    this.addRect({ name: 'MailDetail_ContentPanel', width: 430, height: 230, x: 84, y: 86, fill: new Color(255, 240, 206, 248), border: new Color(188, 134, 76, 255), borderSize: 4 });
    const mailBody = selectedMail?.body ?? '当前没有可查看的邮件。完成任务或参与活动后，奖励和公告会显示在这里。';
    const mailBodyHeight = this.estimateWrappedTextHeight(mailBody, 346, 24, 5, 22);
    const mailContentHeight = Math.max(178, mailBodyHeight + 28);
    this.addScrollPanel('MailDetail_Content', 84, 90, 364, 178, mailContentHeight, () => {
      const textNode = this.addText({ name: 'MailDetail_Content', value: mailBody, x: 0, y: mailContentHeight / 2 - mailBodyHeight / 2 - 14, width: 346, height: mailBodyHeight, fontSize: 24, color: UIColors.textBrown, align: 'left', verticalAlign: 'top', wrap: true });
      const label = textNode.getComponent(Label);
      if (label) {
        label.overflow = Label.Overflow.RESIZE_HEIGHT;
      }
    });
    this.addRect({ name: 'MailDetail_ContentScrollBar', width: 14, height: 162, x: 282, y: 90, fill: new Color(196, 154, 96, 120), border: new Color(146, 91, 48, 180), borderSize: 2 });
    this.addRect({ name: 'MailDetail_ContentScrollThumb', width: 10, height: Math.max(42, Math.min(132, 162 * (178 / mailContentHeight))), x: 282, y: 134, fill: new Color(255, 238, 206, 240), border: UIColors.woodStroke, borderSize: 2 });
    this.addRect({ name: 'MailDetail_RewardContainer', width: 430, height: 172, x: 84, y: -160, fill: new Color(255, 240, 206, 248), border: UIColors.warningRed, borderSize: 4 });
    this.addText({ name: 'MailDetail_RewardTitle', value: '附件奖励', x: 84, y: -80, width: 180, height: 30, fontSize: 25, color: UIColors.textBrown });
    if (attachments.length > 0) {
      attachments.slice(0, 3).forEach((reward, index) => {
        const display = this.getRewardDisplay(reward);
        this.addCompactRewardCard(`MailDetail_RewardCard_${index}_${this.normalizeNodeKey(reward.id)}`, -40 + index * 124, -164, display.title, display.amount, display.spriteKey);
      });
    } else {
      this.addText({ name: 'MailDetail_NoAttachment', value: '无附件', x: 84, y: -164, width: 220, height: 40, fontSize: 28, color: UIColors.textBrown });
    }
    this.addButton('Button_MailDetailClaim', selectedMail?.claimed ? '已处理' : hasClaimableAttachment ? '领取附件' : '标为已读', -42, -356, 174, 74, selectedMail?.claimed ? UIColors.woodLight : UIColors.successGreen, UIColors.woodStroke, 28);
    this.addButton('Button_MailDetailReply', '回复/查看公告', 130, -356, 190, 74, UIColors.actionBlue, UIColors.woodStroke, 24);
    this.addButton('Button_MailDetailDelete', canDelete ? '删除' : '先领取', 292, -356, 126, 74, canDelete ? UIColors.warningRed : UIColors.woodLight, UIColors.woodStroke, 27);
    this.addText({ name: 'MailDetail_FooterTip', value: canDelete ? '已处理或无附件邮件可以删除' : '含未领取附件，先领取后再删除', x: 84, y: -418, width: 360, height: 28, fontSize: 20, color: UIColors.highlightGold, outline: true });
  }

  private buildPolicyModal(): void {
    this.buildLogin();
    this.addRect({ name: 'Policy_MaskLayer', width: DESIGN_WIDTH, height: DESIGN_HEIGHT, x: 0, y: 0, fill: new Color(0, 0, 0, 122) });
    this.addRect({ name: 'Policy_Modal', width: 568, height: 940, x: 70, y: 12, fill: new Color(247, 225, 188, 252), border: UIColors.woodStroke, borderSize: 9 });
    this.addRect({ name: 'Policy_Header', width: 420, height: 88, x: 70, y: 434, fill: UIColors.wood, border: UIColors.woodStroke, borderSize: 7, label: '用户协议与隐私政策', fontSize: 35, textColor: UIColors.whiteText, outline: true });
    this.addButton('Button_PolicyClose', '×', 324, 432, 70, 70, UIColors.wood, UIColors.woodStroke, 33);
    this.addRect({ name: 'Policy_Tab_User', width: 204, height: 58, x: -42, y: 340, fill: UIColors.buttonGold, border: UIColors.woodStroke, borderSize: 5, label: '用户协议', fontSize: 26, textColor: UIColors.whiteText, outline: true });
    this.addRect({ name: 'Policy_Tab_Privacy', width: 204, height: 58, x: 184, y: 340, fill: UIColors.wood, border: UIColors.woodStroke, borderSize: 5, label: '隐私政策', fontSize: 26, textColor: UIColors.whiteText, outline: true });
    this.addRect({ name: 'Policy_ScrollTextArea', width: 500, height: 558, x: 70, y: 34, fill: new Color(255, 240, 206, 248), border: new Color(188, 134, 76, 255), borderSize: 4 });
    this.addText({ name: 'Policy_Text', value: '一、服务条款\n欢迎使用《猫猫背包守夜》游戏及相关服务。本协议是您与我们之间关于使用本游戏及服务所订立的条款，请您仔细阅读。\n\n二、用户行为规范\n您在使用本服务过程中不得利用外挂、脚本等不正当手段影响游戏公平性。\n\n三、知识产权保护\n本游戏内容包括文字、图像、音效、程序等，均受法律保护。\n\n四、免责声明\n本游戏将尽力提供稳定服务，并提醒您合理安排时间。', x: 58, y: 38, width: 412, height: 486, fontSize: 21, color: UIColors.textBrown, align: 'left', wrap: true });
    this.addRect({ name: 'Policy_ScrollBar', width: 18, height: 468, x: 306, y: 34, fill: new Color(196, 154, 96, 120), border: new Color(146, 91, 48, 180), borderSize: 2 });
    this.addRect({ name: 'Policy_ScrollThumb', width: 14, height: 116, x: 306, y: 244, fill: new Color(255, 238, 206, 240), border: UIColors.woodStroke, borderSize: 2 });
    this.addRect({ name: 'Policy_CheckboxAgree', width: 42, height: 42, x: -134, y: -284, fill: new Color(255, 244, 205, 245), border: UIColors.woodStroke, borderSize: 4 });
    this.addText({ name: 'Policy_AgreeText', value: '我已阅读并同意《用户协议》和《隐私政策》', x: 110, y: -284, width: 420, height: 36, fontSize: 23, color: UIColors.textBrown, align: 'left' });
    this.addButton('Button_PolicyAgree', '同意并继续', -54, -386, 210, 78, UIColors.buttonGold, UIColors.woodStroke, 30);
    this.addButton('Button_PolicyDisagree', '暂不同意', 194, -386, 190, 78, UIColors.wood, UIColors.woodStroke, 28);
  }

  private buildConfirmModal(): void {
    this.buildHome();
    this.addRect({ name: 'Confirm_MaskLayer', width: DESIGN_WIDTH, height: DESIGN_HEIGHT, x: 0, y: 0, fill: new Color(0, 0, 0, 150) });
    this.addRect({ name: 'Confirm_Modal', width: 512, height: 560, x: 0, y: 4, fill: new Color(247, 225, 188, 252), border: UIColors.woodStroke, borderSize: 9 });
    this.addRect({ name: 'Confirm_TitleBar', width: 314, height: 86, x: 0, y: 252, fill: UIColors.wood, border: UIColors.woodStroke, borderSize: 7, label: '确认操作', fontSize: 42, textColor: UIColors.whiteText, outline: true });
    this.addButton('Button_ConfirmClose', '×', 244, 246, 70, 70, UIColors.wood, UIColors.woodStroke, 33);
    this.addRect({ name: 'Confirm_WarningIcon', width: 104, height: 104, x: 0, y: 118, fill: UIColors.buttonGold, border: UIColors.woodStroke, borderSize: 5, label: '!', fontSize: 64, textColor: UIColors.warningRed, outline: true });
    this.addText({ name: 'Confirm_MessageText', value: '是否消耗 200 爪币开启武器宝箱？', x: 0, y: 8, width: 420, height: 50, fontSize: 28, color: UIColors.textBrown, wrap: true });
    this.addRect({ name: 'Confirm_CostRow', width: 318, height: 68, x: 0, y: -72, fill: new Color(156, 110, 58, 230), border: new Color(255, 236, 168, 180), borderSize: 3 });
    this.addRect({ name: 'Confirm_CostIcon_rt_icon_paw_coin', width: 52, height: 52, x: -96, y: -72, fill: Color.WHITE });
    this.addText({ name: 'Confirm_CostValue', value: '200', x: 22, y: -72, width: 130, height: 42, fontSize: 34, color: UIColors.whiteText, outline: true });
    this.addButton('Button_ConfirmCancel', '取消', -126, -212, 180, 82, UIColors.wood, UIColors.woodStroke, 32);
    this.addButton('Button_ConfirmOk', '确定', 126, -212, 180, 82, UIColors.buttonGold, UIColors.woodStroke, 32);
    this.addText({ name: 'Confirm_DangerTip', value: '* 该操作不可撤销', x: 0, y: -314, width: 360, height: 32, fontSize: 22, color: UIColors.warningRed, outline: true });
  }

  private buildToastModal(): void {
    this.buildHome();
    this.addRect({ name: 'ToastLayer', width: DESIGN_WIDTH, height: DESIGN_HEIGHT, x: 0, y: 0, fill: new Color(0, 0, 0, 0) });
    this.addRect({ name: 'ToastCard_Info', width: 520, height: 74, x: 0, y: 260, fill: new Color(19, 30, 42, 238), border: UIColors.actionBlue, borderSize: 5 });
    this.addRect({ name: 'ToastIcon_Info', width: 48, height: 48, x: -218, y: 260, fill: UIColors.actionBlue, border: UIColors.whiteText, borderSize: 2, label: 'i', fontSize: 30, textColor: UIColors.whiteText, outline: true });
    this.addText({ name: 'ToastText_Info', value: '请先阅读并同意用户协议', x: 46, y: 260, width: 390, height: 40, fontSize: 25, color: UIColors.whiteText, align: 'left', outline: true });
    this.addRect({ name: 'ToastCard_Success', width: 520, height: 74, x: 0, y: 166, fill: new Color(18, 42, 24, 238), border: UIColors.successGreen, borderSize: 5 });
    this.addRect({ name: 'ToastIcon_Success', width: 48, height: 48, x: -218, y: 166, fill: UIColors.successGreen, border: UIColors.whiteText, borderSize: 2, label: '✓', fontSize: 29, textColor: UIColors.whiteText, outline: true });
    this.addText({ name: 'ToastText_Success', value: '奖励已领取', x: 46, y: 166, width: 390, height: 40, fontSize: 25, color: UIColors.whiteText, align: 'left', outline: true });
    this.addRect({ name: 'ToastCard_Warning', width: 520, height: 74, x: 0, y: 72, fill: new Color(46, 34, 12, 238), border: UIColors.buttonGold, borderSize: 5 });
    this.addRect({ name: 'ToastIcon_Warning', width: 48, height: 48, x: -218, y: 72, fill: UIColors.buttonGold, border: UIColors.woodStroke, borderSize: 2, label: '!', fontSize: 31, textColor: UIColors.woodStroke, outline: false });
    this.addText({ name: 'ToastText_Warning', value: '金币不足', x: 46, y: 72, width: 390, height: 40, fontSize: 25, color: UIColors.highlightGold, align: 'left', outline: true });
    this.addRect({ name: 'ToastCard_Error', width: 520, height: 74, x: 0, y: -22, fill: new Color(52, 18, 18, 238), border: UIColors.warningRed, borderSize: 5 });
    this.addRect({ name: 'ToastIcon_Error', width: 48, height: 48, x: -218, y: -22, fill: UIColors.warningRed, border: UIColors.whiteText, borderSize: 2, label: '!', fontSize: 31, textColor: UIColors.whiteText, outline: true });
    this.addText({ name: 'ToastText_Error', value: '网络异常，请稍后重试', x: 46, y: -22, width: 390, height: 40, fontSize: 25, color: UIColors.whiteText, align: 'left', outline: true });
    this.addRect({ name: 'ToastRewardFly_Gold', width: 62, height: 62, x: -118, y: -560, fill: Color.WHITE, label: '+100', fontSize: 20, textColor: UIColors.whiteText });
    this.addRect({ name: 'ToastRewardFly_Gem', width: 62, height: 62, x: 86, y: -560, fill: Color.WHITE, label: '+20', fontSize: 20, textColor: UIColors.whiteText });
    this.addRect({ name: 'ToastAutoDismissTimer', width: 176, height: 44, x: 222, y: -586, fill: new Color(20, 20, 18, 230), border: UIColors.woodStroke, borderSize: 3, label: '自动消失：2.0s', fontSize: 19, textColor: UIColors.whiteText, outline: true });
  }

  private buildPlaceholder(title: string, summary: string): void {
    this.addNightBackground(`Bg_${title}`);
    this.addWoodHeader(title);
    this.addRect({ name: 'Placeholder_MainPanel', width: 650, height: 780, x: 0, y: 35, fill: new Color(23, 26, 24, 220), border: UIColors.woodStroke, label: summary, fontSize: 32, wrap: true });
    this.addButton('Button_BackHome', '返回主页', 0, -500, 320, 86, UIColors.actionBlue, UIColors.woodStroke, 34);
  }

  private buildPauseModal(): void {
    this.addBattleModalBackdrop('Pause');
    this.addRect({ name: 'Pause_MaskLayer', width: DESIGN_WIDTH, height: DESIGN_HEIGHT, x: 0, y: 0, fill: new Color(0, 0, 0, 122) });
    this.addRect({ name: 'Pause_Panel', width: 462, height: 654, x: 0, y: -28, fill: new Color(247, 225, 188, 250), border: UIColors.woodStroke, borderSize: 10 });
    this.addRect({ name: 'Pause_PaperBacking', width: 424, height: 602, x: 0, y: -40, fill: new Color(255, 235, 196, 245) });
    this.addRect({ name: 'Pause_TitleHeader', width: 298, height: 92, x: 0, y: 258, fill: UIColors.wood, border: UIColors.woodStroke, borderSize: 7, label: '暂 停', fontSize: 52, textColor: UIColors.whiteText, outline: true });
    this.addButton('Button_PauseClose', '×', 244, 252, 72, 72, UIColors.wood, UIColors.woodStroke, 34);
    this.addText({ name: 'Pause_Message', value: '战斗已暂停，继续战斗或返回营地都不会结算本波奖励', x: 0, y: 160, width: 360, height: 74, fontSize: 26, color: UIColors.textBrown, wrap: true });
    this.addPauseToggleRow('Music', '♫', '背景音乐', '开', 70, true);
    this.addPauseToggleRow('Sound', '♪', '游戏音效', '开', 0, true);
    this.addPauseToggleRow('Vibrate', '▯', '震动提示', '关', -70, false);
    this.addButton('Button_PauseContinue', '继续战斗', 0, -204, 350, 88, UIColors.buttonGold, UIColors.woodStroke, 40);
    this.addButton('Button_PauseRestart', '重新开始', -112, -316, 172, 74, UIColors.actionBlue, UIColors.woodStroke, 27);
    this.addButton('Button_PauseHome', '返回营地', 112, -316, 172, 74, UIColors.warningRed, UIColors.woodStroke, 27);
  }

  private buildVictoryReward(): void {
    this.addResultBackdrop('Victory');
    this.addCommercialRouteBackdrop('Reward');
    this.addRect({ name: 'Reward_TitleBanner', width: 560, height: 132, x: 0, y: 480, fill: UIColors.buttonGold, border: UIColors.woodStroke, borderSize: 9, label: '胜 利', fontSize: 76, textColor: UIColors.whiteText, outline: true });
    this.addText({ name: 'Reward_Star_1', value: '★', x: -118, y: 352, width: 94, height: 92, fontSize: 82, color: UIColors.buttonGold, outline: true });
    this.addText({ name: 'Reward_Star_2', value: '★', x: 0, y: 352, width: 94, height: 92, fontSize: 88, color: UIColors.buttonGold, outline: true });
    this.addText({ name: 'Reward_Star_3', value: '★', x: 118, y: 352, width: 94, height: 92, fontSize: 82, color: UIColors.buttonGold, outline: true });
    this.addCharacterStand('Reward_VictoryHero', -214, 118, 214, 260, '胜利猫');
    this.addRect({ name: 'Reward_Chest_rt_item_chest', width: 188, height: 156, x: 190, y: 112, fill: new Color(255, 255, 255, 0) });
    this.addRect({ name: 'Reward_CoinFly_rt_icon_gold', width: 54, height: 54, x: 60, y: 182, fill: Color.WHITE });
    this.addRect({ name: 'Reward_GemFly_rt_icon_purple_gem', width: 58, height: 58, x: 114, y: 238, fill: Color.WHITE });
    this.addRect({ name: 'Reward_SummaryPanel', width: 600, height: 96, x: 0, y: -94, fill: new Color(92, 57, 31, 238), border: UIColors.woodStroke, borderSize: 7 });
    this.addText({ name: 'Reward_SummaryTitle', value: '守夜结算', x: 0, y: -70, width: 220, height: 42, fontSize: 34, color: UIColors.highlightGold, outline: true });
    this.addText({ name: 'Reward_SummaryDesc', value: '月影森林  第10波    通关时间 02:35', x: 0, y: -116, width: 520, height: 34, fontSize: 24, color: UIColors.whiteText, outline: true });
    this.addRect({ name: 'Reward_ListPanel', width: 650, height: 190, x: 0, y: -270, fill: new Color(247, 225, 188, 250), border: UIColors.woodStroke, borderSize: 7 });
    this.addCompactRewardCard('Reward_Card_Gold', -240, -270, '金币', '+500', 'rt_icon_gold');
    this.addCompactRewardCard('Reward_Card_Diamond', -80, -270, '钻石', '+20', 'rt_icon_purple_gem');
    this.addCompactRewardCard('Reward_Card_Equip', 80, -270, '装备', '鱼骨弩', 'rt_item_weapon_fishbone_bow');
    this.addCompactRewardCard('Reward_Card_Chest', 240, -270, '宝箱', 'x1', 'rt_item_chest');
    this.addRect({ name: 'Reward_DoubleBadge', width: 430, height: 54, x: 0, y: -414, fill: UIColors.warningRed, border: UIColors.highlightGold, borderSize: 4, label: '观看广告可双倍领取！', fontSize: 28, textColor: UIColors.whiteText, outline: true });
    this.addButton('Button_RewardDouble', '▶ 双倍领取', -158, -520, 270, 90, UIColors.successGreen, UIColors.woodStroke, 34);
    this.addButton('Button_RewardConfirm', '确定', 168, -520, 250, 90, UIColors.buttonGold, UIColors.woodStroke, 38);
    this.addText({ name: 'Reward_BackpackHint', value: '★ 奖励将自动发送到背包 ★', x: 0, y: -612, width: 520, height: 32, fontSize: 22, color: UIColors.highlightGold, outline: true });
  }

  private buildDefeatReward(): void {
    this.addResultBackdrop('Defeat');
    this.addRect({ name: 'Defeat_TitleBanner', width: 520, height: 126, x: 0, y: 476, fill: UIColors.wood, border: UIColors.woodStroke, borderSize: 9, label: '挑战失败', fontSize: 64, textColor: new Color(220, 220, 220, 255), outline: true });
    this.addCharacterStand('Defeat_HeroCat', -206, 120, 238, 292, '失落猫');
    this.addRect({ name: 'Defeat_BrokenShield', width: 142, height: 116, x: -245, y: -142, fill: new Color(70, 70, 72, 230), border: UIColors.woodStroke, borderSize: 5, label: '盾', fontSize: 38, textColor: UIColors.whiteText, outline: true });
    this.addRect({ name: 'Defeat_Campfire', width: 142, height: 106, x: -92, y: -148, fill: new Color(255, 122, 26, 72), border: UIColors.woodStroke, borderSize: 5, label: '火', fontSize: 36, textColor: UIColors.highlightGold, outline: true });
    this.addRect({ name: 'Defeat_SummaryPanel', width: 318, height: 162, x: 150, y: 204, fill: new Color(247, 225, 188, 250), border: UIColors.woodStroke, borderSize: 7 });
    this.addText({ name: 'Defeat_SummaryTitle', value: '守夜结算', x: 150, y: 258, width: 210, height: 38, fontSize: 30, color: UIColors.highlightGold, outline: true });
    this.addText({ name: 'Defeat_SummaryBody', value: '你坚持到了第 10 波\n营地耐久已耗尽', x: 150, y: 196, width: 260, height: 72, fontSize: 25, color: UIColors.textBrown, wrap: true, outline: false });
    this.addRect({ name: 'Defeat_RewardPanel', width: 318, height: 184, x: 150, y: 10, fill: new Color(50, 32, 20, 230), border: UIColors.woodStroke, borderSize: 7 });
    this.addText({ name: 'Defeat_RewardTitle', value: '安慰奖励', x: 150, y: 86, width: 220, height: 34, fontSize: 28, color: UIColors.highlightGold, outline: true });
    this.addCompactRewardCard('Defeat_Card_Gold', 78, -8, '金币', '+120', 'rt_icon_gold');
    this.addCompactRewardCard('Defeat_Card_Stone', 220, -8, '强化石', '+3', 'rt_item_enhance_stone');
    this.addRect({ name: 'Defeat_SuggestionPanel', width: 336, height: 204, x: 150, y: -214, fill: new Color(247, 225, 188, 250), border: UIColors.woodStroke, borderSize: 7 });
    this.addText({ name: 'Defeat_SuggestionTitle', value: '成长建议', x: 150, y: -128, width: 220, height: 30, fontSize: 26, color: UIColors.highlightGold, outline: true });
    this.addSuggestionCard('Defeat_SuggestWeapon', 48, -224, '升级武器', '提升攻击力', 'rt_item_weapon_sword');
    this.addSuggestionCard('Defeat_SuggestPet', 150, -224, '喂养宠物', '提升助战属性', 'rt_avatar_cat');
    this.addSuggestionCard('Defeat_SuggestTalent', 252, -224, '学习天赋', '解锁强力天赋', 'rt_item_scroll');
    this.addButton('Button_DefeatRetry', '⚔ 再次挑战', -218, -488, 214, 78, UIColors.buttonGold, UIColors.woodStroke, 28);
    this.addButton('Button_DefeatUpgrade', '去强化', 0, -488, 196, 78, UIColors.actionBlue, UIColors.woodStroke, 30);
    this.addButton('Button_DefeatHome', '⌂ 返回营地', 222, -488, 214, 78, UIColors.wood, UIColors.woodStroke, 27);
    this.addText({ name: 'Defeat_HintText', value: '💡 失败是成长的开始，明天一定能守住营地！', x: 0, y: -584, width: 620, height: 32, fontSize: 22, color: UIColors.highlightGold, outline: true });
  }

  private buildSkillChoice(): void {
    this.addBattleModalBackdrop('SkillChoice');
    this.addCommercialRouteBackdrop('SkillChoice');
    this.addRect({ name: 'SkillChoice_MaskLayer', width: DESIGN_WIDTH, height: DESIGN_HEIGHT, x: 0, y: 0, fill: new Color(0, 0, 0, 126) });
    this.addRect({ name: 'SkillChoice_Title', width: 420, height: 90, x: -10, y: 500, fill: UIColors.wood, border: UIColors.woodStroke, borderSize: 8, label: '选择一个技能', fontSize: 46, outline: true });
    this.addText({ name: 'SkillChoice_Subtitle', value: '选择后立即生效，本轮战斗仅出现一次', x: -8, y: 440, width: 520, height: 34, fontSize: 23, color: UIColors.highlightGold, outline: true });
    this.addButton('Button_SkillChoiceClose', '×', 318, 500, 74, 74, UIColors.wood, UIColors.woodStroke, 34);
    this.addSkillCard('SkillCard_1', -225, '火焰强化', '火焰伤害提高 40%\n持续 6 秒', '稀有', '伤害', 'rt_battle_weapon_gold_sword');
    this.addSkillCard('SkillCard_2', 0, '攻击速度', '攻击速度提高 25%\n持续 5 秒', '普通', '节奏', 'rt_battle_weapon_bow');
    this.addSkillCard('SkillCard_3', 225, '暴击率', '暴击率提高 15%\n持续 8 秒', '史诗', '爆发', 'rt_item_bomb');
    this.addButton('Button_RefreshVideo', '▶ 刷新技能   钻 20', -78, -382, 286, 72, UIColors.actionBlue, UIColors.woodStroke, 28);
    this.addRect({ name: 'SkillChoice_RerollChip', width: 154, height: 54, x: 212, y: -382, fill: new Color(23, 26, 24, 230), border: UIColors.highlightGold, borderSize: 3, label: '剩余刷新 1 次', fontSize: 20, textColor: UIColors.highlightGold, outline: true });
    this.addRect({ name: 'SkillChoice_ForceTip', width: 496, height: 50, x: -2, y: -458, fill: new Color(63, 28, 18, 235), border: UIColors.warningRed, borderSize: 4, label: '⚠ 必须选择一个技能才能继续战斗', fontSize: 24, textColor: UIColors.highlightGold, outline: true });
    this.addRect({ name: 'SkillChoice_BottomWeaponBar', width: 704, height: 126, x: 0, y: -592, fill: new Color(18, 20, 20, 245), border: UIColors.woodStroke, borderSize: 6 });
    [-300, -204, -108, -12, 84, 180].forEach((x, index) => {
      const keys: Array<RuntimeSpriteAssetKey | undefined> = ['rt_battle_weapon_sword', 'rt_battle_weapon_bow', 'rt_battle_weapon_spear', 'rt_item_bomb', 'rt_battle_weapon_orb', 'rt_battle_weapon_orb'];
      this.addBattleWeaponSlot(`SkillChoice_BattleWeapon_${index + 1}`, x, -592, keys[index], 1);
    });
    this.addButton('Button_SkillChoiceAutoMerge', '自动\n合成', 304, -592, 98, 108, UIColors.wood, UIColors.woodStroke, 24);
  }

  private addTopPlayerBar(): void {
    const snapshot = gameLogic.getSnapshot();
    const save = snapshot.save;
    const playerName = this.normalizeDisplayName(save.player.nickname);
    const expRatio = save.player.expMax > 0 ? save.player.exp / save.player.expMax : 0;

    this.addRect({ name: 'Home_PlayerPlate', width: 210, height: 104, x: -268, y: 570, fill: new Color(20, 24, 24, 230), border: UIColors.woodStroke, borderSize: 6 });
    this.addRect({ name: 'Home_Avatar', width: 88, height: 88, x: -328, y: 570, fill: new Color(120, 120, 110, 240), border: UIColors.parchment, borderSize: 5 });
    this.addText({ name: 'Home_PlayerName', value: playerName, x: -218, y: 596, width: 112, height: 34, fontSize: 22, color: UIColors.whiteText, align: 'left' });
    this.addText({ name: 'Home_PlayerLevel', value: `Lv.${save.player.level}`, x: -252, y: 556, width: 72, height: 30, fontSize: 23, color: UIColors.highlightGold, align: 'left' });
    this.addProgressBar('Home_ExpBar', -196, 552, 94, 16, expRatio, UIColors.buttonGold);
    this.addResourcePill('Gold', formatCompactNumber(save.currencies.gold), -64, 590, UIColors.buttonGold, '金');
    this.addResourcePill('Diamond', formatCompactNumber(save.currencies.purpleGem), 106, 590, UIColors.purpleGem, '钻');
    this.addResourcePill('Energy', `${save.currencies.energy}/${gameLogic.getSnapshot().battlePreparation.energyMax}`, 276, 590, UIColors.buttonGold, '体');
  }

  private addNightBackground(name: string): void {
    this.addRect({ name, width: DESIGN_WIDTH, height: DESIGN_HEIGHT, x: 0, y: 0, fill: UIColors.nightBlue });
    this.addRect({ name: `${name}_TopShade`, width: DESIGN_WIDTH, height: 230, x: 0, y: 525, fill: new Color(0, 0, 0, 58) });
    this.addRect({ name: `${name}_BottomShade`, width: DESIGN_WIDTH, height: 280, x: 0, y: -510, fill: new Color(0, 0, 0, 45) });
  }

  private addCommercialRouteBackdrop(key: string): void {
    this.addRect({ name: `RouteBackdrop_${key}_Canopy`, width: DESIGN_WIDTH, height: 186, x: 0, y: 454, fill: new Color(6, 12, 16, 108) });
    this.addRect({ name: `RouteBackdrop_${key}_Horizon`, width: DESIGN_WIDTH, height: 178, x: 0, y: -70, fill: new Color(7, 24, 28, 96) });
    this.addRect({ name: `RouteBackdrop_${key}_Ground`, width: DESIGN_WIDTH, height: 284, x: 0, y: -518, fill: new Color(9, 16, 14, 118) });
    this.addRect({ name: `RouteBackdrop_${key}_LeftFrame`, width: 34, height: 960, x: -360, y: -36, fill: new Color(76, 45, 24, 150), border: new Color(255, 213, 126, 70), borderSize: 2 });
    this.addRect({ name: `RouteBackdrop_${key}_RightFrame`, width: 34, height: 960, x: 360, y: -36, fill: new Color(76, 45, 24, 150), border: new Color(255, 213, 126, 70), borderSize: 2 });
    this.addRect({ name: `RouteBackdrop_${key}_TopTrim`, width: 690, height: 10, x: 0, y: 510, fill: new Color(255, 211, 109, 82) });
    this.addRect({ name: `RouteBackdrop_${key}_FloorTrim`, width: 640, height: 12, x: 0, y: -520, fill: new Color(255, 174, 72, 64) });
    this.addRect({ name: `RouteBackdrop_${key}_LeftLantern`, width: 42, height: 118, x: -326, y: 350, fill: new Color(255, 166, 64, 118), border: UIColors.woodStroke, borderSize: 3 });
    this.addRect({ name: `RouteBackdrop_${key}_RightLantern`, width: 42, height: 118, x: 326, y: 350, fill: new Color(255, 166, 64, 102), border: UIColors.woodStroke, borderSize: 3 });
    this.addRect({ name: `RouteBackdrop_${key}_MistA`, width: 560, height: 36, x: -72, y: -456, fill: new Color(142, 169, 166, 36) });
    this.addRect({ name: `RouteBackdrop_${key}_MistB`, width: 430, height: 28, x: 86, y: -486, fill: new Color(142, 169, 166, 30) });
  }

  private addBattleModalBackdrop(key: string): void {
    const snapshot = gameLogic.getSnapshot();
    const wave = this.battleState?.wave ?? snapshot.save.progress.currentWave;
    const secondsLeft = this.battleState?.secondsLeft ?? 45;
    const campHp = this.battleState?.campHp ?? 10;
    const campHpMax = this.battleState?.campHpMax ?? 10;
    const previewDamage = Math.max(48, Math.round(snapshot.battlePreparation.myPower / 9));

    this.addNightBackground(`Bg_${key}_BattleDim`);
    this.addRect({ name: `${key}_Battle_FieldArt`, width: DESIGN_WIDTH, height: 920, x: 0, y: 25, fill: new Color(255, 255, 255, 0) });
    this.addRect({ name: `${key}_Battle_TopDim`, width: DESIGN_WIDTH, height: 176, x: 0, y: 580, fill: new Color(4, 10, 14, 140) });
    this.addRect({ name: `${key}_WavePlate`, width: 210, height: 48, x: 0, y: 612, fill: new Color(23, 26, 24, 230), border: UIColors.woodStroke, borderSize: 4, label: `🐾 第 ${wave} 波 🐾`, fontSize: 23, textColor: UIColors.highlightGold, outline: true });
    this.addRect({ name: `${key}_TimerPlate`, width: 152, height: 42, x: 0, y: 562, fill: new Color(23, 26, 24, 230), border: UIColors.woodStroke, borderSize: 3, label: `⏱ ${this.formatSeconds(secondsLeft)}`, fontSize: 22, textColor: UIColors.whiteText, outline: true });
    this.addButton(`${key}_PauseButtonFrozen`, 'Ⅱ', 318, 586, 64, 64, UIColors.actionBlue, UIColors.woodStroke, 28);
    this.addRect({ name: `${key}_HPHeart`, width: 48, height: 48, x: -292, y: 486, fill: UIColors.warningRed, border: UIColors.woodStroke, borderSize: 3, label: '♥', fontSize: 26 });
    this.addProgressBar(`${key}_HPBar`, 0, 486, 480, 28, campHpMax > 0 ? campHp / campHpMax : 0, UIColors.successGreen);
    this.addText({ name: `${key}_HPText`, value: `${Math.ceil(campHp)}/${Math.ceil(campHpMax)}`, x: 0, y: 486, width: 140, height: 28, fontSize: 21, color: UIColors.whiteText, outline: true });
    this.addCharacterStand(`${key}_BattleModal_HeroCat`, -260, 142, 168, 210, '守夜');
    this.addRect({ name: `${key}_BattleModal_rt_monster_ghost`, width: 84, height: 96, x: 126, y: 162, fill: new Color(255, 255, 255, 0) });
    this.addRect({ name: `${key}_BattleModal_rt_monster_skeleton`, width: 108, height: 126, x: 226, y: 222, fill: new Color(255, 255, 255, 0) });
    this.addRect({ name: `${key}_BattleModal_rt_monster_goblin`, width: 110, height: 122, x: 252, y: 64, fill: new Color(255, 255, 255, 0) });
    this.addText({ name: `${key}_BattleDamage_Preview`, value: `${previewDamage}`, x: 80, y: 244, width: 80, height: 38, fontSize: 30, color: UIColors.buttonGold, outline: true });
    this.addRect({ name: `${key}_SideAutoMerge`, width: 72, height: 86, x: 320, y: -10, fill: UIColors.wood, border: UIColors.woodStroke, borderSize: 4, label: '自动', fontSize: 22, textColor: UIColors.whiteText, outline: true });
    this.addRect({ name: `${key}_SideSpeed`, width: 72, height: 86, x: 320, y: -106, fill: UIColors.wood, border: UIColors.woodStroke, borderSize: 4, label: 'x2\n倍速', fontSize: 19, textColor: UIColors.highlightGold, outline: true });
    this.addRect({ name: `${key}_SideHome`, width: 72, height: 86, x: 320, y: -202, fill: UIColors.wood, border: UIColors.woodStroke, borderSize: 4, label: '撤退', fontSize: 20, textColor: UIColors.whiteText, outline: true });
  }

  private addPauseToggleRow(key: string, icon: string, title: string, state: string, y: number, enabled: boolean): void {
    this.addRect({ name: `Pause_SettingsRow_${key}`, width: 330, height: 58, x: 0, y, fill: new Color(255, 244, 210, 210), border: new Color(149, 98, 54, 120), borderSize: 2 });
    this.addText({ name: `Pause_SettingsIcon_${key}`, value: icon, x: -132, y, width: 44, height: 42, fontSize: 31, color: UIColors.textBrown, outline: false });
    this.addText({ name: `Pause_SettingsTitle_${key}`, value: title, x: -38, y, width: 150, height: 34, fontSize: 25, color: UIColors.textBrown, align: 'left' });
    const toggleName = enabled ? `Button_PauseToggleOn_${key}` : `Button_PauseToggleOff_${key}`;
    this.addButton(toggleName, state, 124, y, 94, 44, enabled ? UIColors.successGreen : UIColors.wood, UIColors.woodStroke, 22);
  }

  private addResultBackdrop(key: 'Victory' | 'Defeat'): void {
    this.addNightBackground(`Bg_Result${key}`);
    this.addRect({ name: `${key}_Result_Battle_FieldArt`, width: DESIGN_WIDTH, height: DESIGN_HEIGHT, x: 0, y: 0, fill: new Color(255, 255, 255, 0) });
    this.addRect({ name: `${key}_ResultDim`, width: DESIGN_WIDTH, height: DESIGN_HEIGHT, x: 0, y: 0, fill: key === 'Victory' ? new Color(0, 0, 0, 66) : new Color(0, 0, 0, 112) });
    this.addRect({ name: `${key}_ResultGlow`, width: 650, height: 300, x: 0, y: 190, fill: key === 'Victory' ? new Color(255, 194, 79, 36) : new Color(32, 38, 40, 120) });
  }

  private addCompactRewardCard(name: string, x: number, y: number, title: string, amount: string, spriteKey: RuntimeSpriteAssetKey): void {
    this.addRect({ name, width: 128, height: 158, x, y, fill: UIColors.parchment, border: UIColors.highlightGold, borderSize: 5 });
    this.addText({ name: `${name}_Title`, value: title, x, y: y + 56, width: 112, height: 28, fontSize: 22, color: UIColors.textBrown });
    this.addRect({ name: `${name}_${spriteKey}`, width: 72, height: 72, x, y: y + 6, fill: Color.WHITE });
    this.addText({ name: `${name}_Amount`, value: amount, x, y: y - 58, width: 110, height: 28, fontSize: 23, color: new Color(118, 70, 34, 255), outline: false });
  }

  private getRewardDisplay(reward: RewardPayload): { title: string; amount: string; spriteKey: RuntimeSpriteAssetKey } {
    if (reward.kind === 'currency') {
      const currency: Partial<Record<string, { title: string; spriteKey: RuntimeSpriteAssetKey }>> = {
        gold: { title: '金币', spriteKey: 'rt_icon_gold' },
        purpleGem: { title: '钻石', spriteKey: 'rt_icon_purple_gem' },
        blueGem: { title: '蓝宝石', spriteKey: 'rt_icon_blue_gem' },
        energy: { title: '体力', spriteKey: 'rt_icon_energy' },
        pawCoin: { title: '爪币', spriteKey: 'rt_icon_paw_coin' },
      };
      const display = currency[reward.id] ?? { title: reward.id, spriteKey: 'rt_icon_gold' as RuntimeSpriteAssetKey };
      return { ...display, amount: `+${reward.amount}` };
    }

    if (reward.kind === 'weapon') {
      return { title: '武器', amount: `Lv.${reward.level ?? 1} x${reward.amount}`, spriteKey: 'rt_item_weapon_fishbone_bow' };
    }

    if (reward.kind === 'petMaterial') {
      return { title: '宠物粮', amount: `x${reward.amount}`, spriteKey: 'rt_item_lantern' };
    }

    if (reward.kind === 'talentPoint') {
      return { title: '天赋点', amount: `+${reward.amount}`, spriteKey: 'rt_item_scroll' };
    }

    return { title: this.getItemDisplayName(reward.id), amount: `x${reward.amount}`, spriteKey: reward.id.includes('chest') ? 'rt_item_chest' : 'rt_item_weapon_chest' };
  }

  private addSuggestionCard(name: string, x: number, y: number, title: string, desc: string, spriteKey: RuntimeSpriteAssetKey): void {
    this.addRect({ name, width: 86, height: 128, x, y, fill: UIColors.parchment, border: UIColors.woodStroke, borderSize: 4 });
    this.addRect({ name: `${name}_${spriteKey}`, width: 48, height: 48, x, y: y + 28, fill: Color.WHITE });
    this.addText({ name: `${name}_Title`, value: title, x, y: y - 12, width: 78, height: 24, fontSize: 18, color: UIColors.textBrown });
    this.addText({ name: `${name}_Desc`, value: desc, x, y: y - 42, width: 76, height: 36, fontSize: 14, color: UIColors.textBrown, wrap: true });
  }

  private addStars(): void {
    const points = [
      [-282, 475, 14], [-186, 535, 8], [-72, 500, 10], [72, 528, 8], [204, 486, 12],
      [290, 338, 8], [-312, 120, 9], [292, -16, 8], [-260, -285, 7], [58, -290, 7],
    ];
    points.forEach(([x, y, size], index) => {
      this.addRect({ name: `Star_${index}`, width: size, height: size, x, y, fill: UIColors.highlightGold });
    });
  }

  private addWoodHeader(title: string): void {
    this.addRect({ name: `Header_${title}`, width: 690, height: 106, x: 0, y: 570, fill: UIColors.wood, border: UIColors.woodStroke, label: title, fontSize: 54, outline: true });
    this.addIconButton(`Button_Back_${title}`, '←', -320, 570);
    this.addIconButton(`Button_Close_${title}`, '×', 320, 570);
  }

  private addResourcePill(kind: ResourceKind | string, value: string, x: number, y: number, iconColor: Color, iconText?: string): void {
    const name = `ResourcePill_${kind}`;
    this.addRect({ name, width: 150, height: 56, x, y, fill: new Color(23, 26, 24, 230), border: UIColors.woodStroke, borderSize: 5 });
    this.addRect({ name: `ResourceIcon_${kind}`, width: 44, height: 44, x: x - 50, y, fill: iconColor, border: UIColors.highlightGold, borderSize: 3, label: iconText ?? value.slice(0, 1), fontSize: 20 });
    this.addText({ name: `ResourceValue_${kind}`, value, x: x + 22, y: y - 1, width: 74, height: 38, fontSize: 25, color: UIColors.whiteText });
  }

  private addSideEntry(key: string, text: string, x: number, y: number, alert: boolean): void {
    const node = this.addRect({ name: `SideEntry_${key}`, width: 96, height: 100, x, y, fill: new Color(92, 57, 31, 240), border: new Color(255, 226, 154, 180), borderSize: 6 });
    const button = node.addComponent(Button);
    button.target = node;
    button.transition = Button.Transition.SCALE;
    button.duration = 0.08;
    button.zoomScale = 0.96;
    this.bindButtonAction(node, `SideEntry_${key}`);
    this.addRoutedOverlay(`SideIcon_${key}`, `SideEntry_${key}`, 52, 52, x, y + 15, UIColors.buttonGold, { border: UIColors.woodStroke, borderSize: 3 });
    this.addRoutedText({ name: `SideLabel_${key}`, actionName: `SideEntry_${key}`, value: text, x, y: y - 32, width: 76, height: 34, fontSize: 22, color: UIColors.whiteText, outline: true });
    if (alert) {
      this.addRect({ name: `RedDot_${key}`, width: 26, height: 26, x: x + 31, y: y + 33, fill: UIColors.warningRed, border: UIColors.whiteText, borderSize: 2, label: badgeLabel(true), fontSize: 18 });
    }
  }

  private addTopEntry(key: string, text: string, x: number, y: number, alert: boolean): void {
    const actionName = `TopEntry_${key}`;
    const node = this.addRect({ name: actionName, width: 92, height: 92, x, y, fill: new Color(92, 57, 31, 238), border: new Color(255, 226, 154, 180), borderSize: 5 });
    const button = node.addComponent(Button);
    button.target = node;
    button.transition = Button.Transition.SCALE;
    button.duration = 0.08;
    button.zoomScale = 0.96;
    this.bindButtonAction(node, actionName);
    this.addRoutedOverlay(`TopIcon_${key}`, actionName, 54, 54, x, y + 13, UIColors.buttonGold, { border: UIColors.woodStroke, borderSize: 3 });
    this.addRoutedText({ name: `TopLabel_${key}`, actionName, value: text, x, y: y - 34, width: 92, height: 30, fontSize: 20, color: UIColors.whiteText, outline: true });
    if (alert) {
      this.addRect({ name: `RedDot_Top_${key}`, width: 24, height: 24, x: x + 30, y: y + 32, fill: UIColors.warningRed, border: UIColors.whiteText, borderSize: 2, label: badgeLabel(true), fontSize: 16 });
    }
  }

  private addFeatureEntry(side: 'Left' | 'Right', key: string, text: string, x: number, y: number, alert: boolean): void {
    const actionName = `${side}Entry_${key}`;
    const node = this.addRect({ name: actionName, width: 88, height: 98, x, y, fill: new Color(92, 57, 31, 240), border: new Color(255, 226, 154, 180), borderSize: 5 });
    const button = node.addComponent(Button);
    button.target = node;
    button.transition = Button.Transition.SCALE;
    button.duration = 0.08;
    button.zoomScale = 0.96;
    this.bindButtonAction(node, actionName);
    this.addRoutedOverlay(`${side}Icon_${key}`, actionName, 68, 68, x, y + 18, UIColors.buttonGold, { border: UIColors.woodStroke, borderSize: 3 });
    this.addRoutedText({ name: `${side}Label_${key}`, actionName, value: text, x, y: y - 36, width: 82, height: 32, fontSize: 22, color: UIColors.whiteText, outline: true });
    if (alert) {
      this.addRect({ name: `RedDot_${side}_${key}`, width: 24, height: 24, x: x + 29, y: y + 32, fill: UIColors.warningRed, border: UIColors.whiteText, borderSize: 2, label: badgeLabel(true), fontSize: 16 });
    }
  }

  private addStageSelector(title: string, highestWave: number, maxWave: number, waveRatio: number): void {
    this.addRect({ name: 'Home_StageSelector', width: 456, height: 124, x: 0, y: 170, fill: new Color(92, 57, 31, 242), border: new Color(255, 226, 154, 190), borderSize: 8 });
    this.addButton('Button_StagePrev', '<', -190, 170, 58, 58, UIColors.woodLight, UIColors.woodStroke, 34);
    this.addButton('Button_StageNext', '>', 190, 170, 58, 58, UIColors.woodLight, UIColors.woodStroke, 34);
    this.addText({ name: 'Home_CurrentStage', value: title, x: 0, y: 202, width: 310, height: 48, fontSize: 36, color: UIColors.whiteText, outline: true });
    this.addText({ name: 'Home_StageStar_1', value: '☆', x: -64, y: 162, width: 42, height: 42, fontSize: 35, color: UIColors.highlightGold, outline: true });
    this.addText({ name: 'Home_StageStar_2', value: '☆', x: 0, y: 162, width: 42, height: 42, fontSize: 35, color: UIColors.highlightGold, outline: true });
    this.addText({ name: 'Home_StageStar_3', value: '☆', x: 64, y: 162, width: 42, height: 42, fontSize: 35, color: UIColors.highlightGold, outline: true });
    this.addText({ name: 'Home_CurrentWave', value: `第 ${highestWave}/${maxWave} 波`, x: 0, y: 124, width: 340, height: 34, fontSize: 23, color: UIColors.highlightGold, outline: true });
    this.addProgressBar('Home_StageProgressBar', -150, 108, 300, 12, waveRatio, UIColors.buttonGold);
  }

  private addStartBattleCta(energyCost: number): void {
    const node = this.addRect({
      name: 'Button_StartBattle',
      width: 540,
      height: 126,
      x: 0,
      y: -462,
      fill: UIColors.buttonGold,
      border: UIColors.woodStroke,
      borderSize: 8,
    });
    const button = node.addComponent(Button);
    button.target = node;
    button.transition = Button.Transition.SCALE;
    button.duration = 0.08;
    button.zoomScale = 0.96;
    this.bindButtonAction(node, 'Button_StartBattle');
    this.addRoutedOverlay('Button_StartBattle_Highlight', 'Button_StartBattle', 452, 10, 0, -418, new Color(255, 255, 255, 95));
    this.addRoutedText({
      name: 'Button_StartBattle_Title',
      actionName: 'Button_StartBattle',
      value: '开始战斗',
      x: 0,
      y: -442,
      width: 440,
      height: 56,
      fontSize: 48,
      color: UIColors.whiteText,
      outline: true,
    });
    this.addRoutedOverlay('Home_StartBattleCostChip', 'Button_StartBattle', 166, 36, 0, -494, new Color(91, 54, 22, 238), {
      border: new Color(255, 236, 168, 150),
      borderSize: 2,
      label: this.formatEnergyCostLabel(energyCost),
      fontSize: 22,
      textColor: UIColors.highlightGold,
      outline: true,
    });
  }

  private formatEnergyCostLabel(energyCost: number): string {
    return energyCost > 0 ? `体力 x${energyCost}` : '不限体力';
  }

  private addBottomNav(activeKey: NavKey): void {
    this.addRect({ name: 'BottomNavBg', width: 704, height: 124, x: 0, y: -604, fill: new Color(20, 20, 18, 245), border: UIColors.woodStroke, borderSize: 6 });
    const navItems: NavItem[] = [
      { key: 'home', label: '主界面' },
      { key: 'battle', label: '战斗' },
      { key: 'merge', label: '合成' },
      { key: 'explore', label: '探索' },
      { key: 'guild', label: '公会' },
    ];

    navItems.forEach((item, index) => {
      const x = -280 + index * 140;
      const active = item.key === activeKey;
      const node = this.addRect({
        name: `NavButton_${item.key}_${active ? 'Active' : 'Inactive'}`,
        width: 116,
        height: 104,
        x,
        y: -604,
        fill: active ? new Color(80, 58, 30, 245) : new Color(20, 20, 18, 0),
        border: active ? UIColors.highlightGold : new Color(70, 50, 35, 255),
        borderSize: active ? 5 : 3,
      });
      const button = node.addComponent(Button);
      button.target = node;
      button.transition = Button.Transition.SCALE;
      button.duration = 0.08;
      button.zoomScale = 0.96;
      this.bindButtonAction(node, `NavButton_${item.key}`);
      this.addRoutedOverlay(`NavIcon_${item.key}`, `NavButton_${item.key}`, 56, 56, x, -574, active ? UIColors.buttonGold : new Color(120, 105, 82, 230), {
        border: active ? UIColors.highlightGold : UIColors.woodStroke,
        borderSize: 2,
      });
      this.addRoutedText({
        name: `NavLabel_${item.key}`,
        actionName: `NavButton_${item.key}`,
        value: item.label,
        x,
        y: -628,
        width: 96,
        height: 30,
        fontSize: 23,
        color: active ? UIColors.highlightGold : new Color(232, 222, 198, 238),
        outline: active,
      });
    });
  }

  private addCommercialBottomNav(activeKey: 'shop' | 'backpack' | 'battle' | 'pet' | 'talent' | 'settings'): void {
    this.addRect({ name: 'BottomNavBg', width: 704, height: 118, x: 0, y: -604, fill: new Color(20, 20, 18, 245), border: UIColors.woodStroke, borderSize: 6 });
    const navItems = [
      { key: 'shop', label: '商店' },
      { key: 'backpack', label: '背包' },
      { key: 'battle', label: '战斗' },
      { key: 'pet', label: '宠物' },
      { key: 'talent', label: '天赋' },
      { key: 'settings', label: '设置' },
    ] as const;

    navItems.forEach((item, index) => {
      const x = -292 + index * 117;
      const active = item.key === activeKey;
      const node = this.addRect({
        name: `NavButton_${item.key}_${active ? 'Active' : 'Inactive'}`,
        width: 100,
        height: 98,
        x,
        y: -604,
        fill: active ? new Color(80, 58, 30, 245) : new Color(20, 20, 18, 0),
        border: active ? UIColors.highlightGold : new Color(70, 50, 35, 255),
        borderSize: active ? 5 : 3,
      });
      const button = node.addComponent(Button);
      button.target = node;
      button.transition = Button.Transition.SCALE;
      button.duration = 0.08;
      button.zoomScale = 0.96;
      this.bindButtonAction(node, `NavButton_${item.key}`);
      this.addRoutedOverlay(`NavIcon_${item.key}`, `NavButton_${item.key}`, 50, 50, x, -574, active ? UIColors.buttonGold : new Color(120, 105, 82, 230), {
        border: active ? UIColors.highlightGold : UIColors.woodStroke,
        borderSize: 2,
      });
      this.addRoutedText({
        name: `NavLabel_${item.key}`,
        actionName: `NavButton_${item.key}`,
        value: item.label,
        x,
        y: -628,
        width: 88,
        height: 28,
        fontSize: 22,
        color: active ? UIColors.highlightGold : new Color(232, 222, 198, 238),
        outline: active,
      });
    });
  }

  private addRoutedOverlay(
    name: string,
    actionName: string,
    width: number,
    height: number,
    x: number,
    y: number,
    fill: Color,
    options: Partial<Omit<RectOptions, 'name' | 'width' | 'height' | 'x' | 'y' | 'fill'>> = {},
  ): Node {
    const node = this.addRect({ name, width, height, x, y, fill, ...options });
    this.addButtonBehavior(node, actionName);
    return node;
  }

  private addRoutedText(options: TextOptions & { actionName: string }): Node {
    const node = this.addText(options);
    this.addButtonBehavior(node, options.actionName);
    return node;
  }

  private addTabs(labels: string[], keys: string[], x: number, y: number, width: number, height: number, activeIndex: number): void {
    const itemWidth = width / labels.length;
    labels.forEach((label, index) => {
      const active = index === activeIndex;
      this.addRect({
        name: `Tab_${keys[index]}_${active ? 'Active' : 'Inactive'}`,
        width: itemWidth - 10,
        height,
        x: x - width / 2 + itemWidth / 2 + index * itemWidth,
        y,
        fill: active ? UIColors.buttonGold : new Color(77, 52, 35, 245),
        border: UIColors.woodStroke,
        borderSize: 5,
        label,
        fontSize: labels.length > 3 ? 28 : 30,
        textColor: active ? new Color(58, 37, 23, 255) : UIColors.whiteText,
      });
    });
  }

  private addShopCard(item: ShopItemOptions): void {
    this.addRect({ name: `GoodsCard_${item.name}`, width: 214, height: 315, x: item.x, y: item.y, fill: UIColors.parchment, border: UIColors.woodStroke, borderSize: 6 });
    if (item.tag) {
      this.addRect({ name: `GoodsTag_${item.name}`, width: 74, height: 32, x: item.x - 58, y: item.y + 134, fill: UIColors.warningRed, border: UIColors.woodStroke, borderSize: 2, label: item.tag, fontSize: 18 });
    }
    this.addText({ name: `${item.name}_Title`, value: item.title, x: item.x, y: item.y + 112, width: 168, height: 36, fontSize: 30, color: UIColors.textBrown });
    this.addRect({ name: `${item.name}_Icon`, width: 150, height: 150, x: item.x, y: item.y + 13, fill: item.color });
    this.addButton(`${item.name}_Buy`, item.price, item.x, item.y - 120, 176, 58, UIColors.successGreen, UIColors.woodStroke, 25);
  }

  private updateBattleLiveState(): void {
    const battleState = this.battleState;
    if (!battleState || !this.designRoot) {
      return;
    }

    const hpRatio = battleState.campHpMax > 0 ? battleState.campHp / battleState.campHpMax : 0;
    this.setLabelText('Battle_WavePlate_Border', `第 ${battleState.wave} 波`);
    this.setLabelText('Battle_TimerPlate_Border', `⏱ ${this.formatSeconds(battleState.secondsLeft)}`);
    this.setLabelText('Battle_HPText', `${Math.ceil(battleState.campHp)} / ${Math.ceil(battleState.campHpMax)}`);
    this.setLabelText('Battle_KillCounter', `击败 ${battleState.defeatedMonsters}/${battleState.spawnedMonsters}`);
    this.replaceProgressFill('Battle_HPBar', 30, 487, 300, 32, hpRatio, UIColors.successGreen);

    const layer = this.getBattleLiveLayer();
    const keep = new Set<string>();
    this.syncBattleHero(layer, keep, battleState);
    battleState.monsters
      .filter((monster) => monster.alive || (monster.deathAgeSec ?? 0) <= 2.4)
      .sort((a, b) => a.x - b.x)
      .slice(0, 10)
      .forEach((monster, index) => {
        this.syncBattleMonster(layer, keep, monster, index, battleState.elapsedSeconds);
        this.syncBattleMonsterSpriteOverlay(layer, keep, monster, index, battleState.elapsedSeconds, battleState);
      });
    battleState.attackVisuals.slice(-14).forEach((visual) => this.syncBattleAttackVisual(layer, keep, visual, battleState));
    battleState.damageNumbers.slice(-10).forEach((number, index) => this.syncBattleDamageNumber(layer, keep, number, index, battleState));

    const slotPositions = [-292, -174, -56, 62, 180];
    for (let i = 0; i < slotPositions.length; i += 1) {
      const slot = battleState.weaponSlots[i];
      const cooldownRatio = slot ? Math.max(0, Math.min(1, 1 - slot.cooldownLeft / slot.cooldownSec)) : 0;
      this.syncBattleWeaponSlot(layer, keep, `BattleWeapon_Live_${i + 1}`, slotPositions[i], -574, this.getBattleWeaponSpriteKey(slot?.itemId), cooldownRatio);
    }
    this.pruneBattleLiveLayer(layer, keep);
  }

  private getBattleLiveLayer(): Node {
    if (this.battleLiveLayer?.isValid) {
      return this.battleLiveLayer;
    }

    const existing = this.designRoot?.getChildByName('Battle_LiveLayer') ?? null;
    if (existing) {
      this.battleLiveLayer = existing;
      existing.setSiblingIndex(999);
      return existing;
    }

    const layer = new Node('Battle_LiveLayer');
    layer.layer = Layers.Enum.UI_2D;
    layer.parent = this.designRoot ?? this.node;
    const transform = layer.addComponent(UITransform);
    transform.setContentSize(DESIGN_WIDTH, DESIGN_HEIGHT);
    layer.setSiblingIndex(999);
    this.battleLiveLayer = layer;
    return layer;
  }

  private setLabelText(nodeName: string, value: string): void {
    if (!this.designRoot) {
      return;
    }

    const node = this.findNodeDeep(this.designRoot, nodeName);
    const label = node?.getComponent(Label) ?? node?.getChildByName(`Label_${node.name}`)?.getComponent(Label);
    if (label) {
      label.string = value;
    }
  }

  private replaceProgressFill(name: string, x: number, y: number, width: number, height: number, ratio: number, fill: Color): void {
    this.removeNodeByName(`${name}_Fill_Border`);
    this.removeNodeByName(`${name}_Fill`);
    const clamped = Math.max(0, Math.min(1, ratio));
    const fillWidth = Math.max(2, (width - 8) * clamped);
    const fillX = name === 'Battle_HPBar' ? x : x - width / 2 + 4 + fillWidth / 2;
    this.addRect({
      name: `${name}_Fill`,
      width: fillWidth,
      height: Math.max(2, height - 8),
      x: fillX,
      y,
      fill,
    });
  }

  private removeNodeByName(name: string): void {
    if (!this.designRoot) {
      return;
    }

    const node = this.findNodeDeep(this.designRoot, name);
    if (!node) {
      return;
    }
    node.removeFromParent();
    node.destroy();
  }

  private findNodeDeep(root: Node, name: string): Node | null {
    if (root.name === name) {
      return root;
    }
    for (const child of root.children) {
      const found = this.findNodeDeep(child, name);
      if (found) {
        return found;
      }
    }
    return null;
  }

  private syncBattleHero(layer: Node, keep: Set<string>, battleState: BattleSessionState): void {
    const bob = Math.sin(battleState.elapsedSeconds * 5) * 7;
    const swing = Math.sin(battleState.elapsedSeconds * 10) * 12;
    const attackImpulse = this.getBattleHeroAttackImpulse(battleState);
    const heroX = -260 - attackImpulse * 10;
    const heroY = 154 + bob + attackImpulse * 4;
    this.syncLiveRect(layer, keep, 'Battle_HeroShadow_Live', 190 + attackImpulse * 10, 32, -260, 60, new Color(0, 0, 0, 135));
    this.syncLiveRect(layer, keep, 'Battle_HeroAura_Live', 166 + attackImpulse * 12, 190 + attackImpulse * 10, heroX, heroY, new Color(255, 214, 104, 58));
    this.syncLiveRect(layer, keep, 'Battle_HeroBody_Live', 168, 168, heroX, heroY, Color.WHITE, undefined, 24, UIColors.whiteText, 'rt_hero_cat');
    this.syncLiveRect(layer, keep, 'Battle_HeroGlyph_Live', 138, 110, heroX, heroY + 2, new Color(0, 0, 0, 0), '猫', 72, UIColors.whiteText);
    this.syncLiveRect(layer, keep, 'Battle_HeroName_Live', 84, 34, -258, 82 + bob, new Color(16, 20, 19, 210), '守夜', 24, UIColors.whiteText);
    this.syncLiveRect(layer, keep, 'Battle_HeroWeapon_Live', 132 + attackImpulse * 22, 14 + attackImpulse * 5, -188 + swing - attackImpulse * 12, 134 + bob + attackImpulse * 4, UIColors.highlightGold);
  }

  private syncBattleMonster(layer: Node, keep: Set<string>, monster: BattleSessionState['monsters'][number], index: number, elapsedSeconds: number): void {
    const x = 28 + monster.x * 126 + Math.sin(elapsedSeconds * 4 + index) * 34;
    const laneY = 74 - (index % 4) * 60;
    const step = Math.sin(elapsedSeconds * 8 + index) * 6;
    const hpRatio = monster.hpMax > 0 ? monster.hp / monster.hpMax : 0;
    const config = gameLogic.repo.getMonster(monster.monsterId);
    const elite = monster.monsterId.includes('elite') || monster.hpMax > (config?.baseHp ?? monster.hpMax) * 1.8;
    const name = `Battle_Monster_${this.normalizeNodeKey(monster.uid)}`;
    const deathRatio = monster.alive ? 0 : Math.min(1, (monster.deathAgeSec ?? 0) / 2.4);
    const size = (elite ? 112 : 94) * (monster.alive ? 1 : Math.max(0.42, 1 - deathRatio * 0.42));
    const bodyY = laneY + step + deathRatio * 20;
    const alpha = monster.alive ? 250 : Math.max(95, 235 - deathRatio * 140);
    const monsterColor = monster.alive ? this.getMonsterColor(monster.monsterId, elite) : new Color(120, 112, 108, alpha);
    this.syncLiveRect(layer, keep, `${name}_Shadow`, size + 24, 24, x, laneY - 45, new Color(0, 0, 0, monster.alive ? 135 : 80));
    this.syncLiveRect(layer, keep, `${name}_Outline`, size + 12, size + 12, x, bodyY, new Color(14, 16, 18, Math.max(90, alpha - 20)));
    this.syncLiveRect(layer, keep, `${name}_Body`, size, size, x, bodyY, monsterColor, monster.alive ? this.getMonsterGlyph(monster.monsterId) : '×', elite ? 36 : 32);
    this.syncLiveRect(layer, keep, `${name}_Eyes`, Math.max(22, size * 0.34), 12, x + size * 0.1, bodyY + size * 0.1, new Color(255, 227, 92, monster.alive ? 245 : 110));
    this.syncLiveRect(layer, keep, `${name}_Glyph`, 190, 150, x, bodyY + 2, new Color(0, 0, 0, 0), monster.alive ? this.getMonsterGlyph(monster.monsterId) : '×', elite ? 104 : 94, UIColors.whiteText);
    this.syncLiveRect(layer, keep, `${name}_Step`, 70, 32, x - 36 + Math.sin(elapsedSeconds * 12 + index) * 18, bodyY - 56, new Color(0, 0, 0, 0), '—', 42, UIColors.highlightGold);
    this.syncLiveRect(layer, keep, `${name}_HpBg`, 88, 12, x, laneY - 62, new Color(45, 22, 18, 220));
    this.syncLiveRect(layer, keep, `${name}_HpFill`, Math.max(3, 88 * hpRatio), 8, x - 44 + Math.max(3, 88 * hpRatio) / 2, laneY - 62, UIColors.warningRed);
  }

  private syncBattleMonsterSpriteOverlay(layer: Node, keep: Set<string>, monster: BattleSessionState['monsters'][number], index: number, elapsedSeconds: number, battleState: BattleSessionState): void {
    const spriteKey = this.getBattleMonsterSpriteKey(monster.monsterId);
    if (!spriteKey) {
      return;
    }
    const { x, bodyY, size } = this.getBattleMonsterPosition(monster, index, elapsedSeconds);
    const deathRatio = monster.alive ? 0 : Math.min(1, (monster.deathAgeSec ?? 0) / 2.4);
    const hitImpulse = this.getBattleMonsterHitImpulse(monster.uid, battleState);
    const hitShake = hitImpulse * Math.sin(elapsedSeconds * 58 + index) * 9;
    const visualSize = size * (monster.alive ? 1.08 : Math.max(0.5, 1 - deathRatio * 0.35));
    this.syncLiveRect(layer, keep, `Battle_MonsterSprite_${this.normalizeNodeKey(monster.uid)}`, visualSize * (1 + hitImpulse * 0.08), visualSize * (1 + hitImpulse * 0.08), x + hitShake, bodyY + hitImpulse * 5, Color.WHITE, undefined, 24, UIColors.whiteText, spriteKey);
    if (hitImpulse > 0) {
      this.syncLiveRect(layer, keep, `Battle_MonsterHitFlash_${this.normalizeNodeKey(monster.uid)}`, visualSize * 0.78, visualSize * 0.78, x + hitShake, bodyY + 8, new Color(255, 236, 142, Math.floor(hitImpulse * 120)));
    }
  }

  private syncBattleAttackVisual(layer: Node, keep: Set<string>, visual: BattleSessionState['attackVisuals'][number], battleState: BattleSessionState): void {
    const targetPositions = visual.targetUids
      .map((targetUid) => {
        const index = battleState.monsters.findIndex((monster) => monster.uid === targetUid);
        const monster = battleState.monsters[index];
        return monster ? this.getBattleMonsterPosition(monster, Math.max(0, index), battleState.elapsedSeconds) : null;
      })
      .filter((position): position is { x: number; laneY: number; bodyY: number; size: number } => Boolean(position));
    if (targetPositions.length === 0) {
      return;
    }

    const progress = Math.max(0, Math.min(1, visual.ageSec / visual.lifeSec));
    const travelProgress = Math.max(0, Math.min(1, progress / 0.7));
    const hitProgress = Math.max(0, Math.min(1, (progress - 0.62) / 0.38));
    const projectileAlpha = Math.max(0, Math.floor(255 * (1 - Math.max(0, progress - 0.58) / 0.42)));
    const hitAlpha = Math.max(0, Math.floor(255 * (1 - hitProgress)));
    const muzzleAlpha = Math.max(0, Math.floor(255 * (1 - Math.min(1, progress / 0.22))));
    const baseName = `Battle_Attack_${this.normalizeNodeKey(visual.id)}`;
    const originX = -184;
    const originY = 150 + Math.sin(battleState.elapsedSeconds * 10) * 8;
    const first = targetPositions[0];
    const easedTravel = 1 - Math.pow(1 - travelProgress, 2);
    const midX = originX + (first.x - originX) * easedTravel;
    const midY = originY + (first.bodyY - originY) * easedTravel;
    const flash = visual.critical ? UIColors.highlightGold : new Color(255, 156, 44, hitAlpha);
    const trailWidth = Math.max(16, Math.abs(midX - originX));
    const trailX = originX + (midX - originX) / 2;
    const trailY = originY + (midY - originY) / 2;

    if (muzzleAlpha > 0) {
      this.syncLiveRect(layer, keep, `${baseName}_MuzzleFlash`, 34 + progress * 34, 34 + progress * 34, originX, originY, new Color(255, 207, 86, muzzleAlpha));
    }

    if (visual.weaponType === 'melee') {
      this.syncLiveRect(layer, keep, `${baseName}_Battle_Attack_Slash`, 132 + 36 * progress, 132 + 36 * progress, first.x - 28 + 18 * progress, first.bodyY + 18, Color.WHITE, undefined, 24, UIColors.whiteText, 'rt_fx_slash');
    } else if (visual.weaponType === 'pierce') {
      const last = targetPositions[targetPositions.length - 1] ?? first;
      this.syncLiveRect(layer, keep, `${baseName}_Battle_Attack_Pierce`, Math.max(130, last.x - originX + 84), 54, originX + (last.x - originX) / 2, first.bodyY, Color.WHITE, undefined, 24, UIColors.whiteText, 'rt_fx_pierce');
    } else if (visual.weaponType === 'magic') {
      this.syncLiveRect(layer, keep, `${baseName}_MagicTrail`, trailWidth, 10, trailX, trailY, new Color(148, 88, 255, Math.max(0, projectileAlpha - 45)));
      this.syncLiveRect(layer, keep, `${baseName}_Battle_Attack_Staff`, 86, 68, midX, midY, Color.WHITE, undefined, 24, UIColors.whiteText, 'rt_fx_magic_orb');
      if (hitProgress > 0) {
        this.syncLiveRect(layer, keep, `${baseName}_Rune`, 106, 106, first.x, first.bodyY, new Color(142, 92, 255, Math.floor(hitAlpha * 0.52)));
      }
    } else {
      const randomLane = visual.targetRule === 'random';
      this.syncLiveRect(layer, keep, `${baseName}_FlightTrail`, trailWidth, 8, trailX, trailY, new Color(255, 197, 72, Math.max(0, projectileAlpha - 35)));
      this.syncLiveRect(layer, keep, `${baseName}_${randomLane ? 'Battle_Attack_Random' : 'Battle_Attack_Arrow'}`, 104, 40, midX, midY, Color.WHITE, undefined, 24, UIColors.whiteText, 'rt_fx_bullet');
      if (randomLane && targetPositions.length > 1) {
        targetPositions.slice(1).forEach((position, index) => {
          const forkProgress = Math.max(0, Math.min(1, easedTravel - index * 0.08));
          const forkX = originX + (position.x - originX) * forkProgress;
          const forkY = originY + (position.bodyY - originY) * forkProgress;
          this.syncLiveRect(layer, keep, `${baseName}_Battle_Attack_RandomFork_${index}`, 82, 34, forkX, forkY, Color.WHITE, undefined, 20, UIColors.whiteText, 'rt_fx_bullet');
        });
      }
    }

    if (hitProgress <= 0) {
      return;
    }
    targetPositions.forEach((position, index) => {
      const hitScale = 0.7 + hitProgress * 0.72;
      this.syncLiveRect(layer, keep, `${baseName}_Hit_${index}`, 72 * hitScale, 72 * hitScale, position.x, position.bodyY + 8, Color.WHITE, undefined, 24, UIColors.whiteText, 'rt_fx_hit');
      this.syncLiveRect(layer, keep, `${baseName}_Flash_${index}`, 38, 38, position.x + 12, position.bodyY + 16, flash);
    });
  }

  private syncBattleDamageNumber(layer: Node, keep: Set<string>, number: BattleSessionState['damageNumbers'][number], index: number, battleState: BattleSessionState | null): void {
    const monster = battleState?.monsters.find((row) => row.uid === number.monsterUid);
    const monsterIndex = battleState?.monsters.findIndex((row) => row.uid === number.monsterUid) ?? index;
    const fallbackX = 130 + (index % 3) * 72;
    const fallbackY = 240 - Math.floor(index / 3) * 92;
    const x = monster ? -126 + monster.x * 438 + 12 : fallbackX;
    const y = monster ? 338 - (Math.max(0, monsterIndex) % 5) * 78 + number.ageSec * 34 : fallbackY + number.ageSec * 34;
    this.syncLiveRect(
      layer,
      keep,
      `Battle_Damage_${this.normalizeNodeKey(number.id)}`,
      124,
      48,
      x,
      y,
      new Color(0, 0, 0, 0),
      `${number.critical ? '暴' : ''}${number.value}`,
      number.critical ? 40 : 32,
      number.critical ? UIColors.highlightGold : new Color(255, 155, 36, 255),
    );
  }

  private syncBattleWeaponSlot(layer: Node, keep: Set<string>, name: string, x: number, y: number, spriteKey: RuntimeSpriteAssetKey | undefined, cooldownRatio: number): void {
    this.syncLiveRect(layer, keep, `${name}_Slot`, 106, 116, x, y, new Color(22, 23, 23, 238));
    if (spriteKey) {
      this.syncLiveRect(layer, keep, `${name}_Icon`, 82, 82, x, y + 17, Color.WHITE, undefined, 28, UIColors.textBrown, spriteKey);
    } else {
      this.syncLiveRect(layer, keep, `${name}_EmptyMark`, 58, 58, x, y + 8, new Color(0, 0, 0, 65));
    }
    if (cooldownRatio > 0 && cooldownRatio < 1) {
      this.syncLiveRect(layer, keep, `${name}_CooldownBg`, 74, 12, x, y - 44, new Color(50, 35, 24, 230));
      this.syncLiveRect(layer, keep, `${name}_CooldownFill`, Math.max(2, 74 * cooldownRatio), 8, x - 37 + Math.max(2, 74 * cooldownRatio) / 2, y - 44, UIColors.buttonGold);
    }
  }

  private syncLiveRect(
    parent: Node,
    keep: Set<string>,
    name: string,
    width: number,
    height: number,
    x: number,
    y: number,
    fill: Color,
    label?: string,
    fontSize = 24,
    textColor: Color = UIColors.whiteText,
    spriteKey?: RuntimeSpriteAssetKey,
  ): Node {
    keep.add(name);
    let node = parent.getChildByName(name);
    if (!node) {
      node = new Node(name);
      node.layer = Layers.Enum.UI_2D;
      node.parent = parent;
      const sprite = node.addComponent(Sprite);
      const spriteFrame = builtinResMgr.get<SpriteFrame>('builtin-2d-sprite');
      if (spriteFrame) {
        sprite.spriteFrame = spriteFrame;
      }
      sprite.sizeMode = Sprite.SizeMode.CUSTOM;
    }
    node.setPosition(x, y, 0);
    const transform = node.getComponent(UITransform) ?? node.addComponent(UITransform);
    transform.setContentSize(Math.max(1, width), Math.max(1, height));
    const sprite = node.getComponent(Sprite);
    if (sprite) {
      sprite.color = fill;
      sprite.sizeMode = Sprite.SizeMode.CUSTOM;
      this.applyRuntimeSpriteKey(sprite, spriteKey);
    }

    const labelName = `Label_${name}`;
    let labelNode = node.getChildByName(labelName);
    if (label === undefined) {
      labelNode?.removeFromParent();
      labelNode?.destroy();
      return node;
    }
    if (!labelNode) {
      labelNode = new Node(labelName);
      labelNode.layer = Layers.Enum.UI_2D;
      labelNode.parent = node;
      labelNode.addComponent(UITransform);
      labelNode.addComponent(Label);
    }
    const labelTransform = labelNode.getComponent(UITransform) ?? labelNode.addComponent(UITransform);
    labelTransform.setContentSize(Math.max(1, width), Math.max(1, height));
    const labelComponent = labelNode.getComponent(Label) ?? labelNode.addComponent(Label);
    this.applyLabelStyle(labelComponent, label, fontSize, textColor, { outline: true });
    return node;
  }

  private applyRuntimeSpriteKey(sprite: Sprite, key?: RuntimeSpriteAssetKey): void {
    if (!key) {
      return;
    }
    const uuid = RuntimeSpriteAssets[key];
    if (!uuid) {
      return;
    }
    loadRuntimeSpriteFrame(key, uuid).then((spriteFrame) => {
      if (!spriteFrame || !sprite.node?.isValid) {
        return;
      }
      sprite.spriteFrame = spriteFrame;
      sprite.color = Color.WHITE;
      sprite.sizeMode = Sprite.SizeMode.CUSTOM;
    });
  }

  private pruneBattleLiveLayer(layer: Node, keep: Set<string>): void {
    [...layer.children].forEach((child) => {
      if (keep.has(child.name)) {
        return;
      }
      child.removeFromParent();
      child.destroy();
    });
  }

  private getBattleMonsterPosition(monster: BattleSessionState['monsters'][number], index: number, elapsedSeconds: number): { x: number; laneY: number; bodyY: number; size: number } {
    const x = 28 + monster.x * 126 + Math.sin(elapsedSeconds * 4 + index) * 34;
    const laneY = 74 - (index % 4) * 60;
    const step = Math.sin(elapsedSeconds * 8 + index) * 6;
    const config = gameLogic.repo.getMonster(monster.monsterId);
    const elite = monster.monsterId.includes('elite') || monster.hpMax > (config?.baseHp ?? monster.hpMax) * 1.8;
    const deathRatio = monster.alive ? 0 : Math.min(1, (monster.deathAgeSec ?? 0) / 2.4);
    const size = (elite ? 112 : 94) * (monster.alive ? 1 : Math.max(0.42, 1 - deathRatio * 0.42));
    return {
      x,
      laneY,
      bodyY: laneY + step + deathRatio * 20,
      size,
    };
  }

  private getBattleMonsterSpriteKey(monsterId: string): RuntimeSpriteAssetKey | undefined {
    if (monsterId.includes('ghost')) return 'rt_monster_ghost';
    if (monsterId.includes('skeleton')) return 'rt_monster_skeleton';
    if (monsterId.includes('goblin') || monsterId.includes('orc') || monsterId.includes('mage')) return 'rt_monster_goblin';
    return undefined;
  }

  private getBattleHeroAttackImpulse(battleState: BattleSessionState): number {
    const latest = [...battleState.attackVisuals].reverse().find((visual) => visual.ageSec <= 0.28);
    if (!latest) {
      return 0;
    }
    return Math.max(0, Math.min(1, 1 - latest.ageSec / 0.28));
  }

  private getBattleMonsterHitImpulse(monsterUid: string, battleState: BattleSessionState): number {
    const latest = [...battleState.damageNumbers]
      .reverse()
      .find((number) => number.monsterUid === monsterUid && number.ageSec <= 0.32);
    if (!latest) {
      return 0;
    }
    return Math.max(0, Math.min(1, 1 - latest.ageSec / 0.32));
  }

  private getMonsterGlyph(monsterId: string): string {
    if (monsterId.includes('ghost')) return 'ghost';
    if (monsterId.includes('skeleton')) return 'bone';
    if (monsterId.includes('goblin')) return 'goblin';
    if (monsterId.includes('mage')) return 'mage';
    if (monsterId.includes('orc')) return 'orc';
    return 'enemy';
  }

  private getMonsterColor(monsterId: string, elite: boolean): Color {
    if (elite) return new Color(156, 74, 198, 248);
    if (monsterId.includes('ghost')) return new Color(138, 202, 238, 242);
    if (monsterId.includes('skeleton')) return new Color(222, 214, 188, 248);
    if (monsterId.includes('goblin')) return new Color(83, 167, 132, 248);
    if (monsterId.includes('mage')) return new Color(116, 88, 190, 248);
    if (monsterId.includes('orc')) return new Color(116, 156, 78, 248);
    return new Color(83, 167, 132, 248);
  }

  private addBattleWeaponSlot(name: string, x: number, y: number, spriteKey: RuntimeSpriteAssetKey | undefined, cooldownRatio: number): void {
    this.addRect({
      name: `${name}_Slot`,
      width: 106,
      height: 116,
      x,
      y,
      fill: new Color(22, 23, 23, 238),
      border: cooldownRatio > 0 ? new Color(106, 84, 59, 255) : new Color(52, 45, 38, 230),
      borderSize: 5,
    });

    if (spriteKey) {
      this.addRect({ name: `${name}_${spriteKey}_Icon`, width: 82, height: 82, x, y: y + 17, fill: new Color(255, 255, 255, 0) });
      this.addRect({ name: `${name}_Star`, width: 28, height: 28, x: x + 28, y: y - 30, fill: UIColors.highlightGold, border: UIColors.woodStroke, borderSize: 2, label: '★', fontSize: 18, textColor: UIColors.whiteText });
    } else {
      this.addRect({ name: `${name}_EmptyMark`, width: 58, height: 58, x, y: y + 8, fill: new Color(0, 0, 0, 65), border: new Color(95, 80, 64, 180), borderSize: 3 });
    }

    if (cooldownRatio > 0 && cooldownRatio < 1) {
      this.addProgressBar(`${name}_Cooldown`, x - 37, y - 44, 74, 12, cooldownRatio, UIColors.buttonGold);
    }
  }

  private getBattleWeaponSpriteKey(itemId?: string): RuntimeSpriteAssetKey | undefined {
    if (!itemId) return undefined;
    if (itemId.includes('fishbone')) return 'rt_battle_weapon_bow';
    if (itemId.includes('staff')) return 'rt_battle_weapon_orb';
    if (itemId.includes('sword')) return 'rt_battle_weapon_sword';
    if (itemId.includes('bow')) return 'rt_battle_weapon_bow';
    if (itemId.includes('spear')) return 'rt_battle_weapon_spear';
    if (itemId.includes('orb')) return 'rt_battle_weapon_orb';
    if (itemId.includes('shield')) return 'rt_battle_weapon_shield';
    return 'rt_battle_weapon_gold_sword';
  }

  private addInventoryCell(name: string, x: number, y: number, item?: InventoryItemOptions): void {
    const filled = !!item;
    const selected = item?.selected === true;
    this.addRect({
      name: selected ? `${name}_Selected` : filled ? name : `${name}_Empty`,
      width: 116,
      height: 116,
      x,
      y,
      fill: filled ? new Color(215, 177, 125, 255) : new Color(223, 189, 141, 130),
      border: selected ? UIColors.highlightGold : new Color(165, 110, 65, 255),
      borderSize: selected ? 8 : 4,
    });
    if (!filled) {
      this.addRect({
        name: `${name}_EmptyPaw_rt_icon_paw_Muted`,
        width: 56,
        height: 52,
        x,
        y: y - 2,
        fill: new Color(118, 78, 42, 92),
      });
      return;
    }

    this.addRect({ name: `${name}_${item.name}_Icon`, width: 96, height: 96, x, y: y + 7, fill: item.rarity ?? Color.WHITE });
    if (item.count) {
      this.addRect({ name: `${name}_${item.name}_Count`, width: 34, height: 30, x: x + 40, y: y - 38, fill: UIColors.highlightGold, border: UIColors.woodStroke, borderSize: 2, label: item.count, fontSize: 18, textColor: UIColors.textBrown });
    }
    if (selected) {
      this.addRect({ name: `${name}_SelectedGlow`, width: 128, height: 128, x, y, fill: new Color(255, 226, 138, 40) });
    }
  }

  private addCampCabin(name: string, x: number, y: number, width: number, height: number): void {
    this.addRect({ name: `${name}_Sprite`, width, height, x, y, fill: new Color(87, 50, 27, 220) });
  }

  private addCampfire(name: string, x: number, y: number, width: number): void {
    this.addRect({ name: `${name}_Glow`, width: width + 70, height: 126, x, y: y + 12, fill: new Color(255, 122, 26, 55) });
    this.addRect({ name: `${name}_Sprite`, width, height: Math.round(width * 1.22), x, y, fill: UIColors.campfireOrange });
  }

  private addCharacterStand(name: string, x: number, y: number, width: number, height: number, _label: string): void {
    this.addRect({ name: `${name}_Sprite`, width, height, x, y, fill: new Color(83, 86, 78, 220) });
  }

  private addRewardCard(name: string, x: number, y: number, title: string, amount: string, spriteKey: RuntimeSpriteAssetKey): void {
    this.addRect({ name, width: 180, height: 238, x, y, fill: UIColors.parchment, border: UIColors.highlightGold, borderSize: 6 });
    this.addRect({ name: `${name}_IconFrame`, width: 112, height: 112, x, y: y + 36, fill: new Color(255, 255, 255, 0), border: UIColors.woodStroke, borderSize: 4 });
    const iconLabel = spriteKey === 'rt_icon_gold' ? '金' : spriteKey === 'rt_icon_purple_gem' ? '钻' : '弩';
    this.addRect({ name: `${name}_${spriteKey}`, width: 92, height: 92, x, y: y + 36, fill: Color.WHITE, label: iconLabel, fontSize: 32, textColor: UIColors.textBrown });
    this.addText({ name: `${name}_Title`, value: title, x, y: y - 54, width: 150, height: 30, fontSize: 24, color: UIColors.textBrown });
    this.addText({ name: `${name}_Amount`, value: amount, x, y: y - 92, width: 150, height: 34, fontSize: 27, color: new Color(118, 70, 34, 255) });
  }

  private addSkillCard(name: string, x: number, title: string, desc: string, rarity: string, type: string, spriteKey: RuntimeSpriteAssetKey): void {
    const rareColor = rarity === '史诗' ? UIColors.purpleGem : rarity === '稀有' ? UIColors.actionBlue : UIColors.buttonGold;
    this.addRect({ name, width: 210, height: 520, x, y: 20, fill: UIColors.parchment, border: rareColor, borderSize: 7 });
    this.addText({ name: `${name}_Title`, value: title, x, y: 206, width: 176, height: 42, fontSize: 30, color: rarity === '普通' ? UIColors.successGreen : rareColor, outline: false });
    this.addRect({ name: `${name}_IconMedallion`, width: 138, height: 138, x, y: 120, fill: new Color(58, 42, 28, 245), border: rareColor, borderSize: 6 });
    this.addRect({ name: `${name}_${spriteKey}`, width: 110, height: 110, x, y: 120, fill: Color.WHITE });
    this.addRect({ name: `${name}_RarityBadge`, width: 110, height: 34, x, y: 34, fill: rareColor, border: UIColors.woodStroke, borderSize: 3, label: rarity, fontSize: 20, textColor: UIColors.whiteText, outline: true });
    for (let index = 0; index < 5; index += 1) {
      const filled = rarity === '史诗' ? index < 4 : rarity === '稀有' ? index < 2 : index < 3;
      this.addText({ name: `${name}_Star_${index + 1}`, value: '★', x: x - 52 + index * 26, y: -20, width: 28, height: 28, fontSize: 25, color: filled ? UIColors.buttonGold : new Color(106, 94, 78, 210), outline: true });
    }
    this.addRect({ name: `${name}_Type`, width: 118, height: 34, x, y: -58, fill: new Color(80, 52, 34, 236), border: UIColors.highlightGold, borderSize: 2, label: type, fontSize: 19, textColor: UIColors.highlightGold, outline: true });
    this.addText({ name: `${name}_Desc`, value: desc, x, y: -128, width: 170, height: 76, fontSize: 24, color: UIColors.textBrown, wrap: true });
    this.addButton(`${name}_Choose`, '选择', x, -204, 190, 86, UIColors.buttonGold, UIColors.woodStroke, 36);
  }

  private addProgressBar(name: string, x: number, y: number, width: number, height: number, ratio: number, fill: Color): Node {
    const root = this.addRect({ name, width, height, x, y, fill: new Color(40, 28, 20, 230), border: UIColors.woodStroke, borderSize: 3 });
    const clamped = Math.max(0, Math.min(1, ratio));
    const fillWidth = Math.max(2, (width - 8) * clamped);
    const fillX = name === 'Battle_HPBar' ? x : x - width / 2 + 4 + fillWidth / 2;
    this.addRect({
      name: `${name}_Fill`,
      width: fillWidth,
      height: Math.max(2, height - 8),
      x: fillX,
      y,
      fill,
    });
    return root;
  }

  private addButton(name: string, text: string, x: number, y: number, width: number, height: number, fill: Color, border: Color, fontSize: number): Node {
    const node = this.addRect({ name, width, height, x, y, fill, border, borderSize: 6, label: text, fontSize, textColor: UIColors.whiteText, outline: true, wrap: true });
    this.addButtonBehavior(node, name);
    this.addRect({ name: `${name}_Highlight`, width: Math.max(30, width - 42), height: 8, x, y: y + height * 0.34, fill: new Color(255, 255, 255, 95) });
    return node;
  }

  private addIconButton(name: string, text: string, x: number, y: number): Node {
    return this.addButton(name, text, x, y, 74, 74, UIColors.wood, UIColors.woodStroke, 30);
  }

  private bindButtonAction(node: Node, name: string): void {
    node.on(Button.EventType.CLICK, () => {
      if (this.handleButtonAction(name)) {
        return;
      }

      const route = this.resolveButtonRoute(name);
      if (!route) {
        return;
      }

      void SceneRouter.instance.go(route);
    });
  }

  private addSettingsRow(key: string, title: string, value: string, y: number): void {
    this.addRect({ name: `Settings_Row_${key}`, width: 620, height: 88, x: 0, y, fill: new Color(255, 234, 191, 255), border: new Color(146, 91, 48, 255), borderSize: 4 });
    const iconLabel: Record<string, string> = {
      Music: '♪',
      Sfx: '♪',
      Vibrate: '▣',
      PowerSave: '叶',
      Privacy: '文',
      Service: '耳',
    };
    const isToggle = value === '开启' || value === '关闭';
    this.addRect({ name: `Settings_Icon_${key}`, width: 46, height: 46, x: -266, y, fill: isToggle ? UIColors.highlightGold : UIColors.actionBlue, border: UIColors.woodStroke, borderSize: 3, label: iconLabel[key] ?? '设', fontSize: 25, textColor: UIColors.textBrown, outline: true });
    this.addText({ name: `Settings_Title_${key}`, value: title, x: -56, y, width: 330, height: 38, fontSize: 28, color: UIColors.textBrown, align: 'left' });
    this.addButton(`Button_Settings_${key}`, value, 226, y, isToggle ? 122 : 142, 56, isToggle ? (value === '开启' ? UIColors.successGreen : UIColors.woodLight) : UIColors.actionBlue, UIColors.woodStroke, 23);
  }

  private addButtonBehavior(node: Node, actionName: string): void {
    const button = node.getComponent(Button) ?? node.addComponent(Button);
    button.target = node;
    button.transition = Button.Transition.SCALE;
    button.duration = 0.08;
    button.zoomScale = 0.96;
    this.bindButtonAction(node, actionName);
  }

  private resolveButtonRoute(name: string): RouteId | undefined {
    if (name.includes('NavButton_home')) return 'home';
    if (name.includes('NavButton_battle')) return 'battlePrepare';
    if (name.includes('NavButton_merge')) return 'merge';
    if (name.includes('NavButton_explore')) return 'explore';
    if (name.includes('NavButton_guild')) return 'guild';
    if (name.includes('NavButton_shop')) return 'shop';
    if (name.includes('NavButton_backpack')) return 'backpack';
    if (name.includes('NavButton_pet')) return 'pet';
    if (name.includes('NavButton_talent')) return 'talent';
    if (name.includes('NavButton_settings')) return 'settings';
    if (name.includes('Button_Settings')) return 'settings';
    if (name.includes('TopEntry_CheckIn')) return 'dailyTask';
    if (name.includes('TopEntry_DailyTask')) return 'dailyTask';
    if (name.includes('TopEntry_Mail')) return 'mail';
    if (name.includes('TopEntry_Event')) return 'achievement';
    if (name.includes('TopEntry_FirstGift')) return 'shop';
    if (name.includes('LeftEntry_Shop')) return 'shop';
    if (name.includes('LeftEntry_Backpack')) return 'backpack';
    if (name.includes('LeftEntry_Pet')) return 'pet';
    if (name.includes('LeftEntry_Talent')) return 'talent';
    if (name.includes('RightEntry_Achievement')) return 'achievement';
    if (name.includes('RightEntry_Illustration')) return 'achievement';
    if (name.includes('RightEntry_Settings')) return 'settings';
    if (name.includes('Button_BattlePause')) return 'pauseModal';
    if (name.includes('Button_PauseClose') || name.includes('Button_PauseContinue') || name.includes('Button_SkillChoiceClose')) return 'battle';
    if (name.includes('Button_PauseRestart') || name.includes('Button_DefeatRetry')) return 'battlePrepare';
    if (name.includes('Button_PauseHome') || name.includes('Button_DefeatHome') || name.includes('Button_RewardConfirm')) return 'home';
    if (name.includes('Button_DefeatUpgrade')) return 'backpack';
    if (name.includes('Button_MailDetail')) return 'mail';
    if (name.includes('Button_PolicyClose') || name.includes('Button_PolicyDisagree')) return 'login';
    if (name.includes('Button_ConfirmClose') || name.includes('Button_ConfirmCancel') || name.includes('Button_ConfirmOk')) return 'home';
    if (name === 'Button_Merge') return SaveManager.instance.load().settings.mergeGuideSeen ? 'merge' : 'mergeGuide';
    if (name.includes('Button_MergeGuideConfirm')) return 'backpack';
    if (name.includes('Button_PetDetailClose') || name.includes('Button_PetDetailBackList') || name.includes('Button_PetDetailDeploy')) return 'pet';
    if (name.includes('Button_StagePrev') || name.includes('Button_StageNext')) return 'battlePrepare';
    if (name.includes('SideEntry_CheckIn') || name.includes('SideEntry_Task')) return 'dailyTask';
    if (name.includes('SideEntry_Mail')) return 'mail';
    if (name.includes('SideEntry_Rank')) return 'achievement';
    if (name.includes('Button_Back') || name.includes('Button_Close') || name.includes('Button_BackpackClose')) return 'home';
    return undefined;
  }

  private handleButtonAction(name: string): boolean {
    if (name.includes('Button_ToggleAgreement')) {
      const acceptedAgreement = !SaveManager.instance.load().settings.acceptedAgreement;
      SaveManager.instance.setAgreementAccepted(acceptedAgreement);
      this.showToast(acceptedAgreement ? '已同意用户协议和隐私政策' : '已取消协议勾选');
      this.rebuild();
      return true;
    }

    if (name.includes('Button_StartGame')) {
      const acceptedAgreement = SaveManager.instance.load().settings.acceptedAgreement;
      AnalyticsService.instance.track(GameEvents.LoginStart, { acceptedAgreement, entry: name });
      if (!acceptedAgreement) {
        this.showToast('请先阅读并同意用户协议和隐私政策');
        return true;
      }

      SaveManager.instance.setAgreementAccepted(true);
      AnalyticsService.instance.track(GameEvents.LoginEnterHome, { entry: name });
      void SceneRouter.instance.go('home');
      return true;
    }

    if (name.includes('Button_PolicyAgree')) {
      SaveManager.instance.setAgreementAccepted(true);
      void SceneRouter.instance.go('home');
      return true;
    }

    if (name.includes('Button_MergeConfirm') || name.includes('Button_AutoMerge')) {
      return this.reportActionResult(gameLogic.autoMergeAll(), '合成完成，背包已更新');
    }

    if (name.includes('Button_OpenChest')) {
      return this.reportActionResult(gameLogic.openChest(), '宝箱已开启，奖励已入包');
    }

    if (name.includes('Button_RefreshShopSmall')) {
      return this.reportActionResult(gameLogic.refreshShop('success'), '商店已刷新');
    }

    if (name.includes('Button_ShopAddCurrency')) {
      this.showToast('充值入口未开放，请通过战斗、任务和邮件获取资源');
      return true;
    }

    if (name.includes('Button_BackpackSort')) {
      SaveManager.instance.update((draft) => {
        draft.inventory.sort((a, b) =>
          a.itemType.localeCompare(b.itemType) ||
          a.itemId.localeCompare(b.itemId) ||
          b.level - a.level ||
          b.count - a.count,
        );
      }, 'inventory-sort');
      this.showToast('背包已按类型和等级整理');
      this.rebuild();
      return true;
    }

    if (name.includes('Button_MergeGuideHelp')) {
      this.showToast('两个同名同等级武器可合成更高等级，材料不足时不会消耗道具');
      return true;
    }

    if (name.includes('Button_MergeGuideConfirm')) {
      SaveManager.instance.update((draft) => {
        draft.settings.mergeGuideSeen = true;
      }, 'merge-guide-seen');
      void SceneRouter.instance.go('backpack');
      return true;
    }

    if (name.includes('Button_ExploreStart')) {
      this.showToast('探索系统暂未开放，请先通过守夜战斗推进章节');
      return true;
    }

    if (name.includes('Button_GuildCheckIn')) {
      this.showToast('公会签到暂未开放，当前版本不会消耗或发放资源');
      return true;
    }

    if (name.includes('Button_GuildHelp')) {
      this.showToast('公会互助暂未开放，入口已置为安全占位');
      return true;
    }

    if (name.includes('Button_StagePrev') || name.includes('Button_StageNext')) {
      this.showToast('章节切换暂未开放，当前使用默认守夜章节');
      return true;
    }

    if (name.includes('Button_RewardDouble')) {
      void this.claimBattleDoubleRewardFromAd();
      return true;
    }

    if (name.includes('Button_RefreshVideo')) {
      this.showToast('技能刷新暂未接入，当前保留本次技能选择');
      return true;
    }

    if (name.endsWith('_Buy')) {
      return this.buyShopGoodsFromButton(name);
    }

    if (name.includes('Button_DailyTaskClaim_')) {
      return this.claimDailyTaskFromButton(name);
    }

    if (name.includes('Button_ActivityChest_')) {
      const activity = name.replace('Button_ActivityChest_', '');
      return this.reportActionResult(gameLogic.claimActivityChest(`activity_${activity}`), '活跃宝箱奖励已领取');
    }

    if (name.includes('Button_MailClaimAll')) {
      return this.reportActionResult(gameLogic.claimAllMails(), '所有可领取邮件附件已入账');
    }

    if (name.includes('Button_MailDeleteAll')) {
      return this.reportActionResult(gameLogic.deleteClaimedAndEmptyMails(), '已删除可清理邮件');
    }

    if (name.includes('Button_MailOpen_')) {
      const mailId = name.replace('Button_MailOpen_', '');
      return this.openMailDetail(mailId);
    }

    if (name.includes('Button_MailDetailClaim')) {
      const mail = this.getSelectedMail();
      if (!mail) {
        this.showToast('暂无可处理邮件');
        return true;
      }

      return this.reportActionResult(gameLogic.claimMail(mail.id), mail.attachments.length > 0 ? '邮件附件已领取' : '邮件已标为已读');
    }

    if (name.includes('Button_MailDetailDelete')) {
      const mail = this.getSelectedMail();
      if (!mail) {
        this.showToast('暂无可删除邮件');
        return true;
      }

      const result = gameLogic.deleteMail(mail.id);
      if (result.ok) {
        this.selectedMailId = null;
        this.showToast('邮件已删除');
        void SceneRouter.instance.go('mail');
        return true;
      }

      return this.reportActionResult(result, '邮件已删除');
    }

    if (name.includes('Button_MailDetailReply')) {
      this.showToast('公告详情已展示，客服回复入口待平台接入');
      return true;
    }

    if (name.includes('Button_MailClaim_')) {
      return this.claimMailFromButton(name);
    }

    if (name.includes('Button_AchievementClaimAll')) {
      return this.reportActionResult(gameLogic.claimAllAchievements(), '所有可领取成就奖励已入账');
    }

    if (name.includes('Button_AchievementClaim_')) {
      return this.claimAchievementFromButton(name);
    }

    if (name.includes('Button_PetSelect_')) {
      const petId = name.replace('Button_PetSelect_', '');
      if (!gameLogic.getSnapshot().save.pets.some((pet) => pet.id === petId)) {
        this.showToast('宠物数据不存在');
        return true;
      }

      this.selectedPetId = petId;
      this.showToast(`已选择 ${this.getPetDisplayName(petId)}`);
      this.rebuild();
      return true;
    }

    if (name.includes('Button_TalentSelect_')) {
      const nodeId = name.replace('Button_TalentSelect_', '');
      const config = gameLogic.repo.getTalent(nodeId);
      if (!config) {
        this.showToast('天赋节点不存在');
        return true;
      }

      this.selectedTalentNodeId = nodeId;
      this.showToast(`已选择 ${this.getTalentDisplayName(nodeId)}`);
      this.rebuild();
      return true;
    }

    if (name.includes('Button_PetLevelUp') || name.includes('Button_PetDetailUpgrade')) {
      const petId = this.getSelectedPetId();
      if (!petId) {
        this.showToast('暂无可升级宠物');
        return true;
      }

      return this.reportActionResult(gameLogic.upgradePet(petId), '宠物已升级，战力提升');
    }

    if (name.includes('Button_PetDeploy') || name.includes('Button_PetDetailDeploy')) {
      const petId = this.getSelectedPetId();
      if (!petId) {
        this.showToast('暂无可出战宠物');
        return true;
      }

      return this.reportActionResult(gameLogic.deployPet(petId), '宠物已设为出战');
    }

    if (name.includes('Button_TalentLearn')) {
      const nodeId = this.getSelectedTalentNodeId();
      if (!nodeId) {
        this.showToast('请先选择天赋节点');
        return true;
      }

      return this.reportActionResult(gameLogic.upgradeTalent(nodeId), '天赋已学习');
    }

    if (name.includes('Button_TalentReset')) {
      const nodeId = this.getSelectedTalentNodeId();
      const branch = nodeId ? gameLogic.repo.getTalent(nodeId)?.branch : undefined;
      return this.reportActionResult(gameLogic.resetTalents(branch), '天赋已重置，点数已返还');
    }

    if (name.includes('Button_SettingsLogout')) {
      SaveManager.instance.reset();
      this.showToast('本地缓存已清理');
      void SceneRouter.instance.go('login');
      return true;
    }

    if (name.includes('Button_Settings_Privacy')) {
      void SceneRouter.instance.go('policyModal');
      return true;
    }

    if (name.includes('Button_Settings_')) {
      return this.toggleSettingFromButton(name);
    }

    if (name.includes('Button_ResultAction')) {
      void SceneRouter.instance.go('home');
      return true;
    }

    if (!name.includes('Button_StartBattle')) {
      return false;
    }

    if (this.screenKey === 'battlePrepare') {
      const result = gameLogic.startBattle();
      if (!result.ok) {
        this.showToast(result.reason === 'insufficient_currency' ? '体力不足' : result.message);
        return true;
      }

      AnalyticsService.instance.track(GameEvents.BattleStart, { payload: result.data });
      void SceneRouter.instance.go('battle');
      return true;
    }

    AnalyticsService.instance.track(GameEvents.BattlePrepareOpen);
    void SceneRouter.instance.go('battlePrepare');
    return true;
  }

  private openMailDetail(mailId: string): boolean {
    const mail = gameLogic.getSnapshot().save.mails.find((row) => row.id === mailId);
    if (!mail) {
      this.showToast('邮件不存在或已过期');
      return true;
    }

    this.selectedMailId = mailId;
    void SceneRouter.instance.go('mailDetail');
    return true;
  }

  private getSelectedMail(): MailSave | null {
    const save = gameLogic.getSnapshot().save;
    const selected = this.selectedMailId ? save.mails.find((mail) => mail.id === this.selectedMailId) : undefined;
    const fallback = selected ?? save.mails.find((mail) => !mail.claimed) ?? save.mails[0];
    this.selectedMailId = fallback?.id ?? null;
    return fallback ?? null;
  }

  private getSelectedPetId(): string | null {
    const save = gameLogic.getSnapshot().save;
    const selected = this.selectedPetId ? save.pets.find((pet) => pet.id === this.selectedPetId) : undefined;
    const fallback = selected ?? save.pets.find((pet) => pet.deployed) ?? save.pets.find((pet) => pet.owned) ?? save.pets[0];
    this.selectedPetId = fallback?.id ?? null;
    return this.selectedPetId;
  }

  private getSelectedTalentNodeId(): string | null {
    const save = gameLogic.getSnapshot().save;
    const nodes = gameLogic.repo.configs.talents.nodes;
    const selected = this.selectedTalentNodeId ? gameLogic.repo.getTalent(this.selectedTalentNodeId) : null;
    if (selected) {
      return selected.id;
    }

    const fallback = nodes.find((node) => {
      const saved = save.talents.find((row) => row.id === node.id);
      const level = saved?.level ?? 0;
      const prerequisitesMet = node.requires.every((requirement) => {
        const requiredNode = save.talents.find((row) => row.id === requirement.id);
        return (requiredNode?.level ?? 0) >= requirement.level;
      });
      return level < node.maxLevel && prerequisitesMet;
    }) ?? nodes[0];
    this.selectedTalentNodeId = fallback?.id ?? null;
    return this.selectedTalentNodeId;
  }

  private claimDailyTaskFromButton(name: string): boolean {
    const key = name.replace('Button_DailyTaskClaim_', '');
    const taskIds: Record<string, string> = {
      Login: 'daily_login',
      Battle: 'daily_battle_3',
      Merge: 'daily_merge_5',
      Ad: 'daily_ad_1',
      Kill: 'daily_kill_100',
    };
    const taskId = taskIds[key] ?? key;
    const config = gameLogic.repo.configs.tasks.dailyTasks.find((task) => task.id === taskId);
    const save = gameLogic.getSnapshot().save;
    const row = save.dailyTasks.find((task) => task.id === taskId);

    if (config && row && !row.claimed && row.progress >= config.target) {
      return this.reportActionResult(gameLogic.claimDailyTask(taskId), '每日任务奖励已领取');
    }

    if (key === 'Battle' || key === 'Kill') {
      void SceneRouter.instance.go('battlePrepare');
      return true;
    }
    if (key === 'Merge') {
      void SceneRouter.instance.go('merge');
      return true;
    }
    if (key === 'Ad') {
      void this.recordDailyAdProgressFromAd();
      return true;
    }

    return this.reportActionResult(gameLogic.claimDailyTask(taskId), '每日任务奖励已领取');
  }

  private async claimBattleDoubleRewardFromAd(): Promise<void> {
    const settlement = gameLogic.getLastBattleSettlement();
    if (!settlement || settlement.status !== 'victory') {
      this.showToast('当前没有可双倍领取的胜利奖励');
      return;
    }
    if (settlement.doubleClaimed) {
      this.showToast('双倍奖励已经领取过了');
      return;
    }

    this.showToast('正在拉起激励视频...');
    const adResult = await adService.showRewardedAd('battle_reward_double');
    if (!adResult.success) {
      this.showToast(adResult.message ?? '广告未完整观看，无法发放双倍奖励');
      return;
    }

    this.reportActionResult(
      gameLogic.claimBattleDoubleReward({
        battleId: settlement.battleId,
        chapterId: settlement.chapterId,
        wave: settlement.wave,
        status: settlement.status,
        defeatedMonsters: settlement.defeatedMonsters,
        adState: 'success',
      }),
      '双倍奖励已领取',
    );
  }

  private async recordDailyAdProgressFromAd(): Promise<void> {
    this.showToast('正在拉起激励视频...');
    const adResult = await adService.showRewardedAd('daily_task_ad');
    if (!adResult.success) {
      this.showToast(adResult.message ?? '广告未完整观看，任务进度未更新');
      return;
    }
    this.reportActionResult(gameLogic.recordProgressEvent('adWatch', 1), '广告观看完成，任务进度已更新');
  }

  private claimAchievementFromButton(name: string): boolean {
    const key = name.replace('Button_AchievementClaim_', '');
    const achievementIds: Record<string, string> = {
      FirstWin: 'wave_5',
      Wave20: 'wave_20',
      Collector: 'merge_100',
      Hunter: 'kill_1000',
      PetFriend: 'pet_level_10',
    };
    return this.reportActionResult(gameLogic.claimAchievement(achievementIds[key] ?? key), '成就奖励已领取');
  }

  private claimMailFromButton(name: string): boolean {
    const mailId = name.replace('Button_MailClaim_', '');
    const mail = gameLogic.getSnapshot().save.mails.find((row) => row.id === mailId);
    if (!mail) {
      this.showToast('邮件不存在或已过期');
      return true;
    }

    this.selectedMailId = mailId;
    if (mail.claimed || mail.attachments.length === 0) {
      void SceneRouter.instance.go('mailDetail');
      return true;
    }

    return this.reportActionResult(gameLogic.claimMail(mailId), '邮件附件已领取');
  }

  private buyShopGoodsFromButton(name: string): boolean {
    const key = name.replace('_Buy', '');
    const goodsIds: Record<string, string> = {
      GoodsGold: 'daily_free_gold',
      GoodsStone: 'daily_pet_food',
      GoodsEgg: 'daily_pet_egg',
      GoodsChest: 'daily_chest',
      GoodsDiamond: 'daily_blue_gem',
      GoodsEnergy: 'daily_energy',
    };
    return this.reportActionResult(gameLogic.buyShopGoods(goodsIds[key] ?? key), '购买成功，奖励已发放');
  }

  private toggleSettingFromButton(name: string): boolean {
    const key = name.replace('Button_Settings_', '');
    const settingMap: Partial<Record<string, keyof SettingsSave>> = {
      Music: 'musicEnabled',
      Sfx: 'soundEnabled',
      Vibrate: 'vibrationEnabled',
      PowerSave: 'powerSavingEnabled',
    };
    const settingKey = settingMap[key];
    if (!settingKey) {
      this.showToast(key === 'Privacy' ? '用户协议与隐私政策入口已保留' : '客服与反馈入口已保留');
      return true;
    }

    const nextSave = SaveManager.instance.update((draft) => {
      draft.settings[settingKey] = !draft.settings[settingKey];
    }, `settings-${key}`);
    this.showToast(nextSave.settings[settingKey] ? '设置已开启' : '设置已关闭');
    this.rebuild();
    return true;
  }

  private reportActionResult(result: { ok: boolean; message: string; reason?: string }, successMessage: string): boolean {
    if (result.ok) {
      this.showToast(successMessage);
      this.rebuild();
      return true;
    }

    const reasonText: Record<string, string> = {
      already_claimed: '奖励已经领取过了',
      daily_limit_reached: '今日次数已用完',
      insufficient_currency: '资源不足',
      insufficient_item: '材料不足',
      not_ready: '条件还未达成',
      not_owned: '尚未拥有',
      max_level: '已经达到上限',
      prerequisite_missing: '前置条件未满足',
      unavailable: '当前不可用',
      config_missing: '配置缺失',
      ad_not_completed: '广告未完成',
    };
    this.showToast(reasonText[result.reason ?? ''] ?? result.message);
    return true;
  }

  private getDailyTaskUiKey(taskId: string): string {
    const keys: Record<string, string> = {
      daily_login: 'Login',
      daily_battle_3: 'Battle',
      daily_merge_5: 'Merge',
      daily_kill_100: 'Kill',
      daily_ad_1: 'Ad',
    };
    return keys[taskId] ?? this.normalizeNodeKey(taskId);
  }

  private getDailyTaskTitle(taskId: string): string {
    const titles: Record<string, string> = {
      daily_login: '登录游戏',
      daily_battle_3: '完成战斗',
      daily_merge_5: '整理背包',
      daily_kill_100: '击败怪物',
      daily_ad_1: '领取补给',
    };
    return titles[taskId] ?? taskId;
  }

  private getDailyTaskDesc(taskId: string): string {
    const descs: Record<string, string> = {
      daily_login: '完成今日首次登录',
      daily_battle_3: '完成 3 次守夜战斗',
      daily_merge_5: '合成 5 次武器',
      daily_kill_100: '累计击败 100 个怪物',
      daily_ad_1: '观看一次激励视频',
    };
    return descs[taskId] ?? '达成目标后领取';
  }

  private getAchievementUiKey(achievementId: string): string {
    const keys: Record<string, string> = {
      wave_5: 'FirstWin',
      wave_20: 'Wave20',
      merge_100: 'Collector',
      kill_1000: 'Hunter',
      pet_level_10: 'PetFriend',
    };
    return keys[achievementId] ?? this.normalizeNodeKey(achievementId);
  }

  private getAchievementTitle(achievementId: string): string {
    const titles: Record<string, string> = {
      wave_5: '初次守夜',
      wave_20: '越战越勇',
      merge_100: '背包收藏家',
      kill_1000: '怪物猎手',
      pet_level_10: '猫猫伙伴',
    };
    return titles[achievementId] ?? achievementId;
  }

  private getAchievementDesc(achievementId: string): string {
    const descs: Record<string, string> = {
      wave_5: '最高通关第 5 波',
      wave_20: '最高通关第 20 波',
      merge_100: '累计合成 100 次',
      kill_1000: '累计击败 1000 个怪物',
      pet_level_10: '任意宠物达到 10 级',
    };
    return descs[achievementId] ?? '完成长期目标';
  }

  private getInventoryIcon(itemId: string, itemType: string): string {
    if (itemType === 'chest') return 'box';
    if (itemType === 'material') return 'mat';
    if (itemId.includes('sword')) return 'sword';
    if (itemId.includes('bow')) return 'bow';
    if (itemId.includes('staff')) return 'staff';
    if (itemId.includes('spear')) return 'spear';
    if (itemId.includes('potion')) return 'potion';
    return 'item';
  }

  private getItemDisplayName(itemId: string): string {
    const names: Record<string, string> = {
      weapon_sword: '月牙短剑',
      weapon_bow: '星羽弓',
      weapon_staff: '营火法杖',
      weapon_spear: '鱼骨长枪',
      item_chest: '武器宝箱',
      item_pet_egg: '宠物蛋',
      item_energy_potion: '体力药水',
      pet_material_common: '宠物粮',
    };
    return names[itemId] ?? itemId;
  }

  private getPetDisplayName(petId: string): string {
    const names: Record<string, string> = {
      pet_black_cat: '小黑猫',
      pet_shadow_cat: '幽影灵猫',
      pet_husky: '哈士奇骑士',
      pet_panda: '熊猫侍',
      pet_dog_general: '柴犬小将',
      pet_moon_fox: '月狐',
      pet_bell_cat: '铃铛猫',
      pet_lantern_spirit: '灯灵',
      pet_leaf_panda: '竹叶熊猫',
      pet_star_dog: '星犬',
    };
    return names[petId] ?? petId;
  }

  private getTalentDisplayName(nodeId: string): string {
    const names: Record<string, string> = {
      attack_power_01: '利爪',
      attack_speed_01: '迅捷',
      crit_rate_01: '暴击',
      crit_damage_01: '月牙',
      pierce_01: '穿刺',
      attack_power_02: '夜巡大师',
      camp_hp_01: '营火',
      camp_defense_01: '护盾',
      camp_heal_01: '灯愈',
      camp_hp_02: '暖营',
      damage_reduce_01: '厚披风',
      last_stand_01: '余烬',
      gold_bonus_01: '招财',
      exp_bonus_01: '夜记',
      pet_food_bonus_01: '零食袋',
      chest_discount_01: '宝箱券',
      shop_discount_01: '折扣',
      energy_bonus_01: '精力',
    };
    return names[nodeId] ?? gameLogic.repo.getTalent(nodeId)?.displayName ?? nodeId;
  }

  private getTalentEffectSummary(nodeId: string): string {
    const effectType = gameLogic.repo.getTalent(nodeId)?.effects[0]?.type;
    const names: Record<string, string> = {
      attackPercent: '攻击',
      cooldownPercent: '攻速',
      critRate: '暴击',
      critDamage: '暴伤',
      extraTargets: '穿透',
      campHpPercent: '营地生命',
      defenseFlat: '护甲',
      campRegen: '回复',
      damageReductionPercent: '减伤',
      goldPercent: '金币',
      expPercent: '经验',
      petMaterialPercent: '宠物粮',
      chestDiscountPercent: '宝箱',
      shopDiscountPercent: '商店',
      energyCapFlat: '体力',
    };
    return effectType ? names[effectType] ?? effectType : '强化';
  }

  private normalizeNodeKey(value: string): string {
    const key = value.replace(/[^A-Za-z0-9_]/g, '_');
    return key.length > 0 ? key : 'Item';
  }

  private formatSeconds(value: number): string {
    const seconds = Math.max(0, Math.ceil(value));
    const minutes = Math.floor(seconds / 60);
    const remain = `${seconds % 60}`.padStart(2, '0');
    return `${minutes}:${remain}`;
  }

  private showToast(message: string): void {
    eventBus.emit(GameEvents.Toast, { message });
    console.log(`[UISkeletonBuilder] Toast: ${message}`);
  }

  private normalizeDisplayName(value: string): string {
    if (!value || value.includes('Player Name') || value.includes('玩家名字')) {
      return '守夜小猫';
    }
    return value.length > 7 ? `${value.slice(0, 7)}...` : value;
  }

  private clearGeneratedUi(): void {
    [...this.node.children].forEach((child) => {
      child.removeFromParent();
      child.destroy();
    });
  }

  private addScrollPanel(name: string, x: number, y: number, width: number, height: number, contentHeight: number, buildContent: () => void): Node {
    const viewport = new Node(`${name}ScrollView`);
    viewport.layer = Layers.Enum.UI_2D;
    viewport.parent = this.renderRootOverride ?? this.designRoot ?? this.node;
    viewport.setPosition(x, y, 0);
    const viewportTransform = viewport.addComponent(UITransform);
    viewportTransform.setContentSize(width, height);
    const mask = viewport.addComponent(Mask);
    mask.type = Mask.Type.GRAPHICS_RECT;

    const content = new Node(`${name}ScrollContent`);
    content.layer = Layers.Enum.UI_2D;
    content.parent = viewport;
    const contentTransform = content.addComponent(UITransform);
    const safeContentHeight = Math.max(height, contentHeight);
    contentTransform.setContentSize(width, safeContentHeight);
    content.setPosition(0, safeContentHeight > height ? -(safeContentHeight - height) / 2 : 0, 0);

    const scrollView = viewport.addComponent(ScrollView);
    scrollView.content = content;
    scrollView.vertical = true;
    scrollView.horizontal = false;
    scrollView.inertia = true;
    scrollView.brake = 0.75;

    const previousRoot = this.renderRootOverride;
    this.renderRootOverride = content;
    try {
      buildContent();
    } finally {
      this.renderRootOverride = previousRoot;
    }
    return viewport;
  }

  private estimateWrappedTextHeight(value: string, width: number, fontSize: number, minLines = 1, maxLines = 18): number {
    const charsPerLine = Math.max(8, Math.floor(width / (fontSize * 0.86)));
    const lineCount = value
      .split('\n')
      .reduce((sum, line) => sum + Math.max(1, Math.ceil([...line].length / charsPerLine)), 0);
    const clampedLines = Math.max(minLines, Math.min(maxLines, lineCount));
    return Math.ceil(clampedLines * fontSize * 1.36 + 12);
  }

  private addText(options: TextOptions): Node {
    const node = new Node(options.name);
    node.layer = Layers.Enum.UI_2D;
    node.parent = this.renderRootOverride ?? this.designRoot ?? this.node;
    node.setPosition(options.x, options.y, 0);
    const transform = node.addComponent(UITransform);
    transform.setContentSize(options.width ?? 680, options.height ?? Math.max(40, options.fontSize * 2.4));
    const label = node.addComponent(Label);
    this.applyLabelStyle(label, options.value, options.fontSize, options.color, {
      align: options.align,
      verticalAlign: options.verticalAlign,
      wrap: options.wrap,
      outline: options.outline,
    });
    return node;
  }

  private addRect(options: RectOptions): Node {
    if (options.border && (options.borderSize ?? 4) > 0) {
      const borderSize = options.borderSize ?? 4;
      const border = this.createSpriteNode(`${options.name}_Border`, options.width, options.height, options.x, options.y, options.border);
      const inner = this.createSpriteNode(options.name, options.width - borderSize * 2, options.height - borderSize * 2, 0, 0, options.fill);
      inner.parent = border;
      if (options.label) {
        this.addLabelTo(border, options.label, options.fontSize ?? 28, options.textColor ?? UIColors.whiteText, options.width, options.height, {
          align: options.align,
          verticalAlign: options.verticalAlign,
          wrap: options.wrap,
          outline: options.outline,
        });
      }
      return border;
    }

    const node = this.createSpriteNode(options.name, options.width, options.height, options.x, options.y, options.fill);
    if (options.label) {
      this.addLabelTo(node, options.label, options.fontSize ?? 28, options.textColor ?? UIColors.whiteText, options.width, options.height, {
        align: options.align,
        verticalAlign: options.verticalAlign,
        wrap: options.wrap,
        outline: options.outline,
      });
    }
    return node;
  }

  private createSpriteNode(name: string, width: number, height: number, x: number, y: number, color: Color): Node {
    const node = new Node(name);
    node.layer = Layers.Enum.UI_2D;
    node.parent = this.renderRootOverride ?? this.designRoot ?? this.node;
    node.setPosition(x, y, 0);
    const transform = node.addComponent(UITransform);
    transform.setContentSize(Math.max(1, width), Math.max(1, height));
    const sprite = node.addComponent(Sprite);
    const spriteFrame = builtinResMgr.get<SpriteFrame>('builtin-2d-sprite');
    if (spriteFrame) {
      sprite.spriteFrame = spriteFrame;
    }
    sprite.color = color;
    sprite.sizeMode = Sprite.SizeMode.CUSTOM;
    this.applyRuntimeSprite(name, sprite);
    return node;
  }

  private applyRuntimeSprite(name: string, sprite: Sprite): void {
    const key = this.resolveRuntimeSpriteKey(name);
    if (!key) {
      return;
    }

    const uuid = RuntimeSpriteAssets[key];
    if (!uuid) {
      return;
    }

    const preserveSpriteTint = name.includes('_Muted');
    const initialColor = new Color(sprite.color.r, sprite.color.g, sprite.color.b, sprite.color.a);
    loadRuntimeSpriteFrame(key, uuid).then((spriteFrame) => {
      if (!spriteFrame || !sprite.node?.isValid) {
        return;
      }

      sprite.spriteFrame = spriteFrame;
      sprite.color = preserveSpriteTint ? initialColor : Color.WHITE;
      sprite.sizeMode = Sprite.SizeMode.CUSTOM;
    });
  }

  private resolveRuntimeSpriteKey(name: string): RuntimeSpriteAssetKey | undefined {
    if (name.includes('_Highlight')) return undefined;
    if (name.includes('Battle_Monster')) return undefined;
    if (name.includes('Battle_MonsterHp')) return undefined;
    if (name.includes('Battle_Damage')) return undefined;
    if (name.includes('Battle_HPBar_Fill')) return undefined;
    if (name.includes('BattleWeapon_Live') && !name.includes('rt_battle_weapon_')) return undefined;

    if (name.includes('NavIcon_home')) return 'rt_cabin';
    if (name.includes('NavIcon_merge')) return 'rt_item_weapon_chest';
    if (name.includes('NavIcon_explore')) return 'rt_item_lantern';
    if (name.includes('NavIcon_guild')) return 'rt_avatar_cat';

    const productKey = this.resolveUIProductKey(name);
    const contractedKey = productKey ? resolveUIRuntimeSpriteKey(productKey) : undefined;
    if (contractedKey) {
      return contractedKey;
    }

    if (name === 'Bg_LoginNight') return 'rt_bg_login_night_safe';
    if (name === 'Bg_HomeCamp') return 'rt_bg_home_camp_safe';
    if (name === 'Bg_Shop') return 'rt_bg_shop_village_safe';
    if (name === 'Bg_Talent') return 'rt_bg_battle_forest_safe';
    if (name === 'Bg_DailyTask') return 'rt_bg_battle_forest_safe';
    if (name === 'Bg_Achievement') return 'rt_bg_battle_forest_safe';
    if (name === 'Bg_Mail') return 'rt_bg_battle_forest_safe';
    if (name === 'Bg_Settings') return 'rt_bg_battle_forest_safe';
    if (name === 'Bg_Pet' || name === 'Bg_PetDetail') return 'rt_bg_battle_forest_safe';
    if (name === 'Bg_BackpackParchment') return 'rt_bg_inventory_parchment_safe';

    if (name.includes('Login_TitleArt')) return 'rt_logo_title';
    if (name === 'Login_AgreementCheck_Border' || name === 'BattlePrepare_AgreementCheck_Border') return 'rt_icon_check';
    if (name === 'AgeBadge_16_Border' || name === 'AgeBadge_16_Prepare_Border') return 'rt_badge_age_16';
    if (name.includes('Home_Avatar')) return 'rt_avatar_cat';
    if (name.includes('Pet_SelectedCat_Sprite')) return 'rt_avatar_cat';
    if (name.includes('PetDetail_PortraitCat_Sprite')) return 'rt_avatar_cat';
    if (name.includes('Pet_Icon_')) return 'rt_avatar_cat';
    if (name.includes('Hero_LoginCat_Sprite') || name.includes('Hero_HomeCat_Sprite')) return 'rt_cat_hero_idle';
    if (name.includes('BattlePrepare_HeroCat_Sprite')) return 'rt_cat_hero_battle';
    if (name.includes('BattleDemo_HeroCat_Sprite')) return 'rt_cat_hero_battle';
    if (name.includes('BattleModal_HeroCat_Sprite')) return 'rt_cat_hero_battle';
    if (name.includes('Reward_VictoryHero_Sprite')) return 'rt_cat_hero_idle';
    if (name.includes('Defeat_HeroCat_Sprite')) return 'rt_cat_hero_idle';
    if (name.includes('ShopkeeperCat_Sprite')) return 'rt_cat_shop_hood';
    if (name.includes('Guild_MascotCat_Sprite')) return 'rt_avatar_cat';
    if (name.includes('Login_Cabin_Sprite') || name.includes('Home_Cabin_Sprite')) return 'rt_cabin';
    if (name.includes('Login_Fire_Sprite') || name.includes('Home_Fire_Sprite')) return 'rt_campfire';
    if (name.includes('Battle_FieldArt')) return 'rt_bg_battle_forest_safe';
    if (name.includes('BattlePrepare_PreviewArt')) return 'rt_bg_battle_prepare_safe';
    if (name.includes('rt_battle_weapon_sword')) return 'rt_battle_weapon_sword';
    if (name.includes('rt_battle_weapon_bow')) return 'rt_battle_weapon_bow';
    if (name.includes('rt_battle_weapon_spear')) return 'rt_battle_weapon_spear';
    if (name.includes('rt_battle_weapon_orb')) return 'rt_battle_weapon_orb';
    if (name.includes('rt_battle_weapon_gold_sword')) return 'rt_battle_weapon_gold_sword';
    if (name.includes('rt_battle_weapon_shield')) return 'rt_battle_weapon_shield';
    if (name.includes('rt_monster_ghost')) return 'rt_monster_ghost';
    if (name.includes('rt_monster_goblin')) return 'rt_monster_goblin';
    if (name.includes('rt_monster_skeleton')) return 'rt_monster_skeleton';
    if (name.includes('rt_item_chest')) return 'rt_item_chest';
    if (name.includes('rt_item_bomb')) return 'rt_item_bomb';
    if (name.includes('rt_item_enhance_stone')) return 'rt_item_enhance_stone';
    if (name.includes('rt_avatar_cat')) return 'rt_avatar_cat';
    if (name.includes('rt_item_scroll')) return 'rt_item_scroll';
    if (name.includes('rt_icon_paw_coin')) return 'rt_icon_paw_coin';
    if (name.includes('rt_icon_paw')) return 'rt_icon_paw';
    if (name.includes('weapon_sword_Icon')) return 'rt_item_weapon_sword';
    if (name.includes('weapon_bow_Icon')) return 'rt_item_weapon_fishbone_bow';
    if (name.includes('weapon_staff_Icon')) return 'rt_item_weapon_staff';
    if (name.includes('weapon_spear_Icon')) return 'rt_item_weapon_spear';
    if (name.includes('item_chest_Icon')) return 'rt_item_weapon_chest';
    if (name.includes('item_pet_egg_Icon')) return 'rt_item_pet_egg';
    if (name.includes('item_energy_potion_Icon')) return 'rt_item_energy_potion';
    if (name.includes('pet_material_common_Icon')) return 'rt_item_paw_token';
    if (name.includes('Pause_Panel')) return 'rt_panel_parchment';
    if (name.includes('MailDetail_Drawer') || name.includes('Policy_Modal') || name.includes('Policy_ScrollTextArea') || name.includes('Confirm_Modal')) return 'rt_panel_parchment';
    if (name.includes('MailDetail_InfoPanel') || name.includes('MailDetail_ContentPanel') || name.includes('MailDetail_RewardContainer')) return 'rt_card_inventory_detail';
    if (name.includes('MailDetail_EnvelopeIcon')) return 'rt_icon_side_mail';
    if (name.includes('MergeGuide_Modal')) return 'rt_panel_parchment';
    if (name.includes('MergeGuide_ResultCard')) return 'rt_card_inventory_detail';
    if (name.includes('MergeGuide_SourceA_rt_item_weapon_fishbone_bow') || name.includes('MergeGuide_SourceB_rt_item_weapon_fishbone_bow')) return 'rt_item_weapon_fishbone_bow';
    if (name.includes('MergeGuide_SourceA') || name.includes('MergeGuide_SourceB')) return 'rt_card_inventory_detail';
    if (name.includes('Defeat_TitleBanner')) return 'rt_panel_wood_header';
    if (name.includes('Defeat_SummaryPanel') || name.includes('Defeat_SuggestionPanel')) return 'rt_panel_parchment';
    if (name.includes('Defeat_RewardPanel')) return 'rt_panel_dark';
    if (name.includes('Header_') || name.includes('_Header') || name.includes('WoodTitle')) return 'rt_panel_wood_header';
    if (name.includes('BottomNavBg')) return 'rt_panel_bottom_nav';
    if (name.includes('ResourcePill_')) return 'rt_panel_resource_pill';
    if (name.includes('Tab_')) return name.includes('_Active') ? 'rt_panel_tab_active' : 'rt_panel_tab_inactive';
    if (name.includes('Shop_MainPanel') || name.includes('Home_StageSelector') || name.includes('Home_PlayerPlate') || name.includes('Placeholder_MainPanel') || name.includes('Battle_') || name.includes('BattlePrepare_')) return 'rt_panel_dark';
    if (name.includes('Pet_ShowcasePanel')) return 'rt_panel_dark';
    if (name.includes('Pet_SelectedPortraitFrame') || name.includes('Pet_SelectedSkillPanel') || name.includes('Pet_MaterialPanel')) return 'rt_panel_dark';
    if (name.includes('PetDetail_PortraitFrame') || name.includes('PetDetail_InfoPanel') || name.includes('PetDetail_AttributePanel') || name.includes('PetDetail_SkillPanel') || name.includes('PetDetail_MaterialPanel') || name.includes('PetDetail_EvolutionPreview')) return 'rt_panel_dark';
    if (name.includes('Pet_ListPanel')) return 'rt_panel_parchment';
    if (name.includes('Pet_Card_')) return 'rt_card_inventory_detail';
    if (name.includes('DailyTask_ActivityPanel') || name.includes('Explore_MapPanel') || name.includes('Achievement_SummaryPanel') || name.includes('Talent_PointPanel')) return 'rt_panel_dark';
    if (name.includes('Talent_TreePanel') || name.includes('Reward_ListPanel') || name.includes('Reward_SummaryPanel') || name.includes('SkillChoice_Title') || name.includes('SkillChoice_RerollChip')) return 'rt_panel_dark';
    if (name.includes('Talent_DetailPanel')) return 'rt_panel_parchment';
    if (name.includes('Mail_ListPanel') || name.includes('Settings_MainPanel') || name.includes('Merge_MainPanel') || name.includes('Guild_MainPanel')) return 'rt_panel_parchment';
    if (name.includes('Reward_TitleBanner')) return 'rt_panel_wood_header';
    if (name.includes('DailyTask_Row_') || name.includes('DailyTask_RewardPanel_') || name.includes('Mail_Row_') || name.includes('Mail_EmptyStatePanel') || name.includes('Settings_Row_') || name.includes('Explore_Card_') || name.includes('Guild_InfoPanel') || name.includes('Achievement_Row_')) return 'rt_card_inventory_detail';
    if (name.includes('DailyTask_Icon_Login')) return 'rt_icon_check';
    if (name.includes('DailyTask_Icon_Battle')) return 'rt_item_weapon_sword';
    if (name.includes('DailyTask_Icon_Merge')) return 'rt_item_weapon_chest';
    if (name.includes('DailyTask_Icon_Kill')) return 'rt_monster_goblin';
    if (name.includes('DailyTask_Icon_Ad')) return 'rt_item_scroll';
    if (name.includes('Achievement_TrophyIcon') || name.includes('Achievement_Badge_')) return 'rt_icon_paw';
    if (name.includes('Mail_Icon_')) return 'rt_icon_side_mail';
    if (name.includes('Reward_Card_') && name.includes('rt_icon_gold')) return 'rt_icon_gold';
    if (name.includes('Reward_Card_') && name.includes('rt_icon_purple_gem')) return 'rt_icon_purple_gem';
    if (name.includes('Reward_Card_') && name.includes('rt_item_weapon_fishbone_bow')) return 'rt_item_weapon_fishbone_bow';
    if (name.includes('Reward_Card_')) return 'rt_card_inventory_detail';
    if (name.includes('SkillCard_') && (name.includes('_IconMedallion') || name.includes('_RarityBadge') || name.includes('_Type'))) return undefined;
    if (name.includes('SkillCard_') && !name.includes('_Choose')) return 'rt_card_inventory_detail';
    if (name.includes('ToastCard_') || name.includes('ToastAutoDismissTimer')) return 'rt_panel_dark';
    if (name.includes('ToastRewardFly_Gold')) return 'rt_icon_gold';
    if (name.includes('ToastRewardFly_Gem')) return 'rt_icon_purple_gem';
    if (name.includes('Merge_Source') || name.includes('Merge_Result')) return 'rt_slot_inventory';
    if (name.includes('Talent_Node_')) return 'rt_slot_inventory';
    if (name.includes('Backpack_InventoryPanel')) return 'rt_panel_parchment';
    if (name.includes('Backpack_ItemDetailPanel')) return 'rt_card_inventory_detail';
    if (name.includes('GoodsCard_')) return 'rt_card_shop_product';

    if (name.includes('Button_Start') || name.includes('Button_OpenChest') || name.includes('Button_TalentLearn') || name.includes('_Choose') || name.includes('Button_PauseContinue') || name.includes('Button_RewardConfirm') || name.includes('Button_DefeatRetry') || name.includes('Button_MergeGuideConfirm') || name.includes('Button_PetDetailUpgrade') || name.includes('Button_PetDeploy') || name.includes('Button_PolicyAgree') || name.includes('Button_ConfirmOk') || name.includes('Button_AchievementClaimAllBottom')) return 'rt_btn_yellow';
    if (name.includes('Button_ResultAction') || name.includes('Button_RewardDouble') || name.includes('Button_PetDetailDeploy') || name.includes('Button_PetLevelUp') || name.includes('Button_MailDetailClaim') || name.includes('Button_MailClaimAll') || name.includes('Button_AchievementClaimAll')) return 'rt_btn_green';
    if (name.includes('Button_PauseToggleOn')) return 'rt_btn_green';
    if (name.includes('Button_PauseToggleOff')) return 'rt_btn_brown';
    if (name.includes('Button_Settings_Privacy') || name.includes('Button_Settings_Service')) return 'rt_btn_blue';
    if (name.includes('Button_Settings_')) return 'rt_btn_green';
    if (name.includes('Button_RefreshShop') || name.includes('Buy')) return 'rt_btn_green';
    if (name.includes('Button_BackHome') || name.includes('Button_Refresh') || name.includes('Button_PauseRestart') || name.includes('Button_DefeatUpgrade') || name.includes('Button_PetDetailBackList') || name.includes('Button_MailDetailReply')) return 'rt_btn_blue';
    if (name.includes('Button_PauseHome') || name.includes('Button_MailDetailDelete') || name.includes('Button_MailDeleteAll')) return 'rt_btn_red';
    if (name.includes('Button_Stage') || name.includes('Button_Merge') || name.includes('Button_TalentReset') || name.includes('Button_BackpackClose') || name.includes('Button_ShopBack') || name.includes('Button_Back_') || name.includes('Button_Close_') || name.includes('Button_Help_') || name.includes('Button_PauseClose') || name.includes('Button_SkillChoiceClose') || name.includes('Button_DefeatHome') || name.includes('Button_PolicyDisagree') || name.includes('Button_ConfirmCancel')) return 'rt_btn_brown';
    if (name.includes('NavButton_')) return name.includes('_Active') ? 'rt_btn_nav_active' : 'rt_btn_nav_inactive';

    if (name.includes('rt_icon_gold')) return 'rt_icon_gold';
    if (name.includes('rt_icon_purple_gem')) return 'rt_icon_purple_gem';
    if (name.includes('rt_item_weapon_fishbone_bow')) return 'rt_item_weapon_fishbone_bow';
    if (name.includes('ResourceIcon_Gold')) return 'rt_icon_gold';
    if (name.includes('ResourceIcon_Diamond')) return 'rt_icon_purple_gem';
    if (name.includes('ResourceIcon_BlueGem')) return 'rt_icon_blue_gem';
    if (name.includes('ResourceIcon_Energy')) return 'rt_icon_energy';
    if (name.includes('ResourceIcon_PawCoin')) return 'rt_icon_paw';
    if (name.includes('Button_Settings')) return 'rt_icon_settings';
    if (name.includes('RedDot_')) return 'rt_icon_reddot';
    if (name.includes('SideIcon_CheckIn')) return 'rt_icon_side_checkin';
    if (name.includes('SideIcon_Task')) return 'rt_icon_side_task';
    if (name.includes('SideIcon_Mail')) return 'rt_icon_side_mail';
    if (name.includes('SideIcon_Rank')) return 'rt_icon_side_rank';
    if (name.includes('TopIcon_CheckIn')) return 'rt_icon_side_checkin';
    if (name.includes('TopIcon_DailyTask')) return 'rt_icon_side_task';
    if (name.includes('TopIcon_Mail')) return 'rt_icon_side_mail';
    if (name.includes('TopIcon_Event')) return 'rt_item_weapon_chest';
    if (name.includes('TopIcon_FirstGift')) return 'rt_shop_gold_stack';
    if (name.includes('LeftIcon_Shop')) return 'rt_icon_nav_shop';
    if (name.includes('LeftIcon_Backpack')) return 'rt_icon_nav_backpack';
    if (name.includes('LeftIcon_Pet')) return 'rt_icon_nav_pet';
    if (name.includes('LeftIcon_Talent')) return 'rt_icon_nav_talent';
    if (name.includes('RightIcon_Achievement')) return 'rt_icon_side_rank';
    if (name.includes('RightIcon_Illustration')) return 'rt_item_scroll';
    if (name.includes('RightIcon_Settings')) return 'rt_icon_settings';
    if (name.includes('Button_Back')) return 'rt_icon_back';
    if (name.includes('Button_BackpackClose') || name.includes('Button_Close') || name.includes('Button_PauseClose') || name.includes('Button_SkillChoiceClose')) return 'rt_icon_close';

    if (name.includes('NavIcon_home')) return 'rt_cabin';
    if (name.includes('NavIcon_merge')) return 'rt_item_weapon_chest';
    if (name.includes('NavIcon_explore')) return 'rt_item_lantern';
    if (name.includes('NavIcon_guild')) return 'rt_avatar_cat';
    if (name.includes('NavIcon_shop')) return 'rt_icon_nav_shop';
    if (name.includes('NavIcon_backpack')) return 'rt_icon_nav_backpack';
    if (name.includes('NavIcon_battle')) return 'rt_icon_nav_battle';
    if (name.includes('NavIcon_talent')) return 'rt_icon_nav_talent';
    if (name.includes('NavIcon_pet')) return 'rt_icon_nav_pet';

    if (name.includes('GoodsGold_Icon')) return 'rt_shop_gold_stack';
    if (name.includes('GoodsStone_Icon')) return 'rt_item_enhance_stone';
    if (name.includes('GoodsEgg_Icon')) return 'rt_item_pet_egg';
    if (name.includes('GoodsChest_Icon')) return 'rt_item_weapon_chest';
    if (name.includes('GoodsDiamond_Icon')) return 'rt_shop_diamond_pack';
    if (name.includes('GoodsEnergy_Icon')) return 'rt_item_energy_potion';
    if (name.includes('Backpack_SelectedIcon') || name.includes('_FishboneCrossbow_Icon')) return 'rt_item_weapon_fishbone_bow';
    if (name.includes('_Blade_Icon')) return 'rt_item_weapon_sword';
    if (name.includes('_Bow_Icon')) return 'rt_item_weapon_bow';
    if (name.includes('_Staff_Icon')) return 'rt_item_weapon_staff';
    if (name.includes('_Shield_Icon')) return 'rt_item_weapon_axe';
    if (name.includes('_Drum_Icon')) return 'rt_item_drum';
    if (name.includes('_Gem_Icon')) return 'rt_item_enhance_stone';
    if (name.includes('_Scroll_Icon')) return 'rt_item_scroll';
    if (name.includes('_Bell_Icon')) return 'rt_item_lantern';
    if (name.includes('_Robe_Icon')) return 'rt_item_moon_bag';
    if (name.includes('_Torch_Icon')) return 'rt_item_bomb';
    if (name.includes('_Crystal_Icon')) return 'rt_item_crystal_blue';
    if (name.includes('_Count')) return 'rt_badge_count';
    if (name.includes('_SelectedGlow')) return 'rt_fx_selected_glow';
    if (name.includes('_Selected')) return 'rt_slot_inventory_selected';
    if (name.includes('Cell_') && name.includes('_Empty')) return 'rt_slot_inventory_empty';
    if (name.includes('Cell_')) return 'rt_slot_inventory';

    return undefined;
  }

  private resolveUIProductKey(name: string): string | undefined {
    if (name.includes('Battle_Monster')) return undefined;
    if (name.includes('Battle_MonsterHp')) return undefined;
    if (name.includes('Battle_Damage')) return undefined;
    if (name.includes('Battle_HPBar_Fill')) return undefined;
    if (name.includes('BattlePrepare_HeroCat_Sprite')) return undefined;
    if (name.includes('BattlePrepare_Enemy_rt_monster_')) return undefined;
    if (name.includes('BattlePrepare_Chest_rt_item_chest')) return undefined;
    if (name.includes('BattleWeapon_Live') && !name.includes('rt_battle_weapon_')) return undefined;

    if (name === 'Bg_LoginNight') return UIAssetKeys.backgrounds.loginNight;
    if (name === 'Bg_HomeCamp') return UIAssetKeys.backgrounds.homeCamp;
    if (name === 'Bg_Shop') return UIAssetKeys.backgrounds.shopVillage;
    if (name === 'Bg_BackpackParchment') return UIAssetKeys.backgrounds.inventoryParchment;

    if (name.includes('Hero_LoginCat_Sprite') || name.includes('Hero_HomeCat_Sprite')) return UIAssetKeys.characters.catHero;
    if (name.includes('ShopkeeperCat_Sprite')) return UIAssetKeys.characters.catShop;

    if (name.includes('Header_') || name.includes('_Header') || name.includes('WoodTitle')) return UIAssetKeys.panels.woodHeader;
    if (name.includes('BottomNavBg')) return UIAssetKeys.panels.bottomNav;
    if (name.includes('Battle_FieldArt') || name.includes('BattlePrepare_PreviewArt')) return undefined;
    if (name.includes('Home_StageSelector') || name.includes('Home_PlayerPlate') || name.includes('Home_TopFunctionBar')) return UIAssetKeys.panels.darkGlass;
    if (name.includes('Shop_MainPanel') || name.includes('Home_StageSelector') || name.includes('Home_PlayerPlate') || name.includes('Placeholder_MainPanel') || name.includes('Battle_') || name.includes('BattlePrepare_')) return UIAssetKeys.panels.dark;
    if (name.includes('Backpack_InventoryPanel')) return UIAssetKeys.panels.parchment;
    if (name.includes('Backpack_ItemDetailPanel') || name.includes('GoodsCard_')) return UIAssetKeys.panels.parchmentCard;

    if (name.includes('Button_Start') || name.includes('Button_OpenChest') || name.includes('_Choose') || name.includes('Button_AchievementClaimAllBottom')) return UIAssetKeys.buttons.yellow;
    if (name.includes('Button_RefreshShop') || name.includes('Buy')) return UIAssetKeys.buttons.green;
    if (name.includes('Button_PauseToggleOn')) return UIAssetKeys.buttons.green;
    if (name.includes('Button_PauseToggleOff')) return UIAssetKeys.buttons.brown;
    if (name.includes('Button_Settings_Privacy') || name.includes('Button_Settings_Service')) return UIAssetKeys.buttons.blue;
    if (name.includes('Button_Settings_')) return UIAssetKeys.buttons.green;
    if (name.includes('Button_BackHome') || name.includes('Button_Refresh')) return UIAssetKeys.buttons.blue;
    if (name.includes('Button_Stage') || name.includes('Button_Merge') || name.includes('Button_BackpackClose') || name.includes('Button_ShopBack') || name.includes('Button_Back_') || name.includes('Button_Close_') || name.includes('Button_Help_')) return UIAssetKeys.buttons.brown;

    if (name.includes('ResourceIcon_Gold')) return UIAssetKeys.icons.gold;
    if (name.includes('ResourceIcon_Diamond')) return UIAssetKeys.icons.purpleGem;
    if (name.includes('ResourceIcon_BlueGem')) return UIAssetKeys.icons.blueGem;
    if (name.includes('ResourceIcon_Energy')) return UIAssetKeys.icons.energy;
    if (name.includes('ResourceIcon_PawCoin')) return UIAssetKeys.icons.paw;
    if (name.includes('rt_icon_paw')) return UIAssetKeys.icons.paw;
    if (name.includes('Button_Settings')) return UIAssetKeys.icons.settings;
    if (name.includes('RedDot_')) return UIAssetKeys.icons.redDot;
    if (name.includes('Button_Back')) return UIAssetKeys.icons.back;
    if (name.includes('Button_BackpackClose') || name.includes('Button_Close')) return UIAssetKeys.icons.close;

    if (name.includes('NavIcon_home')) return UIAssetKeys.icons.home;
    if (name.includes('NavIcon_merge')) return UIAssetKeys.items.chest;
    if (name.includes('NavIcon_explore')) return UIAssetKeys.icons.talent;
    if (name.includes('NavIcon_guild')) return UIAssetKeys.icons.pet;
    if (name.includes('NavIcon_shop')) return UIAssetKeys.icons.shop;
    if (name.includes('NavIcon_backpack')) return UIAssetKeys.icons.backpack;
    if (name.includes('NavIcon_battle')) return UIAssetKeys.icons.battle;
    if (name.includes('NavIcon_talent')) return UIAssetKeys.icons.talent;
    if (name.includes('NavIcon_pet')) return UIAssetKeys.icons.pet;

    if (name.includes('GoodsStone_Icon') || name.includes('_Gem_Icon')) return UIAssetKeys.items.enhanceStone;
    if (name.includes('GoodsEgg_Icon')) return UIAssetKeys.items.petEgg;
    if (name.includes('GoodsChest_Icon')) return UIAssetKeys.items.chest;
    if (name.includes('GoodsEnergy_Icon')) return UIAssetKeys.items.potion;
    if (name.includes('Backpack_SelectedIcon') || name.includes('_FishboneCrossbow_Icon')) return UIAssetKeys.items.fishboneBow;
    if (name.includes('_Blade_Icon')) return UIAssetKeys.items.sword;
    if (name.includes('_Bow_Icon')) return UIAssetKeys.items.bow;
    if (name.includes('_Staff_Icon')) return UIAssetKeys.items.staff;
    if (name.includes('_Shield_Icon')) return UIAssetKeys.items.spear;

    return undefined;
  }

  private addLabelTo(
    parent: Node,
    value: string,
    fontSize: number,
    color: Color,
    width: number,
    height: number,
    options: Pick<TextOptions, 'align' | 'verticalAlign' | 'wrap' | 'outline'> = {},
  ): void {
    const labelNode = new Node(`Label_${parent.name}`);
    labelNode.layer = Layers.Enum.UI_2D;
    labelNode.parent = parent;
    const transform = labelNode.addComponent(UITransform);
    transform.setContentSize(width, height);
    const text = labelNode.addComponent(Label);
    this.applyLabelStyle(text, value, fontSize, color, options);
  }

  private applyLabelStyle(
    label: Label,
    value: string,
    fontSize: number,
    color: Color,
    options: Pick<TextOptions, 'align' | 'verticalAlign' | 'wrap' | 'outline'> = {},
  ): void {
    label.string = value;
    label.fontSize = fontSize;
    label.lineHeight = Math.floor(fontSize * 1.16);
    label.color = color;
    label.useSystemFont = true;
    label.fontFamily = 'sans-serif';
    label.isBold = true;
    label.enableWrapText = options.wrap ?? value.includes('\n');
    label.overflow = Label.Overflow.SHRINK;
    label.horizontalAlign = this.toHorizontalAlign(options.align ?? 'center');
    label.verticalAlign = this.toVerticalAlign(options.verticalAlign ?? 'center');
    if (options.outline) {
      label.enableOutline = true;
      label.outlineColor = UIColors.woodStroke;
      label.outlineWidth = Math.max(2, Math.floor(fontSize * 0.1));
    }
  }

  private toHorizontalAlign(align: TextAlign): number {
    if (align === 'left') {
      return Label.HorizontalAlign.LEFT;
    }
    if (align === 'right') {
      return Label.HorizontalAlign.RIGHT;
    }
    return Label.HorizontalAlign.CENTER;
  }

  private toVerticalAlign(align: VerticalAlign): number {
    if (align === 'top') {
      return Label.VerticalAlign.TOP;
    }
    if (align === 'bottom') {
      return Label.VerticalAlign.BOTTOM;
    }
    return Label.VerticalAlign.CENTER;
  }
}



