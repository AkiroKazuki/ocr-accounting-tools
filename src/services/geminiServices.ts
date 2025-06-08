
export const extractTextFromImageWithGemini = async (
  base64ImageString: string,
  mimeType: string,
  prompt: string
): Promise<string> => {
  
  const response = await fetch('/api/gemini', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ base64ImageString, mimeType, prompt }),
  });

  const data = await response.json();

  if (!response.ok) {

    throw new Error(data.message || 'Unknown error occurred while processing the image with Gemini AI.');
  }

  return data.text;
};