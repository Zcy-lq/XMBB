import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const uiBuilderPath = path.join(projectRoot, 'assets', 'scripts', 'ui', 'UISkeletonBuilder.ts');
const source = fs.readFileSync(uiBuilderPath, 'utf8');

assert.match(
  source,
  /name: 'Home_StageSelector', width: 456, height: 124, x: 0, y: 170/,
  'home stage card should sit between top functions and scene art like the design board',
);
assert.match(
  source,
  /Home_StageStar_1[\s\S]*Home_StageStar_2[\s\S]*Home_StageStar_3/,
  'home stage card should expose three star markers from the design board',
);

console.log('[verify_home_design_parity] home page design parity contract is present.');
