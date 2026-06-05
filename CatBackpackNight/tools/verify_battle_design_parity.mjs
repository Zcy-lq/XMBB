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

assert.match(
  source,
  /battleLaneStartX[\s\S]*battleLaneEndX[\s\S]*laneEndX \+ monster\.x \* \(laneStartX - laneEndX\)/,
  'battle monsters should project model x=1..0 from a right-side entrance toward the camp danger line',
);
assert.doesNotMatch(
  source,
  /private syncBattleMonster[\s\S]*28 \+ monster\.x \* 126/,
  'battle monster rendering should not compress monster advance into a tiny center band',
);
assert.match(
  source,
  /private syncBattleMonster[\s\S]*this\.getBattleMonsterPosition\(monster, index, elapsedSeconds\)/,
  'battle monster body should use the shared lane projection helper',
);
assert.match(
  source,
  /private syncBattleDamageNumber[\s\S]*this\.getBattleMonsterPosition\(monster, Math\.max\(0, monsterIndex\), battleState\.elapsedSeconds\)/,
  'battle damage numbers should follow the same live monster position as the body and hit effects',
);
assert.doesNotMatch(
  source,
  /private syncBattleHero[\s\S]*const bob = Math\.sin[\s\S]*heroY = [^;]*bob/s,
  'battle hero body should stay grounded and must not bob vertically like an idle menu mascot',
);
assert.match(source, /Battle_HeroCommandArm_Live/, 'battle hero should include a command arm instead of body bobbing');
assert.match(source, /Battle_HeroMuzzleFlash_Live/, 'battle hero should show a local muzzle flash when attacking');
assert.match(
  source,
  /battleMuzzleX[\s\S]*battleMuzzleY[\s\S]*originX = battleMuzzleX[\s\S]*originY = battleMuzzleY/,
  'battle attack visuals should originate from the grounded hero weapon position',
);
for (const fieldPrimitive of ['Battle_AdvanceLane', 'Battle_CampDanger', 'Battle_RightEntranceMist']) {
  assert.match(
    source,
    new RegExp(`name\\.includes\\('${fieldPrimitive}'\\)[\\s\\S]*?return undefined`),
    `battle field primitive ${fieldPrimitive} should not be replaced by the generic dark panel runtime sprite`,
  );
}
assert.doesNotMatch(
  source,
  /name: 'Battle_CampDangerLine'[^\n]*border:/,
  'battle camp danger line should render as a subtle primitive, not a bordered debug axis',
);
assert.match(
  source,
  /private getBattleLiveLayer\(\): Node[\s\S]*this\.placeBattleLiveLayer\(.*layer.*\)/,
  'battle live layer should be deliberately placed between field art and HUD',
);
assert.doesNotMatch(
  source,
  /Battle_LiveLayer[\s\S]*setSiblingIndex\(999\)/,
  'battle live layer must not sit above side controls and bottom HUD',
);

console.log('[verify_battle_design_parity] battle page design parity contract is present.');
