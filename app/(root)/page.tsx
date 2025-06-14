'use client'

import React, { useState } from 'react';
import Introduction from '@/modules/home/section/Introduction';
import ChatInputBox from '@/modules/chat/components/chat-input-box';
import { useRouter } from 'next/navigation';
import { useInitialMessageStore } from '@/modules/chat/store/initial-message-store';

const Homepage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const setInitialMessage = useInitialMessageStore((state) => state.setMessage);
  
  const {message} = useInitialMessageStore()

  console.log("message", message)

  const handleSendMessage = async (userMessage: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/chat/create", {
        method: "POST",
        body: JSON.stringify({ content: userMessage }),
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`HTTP error! status: ${res.status}, ${errorText}`);
      }

      const { chatId } = await res.json();
      setInitialMessage(userMessage);
      router.push(`/chat/${chatId}`);

    } catch (error) {
      console.error("Error creating chat:", error);
    } finally {
      setLoading(false);
    }
  };

  return (  
    <main className='w-full min-h-screen overflow-y-hidden'>
      <Introduction />
      <ChatInputBox onSend={handleSendMessage} message={message} loading={loading} />
    </main>
  );
};

export default Homepage;