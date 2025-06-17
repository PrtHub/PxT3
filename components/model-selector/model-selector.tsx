"use client"

import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import { AlertCircle, ChevronDown, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { fetchModels, OpenRouterModel } from "@/lib/api";
import { freeModels, imageModels } from "@/constants/models";
import { useSettingsStore } from "@/modules/chat/store/settings-store";
import { ModelList } from "./model-list";
import getModelIcon from "./model-icons";
import { ApiKeyDialog } from "@/components/api-key-dialog";
import { useRouter } from "next/navigation";
import { useInitialMessageStore } from "@/modules/chat/store/initial-message-store";

interface ModelSelectorProps {
  selectedModel: string;
  onModelSelect: (model: string) => void;
  onApiKeyChange: (key: string) => void;
  currentApiKey?: string | null;
  geminiApiKey?: string | null;
  onGeminiApiKeyChange?: (key: string) => void;
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

const groupModelsByProvider = (models: OpenRouterModel[]) => {
  const groups: Record<string, OpenRouterModel[]> = {};

  models.forEach((model) => {
    const provider = getProviderFromModelId(model.id);
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
  geminiApiKey,
  onGeminiApiKeyChange,
}: ModelSelectorProps) {
  const session = useSession();
  const router = useRouter();
  const [models, setModels] = useState<OpenRouterModel[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isApiKeyDialogOpen, setIsApiKeyDialogOpen] = useState(false);
  const [, setApiKey] = useState(currentApiKey || "");

  const [isGeminiDialogOpen, setIsGeminiDialogOpen] = useState(false);
  const [pendingModel, setPendingModel] = useState<string | null>(null);

  const { setAvailableModels, availableModels } = useSettingsStore();
  const { initialModel } = useInitialMessageStore();

  const defaultModels = useMemo(() => {
    return freeModels.data.map((model) => ({
    ...model,
    description: model.description || "Free model",
    pricing: model.pricing || {
      prompt: "0",
      completion: "0",
    },
    context_length: model.context_length || 4096,
    architecture: {
      ...model.architecture,
      input_modalities: model.architecture?.input_modalities || ["text"],
      output_modalities: model.architecture?.output_modalities || ["text"],
    },
    supported_parameters: model.supported_parameters || [],
    top_provider: model.top_provider || { is_moderated: true },
    per_request_limits: model.per_request_limits || {},
  }));
}, []);

  const imageModel = useMemo(() => {
    return imageModels.data.map((model) => ({
    ...model,
    description: model.description || "Free model",
    pricing: model.pricing || {
      prompt: "0",
      completion: "0",
    },
    context_length: model.context_length || 4096,
    architecture: {
      ...model.architecture,
      input_modalities: model.architecture?.input_modalities || ["text"],
      output_modalities: model.architecture?.output_modalities || ["image"],
    },
    supported_parameters: model.supported_parameters || [],
    top_provider: model.top_provider || { is_moderated: true },
    per_request_limits: model.per_request_limits || {},
  }));
}, []);

  useEffect(() => {
    if (!currentApiKey) {
      setAvailableModels([...defaultModels, ...imageModel]);
    }
  }, [currentApiKey, defaultModels, imageModel, setAvailableModels]);

  useEffect(() => {
    const loadModels = async () => {
      if (!currentApiKey) return;

      setError(null);
      try {
        const fetchedModels = await fetchModels(currentApiKey);
        setModels(fetchedModels);
        setAvailableModels([...defaultModels, ...fetchedModels, ...imageModel]);
      } catch (err) {
        console.error("Failed to load models:", err);
        setError(
          "Failed to load models. Please check your API key and try again."
        );
      }
    };

    if (isOpen) {
      loadModels();
    }
  }, [currentApiKey, isOpen, defaultModels, imageModel, setAvailableModels]);

  useEffect(() => {
    if (!selectedModel) {
      onModelSelect(defaultModels[0].id);
    }
  }, [selectedModel, defaultModels, onModelSelect]);

  const handleSaveApiKey = (key: string) => {
    setApiKey(key);
    onApiKeyChange(key);
    console.log("API Key saved!");
  };

  const handleRemoveApiKey = () => {
    setApiKey("");
    onApiKeyChange("");
    if (defaultModels.length > 0) {
      onModelSelect(defaultModels[0].id);
    }
    console.log("API key removed");
  };

  const handleGeminiKeySave = (key: string) => {
    if (onGeminiApiKeyChange) {
      onGeminiApiKeyChange(key);
      if (pendingModel) {
        onModelSelect(pendingModel);
        setPendingModel(null);
      }
    }
  };

  const handleGeminiKeyRemove = () => {
    if (onGeminiApiKeyChange) {
      onGeminiApiKeyChange("");
    }
  };

  const isFreeModel = (modelId: string) => {
    return defaultModels.some((m) => m.id === modelId);
  };

  const getModelsByType = () => {
    const free = defaultModels;
    const premium = models.filter((m) => !isFreeModel(m.id));
    const image = imageModel;
    return {
      free: groupModelsByProvider(free),
      premium: groupModelsByProvider(premium),
      image: groupModelsByProvider(image),
    };
  };

  const {
    free: groupedFreeModels,
    premium: groupedPremiumModels,
    image: groupedImageModels,
  } = getModelsByType();

  const getModelById = (modelId: string): OpenRouterModel | undefined => {
    const modelFromApi = availableModels.find((m) => m.id === modelId);
    if (modelFromApi) return modelFromApi;
    const defaultModel = defaultModels.find((m) => m.id === modelId);
    if (defaultModel) return defaultModel;
    return imageModel.find((m) => m.id === modelId);
  };  

  const selectedModelObj = getModelById(selectedModel);
  const selectedModelName = selectedModelObj?.name || selectedModel;
  const hasApiKey = Boolean(currentApiKey);

  const handleApiKeyButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!session.data?.user) {
      router.push("/auth");
      return;
    }
    setIsApiKeyDialogOpen(true);
  };

  return (
    <div className="relative">
      {session.data?.user && (
      <ApiKeyDialog
        isOpen={isApiKeyDialogOpen}
        onOpenChange={setIsApiKeyDialogOpen}
        apiKey={currentApiKey || ""}
        onSave={handleSaveApiKey}
        onRemove={handleRemoveApiKey}
        apiName="OpenRouter"
        apiDocsUrl="https://openrouter.ai/keys"
        inputPlaceholder="sk-or-v1-..."
      />
      )}
      {session.data?.user && (
      <ApiKeyDialog
        isOpen={isGeminiDialogOpen}
        onOpenChange={(open) => {
          setIsGeminiDialogOpen(open);
          if (!open) setPendingModel(null);
        }}
        apiKey={geminiApiKey || ""}
        onSave={handleGeminiKeySave}
        onRemove={handleGeminiKeyRemove}
        apiType="gemini"
        apiName="Google Gemini"
        apiDocsUrl="https://aistudio.google.com/app/apikey"
        inputPlaceholder="AIzaSy..."
      />
      )}
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
        <DropdownMenuContent className="w-[450px] p-4" align="start">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h1 className="font-medium">Available Models</h1>
              <Button
                variant="outline"
                size="sm"
                onClick={handleApiKeyButtonClick}
                className="text-xs h-7 gap-1.5"
              >
                <Key className="h-3.5 w-3.5" />
                {currentApiKey ? "Manage Key" : "Add API Key"}
              </Button>
            </div>
            <div className="space-y-2">
              {!currentApiKey && (
                <div className="p-3 bg-muted/30 rounded-md text-sm text-muted-foreground">
                  <p className="mb-2">
                    Some models require an OpenRouter API key. Add your key to
                    access all available models.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleApiKeyButtonClick}
                    className="w-full"
                  >
                    Add OpenRouter API Key
                  </Button>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                {hasApiKey
                  ? "Your API key is stored locally in your browser"
                  : ""}
              </p>
              {error && (
                <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="max-h-96 overflow-y-auto pr-4">
                {hasApiKey && Object.keys(groupedPremiumModels).length > 0 && (
                  <ModelList
                    title="Premium Models"
                    models={groupedPremiumModels}
                    selectedModel={selectedModel ?? initialModel}
                    hasApiKey={hasApiKey}
                    getModelIcon={getModelIcon}
                    isFreeModel={isFreeModel}
                    onModelSelect={onModelSelect}
                  />
                )}

                <ModelList
                  title="Free Models"
                  models={groupedFreeModels}
                  selectedModel={selectedModel ?? initialModel}
                  hasApiKey={hasApiKey}
                  isFree={true}
                  getModelIcon={getModelIcon}
                  isFreeModel={isFreeModel}
                  onModelSelect={onModelSelect}
                />

                <ModelList
                  title="Image Gen"
                  models={groupedImageModels}
                  selectedModel={selectedModel}
                  hasApiKey={!!geminiApiKey}
                  getModelIcon={getModelIcon}
                  isFreeModel={isFreeModel}
                  onModelSelect={onModelSelect}
                  onApiKeyClick={() => setIsGeminiDialogOpen(true)}
                />
              </div>
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
