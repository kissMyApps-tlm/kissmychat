import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js'
import Elysia from 'elysia'
import z from 'zod'
import { db } from './db/index.ts'
import { env, packageJson } from './env.ts'
import {
  AuthException,
  EntityNotFoundException,
} from './exceptions/common-exceptions.ts'
import { pagesVector } from './services/qdrant.ts'

export async function mcpPlugin(path = '/mcp') {
  const mcp = new McpServer({
    name: 'notion_kma',
    version: packageJson.version,
    title: 'Notion KMA',
    description:
      'Tools for querying corporate knowledge on Kiss My Apps (KMA) company',
  })

  mcp.registerTool(
    'query_vector',
    {
      title: 'Query vector',
      description:
        'Perform semantic search over vector database of Notion pages',
      annotations: {
        readOnlyHint: true,
      },
      inputSchema: z.object({
        query: z.string().describe('Text to search'),
        topK: z
          .number()
          .min(1)
          .max(20)
          .default(5)
          .describe('Number of results to return'),
      }),
      outputSchema: QueryVectorOutput,
    },
    async ({ query, topK }) => {
      const results = await pagesVector.query(query, topK)
      return toolStructuredOutput<QueryVectorOutput>({ results })
    },
  )

  mcp.registerTool(
    'get_page',
    {
      title: 'Get page',
      description: 'Get entire Notion page content',
      annotations: {
        readOnlyHint: true,
      },
      inputSchema: z.object({
        pageId: z.uuid(),
      }),
      outputSchema: GetPageOutput,
    },
    async ({ pageId }) => {
      const page = await db.query.page.findFirst({
        where: {
          id: pageId,
        },
      })
      if (!page) {
        throw new EntityNotFoundException()
      }
      return toolStructuredOutput<GetPageOutput>({
        text: page.markdown,
        createdAt: page.createdAt.toISOString(),
        updatedAt: page.updatedAt.toISOString(),
        parentId: page.parentId,
      })
    },
  )

  const transport = new WebStandardStreamableHTTPServerTransport()
  await mcp.connect(transport)

  return new Elysia()
    .guard({
      tags: ['mcp'],
    })
    .onBeforeHandle(({ headers }) => {
      const authHeader = headers.authorization
      if (!authHeader) {
        throw new AuthException({ message: '`Authorization` header missing' })
      }
      if (!authHeader.startsWith('Bearer ')) {
        throw new AuthException({
          message: 'Expected `Bearer` token',
        })
      }
      const token = authHeader.slice('Bearer '.length)
      if (!token) {
        throw new AuthException({ message: 'Missing token' })
      }
      if (token !== env.MCP_AUTH_TOKEN) {
        throw new AuthException({ message: 'Invalid token' })
      }
    })
    .all(path, async ({ request, body }) => {
      return await transport.handleRequest(request, { parsedBody: body })
    })
}

/**
 * https://modelcontextprotocol.io/specification/2025-06-18/server/tools#structured-content
 */
function toolStructuredOutput<T extends CallToolResult['structuredContent']>(
  structuredContent: T,
): CallToolResult {
  return {
    content: [{ type: 'text', text: JSON.stringify(structuredContent) }],
    structuredContent,
  }
}

type QueryVectorOutput = z.infer<typeof QueryVectorOutput>
const QueryVectorOutput = z.object({
  results: z.array(
    z.object({
      score: z.number(),
      pageId: z.uuid(),
      text: z
        .string()
        .describe('Chunk of page content. Usually presented as markdown'),
    }),
  ),
})

type GetPageOutput = z.infer<typeof GetPageOutput>
const GetPageOutput = z.object({
  text: z.string().describe('Page content. Usually presented as markdown'),
  createdAt: z.string(),
  updatedAt: z.string(),
  parentId: z.uuid().nullable(),
})
