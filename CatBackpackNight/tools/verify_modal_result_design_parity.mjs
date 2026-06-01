import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (...segments) => fs.readFileSync(path.join(projectRoot, ...segments), 'utf8');

const uiBuilder = read('assets', 'scripts', 'ui', 'UISkeletonBuilder.ts');
const gameTypes = read('assets', 'scripts', 'data', 'GameTypes.ts');
const routeConfig = read('assets', 'scripts', 'configs', 'RouteConfig.ts');
const baseScene = read('assets', 'scripts', 'scenes', 'BaseSceneEntry.ts');
const refreshPreview = read('tools', 'refresh_cocos_preview_ui_chunk.mjs');
const literal = (value) => new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

assert.match(gameTypes, /\|\s*'pauseModal'/, 'RouteId should expose pauseModal for screenshot parity');
assert.match(routeConfig, /pauseModal:\s*\{[^}]*sceneName:\s*'Battle'/s, 'pauseModal should render on the Battle scene');
assert.match(baseScene, /'pauseModal'/, 'preview route allow-list should include pauseModal');
assert.match(refreshPreview, /BaseSceneEntry\.ts/, 'preview refresh should rebuild BaseSceneEntry when route allow-list changes');
assert.match(refreshPreview, /RouteConfig\.ts/, 'preview refresh should rebuild RouteConfig when route scene mapping changes');
assert.match(uiBuilder, /pauseModal:\s*\(\)\s*=>\s*this\.buildPauseModal\(\)/, 'UISkeletonBuilder should build the pause modal route');

for (const snippet of [
  'Pause_MaskLayer',
  'Pause_TitleHeader',
  'Button_PauseClose',
  'Pause_SettingsRow_${key}',
  "addPauseToggleRow('Music'",
  'Button_PauseContinue',
  'Button_PauseRestart',
  'Button_PauseHome',
]) {
  assert.match(uiBuilder, literal(snippet), `pause modal should include ${snippet}`);
}

for (const snippet of [
  'SkillChoice_MaskLayer',
  'Button_SkillChoiceClose',
  'SkillChoice_ForceTip',
  'Button_RefreshVideo',
  'SkillChoice_BottomWeaponBar',
]) {
  assert.match(uiBuilder, literal(snippet), `skill choice modal should include ${snippet}`);
}

for (const snippet of [
  'Reward_VictoryHero',
  'Reward_Star_1',
  'Reward_Star_2',
  'Reward_Star_3',
  'Reward_Chest_rt_item_chest',
  'Button_RewardDouble',
  'Button_RewardConfirm',
]) {
  assert.match(uiBuilder, literal(snippet), `victory result should include ${snippet}`);
}

for (const snippet of [
  'Defeat_HeroCat',
  'Defeat_SuggestionPanel',
  'Button_DefeatRetry',
  'Button_DefeatUpgrade',
  'Button_DefeatHome',
  'Defeat_HintText',
]) {
  assert.match(uiBuilder, literal(snippet), `defeat result should include ${snippet}`);
}

assert.match(uiBuilder, /Defeat_TitleBanner'\)\) return 'rt_panel_wood_header'/, 'defeat title should use a wood-header runtime panel');
assert.match(uiBuilder, /Defeat_SummaryPanel'\) \|\| name\.includes\('Defeat_SuggestionPanel'\)\) return 'rt_panel_parchment'/, 'defeat info panels should use parchment runtime panels');

console.log('[verify_modal_result_design_parity] modal/result pages contract is present.');
