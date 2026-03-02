import { NotionApiName, NotionManifest } from '@lobechat/builtin-tool-notion';
import type { BuiltinToolContext, BuiltinToolResult } from '@lobechat/types';
import { BaseExecutor } from '@lobechat/types';

import { notionService } from '@/services/notion';

class NotionExecutor extends BaseExecutor<typeof NotionApiName> {
  readonly identifier = NotionManifest.identifier;
  protected readonly apiEnum = NotionApiName;

  kma_answer = async (
    params: { question: string },
    ctx: BuiltinToolContext,
  ): Promise<BuiltinToolResult> => {
    if (ctx.signal?.aborted) return { stop: true, success: false };

    try {
      const result = await notionService.kma_answer(params.question, { signal: ctx.signal });
      return { content: result.content, state: result.state, success: true };
    } catch (e) {
      const err = e as Error;
      if (err.name === 'AbortError' || err.message.includes('The user aborted a request.')) {
        return { stop: true, success: false };
      }
      return {
        error: { body: e, message: err.message, type: 'PluginServerError' },
        success: false,
      };
    }
  };

  kma_query_vector = async (
    params: { query: string; topK?: number },
    ctx: BuiltinToolContext,
  ): Promise<BuiltinToolResult> => {
    if (ctx.signal?.aborted) return { stop: true, success: false };

    try {
      const result = await notionService.kma_query_vector(params.query, params.topK, {
        signal: ctx.signal,
      });
      return { content: result.content, state: result.state, success: true };
    } catch (e) {
      const err = e as Error;
      if (err.name === 'AbortError' || err.message.includes('The user aborted a request.')) {
        return { stop: true, success: false };
      }
      return {
        error: { body: e, message: err.message, type: 'PluginServerError' },
        success: false,
      };
    }
  };

  kma_get_document = async (
    params: { documentId: string },
    ctx: BuiltinToolContext,
  ): Promise<BuiltinToolResult> => {
    if (ctx.signal?.aborted) return { stop: true, success: false };

    try {
      const result = await notionService.kma_get_document(params.documentId, {
        signal: ctx.signal,
      });
      return { content: result.content, state: result.state, success: true };
    } catch (e) {
      const err = e as Error;
      if (err.name === 'AbortError' || err.message.includes('The user aborted a request.')) {
        return { stop: true, success: false };
      }
      return {
        error: { body: e, message: err.message, type: 'PluginServerError' },
        success: false,
      };
    }
  };
}

export const notionExecutor = new NotionExecutor();
