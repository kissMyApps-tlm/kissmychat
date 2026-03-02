import { NotionManifest } from '@lobechat/builtin-tool-notion';

import type { BuiltinAgentDefinition } from '../../types';
import { BUILTIN_AGENT_SLUGS } from '../../types';
import { systemRole } from './systemRole';

const OPENING_MESSAGE =
  'Привіт! Я KissMyMolfar — твій помічник по базі знань KMA в Notion. ' +
  'Запитуй про процеси, політики, проєкти чи людей компанії — ' +
  'я знайду відповідь у нашій базі знань.';

/**
 * KissMyMolfar Agent - corporate knowledge assistant
 *
 * Uses Claude Sonnet 4.6 with kma-notion builtin tool for Notion knowledge base access.
 * Visible in sidebar (virtual: false).
 */
export const KISS_MY_MOLFAR: BuiltinAgentDefinition = {
  avatar: '/avatars/kiss-my-molfar.png',
  persist: {
    model: 'claude-sonnet-4-6',
    openingMessage: OPENING_MESSAGE,
    params: {
      frequency_penalty: 0.1,
      presence_penalty: 0.1,
      temperature: 0.3,
      top_p: 0.8,
    },
    pinned: true,
    plugins: [NotionManifest.identifier],
    provider: 'anthropic',
    title: 'KissMyMolfar',
    virtual: false,
  },
  runtime: (ctx) => ({
    plugins: [NotionManifest.identifier, ...(ctx.plugins || [])],
    systemRole,
  }),
  slug: BUILTIN_AGENT_SLUGS.kissMyMolfar,
};
