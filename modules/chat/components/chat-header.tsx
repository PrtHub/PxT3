"use client";

import { useState } from "react";
import { Share2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { trpc } from "@/trpc/client";
import { toast } from "sonner";
import { useUser } from "@/hooks/use-user";
import DialogModal from "@/components/dialog-modal";

interface ChatHeaderProps {
  chatId: string;
}

const ChatHeader = ({ chatId }: ChatHeaderProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [chatData, { refetch }] = trpc.chat.getOneChat.useSuspenseQuery({
    chatId,
  });
  const { user } = useUser();

  const isUserChat = chatData?.userId === user?.id;

  const utils = trpc.useUtils();

  const shareChat = trpc.chat.shareChat.useMutation({
    onSuccess: (data) => {
      navigator.clipboard.writeText(data.url);
      toast.success("Share link copied!");
    },
    onError: () => {
      toast.error("Failed to copy share link!");
    },
  });

  const editChatTitle = trpc.chat.editChatTitle.useMutation({
    onSuccess: () => {
      refetch();
      setIsEditing(false);
      utils.chat.getChatsForUser.invalidate();
      utils.chat.getOneChat.invalidate({ chatId });
      toast.success("Chat title updated!");
    },
    onError: () => {
      toast.error("Failed to update title!");
    },
  });

  const title = chatData?.title || "Chat";

  const handleEditClick = () => {
    setNewTitle(title);
    setIsEditing(true);
  };

  const handleSave = () => {
    if (newTitle.trim() && newTitle !== title) {
      editChatTitle.mutate({ chatId, title: newTitle.trim() });
    } else {
      setIsEditing(false);
    }
  };

  return (
    <>
      <div className="absolute top-0 left-0 right-0 bg-background/95 backdrop-blur-sm z-10 border-b border-border">
        <div className="max-w-3xl mx-auto w-full px-4 py-3 flex items-center justify-between">
          <div className="flex-1 min-w-0 flex items-center group">
            <h1 className="font-bold text-lg truncate mr-2">
              {title}
            </h1>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                 {isUserChat && <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    onClick={handleEditClick}
                  >
                    <Pencil className="h-3 w-3" />
                    <span className="sr-only">Edit title</span>
                  </Button>}
                </TooltipTrigger>
                <TooltipContent>
                  <p>Edit title</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex-shrink-0 ml-4 flex items-center space-x-2">
            <Tooltip>
              <TooltipTrigger asChild>
                {isUserChat && <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => shareChat.mutate({ chatId })}
                  disabled={shareChat.isPending}
                  className="cursor-pointer"
                >
                  <Share2 className="h-4 w-4" />
                  <span className="sr-only">Share chat</span>
                </Button>}
              </TooltipTrigger>
              <TooltipContent>
                <p>Share chat</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>

    <DialogModal
      title="Edit Chat Title"
      isSaving={isEditing}
      setIsSaving={setIsEditing}
      newValue={newTitle}
      setNewValue={setNewTitle}
      handleSave={handleSave}
      disabled={editChatTitle.isPending}  
    />
    </>
  );
}

export default ChatHeader;