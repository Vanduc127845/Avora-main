import { del, get, post } from './api';
import type { Job, JobSearchParams, JDAnalysis } from '../lib/shared';

export const jobService = {
  async searchJobs(params: JobSearchParams): Promise<{ jobs: Job[]; total: number; page: number; totalPages: number }> {
    return get<{ jobs: Job[]; total: number; page: number; totalPages: number }>('/api/jobs', {
      params,
    });
  },

  async getJob(id: string): Promise<{ job: Job }> {
    return get<{ job: Job }>(`/api/jobs/${id}`);
  },

  async analyzeJob(id: string, userProfile?: any): Promise<{ analysis: JDAnalysis }> {
    return post<{ analysis: JDAnalysis }>(`/api/jobs/${id}/analyze`, { userProfile });
  },

  async getSavedJobs(): Promise<{ jobs: Job[] }> {
    return get<{ jobs: Job[] }>('/api/jobs/saved');
  },

  async saveJob(id: string): Promise<{ message: string }> {
    return post<{ message: string }>(`/api/jobs/${id}/save`);
  },

  async unsaveJob(id: string): Promise<{ message: string }> {
    return del<{ message: string }>(`/api/jobs/${id}/save`);
  },
};
