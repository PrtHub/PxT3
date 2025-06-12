"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Globe, Paperclip, ArrowUp, Loader2, StopCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSettingsStore } from "../store/settings-store";
import { ModelSelector } from "@/components/model-selector";

interface ChatInputBoxProps {
  onSend?: (message: string, model: string) => void;
  onStop?: () => void;
  loading?: boolean;
}

const ChatInputBox: React.FC<ChatInputBoxProps> = ({ onSend, onStop, loading }) => {
  const [message, setMessage] = useState("");
  const {
    selectedModel,
    setSelectedModel,
    setOpenRouterApiKey,
    openRouterApiKey,
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
            />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="default"
                  className="z-10 flex items-center text-gray-300 hover:text-white bg-transparent hover:bg-gray-500/20 border border-zinc-700 p-1.5 h-auto font-medium cursor-pointer"
                  disabled={loading}
                >
                  <Globe className="size-4" />
                  <span className="text-xs">Web</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>Web search</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  className="text-gray-300 bg-transparent hover:text-white hover:bg-gray-500/20 border border-zinc-700 h-7 p-1.5 cursor-pointer"
                  disabled={loading}
                >
                  <Paperclip className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>Attach files</p>
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
