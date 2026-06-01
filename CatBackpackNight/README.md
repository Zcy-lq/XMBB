# 猫猫背包守夜

这是 `猫猫背包守夜` 的 Cocos Creator 微信小游戏项目目录。

当前目录已经具备 Cocos Creator 3.8 TypeScript 客户端骨架。后续请按顺序运行：

1. ProductAgent
2. UIUXAgent
3. AssetAgent
4. ClientArchAgent
5. GameLogicAgent
6. PlatformAgent
7. QAReleaseAgent

## 技术路线

- 引擎：Cocos Creator 3.8 LTS/3.x
- 语言：TypeScript
- 发布目标：微信小游戏
- 设计基准：750 x 1334
- 设计图目录：`C:/Users/User/Desktop/ima`

## 当前工程结构

- `assets/scripts/core`：事件、路由、资源、音频、存档、时间、红点管理。
- `assets/scripts/data`：MVP 本地存档结构和默认数据。
- `assets/scripts/configs`：路由、全局常量、配置表管理入口。
- `assets/scripts/services`：微信平台、激励广告、埋点、服务初始化占位。
- `assets/scripts/scenes`：Login/Home/BattlePrepare/Battle 场景入口脚本。
- `assets/scripts/ui`：UIUXAgent 已有组件脚本，加上 `UIManager` 和运行时 UI 骨架生成器。
- `assets/scenes`：Login/Home/BattlePrepare/Battle 轻量场景占位。
- `assets/configs/assets.json`：AssetAgent 输出的资源索引，运行时加载策略已预留接口。

## 如何用 Cocos Creator 打开

1. 打开 Cocos Dashboard 或 Cocos Creator 3.8。
2. 选择“导入项目”。
3. 选择目录：`D:/工作/XMBB/CatBackpackNight`。
4. 打开后先让 Cocos 自动生成 `library/temp` 等目录。
5. 打开 `assets/scenes/Login.scene`、`Home.scene`、`BattlePrepare.scene`、`Battle.scene` 检查场景资源。

说明：当前 `.scene` 是轻量占位，核心逻辑在 `assets/scripts/scenes/*SceneEntry.ts`。如果 Cocos 打开后重建场景序列化，请在对应场景根节点挂一个入口脚本：

- Login：`LoginSceneEntry`
- Home：`HomeSceneEntry`
- BattlePrepare：`BattlePrepareSceneEntry`
- Battle：`BattleSceneEntry`

入口脚本会自动创建 Canvas、UIManager 和占位 UI 层，不需要手动搭大量节点。

## 如何构建微信小游戏

1. 在 Cocos Creator 顶部菜单打开“项目 / 构建发布”。
2. 平台选择“微信小游戏”。
3. 初期 `appid` 可继续使用 `project.config.json` 里的 `touristappid`，正式发布时由 PlatformAgent 替换。
4. 构建输出后，用微信开发者工具导入构建目录。
5. 如果微信开发者工具报资源、分包、AppID 或 API 错误，把完整错误文本交给 Codex/QAReleaseAgent。

## 报错怎么反馈给 Codex

请直接复制：

- Cocos Creator 控制台红色报错全文。
- 微信开发者工具 Console 报错全文。
- 当前打开的场景名。
- 触发步骤，例如“打开 Login.scene 后点击预览”。

不要只截图最后一行。完整堆栈能让后续 Agent 快速定位脚本、资源或平台问题。

## 关键文档

- `../docs/ARCHITECTURE_PLAN.md`
- `../docs/UI_DESIGN_TEMPLATE.md`
- `../docs/WECHAT_MINIGAME_STEP_BY_STEP.md`
- `docs/GDD.md`
- `docs/MVP_SCOPE.md`
- `docs/UI_COMPONENT_SPEC.md`
- `docs/PREFAB_LIST.md`
- `docs/SCREEN_FLOW.md`

## 小白操作方式

你不需要手写代码。让 Codex 读取 `../agent_outputs/*.prompt.md`，按顺序生成和修复项目。

当 Cocos Creator 或微信开发者工具报错，把报错复制给 Codex，让 QAReleaseAgent 修。

## 给 GameLogicAgent 的交接

- 统一从 `SaveManager.instance` 读写本地存档，资源变化必须通过 `SaveManager.update()` 保持幂等。
- 事件名在 `assets/scripts/game/GameEvents.ts`，战斗、背包、商店、宠物、天赋、任务、邮件都应按事件发埋点和红点刷新。
- 路由统一走 `SceneRouter.instance.go(route)`，不要在业务逻辑里直接散落 `director.loadScene`。
- `BattleSessionModel.ts` 只是局内状态壳，真实自动战斗、怪物、武器冷却、奖励结算请继续在 `assets/scripts/game` 下扩展。
- 配置表入口是 `ConfigManager`，后续章节、武器、怪物、商店、任务等都应配置驱动。

## 给 PlatformAgent 的交接

- 微信能力入口在 `services/PlatformService.ts`。
- 激励广告占位在 `services/AdService.ts`，必须补齐 ready/loading/cancelled/failed/unavailable/rewarded 状态。
- 埋点入口在 `services/AnalyticsService.ts`，payload 已包含本地玩家 ID、当前波次和资源快照。
- 本地存档目前用 `sys.localStorage`，后续云存档或账号同步请包在服务层，不要让 UI/玩法直接依赖微信 API。
- 正式 AppID、分享、排行榜、开放数据域、隐私合规弹窗由 PlatformAgent 后续接入。
