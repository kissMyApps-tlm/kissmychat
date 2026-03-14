import { describe, expect, it } from 'vitest';

import type { PipelineContext } from '../../types';
import { GroupDMFilterProcessor } from '../GroupDMFilter';

describe('GroupDMFilterProcessor', () => {
  const createContext = (messages: any[]): PipelineContext => ({
    initialState: { messages: [] },
    isAborted: false,
    messages,
    metadata: {},
  });

  const defaultConfig = {
    agentMap: {
      'agent-a': { role: 'participant' as const },
      'agent-b': { role: 'participant' as const },
      'supervisor': { role: 'supervisor' as const },
    },
    currentAgentId: 'agent-a',
  };

  describe('DM visibility for participants', () => {
    it('should hide DM to agent-a from agent-b perspective', async () => {
      const processor = new GroupDMFilterProcessor({
        ...defaultConfig,
        currentAgentId: 'agent-b',
      });
      const context = createContext([
        { content: 'User question', id: 'msg_1', role: 'user' },
        {
          agentId: 'supervisor',
          content: 'Private message to agent-a',
          id: 'msg_2',
          role: 'assistant',
          targetId: 'agent-a',
        },
        { agentId: 'agent-b', content: 'My response', id: 'msg_3', role: 'assistant' },
      ]);

      const result = await processor.process(context);

      expect(result.messages).toHaveLength(2);
      expect(result.messages.map((m) => m.id)).toEqual(['msg_1', 'msg_3']);
    });

    it('should show DM to agent-a from agent-a perspective', async () => {
      const processor = new GroupDMFilterProcessor({
        ...defaultConfig,
        currentAgentId: 'agent-a',
      });
      const context = createContext([
        { content: 'User question', id: 'msg_1', role: 'user' },
        {
          agentId: 'supervisor',
          content: 'Private message to agent-a',
          id: 'msg_2',
          role: 'assistant',
          targetId: 'agent-a',
        },
      ]);

      const result = await processor.process(context);

      expect(result.messages).toHaveLength(2);
      expect(result.messages.map((m) => m.id)).toEqual(['msg_1', 'msg_2']);
    });

    it('should show DM to agent-b from agent-b perspective', async () => {
      const processor = new GroupDMFilterProcessor({
        ...defaultConfig,
        currentAgentId: 'agent-b',
      });
      const context = createContext([
        {
          agentId: 'supervisor',
          content: 'Private message to agent-b',
          id: 'msg_1',
          role: 'assistant',
          targetId: 'agent-b',
        },
      ]);

      const result = await processor.process(context);

      expect(result.messages).toHaveLength(1);
    });

    it('should hide DM to agent-b from agent-a perspective', async () => {
      const processor = new GroupDMFilterProcessor({
        ...defaultConfig,
        currentAgentId: 'agent-a',
      });
      const context = createContext([
        {
          agentId: 'supervisor',
          content: 'Private message to agent-b',
          id: 'msg_1',
          role: 'assistant',
          targetId: 'agent-b',
        },
      ]);

      const result = await processor.process(context);

      expect(result.messages).toHaveLength(0);
      expect(result.metadata.dmFilterProcessed?.filteredCount).toBe(1);
    });

    it('should allow sender to see their own DM', async () => {
      const processor = new GroupDMFilterProcessor({
        ...defaultConfig,
        currentAgentId: 'agent-a',
      });
      const context = createContext([
        {
          agentId: 'agent-a',
          content: 'I sent this DM to agent-b',
          id: 'msg_1',
          role: 'assistant',
          targetId: 'agent-b',
        },
      ]);

      const result = await processor.process(context);

      // agent-a is the sender (agentId), so should see it
      expect(result.messages).toHaveLength(1);
    });
  });

  describe('non-DM messages', () => {
    it('should keep messages without targetId (broadcast/public)', async () => {
      const processor = new GroupDMFilterProcessor(defaultConfig);
      const context = createContext([
        { content: 'User question', id: 'msg_1', role: 'user' },
        {
          agentId: 'supervisor',
          content: 'Public message',
          id: 'msg_2',
          role: 'assistant',
        },
        {
          agentId: 'agent-b',
          content: 'Agent B response',
          id: 'msg_3',
          role: 'assistant',
        },
      ]);

      const result = await processor.process(context);

      expect(result.messages).toHaveLength(3);
    });
  });

  describe('supervisor bypass', () => {
    it('should let supervisor see all DMs', async () => {
      const processor = new GroupDMFilterProcessor({
        ...defaultConfig,
        currentAgentId: 'supervisor',
      });
      const context = createContext([
        {
          agentId: 'supervisor',
          content: 'DM to agent-a',
          id: 'msg_1',
          role: 'assistant',
          targetId: 'agent-a',
        },
        {
          agentId: 'agent-a',
          content: 'DM from agent-a to agent-b',
          id: 'msg_2',
          role: 'assistant',
          targetId: 'agent-b',
        },
      ]);

      const result = await processor.process(context);

      expect(result.messages).toHaveLength(2);
    });
  });

  describe('disabled/missing config (backward compat)', () => {
    it('should skip filtering when disabled', async () => {
      const processor = new GroupDMFilterProcessor({
        ...defaultConfig,
        enabled: false,
      });
      const context = createContext([
        {
          agentId: 'supervisor',
          content: 'DM to agent-b',
          id: 'msg_1',
          role: 'assistant',
          targetId: 'agent-b',
        },
      ]);

      const result = await processor.process(context);

      expect(result.messages).toHaveLength(1);
    });

    it('should skip filtering when no agentMap provided', async () => {
      const processor = new GroupDMFilterProcessor({});
      const context = createContext([
        {
          agentId: 'supervisor',
          content: 'DM to agent-b',
          id: 'msg_1',
          role: 'assistant',
          targetId: 'agent-b',
        },
      ]);

      const result = await processor.process(context);

      expect(result.messages).toHaveLength(1);
    });

    it('should skip filtering when no currentAgentId provided', async () => {
      const processor = new GroupDMFilterProcessor({
        agentMap: defaultConfig.agentMap,
      });
      const context = createContext([
        {
          agentId: 'supervisor',
          content: 'DM to agent-b',
          id: 'msg_1',
          role: 'assistant',
          targetId: 'agent-b',
        },
      ]);

      const result = await processor.process(context);

      expect(result.messages).toHaveLength(1);
    });
  });

  describe('edge cases', () => {
    it('should handle empty messages array', async () => {
      const processor = new GroupDMFilterProcessor(defaultConfig);
      const context = createContext([]);

      const result = await processor.process(context);

      expect(result.messages).toHaveLength(0);
    });

    it('should track filter counts in metadata', async () => {
      const processor = new GroupDMFilterProcessor({
        ...defaultConfig,
        currentAgentId: 'agent-a',
      });
      const context = createContext([
        { content: 'User question', id: 'msg_1', role: 'user' },
        {
          agentId: 'supervisor',
          content: 'DM to agent-b',
          id: 'msg_2',
          role: 'assistant',
          targetId: 'agent-b',
        },
        {
          agentId: 'agent-b',
          content: 'Reply DM to supervisor',
          id: 'msg_3',
          role: 'assistant',
          targetId: 'supervisor',
        },
      ]);

      const result = await processor.process(context);

      // msg_2: agent-a is not sender or target → filtered
      // msg_3: agent-a is not sender or target → filtered
      expect(result.messages).toHaveLength(1);
      expect(result.metadata.dmFilterProcessed).toEqual({
        filteredCount: 2,
      });
    });
  });
});
