import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (...segments) => fs.readFileSync(path.join(projectRoot, ...segments), 'utf8');
const literal = (value) => new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

const uiBuilder = read('assets', 'scripts', 'ui', 'UISkeletonBuilder.ts');
const gameTypes = read('assets', 'scripts', 'data', 'GameTypes.ts');
const routeConfig = read('assets', 'scripts', 'configs', 'RouteConfig.ts');
const baseScene = read('assets', 'scripts', 'scenes', 'BaseSceneEntry.ts');

for (const route of ['mergeGuide', 'petDetail']) {
  assert.match(gameTypes, new RegExp(`\\|\\s*'${route}'`), `RouteId should expose ${route}`);
  assert.match(routeConfig, new RegExp(`${route}:\\s*\\{[^}]*sceneName:\\s*'Home'`, 's'), `${route} should render on the Home scene`);
  assert.match(baseScene, literal(`'${route}'`), `preview route allow-list should include ${route}`);
}

assert.match(uiBuilder, /mergeGuide:\s*\(\)\s*=>\s*this\.buildMergeGuide\(\)/, 'UISkeletonBuilder should build merge guide');
assert.match(uiBuilder, /petDetail:\s*\(\)\s*=>\s*this\.buildPetDetail\(\)/, 'UISkeletonBuilder should build pet detail');

for (const snippet of [
  'MergeGuide_MaskLayer',
  'MergeGuide_Modal',
  'MergeGuide_SourceA',
  'MergeGuide_SourceB',
  'MergeGuide_ResultCard',
  'Button_MergeGuideConfirm',
]) {
  assert.match(uiBuilder, literal(snippet), `merge guide should include ${snippet}`);
}

for (const snippet of [
  'PetDetail_PortraitFrame',
  'PetDetail_InfoPanel',
  'PetDetail_StarRow',
  'PetDetail_AttributePanel',
  'PetDetail_SkillPanel',
  'PetDetail_MaterialPanel',
  'PetDetail_EvolutionPreview',
  'Button_PetDetailUpgrade',
  'Button_PetDetailDeploy',
  'Button_PetDetailBackList',
]) {
  assert.match(uiBuilder, literal(snippet), `pet detail should include ${snippet}`);
}

assert.match(uiBuilder, /private buildPet\(\): void[\s\S]*?this\.addBottomNav\('pet'\)/, 'pet page should include design mobile bottom navigation');
assert.match(uiBuilder, /NavButton_shop[\s\S]*?return 'shop'/, 'design bottom nav should route to shop');
assert.match(uiBuilder, /weapon_bow_Icon[\s\S]*?rt_item_weapon_fishbone_bow/, 'inventory bow icons should use runtime art instead of text placeholders');

console.log('[verify_inventory_shop_pet_design_parity] inventory/shop/pet pages contract is present.');
