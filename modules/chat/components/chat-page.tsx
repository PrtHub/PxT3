"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import ChatView from "./chat-view";
import ChatInputBox from "./chat-input-box";
import { useSettingsStore } from "../store/settings-store";
import { useInitialMessageStore } from "../store/initial-message-store";
import { trpc } from "@/trpc/client";
import ChatHeader from "./chat-header";
import { useAttachmentsStore } from "../store/attachments-store";
import { useRetryMessageStore } from "../store/retry-message-store";
import { Attachment } from "../types";

interface ChatPageProps {
  chatId: string;
}

interface Message {
  id: string;
  parentId?: string | null;
  role: "user" | "assistant";
  content: string;
  attachments?: Attachment[];
}

interface ApiMessage extends Omit<Message, "content" | "attachments"> {
  content: unknown;
  attachments?: (Attachment & { fileId: string })[];
}

const ChatPage: React.FC<ChatPageProps> = ({ chatId: initialChatId }) => {
  const initialMessage = useInitialMessageStore((state) => state.message);
  const initialModel = useInitialMessageStore((state) => state.initialModel);
  const setInitialMessage = useInitialMessageStore((state) => state.setMessage);
  const initialMessageSent = useRef(false);
  const [messagesMap, setMessagesMap] = useState<Map<string, Message>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamingResponse, setStreamingResponse] = useState("");
  const abortControllerRef = useRef<AbortController | null>(null);
  const assistantContentRef = useRef<string>("");
  const latestUserMessageIdRef = useRef<string | null>(null);
  const isStoppedRef = useRef(false);

  const messages = Array.from(messagesMap.values());

  const [webSearchConfig, setWebSearchConfig] = useState({
    enabled: false,
  });

  console.log("ERROR", error);

  const utils = trpc.useUtils();
  const { selectedModels, openRouterApiKey, geminiApiKey } = useSettingsStore();
  const { clearAttachments, attachments: initialAttachments } =
    useAttachmentsStore();
  const {
    isRetrying,
    aiMessageId,
    parentId,
    userMessageContent,
    selectedModel: retrySelectedModel,
    reset,
  } = useRetryMessageStore();

  const selectedModel = selectedModels[initialChatId] || initialModel;

  const upsertMessages = useCallback((newMessages: Message[]) => {
    setMessagesMap((prevMap) => {
      const newMap = new Map(prevMap);
      for (const msg of newMessages) {
        const content =
          typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content);
        newMap.set(msg.id, { ...msg, content });
      }
      return newMap;
    });
  }, []);

  const handleWebSearchConfigChange = useCallback(
    (config: { enabled: boolean }) => {
      setWebSearchConfig((prev) => ({ ...prev, ...config }));
    },
    []
  );

  const deleteMessage = trpc.chat.deleteMessage.useMutation({
    onSuccess: () => {
      utils.chat.getChatsForUser.invalidate();
    },
    onError: (error) => {
      console.error("Failed to delete message:", error);
    },
  });

  const deleteAIMessage = trpc.chat.deleteAIMessage.useMutation({
    onSuccess: () => {
      utils.chat.getChatsForUser.invalidate();
    },
    onError: (error) => {
      console.error("Failed to delete message:", error);
    },
  });

  const fetchMessages = useCallback(
    async (chatId: string) => {
      try {
        const res = await fetch(`/api/chat/messages?chatId=${chatId}`);
        if (!res.ok) {
          throw new Error(`Failed to fetch messages: ${res.statusText}`);
        }
        const data = await res.json();
        if (Array.isArray(data.messages)) {
          const mapped = data.messages.map((msg: ApiMessage) => ({
            id: msg.id,
            parentId: msg.parentId || null,
            role: msg.role,
            content:
              Array.isArray(msg.content) && msg.content[0]?.text
                ? msg.content[0].text
                : typeof msg.content === "string"
                ? msg.content
                : JSON.stringify(msg.content),
            attachments:
              msg.attachments?.map((att) => ({
                id: att.fileId,
                url: att.url,
                name: att.name,
              })) || [],
          }));
          
          setMessagesMap(new Map(mapped.map(msg => [msg.id, msg])));
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
        setError("Failed to load chat history.");
      }
    },
    []
  );

  const handleStop = useCallback(async () => {
    if (loading && abortControllerRef.current) {
      const currentPartialResponse = assistantContentRef.current;

      isStoppedRef.current = true;

      abortControllerRef.current.abort();
      abortControllerRef.current = null;

      setStreamingResponse("");
      setLoading(false);

      if (currentPartialResponse.trim()) {
        upsertMessages([
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: currentPartialResponse,
          },
        ]);
        fetch("/api/chat/save-partial-message", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            chatId: initialChatId,
            content: currentPartialResponse,
            parentMessageId: latestUserMessageIdRef.current,
          }),
        }).catch((error) => {
          console.error("Failed to save partial message:", error);
        });
      }
    }
  }, [loading, initialChatId, upsertMessages]);

  const handleSendMessage = useCallback(
    async (
      userMessage: string,
      model: string,
      attachments?: Attachment[],
      parentId?: string,
      isRetry?: boolean
    ) => {
      setError(null);
      const userMessageId = isRetry ? parentId! : crypto.randomUUID();

      if (!isRetry) {
        upsertMessages([
          {
            id: userMessageId,
            role: "user",
            content: userMessage,
            attachments: attachments || [],
          },
        ]);
        latestUserMessageIdRef.current = userMessageId;
      } else {
        latestUserMessageIdRef.current = parentId || null;
      }

      setStreamingResponse("");
      assistantContentRef.current = "";
      isStoppedRef.current = false;
      setLoading(true);

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const res = await fetch("/api/chat/send", {
          method: "POST",
          body: JSON.stringify({
            chatId: initialChatId,
            content: userMessage,
            model: model,
            apiKey: openRouterApiKey,
            geminiApiKey: geminiApiKey,
            parentMessageId: parentId,
            webSearch: webSearchConfig.enabled ? { enabled: true } : undefined,
            attachments: attachments || initialAttachments["new-chat"] || [],
            isRetry: isRetry === true,
          }),
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          setError(errorData.error || "An unexpected error occurred.");
          setLoading(false);
          return;
        }
        
        if (!res.body) {
          setError(
            "No response from AI model. This might be due to insufficient API credits, rate limits, or model unavailability. Please try a different API key, switch to a free model, or try again later."
          );
          setLoading(false);
          return;
        }

        console.log(res.body);
        console.log(res.ok);

        const reader = res.body.getReader();
        
        const decoder = new TextDecoder();
        let buffer = "";

        const processStream = async () => {
          if (isStoppedRef.current) {
            return;
          }

          const { value, done } = await reader.read();
          console.log("Value", value);
          console.log("Done", done);
          if (done) {
            if (!isStoppedRef.current && assistantContentRef.current.trim()) {
              upsertMessages([
                {
                  id: crypto.randomUUID(),
                  role: "assistant",
                  content: assistantContentRef.current,
                  parentId: latestUserMessageIdRef.current,
                },
              ]);
            }
            setStreamingResponse("");
            setLoading(false);
            utils.chat.getChatsForUser.invalidate();
            abortControllerRef.current = null;
            console.log("[ChatPage] Streaming done naturally.");
            return;
          }

          buffer += decoder.decode(value, { stream: true });
          let eventEndIndex;
          while ((eventEndIndex = buffer.indexOf("\n\n")) !== -1) {
            if (isStoppedRef.current) {
              return;
            }

            const eventString = buffer
              .slice(0, eventEndIndex)
              .replace(/^data: /, "");
            buffer = buffer.slice(eventEndIndex + 2);

            try {
              const event = JSON.parse(eventString);
              if (event.event === "userMessageCreated") {
                latestUserMessageIdRef.current = event.data.userMessageId;
              } else if (event.event === "chunk") {
                const content = event.data.content;
                console.log("[Chunk]", content);
                if (content && !isStoppedRef.current) {
                  assistantContentRef.current += content;
                  setStreamingResponse(assistantContentRef.current);
                }
              } else if (event.event === "image_generated") {
                if (!isStoppedRef.current) {
                  const imageUrl = event.data;
                  upsertMessages([
                    {
                      id: crypto.randomUUID(),
                      role: "assistant",
                      content: imageUrl,
                      parentId: latestUserMessageIdRef.current,
                    },
                  ]);
                  assistantContentRef.current = "";
                  setStreamingResponse("");
                }
              } else if (event.event === "end") {
                // setMessagesMap(new Map());
                fetchMessages(initialChatId);
              }
            } catch (err) {
              console.error("Failed to parse stream event:", eventString, err);
              setError(
                err instanceof Error
                  ? err.message
                  : "Failed to parse stream event"
              );
            }
          }

          if (!isStoppedRef.current) {
            await processStream();
          }
        };

        await processStream();
      } catch (err) {
        if (err instanceof Error) {
          if (err.name === "AbortError") {
            console.log(
              "[ChatPage] Fetch aborted (likely by user or unmount)."
            );
          } else {
            console.error("Fetch error:", err);
            if (err.message.includes("No response received")) {
              setError("No response from AI model. This might be due to insufficient API credits, rate limits, or model unavailability. Please try a different API key, switch to a free model, or try again later.");
            } else {
              setError("Failed to fetch message");
            }
          }
        }
        setLoading(false);
        setStreamingResponse("");
        abortControllerRef.current = null;
      } finally {
        clearAttachments(initialChatId || "new-chat");
      }
    },
    [
      initialChatId,
      openRouterApiKey,
      geminiApiKey,
      webSearchConfig,
      clearAttachments,
      initialAttachments,
      utils.chat.getChatsForUser,
      upsertMessages,
      fetchMessages,
    ]
  );

  const handleUpdateMessage = useCallback(
    async (messageId: string, newContent: string) => {
      try {
        const messageToUpdate = messagesMap.get(messageId);
        if (!messageToUpdate) return;

        await deleteMessage.mutateAsync({ messageId });

        setMessagesMap((prevMap) => {
          const newMap = new Map(prevMap);
          newMap.delete(messageId);
          for (const [key, value] of newMap.entries()) {
            if (value.parentId === messageId) {
              newMap.delete(key);
            }
          }
          return newMap;
        });

        await handleSendMessage(newContent, selectedModel || "");
      } catch (error) {
        console.error("Update flow failed:", error);
        setError("Failed to update message");
      }
    },
    [deleteMessage, selectedModel, handleSendMessage, messagesMap]
  );

  useEffect(() => {
    if (
      isRetrying &&
      aiMessageId &&
      parentId &&
      userMessageContent &&
      retrySelectedModel
    ) {
      reset();

      const doRetry = async () => {
        try {
          await deleteAIMessage.mutateAsync({ messageId: aiMessageId });
          setMessagesMap((prevMap) => {
            const newMap = new Map(prevMap);
            newMap.delete(aiMessageId);
            return newMap;
          });
          await handleSendMessage(
            userMessageContent,
            retrySelectedModel,
            undefined,
            parentId,
            true
          );
        } catch (error) {
          console.error("Retry message failed:", error);
          setError(
            error instanceof Error ? error.message : "Failed to retry message"
          );
        }
      };

      doRetry();
    }
  }, [
    isRetrying,
    aiMessageId,
    parentId,
    userMessageContent,
    retrySelectedModel,
    deleteAIMessage,
    handleSendMessage,
    reset,
  ]);

  useEffect(() => {
    if (initialChatId) {
      fetchMessages(initialChatId);
    }
    utils.chat.getChatsForUser.invalidate();
  }, [initialChatId, utils.chat.getChatsForUser, fetchMessages]);

  useEffect(() => {
    if (initialMessage && initialChatId && !initialMessageSent.current) {
      initialMessageSent.current = true;
      handleSendMessage(initialMessage, selectedModel || "");
      setInitialMessage(null);
    }
  }, [
    initialMessage,
    initialChatId,
    handleSendMessage,
    selectedModel,
    setInitialMessage,
  ]);

  return (
    <div className="relative min-h-screen">
      <ChatHeader chatId={initialChatId} />
      <ChatView
        messages={messages}
        streamingResponse={streamingResponse}
        loading={loading}
        error={error}
        onUpdateMessage={handleUpdateMessage}
      />
      <ChatInputBox
        onSend={handleSendMessage}
        onStop={handleStop}
        loading={loading}
        webSearchConfig={{
          ...webSearchConfig,
          onConfigChange: handleWebSearchConfigChange,
        }}
      />
    </div>
  );
};

export default ChatPage;
