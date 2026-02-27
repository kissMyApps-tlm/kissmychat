import { z } from 'zod';

import { toolsEnv } from '@/envs/tools';
import { authedProcedure, router } from '@/libs/trpc/lambda';
import { NotionExecutionRuntime } from '@lobechat/builtin-tool-notion/executionRuntime';

const runtime = new NotionExecutionRuntime(toolsEnv.NOTION_QUERY_TOKEN ?? '', toolsEnv.NOTION_API_URL);

export const notionRouter = router({
  askKnowledgeBase: authedProcedure
    .input(z.object({ question: z.string().max(2000) }))
    .query(async ({ input }) => {
      return runtime.askKnowledgeBase(input);
    }),
});
