import { create } from "zustand";

interface InitialMessageState {
  message: string | null;
  setMessage: (message: string | null) => void;
}

export const useInitialMessageStore = create<InitialMessageState>((set) => ({
  message: null,
  setMessage: (message) => set({ message }),
})); 