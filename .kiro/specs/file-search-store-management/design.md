# Design Document: File Search Store Management

## Overview

Tính năng File Search Store Management cung cấp giao diện để tích hợp với Gemini File Search API, cho phép người dùng quản lý FileSearchStores và Documents. Hệ thống gồm 2 phần chính:

1. **Store Selector**: Component dropdown nhỏ gọn bên cạnh model selector để chọn store cho chat
2. **Store Management Panel**: Dialog đầy đủ để CRUD stores và documents

## Architecture

```mermaid
graph TB
    subgraph "Frontend Components"
        SS[Store Selector]
        SMP[Store Management Panel]
        SL[Store List View]
        DL[Document List View]
    end
    
    subgraph "API Routes"
        SR[/api/file-search/stores]
        DR[/api/file-search/stores/[id]/documents]
        UR[/api/file-search/upload]
    end
    
    subgraph "Gemini API"
        GA[fileSearchStores API]
        DA[documents API]
        UA[uploadToFileSearchStore API]
    end
    
    SS --> SR
    SMP --> SR
    SMP --> DR
    SMP --> UR
    
    SR --> GA
    DR --> DA
    UR --> UA
```

## Components and Interfaces

### 1. Store Selector Component

```typescript
// components/store-selector.tsx
interface StoreSelectorProps {
  onManageClick: () => void;
}

// State
interface StoreSelectorState {
  isOpen: boolean;
  stores: FileSearchStore[];
  isLoading: boolean;
  selectedStore: string | null;
}
```

**Behavior:**
- Hiển thị text "FileSearch" (không dùng icon)
- Khi có store được chọn: "FileSearch: {storeName}"
- Click mở dropdown với danh sách stores
- Link "Manage Stores" ở cuối dropdown

### 2. Store Management Panel Component

```typescript
// components/store-management-panel.tsx
interface StoreManagementPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ViewMode = 'stores' | 'documents';

interface PanelState {
  viewMode: ViewMode;
  selectedStoreId: string | null;
  stores: FileSearchStore[];
  documents: Document[];
  isLoading: boolean;
  error: string | null;
}
```

**Views:**
- **Stores View**: Table với columns [Name, Documents, Size, Created, Actions]
- **Documents View**: Table với columns [Name, State, Size, Type, Actions] + Breadcrumb

### 3. API Service Layer

```typescript
// lib/file-search/api.ts
interface FileSearchAPI {
  // Stores
  listStores(pageToken?: string): Promise<ListStoresResponse>;
  createStore(displayName: string): Promise<FileSearchStore>;
  deleteStore(name: string, force?: boolean): Promise<void>;
  
  // Documents
  listDocuments(storeName: string, pageToken?: string): Promise<ListDocumentsResponse>;
  uploadDocument(storeName: string, file: File, displayName?: string): Promise<Operation>;
  deleteDocument(name: string): Promise<void>;
  
  // Operations
  getOperation(name: string): Promise<Operation>;
  pollOperation(name: string, interval?: number): Promise<Operation>;
}
```

## Data Models

### FileSearchStore

```typescript
interface FileSearchStore {
  name: string;                    // e.g., "fileSearchStores/abc-123"
  displayName: string;
  createTime: string;              // ISO 8601
  updateTime: string;
  activeDocumentsCount: number;
  pendingDocumentsCount: number;
  failedDocumentsCount: number;
  sizeBytes: number;
}
```

### Document

```typescript
interface Document {
  name: string;                    // e.g., "fileSearchStores/abc/documents/xyz"
  displayName: string;
  state: 'STATE_UNSPECIFIED' | 'STATE_PENDING' | 'STATE_ACTIVE' | 'STATE_FAILED';
  sizeBytes: number;
  mimeType: string;
  createTime: string;
  updateTime: string;
}
```

### Operation

```typescript
interface Operation {
  name: string;
  done: boolean;
  metadata?: Record<string, unknown>;
  error?: {
    code: number;
    message: string;
  };
  response?: Record<string, unknown>;
}
```

### API Responses

```typescript
interface ListStoresResponse {
  fileSearchStores: FileSearchStore[];
  nextPageToken?: string;
}

interface ListDocumentsResponse {
  documents: Document[];
  nextPageToken?: string;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Selected store display includes store name
*For any* selected store, the store selector display text SHALL contain both "FileSearch" and the store's displayName.
**Validates: Requirements 1.2**

### Property 2: Store selection toggle
*For any* store that is currently selected, clicking on it again SHALL deselect it (selectedStore becomes null).
**Validates: Requirements 2.4**

### Property 3: Store list displays all required fields
*For any* FileSearchStore returned by the API, the rendered store row SHALL display name, document count, size, and creation date.
**Validates: Requirements 4.3**

### Property 4: Empty store name validation
*For any* string that is empty or contains only whitespace characters, the create store form SHALL reject submission and show validation error.
**Validates: Requirements 5.5**

### Property 5: Document list displays all required fields
*For any* Document returned by the API, the rendered document row SHALL display name, state, size, and mime type.
**Validates: Requirements 7.3**

### Property 6: Operation polling continues until done
*For any* Operation with done=false, the polling mechanism SHALL continue fetching operation status until done=true.
**Validates: Requirements 8.4, 11.3**

### Property 7: FileSearchStore response parsing
*For any* valid FileSearchStore JSON response, the parser SHALL correctly extract name, displayName, createTime, activeDocumentsCount, pendingDocumentsCount, failedDocumentsCount, and sizeBytes.
**Validates: Requirements 11.1**

### Property 8: Document response parsing
*For any* valid Document JSON response, the parser SHALL correctly extract name, displayName, state, sizeBytes, mimeType, createTime, and updateTime.
**Validates: Requirements 11.2**

### Property 9: Pagination token handling
*For any* paginated response with nextPageToken, using that token in the next request SHALL return the next page of results.
**Validates: Requirements 11.5**

## Error Handling

### API Errors
- Network errors: Display "Connection failed. Please check your network and try again." with retry button
- 401 Unauthorized: Redirect to login or show "API key invalid" message
- 404 Not Found: Show "Store/Document not found" and refresh list
- 429 Rate Limited: Show "Too many requests. Please wait and try again."
- 500 Server Error: Show "Server error. Please try again later."

### Validation Errors
- Empty store name: "Store name cannot be empty"
- Store name too long (>512 chars): "Store name must be 512 characters or less"
- Invalid file type: "File type not supported for File Search"
- File too large (>100MB): "File size must be under 100MB"

### Operation Errors
- Upload failed: Extract error.message from Operation response
- Polling timeout (>5 minutes): "Operation timed out. Please check status later."

## Testing Strategy

### Property-Based Testing Library
Sử dụng **fast-check** cho property-based testing trong TypeScript/JavaScript.

### Unit Tests
- Component rendering tests
- API service function tests
- Validation function tests
- Error handling tests

### Property-Based Tests
Mỗi correctness property sẽ được implement bằng một property-based test với fast-check:

1. **Property 1**: Generate random store names, verify display format
2. **Property 2**: Generate random selection states, verify toggle behavior
3. **Property 3**: Generate random FileSearchStore objects, verify all fields rendered
4. **Property 4**: Generate whitespace strings, verify validation rejects
5. **Property 5**: Generate random Document objects, verify all fields rendered
6. **Property 6**: Generate Operation sequences, verify polling logic
7. **Property 7**: Generate valid FileSearchStore JSON, verify parsing
8. **Property 8**: Generate valid Document JSON, verify parsing
9. **Property 9**: Generate paginated responses, verify token handling

### Test Configuration
- Minimum 100 iterations per property test
- Each test tagged with: `**Feature: file-search-store-management, Property {N}: {description}**`

### Integration Tests
- Full flow: Create store → Upload document → Verify in list → Delete
- Error scenarios with mocked API failures
