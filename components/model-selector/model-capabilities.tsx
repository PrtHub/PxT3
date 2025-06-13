"use client";

import { OpenRouterModel } from "@/lib/api";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

import { Eye, Globe, Brain, ImageIcon } from "lucide-react";

const ModelCapabilities = ({ model }: { model: OpenRouterModel }) => {
  const hasWebSearch = model.supported_parameters?.some(
    (p: string) => typeof p === "string" && p.toLowerCase().includes("tools")
  );

  const isReasoningModel =
    model.name.toLowerCase().includes("reasoning") ||
    (model.description?.toLowerCase().includes("reasoning") ?? false);

  const canGenerateImages = model.architecture?.output_modalities?.some(
    (m: string) => m.toLowerCase().includes("image")
  );

  const capabilities: string[] = [];

  if (model.architecture?.input_modalities) {
    capabilities.push(`${model.architecture.input_modalities.join(", ")}`);
  }

  return (
    <div className="flex items-center gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 text-muted-foreground hover:text-foreground"
          >
            <Eye className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent className="max-w-[300px] text-sm">
          <div className="space-y-1">
            <p className="text-xs">
              Supports {capabilities.length > 1 ? "only " : ""}{" "}
              {capabilities.join(", ")} and analysis
            </p>
          </div>
        </TooltipContent>
      </Tooltip>

      {hasWebSearch && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 text-muted-foreground hover:text-foreground"
            >
              <Globe className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Uses web search</TooltipContent>
        </Tooltip>
      )}

      {isReasoningModel && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 text-muted-foreground hover:text-foreground"
            >
              <Brain className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Advanced reasoning</TooltipContent>
        </Tooltip>
      )}

      {canGenerateImages && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 text-muted-foreground hover:text-foreground"
            >
              <ImageIcon className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Image generation</TooltipContent>
        </Tooltip>
      )}
    </div>
  );
};

export default ModelCapabilities;
