'use client'

import React, { useState } from 'react';
import Introduction from '@/modules/home/section/Introduction';
import ChatInputBox from '@/modules/chat/components/chat-input-box';
import { useRouter } from 'next/navigation';

const Homepage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSendMessage = async (userMessage: string, model: string) => {
    setLoading(true);
    const res = await fetch("/api/chat/send", {
      method: "POST",
      body: JSON.stringify({ content: userMessage, model }),
      headers: { "Content-Type": "application/json" },
    });
    const reader = res.body?.getReader();
    const decoder = new TextDecoder();
    let done = false;
    let redirected = false;
    let buffer = "";
    while (reader && !done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      if (value) {
        buffer += decoder.decode(value, { stream: true });
        let eventEnd;
        while ((eventEnd = buffer.indexOf("\n\n")) !== -1) {
          const eventStr = buffer.slice(0, eventEnd).replace(/^data: /, "");
          buffer = buffer.slice(eventEnd + 2);
          try {
            const event = JSON.parse(eventStr);
            if (event.event === "chatCreated" && !redirected) {
              redirected = true;
              router.push(`/chat/${event.data.chatId}`);
              return;
            }
          } catch {
            // ignore parse errors
          }
        }
      }
    }
    setLoading(false);
  };

  return (  
    <main className='w-full min-h-screen overflow-y-hidden'>
      <Introduction />
      <ChatInputBox onSend={handleSendMessage} loading={loading} />
    </main>
  );
};

export default Homepage;