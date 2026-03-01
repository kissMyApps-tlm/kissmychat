export const NotionApiName = {
  askKnowledgeBase: 'askKnowledgeBase',
} as const;

export type NotionApiNameType = (typeof NotionApiName)[keyof typeof NotionApiName];

export interface NotionAskParams {
  question: string;
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
