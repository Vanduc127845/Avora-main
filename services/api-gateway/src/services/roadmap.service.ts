import type { LearningItem, Roadmap, RoadmapPhase } from '../types/shared.js';
import { demoRoadmaps } from '../data/demo-store.js';
import { getOptionalSupabaseAdmin } from '../utils/supabase.js';
import { AIService } from './ai.service.js';

type RoadmapRow = {
  id: string;
  user_id: string;
  target_job_id?: string | null;
  title: string;
  description?: string | null;
  target_role?: string | null;
  phases?: RoadmapPhase[] | null;
  progress?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
};

const isUuid = (value?: string) =>
  Boolean(value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value));

const countItems = (phases: RoadmapPhase[]) =>
  phases.reduce(
    (phaseCount, phase) =>
      phaseCount + phase.milestones.reduce((milestoneCount, milestone) => milestoneCount + milestone.items.length, 0),
    0
  );

const countCompleted = (phases: RoadmapPhase[]) =>
  phases.reduce(
    (phaseCount, phase) =>
      phaseCount +
      phase.milestones.reduce(
        (milestoneCount, milestone) =>
          milestoneCount + milestone.items.filter((item) => Boolean(item.completedAt)).length,
        0
      ),
    0
  );

const normalizeRoadmapRow = (row: RoadmapRow): Roadmap => {
  const phases = row.phases || [];
  const totalItems = countItems(phases);
  const completedItems = countCompleted(phases);
  const percentComplete = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : row.progress || 0;

  return {
    id: row.id,
    userId: row.user_id,
    targetJobId: row.target_job_id || 'general',
    title: row.title,
    description: row.description || '',
    currentSkills: [],
    gapSkills: [],
    phases,
    settings: {
      weeklyHours: 6,
      preferredPace: 'moderate',
      accommodations: [],
    },
    progress: {
      completedItems,
      totalItems,
      percentComplete,
      currentPhase: phases.find((phase) => phase.milestones.some((m) => m.items.some((item) => !item.completedAt)))?.order || 1,
      lastActivityAt: row.updated_at ? new Date(row.updated_at) : new Date(),
    },
    createdAt: row.created_at ? new Date(row.created_at) : new Date(),
    updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
  };
};

const mapItems = (phases: RoadmapPhase[], itemId: string, mapper: (item: LearningItem) => LearningItem) =>
  phases.map((phase) => ({
    ...phase,
    milestones: phase.milestones.map((milestone) => ({
      ...milestone,
      items: milestone.items.map((item) => (item.id === itemId ? mapper(item) : item)),
    })),
  }));

export class RoadmapService {
  private aiService = new AIService();

  async getUserRoadmaps(userId: string): Promise<Roadmap[]> {
    const supabase = getOptionalSupabaseAdmin();

    if (supabase) {
      const { data, error } = await supabase
        .from('roadmaps')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return (data || []).map((row) => normalizeRoadmapRow(row as RoadmapRow));
    }

    return [...demoRoadmaps.values()]
      .filter((roadmap) => roadmap.userId === userId)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  async createRoadmap(userId: string, data: any): Promise<Roadmap> {
    const roadmap = await this.aiService.generateRoadmap(userId, {
      ...data,
      targetRole: data.targetRole || data.title || 'Career Path',
    });

    const supabase = getOptionalSupabaseAdmin();
    if (supabase) {
      const { data: row, error } = await supabase
        .from('roadmaps')
        .insert({
          user_id: userId,
          target_job_id: isUuid(data.targetJobId) ? data.targetJobId : null,
          title: roadmap.title,
          description: roadmap.description,
          target_role: data.targetRole || roadmap.title,
          phases: roadmap.phases,
          progress: roadmap.progress.percentComplete,
        })
        .select()
        .single();

      if (error) throw error;
      return normalizeRoadmapRow(row as RoadmapRow);
    }

    demoRoadmaps.set(roadmap.id, roadmap);
    return roadmap;
  }

  async getRoadmapById(id: string, userId: string): Promise<Roadmap | null> {
    const supabase = getOptionalSupabaseAdmin();

    if (supabase) {
      const { data, error } = await supabase
        .from('roadmaps')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .maybeSingle();
      if (error) throw error;
      return data ? normalizeRoadmapRow(data as RoadmapRow) : null;
    }

    const roadmap = demoRoadmaps.get(id);
    return roadmap?.userId === userId ? roadmap : null;
  }

  async updateRoadmap(id: string, userId: string, updates: Partial<Roadmap>): Promise<Roadmap> {
    const roadmap = await this.getRoadmapById(id, userId);
    if (!roadmap) throw new Error('Roadmap not found');

    const next: Roadmap = {
      ...roadmap,
      ...updates,
      settings: { ...roadmap.settings, ...updates.settings },
      progress: { ...roadmap.progress, ...updates.progress },
      updatedAt: new Date(),
    };

    const supabase = getOptionalSupabaseAdmin();
    if (supabase) {
      const { data, error } = await supabase
        .from('roadmaps')
        .update({
          title: next.title,
          description: next.description,
          phases: next.phases,
          progress: next.progress.percentComplete,
          updated_at: next.updatedAt.toISOString(),
        })
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();
      if (error) throw error;
      return normalizeRoadmapRow(data as RoadmapRow);
    }

    demoRoadmaps.set(id, next);
    return next;
  }

  async deleteRoadmap(id: string, userId: string): Promise<void> {
    const supabase = getOptionalSupabaseAdmin();

    if (supabase) {
      const { error } = await supabase.from('roadmaps').delete().eq('id', id).eq('user_id', userId);
      if (error) throw error;
      return;
    }

    const roadmap = demoRoadmaps.get(id);
    if (roadmap?.userId === userId) demoRoadmaps.delete(id);
  }

  async updateProgress(id: string, userId: string, updates: any): Promise<Roadmap> {
    const roadmap = await this.getRoadmapById(id, userId);
    if (!roadmap) throw new Error('Roadmap not found');

    return this.updateRoadmap(id, userId, {
      progress: {
        ...roadmap.progress,
        ...updates,
        percentComplete:
          updates.completedItems !== undefined && roadmap.progress.totalItems > 0
            ? Math.round((updates.completedItems / roadmap.progress.totalItems) * 100)
            : roadmap.progress.percentComplete,
        lastActivityAt: new Date(),
      },
    });
  }

  async completeItem(roadmapId: string, itemId: string, userId: string): Promise<Roadmap> {
    const roadmap = await this.getRoadmapById(roadmapId, userId);
    if (!roadmap) throw new Error('Roadmap not found');

    const phases = mapItems(roadmap.phases, itemId, (item) => ({
      ...item,
      completedAt: item.completedAt || new Date(),
    }));
    const completedItems = countCompleted(phases);
    const totalItems = countItems(phases);

    return this.updateRoadmap(roadmapId, userId, {
      phases,
      progress: {
        ...roadmap.progress,
        completedItems,
        totalItems,
        percentComplete: totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0,
        lastActivityAt: new Date(),
      },
    });
  }
}
