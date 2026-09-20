import { AssetDefinition } from './assets.types';

// In-memory global store of available assets
const registry = new Map<string, AssetDefinition>();

/**
 * Registers an asset definition into the global registry.
 * Overwrites any existing asset with the same ID.
 */
export function registerAsset(asset: AssetDefinition): void {
  registry.set(asset.id, asset);
}

/**
 * Retrieves a specific asset definition by its ID.
 */
export function getAsset(id: string): AssetDefinition | undefined {
  return registry.get(id);
}

/**
 * Retrieves all registered asset definitions.
 */
export function getAllAssets(): AssetDefinition[] {
  return Array.from(registry.values());
}

/**
 * Clears the registry (useful for testing or hot reloading).
 */
export function clearRegistry(): void {
  registry.clear();
}
