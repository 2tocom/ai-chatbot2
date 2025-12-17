import { auth } from "@/app/(auth)/auth";
import { ChatSDKError } from "@/lib/errors";
import { deleteDocument, listDocuments } from "@/lib/file-search/api";

type RouteParams = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/file-search/stores/[id]/documents
 * List all documents in a FileSearchStore
 */
export async function GET(request: Request, { params }: RouteParams) {
  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError("unauthorized:chat").toResponse();
  }

  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const pageSize = searchParams.get("pageSize");
    const pageToken = searchParams.get("pageToken");

    const response = await listDocuments(id, {
      pageSize: pageSize ? Number.parseInt(pageSize, 10) : undefined,
      pageToken: pageToken || undefined,
    });

    return Response.json(response);
  } catch (error) {
    console.error("Failed to list documents:", error);
    return new ChatSDKError(
      "bad_request:api",
      error instanceof Error ? error.message : "Failed to list documents"
    ).toResponse();
  }
}

/**
 * DELETE /api/file-search/stores/[id]/documents
 * Delete a document from a FileSearchStore
 * Expects documentName in query params
 */
export async function DELETE(request: Request, { params }: RouteParams) {
  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError("unauthorized:chat").toResponse();
  }

  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const documentName = searchParams.get("documentName");

    if (!documentName) {
      return new ChatSDKError(
        "bad_request:api",
        "documentName is required"
      ).toResponse();
    }

    // Build full document name if not provided
    const fullName = documentName.includes("/documents/")
      ? documentName
      : `fileSearchStores/${id}/documents/${documentName}`;

    await deleteDocument(fullName, true);
    return Response.json({ success: true });
  } catch (error) {
    console.error("Failed to delete document:", error);
    return new ChatSDKError(
      "bad_request:api",
      error instanceof Error ? error.message : "Failed to delete document"
    ).toResponse();
  }
}
