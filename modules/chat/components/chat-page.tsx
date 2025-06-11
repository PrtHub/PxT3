"use client";

import React, { useState, useEffect, Suspense } from "react";
import ChatView from "./chat-view";
import ChatInputBox from "./chat-input-box";
import { trpc } from "@/trpc/client";

interface ChatPageProps {
  chatId: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

const ChatPage: React.FC<ChatPageProps> = ({ chatId: initialChatId }) => {
  const [currentChatId, setCurrentChatId] = useState(initialChatId);
  const [messages, setMessages] = useState<Message[]>([]);
  const [streamingResponse, setStreamingResponse] = useState("");
  const [loading, setLoading] = useState(false);

  const utils = trpc.useUtils();

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

  useEffect(() => {
    setCurrentChatId(initialChatId);
    fetchMessages(initialChatId);
    utils.chat.getChatsForUser.invalidate();
  }, [initialChatId]);

  const handleSendMessage = async (userMessage: string, model: string) => {
    setLoading(true);
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    const controller = new AbortController();
    try {
      const res = await fetch("/api/chat/send", {
        method: "POST",
        body: JSON.stringify({
          chatId: currentChatId,
          content: userMessage,
          model,
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
      let assistantContent = "";
      const processStream = async () => {
        const { value, done } = await reader.read();
        if (done) {
          setStreamingResponse("");
          setLoading(false);
          fetchMessages(currentChatId);
          utils.chat.getChatsForUser.invalidate();
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
            if (event.event === "chatCreated") {
              const newChatId = event.data.chatId;
              if (!currentChatId) {
                window.history.pushState(null, "", `/chat/${newChatId}`);
                setCurrentChatId(newChatId);
              }
            } else if (event.event === "chunk") {
              assistantContent += event.data.content || "";
              setStreamingResponse(assistantContent);
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
      if (err instanceof Error && err.name !== "AbortError") {
        console.error("Fetch error:", err);
      }
      setLoading(false);
    }
  };

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="relative min-h-screen">
        <ChatView
          // chatId={currentChatId}
          messages={messages}
          streamingResponse={streamingResponse}
          loading={loading}
        />
        <ChatInputBox onSend={handleSendMessage} loading={loading} />
      </div>
    </Suspense>
  );
};

export default ChatPage;