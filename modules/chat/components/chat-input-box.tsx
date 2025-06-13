"use client";

import React, { useState } from "react";
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

interface ChatInputBoxProps {
  onSend?: (message: string, model: string) => void;
  onStop?: () => void;
  loading?: boolean;
  webSearchConfig?: {
    enabled: boolean;
    maxResults?: number;
    onConfigChange?: (config: { enabled: boolean }) => void;
  };
}

const ChatInputBox: React.FC<ChatInputBoxProps> = ({
  onSend,
  onStop,
  loading,
  webSearchConfig = { enabled: false },
}) => {
  const [message, setMessage] = useState("");
  const {
    selectedModel,
    setSelectedModel,
    setOpenRouterApiKey,
    openRouterApiKey,
    availableModels,
    setGeminiApiKey,
    geminiApiKey,
  } = useSettingsStore();

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (message.trim() && !loading) {
        if (onSend) {
          onSend(message, selectedModel);
        }
        setMessage("");
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

  return (
    <div className="absolute bottom-3 left-0 right-0 max-w-3xl mx-auto flex items-center justify-center h-28">
      <section className="w-full bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700 rounded-t-md p-4">
        <div className="mb-4">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
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
                  className={cn("text-gray-300 bg-transparent hover:text-white hover:bg-gray-500/20 border border-zinc-700 h-7 p-1.5 cursor-pointer disabled:cursor-not-allowed", !hasImageInput && "opacity-50 cursor-not-allowed")}
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
            <Button
              onClick={() => {
                if (message.trim() && !loading) {
                  if (onSend) {
                    onSend(message, selectedModel);
                  }
                  setMessage("");
                }
              }}
              disabled={!message.trim() || loading}
              size="icon"
              className="bg-button hover:bg-button/90 disabled:bg-button/50 disabled:opacity-50 h-8 w-8 rounded-md cursor-pointer"
            >
              {loading ? (
                <Loader2 className="size-4 animate-spin text-black" />
              ) : (
                <ArrowUp className="size-4" />
              )}
            </Button>
            {loading && (
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-md cursor-pointer"
                onClick={() => {
                  if (onStop) {
                    onStop();
                  }
                }}
              >
                <StopCircle className="size-4" />
              </Button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default ChatInputBox;
