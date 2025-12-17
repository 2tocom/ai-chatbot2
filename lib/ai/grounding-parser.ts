import type { GroundingChunk, GroundingMetadata } from "@/lib/types";

export type ParsedSource = {
  title: string;
  text: string;
  store: string;
};

export const extractSources = (
  metadata: GroundingMetadata | undefined
): ParsedSource[] => {
  if (!metadata?.groundingChunks) {
    return [];
  }

  const seen = new Set<string>();
  const sources: ParsedSource[] = [];

  for (const chunk of metadata.groundingChunks) {
    const { title, text, fileSearchStore } = chunk.retrievedContext;
    if (!seen.has(title)) {
      seen.add(title);
      sources.push({ title, text, store: fileSearchStore });
    }
  }

  return sources;
};

export const mapSupportsToChunks = (
  supports: GroundingMetadata["groundingSupports"],
  chunks: GroundingChunk[]
): Map<string, string[]> => {
  const mapping = new Map<string, string[]>();

  if (!supports || !chunks) {
    return mapping;
  }

  for (const support of supports) {
    const titles = support.groundingChunkIndices
      .map((idx) => chunks[idx]?.retrievedContext.title)
      .filter(Boolean);

    if (titles.length > 0) {
      mapping.set(support.segment.text, titles);
    }
  }

  return mapping;
};
