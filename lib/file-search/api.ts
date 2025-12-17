/**
 * Gemini File Search API client
 * Provides functions to interact with FileSearchStores and Documents
 */

import type {
  CreateStoreRequest,
  FileSearchDocument,
  FileSearchStore,
  ListDocumentsResponse,
  ListStoresResponse,
  Operation,
  PaginationParams,
  UploadToStoreRequest,
} from "./types";

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";

/**
 * Get the Gemini API key from environment
 */
function getApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }
  return apiKey;
}

/**
 * Make authenticated request to Gemini API
 */
async function geminiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const apiKey = getApiKey();
  const url = `${GEMINI_API_BASE}${endpoint}${endpoint.includes("?") ? "&" : "?"}key=${apiKey}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      error.error?.message || `API request failed: ${response.status}`
    );
  }

  return response.json();
}

// ============================================================================
// Store Operations
// ============================================================================

/**
 * List all FileSearchStores
 */
export async function listStores(
  params?: PaginationParams
): Promise<ListStoresResponse> {
  const queryParams = new URLSearchParams();
  if (params?.pageSize) {
    queryParams.set("pageSize", String(params.pageSize));
  }
  if (params?.pageToken) {
    queryParams.set("pageToken", params.pageToken);
  }

  const query = queryParams.toString();
  const endpoint = `/fileSearchStores${query ? `?${query}` : ""}`;

  const response = await geminiRequest<ListStoresResponse>(endpoint);

  // Ensure arrays exist and parse numeric strings
  return {
    fileSearchStores: (response.fileSearchStores || []).map(parseStore),
    nextPageToken: response.nextPageToken,
  };
}

/**
 * Get a single FileSearchStore by name
 */
export async function getStore(name: string): Promise<FileSearchStore> {
  const storeName = name.startsWith("fileSearchStores/")
    ? name
    : `fileSearchStores/${name}`;
  const response = await geminiRequest<FileSearchStore>(`/${storeName}`);
  return parseStore(response);
}

/**
 * Create a new FileSearchStore
 */
export async function createStore(
  request: CreateStoreRequest
): Promise<FileSearchStore> {
  const response = await geminiRequest<FileSearchStore>("/fileSearchStores", {
    method: "POST",
    body: JSON.stringify(request),
  });
  return parseStore(response);
}

/**
 * Delete a FileSearchStore
 * @param name - Store name or ID
 * @param force - If true, delete all documents in the store
 */
export async function deleteStore(name: string, force = true): Promise<void> {
  const storeName = name.startsWith("fileSearchStores/")
    ? name
    : `fileSearchStores/${name}`;
  await geminiRequest(`/${storeName}?force=${force}`, {
    method: "DELETE",
  });
}

/**
 * Parse store response, converting string numbers to actual numbers
 */
function parseStore(store: FileSearchStore): FileSearchStore {
  return {
    ...store,
    activeDocumentsCount: Number(store.activeDocumentsCount) || 0,
    pendingDocumentsCount: Number(store.pendingDocumentsCount) || 0,
    failedDocumentsCount: Number(store.failedDocumentsCount) || 0,
    sizeBytes: Number(store.sizeBytes) || 0,
  };
}

// ============================================================================
// Document Operations
// ============================================================================

/**
 * List documents in a FileSearchStore
 */
export async function listDocuments(
  storeName: string,
  params?: PaginationParams
): Promise<ListDocumentsResponse> {
  const name = storeName.startsWith("fileSearchStores/")
    ? storeName
    : `fileSearchStores/${storeName}`;

  const queryParams = new URLSearchParams();
  if (params?.pageSize) {
    queryParams.set("pageSize", String(params.pageSize));
  }
  if (params?.pageToken) {
    queryParams.set("pageToken", params.pageToken);
  }

  const query = queryParams.toString();
  const endpoint = `/${name}/documents${query ? `?${query}` : ""}`;

  const response = await geminiRequest<ListDocumentsResponse>(endpoint);

  return {
    documents: (response.documents || []).map(parseDocument),
    nextPageToken: response.nextPageToken,
  };
}

/**
 * Get a single document
 */
export async function getDocument(name: string): Promise<FileSearchDocument> {
  const response = await geminiRequest<FileSearchDocument>(`/${name}`);
  return parseDocument(response);
}

/**
 * Delete a document from a FileSearchStore
 * @param name - Full document name (fileSearchStores/xxx/documents/yyy)
 * @param force - If true, delete all chunks
 */
export async function deleteDocument(
  name: string,
  force = true
): Promise<void> {
  await geminiRequest(`/${name}?force=${force}`, {
    method: "DELETE",
  });
}

/**
 * Parse document response, converting string numbers to actual numbers
 */
function parseDocument(doc: FileSearchDocument): FileSearchDocument {
  return {
    ...doc,
    sizeBytes: Number(doc.sizeBytes) || 0,
  };
}

// ============================================================================
// Upload Operations
// ============================================================================

/**
 * Upload a file directly to a FileSearchStore
 * Returns an Operation that can be polled for completion
 */
export async function uploadToStore(
  storeName: string,
  file: Buffer | Uint8Array,
  fileName: string,
  config?: UploadToStoreRequest
): Promise<Operation> {
  const apiKey = getApiKey();
  const name = storeName.startsWith("fileSearchStores/")
    ? storeName
    : `fileSearchStores/${storeName}`;

  // Use multipart upload
  const boundary = `----FormBoundary${Date.now()}`;
  const metadata = JSON.stringify({
    displayName: config?.displayName || fileName,
    ...config,
  });

  // Build multipart body
  const parts: (string | Buffer | Uint8Array)[] = [
    `--${boundary}\r\n`,
    "Content-Type: application/json; charset=UTF-8\r\n\r\n",
    metadata,
    `\r\n--${boundary}\r\n`,
    "Content-Type: application/octet-stream\r\n\r\n",
  ];

  // Combine parts with file data
  const encoder = new TextEncoder();
  const metadataParts = parts.map((p) =>
    typeof p === "string" ? encoder.encode(p) : p
  );
  const endBoundary = encoder.encode(`\r\n--${boundary}--`);

  const totalLength =
    metadataParts.reduce((sum, p) => sum + p.length, 0) +
    file.length +
    endBoundary.length;

  const body = new Uint8Array(totalLength);
  let offset = 0;
  for (const part of metadataParts) {
    body.set(part, offset);
    offset += part.length;
  }
  body.set(file instanceof Buffer ? new Uint8Array(file) : file, offset);
  offset += file.length;
  body.set(endBoundary, offset);

  const uploadUrl = `https://generativelanguage.googleapis.com/upload/v1beta/${name}:uploadToFileSearchStore?key=${apiKey}`;

  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      "Content-Type": `multipart/related; boundary=${boundary}`,
    },
    body,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      error.error?.message || `Upload failed: ${response.status}`
    );
  }

  return response.json();
}

// ============================================================================
// Operation Polling
// ============================================================================

/**
 * Get operation status
 */
export async function getOperation(name: string): Promise<Operation> {
  return await geminiRequest<Operation>(`/${name}`);
}

/**
 * Poll an operation until it completes
 * @param name - Operation name
 * @param intervalMs - Polling interval in milliseconds (default 2000)
 * @param timeoutMs - Maximum time to wait (default 300000 = 5 minutes)
 */
export async function pollOperation(
  name: string,
  intervalMs = 2000,
  timeoutMs = 300_000
): Promise<Operation> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    const operation = await getOperation(name);

    if (operation.done) {
      if (operation.error) {
        throw new Error(operation.error.message || "Operation failed");
      }
      return operation;
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error("Operation timed out. Please check status later.");
}
