"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { trpc } from "@/trpc/client";
import { usePathname } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { GitBranch, X } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useSession } from "next-auth/react";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ChatHistoryProps {
  searchQuery?: string | null;
}

const ChatHistory = ({ searchQuery }: ChatHistoryProps) => {
  const session = useSession();
  const path = usePathname();

  const [chatToDelete, setChatToDelete] = useState<string | null>(null);
  const [hoveredChat, setHoveredChat] = useState<string | null>(null);
  const utils = trpc.useUtils();

  const { data: chats, isLoading } = trpc.chat.getChatsForUser.useQuery({
    searchQuery,
  }, {
    enabled: !!session.data?.user,
  });

  const deleteChat = trpc.chat.deleteChat.useMutation({
    onSuccess: () => {
      utils.chat.getChatsForUser.invalidate();
    },
    onError: () => {
      console.log("Failed to delete chat!");
    }
  });

  const formatChatTitle = (chat: { title: string; branchName: string | null }) => {
      const cleanTitle = chat.title.replace(/^Branch from: /, '');
      return cleanTitle;
  };

  const handleDeleteClick = (e: React.MouseEvent, chatId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setChatToDelete(chatId);
  };

  const confirmDelete = () => {
    if (chatToDelete) {
      deleteChat.mutate({ chatId: chatToDelete });
      setChatToDelete(null);
    }
  };

  if (!session.data?.user) {
    return null;
  }

  if (isLoading) {
    return (
      <SidebarGroup className="flex flex-col h-full px-4 py-2">
        <Skeleton className="h-4 w-24 mb-2" />
        <SidebarGroupContent className="flex-1 overflow-y-auto">
          <div className="space-y-3 pr-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-8 w-full rounded-md" />
            ))}
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  if (!chats?.length) {
    return null;
  }

  return (
    <>
      <SidebarGroup className="flex flex-col h-full px-4 py-2">
      <p className="text-xs text-button/80 font-semibold mb-2 group-data-[collapsible=icon]:opacity-0 transition-all duration-500 ease-in-out">
        History
      </p>
      <SidebarGroupContent className="flex-1 overflow-y-auto">
        <SidebarMenu className="space-y-1 pb-52">
            {chats.map((chat) => (
              <SidebarMenuItem 
                key={chat.id}
                onMouseEnter={() => setHoveredChat(chat.id)}
                onMouseLeave={() => setHoveredChat(null)}
                className="group relative"
              >
                <Link 
                  href={`/chat/${chat.id}`}
                  prefetch={true}
                  className="block w-full"
                >
                  <SidebarMenuButton
                    className={cn(
                      "w-full h-10 rounded-md text-sm group-data-[collapsible=icon]:opacity-0",
                      "transition-all duration-500 ease-in-out group-data-[collapsible=icon]:w-0",
                      "group-data-[collapsible=icon]:p-0 hover:bg-zinc-800 transition-all duration-100 cursor-pointer ",
                      chat.id === path.split("/")[2] &&
                        "bg-gradient-to-br from-zinc-800 to-zinc-900",
                      "text-white/80"
                    )}
                    isActive={chat.id === path.split("/")[2]}
                    variant="outline"
                  >
                    <div className="w-full flex items-center gap-2 pr-2">
                      {chat.branchName && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <GitBranch className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{chat.branchName}</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                      <span
                        className="group-data-[collapsible=icon]:opacity-0 transition-all duration-500 ease-in-out font-medium text-white/80 whitespace-nowrap text-ellipsis overflow-hidden block"
                        title={formatChatTitle(chat)}
                      >
                        {formatChatTitle(chat)}
                      </span>
                    </div>
                  </SidebarMenuButton>
                  <div 
                    className={cn(
                      "absolute inset-0 flex items-center justify-end pr-2 bg-gradient-to-l from-zinc-900/90 via-zinc-900/10 to-transparent pointer-events-none transition-opacity duration-200 rounded-md",
                      hoveredChat === chat.id ? "opacity-100" : "opacity-0"
                    )}
                  >
                    <button
                      type="button"
                      onClick={(e) => handleDeleteClick(e, chat.id)}
                      className="h-7 w-7 rounded-full flex items-center justify-center text-zinc-300  hover:text-button hover:bg-zinc-700/80 cursor-pointer transition-colors duration-200 pointer-events-auto"
                      aria-label="Delete chat"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <AlertDialog open={!!chatToDelete} onOpenChange={(open) => !open && setChatToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Chat</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this chat? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-button hover:bg-button/80 cursor-pointer"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ChatHistory;
