import { get, post, type ApiRequestConfig } from './api';
import type { InterviewSession, InterviewQuestion, InterviewFeedback, InterviewResponse } from '../lib/shared';

export const interviewService = {
  async getInterviews(config?: ApiRequestConfig): Promise<{ interviews: InterviewSession[] }> {
    return get<{ interviews: InterviewSession[] }>('/api/interviews', {
      cacheTtlMs: 30_000,
      ...config,
    });
  },

  async getInterview(id: string, config?: ApiRequestConfig): Promise<{ interview: InterviewSession }> {
    return get<{ interview: InterviewSession }>(`/api/interviews/${id}`, {
      cacheTtlMs: 10_000,
      ...config,
    });
  },

  async createInterview(data: {
    targetJobId?: string;
    targetRole?: string;
    jobType?: string;
    focusAreas?: string[];
    accommodations?: string[];
    config?: InterviewSession['config'];
  }): Promise<{ interview: InterviewSession }> {
    return post<{ interview: InterviewSession }>('/api/interviews', data);
  },

  async getNextQuestion(id: string): Promise<{ question: InterviewQuestion }> {
    return post<{ question: InterviewQuestion }>(`/api/interviews/${id}/question`, {});
  },

  async submitResponse(
    id: string,
    data: { questionId: string; response: string; audioUrl?: string }
  ): Promise<{ response: InterviewResponse; feedback: InterviewResponse['feedback']; interview: InterviewSession }> {
    return post<{ response: InterviewResponse; feedback: InterviewResponse['feedback']; interview: InterviewSession }>(`/api/interviews/${id}/respond`, data);
  },

  async pauseInterview(id: string): Promise<{ interview: InterviewSession }> {
    return post<{ interview: InterviewSession }>(`/api/interviews/${id}/pause`, {});
  },

  async resumeInterview(id: string): Promise<{ interview: InterviewSession }> {
    return post<{ interview: InterviewSession }>(`/api/interviews/${id}/resume`, {});
  },

  async completeInterview(id: string): Promise<{ interview: InterviewSession }> {
    return post<{ interview: InterviewSession }>(`/api/interviews/${id}/complete`, {});
  },

  async getFeedback(id: string): Promise<{ feedback: InterviewFeedback }> {
    return get<{ feedback: InterviewFeedback }>(`/api/interviews/${id}/feedback`);
  },
};
