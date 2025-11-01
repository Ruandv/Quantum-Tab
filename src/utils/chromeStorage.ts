import { Dimensions, Position, CssStyle, STORAGE_KEYS, WebsiteCounterData } from '../types/common';
import { defaultDimensions, defaultPosition, defaultStyle } from '../types/defaults';
// Storage keys for Chrome extension storage

// Interface for serialized widget (component stored as string)
export interface SerializedWidget {
  id: string;
  name: string;
  description: string;
  wikiPage: string;
  isRuntimeVisible?: boolean; // Made optional for backward compatibility
  allowMultiples: boolean;
  component: string; // Stored as widget type ID or component name
  props?: Record<string, unknown>;
  dimensions: Dimensions;
  position: Position;
  style: CssStyle;
  metaData?: Record<string, unknown>;
}

// Interface for saved data
export interface SavedData {
  widgets: SerializedWidget[];
  isLocked: boolean;
  timestamp: number;
  version: string;
}
export interface Defaults {
  styling: CssStyle;
  positioning: Position;
  dimensions: Dimensions;
}
/**
 * Chrome Extension Storage Utility
 * Uses chrome.storage.local for persistent data storage
 */
export const chromeStorage = {
  // Save widget data
  saveWidgets: async (widgets: SerializedWidget[]): Promise<boolean> => {
    try {
      await chrome.storage.local.set({
        [STORAGE_KEYS.WIDGETS]: widgets,
      });
      return true;
    } catch (error) {
      console.error('Failed to save widgets to Chrome storage:', error);
      return false;
    }
  },

  // Load widget data
  loadWidgets: async (): Promise<SerializedWidget[]> => {
    try {
      const result = await chrome.storage.local.get(STORAGE_KEYS.WIDGETS);
      return result[STORAGE_KEYS.WIDGETS] || [];
    } catch (error) {
      console.error('Failed to load widgets from Chrome storage:', error);
      return [];
    }
  },

  // Save background image
  saveBackground: async (backgroundImage: string): Promise<boolean> => {
    try {
      // find the backgroundManager widget and get its background from metaData
      const widgets = await chrome.storage.local.get(STORAGE_KEYS.WIDGETS);
      const backgroundManager = widgets[STORAGE_KEYS.WIDGETS].find((widget) => widget.component === 'background-manager');
      if (backgroundManager && backgroundManager.metaData) {
        backgroundManager.metaData.backgroundImage = backgroundImage;
      }
      else if (backgroundManager) {
        backgroundManager.metaData = { background: backgroundImage };
      }
      await chromeStorage.setWidgetData(backgroundManager.id, backgroundManager);
      return true;
    } catch (error) {
      console.error('Failed to save background to Chrome storage:', error);
      return false;
    }
  },

  // Load background image
  loadBackground: async (): Promise<string> => {
    try {
      // find the backgroundManager widget and get its background from metaData
      const widgets = await chrome.storage.local.get(STORAGE_KEYS.WIDGETS) as SerializedWidget[];
      const backgroundManager = widgets[STORAGE_KEYS.WIDGETS].find((widget) => widget.component === 'background-manager');
      return backgroundManager?.metaData?.backgroundImage || '';
    } catch (error) {
      console.warn('Failed to load background from Chrome storage:', error);
      return '';
    }
  },

  // Save lock state
  saveLockState: async (isLocked: boolean): Promise<boolean> => {
    try {
      await chrome.storage.local.set({
        [STORAGE_KEYS.LOCK_STATE]: isLocked,
      });
      return true;
    } catch (error) {
      console.error('Failed to save lock state to Chrome storage:', error);
      return false;
    }
  },

  // Load lock state
  loadLockState: async (): Promise<boolean> => {
    try {
      const result = await chrome.storage.local.get(STORAGE_KEYS.LOCK_STATE);
      return result[STORAGE_KEYS.LOCK_STATE] || false;
    } catch (error) {
      console.error('Failed to load lock state from Chrome storage:', error);
      return false;
    }
  },

  // Save all data at once
  saveAll: async (data: SavedData): Promise<boolean> => {
    try {
      await chrome.storage.local.set({
        [STORAGE_KEYS.WIDGETS]: data.widgets,
        [STORAGE_KEYS.LOCK_STATE]: data.isLocked,
        [STORAGE_KEYS.VERSION]: data.version
      });
      return true;
    } catch (error) {
      console.error('Failed to save all data to Chrome storage:', error);
      return false;
    }
  },

  getVersion: async (): Promise<string> => {
    try {
      const result = await chrome.storage.local.get(STORAGE_KEYS.VERSION);
      return result[STORAGE_KEYS.VERSION] || '1.0.0';
    }
    catch (error) {
      console.error('Failed to get version from Chrome storage:', error);
      return '1.0.0';
    }
  },

  saveVersion: async (version: string): Promise<string> => {
    try {
      await chrome.storage.local.set({ [STORAGE_KEYS.VERSION]: version });
      return version;
    }
    catch (error) {
      console.error('Failed to get version from Chrome storage:', error);
      return '1.0.0';
    }
  },

  // Load all data at once
  loadAll: async (): Promise<SavedData> => {
    try {
      const result = await chrome.storage.local.get([
        STORAGE_KEYS.WIDGETS,
        'quantum-tab-background',
        STORAGE_KEYS.LOCK_STATE,
        STORAGE_KEYS.VERSION
      ]);

      // Try to get the version from the manifest if available
      let version = result[STORAGE_KEYS.VERSION] || '1.0.0';
      if (typeof chrome !== 'undefined' && chrome.runtime?.getManifest) {
        try {
          version = chrome.runtime.getManifest().version || version;
        } catch {
          // fallback to existing version
        }
      }
      return {
        widgets: result[STORAGE_KEYS.WIDGETS] || [],
        backgroundImage: result['quantum-tab-background'] || '',
        isLocked: result[STORAGE_KEYS.LOCK_STATE] || false,
        version,
        timestamp: Date.now(),
      } as any;
    } catch (error) {
      console.error('Failed to load all data from Chrome storage:', error);
      return {
        widgets: [],
        isLocked: false,
        version: '1.0.0',
        timestamp: Date.now(),
      };
    }
  },
  // Save all data at once
  saveAllDefaults: async (data: Defaults): Promise<boolean> => {
    try {
      await chrome.storage.local.set({
        [STORAGE_KEYS.DEFAULT_STYLING]: data.styling,
      });
      return true;
    } catch (error) {
      console.error('Failed to save all defaults to Chrome storage:', error);
      return false;
    }
  },

  loadAllDefaults: async (): Promise<Defaults> => {
    try {
      const result = await chrome.storage.local.get([
        STORAGE_KEYS.DEFAULT_STYLING,
        STORAGE_KEYS.DEFAULT_POSITION,
        STORAGE_KEYS.DEFAULT_DIMENSIONS,
      ]);

      return {
        styling: result[STORAGE_KEYS.DEFAULT_STYLING],
        positioning: result[STORAGE_KEYS.DEFAULT_POSITION],
        dimensions: result[STORAGE_KEYS.DEFAULT_DIMENSIONS],
      };
    } catch (error) {
      console.error('Failed to load all defaults from Chrome storage:', error);
      return {
        styling: defaultStyle,
        positioning: defaultPosition,
        dimensions: defaultDimensions,
      };
    }
  },
  // Clear all data
  clearAll: async (): Promise<boolean> => {
    try {
      await chrome.storage.local.remove([
        STORAGE_KEYS.WIDGETS,
        STORAGE_KEYS.LOCK_STATE,
      ]);
      return true;
    } catch (error) {
      console.error('Failed to clear Chrome storage:', error);
      return false;
    }
  },
  getWidgetData: async (widgetId: string): Promise<Record<string, unknown>> => {
    try {
      const result = await chrome.storage.local.get(STORAGE_KEYS.WIDGETS);
      const w = result[STORAGE_KEYS.WIDGETS]?.find((widget) => widget.id === widgetId) || {};
      return w;

    } catch (error) {
      console.error(`Failed to get widget data for ${widgetId} from Chrome storage:`, error);
      return {};
    }
  },
  setWidgetData: async (widgetId: string, data: Record<string, unknown>): Promise<boolean> => {
    try {
      const result = await chrome.storage.local.get(STORAGE_KEYS.WIDGETS);
      const widgets: SerializedWidget[] = result[STORAGE_KEYS.WIDGETS] || [];
      const widgetIndex = widgets.findIndex((widget) => widget.id === widgetId);
      if (widgetIndex !== -1) {
        widgets[widgetIndex] = {
          ...widgets[widgetIndex],
          ...data,
        };
      }
      await chrome.storage.local.set({ [STORAGE_KEYS.WIDGETS]: widgets });
      return true;
    } catch (error) {
      console.error(`Failed to set widget data for ${widgetId} in Chrome storage:`, error);
      return false;
    }
  },

  // Generic get method for custom data
  get: async (key: string): Promise<Record<string, unknown>> => {
    try {
      const result = await chrome.storage.local.get(key);
      return result;
    } catch (error) {
      console.error(`Failed to get ${key} from Chrome storage:`, error);
      return {};
    }
  },

  // Generic set method for custom data
  set: async (key: string, value: unknown): Promise<boolean> => {
    try {
      await chrome.storage.local.set({ [key]: value });
      return true;
    } catch (error) {
      console.error(`Failed to set ${key} in Chrome storage:`, error);
      return false;
    }
  },

  // Save website counter data
  saveWebsiteCounters: async (counters: WebsiteCounterData[]): Promise<boolean> => {
    try {
      await chrome.storage.local.set({
        websiteCounters: counters,
      });
      return true;
    } catch (error) {
      console.error('Failed to save website counters to Chrome storage:', error);
      return false;
    }
  },

  // Load website counter data
  loadWebsiteCounters: async (): Promise<WebsiteCounterData[]> => {
    try {
      const result = await chrome.storage.local.get('websiteCounters');
      return result.websiteCounters || [];
    } catch (error) {
      console.error('Failed to load website counters from Chrome storage:', error);
      return [];
    }
  },

  // Get storage usage info
  getStorageInfo: async (): Promise<{ bytesInUse: number; quotaBytes: number }> => {
    try {
      const bytesInUse = await chrome.storage.local.getBytesInUse();
      // chrome.storage.local quota is typically around 10MB
      const quotaBytes = 10 * 1024 * 1024; // 10MB in bytes

      return {
        bytesInUse,
        quotaBytes,
      };
    } catch (error) {
      console.error('Failed to get storage info:', error);
      return {
        bytesInUse: 0,
        quotaBytes: 10 * 1024 * 1024,
      };
    }
  },

  setWidgetMetaData: async (widgetId: string, metaData: Record<string, unknown>): Promise<boolean> => {
    try {
      const result = await chrome.storage.local.get(STORAGE_KEYS.WIDGETS);
      const widgets: SerializedWidget[] = result[STORAGE_KEYS.WIDGETS] || [];
      const widgetIndex = widgets.findIndex((widget) => widget.id === widgetId);
      if (widgetIndex !== -1) {
        widgets[widgetIndex] = {
          ...widgets[widgetIndex],
          metaData: {
            ...widgets[widgetIndex].metaData,
            ...metaData,
          },
        };
      }
      await chrome.storage.local.set({ [STORAGE_KEYS.WIDGETS]: widgets });
      return true;
    } catch (error) {
      console.error(`Failed to set widget meta data for ${widgetId} in Chrome storage:`, error);
      return false;
    }
  },

  getWidgetMetaData: async (widgetId: string): Promise<Record<string, unknown>> => {
    try {
      const result = await chrome.storage.local.get(STORAGE_KEYS.WIDGETS);
      const widget = result[STORAGE_KEYS.WIDGETS].find((w) => w.id === widgetId);
      return widget ? widget.metaData : {};
    } catch (error) {
      console.error(`Failed to get widget meta data for ${widgetId} from Chrome storage:`, error);
      return {};
    }
  },

  // Listen for storage changes
  onChanged: (callback: (changes: { [key: string]: chrome.storage.StorageChange }) => void) => {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'local') {
        callback(changes);
      }
    });
  },
};

export default chromeStorage;
