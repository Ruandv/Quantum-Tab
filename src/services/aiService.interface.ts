export interface AIService<T> {
    generateResponse(prompt: string): Promise<string>;
}
