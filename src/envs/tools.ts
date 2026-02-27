import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const getToolsConfig = () => {
  return createEnv({
    runtimeEnv: {
      CRAWLER_IMPLS: process.env.CRAWLER_IMPLS,
      NOTION_API_URL: process.env.NOTION_API_URL,
      NOTION_QUERY_TOKEN: process.env.NOTION_QUERY_TOKEN,
      SEARCH_PROVIDERS: process.env.SEARCH_PROVIDERS,
      SEARXNG_URL: process.env.SEARXNG_URL,
    },

    server: {
      CRAWLER_IMPLS: z.string().optional(),
      NOTION_API_URL: z.string().url().optional(),
      NOTION_QUERY_TOKEN: z.string().optional(),
      SEARCH_PROVIDERS: z.string().optional(),
      SEARXNG_URL: z.string().url().optional(),
    },
  });
};

export const toolsEnv = getToolsConfig();
