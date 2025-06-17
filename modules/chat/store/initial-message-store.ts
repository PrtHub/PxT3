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
  initialModel: string | null;
  setMessage: (message: string | null) => void;
  setAttachments?: (attachments: Attachment[] | null) => void;
  setPrompt: (title: string, description: string) => void;
  setInitialModel: (model: string | null) => void;
}

export const useInitialMessageStore = create<InitialMessageState>((set) => ({
  message: null,
  attachments: null,
  initialModel: 'deepseek/deepseek-chat-v3-0324:free',
  setMessage: (message) => set({ message }),
  setAttachments: (attachments) => set({ attachments }),
  setPrompt: (title, description) =>
    set({
      message: description ? `${title}: ${description}` : title,
    }),
  setInitialModel: (model) => set({ initialModel: model }),
}));
