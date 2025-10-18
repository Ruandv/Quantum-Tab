import { GoogleGenAI } from '@google/genai';

export default class GeminiService {
    private static instance: GeminiService | null = null;
    private readonly googleGenAI: GoogleGenAI;

    private constructor(GEMINI_API_KEY: string) {
        this.googleGenAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    }

    public static getInstance(GEMINI_API_KEY: string): GeminiService {
        if (!GeminiService.instance) {
            GeminiService.instance = new GeminiService(GEMINI_API_KEY);
        }
        return GeminiService.instance;
    }

    public async generateResponse(prompt: string): Promise<string> {
        const response = await this.googleGenAI.models.generateContent({
            model: "gemini-2.5-flash-image-preview",
            contents: {
                "parts": [
                    {
                        "text": "Generate a details image based on the following description: " + prompt
                    }
                ]
            }
        });
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                const imageData = part.inlineData.data;
                const mimeType = part.inlineData.mimeType || 'image/jpeg';
                return `data:${mimeType};base64,${imageData}`;
            }

            if (part.text) {
                return part.text;
            }
        }

        return '';
    }
}