# UI Component Spec

UIUXAgent output for `猫猫背包守夜`. Source of truth:

- `C:/Users/User/Desktop/XMBB/docs/UI_DESIGN_TEMPLATE.md`
- `C:/Users/User/Desktop/XMBB/docs/ARCHITECTURE_PLAN.md`
- `C:/Users/User/Desktop/XMBB/agent_outputs/UIUXAgent.prompt.md`
- Reference images in `C:/Users/User/Desktop/ima`

## 1. Design System Baseline

### 1.1 Coordinate And Adaptation

- Logical design size: `750 x 1334`.
- Original art size: `1080 x 1920`, scaled into logical coordinates by `0.6944`.
- Canvas policy: portrait only, content centered, safe-area aware.
- Primary layout root:
  - `SafeTop`: `y = 667`, height `safeTop + 96`.
  - `Content`: centered, width `690`, vertical range between top header and bottom nav/action bar.
  - `SafeBottom`: bottom action/nav zone, height `150 + safeBottom`.
- Minimum touch target: `72 x 72`.
- Scrollable content must use masks for long lists: tasks, achievements, mail, talent tree, pet grid, shop pages.
- Long Chinese strings use max width plus auto shrink to `80%` of default font size before wrapping to two lines.

### 1.2 Visual Tokens

| Token | Value | Usage |
| --- | --- | --- |
| `color.buttonGold` | `#F6B332` | Primary buttons, selected tabs, reward highlights |
| `color.highlightGold` | `#FFE28A` | Glow, item selected border, stars |
| `color.wood` | `#5A331F` | Wood headers, brown buttons |
| `color.woodStroke` | `#2A160D` | Panel and button outline |
| `color.parchment` | `#F1D3A2` | Cards, inventory panels, modal body |
| `color.darkPanel` | `#171A18` | Battle, pet, settings dark panels |
| `color.nightBlue` | `#071A2C` | Scene backgrounds and overlays |
| `color.successGreen` | `#67A936` | Claim, free, confirm success |
| `color.actionBlue` | `#3186B8` | Go, refresh, secondary actions |
| `color.warningRed` | `#E33F2F` | Close, delete, red dots |
| `color.purpleGem` | `#A752FF` | Purple diamond currency |
| `color.blueGem` | `#31A8FF` | Blue diamond currency |

### 1.3 Type Scale

| Role | Size | Style |
| --- | ---: | --- |
| Logo / victory banner | `72-96` | Heavy rounded, white/yellow fill, dark brown stroke |
| Page title | `48-60` | White, heavy, wood-stroke shadow |
| Section title | `36-44` | White or deep brown, heavy |
| Button label | `34-46` | White, dark brown stroke |
| Card title | `28-34` | Deep brown or white |
| Body | `24-30` | Deep brown on parchment, warm white on dark |
| Reward number | `34-48` | White/yellow, high contrast stroke |

System font fallback is `sans-serif`. AssetAgent can later replace with a rounded Chinese bitmap font.

### 1.4 Layer Order

| Layer | Z | Contents |
| --- | ---: | --- |
| `BackgroundLayer` | `0` | Full-screen night forest, room, battle background |
| `SceneArtLayer` | `10` | Cats, houses, campfire, monsters, treasure |
| `PanelLayer` | `20` | Main panels, lists, cards, tab bars |
| `HUDLayer` | `30` | Header, resources, bottom nav, battle HUD |
| `EffectLayer` | `40` | Damage numbers, glow, stars, merge burst |
| `ModalMaskLayer` | `50` | Dim overlay |
| `ModalLayer` | `60` | Dialogs, reward modal, skill choice |
| `ToastLayer` | `70` | Toasts and temporary tips |

## 2. Shared Component States

| State | Visual | Interaction |
| --- | --- | --- |
| `normal` | Full color, standard shadow | Clickable |
| `pressed` | Scale `0.96`, shadow reduced, y `-3` | Trigger on touch down |
| `disabled` | Saturation/opacity `55%`, no glow | Not clickable |
| `selected` | Gold border glow, slight scale `1.04` | Active item/tab/nav |
| `locked` | Dark overlay, lock icon, condition text | Opens unlock condition toast/detail |
| `claimable` | Green button, red dot or pulse | Claim reward |
| `claimed` | Green/gray button, text `已领取` | Not claimable |
| `loading` | Spinner or dim button, text `处理中` | Prevent repeated click |
| `adReady` | Video icon shown, normal button | Calls ad service |
| `adUnavailable` | Disabled blue/green button, helper text | Toast: `暂无可观看广告` |
| `insufficient` | Cost text red, button disabled | Opens shop/earn route |

Animation defaults:

- Button press: `0.06s` down, `0.08s` up.
- Red dot pulse: scale `1 -> 1.12 -> 1`, `1.2s` loop.
- Reward glow: alpha `0.35 -> 0.85 -> 0.35`, `1.5s` loop.
- Merge success: selected grid cells glow, result card scales `0.85 -> 1.08 -> 1`.
- Screen transition: modal fade `0.16s`, panel slide `0.22s`.

## 3. Core Prefab Components

### 3.1 `WoodHeader`

Purpose: Unified page title and back/help/close actions.

Required properties:

- `title: string`
- `leftButton: "none" | "back" | "close"`
- `rightButton: "none" | "help" | "close" | "settings"`
- `showPawDecor: boolean`

Layout:

- Size: `690 x 106` for normal pages, `720 x 116` for full-screen panels.
- Anchor: top center.
- Back/help buttons: `82 x 82`, aligned `32` from panel edge.
- Title max width: `430`.

States:

- `normal`: wood texture, white title.
- `compact`: used in nested modal title, height `74`.
- `floating`: used over scene backgrounds, no parchment body attached.

### 3.2 `ResourceBar`

Purpose: Shared currency HUD for home, shop, backpack, pet, battle prep.

Required properties:

- `gold: number`
- `purpleGem: number`
- `blueGem: number`
- `energy: number`
- `visibleKeys: ResourceKey[]`
- `plusEnabled: boolean`

Layout:

- Single resource pill: `168 x 54`, icon `48`.
- Home top row uses `gold + purpleGem`; shop uses `gold + purpleGem + blueGem`.
- Energy appears on start-battle buttons and optional header compact slot.

Interactions:

- Tap plus opens `ShopPanel` with matching tab or `EnergyBuyModal`.
- Values animate with count-up when changed by reward/consume.

### 3.3 Buttons

Shared script: `UIButton`.

| Prefab | Variant | Primary Usage |
| --- | --- | --- |
| `P_PrimaryButton` | gold | Start battle, confirm, upgrade, choose |
| `P_GreenButton` | green | Claim, free, accepted, success |
| `P_BlueButton` | blue | Go, refresh, secondary navigation |
| `P_BrownButton` | brown | Tab secondary, back-like action |
| `P_DangerButton` | red | Delete, destructive confirm |

Required properties:

- `text: string`
- `icon: SpriteFrame | null`
- `cost: { iconKey: string; amount: number } | null`
- `disabled: boolean`
- `state: ButtonState`
- `onClick: () => void`

Rules:

- Never use yellow for destructive or refresh actions.
- Cost appears below or inline depending on button height.
- `disabled` keeps label readable; do not drop below `55%` opacity.
- Repeated taps are debounced for `350ms`.

### 3.4 `TabBar`

Purpose: Top category tabs such as shop, inventory pages, talent categories.

Required properties:

- `tabs: UITabData[]`
- `activeKey: string`
- `badges: Record<string, number | boolean>`

Layout:

- 3 tabs: each `206 x 76`.
- Inventory page tabs: `120 x 76`, 4 entries with lock state.
- Active tab: gold fill, inactive tab: dark wood.

### 3.5 `BottomNav`

Purpose: Persistent main navigation.

Required properties:

- `items: BottomNavItem[]`
- `activeKey: "shop" | "bag" | "battle" | "talent" | "pet" | "settings"`
- `badges: Record<string, number | boolean>`

Design decision:

- Main hub screens use the same bottom nav order: `shop`, `bag`, `battle`, `talent`, `pet`.
- Settings is opened from the home top-right entry and does not occupy the MVP bottom nav, even if some reference art shows a sixth settings slot.
- Battle runtime and login hide bottom nav.

Layout:

- Default 5 tabs: full width `720`, item width `144`, height `142`.
- Selected item: gold outline, icon scale `1.08`, label yellow.
- Red dot sits at top-right of icon area.

### 3.6 `RedDot`

Required properties:

- `type: "dot" | "number" | "exclamation"`
- `count: number`
- `visible: boolean`

Rules:

- `count > 99` displays `99+`.
- Use `!` for urgent claimable tasks or mailbox.
- Do not stack multiple red dots on a parent and child at once; parent summarizes child state.

### 3.7 `ProgressBar`

Required properties:

- `value: number`
- `max: number`
- `color: "gold" | "green" | "red" | "blue"`
- `label: string`

Usage:

- Player EXP: compact gold bar.
- Battle HP: long green bar with heart icon.
- Task/achievement progress: gold bar on parchment card.
- Pet material progress: gold icon label plus thin green/gold bar.

### 3.8 `ItemCard`

Required properties:

- `icon: string`
- `name: string`
- `level: number`
- `count: number`
- `rarity: "common" | "rare" | "epic" | "legendary"`
- `selected: boolean`
- `locked: boolean`

Layout:

- Inventory grid: `112 x 112`, icon max `82 x 82`, count badge `32`.
- Shop card: uses `ShopItemCard`, not inventory `ItemCard`.

States:

- `selected`: gold glow border and subtle sparkles.
- `empty`: faint paw print background.
- `mergeCandidate`: animated gold outline.
- `new`: red dot or `新` corner badge.

### 3.9 `ItemGrid`

Required properties:

- `columns: number`
- `items: ItemCardData[]`
- `selectedId: string`
- `pageIndex: number`
- `lockedPages: number[]`

Rules:

- Backpack uses 5 columns, 5 rows visible in first phase.
- Battle prep weapon grid uses 5 columns x 2 rows.
- Drag merge is optional for MVP; tap-select + `合成` button is mandatory.
- If drag merge is enabled later, valid targets glow before drop.

### 3.10 `PetCard`

Required properties:

- `portrait: string`
- `name: string`
- `level: number`
- `stars: number`
- `rarity: Rarity`
- `locked: boolean`
- `condition: string`
- `deployed: boolean`
- `selected: boolean`

Layout:

- Main pet grid: 5 columns, card `118 x 176`.
- Locked cards show silhouette, lock icon, 2-line condition.

Design decision:

- `宠物.png` and `宠物详情.png` are merged into one `PetPanel` for MVP.
- Large pet detail lives above the list on tall screens.
- On short screens, list scrolls while the detail panel remains pinned.

### 3.11 `TaskCard`

Required properties:

- `title: string`
- `progress: { value: number; max: number }`
- `reward: RewardData[]`
- `buttonState: "go" | "claim" | "claimed" | "locked"`

Usage:

- Daily task and achievement cards share the same base layout.
- Achievement variant adds medal icon and condition subtitle.

### 3.12 `RewardCard`

Required properties:

- `icon: string`
- `amount: number`
- `locked: boolean`
- `rarity?: Rarity`

Usage:

- Victory rewards, mail attachments, activity chests, merge result add-ons.
- Locked reward uses dark overlay plus lock icon, never hidden entirely.

### 3.13 `Modal`

Required properties:

- `title: string`
- `contentNode: Node`
- `buttons: ModalButtonData[]`
- `closeOnMask: boolean`

Modal policy:

- `RewardModal`: high-emotion full-screen or large modal with glow.
- `ConfirmModal`: two buttons, destructive action on right only when red.
- `MailDetailDrawer`: mobile-safe detail drawer replacing cramped two-column layout.
- `SkillChoiceModal`: non-dismissible until a skill is selected unless battle is paused.

### 3.14 `Toast`

Required properties:

- `message: string`
- `kind: "info" | "success" | "warning" | "error"`
- `duration: number`

Rules:

- Max one blocking toast row at a time.
- Used for agreement not checked, insufficient currency, locked feature, no ad.

### 3.15 `ToggleRow`

Required properties:

- `icon: string`
- `label: string`
- `enabled: boolean`
- `storageKey: string`

Rules:

- Switch visual uses green `ON` and brown/gray `OFF`.
- Saves immediately through `SaveManager` later; script placeholder emits a value now.

## 4. Screen-Specific Components

| Screen | Required Components | Notes |
| --- | --- | --- |
| Login | `AgreementCheck`, `AgeBadge`, `PrimaryButton`, `Toast` | Keep agreement, privacy, CADPA, health text visible. |
| Home | `PlayerPlate`, `ResourceBar`, `StageCard`, `SideEntryButton`, `BottomNav` | Scene art is first-viewport focus. |
| BattlePrepare | `WoodHeader`, `PowerComparePanel`, `ItemGrid`, `EnergyCostHint`, `PrimaryButton` | Agreement is not repeated here; compliance stays on login/settings. |
| Battle | `BattleTopHUD`, `ProgressBar`, `WeaponSlotBar`, `AutoMergeButton`, `PauseModal` | Bottom weapon bar must not cover combat center. |
| Backpack | `WoodHeader`, `TabBar`, `ItemGrid`, `ItemDetailPanel`, `PrimaryButton` | Tap select + button merge is MVP path. |
| MergeGuide | `Modal`, `ItemGridGhost`, `MergeArrow`, `RewardCard`, `PrimaryButton` | Blocks input under tutorial overlay. |
| Shop | `ResourceBar`, `WoodHeader`, `TabBar`, `ShopItemCard`, `BottomNav` | Three columns, ad refresh states required. |
| Pet | `WoodHeader`, `PetDetailPanel`, `PetCard`, `BottomNav` | Merged pet/detail UX. |
| SkillChoice | `SkillCard`, `BlueButton` | Battle background dim remains visible. |
| Talent | `WoodHeader`, `TabBar`, `TalentTreeScroll`, `TalentNode`, `TalentFooter` | Scrollable/zoomable tree. |
| DailyTask | `WoodHeader`, `ActivityChestBar`, `TaskCard` | Shows daily refresh time. |
| Achievement | `WoodHeader`, `AchievementCard`, `OneTapClaimFooter` | List scrolls; footer pinned. |
| Mail | `WoodHeader`, `MailList`, `MailDetailDrawer`, `RewardCard` | Narrow screens use drawer/detail modal. |
| Settings | `WoodHeader`, `ToggleRow`, `BlueButton`, `VersionPlate` | Version pinned bottom. |
| Victory | `RewardModal`, `RewardCard`, `PrimaryButton` | Double claim handles ad unavailable/cancel/fail. |

## 5. Professional Adjustments From Reference

1. Bottom navigation is unified on hub screens. Runtime battle, login, and blocking modals hide it.
2. Mail no longer uses permanent left/right columns on narrow screens. The list is primary; details open in a drawer or modal.
3. Talent tree is a scroll view with optional pinch/zoom later. Nodes are not compressed to fit every phone height.
4. Pet and pet-detail references become one page with a pinned detail region and scrollable card list.
5. Battle prepare removes the repeated agreement checkbox from the reference and uses energy cost plus power warning instead.
6. Battle bottom weapon bar uses a fixed max height of `164`; low-height phones reduce card padding before reducing combat area.
7. Ad actions include `ready`, `loading`, `cancelled`, `failed`, `unavailable`, and fallback messaging.
8. All reward/claim actions are idempotent in UI state: once tapped, button enters `loading` until data confirms.
9. First phase supports full UI with placeholder textures; all asset keys are documented for AssetAgent replacement.

## 6. Script Binding Policy

- Every reusable prefab has one top-level component script in `assets/scripts/ui`.
- Scripts expose `apply(data)` methods so ClientArchAgent/GameLogicAgent can bind without manual node edits.
- Prefabs should name nodes consistently:
  - `Label_Title`
  - `Label_Count`
  - `Icon_Main`
  - `Node_RedDot`
  - `Bar_Fill`
  - `Button_Action`
- Missing child references must fail softly and log warnings only in development.
- Game state does not live in UI components; UI only receives view data and emits semantic events.

## 7. Asset Replacement Keys

Until AssetAgent slices final art, UI scripts and prefabs should reference these keys:

- Panels: `panel_wood_header`, `panel_parchment`, `panel_dark`, `panel_modal_mask`
- Buttons: `btn_yellow`, `btn_green`, `btn_blue`, `btn_brown`, `btn_red`
- Icons: `icon_back`, `icon_close`, `icon_help`, `icon_settings`, `icon_lock`, `icon_reddot`, `icon_video`
- Currency: `icon_gold`, `icon_purple_gem`, `icon_blue_gem`, `icon_energy`, `icon_paw_coin`
- Effects: `fx_gold_glow`, `fx_merge_burst`, `fx_reward_star`, `fx_damage_number`
- Backgrounds: `bg_login_night`, `bg_home_camp`, `bg_battle_forest`, `bg_panel_parchment`, `bg_panel_dark`
