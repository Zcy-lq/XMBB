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

for (const requiredBattleHud of [
  'Battle_SideControlGroup',
  'Battle_SideAuto',
  'Battle_SideSpeed',
  'Battle_SideRetreat',
  'Battle_PetSkillRow',
  'Battle_PetSkillSlot_1',
  'Battle_PetSkillSlot_2',
  'Battle_PetSkillSlot_Locked',
  'Battle_ItemQuickBar',
  'Battle_ItemPotionRed',
  'Battle_ItemPotionBlue',
  'Battle_ItemPotionGreen',
  'Battle_ItemEquipEmpty',
  'Battle_WeaponSlotBar',
  'Button_AutoMerge',
]) {
  assert.match(source, new RegExp(requiredBattleHud), `battle page should include design HUD component ${requiredBattleHud}`);
}
assert.match(source, /BattleWeapon_Static_\$\{index \+ 1\}/, 'battle page should generate five design weapon slots');
assert.match(source, /weaponSlots\.forEach/, 'battle page weapon bar should render the configured weapon slot list');

assert.match(
  source,
  /private buildBattle\(\): void[\s\S]*Battle_PetSkillRow[\s\S]*Battle_ItemQuickBar[\s\S]*Battle_WeaponSlotBar/,
  'battle page vertical HUD order should match the design: pet skills, item quick bar, weapon bar',
);
assert.match(
  source,
  /private buildBattle\(\): void[\s\S]*Battle_SideAuto[\s\S]*Battle_SideSpeed[\s\S]*Battle_SideRetreat/,
  'battle page should include the design side controls for auto, speed, and retreat',
);

console.log('[verify_battle_design_parity] battle page design parity contract is present.');
