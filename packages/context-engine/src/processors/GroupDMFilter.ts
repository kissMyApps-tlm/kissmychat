import debug from 'debug';

import { BaseProcessor } from '../base/BaseProcessor';
import type { Message, PipelineContext, ProcessorOptions } from '../types';

declare module '../types' {
  interface PipelineContextMetadataOverrides {
    dmFilterProcessed?: {
      filteredCount: number;
    };
  }
}

const log = debug('context-engine:processor:GroupDMFilterProcessor');

/**
 * Agent info for identifying supervisor
 */
interface DMFilterAgentInfo {
  role: 'supervisor' | 'participant';
}

/**
 * Configuration for GroupDMFilterProcessor
 */
export interface GroupDMFilterConfig {
  /**
   * Mapping from agentId to agent info
   * Used to identify supervisor for bypass
   */
  agentMap?: Record<string, DMFilterAgentInfo>;
  /**
   * The current agent ID that is responding
   */
  currentAgentId?: string;
  /**
   * Whether to enable filtering
   * @default true
   */
  enabled?: boolean;
}

/**
 * Group DM Filter Processor
 *
 * Filters direct messages (DMs) so that only the sender and target can see them.
 * When a message has a `targetId`, it is a DM. Agents that are neither the sender
 * (`agentId`) nor the target (`targetId`) will have the message removed from context.
 *
 * Supervisor bypass: supervisors always see all DMs.
 */
export class GroupDMFilterProcessor extends BaseProcessor {
  readonly name = 'GroupDMFilterProcessor';

  private config: GroupDMFilterConfig;

  constructor(config: GroupDMFilterConfig = {}, options: ProcessorOptions = {}) {
    super(options);
    this.config = config;
  }

  protected async doProcess(context: PipelineContext): Promise<PipelineContext> {
    const clonedContext = this.cloneContext(context);

    // Skip if disabled or missing required config
    if (this.config.enabled === false || !this.config.agentMap || !this.config.currentAgentId) {
      log('Processor disabled or missing config, skipping');
      return this.markAsExecuted(clonedContext);
    }

    // Supervisor sees all DMs
    if (this.isCurrentAgentSupervisor()) {
      log('Current agent is supervisor, skipping DM filter');
      return this.markAsExecuted(clonedContext);
    }

    let filteredCount = 0;
    const currentAgentId = this.config.currentAgentId;

    const filteredMessages = clonedContext.messages.filter((msg: Message) => {
      // Only filter messages that have a targetId (i.e., DMs)
      if (!msg.targetId) {
        return true;
      }

      // Keep if current agent is the sender or the target
      if (msg.agentId === currentAgentId || msg.targetId === currentAgentId) {
        return true;
      }

      filteredCount++;
      log(`Filtering DM from ${msg.agentId} to ${msg.targetId} (hidden from ${currentAgentId})`);
      return false;
    });

    clonedContext.messages = filteredMessages;

    clonedContext.metadata.dmFilterProcessed = {
      filteredCount,
    };

    log(`DM filter completed: ${filteredCount} messages filtered`);

    return this.markAsExecuted(clonedContext);
  }

  private isCurrentAgentSupervisor(): boolean {
    if (!this.config.currentAgentId || !this.config.agentMap) {
      return false;
    }

    const currentAgentInfo = this.config.agentMap[this.config.currentAgentId];
    return currentAgentInfo?.role === 'supervisor';
  }
}
