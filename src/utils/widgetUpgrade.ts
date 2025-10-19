import { SerializedWidget } from './chromeStorage';
import { STORAGE_KEYS } from '../types/common';

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
const CURRENT_VERSION = '1.5.0';

// Version history for upgrade paths
const VERSION_HISTORY = [
  '1.0.0',
  '1.1.0',
  '1.2.0',
  '1.3.0',
  '1.4.0',
  '1.5.0'
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
  } else if (storedVersion === CURRENT_VERSION) {
    return { upgraded: false, widgets, changes: [] };
  }

  let upgradedWidgets = [...widgets];

  // Apply upgrades based on version progression
  const currentVersionIndex = VERSION_HISTORY.indexOf(CURRENT_VERSION);
  const storedVersionIndex = storedVersion ? VERSION_HISTORY.indexOf(storedVersion) : -1;

  // Apply all upgrades from stored version to current
  for (let i = storedVersionIndex + 1; i <= currentVersionIndex; i++) {
    const targetVersion = VERSION_HISTORY[i];
    upgradedWidgets = applyVersionUpgrade(upgradedWidgets, targetVersion, changes);
  }

  // Clean up deprecated props
  upgradedWidgets = cleanupDeprecatedProps(upgradedWidgets, changes);

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
function applyVersionUpgrade(widgets: SerializedWidget[], targetVersion: string, changes: string[]): SerializedWidget[] {
  switch (targetVersion) {
    case '1.1.0':
      return upgradeTo_1_1_0(widgets, changes);
    case '1.2.0':
      return upgradeTo_1_2_0(widgets, changes);
    case '1.3.0':
      return upgradeTo_1_3_0(widgets, changes);
    case '1.4.0':
      return upgradeTo_1_4_0(widgets, changes);
    case '1.5.0':
      return upgradeTo_1_5_0(widgets, changes);
    default:
      return widgets;
  }
}

/**
 * Upgrade to version 1.1.0
 * - Added autoRefresh and refreshInterval props to GitHub widgets
 */
function upgradeTo_1_1_0(widgets: SerializedWidget[], changes: string[]): SerializedWidget[] {
  return widgets.map(widget => {
    if (widget.component === 'GitHubWidget' || widget.component === 'GitCommentWatcher') {
      if (!widget.props) widget.props = {};

      // Add default autoRefresh and refreshInterval if missing
      if (widget.props.autoRefresh === undefined) {
        widget.props.autoRefresh = false;
        changes.push(`Added autoRefresh=false to ${widget.name} (${widget.id})`);
      }
      if (widget.props.refreshInterval === undefined) {
        widget.props.refreshInterval = 5;
        changes.push(`Added refreshInterval=5 to ${widget.name} (${widget.id})`);
      }
    }
    return widget;
  });
}

/**
 * Upgrade to version 1.2.0
 * - Added AI features to BackgroundManager
 */
function upgradeTo_1_2_0(widgets: SerializedWidget[], changes: string[]): SerializedWidget[] {
  return widgets.map(widget => {
    if (widget.component === 'BackgroundManager') {
      if (!widget.props) widget.props = {};

      // Add AI-related props
      if (widget.props.isAIEnabled === undefined) {
        widget.props.isAIEnabled = false;
        changes.push(`Added isAIEnabled=false to ${widget.name} (${widget.id})`);
      }
      if (widget.props.aiPrompt === undefined) {
        widget.props.aiPrompt = '';
        changes.push(`Added aiPrompt='' to ${widget.name} (${widget.id})`);
      }
      if (widget.props.aiKey === undefined) {
        widget.props.aiKey = '';
        changes.push(`Added aiKey='' to ${widget.name} (${widget.id})`);
      }
    }
    return widget;
  });
}

/**
 * Upgrade to version 1.3.0
 * - Added website counter features
 */
function upgradeTo_1_3_0(widgets: SerializedWidget[], changes: string[]): SerializedWidget[] {
  return widgets.map(widget => {
    if (widget.component === 'WebsiteCounter') {
      if (!widget.props) widget.props = {};

      // Add new website counter props
      if (widget.props.showFavicons === undefined) {
        widget.props.showFavicons = true;
        changes.push(`Added showFavicons=true to ${widget.name} (${widget.id})`);
      }
      if (widget.props.maxWebsites === undefined) {
        widget.props.maxWebsites = 10;
        changes.push(`Added maxWebsites=10 to ${widget.name} (${widget.id})`);
      }
      if (widget.props.sortBy === undefined) {
        widget.props.sortBy = 'count';
        changes.push(`Added sortBy='count' to ${widget.name} (${widget.id})`);
      }
    }
    return widget;
  });
}

/**
 * Upgrade to version 1.4.0
 * - Added locale widget features
 */
function upgradeTo_1_4_0(widgets: SerializedWidget[], changes: string[]): SerializedWidget[] {
  return widgets.map(widget => {
    if (widget.component === 'LocaleWidget') {
      if (!widget.props) widget.props = {};

      // Add locale selection
      if (widget.props.selectedLocale === undefined) {
        widget.props.selectedLocale = 'en';
        changes.push(`Added selectedLocale='en' to ${widget.name} (${widget.id})`);
      }
    }
    return widget;
  });
}

/**
 * Upgrade to version 1.5.0
 * - Added sprint number widget
 * - Enhanced live clock with more format options
 * - Ensure isRuntimeVisible property is set for all widgets
 */
function upgradeTo_1_5_0(widgets: SerializedWidget[], changes: string[]): SerializedWidget[] {
  // Define which widgets should be runtime visible
  const runtimeVisibleWidgets = new Set([
    'LiveClock',
    'QuickActionButtons',
    'GitHubWidget',
    'GitCommentWatcher',
    'WebsiteCounter',
    'SprintNumber'
  ]);

  return widgets.map(widget => {
    // Ensure isRuntimeVisible is set based on component type
    if (widget.isRuntimeVisible === undefined) {
      const isVisible = runtimeVisibleWidgets.has(widget.component);
      widget.isRuntimeVisible = isVisible;
      changes.push(`Added isRuntimeVisible=${isVisible} to ${widget.name} (${widget.id})`);
    }

    if (widget.component === 'LiveClock') {
      if (!widget.props) widget.props = {};

      // Add new time format options
      if (widget.props.showTime === undefined) {
        widget.props.showTime = true;
        changes.push(`Added showTime=true to ${widget.name} (${widget.id})`);
      }
      if (widget.props.showDate === undefined) {
        widget.props.showDate = true;
        changes.push(`Added showDate=true to ${widget.name} (${widget.id})`);
      }
      if (widget.props.showTimeZone === undefined) {
        widget.props.showTimeZone = false;
        changes.push(`Added showTimeZone=false to ${widget.name} (${widget.id})`);
      }
    }

    if (widget.component === 'SprintNumber') {
      if (!widget.props) widget.props = {};

      // Ensure sprint props are present
      if (widget.props.startDate === undefined) {
        widget.props.startDate = new Date().toISOString().split('T')[0];
        changes.push(`Added startDate to ${widget.name} (${widget.id})`);
      }
      if (widget.props.numberOfDays === undefined) {
        widget.props.numberOfDays = 14;
        changes.push(`Added numberOfDays=14 to ${widget.name} (${widget.id})`);
      }
      if (widget.props.currentSprint === undefined) {
        widget.props.currentSprint = 1;
        changes.push(`Added currentSprint=1 to ${widget.name} (${widget.id})`);
      }
    }

    return widget;
  });
}

/**
 * Clean up deprecated props that are no longer used
 */
function cleanupDeprecatedProps(widgets: SerializedWidget[], changes: string[]): SerializedWidget[] {
  const deprecatedProps = [
    'oldProp1', // Add deprecated prop names here
    'oldProp2',
  ];

  return widgets.map(widget => {
    if (widget.props) {
      let cleaned = false;
      deprecatedProps.forEach(prop => {
        if (widget.props && prop in widget.props) {
          delete widget.props[prop];
          changes.push(`Removed deprecated prop '${prop}' from ${widget.name} (${widget.id})`);
          cleaned = true;
        }
      });

      if (cleaned) {
        widget.props = { ...widget.props }; // Ensure immutability
      }
    }
    return widget;
  });
}