"use client";

import React, {
  useState,
  useEffect,
  Suspense,
  useRef,
  useCallback,
} from "react";
import ChatView from "./chat-view";
import ChatInputBox from "./chat-input-box";
import { useSettingsStore } from "../store/settings-store";
import { useInitialMessageStore } from "../store/initial-message-store";
import { trpc } from "@/trpc/client";

interface ChatPageProps {
  chatId: string;
}

interface Message {
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

  const utils = trpc.useUtils();
  const { selectedModel, openRouterApiKey } = useSettingsStore();

  const fetchMessages = async (chatId: string) => {
    const res = await fetch(`/api/chat/messages?chatId=${chatId}`);
    const data = await res.json();
    if (Array.isArray(data.messages)) {
      setMessages(
        data.messages.map((msg: any) => ({
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

      abortControllerRef.current.abort();
      abortControllerRef.current = null;

      setStreamingResponse("");
      setLoading(false);

      if (currentPartialResponse.trim()) {
        setMessages((prevMessages) => [...prevMessages, { role: "assistant", content: currentPartialResponse }]);
      }

      if (currentPartialResponse.trim()) {
        try {
          await fetch("/api/chat/save-partial-message", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chatId: initialChatId,
              content: currentPartialResponse,
              parentId: latestUserMessageIdRef.current,
            }),
          });
        } catch (dbError) {
          console.error("Failed to save partial message to DB:", dbError);
        }
      }
      console.log("[ChatPage] Streaming stopped by user, partial response saved.");
    }
  }, [loading, setMessages, setStreamingResponse, setLoading, initialChatId, latestUserMessageIdRef]);

  const handleSendMessage = useCallback(async (userMessage: string, model: string) => {
    setLoading(true);
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setStreamingResponse("");
    assistantContentRef.current = "";
    latestUserMessageIdRef.current = null;

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const res = await fetch("/api/chat/send", {
        method: "POST",
        body: JSON.stringify({
          chatId: initialChatId,
          content: userMessage,
          model: selectedModel || model,
          apiKey: openRouterApiKey,
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
        const { value, done } = await reader.read();
        if (done) {
          if (assistantContentRef.current.trim()) {
            setMessages((prevMessages) => [
              ...prevMessages,
              { role: "assistant", content: assistantContentRef.current },
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
          const eventString = buffer
            .slice(0, eventEndIndex)
            .replace(/^data: /, "");
          buffer = buffer.slice(eventEndIndex + 2);
          try {
            const event = JSON.parse(eventString);
            if (event.event === "userMessageCreated") {
              latestUserMessageIdRef.current = event.data.userMessageId;
            } else if (event.event === "chunk") {
              assistantContentRef.current += event.data.content || "";
              setStreamingResponse(assistantContentRef.current);
            } else if (event.event === "end") {
              utils.chat.getChatsForUser.invalidate();
            }
          } catch (err) {
            console.error("Failed to parse stream event:", eventString, err);
          }
        }
        await processStream();
      };

      await processStream();
    } catch (err) {
      if (err instanceof Error) {
        if (err.name === "AbortError") {
          console.log("[ChatPage] Fetch aborted (likely by user or unmount).");
          if (assistantContentRef.current.trim() && !messages.some(msg => msg.content === assistantContentRef.current)) {
             setMessages((prevMessages) => [
                ...prevMessages,
                { role: "assistant", content: assistantContentRef.current },
             ]);
          }
        } else {
          console.error("Fetch error:", err);
        }
      }
      setLoading(false);
      setStreamingResponse("");
      abortControllerRef.current = null;
    }
  }, [initialChatId, selectedModel, openRouterApiKey, setMessages, setLoading, setStreamingResponse, utils.chat.getChatsForUser, messages]);

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
    <Suspense fallback={<div>Loading...</div>}>
      <div className="relative min-h-screen">
        <ChatView
          messages={messages}
          streamingResponse={streamingResponse}
          loading={loading}
        />
        <ChatInputBox onSend={handleSendMessage} onStop={handleStop} loading={loading} />
      </div>
    </Suspense>
  );
};

export default ChatPage;