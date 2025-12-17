import { auth } from "@/app/(auth)/auth";
import { ChatSDKError } from "@/lib/errors";
import { deleteStore, getStore } from "@/lib/file-search/api";

type RouteParams = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/file-search/stores/[id]
 * Get a single FileSearchStore by ID
 */
export async function GET(_request: Request, { params }: RouteParams) {
  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError("unauthorized:chat").toResponse();
  }

  try {
    const { id } = await params;
    const store = await getStore(id);
    return Response.json(store);
  } catch (error) {
    console.error("Failed to get store:", error);
    return new ChatSDKError(
      "bad_request:api",
      error instanceof Error ? error.message : "Failed to get store"
    ).toResponse();
  }
}

/**
 * DELETE /api/file-search/stores/[id]
 * Delete a FileSearchStore (with force=true to delete all documents)
 */
export async function DELETE(_request: Request, { params }: RouteParams) {
  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError("unauthorized:chat").toResponse();
  }

  try {
    const { id } = await params;
    await deleteStore(id, true);
    return Response.json({ success: true });
  } catch (error) {
    console.error("Failed to delete store:", error);
    return new ChatSDKError(
      "bad_request:api",
      error instanceof Error ? error.message : "Failed to delete store"
    ).toResponse();
  }
}
