# Build And Release

## Local Static Checks

Run from `CatBackpackNight`:

```powershell
npm run workflow:check
npm run typecheck
```

## Cocos Creator

- Open `D:/工作/XMBB/CatBackpackNight` with Cocos Creator 3.8.x.
- Wait for asset import and TypeScript compilation.
- Open the primary scenes and check for missing script warnings.
- Do not delete `.meta` files to fix import issues.

## WeChat Mini Game Build

- Select WeChat Mini Game as the build target.
- Configure AppID outside TypeScript source code.
- Build into the configured Cocos output directory.
- Import the build output into WeChat DevTools.

## Failure Handling

- If Cocos Editor fails to import, record the console output in `docs/QA_BLOCKERS.md`.
- If WeChat DevTools fails to import, record whether the issue is project config, platform API, asset path, or generated code.
- If preview shows stale code, stop preview and force a Cocos preview rebuild before judging screenshots.
