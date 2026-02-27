import type { BuiltinServerRuntimeOutput } from '@lobechat/types';

import type { NotionAskParams, NotionAskResponse } from '../types';

const DEFAULT_API_URL = 'https://mcp-my-notion.fly.dev';

export class NotionExecutionRuntime {
  private token: string;
  private baseUrl: string;

  constructor(token: string, baseUrl?: string) {
    this.token = token;
    this.baseUrl = baseUrl ?? DEFAULT_API_URL;
  }

  async askKnowledgeBase(
    args: NotionAskParams,
    options?: { signal?: AbortSignal },
  ): Promise<BuiltinServerRuntimeOutput> {
    const res = await fetch(`${this.baseUrl}/search/answer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.token}`,
      },
      body: JSON.stringify({ question: args.question }),
      signal: options?.signal,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      return { content: err.message, error: err, success: false };
    }

    const data: NotionAskResponse = await res.json();

    const sourceLines = data.sources.map(
      (s) => `- [${s.title}](${s.url})${s.description ? `: ${s.description}` : ''}`,
    );

    const content =
      data.sources.length > 0
        ? `${data.answer}\n\n**Sources:**\n${sourceLines.join('\n')}`
        : data.answer;

    return { content, state: data, success: true };
  }
}
