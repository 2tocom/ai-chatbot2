import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import { getUserSettings, upsertUserSettings } from "@/lib/db/queries";
import { ChatSDKError } from "@/lib/errors";

const fileSearchSettingsSchema = z.object({
  fileSearchStoreNames: z.array(z.string()).optional(),
  fileSearchTopK: z.number().int().positive().nullable().optional(),
  selectedStore: z.string().nullable().optional(),
});

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError("unauthorized:chat").toResponse();
  }

  const settings = await getUserSettings({ userId: session.user.id });

  // Validate selectedStore exists in fileSearchStoreNames
  const storeNames = settings?.fileSearchStoreNames ?? [];
  const selectedStore = settings?.selectedStore;
  const validSelectedStore =
    selectedStore && storeNames.includes(selectedStore) ? selectedStore : null;

  return Response.json({
    fileSearchStoreNames: storeNames,
    fileSearchTopK: settings?.fileSearchTopK ?? null,
    selectedStore: validSelectedStore,
  });
}

export async function PUT(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError("unauthorized:chat").toResponse();
  }

  try {
    const body = await request.json();
    const validated = fileSearchSettingsSchema.parse(body);

    // If selectedStore is provided, validate it exists in fileSearchStoreNames
    if (
      validated.selectedStore &&
      validated.fileSearchStoreNames &&
      !validated.fileSearchStoreNames.includes(validated.selectedStore)
    ) {
      validated.selectedStore = null;
    }

    await upsertUserSettings({
      userId: session.user.id,
      ...validated,
    });

    return Response.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new ChatSDKError(
        "bad_request:api",
        "Invalid settings format"
      ).toResponse();
    }
    throw error;
  }
}
