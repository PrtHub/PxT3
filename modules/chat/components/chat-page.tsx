"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import ChatView from "./chat-view";
import ChatInputBox from "./chat-input-box";
import { useSettingsStore } from "../store/settings-store";
import { useInitialMessageStore } from "../store/initial-message-store";
import { trpc } from "@/trpc/client";
import ChatHeader from "./chat-header";

interface ChatPageProps {
  chatId: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const ChatPage: React.FC<ChatPageProps> = ({ chatId: initialChatId }) => {
  const initialMessage = useInitialMessageStore((state) => state.message);
  const setInitialMessage = useInitialMessageStore((state) => state.setMessage);
  const initialMessageSent = useRef(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [streamingResponse, setStreamingResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const assistantContentRef = useRef<string>("");
  const latestUserMessageIdRef = useRef<string | null>(null);
  const isStoppedRef = useRef(false);

  const [webSearchConfig, setWebSearchConfig] = useState({
    enabled: false,
  });

  const utils = trpc.useUtils();
  const { selectedModel, openRouterApiKey, geminiApiKey } = useSettingsStore();

  const handleWebSearchConfigChange = useCallback((config: { enabled: boolean }) => {
    setWebSearchConfig(prev => ({ ...prev, ...config }));
  }, []);

  console.log("Web search config from chat page", webSearchConfig);

  const fetchMessages = async (chatId: string) => {
    const res = await fetch(`/api/chat/messages?chatId=${chatId}`);
    const data = await res.json();
    if (Array.isArray(data.messages)) {
      setMessages(
        data.messages.map((msg: any) => ({
          id: msg.id,
          role: msg.role,
          content:
            Array.isArray(msg.content) && msg.content[0]?.text
              ? msg.content[0].text
              : typeof msg.content === "string"
              ? msg.content
              : JSON.stringify(msg.content),
        }))
      );
    }
  };

  const handleStop = useCallback(async () => {
    if (loading && abortControllerRef.current) {
      const currentPartialResponse = assistantContentRef.current;

      isStoppedRef.current = true;
      
      abortControllerRef.current.abort();
      abortControllerRef.current = null;

      setStreamingResponse("");
      setLoading(false);

      if (currentPartialResponse.trim()) {
        setMessages((prevMessages) => [
          ...prevMessages,
          { 
            id: crypto.randomUUID(),
            role: "assistant", 
            content: currentPartialResponse 
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
        }).catch(error => {
          console.error("Failed to save partial message:", error);
        });
      }
    }
  }, [loading, initialChatId]);

  const handleSendMessage = useCallback(
    async (userMessage: string, model: string) => {
      setLoading(true);
      const userMessageId = crypto.randomUUID();
      setMessages((prev) => [...prev, { 
        id: userMessageId,
        role: "user", 
        content: userMessage 
      }]);
      setStreamingResponse("");
      assistantContentRef.current = "";
      latestUserMessageIdRef.current = userMessageId;
      isStoppedRef.current = false;

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const res = await fetch("/api/chat/send", {
          method: "POST",
          body: JSON.stringify({
            chatId: initialChatId,
            content: userMessage,
            model: selectedModel ?? model,
            apiKey: openRouterApiKey,
            geminiApiKey: geminiApiKey,
            webSearch: webSearchConfig.enabled ? { enabled: true } : undefined,
          }),
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          const errorText = await res.text();
          throw new Error(
            `Network response was not ok: ${res.status} ${errorText}`
          );
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        const processStream = async () => {
          if (isStoppedRef.current) {
            return;
          }

          const { value, done } = await reader.read();
          if (done) {
            if (!isStoppedRef.current && assistantContentRef.current.trim()) {
              setMessages((prevMessages) => [
                ...prevMessages,
                { 
                  id: crypto.randomUUID(),
                  role: "assistant", 
                  content: assistantContentRef.current 
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
                if (content && !isStoppedRef.current) {
                  assistantContentRef.current += content;
                  setStreamingResponse(assistantContentRef.current);
                }
              } else if (event.event === "image_generated") {
                if (!isStoppedRef.current) {
                  const imageUrl = event.data;
                  setMessages((prev) => [
                    ...prev,
                    { 
                      id: crypto.randomUUID(),
                      role: "assistant", 
                      content: imageUrl 
                    },
                  ]);
                  assistantContentRef.current = "";
                  setStreamingResponse("");
                }
              } else if (event.event === "end") {
                utils.chat.getChatsForUser.invalidate();
              }
            } catch (err) {
              console.error("Failed to parse stream event:", eventString, err);
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
          }
        }
        setLoading(false);
        setStreamingResponse("");
        abortControllerRef.current = null;
      }
    },
    [
      initialChatId,
      selectedModel,
      openRouterApiKey,
      geminiApiKey,
      utils.chat.getChatsForUser,
      webSearchConfig,
    ]
  );

  useEffect(() => {
    if (initialChatId) {
      fetchMessages(initialChatId);
    }
    utils.chat.getChatsForUser.invalidate();
  }, [initialChatId, utils.chat.getChatsForUser]);

  useEffect(() => {
    if (initialMessage && initialChatId && !initialMessageSent.current) {
      initialMessageSent.current = true;
      handleSendMessage(initialMessage, selectedModel);
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