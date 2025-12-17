import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import { ChatSDKError } from "@/lib/errors";
import { createStore, listStores } from "@/lib/file-search/api";

const createStoreSchema = z.object({
  displayName: z.string().min(1).max(512),
});

/**
 * GET /api/file-search/stores
 * List all FileSearchStores from Gemini API
 */
export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError("unauthorized:chat").toResponse();
  }

  try {
    const { searchParams } = new URL(request.url);
    const pageSize = searchParams.get("pageSize");
    const pageToken = searchParams.get("pageToken");

    const response = await listStores({
      pageSize: pageSize ? Number.parseInt(pageSize, 10) : undefined,
      pageToken: pageToken || undefined,
    });

    return Response.json(response);
  } catch (error) {
    console.error("Failed to list stores:", error);
    return new ChatSDKError(
      "bad_request:api",
      error instanceof Error ? error.message : "Failed to list stores"
    ).toResponse();
  }
}

/**
 * POST /api/file-search/stores
 * Create a new FileSearchStore
 */
export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError("unauthorized:chat").toResponse();
  }

  try {
    const body = await request.json();
    const validated = createStoreSchema.parse(body);

    const store = await createStore(validated);

    return Response.json(store, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new ChatSDKError(
        "bad_request:api",
        "Invalid store name"
      ).toResponse();
    }
    console.error("Failed to create store:", error);
    return new ChatSDKError(
      "bad_request:api",
      error instanceof Error ? error.message : "Failed to create store"
    ).toResponse();
  }
}
