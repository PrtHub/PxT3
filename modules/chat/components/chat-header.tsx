"use client";

import { Suspense, useState } from "react";
import { Share2, Edit as EditIcon, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { trpc } from "@/trpc/client";
import { useUser } from "@/hooks/use-user";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import DialogModal from "@/components/dialog-modal";
import { Input } from "@/components/ui/input";

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

  const [shareUrl, setShareUrl] = useState("");
  const [isCopied, setIsCopied] = useState(false);

  const shareChat = trpc.chat.shareChat.useMutation({
    onSuccess: (data) => {
      setShareUrl(data.url);
    },
    onError: () => {
      console.log("Failed to generate share link!");
    },
  });

  const editChatTitle = trpc.chat.editChatTitle.useMutation({
    onSuccess: () => {
      refetch();
      setIsEditing(false);
      utils.chat.getChatsForUser.invalidate();
      utils.chat.getOneChat.invalidate({ chatId });
      console.log("Chat title updated!");
    },
    onError: () => {
      console.log("Failed to update title!");
    },
  });

  const title = chatData?.title || "Chat";
  const [isSharing, setIsSharing] = useState(false);

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

  const formatChatTitle = (chat: {
    title: string;
    branchName: string | null;
  }) => {
    return chat.title.replace(/^Branch from: /, "");
  };

  const handleShareClick = () => {
    shareChat.mutate(
      { chatId },
      {
        onSuccess: () => {
          setIsSharing(true);
        },
      }
    );
  };

  const handleCopyUrl = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      setIsCopied(true);
    }
  };

  const handleCopyUrlClick = () => {
    handleCopyUrl();
    setTimeout(() => {
      setIsCopied(false);
    }, 2000);
  };

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="absolute top-0 left-0 right-0 bg-background/95 backdrop-blur-sm z-10 border-b border-border">
        <div className="max-w-3xl mx-auto w-full py-3 px-4 flex items-center justify-between">
          <div className="flex-1 min-w-0 flex items-center group">
            <h1 className="font-bold text-base sm:text-lg truncate mr-1 md:pl-0 pl-10">
              {formatChatTitle(chatData)}
            </h1>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  {isUserChat && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      onClick={handleEditClick}
                    >
                      <EditIcon className="h-3 w-3" />
                      <span className="sr-only">Edit title</span>
                    </Button>
                  )}
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
                {isUserChat && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleShareClick}
                    className="cursor-pointer"
                  >
                    <Share2 className="h-4 w-4" />
                    <span className="sr-only">Share chat</span>
                  </Button>
                )}
              </TooltipTrigger>
              <TooltipContent>
                <p>Share chat</p>
              </TooltipContent>
            </Tooltip>
            <Dialog open={isSharing} onOpenChange={setIsSharing}>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Share Chat</DialogTitle>
                  <DialogDescription>
                    Share this link with others to give them access to this
                    chat.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="flex items-center space-x-2">
                    <Input
                      value={shareUrl || "Generating share link..."}
                      readOnly
                      className="flex-1 p-2 border rounded-md bg-muted/50 text-sm font-mono overflow-x-auto"
                    />
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleCopyUrlClick}
                      className="shrink-0 cursor-pointer bg-button hover:bg-button/80 transition-all"
                    >
                      {isCopied ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
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
    </Suspense>
  );
};

export default ChatHeader;
