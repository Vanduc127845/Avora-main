import { del, get, post, type ApiRequestConfig } from './api';

export type ConfidenceEntry = {
  id: string;
  mood: 'steady' | 'uncertain' | 'blocked' | 'confident';
  win: string;
  blocker: string;
  nextStep: string;
  coachReply: string;
  createdAt: string;
};

export const confidenceService = {
  list(config?: ApiRequestConfig) {
    return get<{ entries: ConfidenceEntry[] }>('/api/confidence', {
      cacheKey: 'confidence:list',
      cacheTtlMs: 15_000,
      ...config,
    });
  },

  create(entry: ConfidenceEntry) {
    return post<{ entry: ConfidenceEntry }>('/api/confidence', entry);
  },

  delete(id: string) {
    return del<{ deleted: boolean }>(`/api/confidence/${encodeURIComponent(id)}`);
  },
};
