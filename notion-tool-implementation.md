# Notion Built-in Tool — Implementation Guide

How to add a `kma-notion` built-in tool that lets the AI answer questions from the
corporate Notion workspace via the indexing-proxy service at `https://mcp-my-notion.fly.dev`.

---

## How the proxy service is used

The proxy exposes three endpoints (see `notion-rest-api.md`):

| Endpoint | Purpose | When to call |
|---|---|---|
| `POST /search/answer` | Hybrid search + AI-generated answer + sources | Primary tool call |
| `POST /search/vector` | Raw semantic chunks, no AI answer | Optional: deeper analysis |
| `GET /pages/:pageId` | Full Markdown content of one page | Optional: source preview |

For chat integration only `POST /search/answer` is needed. The response already contains
a short factual answer and Notion source links — the AI just formats them for the user.

Auth: every request needs `Authorization: Bearer <QUERY_AUTH_TOKEN>`. The token must
**never** reach the browser — all HTTP calls to the proxy happen server-side only.

---

## Execution flow

There are two execution paths depending on context:

**Regular browser-based chat** (the common case):
```
AI tool call
  → browser: pluginTypes.invokeBuiltinTool()
    → client executor: notionService.askKnowledgeBase()   ← TRPC call
      → server: TRPC router reads NOTION_QUERY_TOKEN
        → NotionExecutionRuntime: fetch() to proxy
```

**Server-side agent** (AgentRuntimeService, background jobs, webhooks):
```
AI tool call
  → BuiltinToolsExecutor.execute()
    → server runtime: NotionExecutionRuntime with token
```

Both paths call `NotionExecutionRuntime` on the server — the token never leaves Node.js.

---

## Architecture overview (where each file lives)

```
packages/builtin-tool-notion/               ← new monorepo package
  package.json
  src/
    index.ts                                ← re-exports manifest + types
    manifest.ts                             ← BuiltinToolManifest (LLM-facing schema)
    types.ts                                ← API name enum + parameter/response types
    ExecutionRuntime/
      index.ts                              ← pure HTTP calls to the proxy (server-only)

src/envs/tools.ts                           ← add NOTION_QUERY_TOKEN env var

src/services/notion.ts                      ← client-side service (TRPC calls)

src/server/routers/tools/
  notion.ts                                 ← new TRPC router (reads token, calls runtime)
  index.ts                                  ← register notionRouter

src/server/services/toolExecution/serverRuntimes/
  notion.ts                                 ← server runtime registration
  index.ts                                  ← register notionRuntime

src/store/tool/slices/builtin/executors/
  lobe-notion.ts                            ← client executor (calls notionService via TRPC)
  index.ts                                  ← register notionExecutor

src/tools/
  identifiers.ts                            ← add 'lobe-notion' identifier
  index.ts                                  ← register NotionManifest in builtinTools[]
```

---

## Step-by-step implementation

### Step 1 — Create the package

**`packages/builtin-tool-notion/package.json`**

```json
{
  "name": "@lobechat/builtin-tool-notion",
  "version": "1.0.0",
  "private": true,
  "exports": {
    ".": "./src/index.ts",
    "./executionRuntime": "./src/ExecutionRuntime/index.ts"
  },
  "main": "./src/index.ts",
  "devDependencies": {
    "@lobechat/types": "workspace:*"
  }
}
```

No UI client package needed for the minimal version — the default tool message bubble is sufficient.

---

### Step 2 — Define the API types

**`packages/builtin-tool-notion/src/types.ts`**

```typescript
export const NotionApiName = {
  askKnowledgeBase: 'askKnowledgeBase',
} as const;

export type NotionApiNameType = (typeof NotionApiName)[keyof typeof NotionApiName];

export interface NotionAskParams {
  question: string;
}

export interface NotionSource {
  pageId: string;
  title: string;
  description?: string;
  url: string;
}

export interface NotionAskResponse {
  answer: string;
  sources: NotionSource[];
}
```

---

### Step 3 — Write the manifest (LLM-facing schema)

**`packages/builtin-tool-notion/src/manifest.ts`**

```typescript
import type { BuiltinToolManifest } from '@lobechat/types';
import { NotionApiName } from './types';

export const NotionManifest: BuiltinToolManifest = {
  identifier: 'lobe-notion',
  type: 'builtin',
  meta: {
    avatar: '📚',
    title: 'Notion Knowledge Base',
    description: 'Answer questions from the corporate Notion workspace.',
  },
  systemRole: `You have access to the company's internal Notion knowledge base.
Use the \`${NotionApiName.askKnowledgeBase}\` tool whenever the user asks about internal
processes, documentation, policies, or anything that could be in Notion.
After receiving the tool result, present the answer clearly and list the source pages as
markdown links at the end. If the tool returns "No relevant information found", say so
honestly — do not guess or fabricate Notion content.`,
  api: [
    {
      name: NotionApiName.askKnowledgeBase,
      description:
        'Search the corporate Notion knowledge base and return a factual answer with source page references. Use this for questions about internal processes, documentation, or company policies.',
      parameters: {
        type: 'object',
        properties: {
          question: {
            type: 'string',
            description: 'The natural-language question to look up in Notion (max 2000 chars)',
          },
        },
        required: ['question'],
      },
    },
  ],
};
```

---

### Step 4 — Implement the HTTP runtime

This class only ever runs on the server — it receives the token via constructor and calls
the proxy directly. It is used both by the TRPC router (step 6) and the server-side
agent runtime (step 7).

**`packages/builtin-tool-notion/src/ExecutionRuntime/index.ts`**

```typescript
import type { BuiltinServerRuntimeOutput } from '@lobechat/types';
import type { NotionAskParams, NotionAskResponse } from '../types';

const BASE_URL = 'https://mcp-my-notion.fly.dev';

export class NotionExecutionRuntime {
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  async askKnowledgeBase(
    args: NotionAskParams,
    options?: { signal?: AbortSignal },
  ): Promise<BuiltinServerRuntimeOutput> {
    const res = await fetch(`${BASE_URL}/search/answer`, {
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
```

---

### Step 5 — Package barrel

**`packages/builtin-tool-notion/src/index.ts`**

```typescript
export * from './manifest';
export * from './types';
```

---

### Step 6 — Add the env var

**`src/envs/tools.ts`** — add `NOTION_QUERY_TOKEN` to the `server:` block (never `client:`):

```typescript
export const getToolsConfig = () => {
  return createEnv({
    runtimeEnv: {
      CRAWLER_IMPLS: process.env.CRAWLER_IMPLS,
      NOTION_QUERY_TOKEN: process.env.NOTION_QUERY_TOKEN,   // ← add
      SEARCH_PROVIDERS: process.env.SEARCH_PROVIDERS,
      SEARXNG_URL: process.env.SEARXNG_URL,
    },
    server: {
      CRAWLER_IMPLS: z.string().optional(),
      NOTION_QUERY_TOKEN: z.string().optional(),             // ← add
      SEARCH_PROVIDERS: z.string().optional(),
      SEARXNG_URL: z.string().url().optional(),
    },
  });
};
```

Set `NOTION_QUERY_TOKEN=<your token>` in `.env` / Docker / deployment config.

---

### Step 7 — Add the TRPC router

The browser-based client executor cannot access `NOTION_QUERY_TOKEN` directly. The
standard pattern in this codebase (same as web-browsing search) is a TRPC procedure that
runs server-side, reads the token, and calls `NotionExecutionRuntime`.

**`src/server/routers/tools/notion.ts`** (new file)

```typescript
import { z } from 'zod';

import { toolsEnv } from '@/envs/tools';
import { authedProcedure, router } from '@/libs/trpc/lambda';
import { NotionExecutionRuntime } from '@lobechat/builtin-tool-notion/executionRuntime';

const runtime = new NotionExecutionRuntime(toolsEnv.NOTION_QUERY_TOKEN ?? '');

export const notionRouter = router({
  askKnowledgeBase: authedProcedure
    .input(z.object({ question: z.string().max(2000) }))
    .query(async ({ input, ctx }) => {
      return runtime.askKnowledgeBase(input, { signal: ctx.signal });
    }),
});
```

**`src/server/routers/tools/index.ts`** — register it:

```typescript
import { notionRouter } from './notion';

export const toolsRouter = router({
  healthcheck: publicProcedure.query(() => "i'm live!"),
  klavis: klavisRouter,
  market: marketRouter,
  mcp: mcpRouter,
  notion: notionRouter,   // ← add
  search: searchRouter,
});
```

---

### Step 8 — Add the client-side service

Mirrors `src/services/search.ts` — a thin wrapper that issues TRPC calls.

**`src/services/notion.ts`** (new file)

```typescript
import { toolsClient } from '@/libs/trpc/client';

class NotionService {
  askKnowledgeBase(question: string, options?: { signal?: AbortSignal }) {
    return toolsClient.notion.askKnowledgeBase.query({ question }, { signal: options?.signal });
  }
}

export const notionService = new NotionService();
```

---

### Step 9 — Register the server-side runtime

Used by `AgentRuntimeService` / background agents (not browser chat).

**`src/server/services/toolExecution/serverRuntimes/notion.ts`** (new file)

```typescript
import { NotionManifest } from '@lobechat/builtin-tool-notion';
import { NotionExecutionRuntime } from '@lobechat/builtin-tool-notion/executionRuntime';

import { toolsEnv } from '@/envs/tools';

import type { ServerRuntimeRegistration } from './types';

const runtime = new NotionExecutionRuntime(toolsEnv.NOTION_QUERY_TOKEN ?? '');

export const notionRuntime: ServerRuntimeRegistration = {
  factory: () => runtime,
  identifier: NotionManifest.identifier,
};
```

**`src/server/services/toolExecution/serverRuntimes/index.ts`** — add to `registerRuntimes`:

```typescript
import { notionRuntime } from './notion';

registerRuntimes([webBrowsingRuntime, cloudSandboxRuntime, notebookRuntime, skillsRuntime, notionRuntime]);
```

---

### Step 10 — Register the client-side executor

The executor runs in the browser. It calls `notionService` (TRPC), which proxies to the
server-side TRPC router — the token never touches the browser.

**`src/store/tool/slices/builtin/executors/lobe-notion.ts`** (new file)

```typescript
import { NotionApiName, NotionManifest } from '@lobechat/builtin-tool-notion';
import type { BuiltinToolContext, BuiltinToolResult } from '@lobechat/types';
import { BaseExecutor } from '@lobechat/types';

import { notionService } from '@/services/notion';

class NotionExecutor extends BaseExecutor<typeof NotionApiName> {
  readonly identifier = NotionManifest.identifier;
  protected readonly apiEnum = NotionApiName;

  askKnowledgeBase = async (
    params: { question: string },
    ctx: BuiltinToolContext,
  ): Promise<BuiltinToolResult> => {
    if (ctx.signal?.aborted) return { stop: true, success: false };

    try {
      const result = await notionService.askKnowledgeBase(params.question, {
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
```

**`src/store/tool/slices/builtin/executors/index.ts`** — register it:

```typescript
import { notionExecutor } from './lobe-notion';

registerExecutors([
  // ...existing executors...
  notionExecutor,
]);
```

---

### Step 11 — Register the manifest in the tool list

**`src/tools/identifiers.ts`** — add:

```typescript
import { NotionManifest } from '@lobechat/builtin-tool-notion';

export const builtinToolIdentifiers: string[] = [
  // ...existing...
  NotionManifest.identifier,
];
```

**`src/tools/index.ts`** — add the tool entry:

```typescript
import { NotionManifest } from '@lobechat/builtin-tool-notion';

export const builtinTools: LobeBuiltinTool[] = [
  // ...existing tools...
  {
    identifier: NotionManifest.identifier,
    manifest: NotionManifest,
    type: 'builtin',
    // hidden: true  ← set if you only want specific agents to use it
  },
];
```

Optionally add to `defaultToolIds` if every session should have it enabled automatically:

```typescript
export const defaultToolIds = [
  WebBrowsingManifest.identifier,
  KnowledgeBaseManifest.identifier,
  SkillsManifest.identifier,
  NotionManifest.identifier,  // ← makes it default-on for all conversations
];
```

---

## Caveats and things to watch out for

### 1. Token never reaches the browser

`NOTION_QUERY_TOKEN` is declared in the `server:` block of `createEnv` — Next.js /
`@t3-oss/env-nextjs` guarantees it is never bundled into client JS. The only code that
reads it is:
- The TRPC router (`src/server/routers/tools/notion.ts`) — called by browser chat
- The server runtime (`serverRuntimes/notion.ts`) — called by server-side agents

The client executor (`lobe-notion.ts`) never touches the token at all — it goes through
`notionService` → TRPC → server.

### 2. 30-second timeout

`POST /search/answer` can take up to 30 seconds (the proxy's own timeout). TRPC routes
run inside Next.js API routes which default to 10 seconds on Vercel. You need to extend
the timeout on whichever route handler serves `/api/trpc/tools`:

```typescript
export const maxDuration = 60; // seconds — requires Vercel Pro/Enterprise for > 10 s
```

On self-hosted Next.js there is no function timeout by default — this is not a problem.

### 3. No results case

The proxy always returns `200` with `answer: "No relevant information found in the
knowledge base."` and `sources: []` when nothing matches. The runtime already handles this
gracefully — the AI receives the "no results" string and the `systemRole` instructs it
not to fabricate Notion content in that case.

### 4. `pnpm` workspace

After creating `packages/builtin-tool-notion/`, run `pnpm install` from the repo root so
the workspace links `@lobechat/builtin-tool-notion` for other packages to import.

### 5. No client UI components needed (minimal version)

Other tools have `client/` folders with custom `Render`, `Inspector`, `Intervention`
React components for rich tool message cards. For `lobe-notion` this is optional — the
default fallback renders the raw text content. A custom renderer (e.g. source links as
clickable cards) can be added later.

### 6. `hidden` flag and `defaultToolIds`

- `hidden: true` — tool is invisible in the tool store UI but can still be assigned to an agent.
- Omitting `hidden` — tool appears in the store and users can enable/disable it.
- Adding to `defaultToolIds` — tool is enabled for **every** conversation by default.
  Be careful: the AI will try to call it even for questions unrelated to Notion.

The recommended approach is to omit it from `defaultToolIds` and assign it only to a
dedicated "Notion assistant" agent via agent settings.

### 7. `BaseExecutor` requires `apiEnum`

`BaseExecutor` uses `apiEnum` to auto-build `hasApi()` and `getApiNames()`. Every method
name on the executor class must exactly match a value in `NotionApiName`.

### 8. Optional endpoints (`/search/vector`, `GET /pages/:pageId`)

These can be added as additional API entries in the manifest later:
- `/search/vector` — useful if the AI needs to do its own re-ranking or multi-step analysis
- `GET /pages/:pageId` — useful for a "show me the full page" follow-up action

Each new endpoint needs: a new entry in `NotionApiName`, a method in `NotionExecutionRuntime`,
a TRPC procedure in `notionRouter`, a method in `NotionService`, and a method in `NotionExecutor`.
