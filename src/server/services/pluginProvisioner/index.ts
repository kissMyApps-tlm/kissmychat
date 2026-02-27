import type { LobeChatDatabase } from '@lobechat/database';

import { PluginModel } from '@/database/models/plugin';

const KMA_NOTION_IDENTIFIER = 'kma-notion';
const KMA_NOTION_MCP_URL = 'https://mcp-my-notion.fly.dev/mcp';

function getKmaNotionManifest() {
  return {
    api: [
      {
        description: 'Answer a company-related question using the Notion knowledge base',
        name: 'kma_answer',
        parameters: {
          properties: {
            question: { description: 'The question to answer', type: 'string' },
          },
          required: ['question'],
          type: 'object',
        },
      },
      {
        description: 'Query the vector index for relevant Notion pages',
        name: 'kma_query_vector',
        parameters: {
          properties: {
            limit: { description: 'Max results to return', type: 'number' },
            query: { description: 'Search query', type: 'string' },
          },
          required: ['query'],
          type: 'object',
        },
      },
      {
        description: 'Get the full content of a Notion page by ID',
        name: 'kma_get_page',
        parameters: {
          properties: {
            page_id: { description: 'Notion page ID', type: 'string' },
          },
          required: ['page_id'],
          type: 'object',
        },
      },
    ],
    identifier: KMA_NOTION_IDENTIFIER,
    meta: {
      description: 'Corporate Notion knowledge base for KMA',
      title: 'Notion KMA',
    },
    type: 'mcp' as const,
  };
}

function getKmaNotionCustomParams() {
  return {
    mcp: {
      auth: {
        token: process.env.MCP_NOTION_AUTH_TOKEN || '',
        type: 'bearer' as const,
      },
      type: 'http' as const,
      url: KMA_NOTION_MCP_URL,
    },
  };
}

/** Map of agent slugs to their required plugins */
const REQUIRED_PLUGINS: Record<
  string,
  { getCustomParams: () => any; getManifest: () => any; identifier: string }[]
> = {
  'kiss-my-molfar': [
    {
      getCustomParams: getKmaNotionCustomParams,
      getManifest: getKmaNotionManifest,
      identifier: KMA_NOTION_IDENTIFIER,
    },
  ],
};

/**
 * Auto-provision required plugins for a builtin agent.
 * Checks before creating to avoid overwriting user-modified settings.
 */
export async function provisionRequiredPlugins(
  slug: string,
  db: LobeChatDatabase,
  userId: string,
) {
  const plugins = REQUIRED_PLUGINS[slug];
  if (!plugins) return;

  const pluginModel = new PluginModel(db, userId);

  for (const plugin of plugins) {
    const existing = await pluginModel.findById(plugin.identifier);
    if (existing) continue;

    await pluginModel.create({
      customParams: plugin.getCustomParams(),
      identifier: plugin.identifier,
      manifest: plugin.getManifest(),
      type: 'plugin',
    });
  }
}
