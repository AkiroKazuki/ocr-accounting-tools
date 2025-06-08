import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const modelName = import.meta.env.VITE_GEMINI_MODEL_NAME;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY not found in .env file. Please check your configuration.");
}
if (!modelName) {
    throw new Error("GEMINI_MODEL_NAME not found in .env file. Please check your configuration.");
}

const ai = new GoogleGenerativeAI(apiKey);

const model = ai.getGenerativeModel({ model: modelName });

export const extractTextFromImageWithGemini = async (
  base64ImageString: string,
  mimeType: string,
  prompt: string
): Promise<string> => {

  const imagePart = {
    inlineData: {
      mimeType: mimeType,
      data: base64ImageString,
    },
  };

  try {
    const result = await model.generateContent([prompt, imagePart]);
    const response = result.response;
    const extractedText = response.text();

    if (typeof extractedText !== 'string') {
        console.warn("Respons dari Gemini bukanlah string:", extractedText);
        throw new Error("Format respons dari Gemini API tidak valid. Seharusnya berupa teks.");
    }

    return extractedText;

  } catch (error: any) {
    console.error("Error saat memanggil Gemini API:", error);
     if (error.message && error.message.includes("API key not valid")) {
          throw new Error("API Key Gemini tidak valid. Mohon periksa kembali.");
     }

    if (error.message && error.message.includes("API key not valid")) {
        throw new Error("API Key Gemini tidak valid. Mohon periksa kembali.");
    }
    if (error.message && error.message.toLowerCase().includes("quota")) {
        throw new Error("Kuota API Gemini Anda telah habis. Silakan cek kuota Anda atau coba lagi nanti.");
    }
    throw new Error(`Request ke Gemini API gagal: ${error.message || 'Error tidak diketahui'}`);
  }
};