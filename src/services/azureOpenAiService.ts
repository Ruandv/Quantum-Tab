import { AzureOpenAI } from 'openai';
import { AIService } from './aiService.interface';

const AzureOpenAiService = class azureOpenAIService implements AIService<azureOpenAIService> {
    private static instance: azureOpenAIService | null = null;
    private readonly service: AzureOpenAI;

    private constructor({ endpoint, apiKey, apiVersion }: { endpoint: string, apiKey: string, apiVersion: string }) {
        this.service = new AzureOpenAI({
            endpoint,
            apiKey,
            apiVersion,
        });
    }
    public static getInstance({ endpoint, apiKey, apiVersion }: { endpoint: string, apiKey: string, apiVersion: string }): azureOpenAIService {
        if (!AzureOpenAiService.instance) {

            AzureOpenAiService.instance = new azureOpenAIService({
                endpoint,
                apiKey,
                apiVersion,
            });
        }
        return AzureOpenAiService.instance;
    }

    generateResponse(prompt: string): Promise<string> {
        return Promise.resolve("Azure OpenAI Service is not yet implemented." + prompt);
    }
}
