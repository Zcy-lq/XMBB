import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const uiBuilderPath = path.join(projectRoot, 'assets', 'scripts', 'ui', 'UISkeletonBuilder.ts');
const source = fs.readFileSync(uiBuilderPath, 'utf8');

assert.match(source, /addBattleDesignPreviewLayer/, 'battle page should render a design preview layer when no live battle state exists');
assert.doesNotMatch(
  source,
  /private addBattleDesignPreviewLayer\(\): void \{\s*this\.addCharacterStand\('BattleDemo_HeroCat'/s,
  'battle preview layer should not unconditionally duplicate the live battle hero',
);
assert.match(source, /if \(!this\.battleState\) \{\s*this\.addCharacterStand\('BattleDemo_HeroCat'/s, 'battle preview layer should keep a fallback hero only when no live battle state exists');
assert.match(source, /BattleDemo_rt_monster_goblin/, 'battle preview layer should include goblin enemies');
assert.match(source, /BattleDemo_Damage_/, 'battle preview layer should include damage numbers');

console.log('[verify_battle_design_parity] battle page design parity contract is present.');
