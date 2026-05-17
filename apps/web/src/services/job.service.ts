import { del, get, post, type ApiRequestConfig } from './api';
import type { InterviewSession, JDAnalysis, Job, JobSearchParams, Roadmap } from '../lib/shared';

export const jobService = {
  async searchJobs(params: JobSearchParams, config?: ApiRequestConfig): Promise<{ jobs: Job[]; total: number; page: number; totalPages: number }> {
    return get<{ jobs: Job[]; total: number; page: number; totalPages: number }>('/api/jobs', {
      params,
      cacheTtlMs: 20_000,
      ...config,
    });
  },

  async getJob(id: string, config?: ApiRequestConfig): Promise<{ job: Job }> {
    return get<{ job: Job }>(`/api/jobs/${id}`, {
      cacheTtlMs: 60_000,
      ...config,
    });
  },

  async analyzeJob(id: string, userProfile?: any): Promise<{ analysis: JDAnalysis }> {
    return post<{ analysis: JDAnalysis }>(`/api/jobs/${id}/analyze`, { userProfile });
  },

  async createJobActionPlan(id: string, userProfile?: any): Promise<{
    analysis: JDAnalysis;
    roadmap: Roadmap;
    interview: InterviewSession;
    nextActions: string[];
  }> {
    return post<{
      analysis: JDAnalysis;
      roadmap: Roadmap;
      interview: InterviewSession;
      nextActions: string[];
    }>(`/api/jobs/${id}/action-plan`, { userProfile });
  },

  async getSavedJobs(config?: ApiRequestConfig): Promise<{ jobs: Job[] }> {
    return get<{ jobs: Job[] }>('/api/jobs/saved', {
      cacheTtlMs: 30_000,
      ...config,
    });
  },

  async saveJob(id: string): Promise<{ message: string }> {
    return post<{ message: string }>(`/api/jobs/${id}/save`);
  },

  async unsaveJob(id: string): Promise<{ message: string }> {
    return del<{ message: string }>(`/api/jobs/${id}/save`);
  },
};
