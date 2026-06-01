# 《猫猫背包守夜》小白版全流程开发指南

你的目标不是学会 Cocos 或小游戏开发，而是让 Codex 帮你把项目做出来。你只需要做少量无法替代的动作：安装工具、打开项目、把报错发给 Codex。

## 1. 最终技术选择

本项目采用：

`Cocos Creator 3.8 LTS/3.x + TypeScript + 微信小游戏构建`

不采用纯原生 Canvas 作为正式商业方案。

原因：

- 你的游戏有大量页面：主页面、战斗、背包、宠物、商店、任务、成就、邮件、天赋、设置。
- Cocos 更适合 2D 游戏 UI、动画、Prefab、资源管理和微信小游戏发布。
- Codex 更容易生成和维护 TypeScript 代码、配置表、Prefab 规划和工程结构。
- 商业级上线需要资源分包、图集、性能优化、平台能力和可运营配置，Cocos 比纯 Canvas 稳。

## 2. 你已经准备好的东西

当前工作目录：

`C:/Users/User/Desktop/XMBB`

正式设计图目录：

`C:/Users/User/Desktop/ima`

核心文档：

- `docs/ARCHITECTURE_PLAN.md`：商业级架构方案。
- `docs/UI_DESIGN_TEMPLATE.md`：专业 UI 设计模板。
- `cat_game_agents_prompts.json`：7 个 Agent 的分工、模型和提示词。
- `run_multi_agent.py`：生成每个 Agent 任务书。

## 3. 你需要安装什么

只需要安装两样：

1. Cocos Creator 3.8 LTS 或 3.x
2. 微信开发者工具

安装好以后，后续尽量让 Codex 处理项目文件。

## 4. 生成多 Agent 任务书

在 PowerShell 里执行：

```powershell
cd C:/Users/User/Desktop/XMBB
python run_multi_agent.py
```

会生成：

- `agent_outputs/ProductAgent.prompt.md`
- `agent_outputs/UIUXAgent.prompt.md`
- `agent_outputs/AssetAgent.prompt.md`
- `agent_outputs/ClientArchAgent.prompt.md`
- `agent_outputs/GameLogicAgent.prompt.md`
- `agent_outputs/PlatformAgent.prompt.md`
- `agent_outputs/QAReleaseAgent.prompt.md`

这些就是给 Codex 逐个执行的任务书。

## 5. 多 Agent 怎么跑

推荐不要让 7 个 Agent 一起乱跑。按顺序执行最稳：

1. ProductAgent
2. UIUXAgent
3. AssetAgent
4. ClientArchAgent
5. GameLogicAgent
6. PlatformAgent
7. QAReleaseAgent

每次你只需要给 Codex 发一句：

```text
请读取 C:/Users/User/Desktop/XMBB/agent_outputs/ProductAgent.prompt.md，
严格按里面要求执行，创建或修改真实项目文件。
我是小游戏小白，请尽量不要让我手动操作。
完成后写清楚改了哪些文件、下一步要跑哪个 Agent。
```

等它完成后，把 `ProductAgent` 换成下一个 Agent 名字即可。

## 6. 每个 Agent 用什么模型

暂不考虑成本，全部使用当前 Codex 可用的最高标准模型。

| Agent | 推荐模型 | 原因 |
| --- | --- | --- |
| ProductAgent | `gpt-5.5` | 负责产品系统、玩法闭环、商业闭环、验收标准，需要强推理和全局规划能力 |
| UIUXAgent | `gpt-5.5` | 需要理解 UI 参考图、交互流程、页面层级，并转换成 Cocos/微信小游戏 UI 实现方案 |
| AssetAgent | `gpt-5.5` | 需要规划资源拆分、图集、命名规范、分包策略和替换路径 |
| ClientArchAgent | `gpt-5.5` | 客户端主架构最关键，需要设计模块边界、目录结构、状态管理和构建流程 |
| GameLogicAgent | `gpt-5.5` | 战斗、背包、合成、任务、宠物、经济系统容易出现边界 bug，需要强代码推理 |
| PlatformAgent | `gpt-5.5` | 微信登录、广告、分享、存档、合规、Mock 兜底风险较高 |
| QAReleaseAgent | `gpt-5.5` | 上线前需要覆盖工程、玩法、UI、性能、合规、包体和发布检查 |

如果 Codex 只能选一个模型，就全部选：

```powershell
codex -m gpt-5.5
```

也可以在 Codex 配置里设置默认模型：

```toml
model = "gpt-5.5"
```

如果你的 Codex 面板里没有 `gpt-5.5`，就按这个优先级选择：

```text
gpt-5.5
↓
gpt-5.4
↓
gpt-5.3-codex
↓
gpt-5.4-mini
```

一句话原则：

如果你的 Codex 只能选一个模型，就全部选当前可用的最强模型，优先选择 `gpt-5.5`；如果没有，则选择 Codex 面板里可用的最高级模型。

## 7. 你最少需要做的人工操作

你只做这些：

1. 安装 Cocos Creator。
2. 安装微信开发者工具。
3. 让 Codex 按 Agent 顺序生成项目。
4. 在 Cocos Creator 里打开：

   `D:/工作/XMBB/CatBackpackNight`

5. 点击预览或构建微信小游戏。
6. 如果报错，把报错内容复制给 Codex。

你不需要手写 TypeScript，不需要自己切所有图，不需要自己配复杂架构。

## 8. 给 Codex 的万能修复命令

当 Cocos 报错：

```text
我是小游戏小白。请修复 D:/工作/XMBB/CatBackpackNight 的 Cocos 项目。
这是 Cocos Creator 的报错：
【粘贴报错】

要求：
1. 能自动修复就直接修改文件。
2. 不要让我手动改代码。
3. 保持 docs/UI_DESIGN_TEMPLATE.md 的设计风格。
4. 修复后告诉我重新点哪里验证。
```

当微信开发者工具报错：

```text
我是小游戏小白。请修复 CatBackpackNight 构建微信小游戏后的问题。
这是微信开发者工具报错：
【粘贴报错】

请判断是 Cocos 构建配置、微信平台 API、资源路径还是代码问题。
能修就直接修，不能修就给我最短操作步骤。
```

## 9. 商业级上线全流程

第一阶段：可玩 MVP

- 登录页进入主页面。
- 主页面进入准备战斗。
- 准备战斗进入战斗。
- 战斗自动攻击并结算胜利。
- 背包能合成。
- 商店能购买。
- 宠物能升级和出战。
- 任务/成就/邮件/设置有基础闭环。

第二阶段：商业化完善

- 新手引导。
- 激励视频广告。
- 每日任务和活跃宝箱。
- 邮件补偿。
- 红点系统。
- 排行榜。
- 图集和分包优化。
- 真机性能测试。

第三阶段：上线准备

- 隐私政策、用户协议、适龄提示。
- 微信小游戏后台配置。
- 体验版测试。
- 包体和性能检查。
- 提审材料。

## 10. 你每次验收看什么

你不用看代码，主要看：

- 页面像不像你的设计图。
- 按钮能不能点。
- 战斗有没有跑起来。
- 奖励有没有到账。
- 购买有没有扣钱。
- 合成有没有变强。
- 宠物升级有没有变化。
- 报错有没有消失。

如果不满意，直接说：

```text
这个页面不像我的设计图，请对照 C:/Users/User/Desktop/ima/商店.png 重新调整 UI。
要求达到商业级移动游戏质感，按钮、卡片、标题、资源栏都要统一。
```
