"use client";

import { useState } from "react";
import { useFileSearchSettings } from "@/hooks/use-file-search-settings";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  CrossSmallIcon,
  PlusIcon,
} from "./icons";
import { Button } from "./ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export function FileSearchSettings() {
  const { settings, isLoading, updateSettings } = useFileSearchSettings();
  const [isOpen, setIsOpen] = useState(false);
  const [newStoreName, setNewStoreName] = useState("");
  const [topKInput, setTopKInput] = useState("");

  const handleAddStore = () => {
    if (!newStoreName.trim()) {
      return;
    }
    const updated = [
      ...(settings.fileSearchStoreNames || []),
      newStoreName.trim(),
    ];
    updateSettings({ fileSearchStoreNames: updated });
    setNewStoreName("");
  };

  const handleTopKChange = () => {
    const value = topKInput.trim();
    if (!value) {
      updateSettings({ fileSearchTopK: null });
      return;
    }
    const parsed = Number.parseInt(value, 10);
    if (!Number.isNaN(parsed) && parsed > 0) {
      updateSettings({ fileSearchTopK: parsed });
    }
  };

  if (isLoading) {
    return null;
  }

  return (
    <Collapsible className="px-2 py-1" onOpenChange={setIsOpen} open={isOpen}>
      <CollapsibleTrigger className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted">
        {isOpen ? (
          <ChevronDownIcon size={16} />
        ) : (
          <ChevronRightIcon size={16} />
        )}
        <span>File Search Settings</span>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-3 px-2 pt-2">
        <div className="space-y-2">
          <Label className="text-muted-foreground text-xs">Store Names</Label>
          <div className="space-y-1">
            {settings.fileSearchStoreNames?.map((name) => (
              <div className="flex items-center gap-1" key={`store-${name}`}>
                <span className="flex-1 truncate rounded bg-muted px-2 py-1 text-xs">
                  {name}
                </span>
                <Button
                  className="h-6 w-6 p-0"
                  onClick={() => {
                    const updated =
                      settings.fileSearchStoreNames?.filter(
                        (n) => n !== name
                      ) || [];
                    updateSettings({ fileSearchStoreNames: updated });
                  }}
                  size="sm"
                  variant="ghost"
                >
                  <CrossSmallIcon size={12} />
                </Button>
              </div>
            ))}
          </div>
          <div className="flex gap-1">
            <Input
              className="h-7 text-xs"
              onChange={(e) => setNewStoreName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddStore()}
              placeholder="Add store name..."
              value={newStoreName}
            />
            <Button
              className="h-7 px-2"
              onClick={handleAddStore}
              size="sm"
              variant="ghost"
            >
              <PlusIcon size={12} />
            </Button>
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-muted-foreground text-xs">Top K Results</Label>
          <Input
            className="h-7 text-xs"
            min={1}
            onBlur={handleTopKChange}
            onChange={(e) => setTopKInput(e.target.value)}
            placeholder={String(settings.fileSearchTopK || "Default")}
            type="number"
            value={topKInput}
          />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
