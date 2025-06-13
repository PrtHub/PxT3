"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, Check } from "lucide-react";

interface DialogModalProps {
  isSaving: boolean;
  setIsSaving?: (value: boolean) => void;
  newValue?: string;
  setNewValue?: (value: string) => void;
  handleSave: () => void;
  disabled: boolean;
  title: string;
}

const DialogModal = ({
  isSaving,
  setIsSaving,
  newValue,
  setNewValue,
  handleSave,
  disabled,
  title,
}: DialogModalProps) => {
  return (
    <Dialog open={isSaving} onOpenChange={setIsSaving}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center gap-2">
            <Input
              value={newValue || ""}
              onChange={(e) => setNewValue?.(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              placeholder="Enter chat title"
              className="flex-1"
              autoFocus
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsSaving?.(false)}
              disabled={disabled}
            >
              <X className="h-4 w-4 cursor-pointer" />
            </Button>
            <Button
              onClick={handleSave}
              disabled={!newValue?.trim() || disabled}
              className="cursor-pointer disabled:cursor-not-allowed bg-button hover:bg-button/80 transition-all "
            >
              <Check className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DialogModal;
