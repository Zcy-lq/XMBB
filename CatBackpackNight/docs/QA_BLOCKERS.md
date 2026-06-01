# QA_BLOCKERS

## P0 Blockers

- None active after the 2026-05-30 Browser Preview route pass and preview-cache guard refresh.

## P1 Issues

- Cocos Creator editor-side import/hierarchy verification is still required.
  - Evidence: Browser Preview route screenshots pass, but editor Console import errors and scene/prefab hierarchy have not been independently signed off in the Cocos Creator UI.
  - Owner Agent: QAReleaseAgent
  - Suggested Fix: Open the project in Cocos Creator 3.8.x, confirm clean Console output, and repair any missing script/component binding immediately.
  - Do Not Modify By QA: runtime asset mappings unless a screenshot shows the exact regression.
- WeChat DevTools import and preview are still required before calling the game release-ready.
  - Evidence: local Browser Preview is verified. A 2026-05-30 Cocos command-line `wechatgame` build probe refreshed Cocos logs but produced no `build/wechatgame` output, spawned duplicate Cocos processes that locked `temp/logs/project.log`, and WeChat DevTools CLI was not found on this machine.
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
