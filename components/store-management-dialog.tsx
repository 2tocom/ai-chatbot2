"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useFileSearchSettings } from "@/hooks/use-file-search-settings";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { ScrollArea } from "./ui/scroll-area";

type StoreManagementDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function StoreManagementDialog({
  open,
  onOpenChange,
}: StoreManagementDialogProps) {
  const { settings, isLoading, addStore, removeStore } =
    useFileSearchSettings();
  const [newStoreName, setNewStoreName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const stores = settings.fileSearchStoreNames ?? [];

  const handleAddStore = async () => {
    const trimmed = newStoreName.trim();
    if (!trimmed) {
      setError("Store name cannot be empty");
      return;
    }
    if (stores.includes(trimmed)) {
      setError("Store already exists");
      return;
    }
    setError(null);
    await addStore(trimmed);
    setNewStoreName("");
  };

  const handleRemoveStore = async (name: string) => {
    await removeStore(name);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddStore();
    }
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Stores</DialogTitle>
          <DialogDescription>
            Add or remove vector stores for file search.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-store">Add Store</Label>
            <div className="flex gap-2">
              <Input
                className="flex-1"
                disabled={isLoading}
                id="new-store"
                onChange={(e) => {
                  setNewStoreName(e.target.value);
                  setError(null);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Enter store name..."
                value={newStoreName}
              />
              <Button
                disabled={isLoading || !newStoreName.trim()}
                onClick={handleAddStore}
                size="icon"
                variant="outline"
              >
                <Plus className="size-4" />
              </Button>
            </div>
            {error && <p className="text-destructive text-xs">{error}</p>}
          </div>
          <div className="space-y-2">
            <Label>Configured Stores</Label>
            {stores.length === 0 ? (
              <p className="py-4 text-center text-muted-foreground text-sm">
                No stores configured yet.
              </p>
            ) : (
              <ScrollArea className="h-[200px] rounded-md border">
                <div className="space-y-1 p-2">
                  {stores.map((store) => (
                    <div
                      className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted"
                      key={store}
                    >
                      <span className="truncate text-sm">{store}</span>
                      <Button
                        className="size-7 text-muted-foreground hover:text-destructive"
                        onClick={() => handleRemoveStore(store)}
                        size="icon"
                        variant="ghost"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
          <p className="text-muted-foreground text-xs">
            Store names should match your Google AI vector store names.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
