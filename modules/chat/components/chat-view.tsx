import React from 'react'

interface Message {
  role: string;
  content: string;
}

interface Props {
  chatId: string;
  messages: Message[];
  streamingResponse: string;
  loading: boolean;
}

const ChatView = ({chatId, messages, streamingResponse, loading }: Props) => {

  console.log(streamingResponse)

  return (
    <div className="w-full h-[calc(100vh-10px)] flex flex-col">
      <div className="p-4 border-b h-14">chat-view {chatId}</div>
      <div className="flex-1 w-full overflow-y-auto pb-60">
        <div className="max-w-3xl mx-auto">
          {messages.map((message, index) => (
            <div key={index} className={`p-4 ${message.role === 'user' ? 'text-rose-500' : 'text-emerald-500'}`}>
              {message.content}
            </div>
          ))}
          <div className='flex flex-col gap-4'>
            {loading && <div className='text-emerald-500'>{streamingResponse}</div>}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChatView