import { del, get } from './api';

export type AgentMemory = {
  userId: string;
  agentId: string;
  summary: string;
  facts: string[];
  updatedAt: string;
};

export const agentMemoryService = {
  list(signal?: AbortSignal) {
    return get<{ memories: AgentMemory[]; privacy: Record<string, unknown> }>('/api/agent-memory', {
      signal,
      cacheKey: 'agent-memory:list',
      cacheTtlMs: 15_000,
    });
  },

  deleteAgent(agentId: string) {
    return del<{ deleted: number }>(`/api/agent-memory/${encodeURIComponent(agentId)}`);
  },

  deleteAll() {
    return del<{ deleted: number }>('/api/agent-memory');
  },
};
