import { BuiltinToolManifest } from '@lobechat/types';

import { DEFAULT_TOP_K, MAX_TOP_K, MIN_TOP_K } from './const';
import { systemPrompt } from './systemRole';
import { KmaNotionApiName, KmaNotionIdentifier } from './types';

export const KmaNotionManifest: BuiltinToolManifest = {
  api: [
    {
      description:
        'Perform semantic search over the corporate Notion knowledge base at Kiss My Apps (KMA). Returns relevant page chunks with similarity scores. Use this first to discover which pages contain information relevant to your query. IMPORTANT: Since this uses vector-based semantic search, always resolve pronouns and references to concrete entities before searching.',
      name: KmaNotionApiName.queryVector,
      parameters: {
        properties: {
          query: {
            description:
              'The search query text. Be specific and use concrete entities. IMPORTANT: Resolve all pronouns and references to actual entity names before searching, as vector search works best with concrete terms.',
            type: 'string',
          },
          topK: {
            default: DEFAULT_TOP_K,
            description: `Number of top relevant results to return (default: ${DEFAULT_TOP_K}, min: ${MIN_TOP_K}, max: ${MAX_TOP_K})`,
            maximum: MAX_TOP_K,
            minimum: MIN_TOP_K,
            type: 'number',
          },
        },
        required: ['query'],
        type: 'object',
      },
    },
    {
      description:
        'Get the full content of a specific Notion page by its ID. Use this after query_vector to retrieve complete page information. Returns page content in markdown format along with metadata.',
      name: KmaNotionApiName.getPage,
      parameters: {
        properties: {
          pageId: {
            description:
              'UUID of the Notion page to retrieve. Obtain this from query_vector results.',
            format: 'uuid',
            type: 'string',
          },
        },
        required: ['pageId'],
        type: 'object',
      },
    },
  ],
  identifier: KmaNotionIdentifier,
  meta: {
    avatar: '📔',
    description: 'Search and retrieve information from KMA corporate Notion knowledge base',
    title: 'KMA Notion',
  },
  systemRole: systemPrompt,
  type: 'builtin',
};
