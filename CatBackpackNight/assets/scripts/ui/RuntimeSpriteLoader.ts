import { assetManager, ImageAsset, SpriteFrame, Texture2D } from 'cc';
import runtimeAssetIndex from '../../configs/assets_runtime.json';
import type { RuntimeSpriteAssetKey } from './RuntimeSpriteAssets';

type RuntimeSpriteAsset = SpriteFrame | Texture2D | ImageAsset;

interface RuntimeAssetIndexEntry {
  id: string;
  finalPath?: string;
}

interface RuntimeAssetIndexConfig {
  assets?: RuntimeAssetIndexEntry[];
}

const runtimeAssetEntries = (runtimeAssetIndex as RuntimeAssetIndexConfig).assets ?? [];
const runtimeAssetPathById = new Map(
  runtimeAssetEntries
    .filter((entry): entry is RuntimeAssetIndexEntry & { finalPath: string } => typeof entry.finalPath === 'string')
    .map((entry) => [entry.id, entry.finalPath] as const),
);
const cachedFrames = new Map<string, Promise<SpriteFrame | null>>();
const warnedKeys = new Set<string>();

export function loadRuntimeSpriteFrame(key: RuntimeSpriteAssetKey, uuid: string): Promise<SpriteFrame | null> {
  const cacheKey = `${key}:${uuid}`;
  const cached = cachedFrames.get(cacheKey);
  if (cached) {
    return cached;
  }

  const loadPromise = loadAnyRuntimeAsset(uuid)
    .then(async (asset) => {
      const spriteFrame = toSpriteFrame(asset);
      if (spriteFrame) {
        return spriteFrame;
      }

      const fallbackFrame = await loadRuntimeSpriteFrameFromPath(key);
      if (!fallbackFrame) {
        warnOnce(key, uuid, 'loaded asset is not a SpriteFrame, Texture2D, or ImageAsset');
      }
      return fallbackFrame;
    })
    .catch(async (error: unknown) => {
      const fallbackFrame = await loadRuntimeSpriteFrameFromPath(key);
      if (fallbackFrame) {
        return fallbackFrame;
      }

      warnOnce(key, uuid, error);
      return null;
    });

  cachedFrames.set(cacheKey, loadPromise);
  return loadPromise;
}

function loadAnyRuntimeAsset(uuid: string): Promise<RuntimeSpriteAsset | null> {
  return loadAnyRequest({ uuid }).catch(() => loadAnyRequest(uuid));
}

function loadAnyRequest(request: string | { uuid: string }): Promise<RuntimeSpriteAsset | null> {
  return new Promise((resolve, reject) => {
    assetManager.loadAny(request, (error: Error | null, asset: RuntimeSpriteAsset | null) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(asset ?? null);
    });
  });
}

async function loadRuntimeSpriteFrameFromPath(key: RuntimeSpriteAssetKey): Promise<SpriteFrame | null> {
  const finalPath = runtimeAssetPathById.get(key);
  if (!finalPath) {
    return null;
  }

  for (const path of getRuntimeAssetPathCandidates(finalPath)) {
    const spriteFrame = await loadRemoteImageAsset(path);
    if (spriteFrame) {
      return spriteFrame;
    }
  }

  return null;
}

function getRuntimeAssetPathCandidates(finalPath: string): string[] {
  const normalizedPath = finalPath.replace(/\\/g, '/');
  const pathWithoutAssetsPrefix = normalizedPath.startsWith('assets/')
    ? normalizedPath.slice('assets/'.length)
    : normalizedPath;

  return Array.from(new Set([
    normalizedPath,
    `/${normalizedPath}`,
    pathWithoutAssetsPrefix,
    `/${pathWithoutAssetsPrefix}`,
  ]));
}

function loadRemoteImageAsset(path: string): Promise<SpriteFrame | null> {
  return new Promise((resolve) => {
    assetManager.loadRemote<ImageAsset>(path, { ext: '.png' }, (error: Error | null, imageAsset: ImageAsset | null) => {
      if (error) {
        resolve(null);
        return;
      }

      resolve(toSpriteFrame(imageAsset));
    });
  });
}

function toSpriteFrame(asset: RuntimeSpriteAsset | null): SpriteFrame | null {
  if (asset instanceof SpriteFrame) {
    return asset;
  }

  if (asset instanceof Texture2D) {
    const spriteFrame = new SpriteFrame();
    spriteFrame.reset({ texture: asset }, true);
    return spriteFrame;
  }

  if (asset instanceof ImageAsset) {
    return SpriteFrame.createWithImage(asset);
  }

  return null;
}

function warnOnce(key: RuntimeSpriteAssetKey, uuid: string, reason: unknown): void {
  const warnKey = `${key}:${uuid}`;
  if (warnedKeys.has(warnKey)) {
    return;
  }

  warnedKeys.add(warnKey);
  console.warn(`[RuntimeSpriteLoader] Failed to load runtime sprite "${key}" (${uuid}).`, reason);
}
