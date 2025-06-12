export interface OpenRouterModel {
    id: string;
    name: string;
    description?: string;
    pricing?: {
      prompt?: string;
      completion?: string;
    };
    context_length?: number;
    architecture: {
      tokenizer?: string;
      modality: string;
      input_modalities: string[];
      output_modalities: string[];
    };
  }
  
  export async function fetchModels(apiKey?: string): Promise<OpenRouterModel[]> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }
  
    try {
      const response = await fetch('https://openrouter.ai/api/v1/models?category=programming', {
        headers,
      });
  
      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.statusText}`);
      }
  
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching models:', error);
      throw error;
    }
  }
  