import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { WebsiteCounterProps, WebsiteCounterData } from '../../types/common';
import chromeStorage from '../../utils/chromeStorage';
import { addWidgetRemovalListener } from '../../utils/widgetEvents';
import styles from './websiteCounter.module.css';

const WebsiteCounter: React.FC<WebsiteCounterProps> = ({
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

  const { t } = useTranslation();

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
        alert(t('widgets.websiteCounter.alerts.alreadyTracked'));
        return;
      }

      // Check if we've reached the maximum number of websites
      if (websiteData.length >= maxWebsites) {
        alert(t('widgets.websiteCounter.alerts.maxReached', { max: maxWebsites }));
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
      alert(t('widgets.websiteCounter.alerts.invalidUrl'));
    }
  }, [newWebsiteUrl, websiteData, maxWebsites, showFavicons, updateWebsiteData, t]);

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
    if (confirm(t('widgets.websiteCounter.confirm.resetCounters'))) {
      const resetData = websiteData.map((site) => ({
        ...site,
        count: 0,
        lastVisited: 0,
      }));
      updateWebsiteData(resetData);
    }
  }, [websiteData, updateWebsiteData, t]);

  // Format the last visited date
  const formatLastVisited = useCallback((timestamp: number) => {
    if (timestamp === 0) return t('widgets.websiteCounter.lastVisited.never');
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return t('widgets.websiteCounter.lastVisited.today');
    if (diffDays === 1) return t('widgets.websiteCounter.lastVisited.yesterday');
    if (diffDays < 7) return t('widgets.websiteCounter.lastVisited.daysAgo', { days: diffDays });
    return date.toLocaleDateString();
  }, [t]);

  if (isLoading) {
    return (
      <>
        <div className={styles.websiteCounterLoading}>
          <div className="loading-spinner"></div>
          <span>{t('widgets.websiteCounter.loading')}</span>
        </div>
      </>
    );
  }

  return (
    <>
      <div className={styles.websiteList}>
        {sortedWebsites.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>📊</span>
            <p>{t('widgets.websiteCounter.emptyState.title')}</p>
            <p className={styles.emptyHint}>{t('widgets.websiteCounter.emptyState.hint')}</p>
          </div>
        ) : (
          sortedWebsites.map((site) => (
            <div key={site.hostname} className={styles.websiteItem}>
              <div className={styles.websiteInfo}>
                {showFavicons && site.favicon && (
                  <img
                    src={site.favicon}
                    alt={t('widgets.websiteCounter.alt.favicon', { hostname: site.hostname })}
                    className={styles.websiteFavicon}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                )}
                <div className={styles.websiteDetails}>
                  <span className={styles.websiteName}>{site.hostname}</span>
                  <span className={styles.lastVisited}>{formatLastVisited(site.lastVisited)}</span>
                </div>
              </div>
              <div className={styles.websiteCounter}>
                <span className={styles.visitCount}>{site.count}</span>
                {!isLocked && (
                  <button
                    className={styles.removeWebsiteBtn}
                    onClick={() => handleRemoveWebsite(site.hostname)}
                    title={t('widgets.websiteCounter.buttons.remove')}
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
        <div className={styles.counterControls}>
          {!isAddingWebsite ? (
            <div className={styles.controlButtons}>
              <button
                className={styles.addWebsiteBtn}
                onClick={() => setIsAddingWebsite(true)}
                disabled={websiteData.length >= maxWebsites}
              >
                {t('widgets.websiteCounter.buttons.addWebsite')}
              </button>
              {websiteData.length > 0 && (
                <button className={styles.resetCountersBtn} onClick={handleResetCounters}>
                  {t('widgets.websiteCounter.buttons.resetAll')}
                </button>
              )}
            </div>
          ) : (
            <div className={styles.addWebsiteForm}>
              <input
                type="text"
                value={newWebsiteUrl}
                onChange={(e) => setNewWebsiteUrl(e.target.value)}
                placeholder={t('widgets.websiteCounter.placeholders.websiteUrl')}
                className={styles.websiteUrlInput}
                onKeyPress={(e) => e.key === 'Enter' && handleAddWebsite()}
              />
              <div className={styles.formButtons}>
                <button className={styles.saveWebsiteBtn} onClick={handleAddWebsite}>
                  ✓
                </button>
                <button
                  className={styles.cancelWebsiteBtn}
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
    </>
  );
};

WebsiteCounter.displayName = 'WebsiteCounter';

export default WebsiteCounter;
