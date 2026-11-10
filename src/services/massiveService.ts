import { ShareQuote, SharePricePayload, SharePricePoint } from '@/types/common';

/**
 * Massive (formerly Polygon.io) stocks REST client.
 * Docs: https://massive.com/docs/rest/quickstart
 *
 * Built to work on the free "Stocks Basic" plan, which does not include the
 * real-time snapshot endpoint and only serves end-of-day data. A single daily-bars
 * request for the last year gives the latest close, the change versus the previous
 * close, the 52-week range and the chart history. Company name, market cap and
 * exchange come from Ticker Overview, which is only requested alongside history
 * (at most once a day) to keep the call count low.
 *
 * Massive allows browser (CORS) requests, so no extra host permissions are needed.
 */
const BASE_URL = 'https://api.massive.com';
const HISTORY_DAYS = 30;
const YEAR_DAYS = 365;

type RawRecord = Record<string, unknown>;

interface MassiveBar {
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
  t: number; // unix ms, start of the bar
}

const toNumber = (value: unknown): number | undefined =>
  typeof value === 'number' && Number.isFinite(value) ? value : undefined;

const isoDate = (date: Date) => date.toISOString().split('T')[0];

export class MassiveError extends Error {
  constructor(
    message: string,
    public readonly status?: number
  ) {
    super(message);
    this.name = 'MassiveError';
  }
}

const request = async <T>(
  path: string,
  params: Record<string, string>,
  apiKey: string,
  symbol: string
): Promise<T> => {
  const query = new URLSearchParams({ ...params, apiKey }).toString();
  const response = await fetch(`${BASE_URL}${path}?${query}`);

  let body: RawRecord | null = null;
  try {
    body = (await response.json()) as RawRecord;
  } catch {
    // non-JSON body; handled below
  }

  const apiMessage = (body?.error || body?.message) as string | undefined;
  const apiStatus = body?.status as string | undefined;

  if (!response.ok || apiStatus === 'ERROR' || apiStatus === 'NOT_AUTHORIZED') {
    switch (response.status) {
      case 401:
        throw new MassiveError('Invalid Massive API key. Check the key in Settings.', 401);
      case 403:
        throw new MassiveError(
          `"${symbol}" or this data isn't available on your Massive plan.`,
          403
        );
      case 404:
        throw new MassiveError(`No data found for symbol "${symbol}".`, 404);
      case 429:
        throw new MassiveError(
          'Massive API rate limit reached. Try again shortly or increase the refresh interval.',
          429
        );
      default:
        throw new MassiveError(
          apiMessage || `Massive request failed (${response.status})`,
          response.status
        );
    }
  }

  return body as T;
};

const getDailyBars = async (apiKey: string, symbol: string): Promise<MassiveBar[]> => {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - YEAR_DAYS);
  const data = await request<{ results?: RawRecord[] }>(
    `/v2/aggs/ticker/${encodeURIComponent(symbol)}/range/1/day/${isoDate(from)}/${isoDate(to)}`,
    { adjusted: 'true', sort: 'asc', limit: '5000' },
    apiKey,
    symbol
  );

  return (data.results || [])
    .map((r) => ({
      o: toNumber(r.o) ?? NaN,
      h: toNumber(r.h) ?? NaN,
      l: toNumber(r.l) ?? NaN,
      c: toNumber(r.c) ?? NaN,
      v: toNumber(r.v) ?? NaN,
      t: toNumber(r.t) ?? NaN,
    }))
    .filter((b) => Number.isFinite(b.c) && Number.isFinite(b.t));
};

const getTickerOverview = async (apiKey: string, symbol: string) => {
  const data = await request<{ results?: RawRecord }>(
    `/v3/reference/tickers/${encodeURIComponent(symbol)}`,
    {},
    apiKey,
    symbol
  );
  const r = data.results || {};
  return {
    name: r.name ? String(r.name) : '',
    marketCap: toNumber(r.market_cap),
    exchange: r.primary_exchange ? String(r.primary_exchange) : undefined,
  };
};

export const MassiveService = {
  async fetchSharePrice(
    apiKey: string,
    symbol: string,
    includeHistory = false
  ): Promise<SharePricePayload> {
    const ticker = symbol.trim().toUpperCase(); // Massive tickers are case-sensitive

    const bars = await getDailyBars(apiKey, ticker);
    if (bars.length === 0) {
      throw new MassiveError(`No price data found for symbol "${ticker}".`, 404);
    }

    const last = bars[bars.length - 1];
    const prev = bars.length > 1 ? bars[bars.length - 2] : undefined;
    const change = prev ? last.c - prev.c : 0;
    const highs = bars.map((b) => b.h).filter(Number.isFinite);
    const lows = bars.map((b) => b.l).filter(Number.isFinite);

    // Name/market cap/exchange only change slowly; fetch them with the daily history refresh.
    let overview: Awaited<ReturnType<typeof getTickerOverview>> | undefined;
    if (includeHistory) {
      try {
        overview = await getTickerOverview(apiKey, ticker);
      } catch (error) {
        console.warn('Massive ticker overview request failed:', error);
      }
    }

    const quote: ShareQuote = {
      symbol: ticker,
      name: overview?.name || '',
      price: last.c,
      change,
      changePercentage: prev && prev.c ? (change / prev.c) * 100 : 0,
      open: toNumber(last.o),
      previousClose: prev?.c,
      dayLow: toNumber(last.l),
      dayHigh: toNumber(last.h),
      yearLow: lows.length ? Math.min(...lows) : undefined,
      yearHigh: highs.length ? Math.max(...highs) : undefined,
      volume: toNumber(last.v),
      marketCap: overview?.marketCap,
      exchange: overview?.exchange,
      timestamp: Math.floor(last.t / 1000),
    };

    let history: SharePricePoint[] | undefined;
    if (includeHistory) {
      const cutoff = Date.now() - HISTORY_DAYS * 24 * 60 * 60 * 1000;
      history = bars
        .filter((b) => b.t >= cutoff)
        .map((b) => ({ date: isoDate(new Date(b.t)), price: b.c }));
    }

    return { quote, history, retrievedAt: new Date().toISOString() };
  },
};

export default MassiveService;
