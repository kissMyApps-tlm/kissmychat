import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

const optionalNumberEnv = (min: number, max: number) =>
  z.preprocess(
    (value) => (value === '' || value === null ? undefined : value),
    z.coerce.number().int().max(max).min(min).optional(),
  );

export const getToolsConfig = () => {
  return createEnv({
    runtimeEnv: {
      CRAWL_CONCURRENCY: process.env.CRAWL_CONCURRENCY,
      CRAWLER_RETRY: process.env.CRAWLER_RETRY,
      CRAWLER_IMPLS: process.env.CRAWLER_IMPLS,
      NOTION_API_URL: process.env.NOTION_API_URL,
      NOTION_QUERY_TOKEN: process.env.NOTION_QUERY_TOKEN,
      SEARCH_PROVIDERS: process.env.SEARCH_PROVIDERS,
      SEARXNG_URL: process.env.SEARXNG_URL,
    },

    server: {
      CRAWL_CONCURRENCY: optionalNumberEnv(1, 10),
      CRAWLER_RETRY: optionalNumberEnv(0, 3),
      CRAWLER_IMPLS: z.string().optional(),
      NOTION_API_URL: z.string().url().optional(),
      NOTION_QUERY_TOKEN: z.string().optional(),
      SEARCH_PROVIDERS: z.string().optional(),
      SEARXNG_URL: z.string().url().optional(),
    },
  });
};

export const toolsEnv = getToolsConfig();
