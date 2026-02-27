import type { BuiltinToolManifest } from '@lobechat/types';

import { NotionApiName } from './types';

export const NotionManifest: BuiltinToolManifest = {
  identifier: 'kma-notion',
  type: 'builtin',
  meta: {
    avatar: '📚',
    title: 'Notion Knowledge Base',
    description: 'Answer questions from the corporate Notion workspace.',
  },
  systemRole: `You have access to the company's internal Notion knowledge base.
Use the \`${NotionApiName.askKnowledgeBase}\` tool whenever the user asks about internal
processes, documentation, policies, or anything that could be in Notion.
After receiving the tool result, present the answer clearly and list the source pages as
markdown links at the end. If the tool returns "No relevant information found", say so
honestly — do not guess or fabricate Notion content.`,
  api: [
    {
      name: NotionApiName.askKnowledgeBase,
      description:
        'Search the corporate Notion knowledge base and return a factual answer with source page references. Use this for questions about internal processes, documentation, or company policies.',
      parameters: {
        type: 'object',
        properties: {
          question: {
            type: 'string',
            description: 'The natural-language question to look up in Notion (max 2000 chars)',
          },
        },
        required: ['question'],
      },
    },
  ],
};
