import { CSSProperties } from 'react';

import { Dimensions, Position, CssStyle, STORAGE_KEYS } from '../types/common';
import { defaultDimensions, defaultPosition, defaultStyle } from '../types/defaults';
// Storage keys for Chrome extension storage


// Interface for serialized widget (component stored as string)
export interface SerializedWidget {
    id: string;
    allowMultiples: boolean;
    component: string; // Stored as widget type ID or component name
    props?: Record<string, any>;
    dimensions: Dimensions;
    position: Position;
    style: CssStyle;
}

// Interface for saved data
export interface SavedData {
    widgets: SerializedWidget[];
    backgroundImage: string;
    isLocked: boolean;
    timestamp: number;
}
export interface Defaults {
    styling: CssStyle
    positioning: Position,
    dimensions: Dimensions
}
/**
 * Chrome Extension Storage Utility
 * Uses chrome.storage.local for persistent data storage
 */
export const chromeStorage = {
    // Save widget data
    saveWidgets: async (widgets: SerializedWidget[]): Promise<boolean> => {
        console.log('Saving widgets to Chrome storage:', widgets);
        try {
            await chrome.storage.local.set({
                [STORAGE_KEYS.WIDGETS]: widgets
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
            await chrome.storage.local.set({
                [STORAGE_KEYS.BACKGROUND]: backgroundImage
            });
            return true;
        } catch (error) {
            console.error('Failed to save background to Chrome storage:', error);
            return false;
        }
    },

    // Load background image
    loadBackground: async (): Promise<string> => {
        try {
            const result = await chrome.storage.local.get(STORAGE_KEYS.BACKGROUND);
            return result[STORAGE_KEYS.BACKGROUND] || '';
        } catch (error) {
            console.error('Failed to load background from Chrome storage:', error);
            return '';
        }
    },

    // Save lock state
    saveLockState: async (isLocked: boolean): Promise<boolean> => {
        try {
            await chrome.storage.local.set({
                [STORAGE_KEYS.LOCK_STATE]: isLocked
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
                [STORAGE_KEYS.BACKGROUND]: data.backgroundImage,
                [STORAGE_KEYS.LOCK_STATE]: data.isLocked
            });
            return true;
        } catch (error) {
            console.error('Failed to save all data to Chrome storage:', error);
            return false;
        }
    },

    // Load all data at once
    loadAll: async (): Promise<SavedData> => {
        try {
            const result = await chrome.storage.local.get([
                STORAGE_KEYS.WIDGETS,
                STORAGE_KEYS.BACKGROUND,
                STORAGE_KEYS.LOCK_STATE,
            ]);

            return {
                widgets: result[STORAGE_KEYS.WIDGETS] || [],
                backgroundImage: result[STORAGE_KEYS.BACKGROUND] || '',
                isLocked: result[STORAGE_KEYS.LOCK_STATE] || false,
                timestamp: Date.now()
            };
        } catch (error) {
            console.error('Failed to load all data from Chrome storage:', error);
            return {
                widgets: [],
                backgroundImage: '',
                isLocked: false,
                timestamp: Date.now()
            };
        }
    },
    // Save all data at once
    saveAllDefaults: async (data: Defaults): Promise<boolean> => {
        try {
            await chrome.storage.local.set({
                [STORAGE_KEYS.DEFAULT_STYLING]: data.styling
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
                STORAGE_KEYS.DEFAULT_DIMENSIONS
            ]);

            return {
                styling: result[STORAGE_KEYS.DEFAULT_STYLING],
                positioning: result[STORAGE_KEYS.DEFAULT_POSITION],
                dimensions: result[STORAGE_KEYS.DEFAULT_DIMENSIONS]
            };
        } catch (error) {
            console.error('Failed to load all defaults from Chrome storage:', error);
            return {
                styling: defaultStyle,
                positioning: defaultPosition,
                dimensions: defaultDimensions
            };
        }
    },
    // Clear all data
    clearAll: async (): Promise<boolean> => {
        try {
            await chrome.storage.local.remove([
                STORAGE_KEYS.WIDGETS,
                STORAGE_KEYS.BACKGROUND,
                STORAGE_KEYS.LOCK_STATE
            ]);
            return true;
        } catch (error) {
            console.error('Failed to clear Chrome storage:', error);
            return false;
        }
    },

    // Generic get method for custom data
    get: async (key: string): Promise<any> => {
        try {
            const result = await chrome.storage.local.get(key);
            return result;
        } catch (error) {
            console.error(`Failed to get ${key} from Chrome storage:`, error);
            return {};
        }
    },

    // Generic set method for custom data
    set: async (key: string, value: any): Promise<boolean> => {
        try {
            await chrome.storage.local.set({ [key]: value });
            return true;
        } catch (error) {
            console.error(`Failed to set ${key} in Chrome storage:`, error);
            return false;
        }
    },

    // Save website counter data
    saveWebsiteCounters: async (counters: any[]): Promise<boolean> => {
        try {
            await chrome.storage.local.set({
                'websiteCounters': counters
            });
            return true;
        } catch (error) {
            console.error('Failed to save website counters to Chrome storage:', error);
            return false;
        }
    },

    // Load website counter data
    loadWebsiteCounters: async (): Promise<any[]> => {
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
                quotaBytes
            };
        } catch (error) {
            console.error('Failed to get storage info:', error);
            return {
                bytesInUse: 0,
                quotaBytes: 10 * 1024 * 1024
            };
        }
    },

    // Listen for storage changes
    onChanged: (callback: (changes: { [key: string]: chrome.storage.StorageChange }) => void) => {
        chrome.storage.onChanged.addListener((changes, areaName) => {
            if (areaName === 'local') {
                callback(changes);
            }
        });
    }
};

export default chromeStorage;