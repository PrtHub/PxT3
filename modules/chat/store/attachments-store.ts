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

interface AttachmentsState {
  attachments: Record<string, Attachment[]>;
  addAttachment: (chatId: string, attachment: Attachment) => void;
  removeAttachment: (chatId: string, fileId: string) => void;
  getAttachments: (chatId: string) => Attachment[];
  clearAttachments: (chatId: string) => void;
  clearAllAttachments: () => void;
}

export const useAttachmentsStore = create<AttachmentsState>((set, get) => ({
  attachments: {},

  addAttachment: (chatId: string, attachment: Attachment) => {
    set((state) => ({
      attachments: {
        ...state.attachments,
        [chatId]: [...(state.attachments[chatId] || []), attachment],
      },
    }));
  },

  removeAttachment: (chatId: string, fileId: string) => {
    set((state) => ({
      attachments: {
        ...state.attachments,
        [chatId]: (state.attachments[chatId] || []).filter(
          (att) => att.fileId !== fileId
        ),
      },
    }));
  },

  getAttachments: (chatId: string) => {
    return get().attachments[chatId] || [];
  },

  clearAttachments: (chatId: string) => {
    set((state) => {
      const newAttachments = { ...state.attachments };
      delete newAttachments[chatId];
      return { attachments: newAttachments };
    });
  },

  clearAllAttachments: () => {
    set({ attachments: {} });
  },
}));
