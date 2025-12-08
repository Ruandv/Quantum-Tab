import { GoogleGenAI } from '@google/genai';
import { AIService } from './aiService.interface';

const GeminiService = class geminiService implements AIService<geminiService> {
    private static instance: geminiService | null = null;
    private readonly service: GoogleGenAI;

    private constructor(API_KEY: string) {
        this.service = new GoogleGenAI({ apiKey: API_KEY });
    }

    public static getInstance(API_KEY: string): geminiService {
        if (!geminiService.instance) {
            geminiService.instance = new geminiService(API_KEY);
        }
        return geminiService.instance;
    }

    public async generateResponse(prompt: string): Promise<string> {
        const response = await this.service.models.generateContent({
            model: "gemini-2.5-flash-image-preview",
            contents: {
                "parts": [
                    {
                        "text": "Generate a detailed image based on the following description: " + prompt
                    }
                ]
            }
        });
        if (response.usageMetadata && typeof response.usageMetadata.totalTokenCount === 'number') {
            console.log(`Total tokens used: ${response.usageMetadata.totalTokenCount}`);
        }
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                const imageData = part.inlineData.data;
                const mimeType = part.inlineData.mimeType || 'image/jpeg';
                return `data:${mimeType};base64,${imageData}`;
            }
        }

        return '';
    }
}
export default GeminiService ;