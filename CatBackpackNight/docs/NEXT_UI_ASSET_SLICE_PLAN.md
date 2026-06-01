# Next UI Asset Slice Plan

Scope: login, home, shop, backpack.

Rule: do not use full-page design images as runtime backgrounds. The design images are references only. Runtime UI must be built from component-level assets, Cocos nodes, and replaceable resource keys.

## Priority Slices

### P0 Common

- `panel_wood_header`: top wooden title board, nine-slice.
- `panel_parchment`: large parchment surface, nine-slice.
- `panel_parchment_card`: shop/item card, nine-slice.
- `panel_dark`: battle/dark content panel, nine-slice.
- `panel_dark_glass`: translucent dark home info plate.
- `panel_bottom_nav`: bottom navigation background.
- `btn_yellow`: main action button, nine-slice.
- `btn_green`: claim/free/confirm button.
- `btn_blue`: go/refresh button.
- `btn_brown`: tab/secondary button.
- `btn_icon_round`: round icon button.

### P0 Icons

- `icon_gold`
- `icon_purple_gem`
- `icon_blue_gem`
- `icon_energy`
- `icon_paw`
- `icon_back`
- `icon_close`
- `icon_settings`
- `icon_red_dot`
- `icon_nav_shop`
- `icon_nav_backpack`
- `icon_nav_battle`
- `icon_nav_talent`
- `icon_nav_pet`

### P0 Items

- `weapon_sword_01`
- `weapon_bow_01`
- `weapon_staff_01`
- `weapon_spear_01`
- `weapon_fishbone_bow`
- `item_weapon_chest`
- `item_pet_egg`
- `item_energy_potion`
- `item_enhance_stone`

### P1 Character/Background Art

- `bg_login_night`
- `bg_home_camp`
- `bg_shop_village`
- `bg_inventory_parchment`
- `cat_hero_idle`
- `cat_hero_battle`
- `cat_shop_hood`

## Implementation Guidance

Until final slices exist, UIImplementationAgent should build real Cocos UI using colored component-level placeholders. Those placeholders must be named with the final resource keys and should be replaced later by SpriteFrames or nine-slice SpriteFrames.

No runtime code may load `assets/textures/references/ref_*.png`.

## Handoff

Use `assets/scripts/ui/UIAssetKeys.ts` as the canonical key list and `assets/configs/ui_runtime_assets.json` as the per-screen runtime asset declaration.

## Asset Identity Gate

The project now separates image files into three identities:

- `productionCandidate`: a runtime PNG that can stay in the game while it is reviewed for final visual quality.
- `runtimePlaceholder`: a runtime PNG that keeps preview playable, but must not be treated as final commercial art.
- `temporaryAlias`: a valid runtime PNG that is currently standing in for a different product-level key.

The canonical status file is:

```text
assets/configs/runtime_asset_quality.json
```

Development-only and QA-only images must never be used as runtime art:

- `assets/textures/references/ref_*.png`
- `tmp/qa_*.png`
- `tmp/cocos_*.png`
- `tmp/*round*.png`
- `tmp/*contact*.png`
- screenshots and intermediate crop files

Run this before accepting an asset batch:

```powershell
npm run generate:runtime-assets
npm run verify:runtime-assets
npm run audit:runtime-asset-quality
npm run verify:ui-asset-contract
npm run verify:asset-generation-batch
```

## Multi-Agent Asset Handoff

Use these files as the shared contract between agents:

- Automated loop guide: `docs/AUTOMATED_MULTI_AGENT_LOOP.md`
- Product/UI contract: `assets/configs/ui_asset_contract.json`
- Asset quality status: `assets/configs/runtime_asset_quality.json`
- P0 generation batch: `assets/configs/asset_generation_batch_p0.json`
- Loop state: `assets/configs/asset_pipeline_state.json`

Agent responsibilities:

- `UIUXAgent`: owns product-level keys and screen usage in `UIAssetKeys.ts` and `ui_runtime_assets.json`.
- `AssetAgent`: owns `asset_generation_batch_p0.json`, generated candidate art, and final replacement under `assets/textures/runtime`.
- `ClientArchAgent`: owns runtime loading and any `rt_*` mapping changes after final assets land.
- `QAReleaseAgent`: owns the verification commands and preview screenshots after each asset batch.

Candidate images should be staged under `tmp/asset_candidates/...` for review. Only accepted final PNGs move into `assets/textures/runtime`.
