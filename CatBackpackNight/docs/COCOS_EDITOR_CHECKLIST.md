# Cocos Editor Checklist

Use this checklist whenever an Agent changes scenes, prefabs, scripts, assets, bundles, or build settings.

## Open Project

- Open `D:/工作/XMBB/CatBackpackNight` in Cocos Creator 3.8.x.
- Confirm the project opens without import errors.
- Confirm no Agent claims Cocos Editor verification unless the editor was actually opened.

## Script Compile

- Run `npm run typecheck`.
- In Cocos Creator, confirm script compilation finishes without red console errors.

## Resource Import

- Confirm new textures have matching `.meta` files after editor import.
- Do not delete `.meta` files manually.
- Confirm `assets/textures/references` remains development-only.

## Scene Open

- Open `Login.scene`, `Home.scene`, `BattlePrepare.scene`, and `Battle.scene`.
- Confirm scene nodes load without missing script warnings.
- If generated nodes are script-created rather than editor-created, mark that clearly in the relevant handoff.

## Prefab References

- Do not claim generated prefab files are production-ready unless Cocos Editor can open them.
- If a prefab is only planned, mark it as `Generated as plan only` and `Requires Cocos Editor binding`.

## Bundle Configuration

- Confirm runtime bundles exclude `tmp/`, `temp/`, `library/`, QA screenshots, and `assets/textures/references`.
- Confirm runtime asset indexes point only to promoted runtime assets.

## Preview Cache

- Stop Browser Preview before judging visual changes.
- Restart preview after TypeScript or scene changes.
- If preview still shows stale UI, clear Cocos preview cache or rebuild preview output before QA approval.

## WeChat Build

- Select WeChat Mini Game as target in Cocos build settings.
- Confirm AppID is configured outside source code.
- Build output must be imported into WeChat DevTools before any Agent claims WeChat build verification.
