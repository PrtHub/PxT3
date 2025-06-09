import React from "react";

interface Props {
  params: Promise<{ chatId: string }>;
}

const Chat = async ({ params }: Props) => {
  const { chatId } = await params;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="p-4 min-h-full">
        <div className="h-[1200px] text-white">{chatId}</div>
      </div>
    </div>
  );
};

export default Chat;
