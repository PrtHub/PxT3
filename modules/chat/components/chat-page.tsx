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
  role: "user" | "assistant";
  content: string;
}

interface StreamState {
  status: "starting" | "processing" | "streaming" | "completed" | "error" | "cancelled";
  chatId: string;
  model?: string;
  userMessageId?: string;
  aiMessageId?: string;
  currentContent?: string;
  error?: string;
  startedAt?: string;
  completedAt?: string;
}

const ChatPage: React.FC<ChatPageProps> = ({ chatId: initialChatId }) => {
  const initialMessage = useInitialMessageStore((state) => state.message);
  const setInitialMessage = useInitialMessageStore((state) => state.setMessage);
  const initialMessageSent = useRef(false);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [streamingResponse, setStreamingResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [, setStreamState] = useState<StreamState | null>(null);
  
  const eventSourceRef = useRef<EventSource | null>(null);
  const streamStateRef = useRef<StreamState | null>(null);

  const [webSearchConfig, setWebSearchConfig] = useState({
    enabled: false,
  });

  const utils = trpc.useUtils();
  const { selectedModel, openRouterApiKey, geminiApiKey } = useSettingsStore();

  const handleWebSearchConfigChange = useCallback((config: { enabled: boolean }) => {
    setWebSearchConfig(prev => ({ ...prev, ...config }));
  }, []);

  // Fetch messages from database
  const fetchMessages = async (chatId: string) => {
    try {
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
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  // Check stream status on page load/refresh
  const checkStreamStatus = async (chatId: string) => {
    try {
      const res = await fetch(`/api/chat/stream-status?chatId=${chatId}`);
      const data = await res.json();
      
      if (data.hasActiveStream && data.streamState) {
        console.log("[ChatPage] Found active stream, resuming...", data.streamState);
        setStreamState(data.streamState);
        setLoading(true);
        
        // If there's partial content, show it
        if (data.streamState.currentContent) {
          setStreamingResponse(data.streamState.currentContent);
        }
        
        // Connect to stream events
        connectToStream(chatId);
      }
    } catch (error) {
      console.error("Error checking stream status:", error);
    }
  };

  // Connect to Server-Sent Events stream
  const connectToStream = (chatId: string) => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const eventSource = new EventSource(`/api/chat/stream?chatId=${chatId}`);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleStreamEvent(data);
      } catch (error) {
        console.error("Error parsing stream event:", error);
      }
    };

    eventSource.onerror = (error) => {
      console.error("EventSource error:", error);
      setLoading(false);
      eventSource.close();
    };

    eventSource.onopen = () => {
      console.log("[ChatPage] Connected to stream");
    };
  };

  // Handle individual stream events
  const handleStreamEvent = (event: any) => {
    console.log("[ChatPage] Stream event:", event.event, event.data);

    switch (event.event) {
      case "stream_state":
        setStreamState(event.data);
        streamStateRef.current = event.data;
        if (event.data.currentContent) {
          setStreamingResponse(event.data.currentContent);
        }
        break;

      case "userMessageCreated":
        // User message already handled by UI
        break;

      case "chunk":
        if (event.data.content) {
          setStreamingResponse(prev => prev + event.data.content);
        } else if (event.data.fullContent) {
          setStreamingResponse(event.data.fullContent);
        }
        break;

      case "image_generated":
        setMessages(prev => [
          ...prev,
          { role: "assistant", content: event.data }
        ]);
        setStreamingResponse("");
        setLoading(false);
        break;

      case "end":
        if (streamingResponse.trim()) {
          setMessages(prev => [
            ...prev,
            { role: "assistant", content: streamingResponse }
          ]);
        }
        setStreamingResponse("");
        setLoading(false);
        utils.chat.getChatsForUser.invalidate();
        break;

      case "error":
        console.error("Stream error:", event.data.error);
        setLoading(false);
        setStreamingResponse("");
        break;

      case "cancelled":
        console.log("Stream cancelled");
        setLoading(false);
        setStreamingResponse("");
        break;

      case "heartbeat":
        // Just keep the connection alive
        break;
    }
  };

  const handleStop = useCallback(async () => {
    if (loading) {
      try {
        await fetch(`/api/chat/stream-status?chatId=${initialChatId}`, {
          method: "DELETE"
        });
        
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
        }
        
        setLoading(false);
        setStreamingResponse("");
      } catch (error) {
        console.error("Error stopping stream:", error);
      }
    }
  }, [loading, initialChatId]);

  const handleSendMessage = useCallback(
    async (userMessage: string, model: string) => {
      setLoading(true);
      setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
      setStreamingResponse("");

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
        });

        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`Network response was not ok: ${res.status} ${errorText}`);
        }

        const data = await res.json();
        if (data.success) {
          // Connect to stream events
          connectToStream(initialChatId);
        } else {
          throw new Error(data.error || "Failed to start stream");
        }
      } catch (err) {
        console.error("Error sending message:", err);
        setLoading(false);
        setStreamingResponse("");
      }
    },
    [
      initialChatId,
      selectedModel,
      openRouterApiKey,
      geminiApiKey,
      setMessages,
      setLoading,
      setStreamingResponse,
      utils.chat.getChatsForUser,
      webSearchConfig,
    ]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  // Initial load
  useEffect(() => {
    if (initialChatId) {
      fetchMessages(initialChatId);
      checkStreamStatus(initialChatId);
    }
    utils.chat.getChatsForUser.invalidate();
  }, [initialChatId, utils.chat.getChatsForUser]);

  // Handle initial message
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
