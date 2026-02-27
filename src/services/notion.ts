import { toolsClient } from '@/libs/trpc/client';

class NotionService {
  askKnowledgeBase(question: string, options?: { signal?: AbortSignal }) {
    return toolsClient.notion.askKnowledgeBase.query({ question }, { signal: options?.signal });
  }
}

export const notionService = new NotionService();
