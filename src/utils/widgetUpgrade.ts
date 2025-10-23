import { SerializedWidget } from './chromeStorage';
import { STORAGE_KEYS } from '../types/common';
import manifest from '../../manifest.json';
import widgetRegistry from './widgetRegistry';

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
const VERSION_HISTORY = ['1.0.0', '1.1.0', '1.2.0', '1.3.0', '1.4.0', '1.5.0', manifest.version];

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
  // Set the new version
  await setStoredVersion(CURRENT_VERSION);

  return {
    upgraded: true,
    widgets: upgradedWidgets,
    changes,
  };
};

/**
 * Apply upgrade logic for a specific version
 */
function applyVersionUpgrade(
  widgets: SerializedWidget[],
  targetVersion: string,
  changes: string[]
): SerializedWidget[] {
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
    case '1.6.0':
      return upgradeTo_1_6_0(widgets, changes);
    default:
      return widgets;
  }
}

/**
 * Upgrade to version 1.1.0
 * - Added autoRefresh and refreshInterval props to GitHub widgets
 */
function upgradeTo_1_1_0(widgets: SerializedWidget[], changes: string[]): SerializedWidget[] {
  return widgets.map((widget) => {
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
  return widgets.map((widget) => {
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
  return widgets.map((widget) => {
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
  return widgets.map((widget) => {
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
    'live-clock',
    'quick-actions',
    'github-widget',
    'git-comment-watcher',
    'website-counter',
    'sprint-number',
  ]);

  return widgets.map((widget) => {
    // Ensure isRuntimeVisible is set based on component type
    if (widget.isRuntimeVisible === undefined) {
      const isVisible = runtimeVisibleWidgets.has(widget.component);
      widget.isRuntimeVisible = isVisible;
      // check if the widgets name starts with "Unknown Widget"
      if (widget.name.startsWith('Unknown Widget')) {
        // split the widgetid by - and concat the till you find a number
        const nameParts = widget.id.split('-');
        let properName = '';
        for (const part of nameParts) {
          if (isNaN(Number(part))) {
            properName += `-${part}`;
          } else {
            break;
          }
        }
        const res = widgetRegistry.getComponentNameByKey(properName.slice(1));
        widget.name = res;
      }
      changes.push(`Added isRuntimeVisible=${isVisible} to ${widget.name} (${widget.id})`);
    }
    if (widget.component === 'quick-actions') {
      if (!widget.props) widget.props = {};
      const reg = widgetRegistry.findByComponentName('QuickActionButtons');
      if (reg && reg.defaultProps) {
        // Merge defaultProps with widget.props, giving priority to widget.props
        widget.props = {
          ...reg.defaultProps,
          ...widget.props,
        };
        changes.push(`Merged defaultProps into props for ${widget.name} (${widget.id})`);
      }
    }

    if (widget.component === 'live-clock') {
      if (!widget.props) widget.props = {};
      const reg = widgetRegistry.findByComponentName('LiveClock');
      if (reg && reg.defaultProps) {
        // Merge defaultProps with widget.props, giving priority to widget.props
        widget.props = {
          ...reg.defaultProps,
          ...widget.props,
        };
        changes.push(`Merged defaultProps into props for ${widget.name} (${widget.id})`);
      }
    }

    if (widget.component === 'sprint-number') {
      if (!widget.props) widget.props = {};
      const reg = widgetRegistry.findByComponentName('SprintNumber');
      if (reg && reg.defaultProps) {
        // Merge defaultProps with widget.props, giving priority to widget.props
        widget.props = {
          ...reg.defaultProps,
          ...widget.props,
        };
        changes.push(`Merged defaultProps into props for ${widget.name} (${widget.id})`);
      }
    }
    if (widget.component === 'locale-selector') {
      if (!widget.props) widget.props = {};

      const reg = widgetRegistry.findByComponentName('LocaleWidget');
      if (reg && reg.defaultProps) {
        widget.props = {
          ...reg.defaultProps,
          ...widget.props,
        };
        changes.push(`Merged defaultProps into props for ${widget.name} (${widget.id})`);
      }
    }

    if (widget.component === 'website-counter') {
      if (!widget.props) widget.props = {};

      const reg = widgetRegistry.findByComponentName('WebsiteCounter');
      if (reg && reg.defaultProps) {
        widget.props = {
          ...reg.defaultProps,
          ...widget.props,
        };
        changes.push(`Merged defaultProps into props for ${widget.name} (${widget.id})`);
      }
    }

    if (widget.component === 'git-comment-watcher') {
      if (!widget.props) widget.props = {};

      const reg = widgetRegistry.findByComponentName('GitCommentWatcher');
      if (reg && reg.defaultProps) {
        widget.props = {
          ...reg.defaultProps,
          ...widget.props,
        };
        changes.push(`Merged defaultProps into props for ${widget.name} (${widget.id})`);
      }
    }
    if (widget.component === 'github-widget') {
      if (!widget.props) widget.props = {};

      const reg = widgetRegistry.findByComponentName('GitHubWidget');
      if (reg && reg.defaultProps) {
        widget.props = {
          ...reg.defaultProps,
          ...widget.props,
        };
        changes.push(`Merged defaultProps into props for ${widget.name} (${widget.id})`);
      }
    }
    if (widget.component === 'background-manager') {
      if (!widget.props) widget.props = {};

      const reg = widgetRegistry.findByComponentName('BackgroundManager');
      if (reg && reg.defaultProps) {
        widget.props = {
          ...reg.defaultProps,
          ...widget.props,
        };
        changes.push(`Merged defaultProps into props for ${widget.name} (${widget.id})`);
      }
    }

    return widget;
  });
}
function upgradeTo_1_6_0(widgets: SerializedWidget[], changes: string[]): SerializedWidget[] {
  return widgets.map((widget) => {
    if (widget.component === 'github-widget') {
      // get all the props and set default values if missing
      if (!widget.props) widget.props = {};
      if (widget.props.autoRefresh === undefined) {
        widget.props.autoRefresh = true;
        changes.push(`Set default autoRefresh=true for ${widget.name} (${widget.id})`);
      }
      if (widget.props.refreshInterval === undefined) {
        widget.props.refreshInterval = 5;
        changes.push(`Set default refreshInterval=5 for ${widget.name} (${widget.id})`);
      }
    }
    return widget;
  });
}
