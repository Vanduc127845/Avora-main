import { get, post, put } from './api';
import type { Assessment } from '../lib/shared';

export const assessmentService = {
  async createAssessment(): Promise<{ assessment: Assessment }> {
    return post<{ assessment: Assessment }>('/api/assessments', {});
  },

  async getAssessment(id: string): Promise<{ assessment: Assessment }> {
    return get<{ assessment: Assessment }>(`/api/assessments/${id}`);
  },

  async sendMessage(
    id: string,
    message: string,
    extractedData?: any
  ): Promise<{ assessment: Assessment; response: string }> {
    return post<{ assessment: Assessment; response: string }>(`/api/assessments/${id}/message`, {
      message,
      extractedData,
    });
  },

  async completeAssessment(id: string): Promise<{ assessment: Assessment }> {
    return put<{ assessment: Assessment }>(`/api/assessments/${id}/complete`, {});
  },

  async getHistory(): Promise<{ assessments: Assessment[] }> {
    return get<{ assessments: Assessment[] }>('/api/assessments/history');
  },
};
