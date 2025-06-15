"use client";

import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Paperclip, ArrowUp, Loader2, StopCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSettingsStore } from "../store/settings-store";
import { ModelSelector } from "@/components/model-selector/model-selector";
import { WebSearchToggle } from "@/components/web-search-toggle";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

interface ChatInputBoxProps {
  onSend?: (message: string, model: string) => void;
  onStop?: () => void;
  loading?: boolean;
  webSearchConfig?: {
    enabled: boolean;
    maxResults?: number;
    onConfigChange?: (config: { enabled: boolean }) => void;
  };
  message?: string | null;
}

const ChatInputBox: React.FC<ChatInputBoxProps> = ({
  onSend,
  onStop,
  loading,
  webSearchConfig = { enabled: false },
  message: initialMessage,
}) => {
  const path = usePathname();

  const {
    selectedModel,
    setSelectedModel,
    setOpenRouterApiKey,
    openRouterApiKey,
    availableModels,
    setGeminiApiKey,
    geminiApiKey,
  } = useSettingsStore();

  const [inputValue, setInputValue] = useState(initialMessage || "");

  useEffect(() => {
    if (initialMessage !== undefined) {
      setInputValue(initialMessage || "");
    }
  }, [initialMessage]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (inputValue.trim() && !loading) {
        if (onSend) {
          onSend(inputValue, selectedModel);
        }
        setInputValue("");
      }
    }
  };

  const hasImageInput = availableModels?.some(
    (m) =>
      m.id === selectedModel &&
      m.architecture?.input_modalities?.includes("image")
  );

  const hasFileInput = availableModels?.some(
    (m) =>
      m.id === selectedModel &&
      m.architecture?.input_modalities?.includes("file")
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    onSend?.(inputValue.trim(), selectedModel);
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
              selectedModel={selectedModel}
              onModelSelect={setSelectedModel}
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
                    m.id === selectedModel &&
                    m.supported_parameters?.includes("tools")
                ) ?? false
              }
            />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  className={cn(
                    "text-gray-300 bg-transparent hover:text-white hover:bg-gray-500/20 border border-zinc-700 h-7 p-1.5 cursor-pointer disabled:cursor-not-allowed",
                    !hasImageInput && "opacity-50 cursor-not-allowed"
                  )}
                  // disabled={!hasImageInput || !hasFileInput}
                >
                  <Paperclip className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                {hasImageInput ? (
                  <p>Attach image</p>
                ) : hasFileInput ? (
                  <p>Attach file</p>
                ) : (
                  <p>File upload is not supported</p>
                )}
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="flex items-center gap-2">
            {!loading && (
              <Button
                onClick={handleSubmit}
                disabled={!inputValue.trim() || loading}
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
            {path !== "/" && loading && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="default"
                    size="icon"
                    className="h-8 w-8 rounded-md cursor-pointer bg-button/80 hover:bg-button/60"
                    onClick={() => {
                      if (onStop) {
                        onStop();
                      }
                    }}
                  >
                    <StopCircle className="size-4 font-bold" />
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
