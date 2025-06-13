"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Key, Info, ExternalLink } from "lucide-react";

type ApiType = 'openrouter' | 'gemini';

interface ApiKeyDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  apiKey: string;
  onSave: (key: string) => void;
  onRemove: () => void;
  apiType?: ApiType;
  apiName?: string;
  apiDocsUrl?: string;
  inputPlaceholder?: string;
}

export function ApiKeyDialog({
  isOpen,
  onOpenChange,
  apiKey,
  onSave,
  onRemove,
  apiType = 'openrouter' as const,
  apiName = apiType === 'gemini' ? 'Google Gemini' : 'OpenRouter',
  apiDocsUrl = apiType === 'gemini' 
    ? 'https://aistudio.google.com/app/apikey' 
    : 'https://openrouter.ai/keys',
  inputPlaceholder = apiType === 'gemini' 
    ? 'AIzaSy...' 
    : 'sk-or-v1-...'
}: ApiKeyDialogProps) {
  const [isEditing, setIsEditing] = useState(!apiKey);
  const [localKey, setLocalKey] = useState(apiKey);

  const displayName = apiType === 'gemini' ? 'Google Gemini' : (apiName || 'API');
  const isGemini = apiType === 'gemini';
  
  useEffect(() => {
    if (isOpen) {
      setLocalKey(apiKey);
      setIsEditing(!apiKey);
    }
  }, [isOpen, apiKey]);

  const handleSave = () => {
    if (localKey.trim()) {
      onSave(localKey.trim());
      onOpenChange(false);
    }
  };

  const handleRemove = () => {
    onRemove();
    onOpenChange(false);
  };

  const handleCancel = () => {
    if (apiKey && isEditing) {
      setIsEditing(false);
      setLocalKey(apiKey)
    } else {
      onOpenChange(false);
    }
  };



  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            {displayName} API Key
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {apiKey 
              ? `Manage your ${displayName} API key` 
              : `Add your ${displayName} API key to use ${isGemini ? 'Gemini image generation' : 'premium models'}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {apiKey && !isEditing ? (
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
              <div className="flex-1 truncate font-mono text-sm">
                {localKey ? '•'.repeat(12) + localKey.slice(-4) : 'No key set'}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="ml-2"
              >
                Change
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <label htmlFor="api-key" className="text-sm font-medium">
                {displayName} API Key
              </label>
              <div className="relative">
                <Input
                  id="api-key"
                  type={'text'}
                  placeholder={inputPlaceholder}
                  value={localKey}
                  onChange={(e) => setLocalKey(e.target.value)}
                  className="font-mono pr-10"
                />
              </div>
            </div>
          )}

          <div className="rounded-md bg-muted/30 p-3 text-sm">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
              <div>
                <p className="font-medium">Your API key is stored locally</p>
                <p className="text-muted-foreground text-xs">
                  We never store your API key on our servers. It&apos;s only used to make requests to {displayName}.
                </p>
                <a
                  href={apiDocsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center mt-1 text-xs text-blue-500 hover:underline"
                >
                  Get your {displayName} API key
                  <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="sm:justify-between">
          {apiKey && !isEditing ? (
            <Button
              variant="destructive"
              onClick={handleRemove}
              className="mr-auto"
            >
              Remove Key
            </Button>
          ) : (
            <div className="mr-auto" />
          )}
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="cursor-pointer"
            >
              {apiKey && isEditing ? 'Cancel' : 'Close'}
            </Button>
            
            {(!apiKey || isEditing) && (
              <Button 
                onClick={handleSave} 
                disabled={!localKey.trim()}
              >
                {apiKey ? 'Update' : 'Save'} Key
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
