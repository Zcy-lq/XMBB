import { JsonAsset } from 'cc';
import { ResourceManager } from '../core/ResourceManager';

export interface ConfigRow {
  id: string;
}

export class ConfigManager {
  private static singleton: ConfigManager | null = null;
  private tables = new Map<string, ConfigRow[]>();

  public static get instance(): ConfigManager {
    if (!ConfigManager.singleton) {
      ConfigManager.singleton = new ConfigManager();
    }
    return ConfigManager.singleton;
  }

  public registerTable<T extends ConfigRow>(tableName: string, rows: T[]): void {
    this.tables.set(tableName, rows);
  }

  public async loadTable<T extends ConfigRow>(tableName: string, path: string, bundleName = 'resources'): Promise<T[]> {
    const asset = await ResourceManager.instance.load<JsonAsset>(path, JsonAsset, bundleName);
    const rows = (Array.isArray(asset?.json) ? asset?.json : []) as T[];
    this.registerTable(tableName, rows);
    return rows;
  }

  public getTable<T extends ConfigRow>(tableName: string): T[] {
    return ((this.tables.get(tableName) ?? []) as T[]).slice();
  }

  public getById<T extends ConfigRow>(tableName: string, id: string): T | null {
    return (this.tables.get(tableName)?.find((row) => row.id === id) as T | undefined) ?? null;
  }

  public clear(): void {
    this.tables.clear();
  }
}

export const configManager = ConfigManager.instance;

