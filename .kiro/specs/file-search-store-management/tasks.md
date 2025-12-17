# Implementation Plan

- [x] 1. Set up API service layer for Gemini File Search

  - [x] 1.1 Create TypeScript types for FileSearchStore, Document, Operation, and API responses


    - Define interfaces matching Gemini API spec
    - Include helper types for pagination
    - _Requirements: 11.1, 11.2_
  - [ ]* 1.2 Write property test for FileSearchStore parsing
    - **Property 7: FileSearchStore response parsing**
    - **Validates: Requirements 11.1**
  - [ ]* 1.3 Write property test for Document parsing
    - **Property 8: Document response parsing**
    - **Validates: Requirements 11.2**
  - [x] 1.4 Create API service functions for stores (list, create, delete)


    - Implement listStores with pagination support
    - Implement createStore with displayName parameter
    - Implement deleteStore with force=true option
    - _Requirements: 4.1, 5.2, 6.3_

  - [x] 1.5 Create API service functions for documents (list, upload, delete)
    - Implement listDocuments with pagination support
    - Implement uploadDocument using uploadToFileSearchStore endpoint
    - Implement deleteDocument
    - _Requirements: 7.1, 8.2, 9.2_
  - [x] 1.6 Implement operation polling utility
    - Poll operation status until done=true
    - Handle timeout after 5 minutes
    - Extract error message on failure
    - _Requirements: 8.4, 11.3_
  - [ ]* 1.7 Write property test for operation polling
    - **Property 6: Operation polling continues until done**
    - **Validates: Requirements 8.4, 11.3**

- [x] 2. Create backend API routes


  - [x] 2.1 Create /api/file-search/stores route for listing and creating stores


    - GET: List all stores with pagination
    - POST: Create new store
    - _Requirements: 2.1, 4.1, 5.2_

  - [x] 2.2 Create /api/file-search/stores/[id] route for store operations

    - GET: Get single store details
    - DELETE: Delete store with force=true
    - _Requirements: 6.3_
  - [x] 2.3 Create /api/file-search/stores/[id]/documents route for documents


    - GET: List documents in store with pagination
    - DELETE: Delete document
    - _Requirements: 7.1, 9.2_
  - [x] 2.4 Create /api/file-search/upload route for file uploads


    - POST: Handle multipart file upload
    - Call uploadToFileSearchStore API
    - Return operation for polling
    - _Requirements: 8.2_

- [ ] 3. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Update Store Selector component


  - [x] 4.1 Replace icon with "FileSearch" text label

    - Remove Search icon import
    - Display "FileSearch" text
    - Show "FileSearch: {storeName}" when store selected
    - _Requirements: 1.1, 1.2_
  - [ ]* 4.2 Write property test for selected store display
    - **Property 1: Selected store display includes store name**
    - **Validates: Requirements 1.2**
  - [x] 4.3 Update dropdown to fetch stores from Gemini API

    - Call /api/file-search/stores on dropdown open
    - Show loading spinner while fetching
    - Display store list from API response
    - _Requirements: 2.1, 2.2_

  - [x] 4.4 Implement store selection toggle behavior
    - Click to select store
    - Click again to deselect
    - Save selection to user settings
    - _Requirements: 2.3, 2.4_
  - [ ]* 4.5 Write property test for selection toggle
    - **Property 2: Store selection toggle**
    - **Validates: Requirements 2.4**
  - [x] 4.6 Add "Manage Stores" link in dropdown
    - Add separator and link at bottom of dropdown
    - Trigger onManageClick callback
    - _Requirements: 2.5, 3.1_

- [x] 5. Create Store Management Panel - Stores View


  - [x] 5.1 Create StoreManagementPanel dialog component


    - Use Dialog component with adequate size (max-w-4xl)
    - Implement open/close state management
    - Add header with title and close button
    - _Requirements: 3.2, 3.3, 10.1_

  - [ ] 5.2 Implement stores list table
    - Table columns: Name, Documents, Size, Created, Actions
    - Fetch stores from API on mount
    - Show loading state while fetching
    - _Requirements: 4.1, 4.2, 4.3, 10.2_
  - [ ]* 5.3 Write property test for store list display
    - **Property 3: Store list displays all required fields**

    - **Validates: Requirements 4.3**
  - [x] 5.4 Implement empty state for no stores

    - Show message and create button when no stores
    - _Requirements: 4.4_
  - [x] 5.5 Implement error state with retry

    - Show error message on API failure
    - Add retry button
    - _Requirements: 4.5_
  - [ ] 5.6 Implement create store form
    - Input field for display name
    - Validation for empty/whitespace names
    - Call create API on submit
    - Show success/error feedback

    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
  - [ ]* 5.7 Write property test for store name validation
    - **Property 4: Empty store name validation**
    - **Validates: Requirements 5.5**
  - [x] 5.8 Implement delete store with confirmation
    - Show confirmation dialog with warning
    - Call delete API with force=true
    - Remove from list on success
    - Show error on failure
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 6. Create Store Management Panel - Documents View
  - [x] 6.1 Implement view navigation with breadcrumb
    - Add breadcrumb: Stores > {StoreName}
    - Click on Stores to go back
    - _Requirements: 7.6, 10.3_
  - [x] 6.2 Implement documents list table
    - Table columns: Name, State, Size, Type, Actions
    - Fetch documents from API
    - Show loading state
    - _Requirements: 7.1, 7.2, 7.3_
  - [ ]* 6.3 Write property test for document list display
    - **Property 5: Document list displays all required fields**
    - **Validates: Requirements 7.3**
  - [x] 6.4 Implement pagination for documents
    - Show page navigation when nextPageToken exists
    - Load next page on click
    - _Requirements: 7.4_
  - [ ]* 6.5 Write property test for pagination
    - **Property 9: Pagination token handling**
    - **Validates: Requirements 11.5**
  - [x] 6.6 Implement empty state for no documents
    - Show message and upload button
    - _Requirements: 7.5_
  - [x] 6.7 Implement file upload functionality
    - File picker dialog
    - Upload progress indicator
    - Poll operation until complete
    - Refresh list on success
    - Show error on failure
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_
  - [x] 6.8 Implement delete document with confirmation
    - Show confirmation dialog
    - Call delete API
    - Remove from list on success
    - Show error on failure
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [x] 7. Integrate components and add visual feedback
  - [x] 7.1 Connect Store Selector to Store Management Panel
    - Pass onManageClick to open panel
    - Refresh selector when panel closes
    - _Requirements: 3.1_
  - [x] 7.2 Add loading states for all actions
    - Button loading states during API calls
    - Disable interactions while loading
    - _Requirements: 10.4_
  - [x] 7.3 Add responsive layout for mobile

    - Adjust table for smaller screens
    - Stack columns or use card layout on mobile
    - _Requirements: 10.5_

- [ ] 8. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
