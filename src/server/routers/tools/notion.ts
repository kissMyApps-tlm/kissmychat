import { NotionExecutionRuntime } from '@lobechat/builtin-tool-notion/executionRuntime';
import { z } from 'zod';

import { toolsEnv } from '@/envs/tools';
import { authedProcedure, router } from '@/libs/trpc/lambda';

const runtime = new NotionExecutionRuntime(
  toolsEnv.NOTION_QUERY_TOKEN ?? '',
  toolsEnv.NOTION_API_URL,
);

export const notionRouter = router({
  kma_answer: authedProcedure
    .input(z.object({ question: z.string().max(2000) }))
    .query(async ({ input }) => {
      return runtime.kma_answer(input);
    }),

  kma_query_vector: authedProcedure
    .input(z.object({ query: z.string(), topK: z.number().int().min(1).max(20).optional() }))
    .query(async ({ input }) => {
      return runtime.kma_query_vector(input);
    }),

  kma_get_document: authedProcedure
    .input(z.object({ documentId: z.string().uuid() }))
    .query(async ({ input }) => {
      return runtime.kma_get_document(input);
    }),
});
