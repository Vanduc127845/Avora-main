import { del, get, post, put, type ApiRequestConfig } from './api';
import { demoFallback, withDemoFallback } from './demo-fallback.service';
import type { Roadmap } from '../lib/shared';

export const roadmapService = {
  async getRoadmaps(config?: ApiRequestConfig): Promise<{ roadmaps: Roadmap[] }> {
    const response = await withDemoFallback(
      get<{ roadmaps: Roadmap[] }>('/api/roadmaps', {
        cacheTtlMs: 30_000,
        ...config,
      }),
      () => demoFallback.roadmaps.list()
    );

    if (response.roadmaps.length === 0 && import.meta.env.VITE_DASHBOARD_DATA_MODE !== 'api') {
      return demoFallback.roadmaps.list();
    }

    return response;
  },

  async getRoadmap(id: string, config?: ApiRequestConfig): Promise<{ roadmap: Roadmap }> {
    return withDemoFallback(
      get<{ roadmap: Roadmap }>(`/api/roadmaps/${id}`, {
        cacheTtlMs: 30_000,
        ...config,
      }),
      () => demoFallback.roadmaps.get(id)
    );
  },

  async createRoadmap(data: {
    targetJobId: string;
    title: string;
    targetRole?: string;
    currentSkills?: string[];
    settings?: any;
  }): Promise<{ roadmap: Roadmap }> {
    return withDemoFallback(
      post<{ roadmap: Roadmap }>('/api/roadmaps', data),
      () => demoFallback.roadmaps.create(data)
    );
  },

  async updateRoadmap(id: string, updates: Partial<Roadmap>): Promise<{ roadmap: Roadmap }> {
    return withDemoFallback(
      put<{ roadmap: Roadmap }>(`/api/roadmaps/${id}`, updates),
      () => demoFallback.roadmaps.update(id, updates)
    );
  },

  async deleteRoadmap(id: string): Promise<{ message: string }> {
    return withDemoFallback(
      del<{ message: string }>(`/api/roadmaps/${id}`),
      () => demoFallback.roadmaps.delete(id)
    );
  },

  async completeItem(roadmapId: string, itemId: string): Promise<{ roadmap: Roadmap }> {
    return withDemoFallback(
      post<{ roadmap: Roadmap }>(`/api/roadmaps/${roadmapId}/item/${itemId}/complete`, {}),
      () => demoFallback.roadmaps.completeItem(roadmapId, itemId)
    );
  },

  async updateProgress(
    id: string,
    updates: { completedItems?: number; currentPhase?: number }
  ): Promise<{ roadmap: Roadmap }> {
    return withDemoFallback(
      put<{ roadmap: Roadmap }>(`/api/roadmaps/${id}/progress`, updates),
      () => demoFallback.roadmaps.updateProgress(id, updates)
    );
  },
};
