"use client";

import { CheckIcon, Loader2, Settings } from "lucide-react";
import { memo, useCallback, useEffect, useState } from "react";
import { useFileSearchSettings } from "@/hooks/use-file-search-settings";
import type { FileSearchStore } from "@/lib/file-search/types";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

type StoreSelectorProps = {
  onManageClick?: () => void;
};

function PureStoreSelector({ onManageClick }: StoreSelectorProps) {
  const {
    settings,
    isLoading: settingsLoading,
    selectStore,
  } = useFileSearchSettings();
  const [open, setOpen] = useState(false);
  const [stores, setStores] = useState<FileSearchStore[]>([]);
  const [isLoadingStores, setIsLoadingStores] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedStore = settings.selectedStore;
  const isActive = !!selectedStore;

  // Fetch stores from Gemini API when dropdown opens
  const fetchStores = useCallback(async () => {
    setIsLoadingStores(true);
    setError(null);
    try {
      const response = await fetch("/api/file-search/stores");
      if (!response.ok) {
        throw new Error("Failed to fetch stores");
      }
      const data = await response.json();
      setStores(data.fileSearchStores || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load stores");
      setStores([]);
    } finally {
      setIsLoadingStores(false);
    }
  }, []);

  // Fetch stores when dropdown opens
  useEffect(() => {
    if (open) {
      fetchStores();
    }
  }, [open, fetchStores]);

  const handleSelect = (storeName: string) => {
    if (selectedStore === storeName) {
      selectStore(null);
    } else {
      selectStore(storeName);
    }
    setOpen(false);
  };

  const handleManageClick = () => {
    setOpen(false);
    onManageClick?.();
  };

  if (settingsLoading) {
    return null;
  }

  // Find selected store display name
  const selectedStoreData = stores.find((s) => s.name === selectedStore);
  const displayName = selectedStoreData?.displayName || selectedStore;

  const buttonContent = (
    <Button
      className={cn(
        "h-8 gap-1.5 px-3 font-medium text-xs transition-colors",
        isActive && "text-primary"
      )}
      variant="ghost"
    >
      <span className={cn(isActive && "text-primary")}>FileSearch</span>
      {isActive && (
        <>
          <span className="text-muted-foreground">:</span>
          <span className="max-w-[80px] truncate">{displayName}</span>
        </>
      )}
    </Button>
  );

  return (
    <DropdownMenu onOpenChange={setOpen} open={open}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>{buttonContent}</DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              {isActive
                ? `File Search: ${displayName}`
                : "Select a store for file search"}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <DropdownMenuContent align="start" className="w-[220px]">
        <DropdownMenuLabel className="text-muted-foreground text-xs">
          Select Store
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {isLoadingStores ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="px-2 py-3 text-center">
            <p className="text-destructive text-xs">{error}</p>
            <Button
              className="mt-2 h-7 text-xs"
              onClick={fetchStores}
              size="sm"
              variant="outline"
            >
              Retry
            </Button>
          </div>
        ) : stores.length === 0 ? (
          <div className="px-2 py-3 text-center text-muted-foreground text-xs">
            No stores available.
            <br />
            Create one in Manage Stores.
          </div>
        ) : (
          stores.map((store) => (
            <DropdownMenuItem
              className="cursor-pointer justify-between"
              key={store.name}
              onClick={() => handleSelect(store.name)}
            >
              <span className="truncate">
                {store.displayName || store.name}
              </span>
              {selectedStore === store.name && <CheckIcon className="size-4" />}
            </DropdownMenuItem>
          ))
        )}

        {isActive && !isLoadingStores && stores.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer text-muted-foreground"
              onClick={() => {
                selectStore(null);
                setOpen(false);
              }}
            >
              Clear selection
            </DropdownMenuItem>
          </>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer gap-2"
          onClick={handleManageClick}
        >
          <Settings className="size-4" />
          <span>Manage Stores</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export const StoreSelector = memo(PureStoreSelector);

// Keep backward compatibility
export const StoreSelectorCompact = StoreSelector;
