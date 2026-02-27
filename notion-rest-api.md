# REST API Reference

Base URL: `https://mcp-my-notion.fly.dev`

---

## Authentication

All endpoints require a `Bearer` token in the `Authorization` header:

```
Authorization: Bearer <QUERY_AUTH_TOKEN>
```

**Error responses** for auth failures return HTTP `401` with the [error body](#error-format) below.

---

## Error Format

All errors return a JSON body:

```json
{
  "name": "AuthException",
  "message": "Invalid token",
  "code": 10000,
  "status": 401,
  "context": {},
  "cause": null
}
```

| Field | Type | Description |
|---|---|---|
| `name` | string | Exception class name |
| `message` | string | Human-readable description |
| `code` | number | Internal error code (see below) |
| `status` | number | HTTP status code (mirrored in body) |
| `context` | object? | Optional additional context |
| `cause` | any? | Nested cause, if any |

**Internal error codes:**

| Code | Meaning |
|---|---|
| `10000` | Unauthorized |
| `40000` | User input / validation error |
| `50000` | Unknown server error |

---

## Endpoints

### `POST /search/answer`

The primary endpoint for chat integration. Accepts a natural-language question, runs a full **hybrid search** (vector + full-text) over the Notion knowledge base, and returns an AI-generated answer with source references.

**Internally:**
1. Extracts keywords and query variants (GPT-4.1 nano)
2. Runs parallel Qdrant vector search and PostgreSQL FTS
3. Merges results via RRF, builds evidence packs
4. Generates a concise answer (GPT-4.1 nano, 30 s timeout)

**Request**

```http
POST /search/answer
Content-Type: application/json
Authorization: Bearer <QUERY_AUTH_TOKEN>

{
  "question": "Where is the design handoff process documented?"
}
```

| Field | Type | Required | Constraints | Description |
|---|---|---|---|---|
| `question` | string | yes | max 2000 chars | Natural-language question |

**Response `200`**

```json
{
  "answer": "The design handoff process is documented in the 'Product → Design' Notion section. Figma links must be attached to the ticket before moving to development.",
  "sources": [
    {
      "pageId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "title": "Design Handoff Process",
      "description": "Figma links must be attached to the ticket — covers steps from final review to dev handoff.",
      "url": "https://www.notion.so/a1b2c3d4e5f67890abcdef1234567890"
    }
  ]
}
```

| Field | Type | Description |
|---|---|---|
| `answer` | string | Short, factual answer (2-3 sentences) |
| `sources` | array | Notion pages backing the answer, sorted by relevance |
| `sources[].pageId` | string (UUID) | Notion page ID |
| `sources[].title` | string | Page title |
| `sources[].description` | string? | Relevant snippet or direct answer extracted from the page |
| `sources[].url` | string (URI) | Direct link to the Notion page |

If no relevant information is found, the response is still `200` with `answer: "No relevant information found in the knowledge base."` and `sources: []`.

---

### `POST /search/vector`

Low-level semantic similarity search over page chunks. Returns raw scored results without AI answer generation. Useful for building custom re-ranking or autocomplete.

**Request**

```http
POST /search/vector
Content-Type: application/json
Authorization: Bearer <QUERY_AUTH_TOKEN>

{
  "query": "onboarding checklist for new engineers",
  "topK": 5
}
```

| Field | Type | Required | Constraints | Description |
|---|---|---|---|---|
| `query` | string | yes | — | Text to embed and search |
| `topK` | number | no | 1–20, default `5` | Number of results to return |

**Response `200`**

```json
{
  "results": [
    {
      "score": 0.87,
      "pageId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "text": "## Onboarding Checklist\n- Set up local dev environment\n- Read architecture overview..."
    }
  ]
}
```

| Field | Type | Description |
|---|---|---|
| `results` | array | Scored page chunks |
| `results[].score` | number | Cosine similarity score (0–1) |
| `results[].pageId` | string (UUID) | Source Notion page ID |
| `results[].text` | string | Chunk of page content, usually Markdown |

---

### `GET /pages/:pageId`

Retrieves the full indexed content of a single Notion page. Useful for rendering a source preview after obtaining a `pageId` from `/search/answer` or `/search/vector`.

**Request**

```http
GET /pages/a1b2c3d4-e5f6-7890-abcd-ef1234567890
Authorization: Bearer <QUERY_AUTH_TOKEN>
```

| Param | Type | Description |
|---|---|---|
| `pageId` | string (UUID) | Notion page ID |

**Response `200`**

```json
{
  "text": "# Design Handoff Process\n\nProperties:\n- status: Active\n\n...",
  "createdAt": "2024-11-01T10:00:00.000Z",
  "updatedAt": "2025-01-15T14:22:00.000Z",
  "parentId": "b2c3d4e5-f6a7-8901-bcde-f12345678901"
}
```

| Field | Type | Description |
|---|---|---|
| `text` | string | Full page content in Markdown, including Notion DB properties |
| `createdAt` | string (ISO 8601) | When the page was first indexed |
| `updatedAt` | string (ISO 8601) | When the page was last re-indexed |
| `parentId` | string (UUID) \| null | Parent page ID, or `null` for root pages |

**Errors**

| Status | When |
|---|---|
| `400` | `pageId` is not a valid UUID, or the page does not exist in the index |

---

## Chat App Integration Guide

For a typical AI chat app that needs to answer questions about the Notion workspace, only one endpoint is needed:

```
POST /search/answer
```

**Minimal example (TypeScript / fetch):**

```typescript
const BASE_URL = 'https://mcp-my-notion.fly.dev'
const TOKEN = process.env.QUERY_AUTH_TOKEN

async function askKnowledgeBase(question: string) {
  const res = await fetch(`${BASE_URL}/search/answer`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TOKEN}`,
    },
    body: JSON.stringify({ question }),
  })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(`${err.message} (code ${err.code})`)
  }

  return res.json() as Promise<{
    answer: string
    sources: Array<{
      pageId: string
      title: string
      description?: string
      url: string
    }>
  }>
}
```

**Typical flow:**

1. User sends a message in the chat UI.
2. Call `POST /search/answer` with `{ question: userMessage }`.
3. Display `answer` as the assistant response.
4. Render `sources` as clickable references linking to `url`.
5. Optionally, call `GET /pages/:pageId` to show an expanded preview of a source.
