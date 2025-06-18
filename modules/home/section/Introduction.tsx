'use client'

import React from 'react';
import { MessageSquare, Code, Lightbulb } from 'lucide-react';
import { useInitialMessageStore } from '@/modules/chat/store/initial-message-store';

const prompts = [
  {
    title: 'Explain quantum computing',
    description: 'In simple terms',
    icon: <Code className="w-5 h-5 text-blue-400"/>
  },
  {
    title: 'Explain API rate limiting',
    description: 'Best practices and implementation',
    icon: <Lightbulb className="w-5 h-5 text-emerald-400" />
  },
  {
    title: 'Create a workout plan',
    description: 'For beginners, 3 days a week',
    icon: <MessageSquare className="w-5 h-5 text-purple-400" />
  },
  {
    title: 'Help me write an blog post',
    description: 'About AI and its impact on society',
    icon: <MessageSquare className="w-5 h-5 text-amber-400" />
  }
];


const Introduction= () => {
  const setPrompt = useInitialMessageStore((state) => state.setPrompt);

  const handlePromptClick = (title: string, description: string) => {
    setPrompt(title, description);
  };


  return (
    <div className="flex flex-col items-center justify-center h-svh w-full max-w-2xl mx-auto lg:pb-50 pb-20 md:pb-30 px-4">
      <div className="text-center lg:space-y-6 space-y-4 w-full">
        <h1 className="lg:text-3xl text-2xl font-bold text-white">
          How can I help you today?
        </h1>
        <p className="lg:text-sm text-xs text-white/70 max-w-2xl mx-auto">
          I&apos;m pxt.chat, your AI assistant. I can help with coding, writing, learning, and more.
          Ask me anything or try one of these examples:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-4 mt-6 md:mt-8 w-full">
          {prompts.map((prompt, index) => (
            <button
              key={index}
              onClick={() => handlePromptClick(prompt.title, prompt.description)}
              className="group p-4 bg-transparent rounded-lg border border-white/10 hover:bg-white/10 transition-colors duration-200 text-left cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <div>
                  <p className="lg:text-base text-sm font-medium text-white">{prompt.title}</p>
                  <p className="lg:text-sm text-xs text-white/60">{prompt.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Introduction;