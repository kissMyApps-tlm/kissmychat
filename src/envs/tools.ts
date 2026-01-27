import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const getToolsConfig = () => {
  return createEnv({
    runtimeEnv: {
      CRAWLER_IMPLS: process.env.CRAWLER_IMPLS,
      KMA_NOTION_MCP_AUTH_KEY: process.env.KMA_NOTION_MCP_AUTH_KEY,
      KMA_NOTION_MCP_URL: process.env.KMA_NOTION_MCP_URL,
      SEARCH_PROVIDERS: process.env.SEARCH_PROVIDERS,
      SEARXNG_URL: process.env.SEARXNG_URL,
    },

    server: {
      CRAWLER_IMPLS: z.string().optional(),
      KMA_NOTION_MCP_AUTH_KEY: z.string().optional(),
      KMA_NOTION_MCP_URL: z.string().url().optional(),
      SEARCH_PROVIDERS: z.string().optional(),
      SEARXNG_URL: z.string().url().optional(),
    },
  });
};

export const toolsEnv = getToolsConfig();
