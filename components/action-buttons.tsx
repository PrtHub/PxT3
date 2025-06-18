"use client";

import {
  Copy,
  Check,
  Edit,
  GitBranch,
  Volume2Icon,
  VolumeXIcon,
  RefreshCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { useSettingsStore } from "@/modules/chat/store/settings-store";
import { useRetryMessageStore } from "@/modules/chat/store/retry-message-store";
import getModelIcon from "@/components/model-selector/model-icons";
import { trpc } from "@/trpc/client";

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
  messageId: string;
  isShared: boolean;
}

const getProviderFromModelId = (modelId: string): string => {
  if (modelId.includes("gemini") && modelId.includes("image")) {
    return "google";
  }

  if (modelId.includes("/")) {
    return modelId.split("/")[0];
  }

  const provider = modelId.split("-")[0];
  return provider.toLowerCase();
};

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
  messageId,
  isShared,
}: ActionButtonsProps) => {
  const { availableModels } = useSettingsStore();
  const { setRetryData } = useRetryMessageStore();

  const { data: aiMessage } = trpc.chat.getOneMessage.useQuery({ messageId });

  const { data: parentMessage } = trpc.chat.getOneMessage.useQuery(
    { messageId: aiMessage?.parentId ?? "" },
    { enabled: !!aiMessage?.parentId }
  );

  const modelGroups = availableModels.reduce((acc, model) => {
    const provider = getProviderFromModelId(model.id);
    if (!acc[provider]) {
      acc[provider] = [];
    }
    acc[provider].push(model);
    return acc;
  }, {} as Record<string, typeof availableModels>);

  const handleRetryWithModel = (modelId: string) => {
    if (!aiMessage?.id || !aiMessage?.parentId || !parentMessage?.content)
      return;
    setRetryData({
      aiMessageId: aiMessage.id,
      parentId: aiMessage.parentId,
      userMessageContent: parentMessage.content,
      selectedModel: modelId,
    });
  };

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
          {!isShared && (
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
          )}
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
          {!isShared && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild className="flex gap-x-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-1 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800/50 cursor-pointer"
                      >
                        <RefreshCcw className="h-3.5 w-3.5 mr-0.5" />
                      </Button>
                      {/* <span>{selectedModel}</span> */}
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="center"
                      className="w-64 h-[250px] overflow-y-auto"
                    >
                      <DropdownMenuItem
                        className="text-xs flex items-center gap-2 text-zinc-400 hover:text-white hover:bg-zinc-800/50 cursor-pointer"
                        onClick={() => handleRetryWithModel("same")}
                      >
                        <RefreshCcw className="h-3.5 w-3.5" />
                        <span>Go with same</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-zinc-800" />
                      <div className="px-2 py-1.5">
                        <p className="text-xs font-medium text-zinc-400">
                          Or try with:
                        </p>
                      </div>
                      {Object.entries(modelGroups).map(([provider, models]) => (
                        <DropdownMenuSub key={provider}>
                          <DropdownMenuSubTrigger className="text-xs flex items-center gap-2 hover:text-white hover:bg-zinc-800/50 cursor-pointer">
                            {getModelIcon(provider)}
                            <span className="capitalize">{provider}</span>
                          </DropdownMenuSubTrigger>
                          <DropdownMenuSubContent className="w-48">
                            {models.map((model) => (
                              <DropdownMenuItem
                                key={model.id}
                                className="text-xs flex items-center gap-2 hover:text-white hover:bg-zinc-800/50 cursor-pointer"
                                onClick={() => handleRetryWithModel(model.id)}
                              >
                                {getModelIcon(model.id)}
                                <span>{model.name}</span>
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Retry message</p>
              </TooltipContent>
            </Tooltip>
          )}
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
          {!isShared && (
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
          )}
        </>
      )}
    </div>
  );
};

export default ActionButtons;
