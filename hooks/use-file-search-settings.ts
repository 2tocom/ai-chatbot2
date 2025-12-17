"use client";

import { useCallback, useEffect, useState } from "react";

export type FileSearchSettings = {
  fileSearchStoreNames: string[];
  fileSearchTopK: number | null;
  selectedStore: string | null;
};

const STORAGE_KEY = "file-search-settings";

const defaultSettings: FileSearchSettings = {
  fileSearchStoreNames: [],
  fileSearchTopK: null,
  selectedStore: null,
};

function getStoredSettings(): FileSearchSettings {
  if (typeof window === "undefined") {
    return defaultSettings;
  }
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...defaultSettings, ...JSON.parse(stored) };
    }
  } catch {
    // Ignore parse errors
  }
  return defaultSettings;
}

function saveSettings(settings: FileSearchSettings): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Ignore storage errors
  }
}

export function useFileSearchSettings() {
  const [settings, setSettings] = useState<FileSearchSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  // Load settings from localStorage on mount
  useEffect(() => {
    setSettings(getStoredSettings());
    setIsLoading(false);
  }, []);

  const updateSettings = useCallback(
    (newSettings: Partial<FileSearchSettings>) => {
      setSettings((prev) => {
        const updated = { ...prev, ...newSettings };
        saveSettings(updated);
        return updated;
      });
    },
    []
  );

  const addStore = useCallback(
    (name: string) => {
      if (!name.trim()) {
        return;
      }
      const trimmedName = name.trim();
      const currentStores = settings.fileSearchStoreNames;

      // Don't add duplicates
      if (currentStores.includes(trimmedName)) {
        return;
      }

      updateSettings({ fileSearchStoreNames: [...currentStores, trimmedName] });
    },
    [settings.fileSearchStoreNames, updateSettings]
  );

  const removeStore = useCallback(
    (name: string) => {
      const currentStores = settings.fileSearchStoreNames;
      const updated = currentStores.filter((n) => n !== name);

      // If removing the selected store, clear selection
      const newSelectedStore =
        settings.selectedStore === name ? null : settings.selectedStore;

      updateSettings({
        fileSearchStoreNames: updated,
        selectedStore: newSelectedStore,
      });
    },
    [settings.fileSearchStoreNames, settings.selectedStore, updateSettings]
  );

  const selectStore = useCallback(
    (name: string | null) => {
      // Allow selecting any store name (from Gemini API)
      updateSettings({ selectedStore: name });
    },
    [updateSettings]
  );

  const mutate = useCallback(() => {
    setSettings(getStoredSettings());
  }, []);

  return {
    settings,
    isLoading,
    error: null,
    updateSettings,
    addStore,
    removeStore,
    selectStore,
    mutate,
  };
}
