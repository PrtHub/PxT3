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

const ChatHistory = () => {
  const path = usePathname();
  const { data: chats, isLoading } = trpc.chat.getChatsForUser.useQuery();

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
        <SidebarMenu className="pr-2 space-y-1 pb-52">
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
                      "group-data-[collapsible=icon]:p-0 hover:bg-zinc-800 transition-all duration-100 cursor-pointer",
                      chat.id === path.split("/")[2] &&
                        "bg-gradient-to-br from-zinc-800 to-zinc-900",
                      "text-white/80"
                    )}
                    isActive={chat.id === path.split("/")[2]}
                    variant="outline"
                  >
                    <span
                      className="group-data-[collapsible=icon]:opacity-0 transition-all duration-500 ease-in-out font-medium text-white/80 whitespace-nowrap text-ellipsis overflow-hidden block"
                      title={chat.title}
                    >
                      {chat.title}
                    </span>
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
