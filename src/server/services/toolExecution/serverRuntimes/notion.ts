import { NotionManifest } from '@lobechat/builtin-tool-notion';
import { NotionExecutionRuntime } from '@lobechat/builtin-tool-notion/executionRuntime';

import { toolsEnv } from '@/envs/tools';

import { type ServerRuntimeRegistration } from './types';

const runtime = new NotionExecutionRuntime(toolsEnv.NOTION_QUERY_TOKEN ?? '', toolsEnv.NOTION_API_URL);

export const notionRuntime: ServerRuntimeRegistration = {
  factory: () => runtime,
  identifier: NotionManifest.identifier,
};
