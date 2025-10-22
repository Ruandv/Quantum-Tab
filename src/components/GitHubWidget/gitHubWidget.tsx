import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  GitHubWidgetProps,
  GitHubPullRequest,
  BackgroundMessage,
  BackgroundResponse,
} from '@/types/common';
import { addWidgetRemovalListener } from '../../utils/widgetEvents';
import styles from './githubWidget.module.css';
import chromeStorage from '@/utils/chromeStorage';

const GitHubWidget: React.FC<GitHubWidgetProps> = ({
  patToken = '',
  repositoryUrl = '',
  autoRefresh = false,
  refreshInterval = 5,
  isLocked,
  widgetId,
}) => {
  const { t } = useTranslation();

  const [pullRequests, setPullRequests] = useState<GitHubPullRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  // Function to fetch PR data from background service
  const fetchPullRequests = useCallback(async () => {
    if (!patToken || !repositoryUrl) {
      setError(t('githubWidget.errors.patTokenRequired'));
      return;
    }

    setIsLoading(true);

    setError(null);

    try {
      const message: BackgroundMessage = {
        action: 'fetchPullRequests',
        data: {
          patToken,
          repositoryUrl,
        },
      };

      chrome.runtime.sendMessage(message, (response: BackgroundResponse) => {
        setIsLoading(false);

        if (chrome.runtime.lastError) {
          setError(
            `${t('githubWidget.errors.extensionError')}: ${chrome.runtime.lastError.message}`
          );
          return;
        }

        if (response.success && response.data) {
          setPullRequests(response.data);
          setLastFetch(new Date());
          setError(null);
        } else {
          setError(response.error || t('githubWidget.errors.fetchFailed'));
        }
      });
    } catch (err) {
      setIsLoading(false);
      setError(
        err instanceof Error
          ? err.message
          : t('githubWidget.errors.unknownError', { unknown: t('common.states.unknown') })
      );
    }
  }, [patToken, repositoryUrl, t]);

  // Auto-refresh timer effect
  useEffect(() => {
    if (!autoRefresh || !patToken || !repositoryUrl) {
      return;
    }

    const intervalId = setInterval(() => {
      fetchPullRequests();
    }, refreshInterval * 60 * 1000); // Convert minutes to milliseconds
    console.log("Auto-refresh interval set:", intervalId);
    return () => {
      clearInterval(intervalId);
    };
  }, [autoRefresh,  refreshInterval, fetchPullRequests, patToken, repositoryUrl]);

  // Add widget removal event listener for cleanup
  useEffect(() => {
    if (!widgetId) return;

    const removeListener = addWidgetRemovalListener(widgetId, async () => {
      // Cleanup: Clear GitHub-related state and any stored PAT tokens or repository URLs
      try {
        console.log('Cleaning up GitHub widget data for:', widgetId);

        // Clear component state
        setPullRequests([]);
        setError(null);
        setLastFetch(null);

        // If there are any GitHub-specific storage items, clear them here
        // For example, cached PR data or repository-specific settings
        if (typeof chrome !== 'undefined' && chrome.storage) {
          console.log('GitHub widget storage cleared for widget:', widgetId);
        }
      } catch (error) {
        console.error('Failed to cleanup GitHub widget data:', error);
      }
    });

    // Cleanup listener when component unmounts
    return removeListener;
  }, [widgetId]);

  // Handle PR item click
  const handlePrClick = useCallback((pr: GitHubPullRequest) => {
    if (!isLocked) {
      alert(t('quickActionButtons.messages.editState'));
    } else {
      window.open(pr.html_url, '_blank');
    }
  }, [isLocked, t]);

  // Fetch PR data when widget loads or parameters change
  useEffect(() => {
    // check if lastFetch is null or older than refreshInterval minutes
    if (lastFetch && (Date.now() - lastFetch.getTime()) > refreshInterval * 60 * 1000) {
      if (patToken && repositoryUrl) {
        fetchPullRequests();
      }
    }
  }, [lastFetch]);

  useEffect(() => {
    if (lastFetch === null) return;
    // save the lastFetched value to localStorage using chromeStorage
    const metaData = { pullRequests, lastFetch: lastFetch?.toISOString() };
    console.log(`Saving metaData [${widgetId}]:`, metaData);
    chromeStorage.setWidgetMetaData(widgetId, metaData)
  }, [lastFetch, pullRequests, widgetId])
 useEffect(() => {
    // Load the lastFetched value and previousPullRequestsRef from localStorage using chromeStorage
    const loadMetaData = async () => {
      try {
        const metaData = await chromeStorage.getWidgetMetaData(widgetId);
        if (metaData && typeof metaData === 'object') {
          const myDateTime = metaData.lastFetch ? new Date(metaData.lastFetch as string) : new Date();
          setLastFetch(myDateTime);
          setPullRequests(metaData.pullRequests ? metaData.pullRequests as GitHubPullRequest[] : []);
        }
        else {
          console.log('No metaData found for widget:', widgetId);
          setLastFetch(new Date(2023, 0, 1));
        }
      } catch (error) {
        console.error('Failed to load widget meta data:', error);
      }
    };
    loadMetaData();
  }, [])

  return (
    <>
      <div className={styles.githubWidgetContent}>
        {/* Status and Data Section */}
        {isLoading ? (
          <div className={styles.githubLoading}>
            <div className="loading-spinner"></div>
            <span className={styles.loadingText}>{t('githubWidget.loading.fetchingPullRequests')}</span>
          </div>
        ) : error ? (
          <div className={styles.githubError}>
            <span className="error-icon">❌</span>
            <span className={styles.errorText}>{error}</span>
            {!isLocked && (
              <button onClick={fetchPullRequests} className={styles.retryBtn}>
                🔄 {t('common.buttons.retry')}
              </button>
            )}
          </div>
        ) : (
          <div className={styles.githubData}>
            <button onClick={fetchPullRequests} className={styles.refreshBtn}>
              🔄 {t('common.buttons.refresh')}
            </button>

            <div className={styles.dataHeader}>
              <span className={styles.prCount}>
                📋 {pullRequests.length} {t('githubWidget.pullRequests.count')}
              </span>
              {lastFetch && (
                <span className={styles.lastUpdated}>
                  {t('githubWidget.pullRequests.updated')}: {lastFetch.toLocaleTimeString()}
                </span>
              )}
            </div>
            <div className={styles.prList}>
              {pullRequests.map((pr) => (
                <div
                  key={pr.id}
                  className={`${styles.prItem} ${styles[`prState${pr.state.charAt(0).toUpperCase() + pr.state.slice(1)}`]}`}
                  onClick={() => handlePrClick(pr)}
                >
                  <div className={styles.prHeader}>
                    <span className={styles.prNumber}>#{pr.number}</span>
                    <span className={`${styles.prState} ${pr.state === 'open' ? styles.prStateOpen : pr.merged ? styles.prStateMerged : styles.prStateClosed}`}>
                      {pr.state === 'open' ? '🟢' : pr.merged ? '🟣' : '🔴'}
                      {pr.merged
                        ? t('githubWidget.pullRequests.states.merged')
                        : t(`githubWidget.pullRequests.states.${pr.state}`)}
                    </span>
                    {pr.draft && (
                      <span className={styles.prDraft}>📝 {t('githubWidget.pullRequests.draft')}</span>
                    )}
                  </div>
                  <div className={styles.prTitle}>{pr.title}</div>
                  <div className={styles.prMeta}>
                    {/* <span className={styles.prAuthor}>👤 {pr.user.login}</span> */}
                    <span className={styles.prChanges}>
                      +{pr.additions} -{pr.deletions} ({pr.changed_files}{' '}
                      {t('githubWidget.labels.files')})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

GitHubWidget.displayName = 'GitHubWidget';

export default GitHubWidget;
