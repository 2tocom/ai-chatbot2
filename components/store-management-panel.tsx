"use client";

import {
  ChevronRight,
  FileText,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
  Upload,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type {
  FileSearchDocument,
  FileSearchStore,
} from "@/lib/file-search/types";
import { formatBytes, getTotalDocumentCount } from "@/lib/file-search/types";
import { cn } from "@/lib/utils";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";

type StoreManagementPanelProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type ViewMode = "stores" | "documents";

export function StoreManagementPanel({
  open,
  onOpenChange,
}: StoreManagementPanelProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("stores");
  const [selectedStore, setSelectedStore] = useState<FileSearchStore | null>(
    null
  );

  // Stores state
  const [stores, setStores] = useState<FileSearchStore[]>([]);
  const [isLoadingStores, setIsLoadingStores] = useState(false);
  const [storesError, setStoresError] = useState<string | null>(null);

  // Documents state
  const [documents, setDocuments] = useState<FileSearchDocument[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [docsError, setDocsError] = useState<string | null>(null);
  const [docsNextPageToken, setDocsNextPageToken] = useState<string | null>(
    null
  );

  // Create store state
  const [newStoreName, setNewStoreName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Delete state
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Fetch stores
  const fetchStores = useCallback(async () => {
    setIsLoadingStores(true);
    setStoresError(null);
    try {
      const response = await fetch("/api/file-search/stores");
      if (!response.ok) {
        throw new Error("Failed to fetch stores");
      }
      const data = await response.json();
      setStores(data.fileSearchStores || []);
    } catch (err) {
      setStoresError(
        err instanceof Error ? err.message : "Failed to load stores"
      );
    } finally {
      setIsLoadingStores(false);
    }
  }, []);

  // Fetch documents for a store
  const fetchDocuments = useCallback(
    async (storeName: string, pageToken?: string) => {
      setIsLoadingDocs(true);
      setDocsError(null);
      try {
        const storeId = storeName.replace("fileSearchStores/", "");
        const params = new URLSearchParams();
        if (pageToken) {
          params.set("pageToken", pageToken);
        }
        const response = await fetch(
          `/api/file-search/stores/${storeId}/documents?${params}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch documents");
        }
        const data = await response.json();
        if (pageToken) {
          setDocuments((prev) => [...prev, ...(data.documents || [])]);
        } else {
          setDocuments(data.documents || []);
        }
        setDocsNextPageToken(data.nextPageToken || null);
      } catch (err) {
        setDocsError(
          err instanceof Error ? err.message : "Failed to load documents"
        );
      } finally {
        setIsLoadingDocs(false);
      }
    },
    []
  );

  // Load stores when panel opens
  useEffect(() => {
    if (open && viewMode === "stores") {
      fetchStores();
    }
  }, [open, viewMode, fetchStores]);

  // Load documents when viewing a store
  useEffect(() => {
    if (viewMode === "documents" && selectedStore) {
      fetchDocuments(selectedStore.name);
    }
  }, [viewMode, selectedStore, fetchDocuments]);

  // Reset state when closing
  useEffect(() => {
    if (!open) {
      setViewMode("stores");
      setSelectedStore(null);
      setDocuments([]);
      setNewStoreName("");
      setCreateError(null);
      setDeleteConfirm(null);
    }
  }, [open]);

  // Create store
  const handleCreateStore = async () => {
    const trimmed = newStoreName.trim();
    if (!trimmed) {
      setCreateError("Store name cannot be empty");
      return;
    }
    setIsCreating(true);
    setCreateError(null);
    try {
      const response = await fetch("/api/file-search/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: trimmed }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create store");
      }
      setNewStoreName("");
      fetchStores();
    } catch (err) {
      setCreateError(
        err instanceof Error ? err.message : "Failed to create store"
      );
    } finally {
      setIsCreating(false);
    }
  };

  // Delete store
  const handleDeleteStore = async (store: FileSearchStore) => {
    if (deleteConfirm !== store.name) {
      setDeleteConfirm(store.name);
      return;
    }
    setDeletingId(store.name);
    try {
      const storeId = store.name.replace("fileSearchStores/", "");
      const response = await fetch(`/api/file-search/stores/${storeId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete store");
      }
      setDeleteConfirm(null);
      fetchStores();
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setDeletingId(null);
    }
  };

  // Delete document
  const handleDeleteDocument = async (doc: FileSearchDocument) => {
    if (deleteConfirm !== doc.name) {
      setDeleteConfirm(doc.name);
      return;
    }
    if (!selectedStore) {
      return;
    }
    setDeletingId(doc.name);
    try {
      const storeId = selectedStore.name.replace("fileSearchStores/", "");
      const response = await fetch(
        `/api/file-search/stores/${storeId}/documents?documentName=${encodeURIComponent(doc.name)}`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        throw new Error("Failed to delete document");
      }
      setDeleteConfirm(null);
      fetchDocuments(selectedStore.name);
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setDeletingId(null);
    }
  };

  // Upload file
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedStore) {
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("storeName", selectedStore.name);
      formData.append("displayName", file.name);

      const response = await fetch("/api/file-search/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Upload failed");
      }

      const operation = await response.json();

      // Poll for completion
      await pollOperation(operation.name);

      // Refresh documents
      fetchDocuments(selectedStore.name);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  // Poll operation status
  const pollOperation = async (operationName: string) => {
    const maxAttempts = 60;
    for (let i = 0; i < maxAttempts; i++) {
      const response = await fetch(
        `/api/file-search/upload?operationName=${encodeURIComponent(operationName)}`
      );
      if (!response.ok) {
        throw new Error("Failed to check upload status");
      }
      const operation = await response.json();
      if (operation.done) {
        if (operation.error) {
          throw new Error(operation.error.message || "Upload failed");
        }
        return operation;
      }
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
    throw new Error("Upload timed out");
  };

  // Navigate to documents view
  const handleViewDocuments = (store: FileSearchStore) => {
    setSelectedStore(store);
    setViewMode("documents");
    setDeleteConfirm(null);
  };

  // Navigate back to stores
  const handleBackToStores = () => {
    setViewMode("stores");
    setSelectedStore(null);
    setDocuments([]);
    setDeleteConfirm(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStateColor = (state: string) => {
    switch (state) {
      case "STATE_ACTIVE":
        return "text-green-600";
      case "STATE_PENDING":
        return "text-yellow-600";
      case "STATE_FAILED":
        return "text-red-600";
      default:
        return "text-muted-foreground";
    }
  };

  const getStateLabel = (state: string) => {
    switch (state) {
      case "STATE_ACTIVE":
        return "Active";
      case "STATE_PENDING":
        return "Processing";
      case "STATE_FAILED":
        return "Failed";
      default:
        return "Unknown";
    }
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="flex max-h-[80vh] max-w-4xl flex-col">
        <DialogHeader>
          <DialogTitle>
            {viewMode === "stores" ? (
              "File Search Stores"
            ) : (
              <div className="flex items-center gap-2">
                <button
                  className="text-muted-foreground hover:text-foreground"
                  onClick={handleBackToStores}
                  type="button"
                >
                  Stores
                </button>
                <ChevronRight className="size-4 text-muted-foreground" />
                <span>{selectedStore?.displayName || "Documents"}</span>
              </div>
            )}
          </DialogTitle>
          <DialogDescription>
            {viewMode === "stores"
              ? "Manage your Gemini File Search stores and documents."
              : `Documents in ${selectedStore?.displayName || "this store"}`}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {viewMode === "stores" ? (
            <StoresView
              createError={createError}
              deleteConfirm={deleteConfirm}
              deletingId={deletingId}
              error={storesError}
              isCreating={isCreating}
              isLoading={isLoadingStores}
              newStoreName={newStoreName}
              onCreateStore={handleCreateStore}
              onDelete={handleDeleteStore}
              onNewStoreNameChange={setNewStoreName}
              onRefresh={fetchStores}
              onViewDocuments={handleViewDocuments}
              stores={stores}
            />
          ) : (
            <DocumentsView
              deleteConfirm={deleteConfirm}
              deletingId={deletingId}
              documents={documents}
              error={docsError}
              formatDate={formatDate}
              getStateColor={getStateColor}
              getStateLabel={getStateLabel}
              hasMore={!!docsNextPageToken}
              isLoading={isLoadingDocs}
              isUploading={isUploading}
              onDelete={handleDeleteDocument}
              onLoadMore={() =>
                selectedStore &&
                docsNextPageToken &&
                fetchDocuments(selectedStore.name, docsNextPageToken)
              }
              onRefresh={() =>
                selectedStore && fetchDocuments(selectedStore.name)
              }
              onUpload={handleUpload}
              uploadError={uploadError}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Stores View Component
type StoresViewProps = {
  stores: FileSearchStore[];
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
  onViewDocuments: (store: FileSearchStore) => void;
  onDelete: (store: FileSearchStore) => void;
  deleteConfirm: string | null;
  deletingId: string | null;
  newStoreName: string;
  onNewStoreNameChange: (name: string) => void;
  onCreateStore: () => void;
  isCreating: boolean;
  createError: string | null;
};

function StoresView({
  stores,
  isLoading,
  error,
  onRefresh,
  onViewDocuments,
  onDelete,
  deleteConfirm,
  deletingId,
  newStoreName,
  onNewStoreNameChange,
  onCreateStore,
  isCreating,
  createError,
}: StoresViewProps) {
  return (
    <div className="space-y-4">
      {/* Create Store Form */}
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            disabled={isCreating}
            onChange={(e) => onNewStoreNameChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onCreateStore()}
            placeholder="New store name..."
            value={newStoreName}
          />
          {createError && (
            <p className="mt-1 text-destructive text-xs">{createError}</p>
          )}
        </div>
        <Button
          disabled={isCreating || !newStoreName.trim()}
          onClick={onCreateStore}
        >
          {isCreating ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Plus className="size-4" />
          )}
          <span className="ml-2">Create</span>
        </Button>
        <Button onClick={onRefresh} size="icon" variant="outline">
          <RefreshCw className={cn("size-4", isLoading && "animate-spin")} />
        </Button>
      </div>

      {/* Stores Table */}
      {isLoading && stores.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="py-12 text-center">
          <p className="text-destructive">{error}</p>
          <Button className="mt-4" onClick={onRefresh} variant="outline">
            Retry
          </Button>
        </div>
      ) : stores.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          <FileText className="mx-auto size-12 opacity-50" />
          <p className="mt-4">No stores yet.</p>
          <p className="text-sm">Create your first store to get started.</p>
        </div>
      ) : (
        <ScrollArea className="h-[400px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="w-[100px]">Documents</TableHead>
                <TableHead className="w-[100px]">Size</TableHead>
                <TableHead className="w-[100px]">Created</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stores.map((store) => (
                <TableRow
                  className="cursor-pointer"
                  key={store.name}
                  onClick={() => onViewDocuments(store)}
                >
                  <TableCell className="font-medium">
                    {store.displayName || store.name}
                  </TableCell>
                  <TableCell>{getTotalDocumentCount(store)}</TableCell>
                  <TableCell>{formatBytes(store.sizeBytes)}</TableCell>
                  <TableCell>
                    {new Date(store.createTime).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button
                      className={cn(
                        "size-8",
                        deleteConfirm === store.name && "text-destructive"
                      )}
                      disabled={deletingId === store.name}
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(store);
                      }}
                      size="icon"
                      variant="ghost"
                    >
                      {deletingId === store.name ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Trash2 className="size-4" />
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      )}
    </div>
  );
}

// Documents View Component
type DocumentsViewProps = {
  documents: FileSearchDocument[];
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
  onDelete: (doc: FileSearchDocument) => void;
  deleteConfirm: string | null;
  deletingId: string | null;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isUploading: boolean;
  uploadError: string | null;
  hasMore: boolean;
  onLoadMore: () => void;
  formatDate: (date: string) => string;
  getStateColor: (state: string) => string;
  getStateLabel: (state: string) => string;
};

function DocumentsView({
  documents,
  isLoading,
  error,
  onRefresh,
  onDelete,
  deleteConfirm,
  deletingId,
  onUpload,
  isUploading,
  uploadError,
  hasMore,
  onLoadMore,
  getStateColor,
  getStateLabel,
}: DocumentsViewProps) {
  return (
    <div className="space-y-4">
      {/* Upload and Refresh */}
      <div className="flex gap-2">
        <Label className="flex-1">
          <Input
            accept="*/*"
            className="hidden"
            disabled={isUploading}
            onChange={onUpload}
            type="file"
          />
          <Button
            asChild
            className="w-full cursor-pointer"
            disabled={isUploading}
            variant="outline"
          >
            <span>
              {isUploading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Upload className="size-4" />
              )}
              <span className="ml-2">
                {isUploading ? "Uploading..." : "Upload File"}
              </span>
            </span>
          </Button>
        </Label>
        <Button onClick={onRefresh} size="icon" variant="outline">
          <RefreshCw className={cn("size-4", isLoading && "animate-spin")} />
        </Button>
      </div>
      {uploadError && <p className="text-destructive text-xs">{uploadError}</p>}

      {/* Documents Table */}
      {isLoading && documents.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="py-12 text-center">
          <p className="text-destructive">{error}</p>
          <Button className="mt-4" onClick={onRefresh} variant="outline">
            Retry
          </Button>
        </div>
      ) : documents.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          <FileText className="mx-auto size-12 opacity-50" />
          <p className="mt-4">No documents yet.</p>
          <p className="text-sm">
            Upload files to add documents to this store.
          </p>
        </div>
      ) : (
        <ScrollArea className="h-[400px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="w-[100px]">State</TableHead>
                <TableHead className="w-[100px]">Size</TableHead>
                <TableHead className="w-[120px]">Type</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((doc) => (
                <TableRow key={doc.name}>
                  <TableCell className="font-medium">
                    {doc.displayName || doc.name}
                  </TableCell>
                  <TableCell>
                    <span className={getStateColor(doc.state)}>
                      {getStateLabel(doc.state)}
                    </span>
                  </TableCell>
                  <TableCell>{formatBytes(doc.sizeBytes)}</TableCell>
                  <TableCell className="max-w-[120px] truncate">
                    {doc.mimeType}
                  </TableCell>
                  <TableCell>
                    <Button
                      className={cn(
                        "size-8",
                        deleteConfirm === doc.name && "text-destructive"
                      )}
                      disabled={deletingId === doc.name}
                      onClick={() => onDelete(doc)}
                      size="icon"
                      variant="ghost"
                    >
                      {deletingId === doc.name ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Trash2 className="size-4" />
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {hasMore && (
            <div className="py-4 text-center">
              <Button
                disabled={isLoading}
                onClick={onLoadMore}
                variant="outline"
              >
                {isLoading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  "Load More"
                )}
              </Button>
            </div>
          )}
        </ScrollArea>
      )}
    </div>
  );
}
