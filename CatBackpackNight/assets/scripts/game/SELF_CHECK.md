# GameLogicAgent Self Check

Run or call `runGameLogicSelfCheck()` from `assets/scripts/game/GameLogicSelfCheck.ts`.

It validates the MVP logic path without UI:

- battle start spends energy and a ticked battle reaches victory or defeat
- settlement rewards are idempotent
- same-kind same-level weapon merge works
- daily free shop goods cannot be claimed twice
- pet upgrade spends material and increases level
- talent upgrade spends talent points
- daily task reward cannot be claimed twice
- currencies never go below zero

Scene/UI scripts should use `gameLogic` from `assets/scripts/game/GameLogicFacade.ts` for persisted operations.
