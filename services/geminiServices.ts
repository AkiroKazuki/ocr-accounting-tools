import { GoogleGenerativeAI, GenerateContentResponse } from "@google/generative-ai";
import { GEMINI_MODEL_NAME } from '../constants';

// Ensure API_KEY is accessed from process.env as per instructions
const apiKey = process.env.API_KEY;

if (!apiKey) {
  console.error("Gemini API Key (process.env.API_KEY) is not set. API calls will fail.");
  // Throwing an error here would stop the app from loading if the key isn't set during build/runtime setup.
  // The UI will handle errors if API calls fail.
}

const ai = new GoogleGenerativeAI({ apiKey: apiKey || "MISSING_API_KEY" }); // Provide a dummy if missing to avoid constructor error, actual calls will fail.

export const extractTextFromImageWithGemini = async (
  base64ImageString: string,
  mimeType: string,
  prompt: string
): Promise<string> => {
  if (!apiKey) {
    throw new Error("Gemini API Key is not configured. Please ensure the API_KEY environment variable is set.");
  }

  const imagePart = {
    inlineData: {
      mimeType: mimeType,
      data: base64ImageString,
    },
  };

  const textPart = {
    text: prompt,
  };

try {

    const model = ai.getGenerativeModel({ model: GEMINI_MODEL_NAME });

    const result = await model.generateContent([
        prompt,
        imagePart
    ]);

      // config: {
      //   // Optional: Add any specific generation configs here
      //   // temperature: 0.7, 
      // }

    const response = result.response;
    
    const extractedText = response.text();

    if (typeof extractedText !== 'string') {
        console.warn("Gemini API response.text was not a string:", extractedText);
        throw new Error("Invalid response format from Gemini API. Expected text.");
    }

    return extractedText;

  } catch (error: any) {
    console.error("Error calling Gemini API:", error);
    if (error.message && error.message.includes("API key not valid")) {
        throw new Error("Invalid Gemini API Key. Please check your configuration.");
    }
    if (error.message && error.message.toLowerCase().includes("quota")) {
        throw new Error("Gemini API quota exceeded. Please check your quota or try again later.");
    }
    // Check for specific Gemini client errors or HTTP status codes if available from the error object
    // e.g. if (error.status === 400) { ... }
    throw new Error(`Gemini API request failed: ${error.message || 'Unknown error'}`);
  }
};
