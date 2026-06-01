# Prefab List

UIUXAgent planning file for Cocos Creator 3.8. All coordinates are based on `750 x 1334`.

## 1. Folder Plan

```text
CatBackpackNight/assets/
├─ prefabs/
│  ├─ common/
│  ├─ cards/
│  ├─ panels/
│  ├─ modals/
│  ├─ battle/
│  └─ screens/
└─ scripts/
   └─ ui/
```

Prefab naming:

- Common: `P_<ComponentName>`
- Cards: `C_<CardName>`
- Panels: `Panel_<FeatureName>`
- Modals: `Modal_<FeatureName>`
- Screens: `Screen_<RouteName>`
- Battle HUD: `HUD_<FeatureName>`

Node naming:

- `Root`
- `Bg`
- `SafeTop`
- `Content`
- `SafeBottom`
- `Label_Title`
- `Icon_*`
- `Button_*`
- `Node_*`
- `List_Content`

## 2. Common Prefabs

| Prefab | Script | Size | Priority | Notes |
| --- | --- | ---: | --- | --- |
| `common/P_WoodHeader` | `WoodHeader.ts` | `690 x 106` | P0 | Page title, back/help/close/settings buttons. |
| `common/P_ResourceBar` | `ResourceBar.ts` | dynamic | P0 | Currency pills for home/shop. |
| `common/P_PrimaryButton` | `UIButton.ts` | `420 x 112` | P0 | Yellow action button. |
| `common/P_GreenButton` | `UIButton.ts` | `260 x 86` | P0 | Claim/free/confirm. |
| `common/P_BlueButton` | `UIButton.ts` | `260 x 86` | P0 | Go/refresh/secondary. |
| `common/P_BrownButton` | `UIButton.ts` | `220 x 76` | P1 | Secondary tab/action. |
| `common/P_DangerButton` | `UIButton.ts` | `260 x 86` | P1 | Delete/destructive confirm. |
| `common/P_TabBar` | `TabBar.ts` | `690 x 80` | P0 | Category tabs with badges. |
| `common/P_BottomNav` | `BottomNav.ts` | `720 x 142` | P0 | Persistent hub nav. |
| `common/P_RedDot` | `RedDot.ts` | `34 x 34` | P0 | Dot/count/exclamation. |
| `common/P_ProgressBar` | `ProgressBarView.ts` | dynamic | P0 | EXP, HP, task progress. |
| `common/P_ToggleRow` | `ToggleRow.ts` | `610 x 96` | P1 | Settings switch row. |
| `common/P_Toast` | `Toast.ts` | `560 x 76` | P0 | Top/middle toast. |

### `P_WoodHeader` Node Tree

```text
P_WoodHeader
├─ Bg_Wood
├─ Decor_LeftPaw
├─ Decor_RightPaw
├─ Button_Left
│  └─ Icon_Left
├─ Label_Title
└─ Button_Right
   └─ Icon_Right
```

### `P_BottomNav` Node Tree

```text
P_BottomNav
├─ Bg_DarkWood
└─ List_Items
   ├─ Item_Shop
   │  ├─ Bg_Selected
   │  ├─ Icon
   │  ├─ Label
   │  └─ P_RedDot
   └─ ...
```

## 3. Card Prefabs

| Prefab | Script | Size | Priority | Usage |
| --- | --- | ---: | --- | --- |
| `cards/C_ItemCard` | `ItemCard.ts` | `112 x 112` | P0 | Backpack and battle prep item grid. |
| `cards/C_ShopItemCard` | `ShopItemCard.ts` | `206 x 318` | P0 | Shop 3-column goods. |
| `cards/C_PetCard` | `PetCard.ts` | `118 x 176` | P0 | Pet list and locked slots. |
| `cards/C_TaskCard` | `TaskCard.ts` | `650 x 142` | P0 | Daily task and achievements. |
| `cards/C_AchievementCard` | `TaskCard.ts` | `650 x 164` | P1 | TaskCard variant with medal icon. |
| `cards/C_RewardCard` | `RewardCard.ts` | `132 x 150` | P0 | Reward list, mail attachment, victory. |
| `cards/C_SkillCard` | `SkillCard.ts` | `218 x 530` | P1 | Battle skill selection. |
| `cards/C_TalentNode` | `TalentNode.ts` | `112 x 112` | P1 | Talent tree node. |
| `cards/C_MailListItem` | `MailListItem.ts` | `320 x 118` | P1 | Mail list row. |

### `C_ItemCard` Node Tree

```text
C_ItemCard
├─ Bg_Cell
├─ Bg_SelectedGlow
├─ Icon_Item
├─ Badge_Count
│  └─ Label_Count
├─ Icon_Lock
└─ P_RedDot
```

### `C_TaskCard` Node Tree

```text
C_TaskCard
├─ Bg_Parchment
├─ Label_Title
├─ P_ProgressBar
├─ RewardGroup
│  └─ C_RewardCard
└─ Button_Action
```

## 4. Panel Prefabs

| Prefab | Script | Size | Priority | Contents |
| --- | --- | ---: | --- | --- |
| `panels/Panel_PlayerPlate` | `PlayerPlate.ts` | `320 x 108` | P1 | Avatar, name, level, EXP. |
| `panels/Panel_StageCard` | `StageCard.ts` | `430 x 160` | P0 | Chapter and highest wave. |
| `panels/Panel_ItemGrid` | `ItemGrid.ts` | dynamic | P0 | Grid generator for item slots. |
| `panels/Panel_ItemDetail` | `ItemDetailPanel.ts` | `650 x 224` | P0 | Selected weapon/item detail. |
| `panels/Panel_PetDetail` | `PetDetailPanel.ts` | `690 x 436` | P0 | Large pet art, stats, upgrade. |
| `panels/Panel_ActivityChestBar` | `ActivityChestBar.ts` | `690 x 224` | P1 | Daily activity progress and chests. |
| `panels/Panel_TalentFooter` | `TalentFooter.ts` | `540 x 98` | P1 | Remaining points and reset. |
| `panels/Panel_MailDetailDrawer` | `MailDetailDrawer.ts` | `650 x 820` | P1 | Mobile-safe mail detail. |
| `panels/Panel_SettingsBody` | `SettingsPanel.ts` | `650 x 840` | P1 | Toggles and policy buttons. |

## 5. Modal Prefabs

| Prefab | Script | Size | Priority | Notes |
| --- | --- | ---: | --- | --- |
| `modals/Modal_Base` | `ModalView.ts` | `650 x auto` | P0 | Mask, title, content slot, button row. |
| `modals/Modal_Reward` | `RewardModal.ts` | `690 x 560` | P0 | Rewards, claim/double claim. |
| `modals/Modal_MergeGuide` | `MergeGuideModal.ts` | full | P1 | Tutorial overlay and merge success. |
| `modals/Modal_SkillChoice` | `SkillChoiceModal.ts` | full | P1 | Three skill cards over dim battle background. |
| `modals/Modal_Pause` | `PauseModal.ts` | `560 x 470` | P0 | Continue, settings, exit. |
| `modals/Modal_Confirm` | `ModalView.ts` | `560 x 360` | P0 | Generic confirm/cancel. |

### `Modal_Reward` Node Tree

```text
Modal_Reward
├─ Mask
├─ Panel_Dark
│  ├─ Banner_Title
│  ├─ Node_Glow
│  ├─ List_Rewards
│  │  └─ C_RewardCard
│  ├─ Button_DoubleClaim
│  └─ Button_Confirm
└─ P_Toast
```

## 6. Battle Prefabs

| Prefab | Script | Size | Priority | Notes |
| --- | --- | ---: | --- | --- |
| `battle/HUD_BattleTop` | `BattleTopHUD.ts` | `690 x 170` | P0 | Wave, timer, pause, HP/progress. |
| `battle/HUD_WeaponSlotBar` | `WeaponSlotBar.ts` | `720 x 164` | P0 | Five weapon slots and auto merge. |
| `battle/C_WeaponSlot` | `WeaponSlot.ts` | `112 x 132` | P0 | Icon and cooldown bar. |
| `battle/FX_DamageNumber` | `DamageNumber.ts` | dynamic | P1 | Floating orange damage. |
| `battle/FX_MergeBurst` | `MergeBurst.ts` | dynamic | P1 | Gold burst, sparkles. |

## 7. Screen Prefabs

| Route | Prefab | Script | Bottom Nav | Priority |
| --- | --- | --- | --- | --- |
| `login` | `screens/Screen_Login` | `LoginScreen.ts` | hidden | P0 |
| `home` | `screens/Screen_Home` | `HomeScreen.ts` | visible, `battle` active | P0 |
| `battlePrepare` | `screens/Screen_BattlePrepare` | `BattlePrepareScreen.ts` | hidden | P0 |
| `battle` | `screens/Screen_Battle` | `BattleScreen.ts` | hidden | P0 |
| `backpack` | `screens/Screen_Backpack` | `BackpackScreen.ts` | visible, `bag` active | P0 |
| `shop` | `screens/Screen_Shop` | `ShopScreen.ts` | visible, `shop` active | P0 |
| `pet` | `screens/Screen_Pet` | `PetScreen.ts` | visible, `pet` active | P0 |
| `talent` | `screens/Screen_Talent` | `TalentScreen.ts` | visible, `talent` active | P1 |
| `dailyTask` | `screens/Screen_DailyTask` | `DailyTaskScreen.ts` | hidden/back | P1 |
| `achievement` | `screens/Screen_Achievement` | `AchievementScreen.ts` | hidden/back | P1 |
| `mail` | `screens/Screen_Mail` | `MailScreen.ts` | hidden/back | P1 |
| `settings` | `screens/Screen_Settings` | `SettingsScreen.ts` | hidden/back | P1 |

### `Screen_Login`

```text
Screen_Login
├─ Bg_LoginNight
├─ Logo_Game
├─ Art_CatAndCamp
├─ Button_Start
├─ Node_Agreement
│  ├─ Toggle_Check
│  ├─ Link_UserAgreement
│  └─ Link_Privacy
├─ Badge_Age16
└─ Label_HealthTip
```

### `Screen_Home`

```text
Screen_Home
├─ Bg_HomeCamp
├─ Panel_PlayerPlate
├─ P_ResourceBar
├─ Button_Settings
├─ Panel_StageCard
├─ Node_SideEntries
│  ├─ Button_SignIn
│  ├─ Button_DailyTask
│  ├─ Button_Mail
│  └─ Button_Rank
├─ Art_Cat
├─ Art_Campfire
├─ Button_StartBattle
└─ P_BottomNav
```

### `Screen_BattlePrepare`

```text
Screen_BattlePrepare
├─ Bg_DarkPanel
├─ P_WoodHeader
├─ Label_RecommendPower
├─ Panel_BattlePreview
├─ Label_MyPower
├─ Panel_ItemGrid
├─ Node_EnergyCostHint
└─ Button_StartBattle
```

The reference image includes compliance UI near the bottom, but MVP follows ProductAgent output: agreement/CADPA remains on login and settings only. This screen uses energy cost, power warning, and return/close behavior instead.

### `Screen_Backpack`

```text
Screen_Backpack
├─ Bg_ParchmentFull
├─ P_WoodHeader
├─ P_TabBar
├─ Panel_ItemGrid
├─ Panel_ItemDetail
├─ Button_Merge
└─ Button_OpenChest
```

### `Screen_Mail`

Mobile-safe implementation:

```text
Screen_Mail
├─ Bg_NightForest
├─ P_WoodHeader
├─ Panel_MailList
│  └─ ScrollView_Mail
├─ Button_ClaimAll
├─ Button_DeleteAll
└─ Panel_MailDetailDrawer
```

`Panel_MailDetailDrawer` is hidden until a mail row is tapped. On tablets it can pin right, but phone default is drawer/modal.

### `Screen_Talent`

```text
Screen_Talent
├─ Bg_NightForest
├─ P_WoodHeader
├─ P_TabBar
├─ ScrollView_TalentTree
│  └─ Content_TalentNodes
│     ├─ Node_Lines
│     └─ C_TalentNode
└─ Panel_TalentFooter
```

The tree content height is data-driven. Never compress all nodes to a fixed one-screen height.

## 8. Prefab Build Automation

To reduce manual node dragging:

1. ClientArchAgent should create a Cocos editor utility or runtime dev-only builder that reads a small layout config and instantiates the prefabs above.
2. UIUXAgent provides `UISkeletonBuilder.ts` as a placeholder generator for initial scene hierarchy.
3. All final prefabs must still expose top-level component scripts and stable child node names.

Suggested config path for later:

```text
assets/configs/ui_prefab_layouts.json
```

Suggested minimal layout schema:

```json
{
  "prefab": "Screen_Home",
  "size": [750, 1334],
  "children": [
    { "name": "P_ResourceBar", "prefab": "common/P_ResourceBar", "position": [440, 612] }
  ]
}
```

## 9. Handoff To AssetAgent

AssetAgent should prioritize slices in this order:

1. `btn_yellow`, `btn_green`, `btn_blue`, `btn_brown`, `panel_wood_header`, `panel_parchment`, `panel_dark`.
2. Currency icons and bottom nav icons.
3. Item/weapon icons for backpack, shop, battle bar.
4. Pet portraits and locked silhouettes.
5. Reward glow, merge burst, star, damage number effects.
6. Scene backgrounds and character art optimized into atlases/bundles.

## 10. Handoff To ClientArchAgent

ClientArchAgent should:

- Create actual Cocos prefab files using this list.
- Attach scripts from `assets/scripts/ui`.
- Wire route IDs from `SCREEN_FLOW.md`.
- Keep data binding one-way: game/data state -> view data -> UI component `apply`.
- Use `assets/resources` or bundles for placeholder replacement keys until AssetAgent outputs atlases.
