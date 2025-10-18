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

  // Fetch PR data when widget loads or parameters change
  useEffect(() => {
    if (patToken && repositoryUrl) {
      fetchPullRequests();
    }
  }, [fetchPullRequests, patToken, repositoryUrl]);

  // Auto-refresh timer effect
  useEffect(() => {
    if (!autoRefresh || !patToken || !repositoryUrl) {
      return;
    }

    const intervalId = setInterval(() => {
      fetchPullRequests();
    }, refreshInterval * 60 * 1000); // Convert minutes to milliseconds

    return () => {
      clearInterval(intervalId);
    };
  }, [autoRefresh, refreshInterval, fetchPullRequests, patToken, repositoryUrl]);

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
                  onClick={() => window.open(pr.html_url, '_blank')}
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
            {!isLocked && (
              <button onClick={fetchPullRequests} className={styles.refreshBtn}>
                🔄 {t('common.buttons.refresh')}
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
};

GitHubWidget.displayName = 'GitHubWidget';

export default GitHubWidget;
