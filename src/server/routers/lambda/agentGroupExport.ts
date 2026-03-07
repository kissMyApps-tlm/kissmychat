import { z } from 'zod';

import { AgentModel } from '@/database/models/agent';
import { ChatGroupModel } from '@/database/models/chatGroup';
import { AgentGroupRepository } from '@/database/repositories/agentGroup';
import { authedProcedure, router } from '@/libs/trpc/lambda';
import { serverDatabase } from '@/libs/trpc/lambda/middleware';
import { AgentGroupService } from '@/server/services/agentGroup';

const agentGroupExportProcedure = authedProcedure.use(serverDatabase).use(async (opts) => {
  const { ctx } = opts;

  return opts.next({
    ctx: {
      agentGroupRepo: new AgentGroupRepository(ctx.serverDB, ctx.userId),
      agentGroupService: new AgentGroupService(ctx.serverDB, ctx.userId),
      agentModel: new AgentModel(ctx.serverDB, ctx.userId),
      chatGroupModel: new ChatGroupModel(ctx.serverDB, ctx.userId),
    },
  });
});

const exportAgentSchema = z.object({
  avatar: z.string().nullish(),
  backgroundColor: z.string().nullish(),
  chatConfig: z.any().nullish(),
  description: z.string().nullish(),
  enabled: z.boolean().optional(),
  fewShots: z.any().nullish(),
  model: z.string().nullish(),
  openingMessage: z.string().nullish(),
  openingQuestions: z.array(z.string()).nullish(),
  order: z.number().optional(),
  params: z.any().nullish(),
  plugins: z.array(z.string()).nullish(),
  provider: z.string().nullish(),
  role: z.string().optional(),
  systemRole: z.string().nullish(),
  tags: z.array(z.string()).nullish(),
  title: z.string().nullish(),
  tts: z.any().nullish(),
});

const importDataSchema = z.object({
  agents: z.array(exportAgentSchema),
  exportedAt: z.string(),
  group: z.object({
    avatar: z.string().nullish(),
    backgroundColor: z.string().nullish(),
    config: z
      .object({
        allowDM: z.boolean().optional(),
        openingMessage: z.string().optional(),
        openingQuestions: z.array(z.string()).optional(),
        revealDM: z.boolean().optional(),
        systemPrompt: z.string().optional(),
      })
      .optional()
      .nullable(),
    description: z.string().nullish(),
    title: z.string().nullish(),
  }),
  type: z.literal('agentGroup'),
  version: z.string(),
});

export const agentGroupExportRouter = router({
  exportGroup: agentGroupExportProcedure
    .input(z.object({ groupId: z.string() }))
    .query(async ({ input, ctx }) => {
      // Use findByIdWithAgents which returns full agent details
      const detail = await ctx.agentGroupRepo.findByIdWithAgents(input.groupId);
      if (!detail) return null;

      // Get junction table data for enabled/order/role
      const groupAgentLinks = await ctx.chatGroupModel.getGroupAgents(input.groupId);
      const linkMap = new Map(groupAgentLinks.map((link) => [link.agentId, link]));

      const config = detail.config as Record<string, any> | null;

      return {
        agents: detail.agents.map((agent) => {
          const link = linkMap.get(agent.id);

          return {
            avatar: agent.avatar,
            backgroundColor: agent.backgroundColor,
            chatConfig: agent.chatConfig,
            description: agent.description,
            enabled: link?.enabled ?? true,
            fewShots: agent.fewShots,
            model: agent.model,
            openingMessage: agent.openingMessage,
            openingQuestions: agent.openingQuestions,
            order: link?.order ?? 0,
            params: agent.params,
            plugins: agent.plugins,
            provider: agent.provider,
            role: (link?.role as 'supervisor' | 'participant') ?? 'participant',
            systemRole: agent.systemRole,
            tags: agent.tags,
            title: agent.title,
            tts: agent.tts,
          };
        }),
        exportedAt: new Date().toISOString(),
        group: {
          avatar: detail.avatar,
          backgroundColor: detail.backgroundColor,
          config: config
            ? {
                allowDM: config.allowDM,
                openingMessage: config.openingMessage,
                openingQuestions: config.openingQuestions,
                revealDM: config.revealDM,
                systemPrompt: config.systemPrompt,
              }
            : null,
          description: detail.description,
          title: detail.title,
        },
        type: 'agentGroup' as const,
        version: '1.0',
      };
    }),

  importGroup: agentGroupExportProcedure
    .input(importDataSchema)
    .mutation(async ({ input, ctx }) => {
      const { group, agents: agentList } = input;

      // Separate supervisor from participants
      const supervisorData = agentList.find((a) => a.role === 'supervisor');
      const participantData = agentList.filter((a) => a.role !== 'supervisor');

      // Build supervisor config
      const supervisorConfig = supervisorData
        ? {
            avatar: supervisorData.avatar ?? undefined,
            backgroundColor: supervisorData.backgroundColor ?? undefined,
            chatConfig: supervisorData.chatConfig ?? undefined,
            description: supervisorData.description ?? undefined,
            model: supervisorData.model ?? undefined,
            params: supervisorData.params ?? undefined,
            plugins: (supervisorData.plugins as string[] | undefined) ?? undefined,
            provider: supervisorData.provider ?? undefined,
            systemRole: supervisorData.systemRole ?? undefined,
            tags: (supervisorData.tags as string[] | undefined) ?? undefined,
            title: supervisorData.title ?? undefined,
          }
        : undefined;

      // Build member configs
      const members = participantData.map((a) => ({
        avatar: a.avatar ?? undefined,
        backgroundColor: a.backgroundColor ?? undefined,
        chatConfig: a.chatConfig ?? undefined,
        description: a.description ?? undefined,
        fewShots: a.fewShots ?? undefined,
        model: a.model ?? undefined,
        openingMessage: a.openingMessage ?? undefined,
        openingQuestions: (a.openingQuestions as string[] | undefined) ?? undefined,
        params: a.params ?? undefined,
        plugins: (a.plugins as string[] | undefined) ?? undefined,
        provider: a.provider ?? undefined,
        systemRole: a.systemRole ?? undefined,
        tags: (a.tags as string[] | undefined) ?? undefined,
        title: a.title ?? undefined,
        tts: a.tts ?? undefined,
      }));

      // Create member agents first
      const createdAgents =
        members.length > 0
          ? await ctx.agentModel.batchCreate(members.map((m) => ({ ...m, virtual: true })))
          : [];

      const memberAgentIds = createdAgents.map((a) => a.id);

      // Normalize group config
      const normalizedConfig = ctx.agentGroupService.normalizeGroupConfig(group.config as any);

      // Create group with supervisor
      const { group: newGroup, supervisorAgentId } =
        await ctx.agentGroupRepo.createGroupWithSupervisor(
          {
            avatar: group.avatar,
            backgroundColor: group.backgroundColor,
            config: normalizedConfig,
            description: group.description,
            title: group.title,
          },
          memberAgentIds,
          supervisorConfig,
        );

      // Update member order and enabled status
      for (const [i, participant] of participantData.entries()) {
        const agentId = memberAgentIds[i];
        if (agentId) {
          // Cast to include 'enabled' — the model's .set() spread passes it through at runtime
          await ctx.chatGroupModel.updateAgentInGroup(newGroup.id, agentId, {
            order: participant.order,
            ...(participant.enabled === false ? { enabled: false } : {}),
          } as any);
        }
      }

      return { groupId: newGroup.id, supervisorAgentId };
    }),
});

export type AgentGroupExportRouter = typeof agentGroupExportRouter;
