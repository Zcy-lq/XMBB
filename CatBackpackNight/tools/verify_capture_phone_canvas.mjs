import fs from 'node:fs';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const toolPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'capture_cocos_preview.mjs');
const source = fs.readFileSync(toolPath, 'utf8');

assert.match(source, /phone-canvas/, 'capture tool should expose --phone-canvas mode');
assert.match(source, /captureCanvasOnly/, 'capture tool should crop screenshots to the Cocos canvas');
assert.match(source, /hidePreviewChrome/, 'capture tool should hide Cocos preview toolbar/FPS chrome');
assert.match(source, /disablePreviewFps/, 'capture tool should turn off Cocos preview FPS overlay before screenshot');
assert.match(source, /ensurePortraitCanvas/, 'capture tool should auto-rotate preview canvas into portrait mode');
assert.match(source, /element\.contains\(canvas\)/, 'FPS cleanup must not hide the canvas or its preview container');
assert.match(source, /args\.url \?\? 'http:\/\/localhost:7456'/, 'capture tool default URL should use localhost so IPv6-only Cocos preview servers are reachable');

console.log('[verify_capture_phone_canvas] phone canvas capture contract is present.');
