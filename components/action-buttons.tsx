"use client";

import {
  Copy,
  Check,
  Edit,
  GitBranch,
  Volume2Icon,
  VolumeXIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ActionButtonsProps {
  isUser: boolean;
  isEditing: boolean;
  handleCopy: () => void;
  handleBranch: () => void;
  handleReadAloud: () => void;
  handleEdit: () => void;
  isCopied: boolean;
  isBranched: boolean;
  isReading: boolean;
}

const ActionButtons = ({
  isUser,
  isEditing,
  handleCopy,
  handleBranch,
  handleReadAloud,
  handleEdit,
  isCopied,
  isBranched,
  isReading,
}: ActionButtonsProps) => {
  return (
    <div className="flex items-center gap-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
      {!isUser && !isEditing && (
        <>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                  className="h-7 px-1 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800/50 cursor-pointer"
                >
                  {isCopied ? (
                    <>
                      <Check className="h-3.5 w-3.5 mr-0.5 text-emerald-400" />
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 mr-0.5" />
                    </>
                  )}
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isCopied ? "Copied" : "Copy"}</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBranch}
                  className="h-7 px-1 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800/50 cursor-pointer"
                >
                  {isBranched ? (
                    <>
                      <Check className="h-3.5 w-3.5 mr-0.5 text-emerald-400" />
                    </>
                  ) : (
                    <>
                      <GitBranch className="h-3.5 w-3.5 mr-0.5" />
                    </>
                  )}
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>Branch off</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReadAloud}
                  className="h-7 px-1 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800/50 cursor-pointer"
                >
                  {isReading ? (
                    <>
                      <VolumeXIcon className="h-3.5 w-3.5 mr-0.5 text-emerald-400" />
                    </>
                  ) : (
                    <>
                      <Volume2Icon className="h-3.5 w-3.5 mr-0.5" />
                    </>
                  )}
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isReading ? "Stop" : "Read aloud"}</p>
            </TooltipContent>
          </Tooltip>
        </>
      )}
      {isUser && !isEditing && (
        <>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                  className="h-7 px-1 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800/50 cursor-pointer"
                >
                  {isCopied ? (
                    <>
                      <Check className="h-3.5 w-3.5 mr-0.5 text-emerald-400" />
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 mr-0.5" />
                    </>
                  )}
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isCopied ? "Copied" : "Copy"}</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleEdit}
                  className="h-7 px-1 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800/50 cursor-pointer"
                >
                  <Edit className="h-3.5 w-3.5 mr-0.5" />
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>Edit</p>
            </TooltipContent>
          </Tooltip>
        </>
      )}
    </div>
  );
};

export default ActionButtons;
