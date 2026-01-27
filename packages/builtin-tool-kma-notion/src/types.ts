/**
 * KMA Notion Plugin Identifier
 */
export const KmaNotionIdentifier = 'kma-notion';

/**
 * API Names
 */
export const KmaNotionApiName = {
  getPage: 'get_page',
  queryVector: 'query_vector',
} as const;

/**
 * Query Vector Arguments
 */
export interface QueryVectorArgs {
  query: string;
  topK?: number;
}

/**
 * Query Vector Result Item
 */
export interface QueryVectorResultItem {
  pageId: string;
  score: number;
  text: string;
}

/**
 * Query Vector State
 */
export interface QueryVectorState {
  results: QueryVectorResultItem[];
}

/**
 * Get Page Arguments
 */
export interface GetPageArgs {
  pageId: string;
}

/**
 * Get Page State
 */
export interface GetPageState {
  createdAt: string;
  parentId: string | null;
  text: string;
  updatedAt: string;
}
