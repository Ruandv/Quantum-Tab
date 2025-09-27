import { DashboardWidget, SavedData, StorageInfo, STORAGE_KEYS } from '../types/common';

class StorageManager {
  private static instance: StorageManager;
  private isAvailable: boolean;

  private constructor() {
    this.isAvailable = this.checkAvailability();
  }

  public static getInstance(): StorageManager {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager();
    }
    return StorageManager.instance;
  }

  private checkAvailability(): boolean {
    try {
      const test = '__localStorage_test__';
      window.localStorage.setItem(test, test);
      window.localStorage.removeItem(test);
      return true;
    } catch {
      console.warn('localStorage is not available');
      return false;
    }
  }

  private serialize<T>(data: T): string {
    try {
      return JSON.stringify(data);
    } catch (error) {
      console.error('Failed to serialize data:', error);
      throw new Error('Serialization failed');
    }
  }

  private deserialize<T>(data: string): T {
    try {
      return JSON.parse(data);
    } catch (error) {
      console.error('Failed to deserialize data:', error);
      throw new Error('Deserialization failed');
    }
  }

  private set(key: string, value: string): boolean {
    if (!this.isAvailable) return false;
    
    try {
      window.localStorage.setItem(key, value);
      return true;
    } catch (error) {
      if (error instanceof DOMException && error.code === 22) {
        console.warn('Storage quota exceeded');
      } else {
        console.error('Failed to save to localStorage:', error);
      }
      return false;
    }
  }

  private get(key: string): string | null {
    if (!this.isAvailable) return null;
    
    try {
      return window.localStorage.getItem(key);
    } catch (error) {
      console.error('Failed to read from localStorage:', error);
      return null;
    }
  }

  public saveWidgets(widgets: DashboardWidget[]): boolean {
    // Transform widgets for storage (convert component references to names)
    const serializedWidgets = widgets.map(widget => ({
      ...widget,
      component: { name: widget.component.name }
    }));
    
    const data = this.serialize(serializedWidgets);
    return this.set(STORAGE_KEYS.WIDGETS, data);
  }

  public loadWidgets(): DashboardWidget[] | null {
    const data = this.get(STORAGE_KEYS.WIDGETS);
    if (!data) return null;
    
    try {
      return this.deserialize<DashboardWidget[]>(data);
    } catch {
      return null;
    }
  }

  public saveBackground(backgroundImage: string): boolean {
    return this.set(STORAGE_KEYS.BACKGROUND, backgroundImage);
  }

  public loadBackground(): string | null {
    return this.get(STORAGE_KEYS.BACKGROUND);
  }

  public saveLockState(isLocked: boolean): boolean {
    return this.set(STORAGE_KEYS.LOCK_STATE, this.serialize(isLocked));
  }

  public loadLockState(): boolean | null {
    const data = this.get(STORAGE_KEYS.LOCK_STATE);
    if (!data) return null;
    
    try {
      return this.deserialize<boolean>(data);
    } catch {
      return null;
    }
  }

  public saveAll(data: SavedData): boolean {
    const operations = [
      () => this.saveWidgets(data.widgets),
      () => this.saveBackground(data.backgroundImage),
      () => this.saveLockState(data.isLocked)
    ];

    return operations.every(op => op());
  }

  public loadAll(): SavedData | null {
    const widgets = this.loadWidgets();
    if (!widgets) return null;

    return {
      widgets,
      backgroundImage: this.loadBackground() || '',
      isLocked: this.loadLockState() ?? false,
      timestamp: Date.now()
    };
  }

  public clearAll(): boolean {
    if (!this.isAvailable) return false;

    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        window.localStorage.removeItem(key);
      });
      return true;
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
      return false;
    }
  }

  public getStorageInfo(): StorageInfo | null {
    if (!this.isAvailable) return null;

    try {
      const widgets = this.get(STORAGE_KEYS.WIDGETS) || '';
      const background = this.get(STORAGE_KEYS.BACKGROUND) || '';
      const lockState = this.get(STORAGE_KEYS.LOCK_STATE) || '';

      const widgetsSize = new Blob([widgets]).size;
      const backgroundSize = new Blob([background]).size;
      const lockStateSize = new Blob([lockState]).size;

      return {
        widgetsSize,
        backgroundSize,
        lockStateSize,
        totalSize: widgetsSize + backgroundSize + lockStateSize
      };
    } catch (error) {
      console.error('Failed to get storage info:', error);
      return null;
    }
  }

  public isStorageAvailable(): boolean {
    return this.isAvailable;
  }
}

// Export singleton instance
export const storageManager = StorageManager.getInstance();
export default storageManager;