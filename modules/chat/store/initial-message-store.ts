import { create } from "zustand";

interface Attachment {
  fileId: string;
  name: string;
  size: number;
  fileType: string;
  url: string;
  thumbnailUrl: string;
  width?: number;
  height?: number;
  filePath: string;
}

interface InitialMessageState {
  message: string | null;
  attachments?: Attachment[] | null;
  setMessage: (message: string | null) => void;
  setAttachments?: (attachments: Attachment[] | null) => void;
  setPrompt: (title: string, description: string) => void;
}

export const useInitialMessageStore = create<InitialMessageState>((set) => ({
  message: null,
  attachments: null,
  setMessage: (message) => set({ message }),
  setAttachments: (attachments) => set({ attachments }),
  setPrompt: (title, description) =>
    set({
      message: description ? `${title}: ${description}` : title,
    }),
}));
