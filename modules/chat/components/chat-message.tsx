/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { useRouter, usePathname } from "next/navigation";
import { Image, ImageKitProvider } from "@imagekit/next";
import { trpc } from "@/trpc/client";
import {
  speakText,
  cancelSpeech,
  isSpeechSynthesisSupported,
} from "@/lib/speech-synthesis";
import MarkdownContent from "@/components/markdown-content";
import ActionButtons from "@/components/action-buttons";
import { Attachment } from "../types";
import { toast } from "sonner";

interface ChatMessageProps {
  role: "user" | "assistant" | "system";
  content: string;
  messageId: string;
  isStreaming?: boolean;
  attachments?: Attachment[];
  onUpdateMessage?: (messageId: string, newContent: string) => void;
}

export function ChatMessage({
  role,
  content,
  messageId,
  isStreaming = false,
  attachments = [],
  onUpdateMessage,
}: ChatMessageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isUser = role === "user";
  const isShared = pathname.includes("/share/");
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState("");
  const [isBranching, setIsBranching] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isBranched, setIsBranched] = useState(false);
  const [isReading, setIsReading] = useState(false);

  const { data: allAttachments } = trpc.chat.getAttachments.useQuery(
    {
      messageId,
    },
    {
      enabled: !!messageId,
    }
  );

  const handleBranch = async () => {
    try {
      setIsBranching(true);
      const chatId = pathname.split("/").pop();
      const response = await fetch("/api/chat/branch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chatId,
          messageId: messageId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create branch");
      }

      const data = await response.json();
      setIsBranched(true);
      console.log("New branch created successfully");
      toast.success("New branch created!");

      router.push(`/chat/${data.newChatId}`);
    } catch (error) {
      console.error("Failed to create branch:", error);
      console.log("Failed to create branch");
      toast.error("Failed to create branch");
    } finally {
      setIsBranching(false);
    }
  };

  useEffect(() => {
    if (isCopied) {
      const timer = setTimeout(() => setIsCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isCopied]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setIsCopied(true);
      console.log("Message copied to clipboard");
    } catch (error) {
      console.error("Failed to copy text:", error);
      console.log("Failed to copy message");
    }
  };

  const handleEdit = () => {
    setEditedContent(content);
    setIsEditing(true);
  };

  const handleSave = () => {
    if (onUpdateMessage) {
      onUpdateMessage(messageId, editedContent);
    }
    setIsEditing(false);
    console.log("Message update requested");
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const isImageMessage =
    content.startsWith("data:image") ||
    content.startsWith("https://ik.imagekit.io/");

  const isChrome =
    /Chrome/.test(navigator.userAgent) && !/Edge|Edg/.test(navigator.userAgent);

  const cleanedContent = content.replace(/^[ \t]+/gm, "");

  const handleReadAloud = () => {
    if (!isSpeechSynthesisSupported()) return;
    if (isReading) {
      cancelSpeech();
      setIsReading(false);
    } else {
      setIsReading(true);
      speakText(content, {
        rate: 1.0,
        pitch: 1.0,
        lang: "en-US",
        onend: () => {
          setIsReading(false);
        },
        onerror: () => {
          setIsReading(false);
        },
      });
    }
  };

  return (
    <div
      className={cn(
        "group w-full flex flex-col px-4 max-w-3xl",
        isUser ? "items-end" : "items-start",
        isUser && "mt-20 mb-10"
      )}
    >
      <div
        className={cn(
          "w-full max-w-3xl overflow-hidden border rounded-md",
          isUser
            ? "border-button/20 bg-button/15 px-4 pt-5 w-fit"
            : "border-zinc-700/50 bg-zinc-800/50 pt-5 px-4",
          isChrome && "ml-1.5",
          content.length === 0 && "w-fit px-4 py-2",
          isEditing && "w-full"
        )}
      >
        <div className="flex gap-4 m-auto">
          <div className="flex-1 overflow-x-auto">
            {isEditing ? (
              <div className="flex flex-col gap-2 w-full px-2">
                <Textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="w-full min-h-[100px] p-2 text-white/90 focus:outline-none border-none outline-none ring-0 focus:ring-0 focus:ring-offset-0 focus:border-none focus:ring-transparent focus:ring-offset-transparent rounded-md"
                  autoFocus
                />
                <div className="flex gap-2 justify-end pb-2">
                  <Button
                    onClick={handleCancel}
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 text-xs bg-transparent border-zinc-700 text-zinc-300 hover:bg-zinc-800/80 hover:text-white cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5 mr-1.5" />
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    size="sm"
                    className="h-8 px-3 text-xs bg-white text-black hover:bg-white/80 hover:text-black cursor-pointer"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <div className="prose prose-invert max-w-none text-white/80">
                {role === "user" && attachments?.length > 0 ? (
                  <div
                    className={cn(
                      "flex flex-wrap gap-2 mb-0",
                      attachments?.length > 0 && "mb-4"
                    )}
                  >
                    {attachments?.map((attachment) => (
                      <div
                        key={attachment.url}
                        className="relative group rounded-lg overflow-hidden border border-white/10"
                      >
                        <ImageKitProvider
                          urlEndpoint={
                            process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT
                          }
                        >
                          <Image
                            src={attachment.url || ""}
                            alt={attachment.name || ""}
                            width={200}
                            height={200}
                            className="object-cover rounded-md"
                          />
                        </ImageKitProvider>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    className={cn(
                      "flex flex-wrap gap-2",
                      allAttachments && allAttachments?.length > 0 && "mb-4"
                    )}
                  >
                    {allAttachments?.map((attachment) => (
                      <div
                        key={attachment.url}
                        className="relative group rounded-lg overflow-hidden border border-white/10"
                      >
                        <ImageKitProvider
                          urlEndpoint={
                            process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT
                          }
                        >
                          <Image
                            src={attachment.url}
                            alt={attachment.name}
                            width={300}
                            height={200}
                            className="object-cover rounded-md"
                          />
                        </ImageKitProvider>
                      </div>
                    ))}
                  </div>
                )}
                {isImageMessage ? (
                  content ? (
                    <div className="aspect-square w-full h-[400px] pb-4 overflow-hidden">
                      <img
                        src={content}
                        alt="Generated content"
                        loading="lazy"
                        className="object-cover rounded-lg w-full h-full"
                      />
                    </div>
                  ) : (
                    <div className="aspect-square w-full h-[400px] bg-zinc-800/50 rounded-lg flex flex-col items-center justify-center space-y-4 p-6 text-center">
                      <div className="size-10 border-3 border-button border-t-transparent rounded-full animate-spin" />
                      <div className="space-y-2">
                        <h3 className="text-lg font-medium text-white">
                          Generating your image
                        </h3>
                        <p className="text-sm text-zinc-400">
                          This usually takes 10-20 seconds. Please hold on...
                        </p>
                      </div>
                    </div>
                  )
                ) : (
                  <MarkdownContent content={cleanedContent} />
                )}
                {content.length === 0 && isStreaming && (
                  <div className="flex items-center space-x-1 h-6">
                    <span
                      className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    />
                    <span
                      className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    />
                    <span
                      className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    />
                  </div>
                )}
                {isStreaming && content.length > 0 && (
                  <span className="inline-block w-2 h-6 bg-emerald-400 animate-pulse ml-1" />
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <ActionButtons
        isUser={isUser}
        isEditing={isEditing}
        handleCopy={handleCopy}
        handleBranch={handleBranch}
        handleReadAloud={handleReadAloud}
        handleEdit={handleEdit}
        isCopied={isCopied}
        isBranched={isBranched}
        isReading={isReading}
        messageId={messageId}
        isShared={isShared}
        isBranching={isBranching}
      />
    </div>
  );
}
