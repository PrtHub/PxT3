import OpenAI from "openai";

export const getOpenRouterClient = (userApiKey?: string | null) => {
  const apiKey = userApiKey || process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("No API key provided");
  }
  
  return new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey,
  });
};

export const openrouter = getOpenRouterClient();

