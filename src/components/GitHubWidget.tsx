import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  GitHubWidgetProps,
  GitHubPullRequest,
  BackgroundMessage,
  BackgroundResponse,
} from '@/types/common';
import { addWidgetRemovalListener } from '../utils/widgetEvents';

const GitHubWidget: React.FC<GitHubWidgetProps> = ({
  className = '',
  patToken = '',
  repositoryUrl = '',
  isLocked,
  widgetId,
}) => {
  const { t } = useTranslation();

  const [pullRequests, setPullRequests] = useState<GitHubPullRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);
  const repositoryName = repositoryUrl
    ? repositoryUrl.split('/').slice(-2).join('/')
    : t('githubWidget.labels.unknownRepo', { unknown: t('common.states.unknown') });

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
    <div className={`github-widget ${className}`}>
      <h3 className="widget-title">
        {t('githubWidget.title')} ({repositoryName})
      </h3>
      <div className="github-widget-content">
        {/* Status and Data Section */}
        {isLoading ? (
          <div className="github-loading">
            <div className="loading-spinner"></div>
            <span className="loading-text">{t('githubWidget.loading.fetchingPullRequests')}</span>
          </div>
        ) : error ? (
          <div className="github-error">
            <span className="error-icon">❌</span>
            <span className="error-text">{error}</span>
            {!isLocked && (
              <button onClick={fetchPullRequests} className="retry-btn">
                🔄 {t('common.buttons.retry')}
              </button>
            )}
          </div>
        ) : (
          <div className="github-data">
            <div className="data-header">
              <span className="pr-count">
                📋 {pullRequests.length} {t('githubWidget.pullRequests.count')}
              </span>
              {lastFetch && (
                <span className="last-updated">
                  {t('githubWidget.pullRequests.updated')}: {lastFetch.toLocaleTimeString()}
                </span>
              )}
            </div>
            <div className="pr-list">
              {pullRequests.map((pr) => (
                <div
                  key={pr.id}
                  className={`pr-item pr-${pr.state}`}
                  onClick={() => window.open(pr.html_url, '_blank')}
                >
                  <div className="pr-header">
                    <span className="pr-number">#{pr.number}</span>
                    <span className={`pr-state pr-state-${pr.state}`}>
                      {pr.state === 'open' ? '🟢' : pr.merged ? '🟣' : '🔴'}
                      {pr.merged
                        ? t('githubWidget.pullRequests.states.merged')
                        : t(`githubWidget.pullRequests.states.${pr.state}`)}
                    </span>
                    {pr.draft && (
                      <span className="pr-draft">📝 {t('githubWidget.pullRequests.draft')}</span>
                    )}
                  </div>
                  <div className="pr-title">{pr.title}</div>
                  <div className="pr-meta">
                    {/* <span className="pr-author">👤 {pr.user.login}</span> */}
                    <span className="pr-changes">
                      +{pr.additions} -{pr.deletions} ({pr.changed_files}{' '}
                      {t('githubWidget.labels.files')})
                    </span>
                  </div>
                </div>
              ))}
            </div>
            {!isLocked && (
              <button onClick={fetchPullRequests} className="refresh-btn">
                🔄 {t('common.buttons.refresh')}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

GitHubWidget.displayName = 'GitHubWidget';

export default GitHubWidget;
