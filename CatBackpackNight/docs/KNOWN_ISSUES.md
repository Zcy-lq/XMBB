# Known Issues

## P0

No active P0 blocker after the 2026-05-30 Browser Preview route pass.

Resolved/outdated item:

1. The old "Cocos Browser Preview is serving a stale home-screen bundle" blocker was rechecked and is no longer active after the 2026-05-29 preview-cache refresh.

   Current evidence: `temp/programming/packer-driver/targets/preview/import-map.json` and the served `http://127.0.0.1:7456/scripting/x/import-map.json` now map every known `UISkeletonBuilder` preview import to `./chunks/codex/UISkeletonBuilder.72156f66933b48803945.js`. That active chunk contains readable Chinese UI text, the refreshed battle HUD placement, and the route-panel runtime asset mappings from the 2026-05-30 commercial UI route pass.

   Note: old `chunks/1c`, `chunks/79`, `chunks/da`, and intermediate `chunks/codex` history can still exist under `temp/`, but the active import-map targets for the current workspace path point at the refreshed Codex chunk.

   Next action: recapture fresh Browser Preview screenshots after refreshing the browser page. If Cocos rewrites the import-map back to a stale chunk, rerun `node tools/refresh_cocos_preview_ui_chunk.mjs` and then `node tools/verify_scene_flow_guards.mjs`.

2. Resolved on 2026-05-29: home-page/runtime Chinese text mojibake.

   Current evidence: visible runtime text in `UISkeletonBuilder.ts`, `DefaultSave.ts`, `BattleSceneEntry.ts`, `levels.json`, and `package.json` was restored to readable Simplified Chinese. `tools/verify_scene_flow_guards.mjs` now fails on common mojibake tokens, replacement/private-use corrupted characters, unreadable first chapter names, stale placeholder-name checks, and stale active Browser Preview UI chunks.

   Verification: `node tools/verify_scene_flow_guards.mjs` passed after the guard first failed on the mojibake regression.

## P1

1. Cocos scene files are skeleton placeholders.

   Impact: The TypeScript architecture compiles and Browser Preview smoke verification passes, but editor-side hierarchy/prefab binding still needs Cocos Creator verification.

   Next action: Use the current Cocos Creator preview to verify route transitions and button callbacks, then let Codex fix any missing component or scene import errors.

2. Reference images are present in project assets.

   Impact: They are useful for development, but too large for runtime production bundles.

   Current mitigation: Runtime registration uses `assets/configs/assets_runtime.json`, and `npm.cmd run verify:runtime-assets` confirms that runtime entries do not point at `assets/textures/references`.

   Next action: Keep them as editor/development references only. QA must still confirm the final WeChat production build excludes them from package output.

3. Lower-priority runtime placeholder art still needs polish.

   Impact: The current code supports the UI architecture and resource IDs, all UI contract final runtime IDs are present, and the core route screenshot pass no longer shows blank or unstyled route panels. Commercial visual polish still requires screenshot approval for lower-priority `runtimePlaceholder` support art and atlas replacement.

   Current mitigation: `assets/configs/runtime_asset_quality.json` classifies runtime PNGs as production candidates, runtime placeholders, temporary aliases, or decomposition targets. The current planned-missing list is empty after the 2026-05-29 P1 promotion.

   Next action: After the WeChat/editor gates are unblocked, use `PROJECT_PROGRESS_PRIORITY_2026-05-28.md`, `ASSET_PIPELINE.md`, `NEXT_UI_ASSET_SLICE_PLAN.md`, and `assets/configs/runtime_asset_quality.json` to drive the next asset production pass. Test screenshots and intermediate files under `tmp/` must not be promoted to runtime art.

4. Resolved on 2026-05-29: five P0 shared UI/weapon assets were absent.

   Runtime files now present: `rt_btn_icon_round`, `rt_btn_red`, `rt_icon_paw`, `rt_icon_nav_backpack`, and `rt_item_weapon_fishbone_bow`.

   Impact: popups, close/back/settings buttons, generic paw iconography, backpack navigation, and the fishbone bow identity no longer depend on null mappings or temporary aliases.

   Next action: run UIUXAgent/QAReleaseAgent screenshot review for popup/button/nav/backpack application.

## P2

1. Real WeChat AppID, ad unit IDs, and legal URLs are not configured.

   Impact: Platform services run through mocks or placeholders.

   Next action: Configure them only after the game loop is stable and an official account/AppID is ready.

2. Real-device performance is not measured yet.

   Impact: Static checks pass, but mobile FPS and memory are unknown.

   Next action: Use `PERFORMANCE_CHECKLIST.md` after the first Cocos preview build.

3. New-user tutorial is documented but not fully implemented as a guided sequence.

   Impact: MVP can be tested, but commercial retention will need guided onboarding.

   Next action: Add guided steps for start battle, merge, pet upgrade, and task claim.

4. Second-stage commercial systems are intentionally deferred.

   Deferred:
   - Full ad placement tuning.
   - Ranking UI polish.
   - Remote config.
   - Live ops events.
   - Cloud save.
   - Payment or virtual purchase integration.

## No Current P0 Static Blocker

Latest local checks in this desktop environment should use bundled Node/Python when `npm.cmd`, `git`, or local TypeScript tooling are not on PATH:

```powershell
node tools/refresh_cocos_preview_ui_chunk.mjs
node tools/validate_configs.js
node tools/validate_assets.js
node tools/audit_design_reference.mjs
node tools/validate_handoffs.js --allow-missing
node tools/verify_scene_flow_guards.mjs
node tools/verify_runtime_asset_index.mjs
node tools/audit_runtime_asset_quality.mjs
node tools/verify_ui_asset_contract.mjs
node tools/verify_asset_generation_batch.mjs
node tools/verify_asset_candidates.mjs
node tools/verify_asset_pipeline_state.mjs
node tools/build_check.js
node --check tools/refresh_cocos_preview_ui_chunk.mjs
node --check tools/capture_cocos_preview.mjs
cd D:\工作\XMBB
python -m unittest tests.test_multi_agent_workflow -v
```

Result: pass on 2026-05-30 across 16 checks, including the root multi-agent unit test suite (`Ran 6 tests ... OK`). `verify_asset_candidates` still reports known older source-trace warnings, but exits successfully.
