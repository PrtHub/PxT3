import { GoogleGenAI } from "@google/genai";

export const getGeminiClient = (userApiKey?: string | null) => {
  const apiKey = userApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("No API key provided");
  }

  return new GoogleGenAI({
    apiKey,
  });
};
