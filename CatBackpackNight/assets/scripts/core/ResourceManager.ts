import { Asset, assetManager, AssetManager, AudioClip, JsonAsset, resources, SpriteFrame } from 'cc';

type AssetConstructor<T extends Asset> = new (...args: any[]) => T;

export interface AssetIndexEntry {
  id: string;
  assetType: string;
  placeholderPath?: string | null;
  finalPath?: string | null;
  bundle?: string | null;
  loadPolicy?: string;
}

export interface AssetIndexDocument {
  assets?: AssetIndexEntry[];
}

export class ResourceManager {
  private static singleton: ResourceManager | null = null;
  private assetIndex = new Map<string, AssetIndexEntry>();
  private cache = new Map<string, Asset>();
  private bundles = new Map<string, AssetManager.Bundle>();

  public static get instance(): ResourceManager {
    if (!ResourceManager.singleton) {
      ResourceManager.singleton = new ResourceManager();
    }
    return ResourceManager.singleton;
  }

  public registerAssetIndex(index: AssetIndexDocument): void {
    for (const entry of index.assets ?? []) {
      this.assetIndex.set(entry.id, entry);
    }
  }

  public async loadJson<T = unknown>(keyOrPath: string, bundleName = 'resources'): Promise<T | null> {
    const asset = await this.load<JsonAsset>(keyOrPath, JsonAsset, bundleName);
    return (asset?.json as T) ?? null;
  }

  public async loadSpriteFrame(keyOrPath: string, bundleName?: string): Promise<SpriteFrame | null> {
    return this.load<SpriteFrame>(keyOrPath, SpriteFrame, bundleName);
  }

  public async loadAudioClip(keyOrPath: string, bundleName?: string): Promise<AudioClip | null> {
    return this.load<AudioClip>(keyOrPath, AudioClip, bundleName);
  }

  public async load<T extends Asset>(keyOrPath: string, type: AssetConstructor<T>, bundleName?: string): Promise<T | null> {
    const resolved = this.resolve(keyOrPath, bundleName);
    const isSpriteFrame = type === (SpriteFrame as unknown as AssetConstructor<T>);
    const loadPath = isSpriteFrame && !resolved.path.endsWith('/spriteFrame') ? `${resolved.path}/spriteFrame` : resolved.path;
    const cacheKey = `${resolved.bundleName}:${loadPath}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached as T;
    }

    const bundle = await this.getBundle(resolved.bundleName);
    if (!bundle) {
      return null;
    }

    return new Promise<T | null>((resolve) => {
      bundle.load(loadPath, type, (error: Error | null, asset: T | null) => {
        if (error || !asset) {
          console.warn(`[ResourceManager] Failed to load ${cacheKey}`, error);
          resolve(null);
          return;
        }
        this.cache.set(cacheKey, asset);
        resolve(asset as T);
      });
    });
  }

  public preload(keys: string[], bundleName?: string): Promise<(Asset | null)[]> {
    return Promise.all(keys.map((key) => this.load(key, Asset, bundleName)));
  }

  public release(keyOrPath: string, bundleName?: string): void {
    const resolved = this.resolve(keyOrPath, bundleName);
    const cacheKey = `${resolved.bundleName}:${resolved.path}`;
    const spriteFrameCacheKey = `${resolved.bundleName}:${resolved.path}/spriteFrame`;
    const asset = this.cache.get(cacheKey);
    const spriteFrameAsset = this.cache.get(spriteFrameCacheKey);
    if (!asset && !spriteFrameAsset) {
      return;
    }
    if (asset) {
      assetManager.releaseAsset(asset);
    }
    if (spriteFrameAsset) {
      assetManager.releaseAsset(spriteFrameAsset);
    }
    this.cache.delete(cacheKey);
    this.cache.delete(spriteFrameCacheKey);
  }

  public clearCache(): void {
    for (const asset of this.cache.values()) {
      assetManager.releaseAsset(asset);
    }
    this.cache.clear();
  }

  private async getBundle(bundleName: string): Promise<AssetManager.Bundle | null> {
    if (bundleName === 'resources') {
      return resources;
    }
    const cached = this.bundles.get(bundleName);
    if (cached) {
      return cached;
    }
    return new Promise<AssetManager.Bundle | null>((resolve) => {
      assetManager.loadBundle(bundleName, (error: Error | null, bundle: AssetManager.Bundle | null) => {
        if (error || !bundle) {
          console.warn(`[ResourceManager] Failed to load bundle ${bundleName}`, error);
          resolve(null);
          return;
        }
        this.bundles.set(bundleName, bundle);
        resolve(bundle);
      });
    });
  }

  private resolve(keyOrPath: string, bundleName?: string): { path: string; bundleName: string } {
    const entry = this.assetIndex.get(keyOrPath);
    const rawPath = entry?.finalPath || entry?.placeholderPath || keyOrPath;
    const resolvedBundle = bundleName ?? entry?.bundle ?? 'resources';
    return {
      path: this.normalizeCocosPath(rawPath),
      bundleName: resolvedBundle,
    };
  }

  private normalizeCocosPath(path: string): string {
    return path
      .replace(/\\/g, '/')
      .replace(/^assets\/resources\//, '')
      .replace(/^assets\//, '')
      .replace(/\.(png|jpg|jpeg|webp|json|mp3|wav|ogg)$/i, '');
  }
}

export const resourceManager = ResourceManager.instance;
