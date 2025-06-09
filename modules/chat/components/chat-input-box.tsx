"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { Globe, Paperclip, ArrowUp } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const ChatInputBox = () => {
  const [message, setMessage] = useState("");
  const [selectedModel, setSelectedModel] = useState("Gemini 2.5 Flash");

  const models = ["Gemini 2.5 Flash", "GPT-4", "Claude 3.5", "Llama 2"];

  const handleSend = () => {
    if (message.trim()) {
      console.log("Sending message:", message);
      setMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="absolute bottom-4 left-0 right-0 max-w-2xl mx-auto flex items-center justify-center h-28">
      <section className="w-full bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700 rounded-t-md p-4">
        <div className="mb-4">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message here..."
            className="bg-transparent border-none text-gray-300 placeholder-gray-500 text-base p-0 h-auto min-h-[60px] resize-none focus-visible:ring-0 focus-visible:ring-offset-0"
            style={{ fontSize: "16px" }}
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="text-gray-300 hover:text-white hover:bg-gray-700 p-2 h-auto font-medium text-sm cursor-pointer"
                >
                  {selectedModel}
                  <ChevronDown className=" h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700">
                {models.map((model) => (
                  <DropdownMenuItem
                    key={model}
                    onClick={() => setSelectedModel(model)}
                    className="text-gray-200 hover:text-white text-sm hover:bg-gray-700 cursor-pointer"
                  >
                    {model}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="default"
                  className="z-10 flex items-center text-gray-300 hover:text-white bg-transparent hover:bg-gray-500/20 border border-zinc-700 p-1.5 h-auto font-medium cursor-pointer"
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
                >
                  <Paperclip className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>Attach files</p>
              </TooltipContent>
            </Tooltip>
          </div>

          <Button
            onClick={handleSend}
            disabled={!message.trim()}
            size="icon"
            className="bg-button hover:bg-button/90 disabled:bg-button/50 disabled:opacity-50 h-8 w-8 rounded-md cursor-pointer"
          >
            <ArrowUp className="size-4" />
          </Button>
        </div>
      </section>
    </div>
  );
};

export default ChatInputBox;
