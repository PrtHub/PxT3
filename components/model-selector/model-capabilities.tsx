"use client";

import { OpenRouterModel } from "@/lib/api";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Eye, Globe, Brain, ImageIcon } from "lucide-react";

interface ModelCapabilitiesProps {
  model: OpenRouterModel;
}

const ModelCapabilities = ({ model }: ModelCapabilitiesProps) => {
  const hasWebSearch = model.supported_parameters?.some(
    param => typeof param === 'string' && param.toLowerCase().includes('tools')
  );

  const isReasoningModel = 
    model.name.toLowerCase().includes('reasoning') || 
    (model.description?.toLowerCase().includes('reasoning') ?? false) || 
    (model.supported_parameters?.includes('reasoning') ?? false);

  const canGenerateImages = model.architecture?.output_modalities?.some(
    modality => typeof modality === 'string' && modality.toLowerCase().includes('image')
  );

  const inputModalities = model.architecture?.input_modalities?.join(", ") || 'text';

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
              Supports {inputModalities} {model.architecture?.output_modalities?.includes('image') ? 'input' : ''}
              {model.architecture?.output_modalities?.includes('image') ? ' and image generation' : ' and analysis'}
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
