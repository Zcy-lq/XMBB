# Launch Evidence

This folder is for final WeChat launch evidence. Do not mark the game release-ready until `launch_evidence.json` exists and passes:

```powershell
node tools/verify_launch_evidence.mjs
$env:XMBB_RELEASE_FINAL='1'; node tools/verify_launch_evidence.mjs
```

Use `launch_evidence.template.json` as the schema. Evidence files referenced by the manifest should be committed when they are small text logs or QA screenshots that are acceptable to keep in the repository. Large recordings can be stored externally, but the manifest must include a stable path or URL and a concise note.

Required evidence groups:

- WeChat DevTools import and preview.
- One runtime full-loop run in WeChat DevTools or on device.
- Manual signoff for all 22 AI design reference pages.
- Android and iPhone smoke tests.
- Basic performance numbers from the tested devices.
