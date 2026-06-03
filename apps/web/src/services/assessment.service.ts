import { get, post, put, type ApiRequestConfig } from './api';
import { demoFallback, withDemoFallback } from './demo-fallback.service';
import type { Assessment, OrchestrationPlan } from '../lib/shared';

export const assessmentService = {
  async createAssessment(): Promise<{ assessment: Assessment }> {
    return withDemoFallback(
      post<{ assessment: Assessment }>('/api/assessments', {}),
      () => demoFallback.assessments.create()
    );
  },

  async getAssessment(id: string, config?: ApiRequestConfig): Promise<{ assessment: Assessment }> {
    return withDemoFallback(
      get<{ assessment: Assessment }>(`/api/assessments/${id}`, config),
      () => demoFallback.assessments.get(id)
    );
  },

  async sendMessage(
    id: string,
    message: string,
    extractedData?: any
  ): Promise<{ assessment: Assessment; response: string; orchestration?: OrchestrationPlan }> {
    return withDemoFallback(
      post<{ assessment: Assessment; response: string; orchestration?: OrchestrationPlan }>(`/api/assessments/${id}/message`, {
        message,
        extractedData,
      }),
      () => demoFallback.assessments.sendMessage(id, message)
    );
  },

  async completeAssessment(id: string): Promise<{ assessment: Assessment }> {
    return withDemoFallback(
      put<{ assessment: Assessment }>(`/api/assessments/${id}/complete`, {}),
      () => demoFallback.assessments.complete(id)
    );
  },

  async getHistory(config?: ApiRequestConfig): Promise<{ assessments: Assessment[] }> {
    return withDemoFallback(
      get<{ assessments: Assessment[] }>('/api/assessments/history', {
        cacheTtlMs: 30_000,
        ...config,
      }),
      () => demoFallback.assessments.history()
    );
  },
};
