import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { GitHubGuruProps, GitHubPullRequestWithReviews, BackgroundMessage, BackgroundResponse } from '../../types/common';
import { addWidgetRemovalListener } from '../../utils/widgetEvents';
import styles from './gitHubGuru.module.css';
import chromeStorage from '@/utils/chromeStorage';

const GitHubGuru: React.FC<GitHubGuruProps> = ({
    patToken = '',
    repositoryUrl = '',
    autoRefresh = false,
    refreshInterval = 5,
    isLocked,
    widgetId,
}) => {
    const { t } = useTranslation();

    const [allPullRequests, setAllPullRequests] = useState<GitHubPullRequestWithReviews[]>([]);
    const [userPullRequests, setUserPullRequests] = useState<GitHubPullRequestWithReviews[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastFetch, setLastFetch] = useState<Date | null>(null);
    const [activeTab, setActiveTab] = useState<'all' | 'mine'>('all');
    const [dismissedNotifications, setDismissedNotifications] = useState<Set<string>>(new Set());

    const previousUserPRsRef = useRef<GitHubPullRequestWithReviews[]>([]);

    // Function to fetch PR data from background service
    const fetchPullRequests = useCallback(async () => {
        if (!patToken || !repositoryUrl) {
            setError(t('githubWidget.errors.patTokenRequired'));
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Fetch all PRs
            const allPRsMessage: BackgroundMessage = {
                action: 'fetchPullRequests',
                data: {
                    patToken,
                    repositoryUrl,
                },
            };

            // Fetch user's PRs
            const userPRsMessage: BackgroundMessage = {
                action: 'fetchUserPullRequests',
                data: {
                    patToken,
                    repositoryUrl,
                },
            };

            // Fetch both in parallel
            const [allPRsResponse, userPRsResponse] = await Promise.all([
                new Promise<BackgroundResponse>((resolve) => {
                    chrome.runtime.sendMessage(allPRsMessage, (response: BackgroundResponse) => {
                        resolve(response);
                    });
                }),
                new Promise<BackgroundResponse>((resolve) => {
                    chrome.runtime.sendMessage(userPRsMessage, (response: BackgroundResponse) => {
                        resolve(response);
                    });
                })
            ]);

            if (chrome.runtime.lastError) {
                setError(`${t('githubWidget.errors.extensionError')}: ${chrome.runtime.lastError.message}`);
                setIsLoading(false);
                return;
            }

            if (allPRsResponse.success && allPRsResponse.data) {
                const allPRs = allPRsResponse.data as GitHubPullRequestWithReviews[];
                // Filter to only open/draft PRs
                const openPRs = allPRs.filter(pr => pr.state === 'open').slice(0, 10);
                setAllPullRequests(openPRs);
            } else {
                setError(allPRsResponse.error || t('githubWidget.errors.fetchFailed'));
            }

            if (userPRsResponse.success && userPRsResponse.data) {
                const userPRs = userPRsResponse.data as GitHubPullRequestWithReviews[];

                // Detect new activity for user's PRs
                const newDismissedNotifications = new Set(dismissedNotifications);
                const updatedUserPRs = userPRs.map(pr => {
                    const prevPr = previousUserPRsRef.current.find(p => p.id === pr.id);
                    let hasNewActivity = false;

                    if (prevPr) {
                        // Check for new comments
                        const prevCommentCount = (prevPr.comments || 0) + (prevPr.review_comments || 0);
                        const newCommentCount = (pr.comments || 0) + (pr.review_comments || 0);
                        const hasNewComments = newCommentCount > prevCommentCount;

                        // Check for new approvals
                        const prevApprovalCount = prevPr.approvalCount || 0;
                        const newApprovalCount = pr.approvalCount || 0;
                        const hasNewApprovals = newApprovalCount > prevApprovalCount;

                        hasNewActivity = hasNewComments || hasNewApprovals;
                    } else {
                        // New PR
                        hasNewActivity = true;
                    }

                    // Check if this notification was already dismissed
                    const notificationKey = `${pr.id}-${pr.updated_at}`;
                    if (hasNewActivity && !newDismissedNotifications.has(notificationKey)) {
                        pr.hasNewActivity = true;
                    }

                    return pr;
                });

                setUserPullRequests(updatedUserPRs);
                previousUserPRsRef.current = [...userPRs];
            }

            setLastFetch(new Date());
            setIsLoading(false);
        } catch (err) {
            setIsLoading(false);
            setError(
                err instanceof Error
                    ? err.message
                    : t('githubWidget.errors.unknownError', { unknown: t('common.states.unknown') })
            );
        }
    }, [patToken, repositoryUrl, t, dismissedNotifications]);

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
            try {
                console.log('Cleaning up GitHubGuru data for:', widgetId);
                setAllPullRequests([]);
                setUserPullRequests([]);
                setError(null);
                setLastFetch(null);
            } catch (error) {
                console.error('Failed to cleanup GitHubGuru data:', error);
            }
        });

        return removeListener;
    }, [widgetId]);

    // Load dismissed notifications and previous data on mount
    useEffect(() => {
        const loadMetaData = async () => {
            try {
                const metaData = await chromeStorage.getWidgetMetaData(widgetId);
                if (metaData && typeof metaData === 'object') {
                    const myDateTime = metaData.lastFetch ? new Date(metaData.lastFetch as string) : new Date();
                    setLastFetch(myDateTime);
                    setAllPullRequests(metaData.allPullRequests ? metaData.allPullRequests as GitHubPullRequestWithReviews[] : []);
                    setUserPullRequests(metaData.userPullRequests ? metaData.userPullRequests as GitHubPullRequestWithReviews[] : []);
                    previousUserPRsRef.current = metaData.previousUserPRs ? metaData.previousUserPRs as GitHubPullRequestWithReviews[] : [];
                    setDismissedNotifications(new Set(metaData.dismissedNotifications ? metaData.dismissedNotifications as string[] : []));
                }
            } catch (error) {
                console.error('Failed to load GitHubGuru meta data:', error);
            }
        };
        loadMetaData();
    }, [widgetId]);

    // Save data when it changes
    useEffect(() => {
        if (lastFetch === null) return;
        const metaData = {
            allPullRequests,
            userPullRequests,
            lastFetch: lastFetch?.toISOString(),
            previousUserPRs: previousUserPRsRef.current,
            dismissedNotifications: Array.from(dismissedNotifications)
        };
        chromeStorage.setWidgetMetaData(widgetId, metaData);
    }, [lastFetch, allPullRequests, userPullRequests, dismissedNotifications, widgetId]);

    // Handle PR item click
    const handlePrClick = useCallback((pr: GitHubPullRequestWithReviews) => {
        if (!isLocked) {
            alert(t('quickActionButtons.messages.editState'));
        } else {
            window.open(pr.html_url, '_blank');
        }
    }, [isLocked, t]);

    // Handle dismissing notifications
    const dismissNotification = useCallback((pr: GitHubPullRequestWithReviews) => {
        const notificationKey = `${pr.id}-${pr.updated_at}`;
        setDismissedNotifications(prev => new Set([...prev, notificationKey]));
        setUserPullRequests(prev =>
            prev.map(p => p.id === pr.id ? { ...p, hasNewActivity: false } : p)
        );
    }, []);

    const currentPRs = activeTab === 'all' ? allPullRequests : userPullRequests;
    const hasNewActivity = userPullRequests.some(pr => pr.hasNewActivity);

    return (
        <div className={styles.githubGuru}>
            <div className={styles.header}>
                <div className={styles.controls}>
                    <button onClick={fetchPullRequests} className={styles.refreshBtn}>
                        🔄 {t('common.buttons.refresh')}
                    </button>
                    {lastFetch && (
                        <span className={styles.lastUpdated}>
                            {t('githubWidget.pullRequests.updated')}: {lastFetch.toLocaleTimeString()}
                        </span>
                    )}
                </div>
            </div>

            {/* Tab Navigation */}
            <div className={styles.tabNavigation}>
                <button
                    className={`${styles.tabButton} ${activeTab === 'all' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('all')}
                >
                    {t('githubGuru.tabs.allPRs')} ({allPullRequests.length})
                </button>
                <button
                    className={`${styles.tabButton} ${activeTab === 'mine' ? styles.activeTab : ''} ${hasNewActivity ? styles.tabWithNotification : ''}`}
                    onClick={() => setActiveTab('mine')}
                >
                    {t('githubGuru.tabs.myPRs')} ({userPullRequests.length})
                    {hasNewActivity && <span className={styles.notificationDot}></span>}
                </button>
            </div>

            {/* Content */}
            <div className={styles.content}>
                {isLoading ? (
                    <div className={styles.loading}>
                        <div className="loading-spinner"></div>
                        <span className={styles.loadingText}>{t('githubWidget.loading.fetchingPullRequests')}</span>
                    </div>
                ) : error ? (
                    <div className={styles.error}>
                        <span className="error-icon">❌</span>
                        <span className={styles.errorText}>{error}</span>
                        {!isLocked && (
                            <button onClick={fetchPullRequests} className={styles.retryBtn}>
                                🔄 {t('common.buttons.retry')}
                            </button>
                        )}
                    </div>
                ) : (
                    <div className={styles.prList}>
                        {currentPRs.map((pr) => (
                            <div
                                key={pr.id}
                                className={`${styles.prItem} ${pr.hasNewActivity ? styles.prItemWithNotification : ''}`}
                                onClick={() => handlePrClick(pr)}
                            >
                                <div className={styles.prHeader}>
                                    <span className={styles.prNumber}>#{pr.number}</span>
                                    <span className={`${styles.prState} ${pr.draft ? styles.prStateDraft : styles.prStateOpen}`}>
                                        {pr.draft ? '📝' : '🟢'} {pr.draft ? t('githubWidget.pullRequests.draft') : t('githubWidget.pullRequests.states.open')}
                                    </span>
                                    {activeTab === 'mine' && pr.hasNewActivity && (
                                        <button
                                            className={styles.dismissBtn}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                dismissNotification(pr);
                                            }}
                                            title={t('githubGuru.buttons.dismissNotification')}
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>
                                <div className={styles.prTitle}>{pr.title}</div>
                                <div className={styles.prMeta}>
                                    <span className={styles.prAuthor}>👤 {pr.user.login}</span>
                                    <span className={styles.prDate}>
                                        📅 {new Date(pr.created_at).toLocaleDateString()}
                                    </span>
                                    {pr.approvalCount !== undefined && pr.approvalCount > 0 && (
                                        <span className={styles.prApprovals}>
                                            ✅ {pr.approvalCount} {t('githubGuru.labels.approvals')}
                                        </span>
                                    )}
                                </div>
                                {pr.hasNewActivity && (
                                    <div className={styles.newActivityBadge}>
                                        {t('githubGuru.notifications.newActivity')}
                                    </div>
                                )}
                            </div>
                        ))}
                        {currentPRs.length === 0 && (
                            <div className={styles.noPRs}>
                                <img src={chrome.runtime.getURL('images/octoCat.png')} alt="No Pull Requests" />
                                <p>{activeTab === 'all' ? t('githubGuru.messages.noPRs') : t('githubGuru.messages.noUserPRs')}</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

GitHubGuru.displayName = 'GitHubGuru';

export default GitHubGuru;