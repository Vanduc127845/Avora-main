import { get, post } from './api';
import type { InterviewSession, InterviewQuestion, InterviewFeedback } from '../lib/shared';

export const interviewService = {
  async getInterviews(): Promise<{ interviews: InterviewSession[] }> {
    return get<{ interviews: InterviewSession[] }>('/api/interviews');
  },

  async getInterview(id: string): Promise<{ interview: InterviewSession }> {
    return get<{ interview: InterviewSession }>(`/api/interviews/${id}`);
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
  ): Promise<{ feedback: any }> {
    return post<{ feedback: any }>(`/api/interviews/${id}/respond`, data);
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
