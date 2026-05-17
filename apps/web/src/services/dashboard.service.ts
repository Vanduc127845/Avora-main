import { get, type ApiRequestConfig } from './api';
import type { Assessment, InterviewSession, Job, Roadmap } from '../lib/shared';

export type DashboardSummary = {
  savedJobs: Job[];
  roadmaps: Roadmap[];
  interviews: InterviewSession[];
  assessments: Assessment[];
  errors?: string[];
  generatedAt: string;
};

export const dashboardService = {
  async getSummary(config?: ApiRequestConfig): Promise<DashboardSummary> {
    return get<DashboardSummary>('/api/dashboard/summary', {
      cacheTtlMs: 30_000,
      ...config,
    });
  },
};
