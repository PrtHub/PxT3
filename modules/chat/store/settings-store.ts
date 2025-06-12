import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Model {
  id: string;
  name: string;
  description: string;
  context_length: number;
  pricing: {
    prompt: string;
    completion: string;
  };
}

interface SettingsState {
  openRouterApiKey: string | null;
  selectedModel: string;
  availableModels: Model[];
  setOpenRouterApiKey: (key: string | null) => void;
  setSelectedModel: (model: string) => void;
  setAvailableModels: (models: Model[]) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      openRouterApiKey: null,
      selectedModel: "deepseek/deepseek-chat-v3-0324:free",
      availableModels: [],
      setOpenRouterApiKey: (key) => set({ openRouterApiKey: key }),
      setSelectedModel: (model) => set({ selectedModel: model }),
      setAvailableModels: (models) => set({ availableModels: models }),
    }),
    {
      name: "chat-settings",
      partialize: (state) => ({
        openRouterApiKey: state.openRouterApiKey,
        selectedModel: state.selectedModel,
      }),
    }
  )
); 