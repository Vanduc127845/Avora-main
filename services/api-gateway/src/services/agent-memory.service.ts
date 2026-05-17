import { demoAgentMemories, type DemoAgentMemory } from '../data/demo-store.js';
import { saveDemoData } from '../data/demo-persistence.js';
import { getOptionalSupabaseAdmin } from '../utils/supabase.js';
import { logger } from '../utils/logger.js';

type AgentMemoryRow = {
  user_id: string;
  agent_id: string;
  summary: string | null;
  facts: string[] | null;
  updated_at?: string | null;
};

const memoryKey = (userId: string, agentId: string) => `${userId}:${agentId}`;

const normalizeFacts = (values: string[]) =>
  [...new Set(values.map((value) => value.trim()).filter(Boolean))].slice(-12);

const clip = (value: string, max = 220) =>
  value.length > max ? `${value.slice(0, max - 3).trim()}...` : value;

const buildFactCandidates = (
  userMessage: string,
  assistantMessage: string,
  context?: Record<string, unknown>
) => {
  const facts = [
    context?.moduleTitle ? `Module: ${String(context.moduleTitle)}` : '',
    context?.moduleScope ? `Scope: ${String(context.moduleScope)}` : '',
    `User asked: ${clip(userMessage, 180)}`,
    `Agent answered: ${clip(assistantMessage, 180)}`,
  ];

  const moduleContext = context?.moduleContext;
  if (moduleContext && typeof moduleContext === 'object') {
    const safeContext = JSON.stringify(moduleContext);
    if (safeContext && safeContext !== '{}') facts.push(`Context: ${clip(safeContext, 220)}`);
  }

  return facts.filter(Boolean);
};

export class AgentMemoryService {
  async listMemories(userId: string): Promise<DemoAgentMemory[]> {
    const supabase = getOptionalSupabaseAdmin();

    if (supabase) {
      const { data, error } = await supabase
        .from('agent_memories')
        .select('user_id, agent_id, summary, facts, updated_at')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) {
        logger.warn('Could not list agent memories', { error });
        return [];
      }

      return ((data || []) as AgentMemoryRow[]).map((row) => ({
        userId: row.user_id,
        agentId: row.agent_id,
        summary: row.summary || '',
        facts: Array.isArray(row.facts) ? row.facts : [],
        updatedAt: row.updated_at || new Date().toISOString(),
      }));
    }

    return [...demoAgentMemories.values()]
      .filter((memory) => memory.userId === userId)
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  }

  async getMemory(userId: string, agentId: string): Promise<DemoAgentMemory | null> {
    const supabase = getOptionalSupabaseAdmin();

    if (supabase) {
      const { data, error } = await supabase
        .from('agent_memories')
        .select('user_id, agent_id, summary, facts, updated_at')
        .eq('user_id', userId)
        .eq('agent_id', agentId)
        .maybeSingle();

      if (error) {
        logger.warn('Could not load agent memory', { agentId, error });
        return null;
      }

      if (!data) return null;
      const row = data as AgentMemoryRow;
      return {
        userId: row.user_id,
        agentId: row.agent_id,
        summary: row.summary || '',
        facts: Array.isArray(row.facts) ? row.facts : [],
        updatedAt: row.updated_at || new Date().toISOString(),
      };
    }

    return demoAgentMemories.get(memoryKey(userId, agentId)) || null;
  }

  async deleteMemory(userId: string, agentId?: string): Promise<number> {
    const supabase = getOptionalSupabaseAdmin();

    if (supabase) {
      let query = supabase.from('agent_memories').delete().eq('user_id', userId);
      if (agentId) query = query.eq('agent_id', agentId);

      const { data, error } = await query.select('agent_id');
      if (error) {
        logger.warn('Could not delete agent memory', { agentId, error });
        return 0;
      }

      return Array.isArray(data) ? data.length : 0;
    }

    const keys = [...demoAgentMemories.entries()]
      .filter(([, memory]) => memory.userId === userId && (!agentId || memory.agentId === agentId))
      .map(([key]) => key);

    for (const key of keys) demoAgentMemories.delete(key);
    if (keys.length) await saveDemoData();
    return keys.length;
  }

  async getContext(userId: string, agentId: string): Promise<string> {
    const memory = await this.getMemory(userId, agentId);
    if (!memory) return '';

    const facts = memory.facts.length
      ? `Known facts:\n${memory.facts.map((fact) => `- ${fact}`).join('\n')}`
      : '';

    return [memory.summary ? `Summary: ${memory.summary}` : '', facts]
      .filter(Boolean)
      .join('\n');
  }

  async remember(
    userId: string,
    agentId: string,
    userMessage: string,
    assistantMessage: string,
    context?: Record<string, unknown>
  ): Promise<void> {
    const previous = await this.getMemory(userId, agentId);
    const facts = normalizeFacts([
      ...(previous?.facts || []),
      ...buildFactCandidates(userMessage, assistantMessage, context),
    ]);
    const summary = clip(
      `Recent ${agentId} context: ${facts.slice(-4).join(' | ')}`,
      900
    );
    const updatedAt = new Date().toISOString();

    const supabase = getOptionalSupabaseAdmin();
    if (supabase) {
      const { error } = await supabase.from('agent_memories').upsert(
        {
          user_id: userId,
          agent_id: agentId,
          summary,
          facts,
          updated_at: updatedAt,
        },
        { onConflict: 'user_id,agent_id' }
      );

      if (error) {
        logger.warn('Could not save agent memory', { agentId, error });
      }
      return;
    }

    demoAgentMemories.set(memoryKey(userId, agentId), {
      userId,
      agentId,
      summary,
      facts,
      updatedAt,
    });
    await saveDemoData();
  }
}
