import type { LobeChatDatabase } from '@lobechat/database';

import { AgentModel } from '@/database/models/agent';
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

const KMA_OPENING_MESSAGE =
  'Привіт! Я KissMyMolfar — твій помічник по базі знань KMA в Notion. ' +
  'Запитуй про процеси, політики, проєкти чи людей компанії — ' +
  'я знайду відповідь у нашій базі знань.';

const KMA_SYSTEM_ROLE = `You are KissMyMolfar, a corporate knowledge assistant for KMA employees.

Current model: {{model}}
Today's date: {{date}}

Your role is to:
- Help employees find information from the company's Notion knowledge base
- Always use the **kma_answer** tool for any company-related question before answering from your own knowledge
- Include Notion source links in your responses when available
- Be brief, friendly, and professional

Important rules:
- When a user asks about company processes, policies, people, projects, or any internal topic, call kma_answer first
- The Notion knowledge base is primarily in Ukrainian, sometimes in English or Russian. Interpret content accordingly.
- Default to Ukrainian when responding, unless the user writes in another language — then respond in their language
- If the tool returns relevant Notion pages, include the source links
- If the tool returns no results, let the user know and offer to help with what you do know`;

/** LLM params tuned for factual knowledge retrieval */
const KMA_PARAMS = {
  frequency_penalty: 0.1,
  presence_penalty: 0.1,
  temperature: 0.3,
  top_p: 0.8,
};

/** Agent enrichment config — fields managed by the provisioner */
interface AgentEnrichment {
  avatar?: string;
  openingMessage?: string;
  params?: Record<string, number>;
  pinned?: boolean;
  plugins?: string[];
  systemRole?: string;
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

/** Map of agent slugs to agent enrichment (fields set on agent record if missing) */
const AGENT_ENRICHMENTS: Record<string, AgentEnrichment> = {
  'kiss-my-molfar': {
    avatar: '/avatars/kiss-my-molfar.png',
    openingMessage: KMA_OPENING_MESSAGE,
    params: KMA_PARAMS,
    pinned: true,
    plugins: [KMA_NOTION_IDENTIFIER],
    systemRole: KMA_SYSTEM_ROLE,
  },
};

/**
 * Auto-provision required plugins and enrich agent defaults for builtin agents.
 *
 * - Creates plugin entries (manifest + customParams) if not already present
 * - Sets plugins, systemRole, openingMessage on the agent record if missing
 *
 * Fully self-contained — no changes to upstream DB models needed.
 */
export async function provisionRequiredPlugins(
  slug: string,
  db: LobeChatDatabase,
  userId: string,
): Promise<Record<string, any> | undefined> {
  // --- 1. Provision plugins ---
  const requiredPlugins = REQUIRED_PLUGINS[slug];
  if (requiredPlugins) {
    const pluginModel = new PluginModel(db, userId);

    for (const plugin of requiredPlugins) {
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

  // --- 2. Enrich agent record (plugins, systemRole, openingMessage, etc.) ---
  const enrichment = AGENT_ENRICHMENTS[slug];
  if (!enrichment) return;

  const agentModel = new AgentModel(db, userId);
  const agent = await agentModel.getBuiltinAgent(slug);
  if (!agent) return;

  // Always force-set managed fields to match the current definition.
  // This ensures updates to defaults (e.g. new system prompt, translated greeting)
  // take effect on next deploy without requiring users to delete their agent.
  const updates: Record<string, any> = {};
  if (enrichment.systemRole && agent.systemRole !== enrichment.systemRole) {
    updates.systemRole = enrichment.systemRole;
  }
  if (enrichment.openingMessage && agent.openingMessage !== enrichment.openingMessage) {
    updates.openingMessage = enrichment.openingMessage;
  }
  if (enrichment.avatar && agent.avatar !== enrichment.avatar) {
    updates.avatar = enrichment.avatar;
  }
  // These fields only set if empty — user may have customized them
  if (enrichment.plugins && (!agent.plugins || agent.plugins.length === 0)) {
    updates.plugins = enrichment.plugins;
  }
  if (enrichment.pinned && !agent.pinned) {
    updates.pinned = enrichment.pinned;
  }
  if (enrichment.params && (!agent.params || Object.keys(agent.params).length === 0)) {
    updates.params = enrichment.params;
  }

  if (Object.keys(updates).length > 0) {
    await agentModel.update(agent.id, updates);
  }

  // Return updates so caller can merge them into the current response
  // (the DB is updated for future requests, but the current request
  //  already fetched the old data before provisioning ran)
  return Object.keys(updates).length > 0 ? updates : undefined;
}
