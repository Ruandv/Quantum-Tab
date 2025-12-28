import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './azureAdoBoard.module.css';
import {
  AzureAdoBoardProps,
  AzureBoardPayload,
  AzureBoardColumn,
  AzureWorkItem,
  BackgroundMessage,
  BackgroundResponse,
} from '@/types/common';
import chromeStorage from '@/utils/chromeStorage';
import { addWidgetRemovalListener } from '@/utils/widgetEvents';

const MAX_ITEMS_PER_PAGE = 20;

interface AzureBoardWidgetMetaData {
  lastFetch?: string;
  boardData?: AzureBoardPayload;
  visibleCounts?: Record<string, number>;
  filterText?: string;
}

type ColumnItemsMap = Record<string, AzureWorkItem[]>;

type TypeCategory = 'bug' | 'pbi' | 'nonFunctional' | 'defect' | 'security' | 'other';

const TYPE_CONFIG: Record<TypeCategory, { icon: string; labelKey: string }> = {
  bug: { icon: '🐞', labelKey: 'azureAdoBoard.types.bug' },
  pbi: { icon: '📦', labelKey: 'azureAdoBoard.types.pbi' },
  nonFunctional: { icon: '🧱', labelKey: 'azureAdoBoard.types.nonFunctional' },
  defect: { icon: '⚠️', labelKey: 'azureAdoBoard.types.defect' },
  security: { icon: '🔐', labelKey: 'azureAdoBoard.types.security' },
  other: { icon: '📋', labelKey: 'azureAdoBoard.types.other' },
};

const AzureAdoBoard: React.FC<AzureAdoBoardProps> = ({
  providerName,
  boardUrl,
  areaPath,
  iterationPath,
  autoRefresh = false,
  refreshInterval = 5,
  isLocked,
  widgetId,
}: AzureAdoBoardProps) => {
  const { t } = useTranslation();

  const [columns, setColumns] = useState<AzureBoardColumn[]>([]);
  const [workItems, setWorkItems] = useState<AzureWorkItem[]>([]);
  const [visibleCounts, setVisibleCounts] = useState<Record<string, number>>({});
  const [activeColumnId, setActiveColumnId] = useState<string>('');
  const [boardInfo, setBoardInfo] = useState<{ id: string; name: string }>({ id: '', name: '' });
  const [filterText, setFilterText] = useState('');
  const [lastFetch, setLastFetch] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [patToken, setPatToken] = useState('');

  // Load PAT token for selected provider
  useEffect(() => {
    const loadProvider = async () => {
      if (!providerName) {
        setPatToken('');
        return;
      }
      const providerSettings = await chromeStorage.getProviderConfiguration(providerName);
      const token = (providerSettings as { PatToken?: string })?.PatToken;
      setPatToken(token || '');
    };

    loadProvider();
  }, [providerName, widgetId]);

  // Load cached data
  useEffect(() => {
    const loadMetaData = async () => {
      if (!widgetId) return;
      const meta = await chromeStorage.getWidgetMetaData<AzureBoardWidgetMetaData>(widgetId);
      if (meta?.boardData) {
        setColumns(meta.boardData.columns || []);
        setWorkItems(meta.boardData.workItems || []);
        setBoardInfo({ id: meta.boardData.boardId, name: meta.boardData.boardName });
        setActiveColumnId((meta.boardData.columns || [])[0]?.id || '');
        if (meta.boardData.retrievedAt) {
          setLastFetch(new Date(meta.boardData.retrievedAt));
        }
      }
      if (meta?.visibleCounts) {
        setVisibleCounts(meta.visibleCounts);
      }
      if (meta?.filterText) {
        setFilterText(meta.filterText);
      }
      if (meta?.lastFetch) {
        setLastFetch(new Date(meta.lastFetch));
      }
    };

    loadMetaData();
  }, [widgetId]);

  // Persist metadata when data changes
  useEffect(() => {
    if (!widgetId) return;
    const persist = async () => {
      const payload: AzureBoardPayload = {
        boardId: boardInfo.id,
        boardName: boardInfo.name,
        columns,
        workItems,
        retrievedAt: lastFetch ? lastFetch.toISOString() : new Date().toISOString(),
      };

      await chromeStorage.setWidgetMetaData<AzureBoardWidgetMetaData>(widgetId, {
        lastFetch: lastFetch?.toISOString(),
        boardData: payload,
        visibleCounts,
        filterText,
      });
    };

    persist();
  }, [widgetId, columns, workItems, boardInfo, lastFetch, visibleCounts, filterText]);

  // Ensure visible counts exist for every column
  useEffect(() => {
    if (columns.length === 0) return;

    setVisibleCounts((prev) => {
      const next: Record<string, number> = { ...prev };
      let changed = false;

      columns.forEach((column) => {
        if (!next[column.id]) {
          next[column.id] = MAX_ITEMS_PER_PAGE;
          changed = true;
        }
      });

      Object.keys(next).forEach((key) => {
        if (!columns.some((column) => column.id === key)) {
          delete next[key];
          changed = true;
        }
      });

      return changed ? next : prev;
    });

    if (!activeColumnId || !columns.some((column) => column.id === activeColumnId)) {
      setActiveColumnId(columns[0].id);
    }
  }, [columns, activeColumnId]);

  // Listen for widget removal to clear state
  useEffect(() => {
    if (!widgetId) return;

    const removeListener = addWidgetRemovalListener(widgetId, async () => {
      setColumns([]);
      setWorkItems([]);
      setVisibleCounts({});
      setBoardInfo({ id: '', name: '' });
      setLastFetch(null);
      setError(null);
    });

    return removeListener;
  }, [widgetId]);

  const normalizedFilter = filterText.trim().toLowerCase();

  const groupItemsByColumn = useMemo(() => {
    const map: ColumnItemsMap = {};
    columns.forEach((column) => {
      map[column.id] = [];
    });

    workItems.forEach((item) => {
      const targetColumnId = item.boardColumnId || columns[0]?.id || 'unmapped';
      if (!map[targetColumnId]) {
        map[targetColumnId] = [];
      }
      map[targetColumnId].push(item);
    });

    Object.keys(map).forEach((key) => {
      map[key] = map[key].sort((a, b) => {
        const dateA = a.changedDate ? new Date(a.changedDate).getTime() : 0;
        const dateB = b.changedDate ? new Date(b.changedDate).getTime() : 0;
        return dateB - dateA;
      });
    });

    return map;
  }, [columns, workItems]);

  const filterWorkItems = useCallback(
    (item: AzureWorkItem) => {
      if (!normalizedFilter) {
        return true;
      }
      const haystack = [
        item.title,
        item.assignedTo?.displayName || '',
        item.tags.join(' '),
        item.state,
        item.workItemType,
        String(item.id),
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalizedFilter);
    },
    [normalizedFilter]
  );

  const filteredCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    Object.keys(groupItemsByColumn).forEach((columnId) => {
      counts[columnId] = groupItemsByColumn[columnId].filter(filterWorkItems).length;
    });
    return counts;
  }, [groupItemsByColumn, filterWorkItems]);

  const fetchBoardData = useCallback(async () => {
    if (!patToken || !boardUrl) {
      setError(t('azureAdoBoard.errors.missingConfiguration'));
      return;
    }

    setIsLoading(true);
    setError(null);
    const areaPaths = areaPath?.trim() || undefined;
    const iterationPaths = iterationPath?.trim() || undefined;
    console.warn('RDV - Initiating fetch for Azure DevOps board data...', {
      boardUrl,
      areaPaths,
      iterationPaths,
    });
    try {
      const message: BackgroundMessage = {
        action: 'fetchAzureBoardData',
        data: {
          patToken,
          boardUrl,
          areaPath: areaPaths,
          iterationPath: iterationPaths,
        },
      };

      const response = await new Promise<BackgroundResponse>((resolve) => {
        chrome.runtime.sendMessage(message, (res: BackgroundResponse) => resolve(res));
      });

      if (chrome.runtime.lastError) {
        setError(
          `${t('azureAdoBoard.errors.extensionError')}: ${chrome.runtime.lastError.message}`
        );
        setIsLoading(false);
        return;
      }

      if (response.success && response.data) {
        const payload = response.data as AzureBoardPayload;
        setColumns(payload.columns);
        setWorkItems(payload.workItems);
        setBoardInfo({ id: payload.boardId, name: payload.boardName });
        setLastFetch(new Date(payload.retrievedAt));
        if (payload.columns.length > 0) {
          setActiveColumnId(payload.columns[0].id);
        }
      } else {
        setError(response.error || t('azureAdoBoard.errors.fetchFailed'));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('azureAdoBoard.errors.fetchFailed'));
    } finally {
      setIsLoading(false);
    }
  }, [patToken, boardUrl, areaPath, iterationPath, t]);

  // Initial data fetch
  useEffect(() => {
    if (patToken && boardUrl) {
      fetchBoardData();
    }
  }, [patToken, boardUrl, areaPath, iterationPath, fetchBoardData]);

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh || !refreshInterval || !patToken) {
      return;
    }

    const intervalId = window.setInterval(
      () => {
        fetchBoardData();
      },
      refreshInterval * 60 * 1000
    );

    return () => window.clearInterval(intervalId);
  }, [autoRefresh, refreshInterval, fetchBoardData, patToken]);

  const handleItemClick = useCallback(
    (item: AzureWorkItem) => {
      if (!isLocked) {
        alert(t('quickActionButtons.messages.editState'));
        return;
      }
      window.open(item.url, '_blank');
    },
    [isLocked, t]
  );

  const handleLoadMore = useCallback((columnId: string) => {
    setVisibleCounts((prev) => ({
      ...prev,
      [columnId]: (prev[columnId] || MAX_ITEMS_PER_PAGE) + MAX_ITEMS_PER_PAGE,
    }));
  }, []);

  const renderCard = (item: AzureWorkItem) => {
    const category = (item.typeCategory || 'other') as TypeCategory;
    const typeInfo = TYPE_CONFIG[category] || TYPE_CONFIG.other;
    const displayedTags = item.tags.slice(0, 2);
    const hasTagOverflow = item.tags.length > 2;

    return (
      <div key={item.id} className={styles.card} onClick={() => handleItemClick(item)}>
        <div className={styles.cardHeader}>
          <span className={styles.itemId}>#{item.id}</span>
          <span className={`${styles.typeBadge} ${styles[category]}`}>
            {typeInfo.icon} {t(typeInfo.labelKey)}
          </span>
        </div>
        <div className={styles.cardTitle}>{item.title}</div>
        <div className={styles.metaRow}>
          <span className={styles.stateChip}>{item.state}</span>
          <span className={styles.workItemType}>{item.workItemType}</span>
          <span className={styles.updatedAt}>
            {item.changedDate
              ? new Date(item.changedDate).toLocaleDateString()
              : t('azureAdoBoard.labels.unknown')}
          </span>
        </div>
        <div className={styles.metaRow}>
          <span className={styles.assignee}>
            👤 {item.assignedTo?.displayName || t('azureAdoBoard.labels.unassigned')}
          </span>
          {item.priority && (
            <span className={styles.priority}>
              ⬆️ {t('azureAdoBoard.labels.priority', { value: item.priority })}
            </span>
          )}
        </div>
        <div className={styles.tagsRow}>
          {displayedTags.map((tag) => (
            <span key={tag} className={styles.tag}>
              #{tag}
            </span>
          ))}
          {hasTagOverflow && <span className={styles.tagOverflow}>...</span>}
        </div>
      </div>
    );
  };

  const activeColumnItems = useMemo(() => {
    const columnItems = groupItemsByColumn[activeColumnId] || [];
    const filteredItems = columnItems.filter(filterWorkItems);
    const visibleLimit = visibleCounts[activeColumnId] || MAX_ITEMS_PER_PAGE;
    return {
      items: filteredItems.slice(0, visibleLimit),
      total: filteredItems.length,
      hasMore: filteredItems.length > visibleLimit,
    };
  }, [groupItemsByColumn, activeColumnId, filterWorkItems, visibleCounts]);

  return (
    <div className={styles.adoBoard}>
      <div className={styles.header}>
        <div className={styles.controls}>
          <button className={styles.refreshBtn} onClick={fetchBoardData}>
            🔄 {t('common.buttons.refresh')}
          </button>
          {lastFetch && (
            <span className={styles.lastUpdated}>
              {t('azureAdoBoard.labels.lastUpdated')}: {lastFetch.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      <div className={styles.filterBar}>
        <input
          type="text"
          value={filterText}
          onChange={(event) => setFilterText(event.target.value)}
          placeholder={t('azureAdoBoard.placeholders.filter')}
        />
      </div>

      <div className={styles.tabNavigation}>
        {columns.map((column) => (
          <button
            key={column.id}
            className={`${styles.tabButton} ${activeColumnId === column.id ? styles.activeTab : ''}`}
            onClick={() => setActiveColumnId(column.id)}
          >
            {column.name} ({filteredCounts[column.id] ?? 0})
          </button>
        ))}
      </div>

      <div className={styles.content}>
        {isLoading ? (
          <div className={styles.loadingState}>
            <div className="loading-spinner" />
            <span>{t('common.states.loading')}</span>
          </div>
        ) : error ? (
          <div className={styles.errorState}>
            <span className={styles.errorText}>{error}</span>
            <button className={styles.retryBtn} onClick={fetchBoardData}>
              {t('common.buttons.retry')}
            </button>
          </div>
        ) : activeColumnItems.total === 0 ? (
          <div className={styles.emptyState}>
            <p>
              {normalizedFilter
                ? t('azureAdoBoard.messages.noFilterResults')
                : t('azureAdoBoard.messages.noItems')}
            </p>
          </div>
        ) : (
          <>
            <div className={styles.cardList}>{activeColumnItems.items.map(renderCard)}</div>
            {activeColumnItems.hasMore && (
              <button className={styles.loadMoreBtn} onClick={() => handleLoadMore(activeColumnId)}>
                {t('azureAdoBoard.buttons.loadMore')}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

AzureAdoBoard.displayName = 'AzureAdoBoard';

export default AzureAdoBoard;
