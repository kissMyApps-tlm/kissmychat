import type { BuiltinAgentDefinition } from '../../types';
import { BUILTIN_AGENT_SLUGS } from '../../types';
import { systemRole } from './systemRole';

/**
 * KissMyMolfar Agent - corporate knowledge assistant
 *
 * Uses Claude Sonnet 4.6 with kma-notion MCP plugin for Notion knowledge base access.
 * Visible in sidebar (virtual: false).
 */
export const KISS_MY_MOLFAR: BuiltinAgentDefinition = {
  avatar: '/avatars/kiss-my-molfar.png',
  persist: {
    model: 'claude-sonnet-4-6',
    provider: 'anthropic',
    title: 'KissMyMolfar',
    virtual: false,
  },
  runtime: (ctx) => ({
    plugins: ['kma-notion', ...(ctx.plugins || [])],
    systemRole,
  }),
  slug: BUILTIN_AGENT_SLUGS.kissMyMolfar,
};
