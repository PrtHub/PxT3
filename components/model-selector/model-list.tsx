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
  const selectedModelObj = Object.values(models)
    .flat()
    .find((model) => model.id === selectedModel);

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
        {!hasApiKey && title === "Image Gen" && (
          <span className="text-xs text-muted-foreground">
            Important: To use image model, you need to add an API key.
          </span>
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
                  if (model.id.includes("image") && !hasApiKey) {
                    onApiKeyClick?.();
                  } else {
                    onModelSelect(model.id);
                  }
                }}
              >
                {getModelIcon(model.id)}
                <span className={cn("truncate", !hasApiKey && !isFreeModel(model.id) && model.id.includes("image") && "opacity-50 cursor-not-allowed")}>
                  {model.name}
                  {!hasApiKey &&
                    !isFreeModel(model.id) &&
                    model.id.includes("image") && (
                      <span className="ml-2 text-xs text-yellow-500">
                        (API key required)
                      </span>
                    )}
                </span>
                <div className="ml-auto">
                 {!model.id.includes("image") && <ModelCapabilities model={selectedModelObj || model} />}
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
