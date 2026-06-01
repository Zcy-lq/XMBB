# WeChat Launch MVP Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring `CatBackpackNight` from static/browser-preview MVP coverage to WeChat mini game launch readiness: complete logic loop, no missing page functions, and visual parity with the 22 annotated AI design pages.

**Architecture:** Treat launch readiness as four hard gates: functional acceptance, full-page interaction binding, 22-page visual parity, and WeChat/device release verification. Existing game systems stay centered on `GameLogicFacade`, `SaveManager`, `UISkeletonBuilder`, route scene entries, and the current JSON configs; add verification docs/scripts before feature edits so missing work is visible and repeatable.

**Tech Stack:** Cocos Creator 3.8.x, TypeScript, WeChat Mini Game target, Node.js verification scripts, Python multi-agent workflow tests, Browser Preview screenshots, manual WeChat DevTools and real-device evidence.

---

## Priority Verdict

The current project priority is only partly correct.

Current docs say the next priority is Cocos Editor, WeChat DevTools, and real-device verification. That is correct for proving the current build can run, but it is not enough for the user's launch standard. Before calling this game ready for WeChat上线, the priority must be changed to:

1. P0: every AC P0 item in `CatBackpackNight/docs/ACCEPTANCE_CRITERIA.md` must have either automated evidence or manual recorded evidence.
2. P0: the core loop must work end to end: login -> home -> battle prepare -> battle -> settlement -> reward claim -> backpack merge -> pet or talent growth -> second battle.
3. P0: every visible page button must be either functional, disabled with a clear state, or explicitly removed from the MVP route; no fake sample ID actions are allowed.
4. P0: the UI must be checked against `设计图_AI全页面2K标注版/01...22...png`, not only the older `设计图/` folder.
5. P0: WeChat DevTools import/preview must pass with a recorded build output.
6. P1: real-device performance, safe-area, memory, and weak-network behavior must be recorded before release.

## Known Missing Work

- `tools/audit_design_reference.mjs` checks the older `设计图/` directory, not the 22-page AI annotated design folder.
- `CatBackpackNight/tmp/final_mobile_pages_after_ui_pass/` has 22 latest screenshots, but there is no strict design-vs-current parity matrix.
- `UISkeletonBuilder.ts` still contains some direct fixed actions such as upgrading `pet_black_cat` and learning `attack_power_01`; launch UI should act on selected UI state.
- WeChat production config is still placeholder: AppID, legal URLs, ad unit IDs, and `reviewMode` release policy are not final.
- Cocos Creator editor-side import/hierarchy verification is unrecorded after cleanup.
- WeChat DevTools import/preview is unrecorded.
- Real-device FPS, memory, safe-area, and touch responsiveness are unrecorded.
- `npm run typecheck` and `npm run verify:game-logic` were not run in this environment because `npm` is unavailable on PATH; use bundled Node/npm or install a project-local npm path before treating TypeScript checks as signed off.

---

### Task 1: Build The Release Acceptance Matrix

**Files:**
- Create: `CatBackpackNight/docs/RELEASE_ACCEPTANCE_MATRIX.md`
- Modify: `CatBackpackNight/docs/QA_BLOCKERS.md`

- [ ] **Step 1: Create the matrix document**

Create `CatBackpackNight/docs/RELEASE_ACCEPTANCE_MATRIX.md` with these columns:

```markdown
| AC ID | Priority | Area | Status | Evidence | Owner | Next Action |
| --- | --- | --- | --- | --- | --- | --- |
| AC-001 | P0 | WeChat import | BLOCKED | No WeChat DevTools import evidence recorded | PlatformAgent | Build WeChat target and import in DevTools |
| AC-002 | P0 | Startup | UNVERIFIED | Browser Preview exists; WeChat startup not recorded | QAReleaseAgent | Record launch screenshot/log in Cocos and WeChat |
| AC-010 | P0 | Agreement gate | UNVERIFIED | UI code has agreement gate; no fresh manual evidence | QAReleaseAgent | Verify unchecked start blocks login |
| AC-040 | P0 | Battle auto attack | PARTIAL | GameLogicSelfCheck covers battle session; no device evidence | CoreGameplayAgent | Run runtime battle and record settlement |
| AC-050 | P0 | Reward claim | PARTIAL | Settlement idempotency self-check exists; UI path evidence missing | CoreGameplayAgent | Verify victory confirm grants once through UI |
| AC-123 | P0 | Save restore | UNVERIFIED | SaveManager exists; restart evidence missing | QAReleaseAgent | Restart after reward/merge/pet upgrade |
| AC-140 | P1 | Safe-area UI | UNVERIFIED | Browser screenshot only | QAReleaseAgent/UIUXAgent | Check common aspect ratios and phones |
```

Then add every AC section from `ACCEPTANCE_CRITERIA.md`. Mark only items with fresh evidence as `PASS`; use `PARTIAL` for static-only evidence and `UNVERIFIED` for anything not run.

- [ ] **Step 2: Promote current blockers**

In `CatBackpackNight/docs/QA_BLOCKERS.md`, keep the existing P1 editor/devtools/device items, then add P0 blockers until proven:

```markdown
- UI launch acceptance matrix is not complete.
- 22-page AI design parity has not been signed off.
- WeChat DevTools import and one-loop preview are not recorded.
```

- [ ] **Step 3: Verify the matrix is referenced**

Run:

```powershell
rg -n "RELEASE_ACCEPTANCE_MATRIX|AC-001|AC-050|AC-123" CatBackpackNight/docs
```

Expected: the new matrix and QA blockers both appear in the search results.

---

### Task 2: Add A Design Parity Gate For The 22 AI Pages

**Files:**
- Create: `CatBackpackNight/docs/UI_DESIGN_PARITY_MATRIX.md`
- Modify: `CatBackpackNight/tools/audit_design_reference.mjs`
- Reference folders: `设计图_AI全页面2K标注版/`, `CatBackpackNight/tmp/final_mobile_pages_after_ui_pass/`

- [ ] **Step 1: Write the parity matrix**

Create `CatBackpackNight/docs/UI_DESIGN_PARITY_MATRIX.md` with one row per page:

```markdown
| Page | Design Reference | Latest Screenshot | Status | Required Fix |
| --- | --- | --- | --- | --- |
| 01 Login | `设计图_AI全页面2K标注版/01_LOGIN_登录页.png` | `tmp/final_mobile_pages_after_ui_pass/01_login.png` | REVIEW_REQUIRED | Compare logo, cat/camp art, agreement, 16+ badge, health notice |
| 02 Home | `设计图_AI全页面2K标注版/02_HOME_主页.png` | `tmp/final_mobile_pages_after_ui_pass/02_home.png` | REVIEW_REQUIRED | Compare top resources, feature rails, stage selector, nav, start CTA |
```

Continue through page 22. Status values allowed: `PASS`, `FIX_REQUIRED`, `REVIEW_REQUIRED`, `MISSING_SCREENSHOT`.

- [ ] **Step 2: Update the audit script input directory**

Change `CatBackpackNight/tools/audit_design_reference.mjs` so it counts and validates `设计图_AI全页面2K标注版/` as the primary reference folder. Keep the older `设计图/` folder as secondary legacy references.

Required checks:

```javascript
const annotatedDesignDir = path.join(workspaceRoot, '设计图_AI全页面2K标注版');
const expectedPageCount = 22;
```

Fail if fewer than 22 annotated page PNGs exist.

- [ ] **Step 3: Verify the new design gate**

Run:

```powershell
$node = 'C:\Users\Administrator\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
cd CatBackpackNight
& $node tools/audit_design_reference.mjs
```

Expected: PASS only when 22 annotated design pages are detected and current UI tokens still satisfy login/home/secondary contracts.

---

### Task 3: Make Every Visible Page Action Real Or Explicitly Disabled

**Files:**
- Modify: `CatBackpackNight/assets/scripts/ui/UISkeletonBuilder.ts`
- Modify as needed: `CatBackpackNight/assets/scripts/game/GameLogicFacade.ts`
- Verify: `CatBackpackNight/tools/verify_scene_flow_guards.mjs`

- [ ] **Step 1: Inventory every button action**

Run:

```powershell
rg -n "addButton\\(|Button_|handleButtonAction|getRouteForButton" CatBackpackNight/assets/scripts/ui/UISkeletonBuilder.ts
```

Record each visible `Button_` in `CatBackpackNight/docs/RELEASE_ACCEPTANCE_MATRIX.md` under the relevant AC item.

- [ ] **Step 2: Replace fixed sample actions**

Fix direct hard-coded actions:

```typescript
gameLogic.upgradePet('pet_black_cat')
gameLogic.deployPet('pet_black_cat')
gameLogic.upgradeTalent('attack_power_01')
```

Required behavior:

- Pet buttons use the selected pet from UI state or current save selection.
- Talent buttons use the selected node from UI state.
- Shop buttons map to the actual goods card rendered.
- Mail/detail actions use the selected mail row or drawer target.
- Locked or unavailable actions show a clear disabled state and toast without changing save data.

- [ ] **Step 3: Add guard coverage**

Update `verify_scene_flow_guards.mjs` to fail if launch-critical buttons call fixed sample IDs for pet/talent/shop/mail actions.

Run:

```powershell
$node = 'C:\Users\Administrator\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
cd CatBackpackNight
& $node tools/verify_scene_flow_guards.mjs
```

Expected: exit 0, with no fixed sample action failures.

---

### Task 4: Prove The Full Logic Loop Through UI

**Files:**
- Create: `CatBackpackNight/docs/FULL_LOOP_QA_RUNBOOK.md`
- Modify as needed after failures: scene entries, UI action handlers, game logic systems.

- [ ] **Step 1: Write the runbook**

Create a runbook with this exact route:

```markdown
1. Clear local save.
2. Launch login.
3. Try start without agreement; expect toast and no route change.
4. Accept agreement and enter home.
5. Open battle prepare from home.
6. Start battle.
7. Wait for victory or force one controlled victory in debug build.
8. Claim reward once.
9. Fast-click claim again; expect no duplicate reward.
10. Open backpack and merge two same-level weapons.
11. Open pet or talent and perform one upgrade.
12. Return to battle prepare and confirm power/damage changed.
13. Start second battle.
14. Restart app and confirm save state persists.
```

- [ ] **Step 2: Add evidence rows**

For every step, record:

```markdown
| Step | Result | Screenshot/Log | Notes |
| --- | --- | --- | --- |
```

- [ ] **Step 3: Verify current static gates before manual run**

Run:

```powershell
$node = 'C:\Users\Administrator\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
cd CatBackpackNight
& $node tools/validate_configs.js
& $node tools/validate_assets.js
& $node tools/verify_scene_flow_guards.mjs
& $node tools/build_check.js
```

Expected: all commands exit 0 before starting manual Cocos/WeChat verification.

---

### Task 5: WeChat Build And DevTools Verification

**Files:**
- Modify: `CatBackpackNight/assets/configs/platform.json`
- Update: `CatBackpackNight/docs/WECHAT_BUILD_CHECKLIST.md`
- Update: `CatBackpackNight/docs/WECHAT_RELEASE_COMPLIANCE.md`
- Update: `CatBackpackNight/docs/QA_REPORT.md`

- [ ] **Step 1: Configure release inputs**

Before release candidate build, replace placeholders in `platform.json` through private build settings or a non-committed release config:

```json
"appid": "__CONFIGURE_IN_PRIVATE_BUILD_SETTINGS__",
"privacyPolicyUrl": "__CONFIGURE_BEFORE_RELEASE__",
"userAgreementUrl": "__CONFIGURE_BEFORE_RELEASE__",
"rewardedVideoUnitId": "__CONFIGURE_BEFORE_RELEASE__"
```

Do not commit secrets or AppSecret.

- [ ] **Step 2: Build WeChat Mini Game target**

Use Cocos Creator 3.8.x Build panel:

```text
Platform: WeChat Mini Game
Build output: CatBackpackNight/build/wechatgame
```

Expected: build output exists and has no missing asset errors.

- [ ] **Step 3: Import into WeChat DevTools**

Record:

```markdown
- DevTools version:
- AppID used:
- Import result:
- Console errors:
- Launch screenshot:
- One-loop result:
```

If DevTools fails, add a P0 item to `QA_BLOCKERS.md` with exact console text.

---

### Task 6: Real Device And Performance Verification

**Files:**
- Update: `CatBackpackNight/docs/PERFORMANCE_CHECKLIST.md`
- Update: `CatBackpackNight/docs/QA_REPORT.md`

- [ ] **Step 1: Test device matrix**

Record at least:

```markdown
| Device | OS | WeChat Version | Result |
| --- | --- | --- | --- |
| Low-end Android | Android version | WeChat version | UNVERIFIED |
| iPhone | iOS version | WeChat version | UNVERIFIED |
```

- [ ] **Step 2: Verify release-critical performance**

Required checks:

- Login/home/battle routes do not white-screen.
- Battle with multiple monsters and damage numbers remains responsive.
- Safe area does not cover bottom nav, start battle, claim, close, or ad buttons.
- Re-entering battle repeatedly does not crash.
- Power-saving setting changes saved state and reduces effects or update pressure.

- [ ] **Step 3: Update blocker status**

Only remove device P1 blocker from `QA_BLOCKERS.md` after evidence rows and screenshots/logs are recorded.

---

## Execution Order

1. Task 1: Acceptance matrix.
2. Task 2: 22-page design parity gate.
3. Task 3: real/disabled actions for every visible button.
4. Task 4: full UI loop proof.
5. Task 5: WeChat build and DevTools.
6. Task 6: real-device verification.

Do not move a task to `PASS` based only on source inspection. Every release claim needs fresh command output, screenshot evidence, or recorded manual QA evidence.
