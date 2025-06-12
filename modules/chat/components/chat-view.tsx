"use client";

import React, { useEffect, useRef } from 'react';
import { ChatMessage, ChatMessageLoading } from './chat-message';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatViewProps {
  messages: Message[];
  streamingResponse: string;
  loading: boolean;
}

const ChatView = ({ messages, streamingResponse, loading }: ChatViewProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingResponse]);

  return (
    <div className="flex flex-col h-[calc(100vh-10px)] w-full">
      <div className="flex-1 overflow-y-auto pb-60">
        <div className="max-w-3xl mx-auto w-full">
          {messages.length === 0 && !loading ? (
           <ChatMessageLoading />
          ) : (
            <>
              {messages.map((message, index) => (
                <ChatMessage
                  key={index}
                  role={message.role}
                  content={message.content}
                />
              ))}
              {loading && (
                <>
                  <ChatMessage
                    role="assistant"
                    content={streamingResponse}
                    isStreaming={true}
                  />
                  <div ref={messagesEndRef} />
                </>
              )}
              {!loading && <div ref={messagesEndRef} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatView;