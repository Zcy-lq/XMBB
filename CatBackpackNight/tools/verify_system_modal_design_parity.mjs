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

for (const route of ['mailDetail', 'policyModal', 'confirmModal', 'toastModal']) {
  assert.match(gameTypes, new RegExp(`\\|\\s*'${route}'`), `RouteId should expose ${route}`);
  assert.match(routeConfig, new RegExp(`${route}:\\s*\\{[^}]*sceneName:\\s*'(?:Home|Login)'`, 's'), `${route} should have a route config`);
  assert.match(baseScene, literal(`'${route}'`), `preview route allow-list should include ${route}`);
}

for (const builder of ['buildMailDetail', 'buildPolicyModal', 'buildConfirmModal', 'buildToastModal']) {
  assert.match(uiBuilder, literal(`${builder}()`), `UISkeletonBuilder should implement ${builder}`);
}

assert.match(uiBuilder, /private buildTalent\(\): void[\s\S]*?this\.addBottomNav\('talent'\)/, 'talent should use the design 5-item mobile bottom nav');

for (const snippet of [
  'MailDetail_MaskLayer',
  'MailDetail_Drawer',
  'MailDetail_InfoPanel',
  'MailDetail_ContentPanel',
  'MailDetail_RewardContainer',
  'Button_MailDetailClaim',
  'Button_MailDetailDelete',
]) {
  assert.match(uiBuilder, literal(snippet), `mail detail should include ${snippet}`);
}

for (const snippet of [
  'Policy_MaskLayer',
  'Policy_Modal',
  'Policy_Tab_User',
  'Policy_ScrollTextArea',
  'Policy_CheckboxAgree',
  'Button_PolicyAgree',
  'Button_PolicyDisagree',
]) {
  assert.match(uiBuilder, literal(snippet), `policy modal should include ${snippet}`);
}

for (const snippet of [
  'Confirm_MaskLayer',
  'Confirm_Modal',
  'Confirm_WarningIcon',
  'Confirm_CostRow',
  'Button_ConfirmCancel',
  'Button_ConfirmOk',
]) {
  assert.match(uiBuilder, literal(snippet), `confirm modal should include ${snippet}`);
}

for (const snippet of [
  'ToastLayer',
  'ToastCard_Info',
  'ToastCard_Success',
  'ToastCard_Warning',
  'ToastCard_Error',
  'ToastRewardFly_Gold',
  'ToastAutoDismissTimer',
]) {
  assert.match(uiBuilder, literal(snippet), `toast modal should include ${snippet}`);
}

console.log('[verify_system_modal_design_parity] system pages and modal contracts are present.');
