# P0 Runtime Assets Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the current P0 runtime asset gap so the commercial UI can stop using null mappings and temporary aliases for shared buttons, paw iconography, backpack navigation, and the fishbone bow item.

**Architecture:** Generate five transparent runtime PNGs through the existing asset candidate workflow, promote them to `assets/textures/runtime`, regenerate the runtime index, and update asset contract/state documents so UI resolution prefers the final assets. Keep generated sources in `tmp/asset_candidates/.../_sources` for traceability.

**Tech Stack:** Cocos Creator 3.8 TypeScript project, JSON asset contracts, PowerShell/System.Drawing import helper, Node verification scripts.

---

### Task 1: Promote Five P0 Shared Assets

**Files:**
- Modify: `CatBackpackNight/tools/import_p0_shared_assets.ps1`
- Create: `CatBackpackNight/assets/textures/runtime/rt_btn_icon_round.png`
- Create: `CatBackpackNight/assets/textures/runtime/rt_btn_red.png`
- Create: `CatBackpackNight/assets/textures/runtime/rt_icon_paw.png`
- Create: `CatBackpackNight/assets/textures/runtime/rt_icon_nav_backpack.png`
- Create: `CatBackpackNight/assets/textures/runtime/rt_item_weapon_fishbone_bow.png`
- Create: `CatBackpackNight/tmp/asset_candidates/assetagent_p0_runtime_gap_20260524/*.png`
- Create: `CatBackpackNight/tmp/asset_candidates/assetagent_p0_runtime_gap_20260524/_sources/*.png`

- [x] Generate five source images with a flat chroma-key background using the built-in image generation tool.
- [x] Fix `import_p0_shared_assets.ps1` so its `param` block is valid and the generated source directory is configurable.
- [x] Run the import helper to remove green backgrounds, resize assets to the batch sizes, and copy final PNGs into runtime.
- [x] Verify candidates with `node tools/verify_asset_candidates.mjs`.

### Task 2: Make Runtime Contracts Prefer Final Assets

**Files:**
- Modify: `CatBackpackNight/assets/configs/assets_runtime.json`
- Modify: `CatBackpackNight/assets/configs/ui_asset_contract.json`
- Modify: `CatBackpackNight/assets/configs/runtime_asset_quality.json`
- Modify: `CatBackpackNight/assets/configs/asset_pipeline_state.json`
- Modify: `CatBackpackNight/assets/scripts/ui/RuntimeSpriteAssets.ts`

- [x] Regenerate `assets_runtime.json` so the five new runtime PNGs are indexed.
- [x] Set `currentRuntimeId` to the new final runtime IDs for `btn_red`, `btn_icon_round`, `icon_paw`, `icon_nav_backpack`, and `weapon_fishbone_bow`.
- [x] Remove the five P0 IDs from `runtime_asset_quality.plannedMissing`.
- [x] Mark the five P0 IDs as promoted in `asset_pipeline_state.json`, including candidate/source/final paths.
- [x] Add the five IDs to `RuntimeSpriteAssets.ts` so `resolveUIRuntimeSpriteKey()` can return them and `RuntimeSpriteLoader` can fall back to path loading.

### Task 3: Verify P0 Gates

**Files:**
- Modify: `CatBackpackNight/docs/PROJECT_PROGRESS_PRIORITY_2026-05-28.md`
- Modify: `CatBackpackNight/docs/KNOWN_ISSUES.md`
- Modify: `CatBackpackNight/docs/QA_REPORT.md`

- [x] Run `node tools/generate_runtime_asset_index.mjs`.
- [x] Run `node tools/verify_runtime_asset_index.mjs`.
- [x] Run `node tools/audit_runtime_asset_quality.mjs`.
- [x] Run `node tools/verify_ui_asset_contract.mjs`.
- [x] Run `node tools/verify_asset_generation_batch.mjs`.
- [x] Run `node tools/verify_asset_candidates.mjs`.
- [x] Run `node tools/verify_asset_pipeline_state.mjs`.
- [ ] Update the priority, known-issues, and QA docs to record that the five P0 shared assets are promoted.

### Self-Review

- The plan covers the current explicit P0 asset gap from `PROJECT_PROGRESS_PRIORITY_2026-05-28.md`.
- It avoids deleting docs during the P0 asset pass; document cleanup must happen after verification and reference audit.
- It does not claim Cocos Editor, WeChat DevTools, or real-device verification.
