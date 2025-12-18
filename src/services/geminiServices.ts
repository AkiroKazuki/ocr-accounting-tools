import { GoogleGenerativeAI } from "@google/generative-ai";
import { GEMINI_MODEL_NAME } from '../constants';

export const extractTextFromImageWithGemini = async (
  base64ImageString: string,
  mimeType: string,
  prompt: string
): Promise<string> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('API Key is not configured. Please set VITE_GEMINI_API_KEY in your .env file.');
  }

  try {
    const ai = new GoogleGenerativeAI(apiKey);
    const model = ai.getGenerativeModel({ model: GEMINI_MODEL_NAME });

    const imagePart = {
      inlineData: {
        data: base64ImageString,
        mimeType
      }
    };

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();

    return text;
  } catch (error: any) {
    console.error('Error calling Gemini API:', error);

    if (error.message?.includes('API_KEY_INVALID') || error.message?.includes('API key not valid')) {
      throw new Error('Invalid Gemini API Key. Please check your configuration.');
    }

    throw new Error(error.message || 'Unknown error occurred while processing the image with Gemini AI.');
  }
};