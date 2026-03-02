export const NotionApiName = {
  kma_answer: 'kma_answer',
  kma_get_document: 'kma_get_document',
  kma_query_vector: 'kma_query_vector',
} as const;

export type NotionApiNameType = (typeof NotionApiName)[keyof typeof NotionApiName];

export interface NotionAskParams {
  question: string;
}

export interface NotionVectorSearchParams {
  query: string;
  topK?: number;
}

export interface NotionGetDocumentParams {
  documentId: string;
}

export interface NotionSource {
  description?: string;
  documentId: string;
  title: string;
  url: string;
}

export interface NotionAskResponse {
  answer: string;
  confidence: 'high' | 'medium' | 'low' | 'none';
  sources: NotionSource[];
}

export interface NotionVectorResult {
  documentId: string;
  score: number;
  text: string;
}

export interface NotionVectorSearchResponse {
  results: NotionVectorResult[];
}

export interface NotionGetDocumentResponse {
  createdAt: string;
  parentId: string | null;
  text: string;
  updatedAt: string;
}
