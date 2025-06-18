"use client";

import {
  ImageKitAbortError,
  ImageKitInvalidRequestError,
  ImageKitServerError,
  ImageKitUploadNetworkError,
  upload,
} from "@imagekit/next";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Paperclip, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { useSession } from "next-auth/react";
import { Attachment } from "@/modules/chat/types";

const MAX_FILE_SIZE_MB = 5;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_ATTACHMENTS = 2;

interface FileUploadProps {
  onUploadSuccess?: (response: Attachment) => void;
  onUploadError?: (error: unknown) => void;
  disabled?: boolean;
  currentAttachments?: number;
}

const FileUploadComponent = ({
  onUploadSuccess,
  onUploadError,
  disabled,
  currentAttachments = 0,
}: FileUploadProps) => {
  const session = useSession();

  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortController = new AbortController();

  const authenticator = async () => {
    try {
      const response = await fetch("/api/upload-auth");
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Request failed with status ${response.status}: ${errorText}`
        );
      }

      const data = await response.json();
      const { signature, expire, token, publicKey } = data;
      return { signature, expire, token, publicKey };
    } catch (error) {
      console.error("Authentication error:", error);
      throw new Error("Authentication request failed");
    }
  };

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      return `File size must be less than ${MAX_FILE_SIZE_MB}MB`;
    }
    if (file.type.startsWith("image/")) {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        return `Only ${ALLOWED_IMAGE_TYPES.join(", ")} formats are allowed`;
      }
    }

    if (currentAttachments >= MAX_ATTACHMENTS) {
      return `Maximum ${MAX_ATTACHMENTS} files allowed`;
    }

    return null;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const error = validateFile(file);
      if (error) {
        console.error(error);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      console.error("Please select a file first");
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      const authParams = await authenticator();
      const { signature, expire, token, publicKey } = authParams;

      const uploadResponse = await upload({
        expire,
        token,
        signature,
        publicKey,
        file: selectedFile,
        fileName: selectedFile.name,
        folder: "/chat-attachments",
        tags: ["chat", "attachment"],
        onProgress: (event) => {
          setProgress((event.loaded / event.total) * 100);
        },
        abortSignal: abortController.signal,
      });

      console.log("File uploaded successfully");
      onUploadSuccess?.(uploadResponse);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Upload error:", error);

      if (error instanceof ImageKitAbortError) {
        console.error("Upload was cancelled");
      } else if (error instanceof ImageKitInvalidRequestError) {
        console.error("Invalid file or request");
      } else if (error instanceof ImageKitUploadNetworkError) {
        console.error("Network error occurred");
      } else if (error instanceof ImageKitServerError) {
        console.error("Server error occurred");
      }

      onUploadError?.(error);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="relative">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
        className="hidden"
        disabled={disabled || uploading}
      />

      {!selectedFile ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className={cn(
            "cursor-pointer", 
            session.status !== "authenticated" && "cursor-not-allowed"
          )}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || uploading || session.status !== "authenticated"}
                className={cn(
                  "h-7 px-1 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800/50 cursor-pointer",
                  session.status !== "authenticated" && "opacity-70 cursor-not-allowed"
                )}
              >
                {uploading ? (
                  <div className="h-3.5 w-3.5 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Paperclip className="h-3.5 w-3.5 mr-0.5" />
                )}
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>Upload file</p>
          </TooltipContent>
        </Tooltip>
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-400 truncate max-w-[100px]">
            {selectedFile.name}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleUpload}
            disabled={uploading}
            className="h-7 px-1 text-xs text-emerald-400 hover:text-emerald-300"
          >
            Upload
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            disabled={uploading}
            className="h-7 px-1 text-xs text-zinc-400 hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {uploading && (
        <div className="absolute bottom-full left-0 right-0 bg-zinc-800/50 rounded-md p-2 mb-2">
          <div className="h-1 bg-zinc-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-400 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUploadComponent;
