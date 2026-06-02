# QA Report

Date: 2026-05-30

Project: CatBackpackNight

## Summary

Current status: **MVP code foundation passed static TypeScript verification and Cocos Browser Preview smoke verification**.

This repository now contains the commercial-grade Cocos Creator architecture documents, UI system plan, asset pipeline, gameplay logic, platform service mocks, and baseline scene/UI scripts. The project is ready for the next validation step in Cocos Creator 3.8.x.

## Checks Performed

### 2026-06-01 Launch Logic Full-Loop Gate

User direction: continue until the WeChat mini game meets launch standards. This pass adds a repeatable automated launch-loop gate, but does not mark runtime launch verification as complete.

Changes made:

- Added `assets/scripts/game/MailSystem.ts` so mail claim/delete behavior is testable as a pure gameplay system and still used by `GameLogicFacade`.
- Added `tools/verify_full_loop_acceptance.ts`, now a 67-check full-loop acceptance script covering clear save, agreement gate, first battle, release-mode energy spend/insufficient-energy safety, pause/resume, auto-merge toggle state, skill choice application/duplicate blocking, victory/defeat settlement, key-wave first-clear rewards, post-settlement rewarded-video double reward, cancelled-ad no-mutation, duplicate reward blocking, backpack merge, open chest success/failure safety, selected pet upgrade/deploy, selected talent upgrade/reset/max-level blocking, battle-prep power/weapon preview, task/activity/achievement single/all claims, config-backed red-dot thresholds, mail red-dot reduction, mail single/all claim/delete, shop daily-free/paid/refresh/special-placeholder daily limits, energy recovery, daily reset, second battle, restart clone, settings persistence, and non-negative economy.
- Extracted `DefaultRedDotRules` and `DailyResetSystem` so red-dot thresholds and daily reset behavior are pure gameplay logic covered by the launch gate while still used by runtime managers.
- Added `npm run verify:full-loop` and updated `verify_scene_flow_guards` so the full-loop gate cannot be accidentally removed from the release workflow.
- Added `tools/verify_wechat_build_output.mjs` and `npm run verify:wechat-build` to validate the generated Cocos WeChat Mini Game output.
- Added `tools/verify_ui_design_parity.mjs` and `npm run verify:design-parity` to aggregate the 22-page design reference audit, 8 page/modal parity scripts, and 22 local portrait screenshot evidence files.
- Added `tools/verify_page_function_coverage.mjs` and `npm run verify:page-functions` to verify 25 routes, 22 screenshot-backed pages, and 25 key page function contracts.
- Added `tools/verify_mobile_resilience_contracts.mjs` and `npm run verify:mobile-resilience` to guard fixed-width portrait safe-area policy, long-mail ScrollView behavior, data-driven 18-node talent scrolling, legal route-switch targets, generated UI cleanup, and power-saving battle UI throttling.
- Added `tools/verify_release_compliance.mjs` and `npm run verify:release-compliance` to verify readable compliance text, review-mode ad safety, config-driven WeChat IDs, rewarded-video completion gating, and production-input blockers.
- Added `tools/verify_launch_evidence.mjs`, `npm run verify:launch-evidence`, and `docs/launch_evidence/launch_evidence.template.json` so WeChat DevTools import, runtime full-loop proof, 22-page design signoff, real-device smoke, and performance evidence are machine-checkable before final upload.
- Wired `Button_RewardDouble` and the daily ad task through `AdService`; reward/progress is granted only after a successful rewarded-video result.
- Updated release matrix/runbook/blocker docs to separate automated logic evidence from missing Cocos/WeChat/device evidence.

Fresh verification commands passed:

```powershell
node tools/validate_configs.js
node tools/validate_assets.js
node tools/audit_design_reference.mjs
node tools/verify_ui_design_parity.mjs
node tools/verify_page_function_coverage.mjs
node tools/verify_mobile_resilience_contracts.mjs
node tools/verify_release_compliance.mjs
node tools/verify_launch_evidence.mjs
node tools/verify_scene_flow_guards.mjs
node tools/build_check.js
node tools/verify_wechat_build_output.mjs
node ..\.tools\npm-cache\_npx\fd45a72a545557e9\node_modules\tsx\dist\cli.mjs tools/verify_game_logic_self_check.ts
node ..\.tools\npm-cache\_npx\fd45a72a545557e9\node_modules\tsx\dist\cli.mjs tools/verify_full_loop_acceptance.ts
```

Result:

- Config gate: 19 JSON files parsed.
- Asset gate: 54 asset entries checked.
- Design reference audit: 22/22 annotated design pages plus 12 legacy references checked.
- UI design parity gate: 22/22 local portrait screenshots and 8 static parity scripts verified.
- Page function coverage gate: 25/25 routes, 22/22 screenshot-backed pages, and 25/25 page function contracts verified.
- Mobile resilience gate: fixed-width portrait policy, long-mail scroll surface, 18 configured talent nodes, 25 route targets, generated UI cleanup, and power-saving battle throttling verified.
- Cocos WeChat build output: `build/wechatgame` has 36 files, 4,969,185 bytes, required root files, portrait orientation, and `compileType: game`.
- Game logic self-check: 12/12 passed.
- Release compliance code gate: passed with 3 explicit production-input blockers (`wechat.appid`, `wechat.privacyPolicyUrl`, `wechat.userAgreementUrl`).
- Launch evidence gate: local code gate passed and emitted a required `launch_evidence.json` blocker; `XMBB_RELEASE_FINAL=1` correctly fails until WeChat/真机/UI signoff evidence is recorded.
- Full-loop acceptance: 67/67 passed.

Still BLOCKED for launch:

- WeChat DevTools import/preview is not verified. Earlier `open`, `islogin`, `quit`, `auto --trust-project`, and `login --qr-output` CLI commands timed out; on 2026-06-02 the service port could start and `islogin --port 9420` returned `{"login":false}`, but `login --qr-output tmp/wechat_cli_login_qr.png --port 9420` still timed out without a QR image, import result, or preview result.
- Real-device performance, touch, memory, and storage restart evidence is still required.

### 2026-05-30 Commercial UI Route Polish Pass

User direction: all pages must feel polished and not half-finished.

Changes made:

- Added a shared commercial route backdrop layer for secondary routes so task, mail, settings, merge, explore, guild, achievement, reward, skill-choice, talent, and pet screens no longer sit on a flat empty background.
- Reworked the talent page into a finished tree surface with a tree panel, visible node hierarchy, node descriptions, detail panel, and two action buttons.
- Reworked the victory/reward page into concrete reward cards with visible gold, diamond, and equipment rewards plus a summary panel and double-reward badge.
- Reworked the skill-choice page into three polished selectable cards with rarity labels, icon frames, type tags, descriptions, reroll state, and a clear refresh action.
- Hardened `tools/verify_scene_flow_guards.mjs` so these route-polish requirements are now regression-guarded.

Fresh final Browser Preview screenshots:

- `tmp/qa_final_login_20260530.png`
- `tmp/qa_final_home_20260530.png`
- `tmp/qa_final_battlePrepare_20260530.png`
- `tmp/qa_cdp_battle_live_hud_centered_20260529.png`
- `tmp/qa_final_backpack_20260530.png`
- `tmp/qa_final_shop_20260530.png`
- `tmp/qa_final_pet_20260530.png`
- `tmp/qa_final_talent_20260530.png`
- `tmp/qa_final_dailyTask_20260530.png`
- `tmp/qa_final_mail_20260530.png`
- `tmp/qa_final_settings_20260530.png`
- `tmp/qa_final_merge_20260530.png`
- `tmp/qa_final_explore_20260530.png`
- `tmp/qa_final_guild_20260530.png`
- `tmp/qa_final_achievement_20260530.png`
- `tmp/qa_final_victory_20260530.png`
- `tmp/qa_final_skillChoice_20260530.png`
- Contact sheet: `tmp/ui_final_route_contact_sheet_20260530.png`

Result:

- All captured pages rendered with non-black content ratios above 0.43 in the Cocos Browser Preview capture.
- No checked route is a blank page or text-only placeholder page.
- The active refreshed preview UI chunk for this pass is `./chunks/codex/UISkeletonBuilder.72156f66933b48803945.js`.
- Final verification: 16 local static/workflow checks passed, and the final screenshot file check found all 17 listed route/live-battle screenshots present at `750x1334` with non-black content above the threshold.

### 2026-05-30 Browser Preview Route Visual Pass

User direction: continue from the priority document until the game feels complete, with strict UI/material quality and full logic coverage.

Changes made:

- `assets/scripts/ui/UISkeletonBuilder.ts`
  - Fixed battle HP HUD placement so live HP fill no longer spills into the left safe-area gutter.
  - Upgraded the pet page from an empty portrait/list state to visible runtime-avatar portrait, readable list cards, deployed/locked state labels, and guarded route polish.
  - Mapped daily task, mail, settings, merge, explore, guild, achievement, reward/victory, and skill-choice panels/cards/buttons to existing runtime parchment/dark/card/button assets.
  - Added visible guild mascot runtime avatar and corrected explore-card text colors for parchment runtime cards.
- `tools/refresh_cocos_preview_ui_chunk.mjs`
  - Now rewrites every import-map value pointing at stale mapped `UISkeletonBuilder` chunks, including internal `__unresolved_*` scope mappings.
- `tools/verify_scene_flow_guards.mjs`
  - Now scans all mapped preview chunks that contain `UISkeletonBuilder` battle UI code.
  - Added guards for compact battle HP HUD, pet page portrait/list polish, route panel/card runtime asset mapping, guild mascot visibility, and explore locked-card readability.

Fresh Browser Preview screenshots captured:

- `tmp/qa_route_login_20260530.png`
- `tmp/qa_route_home_20260530.png`
- `tmp/qa_cdp_start_battle_click_20260529.png`
- `tmp/qa_cdp_battle_live_hud_centered_20260529.png`
- `tmp/qa_route_backpack_20260530.png`
- `tmp/qa_route_shop_20260530.png`
- `tmp/qa_route_pet_portrait_avatar_20260530.png`
- `tmp/qa_route_talent_20260530.png`
- `tmp/qa_route_dailyTask_panels_20260530.png`
- `tmp/qa_route_mail_panels_20260530.png`
- `tmp/qa_route_settings_panels_20260530.png`
- `tmp/qa_route_merge_panels_20260530.png`
- `tmp/qa_route_explore_dark_text_20260530.png`
- `tmp/qa_route_guild_mascot_20260530.png`
- `tmp/qa_route_achievement_20260530.png`
- `tmp/qa_route_victory_panels_20260530.png`
- `tmp/qa_route_skillChoice_panels_20260530.png`

Results:

- No black-screen route among the checked MVP screens.
- No visible runtime mojibake in the checked route screenshots.
- Battle HP fill probe moved from stale `x=-250` to corrected `x=30`.
- Pet, route panels, reward, and skill-choice pages now show runtime panels/cards instead of bare text on a dark background.

Still UNVERIFIED:

- Cocos Creator editor hierarchy/import inspection.
- WeChat DevTools import.
- Real-device performance and input testing.
- Production AppID, legal URLs, ad units, and final WeChat release configuration.

### 2026-05-30 Local Cocos WeChat Build Probe

Attempted a local command-line WeChat Mini Game build probe using the installed Cocos Creator 3.8.8 executable and the official command-line publish format documented by Cocos: `--project projectPath --build "platform=wechatgame;debug=false"` ([Cocos Creator 3.8 command-line publish docs](https://docs.cocos.com/creator/3.8/manual/zh/editor/publish/publish-in-command-line.html)).

Result:

- The command returned to the shell and Cocos refreshed the project asset database / preview script compilation logs.
- No `build/` or `build/wechatgame/` output folder was produced.
- No generated `game.js`, `game.json`, or WeChat package output was found under the project.
- The probe spawned duplicate CocosCreator/CocosDashboard processes that locked `temp/logs/project.log` and caused an `EPERM: operation not permitted, open ... temp/logs/project.log` dialog. The duplicate processes were stopped, and the log file was confirmed openable again.
- The result is therefore **not counted as a verified WeChat build**.

Additional platform check:

- WeChat DevTools CLI was not found on this machine; only a cached icon asset was found during the local search.
- WeChat DevTools import/preview remains a required external gate.

### 2026-05-29 Runtime Chinese Text Encoding Fix

Fixed the main-page/runtime mojibake reported by the user. Visible player-facing Chinese text is now readable in:

- `assets/scripts/ui/UISkeletonBuilder.ts`
- `assets/scripts/data/DefaultSave.ts`
- `assets/scripts/scenes/BattleSceneEntry.ts`
- `assets/configs/levels.json`
- `package.json`

Regression coverage added:

- `tools/verify_scene_flow_guards.mjs` now rejects common mojibake tokens, replacement characters, and private-use corrupted characters in runtime UI/config text.
- The same guard now checks the first chapter name against readable Chinese `黑夜森林` and keeps the homepage placeholder-name normalization check on readable `玩家名字`.
- The same guard now checks all mapped Cocos Browser Preview `UISkeletonBuilder` chunks when an import-map is present, so stale source imports or internal `__unresolved_*` mappings cannot hide behind fixed source files.
- `tools/refresh_cocos_preview_ui_chunk.mjs` regenerates the active preview UI chunk from current source with the Cocos 3.8 Babel preset and rewrites stale mapped UI chunk references when the running Browser Preview cache is stale.

Preview-cache evidence:

- Before the 2026-05-30 refresh-script hardening, the source-file import could point to a clean generated chunk while internal preview scopes still pointed at an older `UISkeletonBuilder` chunk.
- After the 2026-05-30 commercial UI route pass, the local active import-map target is `./chunks/codex/UISkeletonBuilder.72156f66933b48803945.js`, and `tools/verify_scene_flow_guards.mjs` passes with no known mojibake or stale UI chunk findings.

Verification commands passed in the current desktop environment with bundled Node/Python:

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

Current environment limitation:

- 2026-05-30 aggregate result: 16 checks passed, including the root multi-agent unit test suite (`Ran 6 tests ... OK`).
- `verify_asset_candidates` still passes with known older source-trace warnings for the 2026-05-28 battle candidate files.

### 2026-05-29 P0 Shared Runtime Asset Promotion

Promoted five P0 shared assets:

- `rt_btn_icon_round`
- `rt_btn_red`
- `rt_icon_paw`
- `rt_icon_nav_backpack`
- `rt_item_weapon_fishbone_bow`

Changes recorded:

- Final PNGs copied to `assets/textures/runtime`.
- Candidate PNGs copied to `tmp/asset_candidates/assetagent_p0_runtime_gap_20260524`.
- Source and alpha-work PNGs saved under `tmp/asset_candidates/assetagent_p0_runtime_gap_20260524/_sources`.
- `ui_asset_contract.json` now maps the five product keys to their final runtime IDs as current assets.
- `runtime_asset_quality.json` no longer lists these five IDs as planned missing assets.
- `asset_pipeline_state.json` marks the five IDs as promoted.

Verification commands passed:

```powershell
node tools/generate_runtime_asset_index.mjs
node tools/verify_runtime_asset_index.mjs
node tools/audit_runtime_asset_quality.mjs
node tools/verify_ui_asset_contract.mjs
node tools/verify_asset_generation_batch.mjs
node tools/verify_asset_candidates.mjs
node tools/verify_asset_pipeline_state.mjs
node tools/verify_scene_flow_guards.mjs
node tools/build_check.js
```

Current warnings:

- `verify_asset_candidates` warns that older 2026-05-28 battle promoted assets do not have original `sourcePath`/`alphaWorkPath` files. Candidate PNGs were backfilled from runtime files for audit completeness.
- This P0 pass still had a P1 shop background alias warning, which was resolved later in the 2026-05-29 P1 final visual asset promotion below.
- Cocos Editor, WeChat DevTools, and real-device checks remain UNVERIFIED in this pass.

### 2026-05-29 P1 Final Visual Asset Promotion

Promoted three P1 final runtime assets:

- `rt_bg_shop_village_safe`
- `rt_cat_hero_idle`
- `rt_cat_shop_hood`

Changes recorded:

- Final PNGs copied to `assets/textures/runtime`.
- Candidate PNGs copied to `tmp/asset_candidates/assetagent_p1_runtime_gap_20260529`.
- Source PNGs saved under `tmp/asset_candidates/assetagent_p1_runtime_gap_20260529/_sources`.
- Character alpha-work PNGs saved for `rt_cat_hero_idle` and `rt_cat_shop_hood`.
- `ui_asset_contract.json` now has 44/44 current runtime and 44/44 final runtime assets ready.
- `runtime_asset_quality.json` now has zero planned-missing runtime assets and zero temporary aliases.

Verification commands passed:

```powershell
node tools/generate_runtime_asset_index.mjs
node tools/verify_runtime_asset_index.mjs
node tools/audit_runtime_asset_quality.mjs
node tools/verify_ui_asset_contract.mjs
node tools/verify_asset_pipeline_state.mjs
node tools/verify_scene_flow_guards.mjs
node tools/build_check.js
```

Current warnings:

- Older 2026-05-28 battle candidate records still warn about missing original source/alpha work files if `verify_asset_candidates` is run. This is an audit-trace warning, not a runtime index or UI contract blocker.
- Cocos Editor, WeChat DevTools, and real-device checks remain UNVERIFIED in this pass.

### Automated Loop QA Gate - 2026-05-24

| Gate | Result | Notes |
| --- | --- | --- |
| Asset pipeline state | Pass after 2026-05-29 promotion | `assets/configs/asset_pipeline_state.json` is on cycle 1, phase `static_checks`, active batch `assetagent_p0_runtime_gap_20260524`; all 15 active-batch assets are tracked and promoted. |
| UI asset contract | Gate required before acceptance | `npm run verify:ui-asset-contract` remains a mandatory static gate for product-to-runtime key coverage and temporary mapping review. |
| Asset generation batch | Gate required before candidate acceptance | `assets/configs/asset_generation_batch_p0.json` defines 15 P0 tasks staged under `tmp/asset_candidates/assetagent_p0_runtime_gap_20260524`; batch verification must pass before AssetAgent starts or accepts the batch. |
| Cocos Browser Preview screenshots | Evidence pending for this loop cycle | Do not mark the loop screenshot gate complete until fresh Cocos Browser Preview screenshots are captured under `tmp/qa_*` and recorded here. This QA prep pass intentionally did not run long browser screenshot capture. |
| Development-only assets | Runtime exclusion gate required | Runtime code/configs must not load `tmp/`, `tmp/asset_candidates/`, `tmp/reference`, `assets/textures/references/`, `temp/`, `library/`, QA screenshots, contact sheets, or crop experiments. Only audited/promoted files under `assets/textures/runtime` may be runtime assets. |

### P0 Engineering

| Check | Result | Notes |
| --- | --- | --- |
| TypeScript compile check | Pass | `npm run typecheck` |
| Core script folders exist | Pass | `core`, `data`, `game`, `services`, `ui`, `scenes`, `configs` |
| Config JSON files exist | Pass | `items`, `pets`, `levels`, `shop`, `tasks`, `talents`, `assets` |
| Platform services compile | Pass | WeChat, ads, share, leaderboard, compliance services |
| Gameplay services compile | Pass | Battle, rewards, economy, inventory, shop, progression |
| Runtime asset gate | Pass | `npm run generate:runtime-assets`, `npm run verify:runtime-assets` |

### Cocos Browser Preview Smoke

| Scene | Result | Screenshot | Notes |
| --- | --- | --- | --- |
| Login | Pass | `tmp/qa_cocos_preview_login.png` | UI skeleton renders, no browser error/warn logs |
| Home | Pass | `tmp/qa_cocos_preview_home.png` | UI skeleton renders, no browser error/warn logs |
| BattlePrepare | Pass | `tmp/qa_cocos_preview_battle_prepare.png` | UI skeleton renders, no browser error/warn logs |
| Battle | Pass | `tmp/qa_cocos_preview_battle.png` | UI skeleton renders, no browser error/warn logs |

### P0 Gameplay Coverage

| Feature | Result | Implementation |
| --- | --- | --- |
| Battle start and energy cost | Covered | `GameLogicFacade.startBattle()` |
| Auto battle session | Covered | `BattleSessionModel.tick(dt)` |
| Battle settlement | Covered | `GameLogicFacade.settleBattle(...)` |
| Inventory merge | Covered | `mergeWeapon(...)`, `autoMergeAll()` |
| Chest opening | Covered | `openChest()` |
| Shop purchase | Covered | `buyShopGoods(...)` |
| Shop refresh | Covered | `refreshShop(...)` |
| Pet upgrade/deploy | Covered | `upgradePet(...)`, `deployPet(...)` |
| Talent upgrade/reset | Covered | `upgradeTalent(...)`, `resetTalents(...)` |
| Daily task/achievement/mail claim | Covered | `claimDailyTask(...)`, `claimAchievement(...)`, `claimMail(...)` |

### P0 Platform Coverage

| Feature | Result | Notes |
| --- | --- | --- |
| WeChat environment detection | Covered | Mock fallback outside WeChat |
| Rewarded ad states | Covered | success/cancelled/failed/no_inventory |
| Share API | Covered | Mock fallback outside WeChat |
| Leaderboard reservation | Covered | Open data/cloud storage abstraction |
| Compliance entries | Covered | User agreement, privacy, 16+, health notice |

### P1 UI/Asset Coverage

| Check | Result | Notes |
| --- | --- | --- |
| UI design system | Covered | `UI_COMPONENT_SPEC.md` |
| Prefab list | Covered | `PREFAB_LIST.md` |
| Screen flow | Covered | `SCREEN_FLOW.md` |
| Reference images imported | Covered | 16 reference images in `assets/textures/references` |
| Runtime asset IDs | Covered | Runtime uses generated `assets/configs/assets_runtime.json`; authoring uses `assets/configs/assets.json` |
| Runtime asset quality gate | Covered | `assets/configs/runtime_asset_quality.json` separates production candidates, placeholders, aliases, and decomposition targets |
| UI asset contract | Covered | `assets/configs/ui_asset_contract.json` covers all 43 product-level `UIAssetKeys` entries |
| AssetAgent P0 generation batch | Covered | `assets/configs/asset_generation_batch_p0.json` defines 15 P0 generation tasks with prompts, output paths, dimensions, alpha/nine-slice flags, and acceptance checks |
| Automated multi-agent loop | Covered | `docs/AUTOMATED_MULTI_AGENT_LOOP.md` and `assets/configs/asset_pipeline_state.json` define continuous agent phases and resume state |
| Production slice replacement plan | Covered | `ASSET_PIPELINE.md` |

## Current Risks

### P0

No P0 static compile blockers remain.

### P1

- The Cocos `.scene` files are skeleton placeholders. Browser Preview smoke verification passes, but editor-side hierarchy/prefab binding still needs visual verification before release.
- The 16 reference PNGs are development references and must not be included in a production runtime bundle.
- Runtime asset registration has been separated into `assets_runtime.json`, generated from `assets/textures/runtime`; keep `npm run generate:runtime-assets` and `npm run verify:runtime-assets` in the release check path.
- Runtime asset quality audit currently reports 113 runtime PNGs, with 88 production candidates, 23 runtime placeholders, 0 temporary aliases, and 2 decomposition targets. This is enough for current final runtime coverage, but lower-priority visual polish remains.
- UI asset contract verification currently reports 44 product keys covered, 44 current runtime assets ready, 44 final runtime assets ready, and 0 temporary product-to-runtime mappings.
- AssetAgent P0 generation batch verification currently reports 15 tasks, including 13 transparent sprites/components, 2 opaque vertical backgrounds, and 3 nine-slice UI components.
- Automated loop cycle 1 has promoted the P0 shared asset batch. QA should continue requiring screenshot evidence before marking affected screens visually complete.
- UI scripts and gameplay logic compile, but the final scene node binding must be verified in Cocos Creator.

### P2

- Real ad unit IDs, AppID, privacy URLs, and user agreement URLs are not configured yet.
- Final sliced art, atlases, animation effects, and audio are still second-stage production work.
- Real-device performance has not been measured yet.

## Verification Command

Run from `D:/工作/XMBB/CatBackpackNight`:

```powershell
npm run typecheck
npm run generate:runtime-assets
npm run verify:runtime-assets
npm run audit:runtime-asset-quality
npm run verify:ui-asset-contract
npm run verify:asset-generation-batch
npm run verify:asset-pipeline-state
```

Expected result: all commands exit with code `0`.

For the current QA prep pass, only these commands were required after the documentation update:

```powershell
npm run verify:asset-pipeline-state
npm run verify:asset-generation-batch
```

## QA Recommendation

Next gate: continue the automated loop in phase order:

1. Inspect the editor hierarchy for `Login`, `Home`, `BattlePrepare`, and `Battle` scenes.
2. Confirm generated UI nodes are organized and selectable in the editor.
3. Verify route transitions and button callbacks from the Cocos preview UI.
4. WeChat build target can be selected.
5. Run `npm run verify:ui-asset-contract`, `npm run verify:asset-generation-batch`, and `npm run verify:asset-pipeline-state` after any loop-state or asset-batch edits.
6. Capture fresh Cocos Browser Preview screenshots under `tmp/qa_*` when the loop reaches `browser_screenshots`.
7. Confirm `tmp/reference`, `tmp/`, and `assets/textures/references` are excluded from production runtime bundle and runtime configs.

## 2026-05-24 Automated Asset Loop - `rt_panel_parchment_card`

| Gate | Result | Evidence |
| --- | --- | --- |
| AssetAgent audit | Pass | `rt_panel_parchment_card.png` is 320x420 RGBA, transparent corners, clean alpha, no visible chroma residue, no text/watermark/test UI screenshot artifacts. |
| UIUXAgent visual review | Pass with watch item | Approved as a high-weight parchment card for shop/item/reward/detail use; avoid using it as a dense repeated ordinary grid tile without screenshot review. |
| QAReleaseAgent gate | Fixed then pass | Initial failure found stale loop phase semantics. `tools/verify_asset_pipeline_state.mjs` now checks artifact phase and loop phase consistency. |
| Cocos Browser Preview | Pass | Screenshot: `tmp/qa_cocos_preview_asset_gate_parchment_card_20260524.png`. Current preview renders normally; promoted asset still needs Cocos import/meta before UUID-based in-scene display. |
| Runtime promotion | Pass | Promoted to `assets/textures/runtime/rt_panel_parchment_card.png`; `assets/configs/assets_runtime.json` regenerated with 93 runtime assets. |

Verification commands passed:

```powershell
npm run typecheck
npm run verify:game-logic
npm run verify:scene-flow
npm run generate:runtime-assets
npm run verify:runtime-assets
npm run audit:runtime-asset-quality
npm run verify:ui-asset-contract
npm run verify:asset-generation-batch
npm run verify:asset-candidates
npm run verify:asset-candidate-similarity
npm run verify:asset-pipeline-state
```

Remaining non-blocking warnings:

- Older 2026-05-28 battle candidate records still lack original source/alpha-work trace files.
- Cocos `.meta`/UUID import and preview display remain UNVERIFIED until the project is opened in Cocos Creator or a fresh browser preview bundle is captured.

## 2026-05-24 Home Commercial UI Pass

User direction changed the active priority from continuing `rt_btn_icon_round` generation to finishing the home screen first.

Agents triggered:

| Agent | Result |
| --- | --- |
| UIUXAgent | Found the home screen was still a skeleton-like first screen: weak hierarchy, crowded CTA/nav, static text, and side entries competing with the camp scene. |
| QAReleaseAgent | Found home interactions were only partially real: start battle and side entries could bypass `SceneRouter`, energy checks, analytics, and red-dot state. |

Changes made:

- `assets/scripts/ui/UISkeletonBuilder.ts`
  - Reworked the home layout toward a commercial first screen: stronger stage card, task/reward cards, clearer camp visual area, repositioned side rail, and a cleaner CTA zone.
  - Home now reads real snapshot data for player level, resources, wave progress, energy, recommended power, daily merge progress, and red dots.
  - `Button_StartBattle` now checks energy, emits toast on failure, tracks analytics, and routes through `SceneRouter` instead of only mutating `screenKey`.
  - Battle-prepare start now calls `gameLogic.startBattle()` before routing to battle.
  - Settings, task/check-in, mail, achievement, and bottom-nav buttons now route through `SceneRouter`.
- `assets/scripts/data/DefaultSave.ts`
  - Default player nickname is now readable Chinese: `守夜小猫`.
- `tools/verify_scene_flow_guards.mjs`
  - Added guards for home start-battle routing, battle-start logic, side-entry routes, settings route, red-dot source, and prevention of local-only `screenKey` route fallback.

Verification commands passed:

```powershell
npm run typecheck
npm run verify:game-logic
npm run verify:scene-flow
npm run verify:runtime-assets
```

Screenshot evidence:

- `tmp/qa_home_commercial_pass1_20260524.png`
- `tmp/qa_home_commercial_pass1_cachebust_20260524.png`
- `tmp/qa_home_commercial_pass2_20260524.png`

Current visual blocker:

- Cocos Browser Preview still displayed the previous home UI after a hard reload and cache-busting query. The TypeScript source and static checks are updated, but the running preview appears to be using a stale Cocos compiled preview bundle. Next QA pass should restart or force-refresh Cocos Creator preview compilation before judging the new visual layout.

## 2026-05-24 Home Commercial UI Pass 2

User direction remains home-first: do not resume the next asset batch until the home page is visually verified from a fresh Cocos preview bundle.

Agents triggered:

| Agent | Result |
| --- | --- |
| UIUXAgent + QAReleaseAgent | Read-only review confirmed the home entry loop is mostly wired, but commercial approval is blocked by stale preview output and missing dynamic economy copy. |
| ClientArchAgent + QAReleaseAgent | Read-only preview investigation confirmed `temp/programming/packer-driver/targets/preview/chunks/1c/1cd0f1b687eef301245bcd5d44d8a866624742a4.js` is older than `assets/scripts/ui/UISkeletonBuilder.ts` and still contains old text/route logic. |

Changes made:

- `assets/scripts/game/GameLogicFacade.ts`
  - Extended `BattlePreparationInfo` with `chapterTitle`, `maxWave`, and `energyMax` so home and battle-prepare UI can render from gameplay config instead of literals.
- `assets/scripts/core/RedDotManager.ts`
  - Added an `achievement` red-dot rule so the home achievement entry is no longer hard-coded.
- `assets/scripts/ui/UISkeletonBuilder.ts`
  - Home stage title, max wave, energy max, and start cost now read from `battlePreparation`.
  - Home achievement red dot now uses `redDots.achievement`.
  - Home camp supply card now routes to mail and displays pending reward-mail count instead of a static `可领取`.
  - Battle-prepare title, recommended power, player power, and start-battle cost now read from `battlePreparation`; removed the wrong `钻石 x5` copy.
- `tools/verify_scene_flow_guards.mjs`
  - Added guards against hard-coded `体力 x5`, `钻石 x5`, fake power copy, hard-coded achievement red dot, and non-clickable camp supply card.

Verification commands passed:

```powershell
npm run typecheck
npm run verify:game-logic
npm run verify:scene-flow
npm run generate:runtime-assets
npm run verify:runtime-assets
npm run audit:runtime-asset-quality
npm run verify:ui-asset-contract
npm run verify:asset-generation-batch
npm run verify:asset-candidates
npm run verify:asset-candidate-similarity
npm run verify:asset-pipeline-state
```

Screenshot evidence:

- `tmp/qa_home_commercial_pass2_20260524.png`

Current visual blocker:

- The screenshot still shows the old home screen because Cocos Browser Preview is serving stale compiled output. Evidence: `assets/scripts/ui/UISkeletonBuilder.ts` last write time is `2026-05-24 07:33:25`, while `temp/programming/packer-driver/targets/preview/chunks/1c/1cd0f1b687eef301245bcd5d44d8a866624742a4.js` remains `2026-05-24 06:20:38` and still contains old strings such as `钻石 x5`, `体力 x5`, and `this.screenKey = route;`.
- Non-destructive next action: save all in Cocos Creator, stop/close Browser Preview, then start preview again. Only after the preview chunk updates later than the source file should QA judge the refreshed home screenshot.

## 2026-05-27 MVP UI Action Wiring Pass

User direction: continue the game toward a playable MVP without waiting for more questions.

Changes made:

- `assets/scripts/ui/UISkeletonBuilder.ts`
  - Replaced deferred fake-data toast handling with real `gameLogic` and `SaveManager` calls for visible MVP buttons.
  - Wired backpack merge/open chest, shop purchase/refresh, daily task claim/progress actions, activity chest claim, mail claim/all-claim, achievement claim, pet upgrade/deploy, talent upgrade, settings toggles, and local reset.
  - Updated shop resources, backpack capacity/items, daily activity chests, task rows, achievements, pet state, talent points, and settings rows to render from the current save/gameplay snapshot instead of hard-coded preview values.
- `tools/verify_scene_flow_guards.mjs`
  - Added guards that fail if MVP action buttons fall back to fake deferred copy or omit the real gameplay/save methods.

Verification commands passed:

```powershell
node tools/verify_scene_flow_guards.mjs
node tools/validate_configs.js
node tools/validate_assets.js
node tools/verify_runtime_asset_index.mjs
node tools/verify_ui_asset_contract.mjs
node tools/audit_design_reference.mjs
node tools/build_check.js
node tools/verify_asset_generation_batch.mjs
node tools/verify_asset_pipeline_state.mjs
node tools/audit_runtime_asset_quality.mjs
node --experimental-strip-types --check assets/scripts/ui/UISkeletonBuilder.ts
```

Environment note:

- `npm` is not available in the current Codex desktop PATH, and the app-bundled Node runtime does not include `typescript` or `tsx`, so `npm run typecheck` and `npm run verify:game-logic` still require the local Node/npm toolchain or Cocos Creator environment.

## 2026-05-27 Battle Live Rendering Pass

User report: the battle page still looked like a static picture and did not show real combat.

Root cause:

- `BattleSessionModel` already simulated monsters, camp HP, weapon cooldowns, damage numbers, win/fail, and settlement.
- `BattleSceneEntry` only ticked that model in the background.
- `UISkeletonBuilder.buildBattle()` rendered fixed labels and fake damage numbers, so the player saw a static background instead of live battle state.

Changes made:

- `assets/scripts/scenes/BattleSceneEntry.ts`
  - Pushes the current `BattleSessionState` into UI on battle start and on a 0.2 second refresh cadence while ticking.
- `assets/scripts/ui/UIManager.ts`
  - Added `updateBattleState(state)` and forwards it to the active `UISkeletonBuilder`.
- `assets/scripts/ui/UISkeletonBuilder.ts`
  - Stores live battle state through `setBattleState`.
  - Battle screen now renders live wave, countdown, camp HP, kill counter, monsters, monster HP bars, damage numbers, and weapon cooldown state.
- `tools/verify_scene_flow_guards.mjs`
  - Added a regression guard that fails if battle UI stops consuming live session fields or keeps stale fake battle literals.

Verification commands passed:

```powershell
node tools/verify_scene_flow_guards.mjs
node --experimental-strip-types --check assets/scripts/ui/UISkeletonBuilder.ts
node --experimental-strip-types --check assets/scripts/ui/UIManager.ts
node --experimental-strip-types --check assets/scripts/scenes/BattleSceneEntry.ts
node tools/validate_configs.js
node tools/validate_assets.js
node tools/build_check.js
```

## 2026-05-27 Battle Flicker Fix

User report: battle page still did not feel alive and kept flashing.

Root cause:

- The previous live-rendering pass pushed `BattleSessionState` into UI, but `UISkeletonBuilder.setBattleState()` called `rebuild()` for every battle update.
- `rebuild()` removes every child node and recreates the full battle screen, so the preview flashes continuously and can look like a static image being redrawn.

Changes made:

- `assets/scripts/ui/UISkeletonBuilder.ts`
  - `setBattleState()` now stores the new battle state and updates the existing battle UI in place.
  - Added `Battle_LiveLayer` for monsters, damage numbers, and live weapon cooldown overlays.
  - Added targeted label/progress updates for wave, countdown, camp HP, and kill counter without deleting the full screen.
- `tools/verify_scene_flow_guards.mjs`
  - Added a regression guard that fails if `setBattleState()` calls full-screen `rebuild()`.

Verification commands passed:

```powershell
npm run typecheck
npm run verify:game-logic
node tools/verify_scene_flow_guards.mjs
node tools/verify_runtime_asset_index.mjs
node tools/verify_ui_asset_contract.mjs
node tools/audit_design_reference.mjs
node tools/build_check.js
node --experimental-strip-types --check assets/scripts/ui/UISkeletonBuilder.ts
node --experimental-strip-types --check assets/scripts/ui/UIManager.ts
node --experimental-strip-types --check assets/scripts/scenes/BattleSceneEntry.ts
```

## 2026-05-27 Battle Static Preview Root-Cause Fix

User report: battle page still appeared as one static picture even after flicker fixes.

Root cause:

- `?screen=battle` could render the battle UI inside `Home.scene`, so `BattleSceneEntry` never owned the screen and the battle model never ticked.
- `Home.scene` still had a stale extra battle-prepare scene entry in the scene cache path, creating duplicate scene-entry behavior.
- `BattleSceneEntry` used `schedule(..., 0)` for the main battle loop; in preview this can stall at the initial frame.
- Live battle primitives such as monster nodes and HP fills were still at risk of matching the broad `Battle_` runtime-sprite fallback and being replaced by dark panel art.

Changes made:

- `assets/scripts/scenes/BaseSceneEntry.ts`
  - Preview `?screen=` routes that belong to a different Cocos scene now route to the matching scene instead of drawing that screen in the current scene.
- `assets/scenes/Home.scene`
  - Disabled the stale duplicate battle-prepare scene entry so Home no longer has competing scene-entry components.
- `assets/scripts/scenes/BattleSceneEntry.ts`
  - Replaced zero-interval scheduling with Cocos `update(deltaSec)` as the battle simulation driver.
- `assets/scripts/ui/UISkeletonBuilder.ts`
  - Exempted live battle primitives from broad runtime panel sprite replacement.
- `tools/verify_scene_flow_guards.mjs`
  - Added regression guards for preview scene routing, Home scene ownership, battle update-loop driving, and live battle primitive sprite exemptions.

Verification commands passed:

```powershell
npm run typecheck
npm run verify:game-logic
node tools/verify_scene_flow_guards.mjs
node tools/verify_runtime_asset_index.mjs
node tools/verify_ui_asset_contract.mjs
node tools/build_check.js
node --experimental-strip-types --check assets/scripts/scenes/BaseSceneEntry.ts
node --experimental-strip-types --check assets/scripts/scenes/BattleSceneEntry.ts
node --experimental-strip-types --check assets/scripts/ui/UISkeletonBuilder.ts
```

## 2026-05-28 Project Progress Reconciliation

User direction: inspect the full project progress from root docs, logs, agent prompts, QA reports, and runtime configs, then write a priority document and begin development from the highest-priority gap.

Sources checked:

- Root docs: `docs/ARCHITECTURE_PLAN.md`, `docs/UI_DESIGN_TEMPLATE.md`, `docs/WECHAT_MINIGAME_STEP_BY_STEP.md`
- Agent bus: `cat_game_agents_prompts.json`, `agent_outputs/*.prompt.md`
- Project docs: `MVP_SCOPE.md`, `ACCEPTANCE_CRITERIA.md`, `KNOWN_ISSUES.md`, `NEXT_UI_ASSET_SLICE_PLAN.md`, `ASSET_PIPELINE.md`, `ASSET_VISUAL_ACCEPTANCE.md`, `UI_COMPONENT_SPEC.md`
- Logs/evidence: `temp/asset-db/log/*`, `agent_reports/*.png`, `tmp/battle-verification-clean.png`

Progress document created:

- `docs/PROJECT_PROGRESS_PRIORITY_2026-05-28.md`

Changes made:

- `tools/verify_asset_pipeline_state.mjs`
  - Added a regression guard: if an active-batch artifact has a runtime `finalPath` on disk, the pipeline status cannot remain `candidate_spec_prepared`.
  - Added checks that promoted artifacts still have their runtime file and do not keep stale "not generated" notes.
- `assets/configs/asset_pipeline_state.json`
  - Promoted the generated/imported battle assets: `rt_bg_battle_forest_safe`, `rt_bg_battle_prepare_safe`, `rt_monster_ghost`, `rt_monster_skeleton`, `rt_monster_goblin`, `rt_fx_bullet`, `rt_fx_hit`, and `rt_fx_fire`.
- `assets/configs/runtime_asset_quality.json`
  - Reconciled `plannedMissing` so it tracks assets still absent from `assets/textures/runtime`.
  - Removed resolved temporary aliases for `rt_card_shop_product` and `rt_panel_dark`.
- `assets/configs/ui_asset_contract.json`
  - Mapped `panel_parchment_card`, `panel_dark_glass`, and `cat_hero_battle` to their promoted runtime files as current assets.
- `docs/KNOWN_ISSUES.md`
  - Downgraded the old stale-home-preview blocker as resolved/outdated. Current import-map evidence points `UISkeletonBuilder.ts` to the active `chunks/79/...` bundle.

Verification commands passed:

```powershell
npm.cmd run typecheck -- --pretty false
npm.cmd run verify:scene-flow
npm.cmd run verify:game-logic
npm.cmd run audit:runtime-asset-quality
npm.cmd run verify:ui-asset-contract
npm.cmd run verify:asset-generation-batch
npm.cmd run verify:asset-pipeline-state
npm.cmd run build:check
```

Current key numbers after reconciliation:

- Runtime PNG entries: 113
- Planned missing runtime assets: 0
- UI product keys: 44
- Current runtime ready: 44
- Final runtime ready: 44
- Temporary product mappings: 0

Next highest-priority development target:

- Capture fresh Cocos/browser screenshots for the affected login, home, backpack, popup/button, and shop surfaces, then prepare WeChat DevTools import and real-device checks.
