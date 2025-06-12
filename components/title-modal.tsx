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

interface TitleModalProps {
  isEditing: boolean;
  setIsEditing: (value: boolean) => void;
  newTitle: string;
  setNewTitle: (value: string) => void;
  handleSave: () => void;
  disabled: boolean;
}

const TitleModal = ({
  isEditing,
  setIsEditing,
  newTitle,
  setNewTitle,
  handleSave,
  disabled,
}: TitleModalProps) => {
  return (
    <Dialog open={isEditing} onOpenChange={setIsEditing}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Chat Title</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center gap-2">
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              placeholder="Enter chat title"
              className="flex-1"
              autoFocus
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsEditing(false)}
              disabled={disabled}
            >
              <X className="h-4 w-4 cursor-pointer" />
            </Button>
            <Button
              onClick={handleSave}
              disabled={!newTitle.trim() || disabled}
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

export default TitleModal;
