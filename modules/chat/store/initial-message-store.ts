import { create } from "zustand";

interface InitialMessageState {
  message: string | null;
  setMessage: (message: string | null) => void;
  setPrompt: (title: string, description: string) => void;
}

export const useInitialMessageStore = create<InitialMessageState>((set) => ({
  message: null,
  setMessage: (message) => set({ message }),
  setPrompt: (title, description) =>
    set({
      message: description ? `${title}: ${description}` : title,
    }),
}));
