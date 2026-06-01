# UI Screenshot Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Compare the live Cocos WeChat mini-game UI against the generated design boards from login onward, fix mismatches directly, and verify phone portrait adaptation.

**Architecture:** Use the existing Cocos preview plus CDP screenshot tooling as the source of truth for live pages. First make the screenshot tool capture the actual portrait game canvas without browser debug chrome, then use route-by-route screenshots and guard scripts to drive focused UI changes in `UISkeletonBuilder.ts`.

**Tech Stack:** Cocos Creator 3.8 TypeScript, Node.js CDP tools, PowerShell, PNG screenshot inspection.

---

### Task 1: Make Phone Canvas Screenshots Reproducible

**Files:**
- Modify: `D:\工作\XMBB\CatBackpackNight\tools\capture_cocos_preview.mjs`
- Create: `D:\工作\XMBB\CatBackpackNight\tools\verify_capture_phone_canvas.mjs`

- [ ] **Step 1: Write failing screenshot-tool test**

```js
import fs from 'node:fs';
import assert from 'node:assert/strict';

const source = fs.readFileSync(new URL('./capture_cocos_preview.mjs', import.meta.url), 'utf8');

assert.match(source, /phone-canvas/, 'capture tool should expose a phone-canvas mode');
assert.match(source, /captureCanvasOnly/, 'capture tool should crop to the Cocos canvas');
assert.match(source, /hidePreviewChrome/, 'capture tool should hide Cocos preview browser chrome');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tools/verify_capture_phone_canvas.mjs`

Expected: FAIL because the current capture script only captures the full browser page.

- [ ] **Step 3: Implement phone-canvas capture**

Add `--phone-canvas=true`, hide preview chrome, auto-rotate to portrait if needed, compute the canvas bounding box, and pass a `clip` to `Page.captureScreenshot`.

- [ ] **Step 4: Run test and capture login**

Run: `node tools/verify_capture_phone_canvas.mjs`

Expected: PASS.

Run: `node tools/capture_cocos_preview.mjs --url=http://127.0.0.1:7456?screen=login --out=tmp/current_login_phone.png --width=750 --height=1334 --phone-canvas=true --wait-ms=5000`

Expected: PNG is a clean portrait game screenshot without browser toolbar or FPS overlay.

### Task 2: Fix Login Screen Parity

**Files:**
- Modify: `D:\工作\XMBB\CatBackpackNight\assets\scripts\ui\UISkeletonBuilder.ts`
- Test: `D:\工作\XMBB\CatBackpackNight\tools\verify_login_design_parity.mjs`

- [ ] **Step 1: Write failing login parity test**

Assert required login nodes, positions, and sprite mappings: logo top, visible hero cat/scene art, start button above agreement, agreement and CADPA visible, health notice safe bottom.

- [ ] **Step 2: Run test to verify it fails**

Expected: FAIL if hero cat or safe-bottom structure does not match the design.

- [ ] **Step 3: Fix login layout**

Update `buildLogin()` positions and ensure scene art layers match the design board while preserving agreement gating.

- [ ] **Step 4: Verify login**

Run login parity test, refresh preview UI chunk, capture `current_login_phone.png`, and visually compare against `01_LOGIN_登录页.png`.

### Task 3: Continue Route-By-Route

**Files:**
- Modify: `D:\工作\XMBB\CatBackpackNight\assets\scripts\ui\UISkeletonBuilder.ts`
- Test: existing design/reference and scene-flow guard scripts plus new focused route checks if needed.

- [ ] **Step 1: Capture home after login**

Use phone-canvas mode with agreement clicks or direct `?screen=home`.

- [ ] **Step 2: Compare and fix visible deltas**

Fix layout, safe areas, text overlap, and missing modal/page components in order: home, battle prepare, battle, modals, systems pages.

- [ ] **Step 3: Verify each route**

Capture each changed route at `750x1334`, and at one tall phone viewport and one short phone viewport.

### Task 4: Final Verification

**Files:**
- Use package validation scripts and screenshot captures.

- [ ] **Step 1: Run guard scripts directly with bundled Node**

Run design-reference and scene-flow guard scripts through the bundled Node executable.

- [ ] **Step 2: Run TypeScript/type validation if npm tooling is available**

Use the local npm CLI through the bundled Node runtime when possible.

- [ ] **Step 3: Report exact pages fixed and remaining gaps**

Include screenshot paths and commands run.
