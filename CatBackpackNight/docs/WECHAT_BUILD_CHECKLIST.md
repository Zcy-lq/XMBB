# WeChat Build Checklist

## Before Build

- `assets/configs/platform.json` exists.
- `reviewMode` is explicitly configured.
- AppID and ad unit IDs are not hard-coded in TypeScript.
- Runtime asset configs exclude development reference images.
- Bundle and remote resource versions are documented.

## Cocos Build

- Target platform: WeChat Mini Game.
- Main package target is documented.
- Subpackage or remote resource strategy is documented.
- Build output has no missing asset errors.

## WeChat DevTools

- Import build output.
- Confirm launch screen appears.
- Confirm mock/fallback platform calls do not crash.
- Confirm privacy and agreement entries are accessible.
- Confirm one basic play loop reaches settlement.

## Submission

- `docs/QA_BLOCKERS.md` has no P0 entries.
- P1 entries have Owner Agent and repair plan.
- `docs/WECHAT_RELEASE_COMPLIANCE.md` is current.
- Any unverified editor/devtools/real-device claims are explicitly marked UNVERIFIED.
