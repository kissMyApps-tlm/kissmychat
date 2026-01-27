import { toolsEnv } from '@/envs/tools';

export interface KmaNotionConfig {
  authKey?: string;
  enabled: boolean;
  mcpUrl?: string;
}

/**
 * Get KMA Notion plugin configuration from environment
 */
export function getKmaNotionConfig(): KmaNotionConfig {
  const mcpUrl = toolsEnv.KMA_NOTION_MCP_URL;
  const authKey = toolsEnv.KMA_NOTION_MCP_AUTH_KEY;

  const enabled = !!(mcpUrl && authKey);

  return {
    authKey,
    enabled,
    mcpUrl,
  };
}

/**
 * Get MCP connection parameters for KMA Notion
 */
export function getKmaNotionMcpConnection() {
  const config = getKmaNotionConfig();

  if (!config.enabled) {
    return null;
  }

  return {
    headers: {
      Authorization: `Bearer ${config.authKey}`,
    },
    type: 'http' as const,
    url: config.mcpUrl!,
  };
}
