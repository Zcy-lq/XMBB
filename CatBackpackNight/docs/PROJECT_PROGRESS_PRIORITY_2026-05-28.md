# Project Progress And Priority - 2026-05-28

## Scope Checked

This review read the root project documents, agent prompts, project docs, QA logs, asset pipeline configs, runtime asset indexes, and current verification scripts.

Primary sources:

- Root docs: `docs/ARCHITECTURE_PLAN.md`, `docs/UI_DESIGN_TEMPLATE.md`, `docs/WECHAT_MINIGAME_STEP_BY_STEP.md`
- Agent bus: `cat_game_agents_prompts.json`, `agent_outputs/*.prompt.md`
- Project docs: `docs/GDD.md`, `docs/MVP_SCOPE.md`, `docs/ACCEPTANCE_CRITERIA.md`, `docs/QA_REPORT.md`, `docs/KNOWN_ISSUES.md`, `docs/NEXT_UI_ASSET_SLICE_PLAN.md`, `docs/ASSET_PIPELINE.md`, `docs/ASSET_VISUAL_ACCEPTANCE.md`, `docs/UI_COMPONENT_SPEC.md`
- Logs and evidence: `temp/asset-db/log/*`, `agent_reports/*.png`, `tmp/*qa*`, `tmp/battle-verification-clean.png`
- Runtime configs: `assets/configs/assets_runtime.json`, `assets/configs/runtime_asset_quality.json`, `assets/configs/asset_generation_batch_p0.json`, `assets/configs/asset_pipeline_state.json`, `assets/configs/ui_asset_contract.json`

## Current Verified State

2026-05-29 update: the five missing P0 shared runtime assets and the three P1 final visual runtime assets were generated, audited, promoted to `assets/textures/runtime`, indexed in `assets_runtime.json`, and mapped as current/final UI contract assets.

2026-05-29 text update: the home/login/runtime UI mojibake was repaired in visible player-facing text. `UISkeletonBuilder.ts`, `DefaultSave.ts`, `BattleSceneEntry.ts`, `levels.json`, `RouteConfig.ts`, `project.config.json`, and `package.json` now use readable Simplified Chinese for affected labels, toasts, chapter names, route titles, project metadata, and default save text. `tools/verify_scene_flow_guards.mjs` now fails if common UTF-8/GBK mojibake tokens, replacement characters, private-use corrupted characters, unreadable chapter/player defaults, or stale Cocos Browser Preview UI chunks reappear.

2026-05-30 preview-cache update: the running Cocos Browser Preview can keep stale internal `__unresolved_*` mappings even when the source import entry is refreshed. `tools/refresh_cocos_preview_ui_chunk.mjs` now rewrites every import-map value that points at an older mapped `UISkeletonBuilder` chunk, not only the source-file import. `tools/verify_scene_flow_guards.mjs` now scans all mapped preview chunks containing `UISkeletonBuilder` and battle UI code, so stale HP HUD/layout chunks are caught before screenshots are judged. Current local import-map target after the commercial UI route pass is `./chunks/codex/UISkeletonBuilder.72156f66933b48803945.js`.

2026-05-30 visual route update: fresh Cocos Browser Preview screenshots were captured for login, home, battle prepare, live battle, backpack, shop, pet, talent, daily task, mail, settings, merge, explore, guild, achievement, victory, and skill choice. The pass fixed the battle HP bar side-gutter spill, upgraded the pet page from empty-card presentation to visible portrait/list cards, and mapped core route panels/cards to runtime parchment/dark/card assets so task, mail, settings, merge, explore, guild, achievement, victory, and skill-choice pages no longer render as bare text on a dark background.

2026-05-30 commercial UI polish update: the secondary-route UI pass added a shared staged backdrop layer, rebuilt the talent page as a finished tree surface, rebuilt the reward page with concrete reward cards and summary/double-reward states, and upgraded skill-choice cards with rarity/type/reroll hierarchy. Final route screenshots are recorded in `docs/QA_REPORT.md`; the active refreshed preview UI chunk for this pass is `./chunks/codex/UISkeletonBuilder.72156f66933b48803945.js`.

The code foundation is no longer the main blocker. Fresh local checks in the current desktop environment used the bundled Node/Python runtimes because `npm.cmd`, `git`, and a local TypeScript compiler are not on PATH here. Current local checks pass:

- `node tools/validate_configs.js`
- `node tools/validate_assets.js`
- `node tools/audit_design_reference.mjs`
- `node tools/validate_handoffs.js --allow-missing`
- `node tools/verify_scene_flow_guards.mjs`
- `node tools/refresh_cocos_preview_ui_chunk.mjs` before route screenshot/guard checks when Cocos Browser Preview has regenerated the active UI chunk
- `node tools/verify_runtime_asset_index.mjs`
- `node tools/audit_runtime_asset_quality.mjs`
- `node tools/verify_ui_asset_contract.mjs`
- `node tools/verify_asset_generation_batch.mjs`
- `node tools/verify_asset_candidates.mjs` (passes with known older source-trace warnings)
- `node tools/verify_asset_pipeline_state.mjs`
- `node tools/build_check.js`
- `node --check tools/refresh_cocos_preview_ui_chunk.mjs`
- `node --check tools/capture_cocos_preview.mjs`
- `python -m unittest tests.test_multi_agent_workflow -v` from `D:/工作/XMBB`

Not rerun in this environment: `npm run typecheck` and `npm run verify:game-logic`, because they require `npm` packages (`typescript`, `tsx`) that are not installed/available locally.

Important numbers from the latest asset checks:

- Runtime PNG entries: 113
- Production candidates: 88
- Runtime placeholders: 23
- Temporary aliases: 0
- Decomposition targets: 2
- Planned missing runtime assets: 0
- UI product keys: 44
- Product keys with current runtime asset: 44
- Product keys with final runtime asset: 44
- Temporary product mappings: 0

## What Is Actually Working

### Core Gameplay

Status: high confidence for MVP logic.

The self-check covers battle start, unlimited development energy, battle completion, battle attack visuals, settlement idempotency, weapon merge, shop free-gold once, pet upgrade, talent upgrade, daily task idempotency, and no negative currency.

### Main Flow

Status: implemented with static route guards.

Login, home, battle prepare, battle, inventory, shop, pet, talent, task, achievement, mail, settings, victory, and defeat routes are represented in scripts and guarded by `tools/verify_scene_flow_guards.mjs`.

### Battle Page

Status: code and runtime assets are present, but documentation and pipeline state are stale.

Battle now has independent runtime files for:

- `rt_bg_battle_forest_safe`
- `rt_bg_battle_prepare_safe`
- `rt_cat_hero_battle`
- `rt_monster_ghost`
- `rt_monster_skeleton`
- `rt_monster_goblin`
- `rt_fx_bullet`
- `rt_fx_hit`
- `rt_fx_fire`
- `rt_fx_slash`
- `rt_fx_pierce`
- `rt_fx_magic_orb`

Static guards also check that the battle page consumes live session state, renders monsters, damage, weapon visuals, and does not rebuild the full screen every tick.

### Development Energy

Status: enabled as requested.

`levels.json` keeps `unlimitedEnergyInDevelopment: true`, and the scene-flow/game-logic gates cover this.

## Main Gaps

### P0-1: Progress State Was Out Of Sync

Problem: `asset_pipeline_state.json`, `runtime_asset_quality.json`, `QA_REPORT.md`, and `KNOWN_ISSUES.md` contained old statements from before battle assets were generated and imported.

Impact: Agents can repeat completed battle-asset work or chase a stale home-preview blocker instead of moving to the real remaining P0 gaps.

Status: fixed in this pass. `tools/verify_asset_pipeline_state.mjs` now fails if a runtime final PNG exists while the active-batch status still says it is only a prepared candidate spec.

### P0-2: Commercial UI Shared Assets

Status: completed on 2026-05-29.

- `rt_btn_icon_round`
- `rt_btn_red`
- `rt_icon_paw`
- `rt_icon_nav_backpack`
- `rt_item_weapon_fishbone_bow`

Impact: popups, close/back/settings buttons, bottom navigation, backpack iconography, and the bow weapon identity now have final runtime assets instead of null mappings or temporary aliases.

Recommended agents: `UIUXAgent`, then `QAReleaseAgent` for screenshot verification and any layout polish.

### P0-3: Popup And Shared Component Visual Layer Needs Completion

Status: completed for the current MVP route set on 2026-05-30.

Evidence: Browser Preview route screenshots now cover the affected settings, reward/victory, merge, mail, shop, skill-choice, pet, task, and exploration surfaces. `UISkeletonBuilder.ts` maps the shared panels, cards, buttons, pet/guild portraits, and route cards to runtime assets, and `tools/verify_scene_flow_guards.mjs` guards those mappings.

### P1-1: Remaining Runtime Placeholder Assets

Status: no current temporary alias or planned-missing runtime asset remains after the 2026-05-29 P1 promotion.

Promoted on 2026-05-29:

- `rt_bg_shop_village_safe`
- `rt_cat_hero_idle`
- `rt_cat_shop_hood`

Impact: shop, home/login hero identity, and NPC presentation now have final runtime targets. Some older runtimePlaceholder-classified support assets remain for later visual polish, but they no longer block final runtime coverage.

### P1-2: Cocos Editor And Device Visual Verification

Browser Preview screenshots now exist for the MVP route set. Release still needs Cocos Creator editor hierarchy checks, WeChat DevTools import, real-device performance verification, and production AppID/legal/ad configuration.

2026-05-30 build-probe note: a local Cocos Creator 3.8.8 command-line `wechatgame` build probe refreshed Cocos project logs but did not produce a `build/wechatgame` package. It also spawned duplicate Cocos/CocosDashboard processes that locked `temp/logs/project.log`; those processes were stopped and the log lock was released. Do not count that probe as WeChat build verification, and prefer the Cocos build panel / WeChat DevTools path until a stable exported build config exists.

### P2: Platform Production Setup

Real AppID, ad units, privacy URLs, cloud save, ranking, live ops, and payment-related production setup are intentionally after the main loop and commercial UI are stable.

## Immediate Work Order

1. Done: reconcile asset pipeline and stale docs so completed battle work is not repeated.
2. Done: generate and promote the five missing P0 shared assets.
3. Done: replace P0 null/temporary UI contract mappings and rerun asset contract gates.
4. Done: generate and promote P1 shop background, hero idle cat, and hooded shop cat.
5. Done: repair main-page/runtime Chinese text mojibake and add a static regression guard.
6. Done: refresh the active Cocos Browser Preview UI chunk so the current preview import-map no longer serves the old mojibake homepage bundle.
7. Done: re-verify login, home, battle prepare, battle, backpack, shop, pet, talent, task, mail, settings, merge, explore, guild, achievement, victory, and skill-choice route screenshots.
8. Done: commercial UI route polish pass for all MVP pages, including talent/reward/skill-choice hardening.
9. Next: prepare WeChat DevTools import, real-device verification, and production platform configuration.

## Current Agent Recommendation

Use agents in this order:

1. `QAReleaseAgent`: keep blockers honest, run full static/screenshot gates, and record WeChat/editor evidence.
2. `BuildAgent` / `PlatformAgent`: package and WeChat build checks, AppID/legal/ad setup, and bundle exclusion checks.
3. `UIUXAgent`: continue visual polish on lower-priority placeholder/decomposition assets after platform gates are unblocked.
4. `CoreGameplayAgent`: review weapon-specific attack feedback after the current UI route pass remains stable.
