import { create } from "zustand";

interface RetryMessageState {
  aiMessageId: string | null;
  parentId: string | null;
  userMessageContent: string | null;
  selectedModel: string | null;
  isRetrying: boolean;
  setRetryData: (data: {
    aiMessageId: string;
    parentId: string;
    userMessageContent: string;
    selectedModel: string;
  }) => void;
  reset: () => void;
}
export const useRetryMessageStore = create<RetryMessageState>((set) => ({
  aiMessageId: null,
  parentId: null,
  userMessageContent: null,
  selectedModel: null,
  isRetrying: false,
  setSelectedModel: (model) => set({ selectedModel: model }),
  setIsRetrying: (isRetrying) => set({ isRetrying }),
  setRetryData: (data) =>
    set({
      aiMessageId: data.aiMessageId,
      parentId: data.parentId,
      userMessageContent: data.userMessageContent,
      selectedModel: data.selectedModel,
      isRetrying: true
    }),
  reset: () =>
    set({
      aiMessageId: null,
      parentId: null,
      userMessageContent: null,
      selectedModel: null,
      isRetrying: false,
    }),
}));

