import { WebsiteCounterData } from '../types/common';
import chromeStorage from './chromeStorage';

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
      
      const mostVisited = websites.length > 0 
        ? websites.reduce((prev, current) => prev.count > current.count ? prev : current)
        : null;
      
      const recentlyVisited = websites.length > 0
        ? websites.reduce((prev, current) => prev.lastVisited > current.lastVisited ? prev : current)
        : null;

      return {
        totalVisits,
        totalWebsites,
        mostVisited,
        recentlyVisited
      };
    } catch (error) {
      console.error('Failed to get counter stats:', error);
      return {
        totalVisits: 0,
        totalWebsites: 0,
        mostVisited: null,
        recentlyVisited: null
      };
    }
  }
};

export default websiteCounterUtils;