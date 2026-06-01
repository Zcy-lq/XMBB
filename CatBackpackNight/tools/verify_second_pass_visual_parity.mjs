import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (...segments) => fs.readFileSync(path.join(projectRoot, ...segments), 'utf8');
const literal = (value) => new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

const uiBuilder = read('assets', 'scripts', 'ui', 'UISkeletonBuilder.ts');

for (const bg of ['Bg_Talent', 'Bg_DailyTask', 'Bg_Achievement', 'Bg_Mail', 'Bg_Settings']) {
  assert.match(uiBuilder, new RegExp(`name === '${bg}'[\\s\\S]*?rt_bg_battle_forest_safe`), `${bg} should use the forest/night runtime background`);
}

for (const snippet of [
  'DailyTask_RewardPanel_',
  'DailyTask_RewardGold_',
  'DailyTask_RewardGem_',
  'DailyTask_ActivityMedal',
  'DailyTask_Chest_rt_item_chest_',
  'DailyTask_RefreshTip',
  'Achievement_TrophyIcon',
  'Achievement_TotalProgress',
  'Achievement_BottomClaimPanel',
  'Button_AchievementClaimAllBottom',
  'Button_AchievementClaimAll',
  'Mail_EmptyStatePanel',
  'Button_MailDeleteAll',
  'Settings_VersionPanel',
  'Settings_SafeNotice',
  'Settings_Icon_${key}',
  '_EmptyPaw_rt_icon_paw_Muted',
  '${name}_IconMedallion',
  '${name}_${spriteKey}',
  '${name}_RarityBadge',
  '${name}_Star_',
  'Button_PauseToggleOn_${key}',
  'Button_PauseToggleOff_${key}',
  'PetDetail_CrescentMoon',
  'PetDetail_StageStars',
  'PetDetail_PedestalHint',
]) {
  assert.match(uiBuilder, literal(snippet), `second-pass UI parity should include ${snippet}`);
}

assert.match(uiBuilder, /Talent_DetailPanel'[\s\S]*?y:\s*-360/, 'talent detail panel should sit above action buttons without overlap');
assert.match(uiBuilder, /\['attack_power_02', '夜巡大师', '攻击再提升', 0, -238\]/, 'bottom talent node should stay clear of the detail panel');
assert.match(uiBuilder, /Button_TalentLearn', '学习天赋', -118, -502/, 'talent action buttons should align above the commercial bottom nav');
assert.match(uiBuilder, /addIconButton\(`Button_Close_\$\{title\}`, '×', 320, 570\)/, 'shared wood header should use the design-spec close button on the right');
assert.match(uiBuilder, /Button_Close[\s\S]*?return 'rt_icon_close'/, 'shared close buttons should render the close icon instead of text or help');
assert.match(uiBuilder, /achievements\.slice\(0, 5\)/, 'achievement list should show five compact rows like the reference');
assert.match(uiBuilder, /Button_AchievementClaimAllBottom[\s\S]*?return 'rt_btn_yellow'/, 'achievement bottom claim-all bar should use the gold runtime button art');
assert.match(uiBuilder, /Button_AchievementClaimAll[\s\S]*?gameLogic\.claimAllAchievements\(\)/, 'achievement claim-all buttons should claim all available achievement rewards');
assert.match(uiBuilder, /DailyTask_RewardGold_rt_icon_paw_coin_\$\{task\.key\}/, 'daily task gold reward icons should put the runtime id before the task key');
assert.match(uiBuilder, /DailyTask_RewardGem_rt_icon_purple_gem_\$\{task\.key\}/, 'daily task gem reward icons should put the runtime id before the task key');
assert.doesNotMatch(uiBuilder, /守夜委托板/, 'daily task page should not show an extra board header that is absent from the design');
assert.match(uiBuilder, /const isToggle = value === '开启' \|\| value === '关闭'/, 'settings rows should distinguish switches from link buttons');
assert.match(uiBuilder, /isToggle \? \(value === '开启' \? UIColors\.successGreen : UIColors\.woodLight\) : UIColors\.actionBlue/, 'settings link buttons should use the design blue action style');
assert.match(uiBuilder, /Settings_Title_\$\{key\}`,\s*value: title,\s*x: -56/, 'settings row titles should leave room for the left feature icon');
assert.match(uiBuilder, /Button_Settings_Privacy'\) \|\| name\.includes\('Button_Settings_Service'\)[\s\S]*?return 'rt_btn_blue'/, 'settings link buttons should use blue runtime button art');
assert.match(uiBuilder, /name\.includes\('Button_Settings_'\)[\s\S]*?return 'rt_btn_green'/, 'settings toggle buttons should use button art instead of the settings gear icon');
assert.match(uiBuilder, /if \(!filled\) \{[\s\S]*?_EmptyPaw_rt_icon_paw_Muted[\s\S]*?return;/, 'empty backpack and merge-guide slots should show the muted paw-print from the design');
assert.match(uiBuilder, /name\.includes\('rt_icon_paw'\)[\s\S]*?return 'rt_icon_paw'/, 'generic paw-print overlays should resolve to the runtime paw icon');
assert.match(uiBuilder, /preserveSpriteTint[\s\S]*?_Muted[\s\S]*?sprite\.color = preserveSpriteTint \? initialColor : Color\.WHITE/, 'muted paw-print overlays should keep their semi-transparent tint after runtime sprite loading');
assert.match(uiBuilder, /addSkillCard\('SkillCard_1'[\s\S]*?'rt_battle_weapon_gold_sword'\)/, 'first skill card should use the large skill icon from the design');
assert.match(uiBuilder, /addSkillCard\('SkillCard_2'[\s\S]*?'rt_battle_weapon_bow'\)/, 'second skill card should use the large skill icon from the design');
assert.match(uiBuilder, /addSkillCard\('SkillCard_3'[\s\S]*?'rt_item_bomb'\)/, 'third skill card should use the large skill icon from the design');
assert.match(uiBuilder, /SkillCard_[\s\S]*?_IconMedallion[\s\S]*?return undefined/, 'skill-card medallions and badges should keep their custom art instead of being replaced by generic card art');
assert.match(uiBuilder, /Button_PauseToggleOn[\s\S]*?return 'rt_btn_green'/, 'pause on switches should use visible green runtime button art');
assert.match(uiBuilder, /Button_PauseToggleOff[\s\S]*?return 'rt_btn_brown'/, 'pause off switches should use visible brown runtime button art');
assert.doesNotMatch(uiBuilder, /Pause_SettingsRow_[\s\S]{0,160}return 'rt_panel_parchment'/, 'pause setting rows should not load a runtime parchment sprite over the switch track');
assert.doesNotMatch(uiBuilder, /Pause_PaperBacking[\s\S]{0,160}return 'rt_panel_parchment'/, 'pause paper backing should not load over the custom settings switches');
assert.match(uiBuilder, /PetDetail_CrescentMoon[\s\S]*?☾[\s\S]*?PetDetail_StageStars/s, 'pet detail portrait should include the moonlit showcase accents from the design');

console.log('[verify_second_pass_visual_parity] second-pass visual parity contract is present.');
