import { get, post, put, type ApiRequestConfig } from './api';
import type { Assessment, OrchestrationPlan } from '../lib/shared';

export const assessmentService = {
  async createAssessment(): Promise<{ assessment: Assessment }> {
    return post<{ assessment: Assessment }>('/api/assessments', {});
  },

  async getAssessment(id: string, config?: ApiRequestConfig): Promise<{ assessment: Assessment }> {
    return get<{ assessment: Assessment }>(`/api/assessments/${id}`, config);
  },

  async sendMessage(
    id: string,
    message: string,
    extractedData?: any
  ): Promise<{ assessment: Assessment; response: string; orchestration?: OrchestrationPlan }> {
    return post<{ assessment: Assessment; response: string; orchestration?: OrchestrationPlan }>(`/api/assessments/${id}/message`, {
      message,
      extractedData,
    });
  },

  async completeAssessment(id: string): Promise<{ assessment: Assessment }> {
    return put<{ assessment: Assessment }>(`/api/assessments/${id}/complete`, {});
  },

  async getHistory(config?: ApiRequestConfig): Promise<{ assessments: Assessment[] }> {
    return get<{ assessments: Assessment[] }>('/api/assessments/history', {
      cacheTtlMs: 30_000,
      ...config,
    });
  },
};
