import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const buildRoot = path.join(projectRoot, 'build', 'wechatgame');
const failures = [];

function fail(message) {
  failures.push(message);
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    fail(`Invalid JSON: ${path.relative(projectRoot, filePath)} (${error.message})`);
    return {};
  }
}

function walkFiles(dir) {
  if (!fs.existsSync(dir)) {
    return [];
  }
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFiles(fullPath));
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

if (!fs.existsSync(buildRoot)) {
  fail('Missing Cocos WeChat build output: build/wechatgame');
}

for (const requiredFile of [
  'game.js',
  'game.json',
  'project.config.json',
  'application.js',
  path.join('src', 'import-map.js'),
  path.join('src', 'chunks', 'bundle.js'),
  path.join('assets', 'main', 'index.js'),
  path.join('assets', 'internal', 'index.js'),
  path.join('cocos-js', 'cc.js'),
]) {
  const fullPath = path.join(buildRoot, requiredFile);
  if (!fs.existsSync(fullPath)) {
    fail(`Missing required WeChat build file: ${path.join('build', 'wechatgame', requiredFile)}`);
  }
}

if (fs.existsSync(buildRoot)) {
  const gameJson = readJson(path.join(buildRoot, 'game.json'));
  const projectConfig = readJson(path.join(buildRoot, 'project.config.json'));
  const gameJs = fs.existsSync(path.join(buildRoot, 'game.js')) ? fs.readFileSync(path.join(buildRoot, 'game.js'), 'utf8') : '';
  const files = walkFiles(buildRoot);
  const totalBytes = files.reduce((sum, filePath) => sum + fs.statSync(filePath).size, 0);

  if (gameJson.deviceOrientation !== 'portrait') {
    fail(`game.json deviceOrientation must be portrait, got ${gameJson.deviceOrientation}`);
  }
  if (projectConfig.compileType !== 'game') {
    fail(`project.config.json compileType must be game, got ${projectConfig.compileType}`);
  }
  if (projectConfig.miniprogramRoot !== './') {
    fail(`project.config.json miniprogramRoot must be ./, got ${projectConfig.miniprogramRoot}`);
  }
  if (!projectConfig.appid || typeof projectConfig.appid !== 'string') {
    fail('project.config.json must include an appid for WeChat DevTools import');
  }
  if (!gameJs.includes("require('./web-adapter')") || !gameJs.includes("System.import('./application.js')")) {
    fail('game.js must bootstrap the Cocos WeChat adapter and application entry');
  }
  if (totalBytes <= 0) {
    fail('build/wechatgame output is empty');
  }
  if (totalBytes > 20 * 1024 * 1024) {
    fail(`build/wechatgame is too large for the local launch gate: ${totalBytes} bytes`);
  }

  console.log(
    `[wechat-build-output] ${JSON.stringify({
      buildRoot: path.relative(projectRoot, buildRoot),
      files: files.length,
      bytes: totalBytes,
      appid: projectConfig.appid ?? null,
      orientation: gameJson.deviceOrientation ?? null,
    })}`,
  );
}

if (failures.length > 0) {
  console.error('[wechat-build-output] FAIL');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('[wechat-build-output] PASS');
