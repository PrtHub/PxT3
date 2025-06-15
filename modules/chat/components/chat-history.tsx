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
import { GitBranch } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface ChatHistoryProps {
  searchQuery?: string | null;
}

const ChatHistory = ({ searchQuery }: ChatHistoryProps) => {
  const path = usePathname();
  const { data: chats, isLoading } = trpc.chat.getChatsForUser.useQuery({
    searchQuery,
  });

  const formatChatTitle = (chat: { title: string; branchName: string | null }) => {
    if (chat.branchName) {
      const cleanTitle = chat.title.replace(/^Branch from: /, '');
      return cleanTitle;
    }
    return chat.title;
  };

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
    <SidebarGroup className="flex flex-col h-full px-4 py-2">
      <p className="text-xs text-button/80 font-semibold mb-2 group-data-[collapsible=icon]:opacity-0 transition-all duration-500 ease-in-out">
        History
      </p>
      <SidebarGroupContent className="flex-1 overflow-y-auto">
        <SidebarMenu className="space-y-1 pb-52">
            {chats.map((chat) => (
              <SidebarMenuItem key={chat.id}>
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
                    <div className="w-full flex items-center gap-2 pr-2 cursor-pointer">
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
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
  );
};

export default ChatHistory;
