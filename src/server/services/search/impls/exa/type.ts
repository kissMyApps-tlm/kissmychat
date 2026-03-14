export interface ExaContentsOptions {
  highlights?: {
    maxCharacters?: number;
    query?: string;
  };
  livecrawlTimeout?: number;
  maxAgeHours?: number;
  summary?: {
    query?: string;
  };
  text?:
    | boolean
    | {
        includeHtmlTags?: boolean;
        maxCharacters?: number;
        verbosity?: 'compact' | 'standard' | 'full';
      };
}

export interface ExaExtras {
  imageLinks?: number;
  links?: number;
}

export interface ExaSearchParameters {
  category?: string;
  contents?: ExaContentsOptions;
  endCrawlDate?: string;
  endPublishedDate?: string;
  excludeDomains?: string[];
  excludeText?: string[];
  extras?: ExaExtras;
  includeDomains?: string[];
  includeText?: string[];
  moderation?: boolean;
  numResults?: number;
  query: string;
  startCrawlDate?: string;
  startPublishedDate?: string;
  subpageTarget?: string | string[];
  subpages?: number;
  type?: string;
}

interface ExaCostDollars {
  total: number;
}

interface ExaResults {
  author?: string | null;
  favicon?: string;
  highlights?: string[];
  id?: string;
  image?: string;
  publishedDate?: string | null;
  score?: number | null;
  summary?: string;
  text?: string;
  title: string;
  url: string;
}

export interface ExaResponse {
  costDollars?: ExaCostDollars;
  requestId?: string;
  resolvedSearchType?: string;
  results: ExaResults[];
  searchType?: string;
}
