"use client";

import { cn } from "@/lib/utils";
import React, { useState, useEffect } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import Link from "next/link";
import ChatHistory from "@/modules/chat/components/chat-history";
import { SearchCommand } from "@/components/search-command";

const MainSection = () => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    setIsSearching(searchQuery.trim() !== "");
  }, [searchQuery]);

  const clearSearch = () => {
    setSearchQuery("");
  };

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
        <section className="md:flex items-center justify-center group-data-[collapsible=icon]:bg-background group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:rounded group-data-[collapsible=icon]:absolute group-data-[collapsible=icon]:left-2 hidden">
          <SidebarTrigger className="group-data-[collapsible=icon]:ml-3 w-fit px-2" />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpen(true)}
            className="hover:bg-gray-700 w-fit px-2 hidden group-data-[collapsible=icon]:block cursor-pointer"
          >
           <Search className="size-4" />
          </Button>
        </section>
      </header>

      <Link
        href="/"
        className="px-4 py-2 w-full group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:opacity-0 transition-all"
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

      <div className="px-4 py-2 w-full group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:opacity-0 transition-all">
        <div className="relative flex items-center bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-md px-4 py-1 w-full h-10 border border-zinc-700 shadow-2xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/60" />
          <Input
            type="search"
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-5 pr-5 -mt-0.5 bg-transparent text-white placeholder:text-white/50 text-sm font-normal border-0 focus:ring-0 w-full outline-none"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              onClick={clearSearch}
              className="absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Clear search"
            >
              <X className="size-4 text-white/60" />
            </Button>
          )}
        </div>
      </div>

      <SearchCommand open={open} onOpenChange={setOpen} />
      <ChatHistory searchQuery={isSearching ? debouncedSearchQuery : null} />
    </>
  );
};

export default MainSection;