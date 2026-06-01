import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const runtimeTextureDir = path.join(projectRoot, 'assets', 'textures', 'runtime');
const outputPath = path.join(projectRoot, 'assets', 'configs', 'assets_runtime.json');

if (!fs.existsSync(runtimeTextureDir)) {
  console.error(`[runtime-assets] Missing texture directory: ${path.relative(projectRoot, runtimeTextureDir)}`);
  process.exit(1);
}

const assets = fs
  .readdirSync(runtimeTextureDir)
  .filter((fileName) => /\.png$/i.test(fileName))
  .sort((a, b) => a.localeCompare(b))
  .map((fileName) => {
    const id = path.basename(fileName, path.extname(fileName));
    return {
      id,
      assetType: 'spriteFrame',
      finalPath: `assets/textures/runtime/${fileName}`,
      bundle: 'runtime',
      loadPolicy: id.includes('_bg_') ? 'preloadScreen' : 'lazy',
      priority: id.startsWith('rt_bg_') || id.startsWith('rt_btn_') || id.startsWith('rt_icon_') ? 'p0' : 'p1',
    };
  });

const document = {
  schemaVersion: 1,
  updatedAt: '2026-05-24',
  authoringAgent: 'QAReleaseAgent',
  runtimeOnly: true,
  sourceIndex: 'assets/textures/runtime',
  policy: {
    excludeDevelopmentReferences: true,
    referencePathPattern: 'assets/textures/references',
    generatedBy: 'tools/generate_runtime_asset_index.mjs',
  },
  assets,
};

fs.writeFileSync(outputPath, `${JSON.stringify(document, null, 2)}\n`, 'utf8');
console.log(`[runtime-assets] Wrote ${path.relative(projectRoot, outputPath)} with ${assets.length} assets.`);
