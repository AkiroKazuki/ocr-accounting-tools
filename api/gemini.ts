// File: /api/gemini.ts
// This is a Vercel Serverless Function that runs on Node.js
import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ message: 'Only POST requests are allowed' });
  }

  try {
    const apiKey = process.env.VITE_GEMINI_API_KEY; // Reads from Vercel's environment variables
    if (!apiKey) {
      throw new Error("API Key not configured on server.");
    }

    const { base64ImageString, mimeType, prompt } = request.body;

    const ai = new GoogleGenerativeAI(apiKey);
    const model = ai.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

    const imagePart = {
      inlineData: { data: base64ImageString, mimeType },
    };

    const result = await model.generateContent([prompt, imagePart]);
    const text = result.response.text();

    // Send the successful response back to your React app
    response.status(200).json({ text });

  } catch (error) {
    console.error("Error in Gemini API call:", error);
    // Send an error response back to your React app
    response.status(500).json({ message: `Error processing image: ${error.message}` });
  }
}