import { SerializedWidget } from './chromeStorage';
import { STORAGE_KEYS } from '../types/common';
import manifest from '../../manifest.json';

/**
 * Widget Upgrade System
 * Handles upgrading stored widget data when new versions are installed
 */

export interface UpgradeResult {
  upgraded: boolean;
  widgets: SerializedWidget[];
  changes: string[];
}

// Current version - should match manifest.json
// Dynamically read CURRENT_VERSION from manifest.json

const CURRENT_VERSION: string = manifest.version;

// Version history for upgrade paths
const VERSION_HISTORY = [
  '1.0.0',
  '1.1.0',
  '1.2.0',
  '1.3.0',
  '1.4.0',
  '1.5.0',
  manifest.version
];

/**
 * Get stored version from chrome storage
 */
export const getStoredVersion = async (): Promise<string | null> => {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEYS.VERSION);
    return result[STORAGE_KEYS.VERSION] || null;
  } catch (error) {
    console.error('Failed to get stored version:', error);
    return null;
  }
};

/**
 * Set current version in chrome storage
 */
export const setStoredVersion = async (version: string): Promise<boolean> => {
  try {
    await chrome.storage.local.set({ [STORAGE_KEYS.VERSION]: version });
    return true;
  } catch (error) {
    console.error('Failed to set stored version:', error);
    return false;
  }
};

/**
 * Check if upgrade is needed
 */
export const needsUpgrade = async (): Promise<boolean> => {
  const storedVersion = await getStoredVersion();
  return !storedVersion || storedVersion !== CURRENT_VERSION;
};

/**
 * Upgrade widgets from old version to current version
 */
export const upgradeWidgets = async (widgets: SerializedWidget[]): Promise<UpgradeResult> => {
  const storedVersion = await getStoredVersion();
  const changes: string[] = [];
  if (!storedVersion) {
    changes.push('No stored version found - performing initial setup');
  } else if (storedVersion === CURRENT_VERSION ) {
    return { upgraded: false, widgets, changes: [] };
  }

  let upgradedWidgets = [...widgets];

  // Apply upgrades based on version progression
  const currentVersionIndex = VERSION_HISTORY.indexOf(CURRENT_VERSION);
  const storedVersionIndex = storedVersion ? VERSION_HISTORY.indexOf(storedVersion) : -1;

  // Apply all upgrades from stored version to current
  for (let i = storedVersionIndex + 1; i <= currentVersionIndex; i++) {
    const targetVersion = VERSION_HISTORY[i];
    upgradedWidgets = await applyVersionUpgrade(upgradedWidgets, targetVersion, changes);
  }
  // Set the new version
  await setStoredVersion(CURRENT_VERSION);

  return {
    upgraded: true,
    widgets: upgradedWidgets,
    changes
  };
};

/**
 * Apply upgrade logic for a specific version
 */
async function applyVersionUpgrade(widgets: SerializedWidget[], targetVersion: string): Promise<SerializedWidget[]> {
  switch (targetVersion) {
    default:
      return widgets;
  }
}