"use client";

import { Toggle } from "@/components/ui/toggle";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Globe } from "lucide-react";
import { useState } from "react";

interface WebSearchToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  className?: string;
  hasWebSearch?: boolean;
}

export function WebSearchToggle({ 
  enabled, 
  onToggle, 
  className, 
  hasWebSearch = false 
}: WebSearchToggleProps) {
  const [open, setOpen] = useState(false);

  const handleToggle = (pressed: boolean) => {
    onToggle(pressed);
    setOpen(false); 
  };

  return (
    <TooltipProvider>
      <Tooltip open={open} onOpenChange={setOpen}>
        <TooltipTrigger asChild>
          <div className={cn(
            "cursor-pointer", 
            !hasWebSearch && "cursor-not-allowed",
            className
          )}>
            <Toggle
              id="web-search"
              pressed={enabled}
              onPressedChange={handleToggle}
              disabled={!hasWebSearch}
              className={cn(
                "data-[state=on]:bg-button/80 data-[state=on]:text-black hover:bg-transparent hover:text-button/80 h-7",
                !hasWebSearch && "opacity-30"
              )}
              asChild
            >
              <div className="flex items-center p-1">
                <Globe className="h-4 w-4" />
              </div>
            </Toggle> 
          </div>
        </TooltipTrigger>
        <TooltipContent side="top">
          {hasWebSearch ? (
            <p>{enabled ? "Disable" : "Enable"} web search</p>
          ) : (
            <p>Web search not supported</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}