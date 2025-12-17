import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText, tool } from "ai";
import { z } from "zod";

export type FileSearchConfig = {
  fileSearchStoreNames: string[];
  topK?: number | null;
  fileSearchTopK?: number | null;
};

// Create Google provider with custom API key (supports GEMINI_API_KEY)
const getGoogleProvider = () => {
  const apiKey =
    process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Missing API key. Set GEMINI_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY"
    );
  }
  return createGoogleGenerativeAI({ apiKey });
};

/**
 * Creates a file search tool that uses Gemini 2.5 Flash to search in a store.
 * This tool can be used with any model - it internally uses Gemini 2.5 Flash
 * to perform the actual file search and returns the results.
 */
export const createFileSearchTool = (config?: FileSearchConfig | null) => {
  if (!config || config.fileSearchStoreNames.length === 0) {
    return null;
  }

  const storeName = config.fileSearchStoreNames[0];
  const topK = config.topK;

  return tool({
    description:
      "Search for information in the configured file search store. Use this tool when the user asks about documents, files, or specific information that might be stored in the knowledge base.",
    inputSchema: z.object({
      query: z
        .string()
        .describe("The search query to find relevant information"),
    }),
    execute: async ({ query }) => {
      try {
        const google = getGoogleProvider();
        // Use Gemini 2.5 Flash with file search capability
        const result = await generateText({
          model: google("gemini-2.5-pro"),
          // model: google("gemini-2.5-flash"),
          prompt: query,
          tools: {
            file_search: google.tools.fileSearch({
              fileSearchStoreNames: [storeName],
              ...(topK && { topK }),
            }) as any,
          },
        });

        // Extract the text response which includes file search results
        return {
          success: true,
          query,
          results: result.text || "No results found",
          storeName,
        };
      } catch (error) {
        console.error("File search error:", error);
        return {
          success: false,
          query,
          error: error instanceof Error ? error.message : "Search failed",
          storeName,
        };
      }
    },
  });
};

/**
 * Checks if file search is available (config has store names).
 */
export const isFileSearchAvailable = (
  config?: FileSearchConfig | null
): boolean => {
  return !!config && config.fileSearchStoreNames.length > 0;
};
