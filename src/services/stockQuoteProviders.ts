import { SharePricePayload } from '@/types/common';
import { StockQuoteProviderType } from '@/types/providerSettings';
import FinancialModelingPrepService from './financialModelingPrepService';
import MassiveService from './massiveService';

/**
 * Stock quote providers available to the Share Price widget.
 * To add a provider: implement `fetchSharePrice`, register it here, and add its
 * type to STOCK_QUOTE_PROVIDERS and providerRegistry in types/providerSettings.ts.
 */
export interface StockQuoteProvider {
  fetchSharePrice(
    apiKey: string,
    symbol: string,
    includeHistory?: boolean
  ): Promise<SharePricePayload>;
}

export const stockQuoteProviders: Record<StockQuoteProviderType, StockQuoteProvider> = {
  FinancialModelingPrep: FinancialModelingPrepService,
  Massive: MassiveService,
};
