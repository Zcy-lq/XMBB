import fs from 'node:fs';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const toolsDir = path.dirname(fileURLToPath(import.meta.url));
const captureToolPath = path.resolve(toolsDir, 'capture_cocos_preview.mjs');
const refreshToolPath = path.resolve(toolsDir, 'refresh_cocos_preview_ui_chunk.mjs');
const source = fs.readFileSync(captureToolPath, 'utf8');
const refreshSource = fs.readFileSync(refreshToolPath, 'utf8');

assert.match(source, /phone-canvas/, 'capture tool should expose --phone-canvas mode');
assert.match(source, /captureCanvasOnly/, 'capture tool should crop screenshots to the Cocos canvas');
assert.match(source, /hidePreviewChrome/, 'capture tool should hide Cocos preview toolbar/FPS chrome');
assert.match(source, /disablePreviewFps/, 'capture tool should turn off Cocos preview FPS overlay before screenshot');
assert.match(source, /ensurePortraitCanvas/, 'capture tool should auto-rotate preview canvas into portrait mode');
assert.match(source, /element\.contains\(canvas\)/, 'FPS cleanup must not hide the canvas or its preview container');
assert.match(source, /args\.url \?\? 'http:\/\/localhost:7456'/, 'capture tool default URL should use localhost so IPv6-only Cocos preview servers are reachable');
assert.match(refreshSource, /path\.extname\(specifier\)/, 'preview refresh should preserve non-TS relative imports such as JSON configs');
assert.doesNotMatch(refreshSource, /path\.resolve\(path\.dirname\(sourcePath\), `\$\{specifier\}\.ts`\)/, 'preview refresh must not rewrite JSON config imports to *.json.ts');
assert.match(refreshSource, /inlineJsonImports/, 'preview refresh should inline JSON config imports for generated SystemJS chunks');
assert.match(refreshSource, /gameConfigRepositoryPath/, 'preview refresh should rebuild GameConfigRepository so JSON gameplay config changes reach Browser Preview screenshots');
assert.match(refreshSource, /GameConfigRepository/, 'preview refresh output should expose the refreshed GameConfigRepository chunk');

console.log('[verify_capture_phone_canvas] phone canvas capture contract is present.');
