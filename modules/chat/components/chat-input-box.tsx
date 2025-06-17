"use client";

import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowUp, Loader2, StopCircle, X } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSettingsStore } from "../store/settings-store";
import { ModelSelector } from "@/components/model-selector/model-selector";
import { WebSearchToggle } from "@/components/web-search-toggle";
import { usePathname, useRouter } from "next/navigation";
import FileUploadComponent from "@/components/file-upload";
import { Image, ImageKitProvider } from "@imagekit/next";
import { useAttachmentsStore } from "../store/attachments-store";
import { useSession } from "next-auth/react";
import { useInitialMessageStore } from "../store/initial-message-store";

interface ChatInputBoxProps {
  onSend?: (message: string, model: string, attachments?: any[]) => void;
  onStop?: () => void;
  loading?: boolean;
  webSearchConfig?: {
    enabled: boolean;
    maxResults?: number;
    onConfigChange?: (config: { enabled: boolean }) => void;
  };
  message?: string | null;
  attachments?: any[];
}

const ChatInputBox: React.FC<ChatInputBoxProps> = ({
  onSend,
  onStop,
  loading,
  webSearchConfig = { enabled: false },
  message: initialMessage,
  attachments: initialAttachments,
}) => {
  const router = useRouter();
  const path = usePathname();
  const chatId = path === '/' ? 'new-chat' : path.split("/")[2];
  const { addAttachment, getAttachments, removeAttachment } =
    useAttachmentsStore();
    const {initialModel} = useInitialMessageStore()
  const {
    setSelectedModel,
    setOpenRouterApiKey,
    openRouterApiKey,
    availableModels,
    setGeminiApiKey,
    geminiApiKey,
    selectedModels
  } = useSettingsStore();

  const session = useSession();

  const [inputValue, setInputValue] = useState(initialMessage || "");
  const attachments = initialAttachments || getAttachments(chatId);

  const selectedModel = selectedModels[chatId];

  useEffect(() => {
    if (initialMessage !== undefined) {
      setInputValue(initialMessage || "");
    }
  }, [initialMessage]);

  useEffect(() => {
    if (!selectedModel) {
      const defaultModel = availableModels[0]?.id;
      if (defaultModel) {
        setSelectedModel(chatId, defaultModel);
      }
    }
  }, [selectedModel, chatId, availableModels, setSelectedModel]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (inputValue.trim() && !loading) {
        if (onSend) {
          onSend(inputValue, selectedModel, attachments);
        }
        setInputValue("");
      }
    }
  };

  const hasImageInput = availableModels?.some(
    (m) =>
      m.id === initialModel &&
      m.architecture?.input_modalities?.includes("image")
  );

  const handleUploadSuccess = (response: any) => {
    addAttachment(chatId, {
      fileId: response.fileId,
      name: response.name,
      size: response.size,
      fileType: response.fileType,
      url: response.url,
      thumbnailUrl: response.thumbnailUrl,
      width: response.width,
      height: response.height,
      filePath: response.filePath,
    });
  };

  const handleUploadError = (error: unknown) => {
    console.error("Upload error:", error);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!session.data?.user) {
      router.push("/auth");
      return;
    }
    if (!inputValue.trim() && attachments.length === 0) return;
    onSend?.(inputValue.trim(), selectedModel, attachments);
    setInputValue("");
  };

  return (
    <div className="absolute bottom-3 left-0 right-0 max-w-3xl mx-auto flex items-center justify-center h-28 px-4">
      <section className="w-full bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700 rounded-t-md p-4">
        <div className="mb-4">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyUp={handleKeyPress}
            placeholder="Type your message here..."
            className="bg-transparent border-none text-gray-300 placeholder-gray-500 text-base p-0 h-auto min-h-[60px] resize-none focus-visible:ring-0 focus-visible:ring-offset-0"
            style={{ fontSize: "16px" }}
            disabled={loading}
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ModelSelector
              selectedModel={selectedModel || initialModel || ''}
              onModelSelect={(model) => setSelectedModel(chatId, model)}
              onApiKeyChange={setOpenRouterApiKey}
              currentApiKey={openRouterApiKey}
              geminiApiKey={geminiApiKey}
              onGeminiApiKeyChange={setGeminiApiKey}
            />

            <WebSearchToggle
              enabled={webSearchConfig.enabled}
              onToggle={(enabled) =>
                webSearchConfig.onConfigChange?.({ enabled })
              }
              hasWebSearch={
                availableModels?.some(
                  (m) =>
                    m.id === initialModel &&
                    m.supported_parameters?.includes("tools")
                ) ?? false
              }
            />
            <FileUploadComponent
              onUploadSuccess={handleUploadSuccess}
              onUploadError={handleUploadError}
              disabled={loading}
              hasImageInput={hasImageInput}
              currentAttachments={attachments.length}
            />
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {attachments.map((attachment) => (
                  <div
                    key={attachment.fileId}
                    className="flex items-center gap-2 rounded-md px-2 py-1"
                  >
                    <ImageKitProvider
                      urlEndpoint={
                        process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT
                      }
                    >
                      <Image
                        src={attachment.thumbnailUrl}
                        width={30}
                        height={20}
                        alt={attachment.name}
                        className="rounded"
                      />
                    </ImageKitProvider>
                    <Button
                      asChild
                      variant={"ghost"}
                      size="icon"
                      onClick={() =>
                        removeAttachment(chatId, attachment.fileId)
                      }
                      className="text-zinc-400 hover:text-white cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!loading && (
              <Button
                onClick={handleSubmit}
                disabled={
                  (!inputValue.trim() && attachments.length === 0) || loading
                }
                size="icon"
                className="bg-button hover:bg-button/90 disabled:bg-button/50 disabled:opacity-50 h-8 w-8 rounded-md cursor-pointer"
              >
                {loading ? (
                  <Loader2 className="size-4 animate-spin text-black" />
                ) : (
                  <ArrowUp className="size-4" />
                )}
              </Button>
            )}
            {loading && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                  asChild
                    variant="default"
                    size="icon"
                    className=" rounded-md cursor-pointer bg-button/80 hover:bg-button/60 w-8 h-8"
                    onClick={() => {
                      if (onStop) {
                        onStop();
                      }
                    }}
                  >
                    <StopCircle className="p-1.5"/>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Stop </p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default ChatInputBox;
