# Release Checklist

This checklist is written for a low-manual-operation workflow. The user should only perform tool-opening and final confirmation steps; Codex should handle file changes and bug fixes.

## 1. Local Project Gate

- [x] Project directory exists: `D:/工作/XMBB/CatBackpackNight`
- [x] TypeScript static check passes.
- [x] Cocos architecture files exist.
- [x] Gameplay MVP systems exist.
- [x] WeChat platform service mocks exist.
- [x] Product, UI, asset, platform, and acceptance documents exist.

## 2. Cocos Creator Gate

Open with Cocos Creator 3.8.x:

`D:/工作/XMBB/CatBackpackNight`

Check:

- [ ] Project opens without import errors.
- [ ] Scripts compile in Cocos Console.
- [x] `Login.scene` browser preview renders.
- [x] `Home.scene` browser preview renders.
- [x] `BattlePrepare.scene` browser preview renders.
- [x] `Battle.scene` browser preview renders.
- [x] UI skeleton builder can create placeholder UI nodes in browser preview.
- [x] Browser Preview route screenshots render for login, home, battle prepare, battle, backpack, shop, pet, talent, daily task, mail, settings, merge, explore, guild, achievement, victory, and skill choice.
- [ ] Game preview can enter from login to home through real button callbacks.

Preview screenshots:

- `tmp/qa_cocos_preview_login.png`
- `tmp/qa_cocos_preview_home.png`
- `tmp/qa_cocos_preview_battle_prepare.png`
- `tmp/qa_cocos_preview_battle.png`
- `tmp/qa_route_pet_portrait_avatar_20260530.png`
- `tmp/qa_route_explore_dark_text_20260530.png`
- `tmp/qa_route_guild_mascot_20260530.png`
- `tmp/qa_route_victory_panels_20260530.png`
- `tmp/qa_route_skillChoice_panels_20260530.png`
- `tmp/ui_final_route_contact_sheet_20260530.png`

If any Cocos error appears, copy the error text back to Codex and ask it to repair the project automatically.

## 3. WeChat Mini Game Gate

Build from Cocos Creator to WeChat Mini Game:

- [ ] WeChat Mini Game platform selected.
- [ ] Development AppID or test AppID configured.
- [ ] Build succeeds.
- [ ] WeChat DevTools imports the build output.
- [ ] WeChat DevTools preview runs.
- [ ] Mock platform layer works when real services are unavailable.

## 4. Gameplay Gate

Verify:

- [ ] Login can enter home.
- [ ] Home can enter battle prepare.
- [ ] Battle prepare can start battle and spend energy.
- [ ] Battle runs automatically.
- [ ] Victory settlement grants rewards once.
- [ ] Inventory merge increases weapon level.
- [ ] Shop purchase deducts currency and grants items.
- [ ] Pet upgrade spends material and updates stats.
- [ ] Talent upgrade spends points and updates power.
- [ ] Daily task claim cannot be repeated.
- [ ] Achievement claim cannot be repeated.
- [ ] Mail attachment claim cannot be repeated.

## 5. Compliance Gate

- [ ] User agreement entry exists.
- [ ] Privacy policy entry exists.
- [ ] 16+ CADPA/age prompt is visible where required.
- [ ] Health game notice exists.
- [ ] Real privacy URL and agreement URL are configured before release.
- [ ] No misleading rewarded ad text.

## 6. Asset/Package Gate

- [ ] `npm run generate:runtime-assets` has been run after any runtime PNG changes.
- [ ] `npm run verify:runtime-assets` passes.
- [ ] `npm run audit:runtime-asset-quality` passes and its placeholder/alias counts are reviewed.
- [ ] `npm run verify:ui-asset-contract` passes.
- [ ] UI contract temporary mappings are reviewed before any visual slice is marked accepted.
- [ ] `npm run verify:asset-generation-batch` passes before AssetAgent starts or accepts the active batch.
- [ ] Active asset generation batch matches the pipeline state batch id and staging/runtime roots.
- [ ] `npm run verify:asset-pipeline-state` passes before each automation cycle is considered resumable.
- [ ] `assets/configs/asset_pipeline_state.json` phase/status values reflect the actual automated loop progress.
- [ ] Production build does not load or package `assets/textures/references`.
- [ ] Reference images are not included in runtime bundles.
- [ ] QA screenshots, contact sheets, and crop experiments under `tmp/` are not referenced by runtime code or configs.
- [ ] `tmp/reference` and `tmp/asset_candidates` are never used as runtime asset sources.
- [ ] Sliced UI art replaces placeholder panels/buttons.
- [ ] Common UI is packed into atlas.
- [ ] Battle characters/effects are packed separately.
- [ ] Main package size is checked in WeChat DevTools.

## 7. Automated Loop QA Gate

For each automation cycle:

- [ ] Asset pipeline state gate is recorded in `docs/QA_REPORT.md`.
- [ ] UI contract gate result is recorded or explicitly deferred with reason.
- [ ] Asset generation batch gate result is recorded for the active batch.
- [ ] Cocos Browser Preview screenshots are captured under `tmp/qa_*` when the loop reaches `browser_screenshots`.
- [ ] Fresh screenshot paths and visual notes are added to `docs/QA_REPORT.md`.
- [ ] No long browser screenshot capture is required during documentation-only QA prep passes.
- [ ] Development-only folders (`tmp/`, `tmp/reference`, `tmp/asset_candidates`, `assets/textures/references`, `temp/`, `library/`) remain excluded from runtime configs and bundles.

## 8. Release Exit Criteria

MVP can move to user testing when:

- P0 checks in `QA_REPORT.md` pass.
- Cocos preview runs.
- WeChat DevTools preview runs.
- Gameplay loop can be completed for at least one battle.
- Rewards and currency cannot be duplicated or driven negative.
