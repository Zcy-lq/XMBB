# QA_BLOCKERS

## P0 Blockers

- Launch acceptance matrix is not complete.
  - Evidence: `docs/RELEASE_ACCEPTANCE_MATRIX.md` still marks P0 items as `BLOCKED`, `UNVERIFIED`, or `PARTIAL`.
  - Owner Agent: QAReleaseAgent
  - Suggested Fix: Drive every P0 row in the release matrix to `PASS` with automated, Cocos, WeChat DevTools, screenshot, or device evidence.
  - Do Not Modify By QA: acceptance IDs or launch criteria just to reduce scope.
- The 22-page AI annotated design set has not been signed off against the implemented UI.
  - Evidence: `tools/verify_ui_design_parity.mjs` passes the 22-page reference audit, 8 static parity scripts, and 22 local portrait screenshots. Manual design sign-off and WeChat runtime screenshots are still not recorded.
  - Owner Agent: UIUXAgent
  - Suggested Fix: Maintain `docs/UI_DESIGN_PARITY_MATRIX.md`, compare every implemented screen against its matching design PNG, and keep the design audit locked to all 22 annotated references.
  - Do Not Modify By QA: visual requirements without a new design reference.
- WeChat DevTools import and preview evidence is missing.
  - Evidence: Cocos Creator 3.8.8 generated `build/wechatgame` on 2026-06-01 and `tools/verify_wechat_build_output.mjs` passed for required files, portrait orientation, `compileType: game`, and 4,969,185 bytes. WeChat DevTools `open`, `islogin`, `quit`, `auto --trust-project`, and `login --qr-output` CLI commands repeatedly timed out; no QR image, import screenshot, DevTools console log, or one-loop preview record is stored in the QA docs.
  - Owner Agent: PlatformAgent
  - Suggested Fix: Build the WeChat Mini Game target, import it into WeChat DevTools with the configured AppID or test AppID, then record screenshots/logs in `docs/QA_REPORT.md`.
  - Do Not Modify By QA: game logic or save data schemas unless DevTools exposes a concrete runtime error.
- Full launch gameplay loop is not proven through UI and WeChat runtime.
  - Evidence: `tools/verify_full_loop_acceptance.ts` covers 38 logic checks across agreement, first battle, victory/defeat settlement, duplicate reward blocking, backpack merge, failure no-mutation paths, selected pet/talent upgrades, task/activity/achievement claims, mail single/all claim/delete, shop free-good/paid/insufficient-resource paths, second battle, restart clone, settings persistence, and non-negative economy. `tools/verify_page_function_coverage.mjs` covers 25 routes, 22 screenshot-backed pages, and 25 key page function contracts. Cocos/WeChat UI runtime logs, device logs, and real storage restart proof are still missing.
  - Owner Agent: CoreGameplayAgent/QAReleaseAgent
  - Suggested Fix: Record a complete first-session loop from login agreement through home, battle prepare, battle, settlement claim, growth spend, task/mail claim, settings persistence, restart, and recovery.
  - Do Not Modify By QA: balancing constants unless a reproducible launch-blocking defect requires it.
- Selected-state UI actions for pet and talent still need runtime proof.
  - Evidence: pet upgrade/deploy and talent learn/reset now use selected UI/save state and are covered by `verify_scene_flow_guards`, but Cocos/WeChat runtime screenshots and save-delta proof are not recorded yet.
  - Owner Agent: CoreGameplayAgent/UIUXAgent
  - Suggested Fix: Verify selected pet upgrade/deploy and selected talent upgrade/reset in Cocos/WeChat, including insufficient-resource, prerequisite, max-level, and power-change states.
  - Do Not Modify By QA: save migrations unless the selected-state binding exposes a schema issue.

## P1 Issues

- Cocos Creator editor-side import/hierarchy verification is still required.
  - Evidence: Browser Preview route screenshots pass and Cocos Creator 3.8.8 command-line `wechatgame` build output now exists, but editor Console import errors and scene/prefab hierarchy have not been independently signed off in the Cocos Creator UI.
  - Owner Agent: QAReleaseAgent
  - Suggested Fix: Open the project in Cocos Creator 3.8.x, confirm clean Console output, and repair any missing script/component binding immediately.
  - Do Not Modify By QA: runtime asset mappings unless a screenshot shows the exact regression.
- WeChat DevTools import and preview are still required before calling the game release-ready.
  - Evidence: local Browser Preview is verified and 2026-06-01 Cocos command-line `wechatgame` build output is present. WeChat DevTools is installed and can launch, but CLI login/import automation was not usable from this environment, including QR-output login.
  - Owner Agent: PlatformAgent
  - Suggested Fix: Build the WeChat Mini Game target, import it into WeChat DevTools with the configured AppID or test AppID, then record screenshots/logs in `docs/QA_REPORT.md`.
  - Do Not Modify By QA: game logic or save data schemas unless DevTools exposes a concrete runtime error.
- Real-device smoke and performance checks are still required.
  - Evidence: FPS, memory, touch responsiveness, and package-size behavior are not measured on a physical device.
  - Owner Agent: QAReleaseAgent
  - Suggested Fix: Run the latest WeChat preview on a target phone and record results against `docs/PERFORMANCE_CHECKLIST.md`.
  - Do Not Modify By QA: balancing constants unless device evidence shows a gameplay-affecting issue.

## P2 Issues

- Real WeChat AppID, ad unit IDs, privacy URL, agreement URL, and final legal text remain release-ops inputs.
  - Evidence: platform service mocks exist, but production credentials/legal URLs are not configured in this workspace.
  - Owner Agent: PlatformAgent
  - Suggested Fix: Configure only after the official mini-game account and legal URLs are available.
  - Do Not Modify By QA: mock service fallback behavior.

## P3 Issues

- None currently recorded by this protocol update.

## Entry Format

- Issue:
- Evidence:
- Owner Agent:
- Suggested Fix:
- Do Not Modify By QA:
