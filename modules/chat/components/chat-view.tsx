"use client";

import React, { useEffect, useRef, useState } from "react";
import { ChatMessage, ChatMessageLoading } from "./chat-message";
import { Button } from "@/components/ui/button";
import { ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Attachment {
  id: string;
  url: string;
  name: string;
}

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  id: string;
  attachments?: Attachment[];
}

interface ChatViewProps {
  messages: Message[];
  streamingResponse: string;
  loading: boolean;
  onUpdateMessage?: (messageId: string, newContent: string) => void;
}

const ChatView = ({ messages, streamingResponse, loading, onUpdateMessage }: ChatViewProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(false);

  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (!container) return;
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isBottom = scrollHeight - (scrollTop + clientHeight) < 100;
      setIsAtBottom(isBottom);
    };

    if (loading || streamingResponse) {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isBottom = scrollHeight - (scrollTop + clientHeight) < 100;
      if (!isBottom) {
        scrollToBottom();
      }
    }

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [loading, streamingResponse]);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({
        behavior: "smooth",
      });
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-10px)] w-full relative">
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto pb-60 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent"
      >
        <div className="max-w-3xl mx-auto w-full">
          {messages.length === 0 && !loading ? (
            <ChatMessageLoading />
          ) : (
            <>
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  role={message.role}
                  content={message.content}
                  messageId={message.id}
                  attachments={message.attachments}
                  onUpdateMessage={onUpdateMessage}
                />
              ))}
              {loading && (
                <>
                  <ChatMessage
                    role="assistant"
                    content={streamingResponse}
                    messageId="streaming"
                    isStreaming={true}
                    attachments={[]}
                  />
                  <div ref={messagesEndRef} />
                </>
              )}
              {!loading && <div ref={messagesEndRef} />}
            </>
          )}
        </div>
      </div>

      <div className="fixed xl:bottom-24 bottom-40 right-6 z-50">
        {!isAtBottom && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={scrollToBottom}
                size="icon"
                className={cn(
                  "relative w-10 h-10 rounded-full shadow-lg cursor-pointer",
                  "bg-button backdrop-blur-sm border border-button/50",
                  "hover:bg-button/90 hover:scale-105",
                  "transition-all duration-200 ease-out",
                  "group"
                )}
                aria-label="Scroll to bottom"
              >
                <ArrowDown className="h-4 w-4 group-hover:translate-y-0.5 transition-transform" />
                <span className="absolute inset-0 rounded-full bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Scroll to bottom</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  );
};

export default ChatView;
