// This is a serverless function for Next.js that integrates with Google Gemini AI
// to extract text from an image using a provided prompt. It expects a POST request with a base64 encoded image string, its MIME type, and a prompt.
import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(request, response) {

  if (request.method !== 'POST') {
    return response.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const apiKey = process.env.VITE_GEMINI_API_KEY; 
    if (!apiKey) {
      throw new Error("API Key not configured. Please set VITE_GEMINI_API_KEY in your environment variables.");
    }

    const { base64ImageString, mimeType, prompt } = request.body;
    
    const ai = new GoogleGenerativeAI(apiKey);
    const model = ai.getGenerativeModel({ model: "gemini-2.5-flash-preview-05-20" });

    const imagePart = { inlineData: { data: base64ImageString, mimeType } };

    const result = await model.generateContent([prompt, imagePart]);
    const text = result.response.text();

    response.status(200).json({ text });

  } catch (error) {
    console.error("Error di serverless function:", error);
    response.status(500).json({ message: error.message || "Terjadi error di server." });
  }
}