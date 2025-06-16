import { OpenRouterModel } from "@/lib/api";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SettingsState {
  openRouterApiKey: string | null;
  geminiApiKey: string | null;
  selectedModel: string;
  availableModels: OpenRouterModel[];
  setOpenRouterApiKey: (key: string | null) => void;
  setGeminiApiKey: (key: string | null) => void;
  setSelectedModel: (model: string) => void;
  setAvailableModels: (models: OpenRouterModel[]) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      openRouterApiKey: null,
      geminiApiKey: null,
      selectedModel: "",
      availableModels: [],
      setOpenRouterApiKey: (key) => set({ openRouterApiKey: key }),
      setGeminiApiKey: (key) => set({ geminiApiKey: key }),
      setSelectedModel: (model) => set({ selectedModel: model }),
      setAvailableModels: (models) => set({ availableModels: models }),
    }),
    {
      name: "chat-settings",
      partialize: (state) => ({
        openRouterApiKey: state.openRouterApiKey,
        geminiApiKey: state.geminiApiKey,
        selectedModel: state.selectedModel,
      }),
    }
  )
); 