"use client";

import { useEffect, useState } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { 
  CommandDialog, 
  CommandInput, 
  CommandList, 
  CommandEmpty, 
  CommandGroup, 
  CommandItem 
} from "@/components/ui/command";
import { useRouter } from "next/navigation";
import { Loader2, MessageSquare } from "lucide-react";
import { trpc } from "@/trpc/client";

interface SearchCommandProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchCommand({ open, onOpenChange }: SearchCommandProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const router = useRouter();

  const { data: searchResults, isLoading } = trpc.chat.getChatsForUser.useQuery(
    { searchQuery: debouncedSearchQuery },
    {
      enabled: open && debouncedSearchQuery.trim() !== "",
    }
  );

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onOpenChange(false);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [onOpenChange]);

  const handleSelect = (chatId: string) => {
    router.push(`/chat/${chatId}`);
    onOpenChange(false);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} className="max-w-2xl">
      <div className="relative px-4 pt-4">
        <CommandInput
          placeholder="Search your chats..."
          value={searchQuery}
          onValueChange={setSearchQuery}
          className="text-base border-0 focus:ring-0 focus-visible:ring-0"
        />
      </div>
      
      <CommandList className="px-3 pb-3 overflow-y-auto max-h-[60vh]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="w-6 h-6 mb-2 animate-spin" />
            <p className="text-sm">Searching...</p>
          </div>
        ) : searchQuery.trim() === "" ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <MessageSquare className="w-6 h-6 mb-2 opacity-50 text-button" />
            <p className="text-sm">Type to search your chats</p>
            <p className="text-xs mt-1 text-muted-foreground/70">
              Press <kbd className="px-1.5 py-0.5 text-xs rounded bg-muted text-button">ESC</kbd> to close
            </p>
          </div>
        ) : searchResults?.length === 0 ? (
          <CommandEmpty className="py-8 text-muted-foreground">
            No matching chats found
          </CommandEmpty>
        ) : (
          <CommandGroup heading="Chats" className="mt-2">
            {searchResults?.map((chat) => (
              <CommandItem
                key={chat.id}
                value={`${chat.id}-${chat.title}`}
                onSelect={() => handleSelect(chat.id)}
                className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-accent/50 cursor-pointer"
              >
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-accent/50 text-muted-foreground">
                  <MessageSquare className="h-4 w-4 text-button" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate font-medium text-foreground">
                    {chat.title || "Untitled Chat"}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <span className="text-xs">{formatDate(chat.updatedAt)}</span>
                    </span>
                  </div>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
