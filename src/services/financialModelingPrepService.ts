import { ShareQuote, SharePricePayload, SharePricePoint } from '@/types/common';

/**
 * FinancialModelingPrep (FMP) stable API client.
 * Docs: https://site.financialmodelingprep.com/developer/docs
 *
 * FMP sends `Access-Control-Allow-Origin: *`, so no extra host permissions are needed.
 * The API key is passed as the documented `apikey` query parameter; error messages
 * never include the URL so the key isn't surfaced in the UI.
 */
const BASE_URL = 'https://financialmodelingprep.com/stable';
const HISTORY_DAYS = 30;

type RawRecord = Record<string, unknown>;

const toNumber = (value: unknown): number | undefined => {
  const n = typeof value === 'string' ? parseFloat(value) : (value as number);
  return typeof n === 'number' && Number.isFinite(n) ? n : undefined;
};

export class FinancialModelingPrepError extends Error {
  constructor(
    message: string,
    public readonly status?: number
  ) {
    super(message);
    this.name = 'FinancialModelingPrepError';
  }
}

const request = async <T>(path: string, params: Record<string, string>, apiKey: string) => {
  const url = `${BASE_URL}/${path}?${new URLSearchParams({ ...params, apikey: apiKey }).toString()}`;
  const response = await fetch(url);

  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    // non-JSON body; handled below
  }

  const apiMessage =
    body && typeof body === 'object' && !Array.isArray(body)
      ? ((body as RawRecord)['Error Message'] as string | undefined)
      : undefined;

  if (!response.ok || apiMessage) {
    switch (response.status) {
      case 401:
        throw new FinancialModelingPrepError(
          'Invalid FinancialModelingPrep API key. Check the key in Settings.',
          401
        );
      case 402:
      case 403:
        throw new FinancialModelingPrepError(
          params.symbol
            ? `"${params.symbol}" isn't available on your FinancialModelingPrep plan. The free plan mainly covers major US stocks.`
            : 'This endpoint is not included in your FinancialModelingPrep plan.',
          response.status
        );
      case 429:
        throw new FinancialModelingPrepError(
          'FinancialModelingPrep API limit reached. Try again later or increase the refresh interval.',
          429
        );
      default:
        throw new FinancialModelingPrepError(
          apiMessage || `FinancialModelingPrep request failed (${response.status})`,
          response.status
        );
    }
  }

  return body as T;
};

const mapQuote = (raw: RawRecord): ShareQuote => ({
  symbol: String(raw.symbol ?? ''),
  name: String(raw.name ?? raw.symbol ?? ''),
  price: toNumber(raw.price) ?? 0,
  change: toNumber(raw.change) ?? 0,
  changePercentage: toNumber(raw.changePercentage ?? raw.changesPercentage) ?? 0,
  open: toNumber(raw.open),
  previousClose: toNumber(raw.previousClose),
  dayLow: toNumber(raw.dayLow),
  dayHigh: toNumber(raw.dayHigh),
  yearLow: toNumber(raw.yearLow),
  yearHigh: toNumber(raw.yearHigh),
  volume: toNumber(raw.volume),
  marketCap: toNumber(raw.marketCap),
  exchange: raw.exchange ? String(raw.exchange) : undefined,
  timestamp: toNumber(raw.timestamp),
});

export const FinancialModelingPrepService = {
  async getQuote(apiKey: string, symbol: string): Promise<ShareQuote> {
    const data = await request<RawRecord[]>('quote', { symbol }, apiKey);
    if (!Array.isArray(data) || data.length === 0) {
      throw new FinancialModelingPrepError(`No quote found for symbol "${symbol}".`, 404);
    }
    return mapQuote(data[0]);
  },

  /** Daily closing prices for the last ~30 days, oldest first. */
  async getHistory(apiKey: string, symbol: string): Promise<SharePricePoint[]> {
    const from = new Date();
    from.setDate(from.getDate() - HISTORY_DAYS);
    const data = await request<RawRecord[]>(
      'historical-price-eod/light',
      { symbol, from: from.toISOString().split('T')[0] },
      apiKey
    );
    if (!Array.isArray(data)) return [];
    return data
      .map((row) => ({
        date: String(row.date ?? ''),
        price: toNumber(row.price ?? row.close) ?? NaN,
      }))
      .filter((p) => p.date && Number.isFinite(p.price))
      .sort((a, b) => a.date.localeCompare(b.date));
  },

  async fetchSharePrice(
    apiKey: string,
    symbol: string,
    includeHistory = false
  ): Promise<SharePricePayload> {
    const normalized = symbol.trim().toUpperCase();
    const quote = await this.getQuote(apiKey, normalized);

    let history: SharePricePoint[] | undefined;
    if (includeHistory) {
      try {
        history = await this.getHistory(apiKey, normalized);
      } catch (error) {
        // History is a nice-to-have (may be plan-restricted); keep the quote.
        console.warn('FMP history request failed:', error);
      }
    }

    return { quote, history, retrievedAt: new Date().toISOString() };
  },
};

export default FinancialModelingPrepService;
