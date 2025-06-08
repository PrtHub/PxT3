import { cn } from "@/lib/utils";
import React from "react";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import Link from "next/link";

const MainSection = () => {
  return (
    <>
      <header className="px-4 pt-4 pb-2 flex items-center justify-between h-[40px]">
        <h2
          className={cn(
            "text-lg font-normal text-white font-silkscreen tracking-tight",
            "group-data-[collapsible=icon]:opacity-0 transition-all duration-500 ease-in-out"
          )}
          style={{
            fontFamily: 'var(--font-silkscreen)',
            textShadow: '0 0 10px rgba(255, 255, 255, 0.5)'
          }}
        >
          PxT3.chat
        </h2>
        <section className="flex items-center justify-center gap-x-2 group-data-[collapsible=icon]:bg-background group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:rounded group-data-[collapsible=icon]:absolute group-data-[collapsible=icon]:left-2 group-data-[collapsible=icon]:w-20">
          <SidebarTrigger className="group-data-[collapsible=icon]:ml-3" />
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-gray-700 hidden group-data-[collapsible=icon]:block"
          >
            <Search />
          </Button>
        </section>
      </header>

      <Link
        href="/"
        className="px-4 py-2 w-full group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:opacity-0 transition-all duration-500 ease-in-out"
      >
        <Button
          variant="default"
          className="w-full h-10 bg-button border-2 hover:bg-button/90 border-emerald-400 text-black flex items-center justify-center group-data-[collapsible=icon]:w-0 cursor-pointer"
        >
          <span className="group-data-[collapsible=icon]:hidden transition-all duration-500 ease-in-out text-black font-semibold">
            New Chat
          </span>
        </Button>
      </Link>

      <div className="px-4 py-2 w-full group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:opacity-0 transition-all duration-500 ease-in-out">
        <div className="relative flex items-center bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-md px-4 py-1 w-full h-10 border border-zinc-700 shadow-2xl">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-4 text-white/60" />
          <Input
            type="search"
            placeholder="Search"
            className="pl-5 pr-2 -mt-0.5 bg-transparent text-white placeholder:text-white/50 text-lg font-normal border-0 focus:ring-0 w-full outline-none"
          />
        </div>
      </div>
      <SidebarGroup className="px-4 py-2">
        <SidebarGroupContent>
          <div className="mb-4">
            <p className="text-xs text-button/80 font-semibold mb-2 group-data-[collapsible=icon]:opacity-0 transition-all duration-500 ease-in-out">
              Today
            </p>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton className="w-full h-10 bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-md text-sm group-data-[collapsible=icon]:opacity-0 transition-all duration-500 ease-in-out group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:p-0">
                  <Link
                    href={`/chat/wlenknwe`}
                    className="group-data-[collapsible=icon]:opacity-0 transition-all duration-500 ease-in-out font-medium text-white cursor-pointer whitespace-nowrap"
                  >
                    AI explanation
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    </>
  );
};

export default MainSection;
