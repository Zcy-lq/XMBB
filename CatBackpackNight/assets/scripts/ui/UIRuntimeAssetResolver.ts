import uiAssetContract from '../../configs/ui_asset_contract.json';
import runtimeAssetIndex from '../../configs/assets_runtime.json';
import { RuntimeSpriteAssets, RuntimeSpriteAssetKey } from './RuntimeSpriteAssets';

type NullableRuntimeId = string | null | undefined;

interface UIAssetContractEntry {
  productKey: string;
  currentRuntimeId?: NullableRuntimeId;
  finalRuntimeId?: NullableRuntimeId;
}

interface UIAssetContractConfig {
  entries?: UIAssetContractEntry[];
}

interface RuntimeAssetIndexEntry {
  id: string;
}

interface RuntimeAssetIndexConfig {
  assets?: RuntimeAssetIndexEntry[];
}

const contractEntries = (uiAssetContract as UIAssetContractConfig).entries ?? [];
const runtimeIndexEntries = (runtimeAssetIndex as RuntimeAssetIndexConfig).assets ?? [];
const contractByProductKey = new Map(contractEntries.map((entry) => [entry.productKey, entry]));
const indexedRuntimeIds = new Set(runtimeIndexEntries.map((entry) => entry.id));

function hasRuntimeSprite(runtimeId: NullableRuntimeId): runtimeId is RuntimeSpriteAssetKey {
  return typeof runtimeId === 'string' && runtimeId in RuntimeSpriteAssets;
}

function hasRuntimeIndex(runtimeId: NullableRuntimeId): runtimeId is string {
  return typeof runtimeId === 'string' && indexedRuntimeIds.has(runtimeId);
}

export function resolveUIRuntimeSpriteKey(productKey: string): RuntimeSpriteAssetKey | undefined {
  const entry = contractByProductKey.get(productKey);
  if (!entry) {
    return undefined;
  }

  if (hasRuntimeSprite(entry.finalRuntimeId)) {
    return entry.finalRuntimeId;
  }

  if (hasRuntimeSprite(entry.currentRuntimeId)) {
    return entry.currentRuntimeId;
  }

  return undefined;
}

export function getUIRuntimeAssetStatus(productKey: string): {
  productKey: string;
  finalRuntimeId?: string;
  currentRuntimeId?: string;
  finalIndexed: boolean;
  currentIndexed: boolean;
  resolvedRuntimeId?: RuntimeSpriteAssetKey;
} | null {
  const entry = contractByProductKey.get(productKey);
  if (!entry) {
    return null;
  }

  return {
    productKey,
    finalRuntimeId: entry.finalRuntimeId ?? undefined,
    currentRuntimeId: entry.currentRuntimeId ?? undefined,
    finalIndexed: hasRuntimeIndex(entry.finalRuntimeId),
    currentIndexed: hasRuntimeIndex(entry.currentRuntimeId),
    resolvedRuntimeId: resolveUIRuntimeSpriteKey(productKey),
  };
}
