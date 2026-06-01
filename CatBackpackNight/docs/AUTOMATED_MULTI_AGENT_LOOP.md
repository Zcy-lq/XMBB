# Automated Multi-Agent Loop

This project is developed as a continuous multi-agent workflow. The final target is a polished commercial WeChat mini game, not a static demo or a literal screenshot clone.

## Product North Star

Core gameplay must remain:

- Fight waves at night.
- Earn rewards.
- Upgrade and merge backpack items.
- Grow pets and talents.
- Push to higher waves.

Reference images are visual references, not immutable requirements. Agents may improve layout, flow, art direction, economy, readability, or gameplay when a reference image is unclear, inconsistent, unpolished, or harmful to a commercial game experience. Any deviation must preserve the core loop and be recorded in QA or design docs.

## Source Documents

- Root multi-agent config: `C:/Users/User/Desktop/XMBB/cat_game_agents_prompts.json`
- Root dispatcher helper: `C:/Users/User/Desktop/XMBB/run_multi_agent.py`
- Current loop state: `assets/configs/asset_pipeline_state.json`
- UI asset contract: `assets/configs/ui_asset_contract.json`
- Runtime asset quality: `assets/configs/runtime_asset_quality.json`
- Active asset batch: `assets/configs/asset_generation_batch_p0.json`

## Agent Responsibilities

- `ProductAgent`: owns product scope, core loop, MVP boundary, commercial retention, economy, acceptance criteria, and gameplay changes that diverge from reference images.
- `UIUXAgent`: owns visual quality, screen flow, interaction ergonomics, layout, prefab/component expectations, and screenshot comparison judgments.
- `AssetAgent`: owns asset prompts, candidate generation, naming, alpha, nine-slice, slicing, atlas and bundle planning.
- `ClientArchAgent`: owns Cocos architecture, runtime loading, TypeScript structure, scene routing, UI binding, and integration of accepted assets.
- `CoreGameplayAgent`: owns battle, backpack, merge, pets, tasks, talents, shop logic, reward safety, and gameplay readability.
- `PlatformAgent`: owns WeChat platform capabilities, package size, cache/version strategy, ads, sharing, compliance, and platform fallbacks.
- `QAReleaseAgent`: owns verification commands, screenshots, visual comparison records, release checklist, known issues, and regression gates.

## Continuous Cycle

Each automation cycle follows this order unless a blocker requires systematic debugging:

1. `generate_candidates`
   - Primary: `AssetAgent`
   - Create or collect candidate images under `tmp/asset_candidates/...`.
   - Do not promote directly to `assets/textures/runtime`.

2. `asset_audit`
   - Primary: `AssetAgent`, `UIUXAgent`
   - Check prompt fit, alpha, dimensions, nine-slice suitability, visual style, naming, and whether the image is a real asset rather than a screenshot/test artifact.

3. `static_checks`
   - Primary: `ClientArchAgent`, `QAReleaseAgent`
   - Run runtime asset, UI contract, asset batch, pipeline state, and TypeScript checks.

4. `browser_screenshots`
   - Primary: `QAReleaseAgent`
   - Capture Cocos Browser Preview screenshots for affected screens.

5. `visual_compare`
   - Primary: `UIUXAgent`, `QAReleaseAgent`
   - Compare against reference intent and commercial quality, not pixel-perfect screenshot copying.

6. `promote_or_reject`
   - Primary: `AssetAgent`, `ClientArchAgent`, `QAReleaseAgent`
   - Accepted final PNGs move into `assets/textures/runtime`.
   - Rejected images stay in `tmp/asset_candidates/...` and receive failure notes.

7. `select_next_batch`
   - Primary: all agents as needed
   - If P0 art is complete, choose the next highest-risk slice: gameplay readability, shop/backpack polish, pet/talent systems, WeChat build/package, or QA defects.

## Mandatory Checks

Run after each promoted asset or code integration:

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

## Screenshot Gate

QA screenshots must be saved under `tmp/qa_*` and documented in `docs/QA_REPORT.md`.

Screenshots are never runtime assets. Any file under `tmp/`, `assets/textures/references/`, `temp/`, `library/`, or backup folders is development-only unless explicitly promoted through the asset audit flow.

## Commercial Quality Bar

Do not mark a slice complete unless:

- It is visually polished enough for a player-facing test.
- It has stable runtime keys and paths.
- It does not use reference screenshots or QA screenshots as runtime art.
- It passes static verification.
- A Cocos preview screenshot confirms it appears correctly.
- Gameplay and economy are not degraded by the change.
- Any reference-image deviation is explained and improves the product.

## Blocker Policy

If an automation cycle hits a blocker:

- Use systematic debugging.
- Identify the failed phase and responsible agent.
- Write the blocker into `docs/KNOWN_ISSUES.md` or `docs/QA_REPORT.md`.
- Keep the loop state in `asset_pipeline_state.json` accurate so the next cycle can resume.
