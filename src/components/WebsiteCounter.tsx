import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { WebsiteCounterProps, WebsiteCounterData } from '../types/common';
import chromeStorage from '../utils/chromeStorage';
import { addWidgetRemovalListener } from '../utils/widgetEvents';

const WebsiteCounter: React.FC<WebsiteCounterProps> = ({
  className = '',
  websites = [],
  showFavicons = true,
  maxWebsites = 10,
  isLocked = false,
  sortBy = 'count',
  widgetId,
}) => {
  const [websiteData, setWebsiteData] = useState<WebsiteCounterData[]>(websites);
  const [isLoading, setIsLoading] = useState(true);
  const [newWebsiteUrl, setNewWebsiteUrl] = useState('');
  const [isAddingWebsite, setIsAddingWebsite] = useState(false);
  const saveTimeoutRef = useRef<number | null>(null);

  // Load website counter data from storage and listen for changes
  useEffect(() => {
    const loadCounterData = async () => {
      try {
        const counters = await chromeStorage.loadWebsiteCounters();
        setWebsiteData(counters);
      } catch (error) {
        console.error('Failed to load website counter data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Listen for storage changes to sync with other instances
    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes.websiteCounters?.newValue) {
        setWebsiteData(changes.websiteCounters.newValue);
      }
    };

    loadCounterData();

    // Set up storage listener
    if (chrome?.storage?.onChanged) {
      chrome.storage.onChanged.addListener(handleStorageChange);
    }

    // Cleanup listener on unmount
    return () => {
      if (chrome?.storage?.onChanged) {
        chrome.storage.onChanged.removeListener(handleStorageChange);
      }
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Add widget removal event listener for cleanup
  useEffect(() => {
    if (!widgetId) return;

    const removeListener = addWidgetRemovalListener(widgetId, async () => {
      // Cleanup: Clear website counter data and storage
      try {
        console.log('Cleaning up WebsiteCounter widget data for:', widgetId);

        // Clear website counter data from storage
        if (typeof chrome !== 'undefined' && chrome.storage) {
          await chrome.storage.local.remove(['websiteCounters']);
          console.log('WebsiteCounter storage cleared for widget:', widgetId);
        }

        // Clear component state
        setWebsiteData([]);
        setNewWebsiteUrl('');
        setIsAddingWebsite(false);
      } catch (error) {
        console.error('Failed to cleanup WebsiteCounter widget data:', error);
      }
    });

    // Cleanup listener when component unmounts
    return removeListener;
  }, [widgetId]);

  // Debounced save to storage
  const debouncedSave = useCallback((data: WebsiteCounterData[]) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await chromeStorage.saveWebsiteCounters(data);
      } catch (error) {
        console.error('Failed to save website counter data:', error);
      }
    }, 300); // 300ms debounce
  }, []);

  // Update data and save
  const updateWebsiteData = useCallback(
    (newData: WebsiteCounterData[]) => {
      setWebsiteData(newData);
      debouncedSave(newData);
    },
    [debouncedSave]
  );

  // Sort websites based on selected criteria
  const sortedWebsites = useMemo(() => {
    const sorted = [...websiteData];
    switch (sortBy) {
      case 'count':
        return sorted.sort((a, b) => b.count - a.count);
      case 'name':
        return sorted.sort((a, b) => a.hostname.localeCompare(b.hostname));
      case 'recent':
        return sorted.sort((a, b) => b.lastVisited - a.lastVisited);
      default:
        return sorted;
    }
  }, [websiteData, sortBy]);

  // Add a new website to track
  const handleAddWebsite = useCallback(async () => {
    if (!newWebsiteUrl.trim()) return;

    try {
      const url = new URL(
        newWebsiteUrl.startsWith('http') ? newWebsiteUrl : `https://${newWebsiteUrl}`
      );
      const hostname = url.hostname.replace('www.', '');

      // Check if website is already being tracked
      if (websiteData.some((site) => site.hostname === hostname)) {
        alert('This website is already being tracked!');
        return;
      }

      // Check if we've reached the maximum number of websites
      if (websiteData.length >= maxWebsites) {
        alert(`Maximum of ${maxWebsites} websites can be tracked.`);
        return;
      }

      const newSite: WebsiteCounterData = {
        url: url.href,
        hostname,
        count: 0,
        lastVisited: 0,
        favicon: showFavicons
          ? `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`
          : undefined,
      };

      const updatedData = [...websiteData, newSite];
      updateWebsiteData(updatedData);
      setNewWebsiteUrl('');
      setIsAddingWebsite(false);
    } catch (error) {
      alert('Please enter a valid website URL');
    }
  }, [newWebsiteUrl, websiteData, maxWebsites, showFavicons, updateWebsiteData]);

  // Remove a website from tracking
  const handleRemoveWebsite = useCallback(
    (hostname: string) => {
      const updatedData = websiteData.filter((site) => site.hostname !== hostname);
      updateWebsiteData(updatedData);
    },
    [websiteData, updateWebsiteData]
  );

  // Reset all counters
  const handleResetCounters = useCallback(() => {
    if (confirm('Are you sure you want to reset all website counters?')) {
      const resetData = websiteData.map((site) => ({
        ...site,
        count: 0,
        lastVisited: 0,
      }));
      updateWebsiteData(resetData);
    }
  }, [websiteData, updateWebsiteData]);

  // Format the last visited date
  const formatLastVisited = useCallback((timestamp: number) => {
    if (timestamp === 0) return 'Never';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  }, []);

  // Calculate total visits
  const totalVisits = useMemo(() => {
    return websiteData.reduce((sum, site) => sum + site.count, 0);
  }, [websiteData]);

  if (isLoading) {
    return (
      <div className={`website-counter-widget ${className}`}>
        <div className="website-counter-loading">
          <div className="loading-spinner"></div>
          <span>Loading counters...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`website-counter-widget ${className}`}>
      <div className="widget-header">
        <h3 className="widget-title">Website Counter</h3>
        <div className="counter-stats">
          <span className="total-visits">{totalVisits} total visits</span>
          <span className="tracked-sites">
            {websiteData.length}/{maxWebsites} sites
          </span>
        </div>
      </div>

      <div className="website-list">
        {sortedWebsites.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📊</span>
            <p>No websites being tracked</p>
            <p className="empty-hint">Add a website to start counting visits</p>
          </div>
        ) : (
          sortedWebsites.map((site) => (
            <div key={site.hostname} className="website-item">
              <div className="website-info">
                {showFavicons && site.favicon && (
                  <img
                    src={site.favicon}
                    alt={`${site.hostname} favicon`}
                    className="website-favicon"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                )}
                <div className="website-details">
                  <span className="website-name">{site.hostname}</span>
                  <span className="last-visited">{formatLastVisited(site.lastVisited)}</span>
                </div>
              </div>
              <div className="website-counter">
                <span className="visit-count">{site.count}</span>
                {!isLocked && (
                  <button
                    className="remove-website-btn"
                    onClick={() => handleRemoveWebsite(site.hostname)}
                    title="Remove website"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {!isLocked && (
        <div className="counter-controls">
          {!isAddingWebsite ? (
            <div className="control-buttons">
              <button
                className="add-website-btn"
                onClick={() => setIsAddingWebsite(true)}
                disabled={websiteData.length >= maxWebsites}
              >
                ➕ Add Website
              </button>
              {websiteData.length > 0 && (
                <button className="reset-counters-btn" onClick={handleResetCounters}>
                  🔄 Reset All
                </button>
              )}
            </div>
          ) : (
            <div className="add-website-form">
              <input
                type="text"
                value={newWebsiteUrl}
                onChange={(e) => setNewWebsiteUrl(e.target.value)}
                placeholder="Enter website URL (e.g., github.com)"
                className="website-url-input"
                onKeyPress={(e) => e.key === 'Enter' && handleAddWebsite()}
              />
              <div className="form-buttons">
                <button className="save-website-btn" onClick={handleAddWebsite}>
                  ✓
                </button>
                <button
                  className="cancel-website-btn"
                  onClick={() => {
                    setIsAddingWebsite(false);
                    setNewWebsiteUrl('');
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

WebsiteCounter.displayName = 'WebsiteCounter';

export default WebsiteCounter;
