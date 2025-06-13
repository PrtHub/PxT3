export const freeModels = {
  "data": [
    {
      "id": "google/gemini-2.0-flash-exp:free",
      "name": "Gemini 2.0 Flash",
      "created": 1741818122,
      "description": "Google's Gemini 2.0 Flash model",
      "architecture": {
        "input_modalities": ["text", "image"],
        "output_modalities": ["text"],
        "tokenizer": "GPT"
      },
      "top_provider": {
        "is_moderated": true
      },
      "pricing": {
        "prompt": "0.0000007",
        "completion": "0.0000007",
        "image": "0",
        "request": "0",
        "input_cache_read": "0",
        "input_cache_write": "0",
        "web_search": "0",
        "internal_reasoning": "0"
      },
      "context_length": 128000,
      "hugging_face_id": "google/gemini-2.0-flash-exp",
      "per_request_limits": {},
      "supported_parameters": ["temperature", "max_tokens", "top_p", "frequency_penalty", "presence_penalty"]
    },
    {
      "id": "deepseek/deepseek-r1-0528:free",
      "name": "DeepSeek R1",
      "created": 1741818122,
      "description": "DeepSeek R1 model",
      "architecture": {
        "input_modalities": ["text"],
        "output_modalities": ["text"],
        "tokenizer": "GPT"
      },
      "top_provider": {
        "is_moderated": true
      },
      "pricing": {
        "prompt": "0.0000007",
        "completion": "0.0000007",
        "image": "0",
        "request": "0",
        "input_cache_read": "0",
        "input_cache_write": "0",
        "web_search": "0",
        "internal_reasoning": "0"
      },
      "context_length": 128000,
      "hugging_face_id": "deepseek-ai/deepseek-r1-0528",
      "per_request_limits": {},
      "supported_parameters": ["temperature", "max_tokens", "top_p"]
    },
    {
      "id": "deepseek/deepseek-r1-0528-qwen3-8b:free",
      "name": "DeepSeek R1 Qwen3",
      "created": 1741818122,
      "description": "DeepSeek R1 with Qwen3 architecture",
      "architecture": {
        "input_modalities": ["text"],
        "output_modalities": ["text"],
        "tokenizer": "Qwen"
      },
      "top_provider": {
        "is_moderated": true
      },
      "pricing": {
        "prompt": "0.0000007",
        "completion": "0.0000007",
        "image": "0",
        "request": "0",
        "input_cache_read": "0",
        "input_cache_write": "0",
        "web_search": "0",
        "internal_reasoning": "0"
      },
      "context_length": 128000,
      "hugging_face_id": "deepseek-ai/deepseek-r1-0528-qwen3-8b",
      "per_request_limits": {},
      "supported_parameters": ["temperature", "max_tokens", "top_p"]
    },
    {
      "id": "qwen/qwen3-8b:free",
      "name": "Qwen 3",
      "created": 1741818122,
      "description": "Qwen 3 8B model",
      "architecture": {
        "input_modalities": ["text"],
        "output_modalities": ["text"],
        "tokenizer": "Qwen"
      },
      "top_provider": {
        "is_moderated": true
      },
      "pricing": {
        "prompt": "0.0000007",
        "completion": "0.0000007",
        "image": "0",
        "request": "0",
        "input_cache_read": "0",
        "input_cache_write": "0",
        "web_search": "0",
        "internal_reasoning": "0"
      },
      "context_length": 128000,
      "hugging_face_id": "Qwen/Qwen-8B",
      "per_request_limits": {},
      "supported_parameters": ["temperature", "max_tokens", "top_p"]
    },
    {
      "id": "deepseek/deepseek-chat-v3-0324:free",
      "name": "DeepSeek V3",
      "created": 1741818122,
      "description": "DeepSeek Chat V3 model",
      "architecture": {
        "input_modalities": ["text"],
        "output_modalities": ["text"],
        "tokenizer": "GPT"
      },
      "top_provider": {
        "is_moderated": true
      },
      "pricing": {
        "prompt": "0.0000007",
        "completion": "0.0000007",
        "image": "0",
        "request": "0",
        "input_cache_read": "0",
        "input_cache_write": "0",
        "web_search": "0",
        "internal_reasoning": "0"
      },
      "context_length": 128000,
      "hugging_face_id": "deepseek-ai/deepseek-chat-v3-0324",
      "per_request_limits": {},
      "supported_parameters": ["temperature", "max_tokens", "top_p"]
    },
    {
      "id": "deepseek/deepseek-r1-zero:free",
      "name": "DeepSeek R1 Zero",
      "created": 1741818122,
      "description": "DeepSeek R1 Zero model",
      "architecture": {
        "input_modalities": ["text"],
        "output_modalities": ["text"],
        "tokenizer": "GPT"
      },
      "top_provider": {
        "is_moderated": true
      },
      "pricing": {
        "prompt": "0.0000007",
        "completion": "0.0000007",
        "image": "0",
        "request": "0",
        "input_cache_read": "0",
        "input_cache_write": "0",
        "web_search": "0",
        "internal_reasoning": "0"
      },
      "context_length": 128000,
      "hugging_face_id": "deepseek-ai/deepseek-r1-zero",
      "per_request_limits": {},
      "supported_parameters": ["temperature", "max_tokens", "top_p"]
    },
    {
      "id": "mistralai/mistral-small-24b-instruct-2501:free",
      "name": "Mistral Small",
      "created": 1741818122,
      "description": "Mistral Small 24B Instruct model",
      "architecture": {
        "input_modalities": ["text"],
        "output_modalities": ["text"],
        "tokenizer": "Mistral"
      },
      "top_provider": {
        "is_moderated": true
      },
      "pricing": {
        "prompt": "0.0000007",
        "completion": "0.0000007",
        "image": "0",
        "request": "0",
        "input_cache_read": "0",
        "input_cache_write": "0",
        "web_search": "0",
        "internal_reasoning": "0"
      },
      "context_length": 128000,
      "hugging_face_id": "mistralai/Mistral-7B-Instruct-v0.2",
      "per_request_limits": {},
      "supported_parameters": ["temperature", "max_tokens", "top_p"]
    },
    {
      "id": "meta-llama/llama-4-scout:free",
      "name": "Llama 4 Scout",
      "created": 1741818122,
      "description": "Meta's Llama 4 Scout model",
      "architecture": {
        "input_modalities": ["text"],
        "output_modalities": ["text"],
        "tokenizer": "Llama"
      },
      "top_provider": {
        "is_moderated": true
      },
      "pricing": {
        "prompt": "0.0000007",
        "completion": "0.0000007",
        "image": "0",
        "request": "0",
        "input_cache_read": "0",
        "input_cache_write": "0",
        "web_search": "0",
        "internal_reasoning": "0"
      },
      "context_length": 128000,
      "hugging_face_id": "meta-llama/Llama-4-Scout-8B",
      "per_request_limits": {},
      "supported_parameters": ["temperature", "max_tokens", "top_p"]
    },
    {
      "id": "google/gemma-3-4b-it:free",
      "name": "Gemma 3 4B It",
      "created": 1741818122,
      "description": "Google's Gemma 3 4B Instruct model",
      "architecture": {
        "input_modalities": ["text"],
        "output_modalities": ["text"],
        "tokenizer": "Gemma"
      },
      "top_provider": {
        "is_moderated": true
      },
      "pricing": {
        "prompt": "0.0000007",
        "completion": "0.0000007",
        "image": "0",
        "request": "0",
        "input_cache_read": "0",
        "input_cache_write": "0",
        "web_search": "0",
        "internal_reasoning": "0"
      },
      "context_length": 128000,
      "hugging_face_id": "google/gemma-3-4b-it",
      "per_request_limits": {},
      "supported_parameters": ["temperature", "max_tokens", "top_p"]
    }
  ]
}