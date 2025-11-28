import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Edits an image using Gemini 2.5 Flash Image based on a text prompt.
 * @param base64Image The source image in base64 format (without data:image/ prefix)
 * @param mimeType The mime type of the source image
 * @param prompt The user's instruction (e.g., "Add a retro filter")
 * @returns The base64 string of the generated image
 */
export const editImageWithGemini = async (
  base64Image: string,
  mimeType: string,
  prompt: string
): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image,
              mimeType: mimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      // Note: responseMimeType is not supported for nano banana series models
    });

    // Iterate through parts to find the image
    const parts = response.candidates?.[0]?.content?.parts;
    if (!parts) {
      throw new Error("No content returned from Gemini");
    }

    for (const part of parts) {
      if (part.inlineData && part.inlineData.data) {
        return part.inlineData.data;
      }
    }

    throw new Error("No image data found in Gemini response");
  } catch (error) {
    console.error("Gemini Image Edit Error:", error);
    throw error;
  }
};