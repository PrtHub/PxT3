export interface WebSearchConfig {
  enabled: boolean;
  maxResults?: number;
  searchPrompt?: string;
}

export interface WebSearchResult {
  url: string;
  title: string;
  content: string;
  startIndex: number;
  endIndex: number;
}

export interface WebSearchMessage {
  role: "assistant";
  content: string;
  annotations: Array<{
    type: "url_citation";
    url_citation: WebSearchResult;
  }>;
}

export function extractWebSearchResults(
  message: WebSearchMessage
): WebSearchResult[] {
  if (!message?.annotations) return [];

  return message.annotations
    .filter(
      (a: { type: string; url_citation: WebSearchResult }) =>
        a.type === "url_citation" && a.url_citation
    )
    .map((a: { url_citation: WebSearchResult }) => a.url_citation);
}
