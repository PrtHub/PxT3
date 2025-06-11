"use client";

import React, { useState, useEffect, useRef } from "react";
import ChatView from "./chat-view";
import ChatInputBox from "./chat-input-box";

interface ChatPageProps {
  chatId: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

const DEFAULT_MODEL = "deepseek/deepseek-chat-v3-0324:free";

const ChatPage: React.FC<ChatPageProps> = ({ chatId: initialChatId }) => {
  const [currentChatId, setCurrentChatId] = useState(initialChatId);
  const [messagesFetched, setMessagesFetched] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [streamingResponse, setStreamingResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const autoTriggeredRef = useRef(false);

  const handleSendMessage = async (userMessage: string, model: string, { optimistic = true } = {}) => {
    setLoading(true);

    if (optimistic) {
      setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    }

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
        throw new Error(`Network response was not ok: ${res.status} ${errorText}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistantContent = "";

      const processStream = async () => {
        const { value, done } = await reader.read();
        if (done) {
          if (assistantContent) {
            setMessages(prev => [...prev, { role: "assistant", content: assistantContent }]);
          }
          setStreamingResponse("");
          setLoading(false);
          return;
        }

        buffer += decoder.decode(value, { stream: true });
        let eventEndIndex;
        
        while ((eventEndIndex = buffer.indexOf("\n\n")) !== -1) {
          const eventString = buffer.slice(0, eventEndIndex).replace(/^data: /, "");
          buffer = buffer.slice(eventEndIndex + 2);

          try {
            const event = JSON.parse(eventString);
            
            if (event.event === "chatCreated") {
              const newChatId = event.data.chatId;
              if (!currentChatId) {
                window.history.pushState(null, '', `/chat/${newChatId}`);
                setCurrentChatId(newChatId);
              }
            } else if (event.event === "chunk") {
              assistantContent += event.data.content || "";
              setStreamingResponse(assistantContent);
            } else if (event.event === "end") {
            }
          } catch (err) {
            console.error("Failed to parse stream event:", eventString, err);
          }
        }
        await processStream();
      };
      
      await processStream();

    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error("Fetch error:", err);
        if (optimistic) setMessages(messages);
      }
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentChatId(initialChatId);
    setMessages([]);
  }, [initialChatId]);

  useEffect(() => {
    if (!currentChatId) return;
    fetch(`/api/chat/messages?chatId=${currentChatId}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data.messages)) {
          setMessages(
            data.messages.map((msg: any) => ({
              role: msg.role,
              content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)
            }))
          );
          setMessagesFetched(true);
        }
      })
      .catch(err => {
        console.error('Failed to fetch messages:', err);
        setMessagesFetched(true);
      });
  }, [currentChatId]);

  useEffect(() => {
    if (
      messagesFetched &&
      messages.length === 1 &&
      messages[0].role === "user" &&
      !loading &&
      !autoTriggeredRef.current
    ) {
      autoTriggeredRef.current = true;
      handleSendMessage(messages[0].content, DEFAULT_MODEL, { optimistic: false });
    }
    if (
      messages.length !== 1 ||
      messages[0].role !== "user"
    ) {
      autoTriggeredRef.current = false;
    }
  }, [messages, loading, messagesFetched]);

  return (
    <div className="relative min-h-screen">
      <ChatView
        chatId={currentChatId}
        messages={messages}
        streamingResponse={streamingResponse}
        loading={loading}
      />
      <ChatInputBox onSend={handleSendMessage} loading={loading} />
    </div>
  );
};

export default ChatPage;