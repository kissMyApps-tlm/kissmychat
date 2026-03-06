import { toolsClient } from '@/libs/trpc/client';

class NotionService {
  kma_answer(question: string, options?: { signal?: AbortSignal }) {
    return toolsClient.notion.kma_answer.query({ question }, { signal: options?.signal });
  }

  kma_query_vector(query: string, topK?: number, options?: { signal?: AbortSignal }) {
    return toolsClient.notion.kma_query_vector.query({ query, topK }, { signal: options?.signal });
  }

  kma_get_document(documentId: string, options?: { signal?: AbortSignal }) {
    return toolsClient.notion.kma_get_document.query({ documentId }, { signal: options?.signal });
  }
}

export const notionService = new NotionService();
