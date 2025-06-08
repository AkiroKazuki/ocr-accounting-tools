// This now calls backend, not Google

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
    // If the server responded with an error, throw it so the UI can catch it.
    throw new Error(data.message || 'An unknown error occurred on the server.');
  }

  return data.text;
};