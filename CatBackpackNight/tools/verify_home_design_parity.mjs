import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const uiBuilderPath = path.join(projectRoot, 'assets', 'scripts', 'ui', 'UISkeletonBuilder.ts');
const source = fs.readFileSync(uiBuilderPath, 'utf8');
const addBottomNavBody = /private addBottomNav\([^)]*\): void \{([\s\S]*?)\n  private addRoutedOverlay/.exec(source)?.[1] ?? '';

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
assert.match(
  source,
  /private buildHome\(\): void \{[\s\S]*this\.addBottomNav\('battle'\)/,
  'home page bottom nav should highlight the centered battle entry from the design board',
);
assert.ok(addBottomNavBody.length > 0, 'home bottom nav implementation should be present');

for (const token of [
  "{ key: 'shop', label: '商店' }",
  "{ key: 'backpack', label: '背包' }",
  "{ key: 'battle', label: '战斗' }",
  "{ key: 'talent', label: '天赋' }",
  "{ key: 'pet', label: '宠物' }",
]) {
  assert.ok(addBottomNavBody.includes(token), `home bottom nav should include design entry ${token}`);
}

for (const forbiddenToken of [
  "{ key: 'home', label: '主界面' }",
  "{ key: 'merge', label: '合成' }",
  "{ key: 'explore', label: '探索' }",
  "{ key: 'guild', label: '公会' }",
  "{ key: 'settings', label: '设置' }",
]) {
  assert.ok(!addBottomNavBody.includes(forbiddenToken), `home bottom nav should not render legacy entry ${forbiddenToken}`);
}

console.log('[verify_home_design_parity] home page design parity contract is present.');
