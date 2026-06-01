# 图集与 Bundle 分包方案

本文档定义《猫猫背包守夜》的 Cocos Creator 3.8 图集、Bundle、首包、远程资源、缓存和版本策略。资源 ID 与具体路径以 `CatBackpackNight/assets/configs/assets.json` 为准。

## 目标

- 首包只放登录、公共 UI、主页最低可用资源，目标控制在 3.5 MB 以内。
- 战斗、背包、宠物、商店、任务、成就、邮件、天赋等资源按页面或玩法 Bundle 懒加载。
- 大背景、宠物高清立绘、活动皮肤和非首日内容优先远程化。
- 小图标和高频 UI 使用图集，减少 draw call 和文件请求。
- 参考设计图只用于工程协作，不进入生产运行包。

## 平台包体口径

当前工程按保守预算执行：

| 项 | 策略 |
| --- | --- |
| 主包硬线 | 按 4 MB 控制 |
| 主包工程目标 | 不超过 3.5 MB |
| 本地分包软目标 | 全部本地分包合计优先压在 20 MB 内 |
| Cocos 3.8 文档口径 | 微信小游戏所有分包大小不超过 30 MB，主包不超过 4 MB |
| 发版前动作 | 以当时微信开发者工具、平台后台和官方文档校验结果为准 |

参考资料：

- Cocos Creator 3.8 分包文档：`https://docs.cocos.com/creator/3.8/manual/zh/editor/publish/subpackage.html`
- 腾讯云小游戏包体说明：`https://www.tencentcloud.com/zh/document/product/1219/61722`

由于平台额度可能按工具版本、账号能力或后台策略变化，QAReleaseAgent 必须在上线前跑一次真实构建体积检查。

## 图集规划

| 图集 | Bundle | 建议尺寸 | 内容 | 规则 |
| --- | --- | --- | --- | --- |
| `atlas_ui_common` | `boot` | 1024 或 2048 | 通用按钮、面板、返回/关闭/设置/锁/红点、货币 | 首包核心图集，只收 P0/P1 高频 UI；九宫格资源保留 border |
| `atlas_characters_common` | `boot` | 1024 | 登录和主页主角猫、火堆小光效 | 控制体积，立绘不要放超大透明留白 |
| `atlas_home_ui` | `home` | 1024 | 主页侧边入口、章节牌、底部导航补充图标 | 首页进入后加载，可常驻 |
| `atlas_battle_units` | `battle` | 2048 | 战斗猫、P0/P1 怪物、怪物阴影 | 战斗前预加载，战斗结束后按内存压力释放 |
| `atlas_battle_effects` | `battle` | 1024 或 2048 | 子弹、命中、火花、伤害数字、星光、火光 | 序列帧数量受控，优先复用粒子和 tint |
| `atlas_items_core` | `inventory` | 2048 | 武器、道具、宝箱、钥匙、宠物蛋、药水 | 背包、商店、奖励共用；可被多个 Bundle 引用时放公共远程或 inventory Bundle |
| `atlas_pet_units` | `pet` | 2048 | 宠物头像、宠物大图、星级/品质徽章 | 高清宠物立绘可拆远程，不和小徽章混包 |
| `atlas_shop_task` | `meta` | 1024 | 商店卡片装饰、任务/成就/邮件奖励图标 | 运营型页面合包，进入相关页面时加载 |
| `atlas_talent` | `meta` | 1024 | 天赋节点、连线、已升级/锁定状态 | 节点图标复用，不为每个节点切独图 |

打包规则：

- 大背景不进图集，单独纹理加载。
- 透明留白超过 30% 的角色图先 trim，再校准锚点。
- 九宫格按钮和面板可以入图集，但禁止被旋转；Cocos 导入后检查 border。
- 同一屏高频一起出现的小图进入同一图集，跨页面低频资源不要混到首包图集。
- 单个图集超过 2048 或利用率低于 55% 时拆分。

## Bundle 规划

| Bundle | 包含内容 | 加载时机 | 卸载策略 |
| --- | --- | --- | --- |
| `boot` | 登录背景、公共 UI、基础货币图标、主角猫、最小 ResourceManager 配置 | 启动时加载 | 常驻 |
| `home` | 主页背景、章节牌、侧边入口、底部导航补充资源 | 登录成功后加载 | 常驻或低内存时保留公共 UI 后释放主页大背景 |
| `battle` | 战斗背景、战斗单位、怪物、武器槽、战斗特效 | 准备战斗前预加载 | 战斗后保留短时间；回主页或进非战斗页后可释放 |
| `inventory` | 背包网格、物品武器、合成光效、开箱资源 | 打开背包或战斗需要背包栏时加载 | 离开背包且不在战斗时释放 |
| `pet` | 宠物列表、宠物详情、宠物立绘、升级材料图标 | 打开宠物页时加载 | 离开宠物页释放高清立绘 |
| `shop` | 商店卡片、商品资源、广告刷新图标 | 打开商店时加载 | 离开商店释放 |
| `meta` | 每日任务、成就、邮件、设置、天赋节点 | 打开对应运营页面时加载 | 页面关闭后释放，任务红点保留数据不保留贴图 |
| `remote_hd` | 高清背景、活动皮肤、宠物大立绘、二阶段高级特效 | 网络可用且需要时下载 | 走微信文件缓存，按版本清理 |
| `dev_reference` | `assets/textures/references` 的 16 张整页设计图 | 仅编辑器或开发调试 | 生产构建排除 |

建议加载顺序：

1. 启动加载 `boot` 和 `assets_runtime.json`。
2. 登录成功加载 `home`。
3. 点击开始战斗后并行预加载 `battle` 和必要的 `inventory` 子集。
4. 进入背包、宠物、商店、任务等页面时按需加载对应 Bundle。
5. 远程高清资源只替换视觉，不阻断核心玩法。

## 首包控制

首包只允许：

- `assets/configs/assets.json`
- `assets/configs/assets_runtime.json`
- 登录页最低可用背景或压缩版背景
- 公共 UI P0：按钮、面板、返回/关闭/设置/锁/红点
- 货币 P0：金币、紫钻、蓝钻、体力
- 主角猫 P0 小尺寸版
- ResourceManager、SceneRouter、登录和主页必要脚本

首包禁止：

- 16 张整页参考图
- 背包、宠物、商店、任务、成就、邮件完整资源
- 高清宠物立绘
- 大量怪物、长序列帧特效
- 未被首屏使用的活动资源

当前参考图目录约 31.54 MB，任何生产构建如果包含它们都应视为失败。

## 远程资源策略

远程资源用于不影响首局体验的高清和运营内容：

- CDN 路径建议：`https://cdn.example.com/cat-backpack-night/assets/{version}/{bundle}/{file}`
- 版本目录使用语义版本或构建号，例如 `1.0.0`、`1.0.1-hotfix.1`。
- 远程清单建议保留：`remote-manifest.json`，字段包含 `id`、`url`、`sha256`、`bytes`、`version`、`fallbackId`。
- 首次下载失败时使用本地低清图或 Canvas 占位，不能卡死进入页面。
- 下载完成后写入微信本地文件缓存；每次启动只校验 manifest 版本，不逐个拉图。
- 热更新只新增版本目录，不覆盖旧文件；确认新版本稳定后再清理旧缓存。

## 缓存和版本控制

ResourceManager 建议实现：

- `loadAsset(id)`：运行时读取 `assets_runtime.json`，按 `bundle` 和 `finalPath` 加载。`assets.json` 保留给美术切图、参考图溯源和资源生产管理。
- `preloadBundle(name)`：进入页面前预加载 Bundle。
- `releaseBundle(name)`：页面关闭或低内存时释放非常驻 Bundle。
- `getFallback(id)`：正式图缺失时返回同类默认图或绘制占位。
- `assetVersion`：从远程 manifest 或本地配置读取，拼到远程 URL。
- `hashCheck`：远程下载后校验 SHA256，失败则删除缓存并降级。

缓存清理规则：

- 常驻：`boot`、`home` 的核心 UI 和主角小图。
- 可释放：`battle`、`inventory`、`pet`、`shop`、`meta` 中的大图和特效。
- 定期清理：旧活动皮肤、旧版本远程背景、未访问超过 7 天的高清立绘。
- 不缓存：开发参考图、一次性调试图。

## 给后续 Agent 的接口约定

ClientArchAgent：

- ResourceManager 以 `assets_runtime.json` 的 `id` 为运行时入口，资源生产仍以 `assets.json` 为总索引。
- Bundle 名称使用本文档表格，不另起一套命名。
- 不把 `assets/textures/references` 放入 `resources` 或首包场景引用链。

UIUXAgent：

- Prefab 只绑定资源 ID，不绑定具体中文文件名。
- 页面缺图时用绘制占位，保留 `id` 以便素材替换后自动生效。
- 九宫格 border 先按 `assets.json` 的 `cut.nineSlice` 设置。

GameLogicAgent：

- 武器、怪物、技能配置表引用 `weapon_*`、`monster_*`、`fx_*` 资源 ID。
- 新增玩法资源时先向 `assets.json` 加资源 ID，再写玩法配置。

QAReleaseAgent：

- 构建后检查主包体积、本地分包体积和是否包含 reference PNG。
- 检查低端机首战加载耗时和 Bundle 释放后的内存回落。
- 发版前复核微信平台最新包体规则。
