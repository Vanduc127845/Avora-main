import { del, get, post, type ApiRequestConfig } from './api';
import { demoFallback, withDemoFallback } from './demo-fallback.service';

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
    return withDemoFallback(
      get<{ entries: ConfidenceEntry[] }>('/api/confidence', {
        cacheKey: 'confidence:list',
        cacheTtlMs: 15_000,
        ...config,
      }),
      () => demoFallback.confidence.list()
    );
  },

  create(entry: ConfidenceEntry) {
    return withDemoFallback(
      post<{ entry: ConfidenceEntry }>('/api/confidence', entry),
      () => demoFallback.confidence.create(entry)
    );
  },

  delete(id: string) {
    return withDemoFallback(
      del<{ deleted: boolean }>(`/api/confidence/${encodeURIComponent(id)}`),
      () => demoFallback.confidence.delete(id)
    );
  },
};
