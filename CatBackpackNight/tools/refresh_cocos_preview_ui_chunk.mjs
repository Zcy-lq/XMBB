import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const uiBuilderPath = path.join(projectRoot, 'assets', 'scripts', 'ui', 'UISkeletonBuilder.ts');
const runtimeSpriteAssetsPath = path.join(projectRoot, 'assets', 'scripts', 'ui', 'RuntimeSpriteAssets.ts');
const baseSceneEntryPath = path.join(projectRoot, 'assets', 'scripts', 'scenes', 'BaseSceneEntry.ts');
const routeConfigPath = path.join(projectRoot, 'assets', 'scripts', 'configs', 'RouteConfig.ts');
const previewRoot = path.join(projectRoot, 'temp', 'programming', 'packer-driver', 'targets', 'preview');
const previewImportMapPath = path.join(previewRoot, 'import-map.json');
const generatedChunkDir = path.join(previewRoot, 'chunks', 'codex');

const defaultEngineNodeModules = 'C:\\ProgramData\\cocos\\editors\\Creator\\3.8.8\\resources\\resources\\3d\\engine\\node_modules';
const engineNodeModules = process.env.COCOS_CREATOR_ENGINE_NODE_MODULES ?? defaultEngineNodeModules;

if (!fs.existsSync(engineNodeModules)) {
  throw new Error(`Cocos engine node_modules not found: ${engineNodeModules}`);
}

if (!fs.existsSync(previewImportMapPath)) {
  throw new Error(`Cocos preview import-map not found: ${previewImportMapPath}`);
}

const cocosRequire = createRequire(path.join(engineNodeModules, 'package.json'));
const babel = cocosRequire('@babel/core');
const { babelPresetCC } = cocosRequire('@cocos/creator-programming-babel-preset-cc');
const transformModulesSystemjs = cocosRequire('@babel/plugin-transform-modules-systemjs').default;

function encodeProjectImportSpec(sourcePath, specifier) {
  if (specifier === 'cc' || specifier.startsWith('cce:') || !specifier.startsWith('.')) {
    return specifier;
  }

  const targetSpecifier = path.extname(specifier) ? specifier : `${specifier}.ts`;
  return pathToFileURL(path.resolve(path.dirname(sourcePath), targetSpecifier)).href;
}

function inlineJsonImports(sourcePath, source) {
  return source.replace(/import\s+([A-Za-z_$][\w$]*)\s+from\s+'([^']+\.json)';/g, (match, binding, specifier) => {
    const jsonPath = path.resolve(path.dirname(sourcePath), specifier);
    const json = fs.readFileSync(jsonPath, 'utf8').trim();
    return `const ${binding} = ${json} as const;`;
  });
}

function rewriteProjectImports(sourcePath, source) {
  return inlineJsonImports(sourcePath, source).replace(/from '([^']+)'/g, (match, specifier) => {
    return `from '${encodeProjectImportSpec(sourcePath, specifier)}'`;
  });
}

function findPreviewSourceKey(importMap, sourcePath) {
  const expectedSuffix = path.relative(projectRoot, sourcePath).replace(/\\/g, '/');
  return Object.keys(importMap.imports ?? {}).find((key) => {
    return key.replace(/\\/g, '/').endsWith(expectedSuffix);
  });
}

function collectPreviewChunkValues(node, values = new Set()) {
  if (!node || typeof node !== 'object') {
    return values;
  }

  for (const value of Object.values(node)) {
    if (typeof value === 'string') {
      if (value.startsWith('./chunks/') && value.endsWith('.js')) {
        values.add(value);
      }
    } else {
      collectPreviewChunkValues(value, values);
    }
  }

  return values;
}

function collectMappedUiBuilderChunks(importMap) {
  return [...collectPreviewChunkValues(importMap)].filter((chunkValue) => {
    const chunkPath = path.resolve(previewRoot, chunkValue);
    if (!fs.existsSync(chunkPath)) {
      return false;
    }

    const chunkSource = fs.readFileSync(chunkPath, 'utf8');
    return chunkSource.includes('UISkeletonBuilder') && chunkSource.includes('Battle_HPBar');
  });
}

function collectMappedChunksMatching(importMap, matcher) {
  return [...collectPreviewChunkValues(importMap)].filter((chunkValue) => {
    const chunkPath = path.resolve(previewRoot, chunkValue);
    if (!fs.existsSync(chunkPath)) {
      return false;
    }

    return matcher(fs.readFileSync(chunkPath, 'utf8'), chunkValue);
  });
}

function replaceImportMapChunkValues(node, previousChunks, replacement) {
  if (!node || typeof node !== 'object') {
    return 0;
  }

  let replacements = 0;
  for (const [key, value] of Object.entries(node)) {
    if (typeof value === 'string') {
      if (previousChunks.has(value)) {
        node[key] = replacement;
        replacements += 1;
      }
    } else {
      replacements += replaceImportMapChunkValues(value, previousChunks, replacement);
    }
  }

  return replacements;
}

const uiSource = rewriteProjectImports(uiBuilderPath, fs.readFileSync(uiBuilderPath, 'utf8'));
function buildPreviewChunk(sourcePath, chunkPrefix) {
  const source = rewriteProjectImports(sourcePath, fs.readFileSync(sourcePath, 'utf8'));
  const transformResult = babel.transformSync(source, {
    filename: sourcePath,
    sourceMaps: true,
    sourceFileName: pathToFileURL(sourcePath).href,
    configFile: false,
    babelrc: false,
    comments: false,
    compact: false,
    presets: [[babelPresetCC, {
      allowDeclareFields: true,
      onlyRemoveTypeImports: true,
      useDefineForClassFields: false,
      fieldDecorators: ['property'],
    }]],
    plugins: [[transformModulesSystemjs, { systemGlobal: 'System' }]],
  });

  const chunkHash = createHash('sha1').update(transformResult.code).digest('hex').slice(0, 20);
  const chunkFileName = `${chunkPrefix}.${chunkHash}.js`;
  const chunkPath = path.join(generatedChunkDir, chunkFileName);
  const chunkMapPath = `${chunkPath}.map`;

  fs.mkdirSync(generatedChunkDir, { recursive: true });
  fs.writeFileSync(chunkPath, `${transformResult.code}\n//# sourceMappingURL=${chunkFileName}.map\n`, 'utf8');
  fs.writeFileSync(chunkMapPath, JSON.stringify(transformResult.map), 'utf8');

  return {
    chunkFileName,
    chunkPath,
    activeChunk: `./chunks/codex/${chunkFileName}`,
  };
}

const importMap = JSON.parse(fs.readFileSync(previewImportMapPath, 'utf8'));
const uiChunk = buildPreviewChunk(uiBuilderPath, 'UISkeletonBuilder');
const sourceKey = findPreviewSourceKey(importMap, uiBuilderPath);
if (!sourceKey) {
  throw new Error('UISkeletonBuilder.ts import-map entry not found.');
}

const previousChunk = importMap.imports[sourceKey];
const previousUiChunks = new Set(collectMappedUiBuilderChunks(importMap));
previousUiChunks.add(previousChunk);
const rewrittenMappings = replaceImportMapChunkValues(importMap, previousUiChunks, uiChunk.activeChunk);
importMap.imports[sourceKey] = uiChunk.activeChunk;

const runtimeChunk = buildPreviewChunk(runtimeSpriteAssetsPath, 'RuntimeSpriteAssets');
const runtimeSourceKey = findPreviewSourceKey(importMap, runtimeSpriteAssetsPath);
if (!runtimeSourceKey) {
  throw new Error('RuntimeSpriteAssets.ts import-map entry not found.');
}
const previousRuntimeChunk = importMap.imports[runtimeSourceKey];
importMap.imports[runtimeSourceKey] = runtimeChunk.activeChunk;

function refreshImportMapSource(sourcePath, chunkPrefix, collectPreviousChunks) {
  const chunk = buildPreviewChunk(sourcePath, chunkPrefix);
  const sourceKey = findPreviewSourceKey(importMap, sourcePath);
  if (!sourceKey) {
    throw new Error(`${path.basename(sourcePath)} import-map entry not found.`);
  }

  const previousChunk = importMap.imports[sourceKey];
  const previousChunks = new Set(collectPreviousChunks?.(importMap) ?? []);
  previousChunks.add(previousChunk);
  const rewrittenMappings = replaceImportMapChunkValues(importMap, previousChunks, chunk.activeChunk);
  importMap.imports[sourceKey] = chunk.activeChunk;
  return {
    source: path.relative(projectRoot, sourcePath),
    previousChunk,
    previousChunks: [...previousChunks],
    rewrittenMappings,
    activeChunk: chunk.activeChunk,
    chunkPath: path.relative(projectRoot, chunk.chunkPath),
  };
}

const routeChunk = refreshImportMapSource(routeConfigPath, 'RouteConfig', (map) =>
  collectMappedChunksMatching(map, (source) => source.includes('ROUTE_CONFIGS') && source.includes('getRouteConfig')),
);
const baseSceneChunk = refreshImportMapSource(baseSceneEntryPath, 'BaseSceneEntry', (map) =>
  collectMappedChunksMatching(map, (source) => source.includes('BaseSceneEntry') && source.includes('resolvePreviewScreenKey')),
);

fs.writeFileSync(previewImportMapPath, `${JSON.stringify(importMap, null, 2)}\n`, 'utf8');

console.log(JSON.stringify({
  previousChunk,
  previousUiChunks: [...previousUiChunks],
  activeChunk: uiChunk.activeChunk,
  rewrittenMappings,
  chunkPath: path.relative(projectRoot, uiChunk.chunkPath),
  previousRuntimeChunk,
  activeRuntimeChunk: runtimeChunk.activeChunk,
  runtimeChunkPath: path.relative(projectRoot, runtimeChunk.chunkPath),
  routeChunk,
  baseSceneChunk,
}, null, 2));
