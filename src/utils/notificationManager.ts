// Utility functions for managing extension notifications

export interface NotificationData {
  type: 'install' | 'update';
  version: string;
  previousVersion?: string;
  timestamp: string;
}

export class NotificationManager {
  /**
   * Manually trigger a welcome notification (for testing)
   */
  static async triggerWelcomeNotification(): Promise<void> {
    const currentVersion = chrome.runtime.getManifest().version;
    await chrome.storage.sync.set({
      showWelcomeNotification: true,
      notificationPending: {
        type: 'install',
        version: currentVersion,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Manually trigger an update notification (for testing)
   */
  static async triggerUpdateNotification(previousVersion?: string): Promise<void> {
    const currentVersion = chrome.runtime.getManifest().version;
    await chrome.storage.sync.set({
      showUpdateNotification: true,
      notificationPending: {
        type: 'update',
        version: currentVersion,
        previousVersion: previousVersion || '1.0.1',
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Clear all pending notifications
   */
  static async clearNotifications(): Promise<void> {
    await chrome.storage.sync.set({
      showWelcomeNotification: false,
      showUpdateNotification: false,
      notificationPending: null
    });
  }

  /**
   * Check if there are any pending notifications
   */
  static async hasPendingNotifications(): Promise<boolean> {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['showWelcomeNotification', 'showUpdateNotification'], (result) => {
        resolve(result.showWelcomeNotification || result.showUpdateNotification);
      });
    });
  }

  /**
   * Get the current pending notification data
   */
  static async getPendingNotification(): Promise<NotificationData | null> {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['notificationPending'], (result) => {
        resolve(result.notificationPending || null);
      });
    });
  }
}

// NotificationManager will be available globally via NewTab component

export default NotificationManager;