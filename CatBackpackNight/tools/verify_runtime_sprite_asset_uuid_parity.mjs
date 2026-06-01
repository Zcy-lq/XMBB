import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const runtimeSpriteAssetsPath = path.join(projectRoot, 'assets', 'scripts', 'ui', 'RuntimeSpriteAssets.ts');
const runtimeTextureDir = path.join(projectRoot, 'assets', 'textures', 'runtime');

const source = fs.readFileSync(runtimeSpriteAssetsPath, 'utf8');
const entries = [...source.matchAll(/"([^"]+)":\s*"([^"]+)"/g)].map((match) => ({
  id: match[1],
  uuid: match[2],
}));

const mismatches = [];
for (const entry of entries) {
  const metaPath = path.join(runtimeTextureDir, `${entry.id}.png.meta`);
  if (!fs.existsSync(metaPath)) {
    continue;
  }

  const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
  const metaUuid = meta.userData?.redirect ?? Object.values(meta.subMetas ?? {})[0]?.uuid;
  if (metaUuid && metaUuid !== entry.uuid) {
    mismatches.push(`${entry.id}: expected ${metaUuid}, got ${entry.uuid}`);
  }
}

assert.deepEqual(mismatches, [], `RuntimeSpriteAssets.ts has stale UUIDs:\n${mismatches.join('\n')}`);

console.log('[verify_runtime_sprite_asset_uuid_parity] RuntimeSpriteAssets UUIDs match runtime texture metadata.');
