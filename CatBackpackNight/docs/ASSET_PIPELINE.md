# 猫猫背包守夜素材管线

本文档由 AssetAgent 维护，覆盖参考图接入、资源 ID、切图规范、占位替换和交付验收。资源索引见 `CatBackpackNight/assets/configs/assets.json`。

## 当前接入状态

已将 `C:/Users/User/Desktop/ima` 下 16 张正式设计图复制到：

`CatBackpackNight/assets/textures/references/`

复制后的文件使用英文稳定命名，避免 Cocos、构建脚本或远程 CDN 在中文路径上出现兼容问题。原中文文件名、源路径、尺寸、大小和 SHA256 已写入 `assets.json` 的 `references`。

| 页面 | 原始文件 | 项目引用文件 | 引用 ID |
| --- | --- | --- | --- |
| 登录页 | `登陆页面.png` | `ref_login.png` | `ref_login` |
| 主页面 | `主页面.png` | `ref_home.png` | `ref_home` |
| 准备战斗 | `准备开始战斗.png` | `ref_battle_prepare.png` | `ref_battle_prepare` |
| 战斗页 | `战斗.png` | `ref_battle.png` | `ref_battle` |
| 背包 | `背包.png` | `ref_inventory.png` | `ref_inventory` |
| 合成提示 | `合成提示.png` | `ref_merge_tutorial.png` | `ref_merge_tutorial` |
| 宠物 | `宠物.png` | `ref_pet.png` | `ref_pet` |
| 宠物详情 | `宠物详情.png` | `ref_pet_detail.png` | `ref_pet_detail` |
| 商店 | `商店.png` | `ref_shop.png` | `ref_shop` |
| 技能 | `技能.png` | `ref_skill_select.png` | `ref_skill_select` |
| 天赋 | `天赋.png` | `ref_talent.png` | `ref_talent` |
| 每日任务 | `每日任务.png` | `ref_daily_task.png` | `ref_daily_task` |
| 成就 | `成就.png` | `ref_achievement.png` | `ref_achievement` |
| 邮件 | `邮件.png` | `ref_mail.png` | `ref_mail` |
| 设置 | `设置.png` | `ref_settings.png` | `ref_settings` |
| 胜利 | `胜利.png` | `ref_victory.png` | `ref_victory` |

注意：这些引用图总计约 31.54 MB，只用于设计还原、切图定位和占位，不进入生产运行链路。

运行时说明：`assets/configs/assets.json` 是美术生产与切图溯源总索引；运行时代码注册 `assets/configs/assets_runtime.json`，该文件由 `npm run generate:runtime-assets` 从 `assets/textures/runtime` 生成，只保留真实存在的运行时 PNG，不允许包含 `assets/textures/references`。

## 目录和命名

最终素材路径在 `assets.json` 中预留，但本阶段只创建引用资源目录。后续切图 Agent 或美术交付时按以下路径落图：

```text
assets/textures/
  backgrounds/
  characters/
    cats/
    pets/
    monsters/
  currency/
  effects/
  fonts/
  items/
    props/
    weapons/
  ui/
    buttons/
    icons/
    panels/
assets/atlases/
assets/configs/assets.json
assets/configs/assets_runtime.json
```

命名规则：

- 只使用小写英文、数字和下划线，例如 `btn_yellow.png`。
- 资源 ID 与文件名保持一致，不带扩展名。
- 同一逻辑资源跨品质或等级时追加后缀，例如 `weapon_sword_lv01`、`weapon_sword_lv02`。
- 多帧动画使用连续序号，例如 `fx_fire_0001.png` 到 `fx_fire_0008.png`。
- 运行时读取 `assets_runtime.json` 的 `id`，不要在 UI 或玩法代码里硬编码文件路径。资源生产与切图仍维护 `assets.json`。

## 第一阶段占位策略

第一阶段允许 UIAgent 用 Canvas/Cocos 图形绘制近似组件，或在编辑器内参考整页图还原布局。运行时代码需要遵守：

- 不直接加载 `assets/textures/references/*`。
- 如果最终切图缺失，ResourceManager 返回 Canvas 绘制占位、纯色九宫格或默认图标。
- `assets.json` 中 `status=placeholderFromReference` 表示可以临时用整页参考图定位，但发版前必须替换成 `finalPath`。
- `status=needsSlice` 表示设计图内已有样式，需要从参考图或源文件切出。
- `status=needsArt` 表示设计图没有足够清晰独立图形，需要补画或生成正式图。

## 切图清单

P0 是首屏、主页、战斗必需资源；P1 是 MVP 常用但可延迟加载；P2 是第二阶段补齐资源。

| 优先级 | 资源 ID | 类型 | 参考图 | 输出路径 |
| --- | --- | --- | --- | --- |
| P0 | `bg_login_night` | 背景 | `ref_login` | `assets/textures/backgrounds/bg_login_night.png` |
| P0 | `bg_home_camp` | 背景 | `ref_home` | `assets/textures/backgrounds/bg_home_camp.png` |
| P0 | `bg_battle_forest` | 背景 | `ref_battle` | `assets/textures/backgrounds/bg_battle_forest.png` |
| P0 | `bg_panel_dark` | 九宫格面板 | `ref_battle`, `ref_pet` | `assets/textures/ui/panels/bg_panel_dark.png` |
| P0 | `bg_panel_parchment` | 九宫格面板 | `ref_inventory`, `ref_daily_task` | `assets/textures/ui/panels/bg_panel_parchment.png` |
| P0 | `cat_main_idle` | 角色 | `ref_login`, `ref_home` | `assets/textures/characters/cats/cat_main_idle.png` |
| P0 | `cat_battle_weapon` | 角色 | `ref_battle` | `assets/textures/characters/cats/cat_battle_weapon.png` |
| P0 | `panel_wood_header` | 九宫格 UI | 多页面木牌标题 | `assets/textures/ui/panels/panel_wood_header.png` |
| P0 | `panel_parchment` | 九宫格 UI | 背包、任务、成就、邮件 | `assets/textures/ui/panels/panel_parchment.png` |
| P0 | `panel_dark` | 九宫格 UI | 战斗、准备、宠物 | `assets/textures/ui/panels/panel_dark.png` |
| P0 | `btn_yellow` | 九宫格按钮 | 登录、主页、胜利 | `assets/textures/ui/buttons/btn_yellow.png` |
| P0 | `btn_green` | 九宫格按钮 | 任务、成就、商店 | `assets/textures/ui/buttons/btn_green.png` |
| P0 | `btn_blue` | 九宫格按钮 | 商店、技能、邮件 | `assets/textures/ui/buttons/btn_blue.png` |
| P0 | `icon_back`, `icon_close`, `icon_settings`, `icon_lock`, `icon_reddot` | 图标 | 多页面 | `assets/textures/ui/icons/*.png` |
| P0 | `icon_gold`, `icon_purple_gem`, `icon_blue_gem`, `icon_energy` | 货币 | 主页、商店 | `assets/textures/currency/*.png` |
| P0 | `monster_ghost` | 怪物 | `ref_battle` | `assets/textures/characters/monsters/monster_ghost.png` |
| P0 | `fx_bullet`, `fx_spark`, `fx_hit`, `fx_fire` | 特效 | 战斗、登录、主页 | `assets/textures/effects/*.png` |
| P1 | `cat_pet_black`, `pet_shadow_cat` | 宠物 | 宠物、宠物详情 | `assets/textures/characters/pets/*.png` |
| P1 | `btn_brown`, `icon_help`, `icon_paw_coin` | UI/货币 | 设置、宠物、商店 | `assets/textures/ui/*`, `assets/textures/currency/*` |
| P1 | `weapon_sword`, `weapon_bow`, `weapon_staff`, `item_shield`, `item_key`, `item_chest` | 武器/道具 | 背包、战斗、商店、胜利 | `assets/textures/items/**/*` |
| P1 | `monster_skeleton`, `monster_goblin`, `fx_damage_number`, `fx_starlight`, `fx_merge_glow`, `fx_reward_glow` | 战斗/奖励 | 战斗、合成、胜利 | `assets/textures/characters/monsters/*`, `assets/textures/effects/*` |
| P2 | `pet_husky`, `pet_panda`, `pet_dog` | 宠物 | 宠物页风格延展 | `assets/textures/characters/pets/*.png` |
| P2 | `weapon_spear`, `weapon_fishbone_bow`, `item_bomb`, `item_pet_egg`, `item_energy_potion` | 武器/道具 | 背包、商店、技能 | `assets/textures/items/**/*` |
| P2 | `monster_dark_mage`, `monster_orc` | 怪物 | 战斗页风格延展 | `assets/textures/characters/monsters/*.png` |

完整字段、Bundle、图集和加载策略以 `assets.json` 为准。

## 切图规范

基础规范：

- UI 基准按 `750x1334` 逻辑坐标设计，贴图源建议按 `1080x1920` 或 2x 输出，运行时由 Cocos 缩放。
- 独立角色、怪物、道具、图标必须透明背景 PNG。
- 大背景不进图集，使用单独纹理；按设备尺寸铺满或裁切，避免在图集里浪费空间。
- 九宫格面板和按钮需要保留边框、投影和高光，导入后设置 SpriteFrame border。
- 小图标统一导出 64x64、72x72、96x96 或 128x128，避免每个图标尺寸漂移。
- 所有切图外沿至少保留 2px 透明 padding，图集打包时再设置 extrude/padding。

九宫格建议：

- 按钮：左右边距 34-42px，上下边距 24-30px。
- 木牌标题：左右 46px，上下 38px。
- 羊皮纸/深色面板：四边 28px。
- 具体 border 已写入 `assets.json` 的 `cut.nineSlice`，UIAgent 可以先按这些值创建 Sprite 组件。

压缩建议：

- UI 图标、按钮、面板保留 alpha，优先 PNG 源图，构建时按平台压缩。
- 大背景可单独导出 WebP/JPG 版本用于远程高清包，但 Cocos 源项目保留 PNG 母版。
- 战斗特效如使用序列帧，单帧尽量不超过 256x256；更复杂的光效优先用粒子或 shader 参数，不堆大量 PNG。
- 参考图不压缩、不二次采样，确保设计对照不失真。

## Cocos 导入设置

建议 ClientArchAgent 或后续 AssetAgent 在 Cocos Creator 中设置：

- 背景纹理：禁用 mipmap，Filter 使用 Linear，Wrap 使用 Clamp。
- 像素风以外的 UI：Filter 使用 Linear，避免边缘锯齿。
- 小图标图集：开启 trim 和 tight packing，但九宫格资源避免破坏边框。
- SpriteAtlas：padding/extrude 至少 2px，避免透明边漏色。
- 不把参考图拖入场景、Prefab、`resources` 目录或生产 Bundle。

## 验收清单

每次新增或替换正式切图后检查：

- `assets.json` 中对应 `status` 从 `needsSlice` 或 `needsArt` 更新为 `ready`。
- `finalPath` 文件存在，文件名与资源 ID 一致。
- Cocos 中 SpriteFrame border 与 `cut.nineSlice` 一致。
- 首屏和战斗 P0 资源可在无网络时加载。
- 非首包页面资源能按 Bundle 懒加载，切出页面后可释放。
- 构建产物确认没有把 `assets/textures/references` 打入生产运行包。

## Runtime Asset Quality Gate

`assets/configs/runtime_asset_quality.json` is the current gate for distinguishing final candidates from temporary or test art.

Allowed runtime input:

- `assets/textures/runtime/*.png`

Development-only input:

- `assets/textures/references/ref_*.png`
- `tmp/qa_*.png`
- `tmp/cocos_*.png`
- `tmp/*round*.png`
- `tmp/*contact*.png`
- screenshots, visual QA captures, and crop experiments

Required checks after any asset batch:

```powershell
npm run generate:runtime-assets
npm run verify:runtime-assets
npm run audit:runtime-asset-quality
npm run verify:ui-asset-contract
npm run verify:asset-generation-batch
```

`verify:runtime-assets` fails when a runtime entry points at reference, temp, screenshot, or test-looking files. `audit:runtime-asset-quality` reports how many runtime PNGs are still placeholders or aliases, so AssetAgent can replace the most expensive UI art first.
`verify:ui-asset-contract` ensures every product-level UI key has a runtime mapping or a planned replacement. `verify:asset-generation-batch` ensures the P0 AssetAgent task batch has safe paths, dimensions, alpha/nine-slice flags, prompts, and acceptance checks.
