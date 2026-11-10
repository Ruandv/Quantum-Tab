interface ProviderSettingsBase {
  name: string;
}

export interface GeminiProviderSettings extends ProviderSettingsBase {
  apiKey: string;
}

export interface AzureOpenAiProviderSettings extends ProviderSettingsBase {
  endpoint: string;
  apiKey: string;
  apiVersion: string;
  deploymentName: string;
}

export interface GitHubProviderSettings extends ProviderSettingsBase {
  PatToken: string;
}

export interface AzureDevOpsProviderSettings extends ProviderSettingsBase {
  PatToken: string;
}

export interface FinancialModelingPrepProviderSettings extends ProviderSettingsBase {
  apiKey: string;
}

export interface MassiveProviderSettings extends ProviderSettingsBase {
  apiKey: string;
}

export type ProviderSettings =
  | GeminiProviderSettings
  | AzureOpenAiProviderSettings
  | GitHubProviderSettings
  | AzureDevOpsProviderSettings
  | FinancialModelingPrepProviderSettings
  | MassiveProviderSettings;

export type ProviderType =
  | 'Gemini'
  | 'AzureAi'
  | 'GitHub'
  | 'AzureDevOps'
  | 'FinancialModelingPrep'
  | 'Massive';

/** Provider types that can supply stock quotes to the Share Price widget. */
export const STOCK_QUOTE_PROVIDERS = ['FinancialModelingPrep', 'Massive'] as const;
export type StockQuoteProviderType = (typeof STOCK_QUOTE_PROVIDERS)[number];

export const isStockQuoteProvider = (name: string | undefined): name is StockQuoteProviderType =>
  !!name && (STOCK_QUOTE_PROVIDERS as readonly string[]).includes(name);

export const providerRegistry: Record<string, ProviderSettings> = {
  Gemini: {
    name: 'Gemini',
    apiKey: '',
  } as GeminiProviderSettings,
  AzureAi: {
    name: 'AzureAi',
    endpoint: '',
    apiKey: '',
    apiVersion: '',
    deploymentName: '',
  } as AzureOpenAiProviderSettings,
  GitHub: {
    name: 'GitHub',
    PatToken: '',
  } as GitHubProviderSettings,
  AzureDevOps: {
    name: 'AzureDevOps',
    PatToken: '',
  } as AzureDevOpsProviderSettings,
  FinancialModelingPrep: {
    name: 'FinancialModelingPrep',
    apiKey: '',
  } as FinancialModelingPrepProviderSettings,
  Massive: {
    name: 'Massive',
    apiKey: '',
  } as MassiveProviderSettings,
};
