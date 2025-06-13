import { useEffect, useState } from "react";
import {
  ChevronDown,
  Key,
  Loader2,
  Sparkles,
  Zap,
  AlertCircle,
  Eye,
  Globe,
  Brain,
  Image as ImageIcon,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { fetchModels, OpenRouterModel } from "@/lib/api";
import { toast } from "sonner";
import { freeModels } from "@/constants/models";

interface ModelSelectorProps {
  selectedModel: string;
  onModelSelect: (model: string) => void;
  onApiKeyChange: (key: string) => void;
  currentApiKey?: string | null;
}

const getModelIcon = (modelId: string) => {
  const modelIdLower = modelId.toLowerCase();
  if (modelIdLower.includes("gemini"))
    return <Sparkles className="h-4 w-4 text-yellow-500" />;
  if (modelIdLower.includes("claude"))
    return <Zap className="h-4 w-4 text-orange-500" />;
  if (modelIdLower.includes("gpt"))
    return <Sparkles className="h-4 w-4 text-purple-500" />;
  return <Key className="h-4 w-4 text-gray-400" />;
};

const ModelCapabilities = ({ model }: { model: OpenRouterModel }) => {
  const hasWebSearch = model.supported_parameters?.some((p: string) => 
    typeof p === 'string' && p.toLowerCase().includes('tools')
  );
  
  const isReasoningModel = model.name.toLowerCase().includes('reasoning') || 
    (model.description?.toLowerCase().includes('reasoning') ?? false);
    
  const canGenerateImages = model.architecture?.output_modalities?.some((m: string) => 
    m.toLowerCase().includes('image')
  );
  
  const capabilities: string[] = [];
  
  if (model.architecture?.input_modalities) {
    capabilities.push(`${model.architecture.input_modalities.join(', ')}`);
  }

  return (
    <div className="flex items-center gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground hover:text-foreground">
            <Eye className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent className="max-w-[300px] text-sm">
          <div className="space-y-1">
            <p className="text-xs">
              Supports {capabilities.length > 0 ? 'only ' : ''} {capabilities.join(', ')} and analysis
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
      
      {hasWebSearch && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground hover:text-foreground">
              <Globe className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Uses web search</TooltipContent>
        </Tooltip>
      )}
      
      {isReasoningModel && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground hover:text-foreground">
              <Brain className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Advanced reasoning</TooltipContent>
        </Tooltip>
      )}
      
      {canGenerateImages && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground hover:text-foreground">
              <ImageIcon className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Image generation</TooltipContent>
        </Tooltip>
      )}
    </div>
  );
};

const groupModelsByProvider = (models: OpenRouterModel[]) => {
  const groups: Record<string, OpenRouterModel[]> = {};

  models.forEach((model) => {
    const provider = model.id.split("/")[0];
    if (!groups[provider]) {
      groups[provider] = [];
    }
    groups[provider].push(model);
  });

  return groups;
};

export function ModelSelector({
  selectedModel,
  onModelSelect,
  onApiKeyChange,
  currentApiKey,
}: ModelSelectorProps) {
  const [apiKey, setApiKey] = useState(currentApiKey || "");
  const [isSaving, setIsSaving] = useState(false);
  const [models, setModels] = useState<OpenRouterModel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const defaultModels: OpenRouterModel[] = freeModels.data.map((model) => ({
    ...model,
    description: model.description || 'Free model',
    pricing: model.pricing || {
      prompt: '0',
      completion: '0'
    },
    context_length: model.context_length || 4096,
    architecture: {
      ...model.architecture,
      input_modalities: model.architecture?.input_modalities || ['text'],
      output_modalities: model.architecture?.output_modalities || ['text']
    },
    supported_parameters: model.supported_parameters || [],
    top_provider: model.top_provider || { is_moderated: true },
    per_request_limits: model.per_request_limits || {}
  }));

  useEffect(() => {
    const loadModels = async () => {
      if (!currentApiKey) return;

      setIsLoading(true);
      setError(null);
      try {
        const fetchedModels = await fetchModels(currentApiKey);
        setModels(fetchedModels);
      } catch (err) {
        console.error("Failed to load models:", err);
        setError(
          "Failed to load models. Please check your API key and try again."
        );
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      loadModels();
    }
  }, [currentApiKey, isOpen]);

  const handleSaveApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) return;
    onApiKeyChange(apiKey);
    setIsSaving(true);
    setTimeout(() => setIsSaving(false), 2000);
    toast.success("API Key saved!");
  };

  const handleRemoveApiKey = (e: React.MouseEvent) => {
    e.preventDefault();
    setApiKey("");
    onApiKeyChange("");
    if (defaultModels.length > 0) {
      onModelSelect(defaultModels[0].id);
    }
    toast.success("API key removed");
  }; 
  
  const isFreeModel = (modelId: string) => {
    return defaultModels.some(m => m.id === modelId);
  };
  
  const getModelsByType = () => {
    const free = defaultModels;
    const premium = models.filter(m => !isFreeModel(m.id));
    return {
      free: groupModelsByProvider(free),
      premium: groupModelsByProvider(premium)
    };
  };
  
  const { free: groupedFreeModels, premium: groupedPremiumModels } = getModelsByType();

  const getModelById = (modelId: string): OpenRouterModel | undefined => {
    const modelFromApi = models.find((m) => m.id === modelId);
    if (modelFromApi) return modelFromApi;
    return defaultModels.find((m) => m.id === modelId);
  };

  const selectedModelObj = getModelById(selectedModel);
  const selectedModelName = selectedModelObj?.name || selectedModel;
  const hasApiKey = Boolean(currentApiKey);

  return (
    <DropdownMenu onOpenChange={() => setIsOpen(true)}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="w-fit justify-between text-left font-normal cursor-pointer"
        >
          <div className="flex items-center gap-2">
            {getModelIcon(selectedModel)}
            <div className="flex items-center justify-between w-full">
              <span className="truncate">{selectedModelName}</span>
            </div>
            <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-96 p-4" align="start">
        <div className="space-y-4">
          <div className="space-y-2">
            <form onSubmit={handleSaveApiKey} className="flex flex-col gap-2">
              <Input
                type="text"
                placeholder="Add OpenRouter API Key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="h-9 px-2 -mt-0.5 bg-transparent text-white placeholder:text-white/50 text-lg font-normal  border border-zinc-700 shadow-2xl w-full outline-none rounded-md"
                autoComplete="off"
                disabled={isSaving}
              />
              <div className="w-fit flex gap-2">
                <Button
                  type="submit"
                  size="sm"
                  className="whitespace-nowrap h-9 w-fit"
                  disabled={!apiKey.trim() || isSaving}
                >
                  {isSaving ? "Saving..." : "Save"}
                </Button>
                {hasApiKey && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="whitespace-nowrap w-fit h-9 disabled:cursor-not-allowed"
                    onClick={handleRemoveApiKey}
                    disabled={isSaving || !hasApiKey}
                  >
                    Remove Key
                  </Button>
                )}
              </div>
            </form>
            <p className="text-xs text-muted-foreground">
              {hasApiKey
                ? "Your API key is stored locally in your browser"
                : "Add your API key to access all models"}
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          <div className="max-h-96 overflow-y-auto pr-4">
            {!hasApiKey && (
              <div className="mb-2">
                <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-yellow-500 bg-yellow-500/10 rounded-md">
                  <AlertCircle className="h-4 w-4" />
                  <span>Using free models. Add API key for full access.</span>
                </div>
              </div>
            )}

            {hasApiKey && Object.keys(groupedPremiumModels).length > 0 && (
              <div className="mb-2">
                <div className="flex items-center gap-2 py-4 text-xs font-medium text-muted-foreground">
                  <span className="text-emerald-500 text-sm">Premium Models</span>
                  <div className="h-px flex-1 bg-border" />
                </div>
                {Object.entries(groupedPremiumModels).map(([provider, providerModels]) => (
                  <div key={provider} className="mb-2">
                    <DropdownMenuLabel className="px-0 py-1 text-xs font-medium text-muted-foreground">
                      {provider}
                    </DropdownMenuLabel>
                    <div className="space-y-1">
                      {(providerModels as OpenRouterModel[]).map((model) => (
                        <DropdownMenuItem
                          key={model.id}
                          className={cn(
                            "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm",
                            selectedModel === model.id && "bg-accent"
                          )}
                          onSelect={() => onModelSelect(model.id)}
                        >
                          {getModelIcon(model.id)}
                          <span className="truncate">
                            {model.name}
                            {!hasApiKey && !isFreeModel(model.id) && (
                              <span className="ml-2 text-xs text-yellow-500">
                                (API key required)
                              </span>
                            )}
                          </span>
                        </DropdownMenuItem>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4">
              <div className="flex items-center gap-2 py-4 text-xs font-medium text-muted-foreground">
                <span className="text-emerald-500 text-sm">Free Models</span>
                <div className="h-px flex-1 bg-border" />
              </div>
              {isLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                Object.entries(groupedFreeModels).map(([provider, providerModels]) => (
                  <div key={provider} className="mb-2">
                    <DropdownMenuLabel className="px-0 py-1 text-xs font-medium text-muted-foreground">
                      {provider}
                    </DropdownMenuLabel>
                    <div className="space-y-1">
                      {(providerModels as OpenRouterModel[]).map((model) => (
                        <DropdownMenuItem
                          key={model.id}
                          className={cn(
                            "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm",
                            selectedModel === model.id && "bg-accent"
                          )}
                          onSelect={() => onModelSelect(model.id)}
                        >
                          {getModelIcon(model.id)}
                          <span className="truncate">
                            {model.name}
                            
                            {!hasApiKey && !isFreeModel(model.id) && (
                              <span className="ml-2 text-xs text-yellow-500">
                                (API key required)
                              </span>
                            )}
                          </span>
                          <div className="ml-auto">
                            {selectedModelObj && <ModelCapabilities model={selectedModelObj} />}
                          </div>
                        </DropdownMenuItem>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
