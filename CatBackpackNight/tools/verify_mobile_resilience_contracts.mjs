import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (...segments) => fs.readFileSync(path.join(projectRoot, ...segments), 'utf8');

const gameTypes = read('assets', 'scripts', 'data', 'GameTypes.ts');
const baseScene = read('assets', 'scripts', 'scenes', 'BaseSceneEntry.ts');
const uiBuilder = read('assets', 'scripts', 'ui', 'UISkeletonBuilder.ts');
const talents = JSON.parse(read('assets', 'configs', 'talents.json'));
const failures = [];

function fail(message) {
  failures.push(message);
}

function requireIncludes(source, token, label) {
  if (!source.includes(token)) {
    fail(`${label} is missing required token: ${token}`);
  }
}

function routeIdsFromGameTypes() {
  const match = /export type RouteId =([\s\S]*?);/.exec(gameTypes);
  if (!match) {
    fail('GameTypes.ts is missing RouteId union.');
    return [];
  }
  return [...match[1].matchAll(/'([^']+)'/g)].map((hit) => hit[1]);
}

function resolveButtonRouteBody() {
  const start = uiBuilder.indexOf('private resolveButtonRoute');
  const end = uiBuilder.indexOf('\n\n  private handleButtonAction', start);
  if (start < 0 || end <= start) {
    fail('UISkeletonBuilder is missing resolveButtonRoute body.');
    return '';
  }
  return uiBuilder.slice(start, end);
}

requireIncludes(baseScene, 'ResolutionPolicy.FIXED_WIDTH', 'Portrait safe-area policy');

for (const token of ['Mask', 'ScrollView', 'private addScrollPanel', 'Mask.Type.GRAPHICS_RECT', 'scrollView.vertical = true', 'scrollView.horizontal = false']) {
  requireIncludes(uiBuilder, token, 'Scrollable mobile UI contract');
}

for (const token of [
  "this.addScrollPanel('MailDetail_Content'",
  '${name}ScrollContent',
  'private estimateWrappedTextHeight',
  'Label.Overflow.RESIZE_HEIGHT',
]) {
  requireIncludes(uiBuilder, token, 'Mail long-layout contract');
}

for (const token of [
  "this.addScrollPanel('Talent_Tree'",
  '${name}ScrollView',
  'gameLogic.repo.configs.talents.nodes',
  'Button_TalentSelect_${node.id}',
]) {
  requireIncludes(uiBuilder, token, 'Talent scrolling contract');
}

if (!Array.isArray(talents.nodes) || talents.nodes.length < 12) {
  fail(`talents.json should expose the full launch tree, got ${talents.nodes?.length ?? 0} node(s).`);
}

const routes = routeIdsFromGameTypes();
const routeSet = new Set(routes);
const resolveBody = resolveButtonRouteBody();
for (const [, route] of resolveBody.matchAll(/return\s+'([^']+)'/g)) {
  if (!routeSet.has(route)) {
    fail(`resolveButtonRoute returns undeclared route: ${route}`);
  }
}

for (const coreRoute of ['home', 'battlePrepare', 'merge', 'shop', 'backpack', 'pet', 'talent', 'settings']) {
  if (!resolveBody.includes(`return '${coreRoute}'`)) {
    fail(`Core page switching must expose route target: ${coreRoute}`);
  }
}

if (failures.length > 0) {
  console.error('[mobile-resilience] FAIL');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`[mobile-resilience] PASS fixed-width safe-area policy, long mail scrolling, ${talents.nodes.length} talent nodes, and ${routes.length} route targets verified.`);
