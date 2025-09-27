import React, { useState, useEffect } from 'react';
import { GitHubWidgetProps, GitHubPullRequest, BackgroundMessage, BackgroundResponse } from '@/types/common';

const GitHubWidget: React.FC<GitHubWidgetProps> = ({
    className = '',
    patToken = '',
    repositoryUrl = '',
    isLocked
}) => {
    const [pullRequests, setPullRequests] = useState<GitHubPullRequest[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastFetch, setLastFetch] = useState<Date | null>(null);
    const repositoryName = repositoryUrl ? repositoryUrl.split('/').slice(-2).join('/') : 'Unknown Repo';
    // Function to fetch PR data from background service
    const fetchPullRequests = async () => {
        if (!patToken || !repositoryUrl) {
            setError('PAT Token and Repository URL are required');
            return;
        }

        setIsLoading(true);

        setError(null);

        try {
            const message: BackgroundMessage = {
                action: 'fetchPullRequests',
                data: {
                    patToken,
                    repositoryUrl
                }
            };

            chrome.runtime.sendMessage(message, (response: BackgroundResponse) => {
                setIsLoading(false);

                if (chrome.runtime.lastError) {
                    setError(`Extension error: ${chrome.runtime.lastError.message}`);
                    return;
                }

                if (response.success && response.data) {
                    setPullRequests(response.data);
                    setLastFetch(new Date());
                    setError(null);
                } else {
                    setError(response.error || 'Failed to fetch pull requests');
                }
            });
        } catch (err) {
            setIsLoading(false);
            setError(err instanceof Error ? err.message : 'Unknown error occurred');
        }
    };

    // Fetch PR data when widget loads or parameters change
    useEffect(() => {
        if (patToken && repositoryUrl) {
            fetchPullRequests();
        }
    }, [patToken, repositoryUrl]);
    return (
        <div className={`github-widget ${className}`}>
            <h3 className="widget-title">GitHub Repository ({repositoryName})</h3>
            <div className="github-widget-content">
                {/* Status and Data Section */}
                { isLoading ? (
                    <div className="github-loading">
                        <div className="loading-spinner"></div>
                        <span className="loading-text">Fetching pull requests...</span>
                    </div>
                ) : error ? (
                    <div className="github-error">
                        <span className="error-icon">❌</span>
                        <span className="error-text">{error}</span>
                        {!isLocked && (
                            <button onClick={fetchPullRequests} className="retry-btn">
                                🔄 Retry
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="github-data">
                        <div className="data-header">
                            <span className="pr-count">📋 {pullRequests.length} Pull Requests</span>
                            {lastFetch && (
                                <span className="last-updated">
                                    Updated: {lastFetch.toLocaleTimeString()}
                                </span>
                            )}
                        </div>
                        <div className="pr-list">
                            {pullRequests.map((pr) => (
                                <div key={pr.id} className={`pr-item pr-${pr.state}`} onClick={() => window.open(pr.html_url, '_blank')}>
                                    <div className="pr-header">
                                        <span className="pr-number">#{pr.number}</span>
                                        <span className={`pr-state pr-state-${pr.state}`}>
                                            {pr.state === 'open' ? '🟢' : pr.merged ? '🟣' : '🔴'}
                                            {pr.merged ? 'MERGED' : pr.state.toUpperCase()}
                                        </span>
                                        {pr.draft && <span className="pr-draft">📝 Draft</span>}
                                    </div>
                                    <div className="pr-title">{pr.title}</div>
                                    <div className="pr-meta">
                                        {/* <span className="pr-author">👤 {pr.user.login}</span> */}
                                        <span className="pr-changes">
                                            +{pr.additions} -{pr.deletions} ({pr.changed_files} files)
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {!isLocked && (
                            <button onClick={fetchPullRequests} className="refresh-btn">
                                🔄 Refresh Data
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default GitHubWidget;