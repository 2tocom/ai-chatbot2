import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import { ChatSDKError } from "@/lib/errors";
import { getOperation, uploadToStore } from "@/lib/file-search/api";

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

const uploadSchema = z.object({
  storeName: z.string().min(1),
  displayName: z.string().optional(),
});

/**
 * POST /api/file-search/upload
 * Upload a file to a FileSearchStore
 * Expects multipart/form-data with:
 * - file: The file to upload
 * - storeName: The store to upload to
 * - displayName: Optional display name for the document
 */
export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError("unauthorized:chat").toResponse();
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const storeName = formData.get("storeName") as string | null;
    const displayName = formData.get("displayName") as string | null;

    if (!file) {
      return new ChatSDKError(
        "bad_request:api",
        "File is required"
      ).toResponse();
    }

    if (!storeName) {
      return new ChatSDKError(
        "bad_request:api",
        "storeName is required"
      ).toResponse();
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return new ChatSDKError(
        "bad_request:api",
        "File size must be under 100MB"
      ).toResponse();
    }

    // Validate inputs
    uploadSchema.parse({ storeName, displayName });

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Upload to Gemini
    const operation = await uploadToStore(storeName, buffer, file.name, {
      displayName: displayName || file.name,
      mimeType: file.type || undefined,
    });

    return Response.json(operation, { status: 202 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new ChatSDKError(
        "bad_request:api",
        "Invalid upload parameters"
      ).toResponse();
    }
    console.error("Failed to upload file:", error);
    return new ChatSDKError(
      "bad_request:api",
      error instanceof Error ? error.message : "Failed to upload file"
    ).toResponse();
  }
}

/**
 * GET /api/file-search/upload?operationName=xxx
 * Get the status of an upload operation
 */
export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError("unauthorized:chat").toResponse();
  }

  try {
    const { searchParams } = new URL(request.url);
    const operationName = searchParams.get("operationName");

    if (!operationName) {
      return new ChatSDKError(
        "bad_request:api",
        "operationName is required"
      ).toResponse();
    }

    const operation = await getOperation(operationName);
    return Response.json(operation);
  } catch (error) {
    console.error("Failed to get operation:", error);
    return new ChatSDKError(
      "bad_request:api",
      error instanceof Error ? error.message : "Failed to get operation status"
    ).toResponse();
  }
}
