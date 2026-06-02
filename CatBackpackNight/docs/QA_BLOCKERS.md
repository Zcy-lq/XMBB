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
  - Evidence: Cocos Creator 3.8.8 generated `build/wechatgame` and `tools/verify_wechat_build_output.mjs` passed for required files, portrait orientation, `compileType: game`, and 4,969,185 bytes. On 2026-06-02 the WeChat DevTools CLI service port was reachable enough for `islogin --port 9420` to return `{"login":false}`, but `login --qr-output tmp/wechat_cli_login_qr.png --port 9420` timed out without producing a QR image. No QR image, import screenshot, DevTools console log, or one-loop preview record is stored in the QA docs. `tools/verify_launch_evidence.mjs` now emits `BLOCKED_EVIDENCE launch_evidence.json` and final mode fails until this evidence is recorded.
  - Owner Agent: PlatformAgent
  - Suggested Fix: Log in manually in WeChat DevTools, import `build/wechatgame` with the configured AppID or test AppID, then record screenshots/logs in `docs/launch_evidence/launch_evidence.json`.
  - Do Not Modify By QA: game logic or save data schemas unless DevTools exposes a concrete runtime error.
- Full launch gameplay loop is not proven through UI and WeChat runtime.
  - Evidence: `tools/verify_full_loop_acceptance.ts` covers 75 logic checks across agreement, first battle, release-mode energy spend/insufficient-energy safety, pause/resume, auto-merge toggle state, skill choice application/duplicate blocking, victory/defeat settlement, key-wave first-clear rewards, rewarded-video double reward success/duplicate/cancel safety, backpack merge, open chest success/failure safety, selected pet upgrade/deploy, selected talent upgrade/reset/max-level blocking, battle-prep power/weapon preview, task/activity/achievement single/all claims, config-backed red dots, mail red-dot reduction, mail single/all claim/delete, shop free-good/paid/refresh/special-placeholder daily limits, exploration daily reward and duplicate/insufficient-energy safety, guild check-in/help daily reward and duplicate safety, unlocked wave selection and locked-wave no-mutation, energy recovery, daily reset, second battle, restart clone, settings persistence, and non-negative economy. `tools/verify_page_function_coverage.mjs` covers 25 routes, 22 screenshot-backed pages, and 25 key page function contracts. Cocos/WeChat UI runtime logs, device logs, and real storage restart proof are still missing.
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
  - Evidence: local Browser Preview is verified and fresh Cocos command-line `wechatgame` build output is present. WeChat DevTools is installed and can launch, but CLI login/import automation is still not enough from this environment because login remains false and QR-output login timed out.
  - Owner Agent: PlatformAgent
  - Suggested Fix: Complete manual DevTools login/import/preview and record screenshots/logs in `docs/launch_evidence/launch_evidence.json`.
  - Do Not Modify By QA: game logic or save data schemas unless DevTools exposes a concrete runtime error.
- Real-device smoke and performance checks are still required.
  - Evidence: FPS, memory, touch responsiveness, and package-size behavior are not measured on a physical device. `tools/verify_launch_evidence.mjs` requires Android, iOS, and performance smoke evidence in final mode.
  - Owner Agent: QAReleaseAgent
  - Suggested Fix: Run the latest WeChat preview on a target phone and record results against `docs/PERFORMANCE_CHECKLIST.md`.
  - Do Not Modify By QA: balancing constants unless device evidence shows a gameplay-affecting issue.

## P2 Issues

- Real WeChat AppID, privacy URL, agreement URL, and optional production ad unit IDs remain release-ops inputs.
  - Evidence: `tools/verify_release_compliance.mjs` passes the code/config compliance gate but emits `BLOCKED_INPUT` rows for `wechat.appid`, `wechat.privacyPolicyUrl`, and `wechat.userAgreementUrl`. Ads stay disabled while `reviewMode=true`; production ad unit IDs are required before live monetization is enabled.
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
