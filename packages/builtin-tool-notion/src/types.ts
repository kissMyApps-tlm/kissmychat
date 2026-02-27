export const NotionApiName = {
  askKnowledgeBase: 'askKnowledgeBase',
} as const;

export type NotionApiNameType = (typeof NotionApiName)[keyof typeof NotionApiName];

export interface NotionAskParams {
  question: string;
}

export interface NotionSource {
  pageId: string;
  title: string;
  description?: string;
  url: string;
}

export interface NotionAskResponse {
  answer: string;
  sources: NotionSource[];
}
