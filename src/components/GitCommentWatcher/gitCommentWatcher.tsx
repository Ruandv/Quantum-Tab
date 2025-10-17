import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { GitCommentWatcherProps, GitHubPullRequest, BackgroundMessage, BackgroundResponse } from '@/types/common';
import { addWidgetRemovalListener } from '../../utils/widgetEvents';
import styles from './gitCommentWatcher.module.css';
import githubStyles from '../GitHubWidget/githubWidget.module.css';

const GitCommentWatcher: React.FC<GitCommentWatcherProps> = ({
  className = '',
  patToken = '',
  repositoryUrl = '',
  autoRefresh = false,
  refreshInterval = 5,
  isLocked,
  widgetId,
  widgetHeading
}) => {
  const { t } = useTranslation();

  const [pullRequests, setPullRequests] = useState<GitHubPullRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);
  const [changedPrIds, setChangedPrIds] = useState<Set<number>>(new Set());
  const previousPullRequestsRef = useRef<GitHubPullRequest[]>([]);

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
        action: 'fetchUserPullRequests',
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
          // Detect changes before updating state
          const newChangedPrIds = new Set<number>();
          const newPrs = response.data as GitHubPullRequest[];
          
          console.log(`GitCommentWatcher: Refresh detected. Previous PRs: ${previousPullRequestsRef.current.length}, New PRs: ${newPrs.length}`);
          
          // Compare with previous PRs to find changes
          newPrs.forEach(newPr => {
            const prevPr = previousPullRequestsRef.current.find(pr => pr.id === newPr.id);
            if (prevPr) {
              // Check if comments increased
              const prevComments = (prevPr.comments || 0) + (prevPr.review_comments || 0);
              const newComments = (newPr.comments || 0) + (newPr.review_comments || 0);
              console.log(`PR #${newPr.number}: prev=${prevComments}, new=${newComments}`);
              if (newComments > prevComments) {
                console.log(`PR #${newPr.number} has new comments!`);
                newChangedPrIds.add(newPr.id);
              }
            } else {
              // New PR - highlight it
              console.log(`New PR #${newPr.number} detected`);
              newChangedPrIds.add(newPr.id);
            }
          });

          console.log(`Changed PRs: ${Array.from(newChangedPrIds).length}`);

          // Update state - store new data as previous for next comparison
          previousPullRequestsRef.current = [...newPrs];
          setPullRequests(newPrs);
          setChangedPrIds(newChangedPrIds);
          setLastFetch(new Date());
          setError(null);

          // Clear highlights after 5 seconds
          if (newChangedPrIds.size > 0) {
            setTimeout(() => {
              setChangedPrIds(new Set());
            }, 5000);
          }
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
        console.log('Cleaning up GitCommentWatcher data for:', widgetId);

        // Clear component state
        setPullRequests([]);
        setError(null);
        setLastFetch(null);

        // If there are any GitHub-specific storage items, clear them here
        // For example, cached PR data or repository-specific settings
        if (typeof chrome !== 'undefined' && chrome.storage) {
          console.log('GitCommentWatcher storage cleared for widget:', widgetId);
        }
      } catch (error) {
        console.error('Failed to cleanup GitCommentWatcher data:', error);
      }
    });

    // Cleanup listener when component unmounts
    return removeListener;
  }, [widgetId]);

  // Calculate if there are new comments
  const hasNewComments = pullRequests.some(pr =>
    (pr.comments || 0) > 0 || (pr.review_comments || 0) > 0
  );

  return (
    <div className={`${styles.gitCommentWatcher} ${className}`}>
      {widgetHeading && <h3 className={styles.widgetTitle}>{widgetHeading}</h3>}
      <div className={styles.gitCommentWatcherContent}>
        {/* Status and Data Section */}
        {isLoading ? (
          <div className={githubStyles.githubLoading}>
            <div className="loading-spinner"></div>
            <span className={githubStyles.loadingText}>{t('githubWidget.loading.fetchingPullRequests')}</span>
          </div>
        ) : error ? (
          <div className={githubStyles.githubError}>
            <span className={githubStyles.errorIcon}>❌</span>
            <span className={githubStyles.errorText}>{error}</span>
            {!isLocked && (
              <button onClick={fetchPullRequests} className={githubStyles.retryBtn}>
                🔄 {t('common.buttons.retry')}
              </button>
            )}
          </div>
        ) : (
          <div className={styles.gitCommentWatcherData}>
            <div className={styles.watcherHeader}>
              <span className={githubStyles.prCount}>
                📋 {pullRequests.length} {t('githubWidget.pullRequests.count')}
              </span>
              {hasNewComments && (
                <span className={styles.commentBadge}>💬 {t('gitCommentWatcher.labels.newComments')}</span>
              )}
              {lastFetch && (
                <span className={githubStyles.lastUpdated}>
                  {t('githubWidget.pullRequests.updated')}: {lastFetch.toLocaleTimeString()}
                </span>
              )}
            </div>
            <div className={githubStyles.prList}>
              {pullRequests.map((pr) => (
                <div
                  key={pr.id}
                  className={`${githubStyles.prItem} ${githubStyles[`prState${pr.state.charAt(0).toUpperCase() + pr.state.slice(1)}`]} ${pr.comments > 0 || pr.review_comments > 0 ? styles.prItemHasComments : ''} ${changedPrIds.has(pr.id) ? styles.prItemChanged : ''}`}
                  onClick={() => window.open(pr.html_url, '_blank')}
                >
                  <div className={githubStyles.prHeader}>
                    <span className={githubStyles.prNumber}>#{pr.number}</span>
                    <span className={`${githubStyles.prState} ${githubStyles[`prState${pr.state.charAt(0).toUpperCase() + pr.state.slice(1)}`]}`}>
                      {pr.state === 'open' ? '🟢' : pr.merged ? '🟣' : '🔴'}
                      {pr.merged
                        ? t('githubWidget.pullRequests.states.merged')
                        : t(`githubWidget.pullRequests.states.${pr.state}`)}
                    </span>
                    {(pr.comments > 0 || pr.review_comments > 0) && (
                      <span className={githubStyles.commentIndicator}>
                        💬 {(pr.comments || 0) + (pr.review_comments || 0)} {t('gitCommentWatcher.labels.comments')}
                      </span>
                    )}
                  </div>
                  <div className={githubStyles.prTitle}>{pr.title}</div>
                </div>
              ))}
            </div>
            {!isLocked && (
              <button onClick={fetchPullRequests} className={githubStyles.refreshBtn}>
                🔄 {t('common.buttons.refresh')}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

GitCommentWatcher.displayName = 'GitCommentWatcher';

export default GitCommentWatcher;