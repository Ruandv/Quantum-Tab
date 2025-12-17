export interface AIService {
    generateResponse(prompt: string): Promise<string>;
}
