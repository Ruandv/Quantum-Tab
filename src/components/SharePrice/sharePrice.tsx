import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './sharePrice.module.css';
import {
  BackgroundMessage,
  BackgroundResponse,
  SharePricePayload,
  SharePricePoint,
  SharePriceProps,
  ShareQuote,
} from '@/types/common';
import chromeStorage from '@/utils/chromeStorage';
import { addWidgetRemovalListener } from '@/utils/widgetEvents';
import { isStockQuoteProvider } from '@/types/providerSettings';

interface SharePriceMetaData {
  symbol?: string;
  quote?: ShareQuote;
  history?: SharePricePoint[];
  historyFetchedAt?: string;
  lastFetch?: string;
}

const MIN_REFRESH_MINUTES = 1;

const today = () => new Date().toISOString().split('T')[0];

const normalizeSymbol = (value: string | undefined) => (value || '').trim().toUpperCase();

const toMinutes = (value: unknown, fallback: number) => {
  const n = Number(value);
  return Number.isFinite(n) && n >= MIN_REFRESH_MINUTES ? n : fallback;
};

const isQuoteFresh = (meta: SharePriceMetaData | null, symbol: string, minutes: number) =>
  !!meta?.quote &&
  meta.symbol === symbol &&
  !!meta.lastFetch &&
  Date.now() - new Date(meta.lastFetch).getTime() < minutes * 60 * 1000;

/** Prefer new values, but keep previous ones the provider didn't return this time. */
const mergeQuote = (prev: ShareQuote | undefined, next: ShareQuote): ShareQuote => {
  if (!prev) return next;
  const merged = { ...prev } as Record<string, unknown>;
  Object.entries(next).forEach(([key, value]) => {
    if (value !== undefined && value !== '') merged[key] = value;
  });
  return merged as unknown as ShareQuote;
};

// History and slow-changing details (name, market cap) are refreshed at most once a day
const isHistoryFresh = (meta: SharePriceMetaData | null, symbol: string) =>
  !!meta?.history?.length &&
  meta.symbol === symbol &&
  !!meta.historyFetchedAt &&
  meta.historyFetchedAt.split('T')[0] === today();

const Sparkline: React.FC<{ points: number[]; positive: boolean }> = ({ points, positive }) => {
  const width = 100;
  const height = 30;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const step = width / (points.length - 1);
  const coords = points.map(
    (p, i) => `${(i * step).toFixed(2)},${(height - ((p - min) / range) * height).toFixed(2)}`
  );

  return (
    <svg
      className={`${styles.sparkline} ${positive ? styles.up : styles.down}`}
      viewBox={`0 -2 ${width} ${height + 4}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <polygon
        className={styles.sparkArea}
        points={`0,${height} ${coords.join(' ')} ${width},${height}`}
      />
      <polyline className={styles.sparkLine} points={coords.join(' ')} />
    </svg>
  );
};

const SharePrice: React.FC<SharePriceProps> = ({
  providerName,
  symbol,
  showChart = true,
  autoRefresh = true,
  refreshInterval = 15,
  widgetId,
}: SharePriceProps) => {
  const { t, i18n } = useTranslation();

  const ticker = normalizeSymbol(symbol);
  const intervalMinutes = toMinutes(refreshInterval, 15);

  const [apiKey, setApiKey] = useState<string | null>(null); // null = not loaded yet
  const [providerType, setProviderType] = useState('');
  const [meta, setMeta] = useState<SharePriceMetaData | null>(null);
  const [metaLoaded, setMetaLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const metaRef = useRef<SharePriceMetaData | null>(null);

  const applyMeta = useCallback((next: SharePriceMetaData | null) => {
    metaRef.current = next;
    setMeta(next);
  }, []);

  // Load the API key from the selected provider in the Settings widget
  useEffect(() => {
    const loadProvider = async () => {
      if (!providerName) {
        setProviderType('');
        setApiKey('');
        return;
      }
      const settings = await chromeStorage.getProviderConfiguration(providerName);
      // A provider's `name` is its type (FinancialModelingPrep, Massive, ...)
      setProviderType(settings?.name || providerName);
      setApiKey((settings as { apiKey?: string } | null)?.apiKey || '');
    };
    loadProvider();
  }, [providerName, widgetId]);

  // Load cached data
  useEffect(() => {
    const loadMeta = async () => {
      if (widgetId) {
        applyMeta(await chromeStorage.getWidgetMetaData<SharePriceMetaData>(widgetId));
      }
      setMetaLoaded(true);
    };
    loadMeta();
  }, [widgetId, applyMeta]);

  const fetchData = useCallback(
    async (force: boolean) => {
      if (!isStockQuoteProvider(providerType)) {
        setError(t('sharePrice.errors.unsupportedProvider', { provider: providerType }));
        return;
      }
      if (!apiKey || !ticker) {
        setError(t('sharePrice.errors.missingConfiguration'));
        return;
      }

      // Another open tab may have refreshed already; reuse its result to save API calls.
      if (!force && widgetId) {
        const stored = await chromeStorage.getWidgetMetaData<SharePriceMetaData>(widgetId);
        if (isQuoteFresh(stored, ticker, intervalMinutes)) {
          applyMeta(stored);
          return;
        }
      }

      const current = metaRef.current;
      const includeHistory = !isHistoryFresh(current, ticker);

      setIsLoading(true);
      setError(null);
      try {
        const message: BackgroundMessage = {
          action: 'fetchSharePrice',
          data: { provider: providerType, apiKey, symbol: ticker, includeHistory },
        };
        const response = await new Promise<BackgroundResponse>((resolve) => {
          chrome.runtime.sendMessage(message, (res: BackgroundResponse) => resolve(res));
        });

        if (chrome.runtime.lastError) {
          setError(`${t('sharePrice.errors.extensionError')}: ${chrome.runtime.lastError.message}`);
          return;
        }

        if (!response?.success || !response.data) {
          setError(response?.error || t('sharePrice.errors.fetchFailed'));
          return;
        }

        const payload = response.data as SharePricePayload;
        const sameSymbol = current?.symbol === ticker;
        const next: SharePriceMetaData = {
          symbol: ticker,
          // Some providers only return slow-changing fields (name, market cap) occasionally
          quote: mergeQuote(sameSymbol ? current?.quote : undefined, payload.quote),
          history: payload.history ?? (sameSymbol ? current?.history : undefined),
          historyFetchedAt: payload.history
            ? payload.retrievedAt
            : sameSymbol
              ? current?.historyFetchedAt
              : undefined,
          lastFetch: payload.retrievedAt,
        };
        applyMeta(next);
        if (widgetId) {
          await chromeStorage.setWidgetMetaData<SharePriceMetaData>(widgetId, next);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : t('sharePrice.errors.fetchFailed'));
      } finally {
        setIsLoading(false);
      }
    },
    [apiKey, providerType, ticker, intervalMinutes, widgetId, applyMeta, t]
  );

  // Initial load: only call the API when the cache is stale or for a different symbol
  useEffect(() => {
    if (apiKey === null || !metaLoaded) return;
    if (providerType && !isStockQuoteProvider(providerType)) {
      setError(t('sharePrice.errors.unsupportedProvider', { provider: providerType }));
      return;
    }
    if (!apiKey || !ticker) {
      setError(t('sharePrice.errors.missingConfiguration'));
      return;
    }
    const cached = metaRef.current;
    const needsDaily = !isHistoryFresh(cached, ticker);
    if (!isQuoteFresh(cached, ticker, intervalMinutes) || needsDaily) {
      fetchData(needsDaily);
    } else {
      setError(null);
    }
  }, [apiKey, providerType, metaLoaded, ticker, intervalMinutes, fetchData, t]);

  // Auto refresh (skipped while the tab is hidden)
  useEffect(() => {
    if (!autoRefresh || !apiKey || !ticker) return;
    const id = window.setInterval(
      () => {
        if (!document.hidden) fetchData(false);
      },
      intervalMinutes * 60 * 1000
    );
    return () => window.clearInterval(id);
  }, [autoRefresh, apiKey, ticker, intervalMinutes, fetchData]);

  // Clear state when the widget is removed
  useEffect(() => {
    if (!widgetId) return;
    return addWidgetRemovalListener(widgetId, async () => {
      applyMeta(null);
      setError(null);
    });
  }, [widgetId, applyMeta]);

  const locale = i18n.language || undefined;
  const formatters = useMemo(
    () => ({
      price: new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      signed: new Intl.NumberFormat(locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        signDisplay: 'always',
      }),
      compact: new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 2 }),
    }),
    [locale]
  );

  const quote = meta?.symbol === ticker ? meta?.quote : undefined;
  const lastFetch = meta?.lastFetch ? new Date(meta.lastFetch) : null;
  const isPositive = (quote?.change ?? 0) >= 0;

  const chartPoints = useMemo(() => {
    if (!showChart || !quote || meta?.symbol !== ticker || !meta?.history?.length) return [];
    const points = meta.history.map((p) => p.price);
    const lastDate = meta.history[meta.history.length - 1].date;
    if (lastDate !== today()) points.push(quote.price);
    return points.length > 1 ? points : [];
  }, [showChart, quote, meta, ticker]);

  const range = (low?: number, high?: number) =>
    low !== undefined && high !== undefined
      ? `${formatters.price.format(low)} – ${formatters.price.format(high)}`
      : '—';

  return (
    <div className={styles.sharePrice}>
      {quote ? (
        <>
          <div className={styles.header}>
            <div className={styles.identity}>
              <span className={styles.symbol}>{quote.symbol}</span>
              <span className={styles.name} title={quote.name}>
                {[quote.name, quote.exchange].filter(Boolean).join(' · ')}
              </span>
            </div>
            <button
              className={styles.refreshBtn}
              onClick={() => fetchData(true)}
              disabled={isLoading}
              title={t('common.buttons.refresh')}
              aria-label={t('common.buttons.refresh')}
            >
              <span className={isLoading ? styles.spinning : ''}>🔄</span>
            </button>
          </div>

          <div className={styles.priceRow}>
            <span className={styles.price}>{formatters.price.format(quote.price)}</span>
            <span className={`${styles.change} ${isPositive ? styles.up : styles.down}`}>
              {isPositive ? '▲' : '▼'} {formatters.signed.format(quote.change)} (
              {formatters.signed.format(quote.changePercentage)}%)
            </span>
          </div>

          {chartPoints.length > 0 && <Sparkline points={chartPoints} positive={isPositive} />}

          <div className={styles.stats}>
            <div className={styles.stat}>
              <span className={styles.statLabel}>{t('sharePrice.labels.dayRange')}</span>
              <span className={styles.statValue}>{range(quote.dayLow, quote.dayHigh)}</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statLabel}>{t('sharePrice.labels.yearRange')}</span>
              <span className={styles.statValue}>{range(quote.yearLow, quote.yearHigh)}</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statLabel}>{t('sharePrice.labels.volume')}</span>
              <span className={styles.statValue}>
                {quote.volume !== undefined ? formatters.compact.format(quote.volume) : '—'}
              </span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statLabel}>{t('sharePrice.labels.marketCap')}</span>
              <span className={styles.statValue}>
                {quote.marketCap !== undefined ? formatters.compact.format(quote.marketCap) : '—'}
              </span>
            </div>
          </div>

          <div className={styles.footer}>
            {error ? (
              <span className={styles.inlineError} title={error}>
                ⚠️ {error}
              </span>
            ) : (
              lastFetch && (
                <span>
                  {t('sharePrice.labels.lastUpdated')}: {lastFetch.toLocaleTimeString(locale)}
                </span>
              )
            )}
          </div>
        </>
      ) : isLoading ? (
        <div className={styles.state}>
          <div className="loading-spinner" />
          <span>{t('common.states.loading')}</span>
        </div>
      ) : error ? (
        <div className={styles.state}>
          <span className={styles.errorText}>{error}</span>
          {apiKey && ticker && (
            <button className={styles.retryBtn} onClick={() => fetchData(true)}>
              {t('common.buttons.retry')}
            </button>
          )}
        </div>
      ) : (
        <div className={styles.state}>
          <span>{t('common.states.loading')}</span>
        </div>
      )}
    </div>
  );
};

SharePrice.displayName = 'SharePrice';

export default SharePrice;
