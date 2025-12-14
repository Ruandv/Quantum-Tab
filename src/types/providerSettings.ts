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

export type ProviderSettings =
    | GeminiProviderSettings
    | AzureOpenAiProviderSettings
    | GitHubProviderSettings;

export type ProviderType = 'Gemini' | 'AzureAi' | 'GitHub';

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
};