import { lambdaClient } from '@/libs/trpc/client';

export interface AgentGroupExportData {
  agents: Array<{
    avatar?: string | null;
    backgroundColor?: string | null;
    chatConfig?: any;
    description?: string | null;
    enabled?: boolean;
    fewShots?: any;
    model?: string | null;
    openingMessage?: string | null;
    openingQuestions?: string[] | null;
    order?: number;
    params?: any;
    plugins?: string[] | null;
    provider?: string | null;
    role?: string;
    systemRole?: string | null;
    tags?: string[] | null;
    title?: string | null;
    tts?: any;
  }>;
  exportedAt: string;
  group: {
    avatar?: string | null;
    backgroundColor?: string | null;
    config?: {
      allowDM?: boolean;
      openingMessage?: string;
      openingQuestions?: string[];
      revealDM?: boolean;
      systemPrompt?: string;
    } | null;
    description?: string | null;
    title?: string | null;
  };
  type: 'agentGroup';
  version: string;
}

class AgentGroupExportService {
  exportGroup = async (groupId: string): Promise<AgentGroupExportData | null> => {
    return lambdaClient.groupExport.exportGroup.query({ groupId });
  };

  importGroup = async (
    data: AgentGroupExportData,
  ): Promise<{ groupId: string; supervisorAgentId: string }> => {
    return lambdaClient.groupExport.importGroup.mutate(data);
  };
}

export const agentGroupExportService = new AgentGroupExportService();
