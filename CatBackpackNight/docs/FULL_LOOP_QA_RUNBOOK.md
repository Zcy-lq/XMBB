# Full Loop QA Runbook

This runbook is the P0 launch proof path for the WeChat mini game. Do not mark the full loop as `PASS` until every step has a recorded result and evidence.

## Required Route

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

## Automated Evidence

The pure TypeScript full-loop gate covers the launch logic path without the Cocos or WeChat runtime:

```powershell
$node = 'C:\Users\Administrator\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
cd CatBackpackNight
& $node '..\.tools\npm-cache\_npx\fd45a72a545557e9\node_modules\tsx\dist\cli.mjs' tools/verify_full_loop_acceptance.ts
```

Expected: `[full-loop-acceptance] {"passed":true,"checks":30,"failed":0}`.

This automated gate is required, but it does not replace Cocos/WeChat screenshots, storage restart evidence, or real-device performance evidence.

## Evidence Table

| Step | Result | Screenshot/Log | Notes |
| --- | --- | --- | --- |
| 1. Clear local save | UNVERIFIED |  | Record whether `SaveManager.reset()` or WeChat storage clear was used. |
| 2. Launch login | UNVERIFIED |  | Capture first visible login screen. |
| 3. Start without agreement | UNVERIFIED |  | Toast must appear and route must stay on login. |
| 4. Accept agreement and enter home | UNVERIFIED |  | Agreement state must persist in save. |
| 5. Open battle prepare | UNVERIFIED |  | Home start/nav must route to battle prepare. |
| 6. Start battle | UNVERIFIED |  | Energy cost and battle id must be recorded. |
| 7. Reach victory | UNVERIFIED |  | Record battle result, wave, and reward id. |
| 8. Claim reward once | UNVERIFIED |  | Currency/inventory delta must match reward. |
| 9. Fast-click claim again | UNVERIFIED |  | Claimed reward id must prevent duplicate grant. |
| 10. Backpack merge | UNVERIFIED |  | Inventory before/after must show consumed inputs and created output. |
| 11. Pet or talent upgrade | UNVERIFIED |  | Selected pet/talent id, cost, and save delta must be recorded. |
| 12. Confirm power/damage changed | UNVERIFIED |  | Battle prepare power or battle damage must reflect growth. |
| 13. Start second battle | UNVERIFIED |  | Second battle must start from updated save. |
| 14. Restart and restore save | UNVERIFIED |  | Agreement, rewards, merge, pet/talent, and currency must persist. |

## Pre-Run Static Gate

Run these before starting manual Cocos/WeChat verification:

```powershell
$node = 'C:\Users\Administrator\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
cd CatBackpackNight
& $node tools/validate_configs.js
& $node tools/validate_assets.js
& $node tools/verify_scene_flow_guards.mjs
& $node tools/build_check.js
& $node '..\.tools\npm-cache\_npx\fd45a72a545557e9\node_modules\tsx\dist\cli.mjs' tools/verify_game_logic_self_check.ts
& $node '..\.tools\npm-cache\_npx\fd45a72a545557e9\node_modules\tsx\dist\cli.mjs' tools/verify_full_loop_acceptance.ts
```

Expected: every command exits `0`.

## Post-Build WeChat Output Gate

After running the Cocos WeChat Mini Game build, verify the generated package before importing it into WeChat DevTools:

```powershell
$node = 'C:\Users\Administrator\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
cd CatBackpackNight
& $node tools/verify_wechat_build_output.mjs
```

Expected: `[wechat-build-output] PASS`.

## Current P0 Runtime Gaps

- WeChat DevTools import and preview evidence is not recorded.
- Full battle victory/reward claim has automated logic coverage but no current Cocos/WeChat screenshot/log evidence.
- Pet/talent selected-state binding has static and full-loop coverage, but no Cocos/WeChat save-delta evidence yet.
- Restart/save restore has automated clone-save coverage, but no real Cocos/WeChat storage restart proof is recorded.
