import type { BuiltinServerRuntimeOutput } from '@lobechat/types';

import type {
  NotionAskParams,
  NotionAskResponse,
  NotionGetDocumentParams,
  NotionGetDocumentResponse,
  NotionVectorSearchParams,
  NotionVectorSearchResponse,
} from '../types';

const DEFAULT_API_URL = 'https://mcp-my-notion.fly.dev';

export class NotionExecutionRuntime {
  private token: string;
  private baseUrl: string;

  constructor(token: string, baseUrl?: string) {
    this.token = token;
    this.baseUrl = baseUrl ?? DEFAULT_API_URL;
  }

  private get headers() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`,
    };
  }

  async kma_answer(
    args: NotionAskParams,
    options?: { signal?: AbortSignal },
  ): Promise<BuiltinServerRuntimeOutput> {
    const res = await fetch(`${this.baseUrl}/search/answer`, {
      method: 'POST',
      headers: this.headers,
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

    const confidenceLine = `**Confidence:** ${data.confidence}`;

    const content =
      data.sources.length > 0
        ? `${data.answer}\n\n${confidenceLine}\n\n**Sources:**\n${sourceLines.join('\n')}`
        : `${data.answer}\n\n${confidenceLine}`;

    return { content, state: data, success: true };
  }

  async kma_query_vector(
    args: NotionVectorSearchParams,
    options?: { signal?: AbortSignal },
  ): Promise<BuiltinServerRuntimeOutput> {
    const res = await fetch(`${this.baseUrl}/search/vector`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({ query: args.query, topK: args.topK }),
      signal: options?.signal,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      return { content: err.message, error: err, success: false };
    }

    const data: NotionVectorSearchResponse = await res.json();

    const resultLines = data.results.map(
      (r) => `- [score: ${r.score.toFixed(3)}] (${r.documentId})\n  ${r.text.slice(0, 200)}`,
    );

    const content =
      data.results.length > 0
        ? `**Vector search results:**\n${resultLines.join('\n')}`
        : 'No results found.';

    return { content, state: data, success: true };
  }

  async kma_get_document(
    args: NotionGetDocumentParams,
    options?: { signal?: AbortSignal },
  ): Promise<BuiltinServerRuntimeOutput> {
    const res = await fetch(`${this.baseUrl}/documents/${encodeURIComponent(args.documentId)}`, {
      method: 'GET',
      headers: this.headers,
      signal: options?.signal,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      return { content: err.message, error: err, success: false };
    }

    const data: NotionGetDocumentResponse = await res.json();

    const meta = `*Updated: ${data.updatedAt}${data.parentId ? ` | Parent: ${data.parentId}` : ''}*`;
    const content = `${meta}\n\n${data.text}`;

    return { content, state: data, success: true };
  }
}
