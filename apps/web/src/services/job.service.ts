import { del, get, post, type ApiRequestConfig } from './api';
import { demoFallback, withDemoFallback } from './demo-fallback.service';
import type { InterviewSession, JDAnalysis, Job, JobSearchParams, Roadmap } from '../lib/shared';

export const jobService = {
  async searchJobs(params: JobSearchParams, config?: ApiRequestConfig): Promise<{ jobs: Job[]; total: number; page: number; totalPages: number }> {
    const response = await withDemoFallback(
      get<{ jobs: Job[]; total: number; page: number; totalPages: number }>('/api/jobs', {
        params,
        cacheTtlMs: 20_000,
        ...config,
      }),
      () => demoFallback.jobs.search(params)
    );

    if (response.jobs.length === 0 && import.meta.env.VITE_DASHBOARD_DATA_MODE !== 'api') {
      return demoFallback.jobs.search(params);
    }

    return response;
  },

  async getJob(id: string, config?: ApiRequestConfig): Promise<{ job: Job }> {
    return withDemoFallback(
      get<{ job: Job }>(`/api/jobs/${id}`, {
        cacheTtlMs: 60_000,
        ...config,
      }),
      () => demoFallback.jobs.get(id)
    );
  },

  async analyzeJob(id: string, userProfile?: any): Promise<{ analysis: JDAnalysis }> {
    return withDemoFallback(
      post<{ analysis: JDAnalysis }>(`/api/jobs/${id}/analyze`, { userProfile }),
      () => demoFallback.jobs.analyze(id)
    );
  },

  async createJobActionPlan(id: string, userProfile?: any): Promise<{
    analysis: JDAnalysis;
    roadmap: Roadmap;
    interview: InterviewSession;
    nextActions: string[];
  }> {
    return withDemoFallback(
      post<{
        analysis: JDAnalysis;
        roadmap: Roadmap;
        interview: InterviewSession;
        nextActions: string[];
      }>(`/api/jobs/${id}/action-plan`, { userProfile }),
      () => demoFallback.jobs.actionPlan(id)
    );
  },

  async getSavedJobs(config?: ApiRequestConfig): Promise<{ jobs: Job[] }> {
    return withDemoFallback(
      get<{ jobs: Job[] }>('/api/jobs/saved', {
        cacheTtlMs: 30_000,
        ...config,
      }),
      () => demoFallback.jobs.saved()
    );
  },

  async saveJob(id: string): Promise<{ message: string }> {
    return withDemoFallback(
      post<{ message: string }>(`/api/jobs/${id}/save`),
      () => demoFallback.jobs.save()
    );
  },

  async unsaveJob(id: string): Promise<{ message: string }> {
    return withDemoFallback(
      del<{ message: string }>(`/api/jobs/${id}/save`),
      () => demoFallback.jobs.unsave()
    );
  },
};
