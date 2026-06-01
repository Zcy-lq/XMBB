import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const uiBuilderPath = path.join(projectRoot, 'assets', 'scripts', 'ui', 'UISkeletonBuilder.ts');
const source = fs.readFileSync(uiBuilderPath, 'utf8');

assert.match(source, /BattlePrepare_HeroCat/, 'battle prepare preview should include the hero cat from the design board');
assert.match(source, /BattlePrepare_Enemy_rt_monster_goblin/, 'battle prepare preview should include a goblin enemy');
assert.match(source, /BattlePrepare_Enemy_rt_monster_ghost/, 'battle prepare preview should include a ghost enemy');
assert.match(source, /VS\s+\$\{battleInfo\.recommendedPower\}/, 'battle prepare power panel should compare my power versus recommended power');

console.log('[verify_battle_prepare_design_parity] battle prepare design parity contract is present.');
