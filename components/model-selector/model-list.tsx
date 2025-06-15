"use client"

import { Loader2 } from "lucide-react";
import { OpenRouterModel } from "@/lib/api";
import { cn } from "@/lib/utils";
import { DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import ModelCapabilities from "./model-capabilities";
import { JSX } from "react";
import { Button } from "../ui/button";

interface ModelListProps {
  title: string;
  models: Record<string, OpenRouterModel[]>;
  selectedModel: string;
  hasApiKey: boolean;
  isLoading?: boolean;
  isFree?: boolean;
  getModelIcon: (modelId: string) => JSX.Element;
  isFreeModel: (modelId: string) => boolean;
  onModelSelect: (modelId: string) => void;
  onApiKeyClick?: () => void;
}

export function ModelList({
  title,
  models,
  selectedModel,
  hasApiKey,
  isLoading = false,
  isFree = false,
  getModelIcon,
  isFreeModel,
  onModelSelect,
  onApiKeyClick,
}: ModelListProps) {

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (Object.keys(models).length === 0) {
    return null;
  }

  return (
    <div className={!isFree ? "mb-2" : "mt-4"}>
      <div className="flex flex-col items-start gap-2 py-4 text-xs font-medium text-muted-foreground">
        <span className="text-emerald-500 text-sm">{title}</span>
        {title === "Image Gen" && (
          <div className="flex flex-col gap-1 text-[10px] text-muted-foreground">
            {!hasApiKey ? (
              <span className="text-[10px] text-amber-400">
                For higher limits, add your own API key
              </span>
            ) : (
              <span className="text-emerald-400 text-[10px]">
                ✓ Using your API key
              </span>
            )}
          </div>
        )}
        <div className="h-px flex-1 bg-border" />
      </div>

      {Object.entries(models).map(([provider, providerModels]) => (
        <div key={provider} className="mb-2 ">
          <DropdownMenuLabel className="px-0 py-1 text-xs font-medium text-muted-foreground">
            {provider}
          </DropdownMenuLabel>
          <div className="space-y-1">
            {providerModels.map((model) => (
              <div
                key={model.id}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-gray-500/10",
                  selectedModel === model.id && "bg-accent",
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  onModelSelect(model.id);
                }}
              >
                {getModelIcon(model.id)}
                <div className="flex items-center gap-2">
                  <span className={cn("truncate")}>
                    {model.name}
                  </span>
                  {model.id.includes("image") && !isFreeModel(model.id) && (
                    <span className="text-xs text-amber-400">
                      {hasApiKey ? "✓ Your key" : "✓ Free tier"}
                    </span>
                  )}
                </div>
                <div className="ml-auto">
                 {!model.id.includes("image") && <ModelCapabilities model={model} />}
                  {model.id.includes("image") &&
                    onApiKeyClick &&
                    !hasApiKey && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onApiKeyClick();
                        }}
                        className="cursor-pointer"
                      >
                        Add Key
                      </Button>
                    )}
                  {model.id.includes("image") && onApiKeyClick && hasApiKey && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onApiKeyClick();
                      }}
                      className="cursor-pointer"
                    >
                      Manage
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
