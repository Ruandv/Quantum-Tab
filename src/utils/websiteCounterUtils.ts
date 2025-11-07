import { WebsiteCounterData } from '../types/common';
import chromeStorage from './chromeStorage';

const CONTENT_SCRIPT_ID_PREFIX = 'website-counter-';

const getContentScriptId = (hostname: string): string => `${CONTENT_SCRIPT_ID_PREFIX}${hostname}`;

const getOriginPattern = (url: URL): string => `${url.protocol}//${url.hostname}/*`;

const ensureHostPermission = async (origin: string): Promise<boolean> => {
  if (!chrome?.permissions?.contains) {
    return true;
  }

  return new Promise((resolve) => {
    chrome.permissions.contains({ origins: [origin] }, (result) => {
      if (chrome.runtime?.lastError) {
        console.error('Failed to verify host permission:', chrome.runtime.lastError);
        resolve(false);
        return;
      }

      resolve(result);
    });
  });
};

const requestHostPermission = async (origin: string): Promise<boolean> => {
  if (!chrome?.permissions?.request) {
    return true;
  }

  return new Promise((resolve) => {
    chrome.permissions.request({ origins: [origin] }, (granted) => {
      if (chrome.runtime?.lastError) {
        console.error('Failed to request host permission:', chrome.runtime.lastError);
        resolve(false);
        return;
      }

      resolve(granted);
    });
  });
};

const registerContentScript = async (hostname: string, origin: string): Promise<boolean> => {
  if (!chrome?.scripting?.registerContentScripts || !chrome?.scripting?.getRegisteredContentScripts) {
    console.error('Scripting API is unavailable for registering content scripts.');
    return false;
  }

  try {
    const scriptId = getContentScriptId(hostname);
    const existing = await chrome.scripting.getRegisteredContentScripts({ ids: [scriptId] });

    if (existing.length > 0) {
      return true;
    }

    await chrome.scripting.registerContentScripts([
      {
        id: scriptId,
        js: ['content.js'],
        matches: [origin],
        runAt: 'document_idle',
        persistAcrossSessions: true,
      },
    ]);

    return true;
  } catch (error) {
    console.error('Failed to register content script:', error);
    return false;
  }
};

const unregisterContentScript = async (hostname: string): Promise<void> => {
  if (!chrome?.scripting?.unregisterContentScripts) {
    return;
  }

  try {
    await chrome.scripting.unregisterContentScripts({ ids: [getContentScriptId(hostname)] });
  } catch (error) {
    console.warn('Failed to unregister content script:', error);
  }
};

const removeHostPermission = async (origin: string): Promise<void> => {
  if (!chrome?.permissions?.remove) {
    return;
  }

  await new Promise<void>((resolve) => {
    chrome.permissions.remove({ origins: [origin] }, () => {
      if (chrome.runtime?.lastError) {
        console.warn('Failed to remove host permission:', chrome.runtime.lastError);
      }
      resolve();
    });
  });
};

/**
 * Simplified Website Counter Utilities
 * Minimal utilities since WebsiteCounter component manages its own state
 */

export const websiteCounterUtils = {
  /**
   * Get all tracked websites - mainly for external use
   */
  async getTrackedWebsites(): Promise<WebsiteCounterData[]> {
    try {
      return await chromeStorage.loadWebsiteCounters();
    } catch (error) {
      console.error('Failed to get tracked websites:', error);
      return [];
    }
  },

  /**
   * Get statistics about tracked websites
   */
  async getCounterStats(): Promise<{
    totalVisits: number;
    totalWebsites: number;
    mostVisited: WebsiteCounterData | null;
    recentlyVisited: WebsiteCounterData | null;
  }> {
    try {
      const websites = await this.getTrackedWebsites();

      const totalVisits = websites.reduce((sum, site) => sum + site.count, 0);
      const totalWebsites = websites.length;

      const mostVisited =
        websites.length > 0
          ? websites.reduce((prev, current) => (prev.count > current.count ? prev : current))
          : null;

      const recentlyVisited =
        websites.length > 0
          ? websites.reduce((prev, current) =>
              prev.lastVisited > current.lastVisited ? prev : current
            )
          : null;

      return {
        totalVisits,
        totalWebsites,
        mostVisited,
        recentlyVisited,
      };
    } catch (error) {
      console.error('Failed to get counter stats:', error);
      return {
        totalVisits: 0,
        totalWebsites: 0,
        mostVisited: null,
        recentlyVisited: null,
      };
    }
  },

  async enableTrackingForWebsite(url: URL): Promise<boolean> {
    const origin = getOriginPattern(url);

    const hasPermission = await ensureHostPermission(origin);
    if (!hasPermission) {
      const granted = await requestHostPermission(origin);
      if (!granted) {
        return false;
      }
    }

    return registerContentScript(url.hostname, origin);
  },

  async ensureTrackingForWebsite(site: WebsiteCounterData): Promise<boolean> {
    try {
      const url = new URL(site.url);
      const origin = getOriginPattern(url);

      const hasPermission = await ensureHostPermission(origin);
      if (!hasPermission) {
        return false;
      }

      return registerContentScript(url.hostname, origin);
    } catch (error) {
      console.warn('Failed to ensure tracking for website:', error);
      return false;
    }
  },

  async disableTrackingForWebsite(site: WebsiteCounterData): Promise<void> {
    try {
      const url = new URL(site.url);
      const origin = getOriginPattern(url);

      await unregisterContentScript(url.hostname);
      await removeHostPermission(origin);
    } catch (error) {
      console.warn('Failed to disable tracking for website:', error);
    }
  },
};

export default websiteCounterUtils;
