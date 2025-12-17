# Requirements Document

## Introduction

Tính năng File Search Store Management gồm 2 phần riêng biệt:
1. **Store Selector**: Component nhỏ gọn bên cạnh model selector, chỉ để chọn store cho chat
2. **Store Management Panel**: Panel riêng biệt để quản lý đầy đủ CRUD stores và documents qua Gemini File Search API

UI được thiết kế hiện đại, chuyên nghiệp với khả năng mở rộng khi có nhiều stores và documents.

## Glossary

- **FileSearchStore**: Container lưu trữ document embeddings cho semantic search, được quản lý bởi Gemini API
- **Document**: File đã được chunk, embed và index trong FileSearchStore
- **Gemini API**: Google Generative AI API cung cấp File Search functionality
- **RAG (Retrieval Augmented Generation)**: Kỹ thuật tăng cường context cho model bằng cách truy xuất thông tin liên quan
- **Store Selector**: Component dropdown nhỏ gọn cho phép chọn store để sử dụng trong chat (bên cạnh model selector)
- **Store Management Panel**: Panel/Dialog riêng biệt để quản lý CRUD stores và documents

## Requirements

### Requirement 1

**User Story:** As a user, I want to see a clear "FileSearch" text label in the store selector, so that I can easily identify the file search feature.

#### Acceptance Criteria

1. WHEN the store selector button is rendered THEN the System SHALL display text "FileSearch" instead of a magnifying glass icon
2. WHEN a store is selected THEN the System SHALL display "FileSearch" with the selected store name
3. WHEN the button is clicked THEN the System SHALL open a dropdown to select/deselect stores

### Requirement 2

**User Story:** As a user, I want to quickly select a store from a dropdown in the store selector, so that I can enable file search for my chat.

#### Acceptance Criteria

1. WHEN the store selector dropdown opens THEN the System SHALL fetch and display available stores from Gemini API
2. WHEN stores are loading THEN the System SHALL display a loading spinner in dropdown
3. WHEN a user clicks on a store THEN the System SHALL select that store and close dropdown
4. WHEN a store is already selected THEN the System SHALL allow clicking to deselect
5. WHEN dropdown is open THEN the System SHALL show a link/button to open Store Management Panel

### Requirement 3

**User Story:** As a user, I want to access a dedicated Store Management Panel, so that I can manage stores and documents separately from the chat interface.

#### Acceptance Criteria

1. WHEN a user clicks "Manage Stores" link in dropdown THEN the System SHALL open the Store Management Panel
2. WHEN the panel opens THEN the System SHALL display in a full-featured dialog or slide-over
3. WHEN the panel is open THEN the System SHALL allow closing to return to chat

### Requirement 4

**User Story:** As a user, I want to view a list of all my File Search Stores in the management panel, so that I can see what stores are available.

#### Acceptance Criteria

1. WHEN the store management panel opens THEN the System SHALL fetch and display all FileSearchStores from Gemini API
2. WHEN stores are loading THEN the System SHALL display a loading indicator
3. WHEN the API returns stores THEN the System SHALL display store name, document count, size, and creation date for each store
4. WHEN no stores exist THEN the System SHALL display an empty state with guidance to create a store
5. IF the API request fails THEN the System SHALL display an error message with retry option

### Requirement 5

**User Story:** As a user, I want to create new File Search Stores in the management panel, so that I can organize my documents for different purposes.

#### Acceptance Criteria

1. WHEN a user clicks the create store button THEN the System SHALL display a form to enter store display name
2. WHEN a user submits a valid store name THEN the System SHALL call Gemini API to create the store
3. WHEN store creation succeeds THEN the System SHALL add the new store to the list and show success feedback
4. IF store creation fails THEN the System SHALL display the error message from API
5. WHEN store name is empty or invalid THEN the System SHALL prevent submission and show validation error

### Requirement 6

**User Story:** As a user, I want to delete File Search Stores in the management panel, so that I can remove stores I no longer need.

#### Acceptance Criteria

1. WHEN a user clicks delete on a store THEN the System SHALL display a confirmation dialog
2. WHEN the confirmation dialog shows THEN the System SHALL warn about permanent deletion of all documents
3. WHEN user confirms deletion THEN the System SHALL call Gemini API with force=true to delete store and all documents
4. WHEN deletion succeeds THEN the System SHALL remove the store from the list and show success feedback
5. IF deletion fails THEN the System SHALL display the error message from API

### Requirement 7

**User Story:** As a user, I want to view documents within a specific store, so that I can see what files have been indexed.

#### Acceptance Criteria

1. WHEN a user clicks on a store row/card THEN the System SHALL navigate to document list view for that store
2. WHEN documents are loading THEN the System SHALL display a loading indicator
3. WHEN the API returns documents THEN the System SHALL display document name, state, size, and mime type
4. WHEN documents list is long THEN the System SHALL implement pagination with page navigation
5. WHEN no documents exist in store THEN the System SHALL display empty state with upload guidance
6. WHEN viewing documents THEN the System SHALL show breadcrumb to navigate back to stores list

### Requirement 8

**User Story:** As a user, I want to upload files to a store, so that I can add new documents for semantic search.

#### Acceptance Criteria

1. WHEN a user clicks upload button THEN the System SHALL open a file picker dialog
2. WHEN a user selects a file THEN the System SHALL call uploadToFileSearchStore API
3. WHEN upload is in progress THEN the System SHALL display upload progress indicator
4. WHEN upload operation completes THEN the System SHALL poll operation status until done
5. WHEN upload succeeds THEN the System SHALL refresh document list and show success feedback
6. IF upload fails THEN the System SHALL display the error message from API

### Requirement 9

**User Story:** As a user, I want to delete documents from a store, so that I can remove outdated or incorrect files.

#### Acceptance Criteria

1. WHEN a user clicks delete on a document THEN the System SHALL display a confirmation dialog
2. WHEN user confirms deletion THEN the System SHALL call Gemini API to delete the document
3. WHEN deletion succeeds THEN the System SHALL remove the document from the list and show success feedback
4. IF deletion fails THEN the System SHALL display the error message from API

### Requirement 10

**User Story:** As a user, I want a modern and professional UI for store management, so that I can efficiently manage many stores and documents.

#### Acceptance Criteria

1. WHEN the management panel opens THEN the System SHALL display in a full-featured dialog with adequate size
2. WHEN displaying stores THEN the System SHALL use a table layout with columns for name, documents count, size, created date, and actions
3. WHEN navigating between stores and documents THEN the System SHALL provide breadcrumb navigation
4. WHEN performing actions THEN the System SHALL provide immediate visual feedback with loading states
5. WHEN on mobile devices THEN the System SHALL adapt layout for smaller screens

### Requirement 11

**User Story:** As a developer, I want the system to handle Gemini API responses correctly, so that data is properly parsed and displayed.

#### Acceptance Criteria

1. WHEN receiving FileSearchStore response THEN the System SHALL parse name, displayName, createTime, activeDocumentsCount, pendingDocumentsCount, failedDocumentsCount, and sizeBytes
2. WHEN receiving Document response THEN the System SHALL parse name, displayName, state, sizeBytes, mimeType, createTime, and updateTime
3. WHEN receiving Operation response THEN the System SHALL handle polling until done=true
4. IF Operation returns error THEN the System SHALL extract and display error message
5. WHEN listing stores or documents THEN the System SHALL handle pagination with pageToken
