/**
 * TypeScript types for Gemini File Search API
 * Based on: https://ai.google.dev/api/file-search/file-search-stores
 */

// ============================================================================
// FileSearchStore Types
// ============================================================================

/**
 * A FileSearchStore is a collection of Documents for semantic search.
 */
export type FileSearchStore = {
  /** Resource name, e.g., "fileSearchStores/my-store-123abc" */
  name: string;
  /** Human-readable display name (max 512 chars) */
  displayName: string;
  /** ISO 8601 timestamp of creation */
  createTime: string;
  /** ISO 8601 timestamp of last update */
  updateTime: string;
  /** Number of documents ready for retrieval */
  activeDocumentsCount: number;
  /** Number of documents being processed */
  pendingDocumentsCount: number;
  /** Number of documents that failed processing */
  failedDocumentsCount: number;
  /** Total size in bytes of all documents */
  sizeBytes: number;
};

/**
 * Response from listing FileSearchStores
 */
export type ListStoresResponse = {
  fileSearchStores: FileSearchStore[];
  nextPageToken?: string;
};

/**
 * Request to create a new FileSearchStore
 */
export type CreateStoreRequest = {
  displayName: string;
};

// ============================================================================
// Document Types
// ============================================================================

/**
 * Document state in the FileSearchStore
 */
export type DocumentState =
  | "STATE_UNSPECIFIED"
  | "STATE_PENDING"
  | "STATE_ACTIVE"
  | "STATE_FAILED";

/**
 * A Document is a collection of Chunks within a FileSearchStore.
 */
export type FileSearchDocument = {
  /** Resource name, e.g., "fileSearchStores/store-id/documents/doc-id" */
  name: string;
  /** Human-readable display name (max 512 chars) */
  displayName: string;
  /** Current processing state */
  state: DocumentState;
  /** Size in bytes */
  sizeBytes: number;
  /** MIME type of the document */
  mimeType: string;
  /** ISO 8601 timestamp of creation */
  createTime: string;
  /** ISO 8601 timestamp of last update */
  updateTime: string;
  /** Optional custom metadata */
  customMetadata?: CustomMetadata[];
};

/**
 * Custom metadata key-value pair
 */
export type CustomMetadata = {
  key: string;
  stringValue?: string;
  stringListValue?: { values: string[] };
  numericValue?: number;
};

/**
 * Response from listing Documents
 */
export type ListDocumentsResponse = {
  documents: FileSearchDocument[];
  nextPageToken?: string;
};

// ============================================================================
// Operation Types
// ============================================================================

/**
 * Status error from API
 */
export type OperationError = {
  code: number;
  message: string;
  details?: Record<string, unknown>[];
};

/**
 * Long-running operation for async tasks like file upload
 */
export type Operation = {
  /** Operation resource name */
  name: string;
  /** Whether the operation is complete */
  done: boolean;
  /** Service-specific metadata */
  metadata?: Record<string, unknown>;
  /** Error if operation failed */
  error?: OperationError;
  /** Response if operation succeeded */
  response?: Record<string, unknown>;
};

// ============================================================================
// Upload Types
// ============================================================================

/**
 * Chunking configuration for file upload
 */
export type ChunkingConfig = {
  whiteSpaceConfig?: {
    maxTokensPerChunk?: number;
    maxOverlapTokens?: number;
  };
};

/**
 * Request to upload a file to FileSearchStore
 */
export type UploadToStoreRequest = {
  displayName?: string;
  customMetadata?: CustomMetadata[];
  chunkingConfig?: ChunkingConfig;
  mimeType?: string;
};

// ============================================================================
// Helper Types
// ============================================================================

/**
 * Pagination parameters
 */
export type PaginationParams = {
  pageSize?: number;
  pageToken?: string;
};

/**
 * Extract store ID from full resource name
 * e.g., "fileSearchStores/my-store-123" -> "my-store-123"
 */
export function extractStoreId(name: string): string {
  return name.replace("fileSearchStores/", "");
}

/**
 * Extract document ID from full resource name
 * e.g., "fileSearchStores/store-id/documents/doc-id" -> "doc-id"
 */
export function extractDocumentId(name: string): string {
  const parts = name.split("/documents/");
  return parts[1] || name;
}

/**
 * Build full store resource name from ID
 */
export function buildStoreName(storeId: string): string {
  if (storeId.startsWith("fileSearchStores/")) {
    return storeId;
  }
  return `fileSearchStores/${storeId}`;
}

/**
 * Build full document resource name
 */
export function buildDocumentName(storeId: string, documentId: string): string {
  const storeName = buildStoreName(storeId);
  if (documentId.includes("/documents/")) {
    return documentId;
  }
  return `${storeName}/documents/${documentId}`;
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) {
    return "0 B";
  }
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Number.parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
}

/**
 * Get total document count from store
 */
export function getTotalDocumentCount(store: FileSearchStore): number {
  return (
    store.activeDocumentsCount +
    store.pendingDocumentsCount +
    store.failedDocumentsCount
  );
}
