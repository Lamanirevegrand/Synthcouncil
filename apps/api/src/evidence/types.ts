export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

export interface FetchedPage {
  url: string;
  title: string;
  content: string;
}

export interface EvidencePack {
  query: string;
  results: SearchResult[];
  pages: FetchedPage[];
}

export interface EvidenceProvider {
  readonly mode: string;
  search(query: string, limit?: number): Promise<SearchResult[]>;
  fetchPage(url: string): Promise<FetchedPage>;
}

export class EvidenceError extends Error {
  constructor(message: string, readonly source?: string) {
    super(message);
    this.name = 'EvidenceError';
  }
}
