import { DashboardWidget } from '../types/common';

// Storage keys
const STORAGE_KEYS = {
    WIDGETS: 'quantum-tab-widgets',
    BACKGROUND: 'quantum-tab-background',
    LOCK_STATE: 'quantum-tab-lock-state'
};

// Interface for saved data
export interface SavedData {
    widgets: DashboardWidget[];
    backgroundImage: string;
    isLocked: boolean;
    timestamp: number;
}

// Utility functions for localStorage operations
export const localStorage = {
    // Save widget data
    saveWidgets: (widgets: DashboardWidget[]): boolean => {
        try {
            const serializedWidgets = JSON.stringify(widgets);
            window.localStorage.setItem(STORAGE_KEYS.WIDGETS, serializedWidgets);
            return true;
        } catch (error) {
            console.error('Failed to save widgets to localStorage:', error);
            return false;
        }
    },

    // Load widget data
    loadWidgets: (): DashboardWidget[] | null => {
        try {
            const serializedWidgets = window.localStorage.getItem(STORAGE_KEYS.WIDGETS);
            if (serializedWidgets) {
                return JSON.parse(serializedWidgets);
            }
            return null;
        } catch (error) {
            console.error('Failed to load widgets from localStorage:', error);
            return null;
        }
    },

    // Save background image
    saveBackground: (backgroundImage: string): boolean => {
        try {
            window.localStorage.setItem(STORAGE_KEYS.BACKGROUND, backgroundImage);
            return true;
        } catch (error) {
            console.error('Failed to save background to localStorage:', error);
            return false;
        }
    },

    // Load background image
    loadBackground: (): string | null => {
        try {
            return window.localStorage.getItem(STORAGE_KEYS.BACKGROUND);
        } catch (error) {
            console.error('Failed to load background from localStorage:', error);
            return null;
        }
    },

    // Save lock state
    saveLockState: (isLocked: boolean): boolean => {
        try {
            window.localStorage.setItem(STORAGE_KEYS.LOCK_STATE, JSON.stringify(isLocked));
            return true;
        } catch (error) {
            console.error('Failed to save lock state to localStorage:', error);
            return false;
        }
    },

    // Load lock state
    loadLockState: (): boolean | null => {
        try {
            const lockState = window.localStorage.getItem(STORAGE_KEYS.LOCK_STATE);
            if (lockState !== null) {
                return JSON.parse(lockState);
            }
            return null;
        } catch (error) {
            console.error('Failed to load lock state from localStorage:', error);
            return null;
        }
    },

    // Save all data at once
    saveAll: (data: SavedData): boolean => {
        try {
            const success = [
                localStorage.saveWidgets(data.widgets),
                localStorage.saveBackground(data.backgroundImage),
                localStorage.saveLockState(data.isLocked)
            ];
            return success.every(s => s);
        } catch (error) {
            console.error('Failed to save all data to localStorage:', error);
            return false;
        }
    },

    // Load all data at once
    loadAll: (): SavedData | null => {
        try {
            const widgets = localStorage.loadWidgets();
            const backgroundImage = localStorage.loadBackground();
            const isLocked = localStorage.loadLockState();

            if (widgets !== null) {
                return {
                    widgets,
                    backgroundImage: backgroundImage || '',
                    isLocked: isLocked !== null ? isLocked : false,
                    timestamp: Date.now()
                };
            }
            return null;
        } catch (error) {
            console.error('Failed to load all data from localStorage:', error);
            return null;
        }
    },

    // Clear all saved data
    clearAll: (): boolean => {
        try {
            Object.values(STORAGE_KEYS).forEach(key => {
                window.localStorage.removeItem(key);
            });
            return true;
        } catch (error) {
            console.error('Failed to clear localStorage:', error);
            return false;
        }
    },

    // Check if localStorage is available
    isAvailable: (): boolean => {
        try {
            const test = '__localStorage_test__';
            window.localStorage.setItem(test, test);
            window.localStorage.removeItem(test);
            return true;
        } catch (error) {
            return false;
        }
    },

    // Get storage usage info
    getStorageInfo: () => {
        try {
            const widgets = window.localStorage.getItem(STORAGE_KEYS.WIDGETS);
            const background = window.localStorage.getItem(STORAGE_KEYS.BACKGROUND);
            const lockState = window.localStorage.getItem(STORAGE_KEYS.LOCK_STATE);

            return {
                widgetsSize: widgets ? new Blob([widgets]).size : 0,
                backgroundSize: background ? new Blob([background]).size : 0,
                lockStateSize: lockState ? new Blob([lockState]).size : 0,
                totalSize: [widgets, background, lockState]
                    .filter(Boolean)
                    .reduce((total, item) => total + new Blob([item!]).size, 0)
            };
        } catch (error) {
            console.error('Failed to get storage info:', error);
            return null;
        }
    }
};

export default localStorage;