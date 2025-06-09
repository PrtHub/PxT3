import React from 'react';
import { MessageSquare, Code, Lightbulb } from 'lucide-react';

const Introduction = () => {
  const prompts = [
    {
      title: 'Explain quantum computing',
      description: 'In simple terms',
      icon: <Lightbulb className="w-5 h-5 text-emerald-400" />
    },
    {
      title: 'Write a poem about AI',
      description: 'In the style of Shakespeare',
      icon: <MessageSquare className="w-5 h-5 text-blue-400" />
    },
    {
      title: 'Help me debug this code',
      description: 'I\'m getting an error',
      icon: <Code className="w-5 h-5 text-purple-400" />
    },
    {
      title: 'Explain like I\'m 10',
      description: 'How does the internet work?',
      icon: <Lightbulb className="w-5 h-5 text-amber-400" />
    }
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full w-full max-w-2xl m-auto py-12">
      <div className="text-center space-y-6 w-full">
        <h1 className="text-3xl font-bold text-white">
          How can I help you today?
        </h1>
        <p className="text-white/70 text-sm max-w-2xl mx-auto">
          I&apos;m PxT3, your AI assistant. I can help with coding, writing, learning, and more.
          Ask me anything or try one of these examples:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8 w-full">
          {prompts.map((prompt, index) => (
            <button
              key={index}
              className="group p-4 bg-transparent rounded-lg border border-white/10 hover:bg-white/10 transition-colors duration-200 text-left"
            >
              <div className="flex items-center space-x-3">
                {/* <div className="p-1.5 rounded-md bg-white/5">
                  {prompt.icon}
                </div> */}
                <div>
                  <p className="font-medium text-white">{prompt.title}</p>
                  <p className="text-sm text-white/60">{prompt.description}</p>
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