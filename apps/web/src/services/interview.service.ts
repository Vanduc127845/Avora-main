import { get, post, type ApiRequestConfig } from './api';
import { demoFallback, withDemoFallback } from './demo-fallback.service';
import type { InterviewSession, InterviewQuestion, InterviewFeedback, InterviewResponse } from '../lib/shared';

export const interviewService = {
  async getInterviews(config?: ApiRequestConfig): Promise<{ interviews: InterviewSession[] }> {
    const response = await withDemoFallback(
      get<{ interviews: InterviewSession[] }>('/api/interviews', {
        cacheTtlMs: 30_000,
        ...config,
      }),
      () => demoFallback.interviews.list()
    );

    if (response.interviews.length === 0 && import.meta.env.VITE_DASHBOARD_DATA_MODE !== 'api') {
      return demoFallback.interviews.list();
    }

    return response;
  },

  async getInterview(id: string, config?: ApiRequestConfig): Promise<{ interview: InterviewSession }> {
    return withDemoFallback(
      get<{ interview: InterviewSession }>(`/api/interviews/${id}`, {
        cacheTtlMs: 10_000,
        ...config,
      }),
      () => demoFallback.interviews.get(id)
    );
  },

  async createInterview(data: {
    targetJobId?: string;
    targetRole?: string;
    jobType?: string;
    focusAreas?: string[];
    accommodations?: string[];
    config?: InterviewSession['config'];
  }): Promise<{ interview: InterviewSession }> {
    return withDemoFallback(
      post<{ interview: InterviewSession }>('/api/interviews', data),
      () => demoFallback.interviews.create(data)
    );
  },

  async getNextQuestion(id: string): Promise<{ question: InterviewQuestion }> {
    return withDemoFallback(
      post<{ question: InterviewQuestion }>(`/api/interviews/${id}/question`, {}),
      () => demoFallback.interviews.nextQuestion(id)
    );
  },

  async submitResponse(
    id: string,
    data: { questionId: string; response: string; audioUrl?: string }
  ): Promise<{ response: InterviewResponse; feedback: InterviewResponse['feedback']; interview: InterviewSession }> {
    return withDemoFallback(
      post<{ response: InterviewResponse; feedback: InterviewResponse['feedback']; interview: InterviewSession }>(`/api/interviews/${id}/respond`, data),
      () => demoFallback.interviews.respond(id, data)
    );
  },

  async pauseInterview(id: string): Promise<{ interview: InterviewSession }> {
    return withDemoFallback(
      post<{ interview: InterviewSession }>(`/api/interviews/${id}/pause`, {}),
      () => demoFallback.interviews.pause(id)
    );
  },

  async resumeInterview(id: string): Promise<{ interview: InterviewSession }> {
    return withDemoFallback(
      post<{ interview: InterviewSession }>(`/api/interviews/${id}/resume`, {}),
      () => demoFallback.interviews.resume(id)
    );
  },

  async completeInterview(id: string): Promise<{ interview: InterviewSession }> {
    return withDemoFallback(
      post<{ interview: InterviewSession }>(`/api/interviews/${id}/complete`, {}),
      () => demoFallback.interviews.complete(id)
    );
  },

  async getFeedback(id: string): Promise<{ feedback: InterviewFeedback }> {
    return withDemoFallback(
      get<{ feedback: InterviewFeedback }>(`/api/interviews/${id}/feedback`),
      () => demoFallback.interviews.feedback()
    );
  },
};
