import { del, get, post, put, type ApiRequestConfig } from './api';
import type { Roadmap } from '../lib/shared';

export const roadmapService = {
  async getRoadmaps(config?: ApiRequestConfig): Promise<{ roadmaps: Roadmap[] }> {
    return get<{ roadmaps: Roadmap[] }>('/api/roadmaps', {
      cacheTtlMs: 30_000,
      ...config,
    });
  },

  async getRoadmap(id: string, config?: ApiRequestConfig): Promise<{ roadmap: Roadmap }> {
    return get<{ roadmap: Roadmap }>(`/api/roadmaps/${id}`, {
      cacheTtlMs: 30_000,
      ...config,
    });
  },

  async createRoadmap(data: {
    targetJobId: string;
    title: string;
    targetRole?: string;
    currentSkills?: string[];
    settings?: any;
  }): Promise<{ roadmap: Roadmap }> {
    return post<{ roadmap: Roadmap }>('/api/roadmaps', data);
  },

  async updateRoadmap(id: string, updates: Partial<Roadmap>): Promise<{ roadmap: Roadmap }> {
    return put<{ roadmap: Roadmap }>(`/api/roadmaps/${id}`, updates);
  },

  async deleteRoadmap(id: string): Promise<{ message: string }> {
    return del<{ message: string }>(`/api/roadmaps/${id}`);
  },

  async completeItem(roadmapId: string, itemId: string): Promise<{ roadmap: Roadmap }> {
    return post<{ roadmap: Roadmap }>(`/api/roadmaps/${roadmapId}/item/${itemId}/complete`, {});
  },

  async updateProgress(
    id: string,
    updates: { completedItems?: number; currentPhase?: number }
  ): Promise<{ roadmap: Roadmap }> {
    return put<{ roadmap: Roadmap }>(`/api/roadmaps/${id}/progress`, updates);
  },
};
