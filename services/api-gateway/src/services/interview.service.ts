import type {
  InterviewFeedback,
  InterviewQuestion,
  InterviewResponse,
  InterviewSession,
} from '../types/shared.js';
import { createId, demoInterviews } from '../data/demo-store.js';
import { getOptionalSupabaseAdmin } from '../utils/supabase.js';
import { AIService } from './ai.service.js';

type InterviewRow = {
  id: string;
  user_id: string;
  payload: InterviewSession;
  created_at?: string | null;
  updated_at?: string | null;
};

const normalizeInterviewRow = (row: InterviewRow): InterviewSession => ({
  ...row.payload,
  id: row.id,
  userId: row.user_id,
  createdAt: row.created_at ? new Date(row.created_at) : new Date(row.payload.createdAt),
  completedAt: row.payload.completedAt ? new Date(row.payload.completedAt) : null,
  settings: {
    ...row.payload.settings,
    startTime: new Date(row.payload.settings.startTime),
    pauses: row.payload.settings.pauses.map((pause) => ({
      pausedAt: new Date(pause.pausedAt),
      resumedAt: pause.resumedAt ? new Date(pause.resumedAt) : undefined,
    })),
  },
  responses: row.payload.responses.map((response) => ({
    ...response,
    timestamp: new Date(response.timestamp),
  })),
});

export class InterviewService {
  private aiService = new AIService();

  async getUserInterviews(userId: string): Promise<InterviewSession[]> {
    const supabase = getOptionalSupabaseAdmin();

    if (supabase) {
      const { data, error } = await supabase
        .from('interview_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return (data || []).map((row) => normalizeInterviewRow(row as InterviewRow));
    }

    return [...demoInterviews.values()]
      .filter((interview) => interview.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createInterview(userId: string, data: any): Promise<InterviewSession> {
    const config = {
      types: data.config?.types || ['behavioral', 'situational', 'disability'],
      difficulty: data.config?.difficulty || 'medium',
      questionCount: data.config?.questionCount || 5,
      timePerQuestion: data.config?.timePerQuestion || 120,
      allowPause: data.config?.allowPause ?? true,
      includeFollowUp: data.config?.includeFollowUp ?? true,
    };
    const targetRole = data.targetRole || data.jobType || 'Target Role';
    const focusAreas = Array.isArray(data.focusAreas) ? data.focusAreas.filter((item: unknown) => typeof item === 'string') : [];
    const questions = await this.aiService.generateInterviewQuestions(
      targetRole,
      config.difficulty,
      config.questionCount,
      {
        focusAreas,
        selectedJobId: data.targetJobId,
      }
    );

    const session: InterviewSession = {
      id: createId('interview'),
      userId,
      targetJobId: data.targetJobId || '',
      config,
      status: 'in-progress',
      questions,
      currentQuestionIndex: 0,
      responses: [],
      feedback: null,
      settings: {
        accommodations: data.accommodations || [],
        startTime: new Date(),
        duration: 0,
        pauses: [],
      },
      createdAt: new Date(),
      completedAt: null,
    };

    return this.persistInterview(session);
  }

  async getInterviewById(id: string, userId: string): Promise<InterviewSession | null> {
    const supabase = getOptionalSupabaseAdmin();

    if (supabase) {
      const { data, error } = await supabase
        .from('interview_sessions')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .maybeSingle();
      if (error) throw error;
      return data ? normalizeInterviewRow(data as InterviewRow) : null;
    }

    const interview = demoInterviews.get(id);
    return interview?.userId === userId ? interview : null;
  }

  async getNextQuestion(interviewId: string, userId: string): Promise<InterviewQuestion | null> {
    const interview = await this.getInterviewById(interviewId, userId);
    if (!interview) throw new Error('Interview not found');
    return interview.questions[interview.currentQuestionIndex] || null;
  }

  async submitResponse(
    interviewId: string,
    userId: string,
    data: { questionId: string; response: string; audioUrl?: string }
  ): Promise<{ response: InterviewResponse; feedback: InterviewResponse['feedback']; interview: InterviewSession }> {
    const interview = await this.getInterviewById(interviewId, userId);
    if (!interview) throw new Error('Interview not found');

    const currentQuestion =
      interview.questions.find((question) => question.id === data.questionId) ||
      interview.questions[interview.currentQuestionIndex];
    if (!currentQuestion) throw new Error('Question not found');

    const answeredCount = interview.responses.length + 1;
    const isComplete = answeredCount >= interview.questions.length;
    const nextQuestion = isComplete ? undefined : interview.questions[interview.currentQuestionIndex + 1];
    const feedback = await this.aiService.getInterviewFeedback(
      userId,
      [
        {
          ...data,
          question: currentQuestion.text,
          expectedPoints: currentQuestion.expectedPoints,
          scoringCriteria: currentQuestion.scoringCriteria,
        },
      ],
      'practice interview'
    );
    const interviewerReply = await this.aiService.generateInterviewTurnReply({
      jobType: 'practice interview',
      question: currentQuestion,
      answer: data.response,
      feedback,
      nextQuestion,
      questionIndex: answeredCount,
      totalQuestions: interview.questions.length,
      isComplete,
    });
    const response: InterviewResponse = {
      questionId: data.questionId,
      response: data.response,
      audioUrl: data.audioUrl,
      interviewerReply,
      feedback: {
        score: feedback.overallScore,
        strengths: feedback.strengths.slice(0, 3),
        improvements: feedback.improvements.slice(0, 3),
      },
      timestamp: new Date(),
    };

    const next: InterviewSession = {
      ...interview,
      responses: [...interview.responses, response],
      currentQuestionIndex: Math.min(interview.currentQuestionIndex + 1, interview.questions.length - 1),
      status:
        isComplete
          ? 'completed'
          : interview.status === 'setup'
            ? 'in-progress'
            : interview.status,
      feedback: isComplete ? feedback : interview.feedback,
      completedAt: isComplete ? new Date() : interview.completedAt,
    };

    const saved = await this.persistInterview(next);
    return { response, feedback: response.feedback, interview: saved };
  }

  async pauseInterview(interviewId: string, userId: string): Promise<InterviewSession> {
    const interview = await this.getInterviewById(interviewId, userId);
    if (!interview) throw new Error('Interview not found');

    return this.persistInterview({
      ...interview,
      status: 'paused',
      settings: {
        ...interview.settings,
        pauses: [...interview.settings.pauses, { pausedAt: new Date() }],
      },
    });
  }

  async resumeInterview(interviewId: string, userId: string): Promise<InterviewSession> {
    const interview = await this.getInterviewById(interviewId, userId);
    if (!interview) throw new Error('Interview not found');

    const pauses = [...interview.settings.pauses];
    const lastPause = pauses[pauses.length - 1];
    if (lastPause && !lastPause.resumedAt) lastPause.resumedAt = new Date();

    return this.persistInterview({
      ...interview,
      status: 'in-progress',
      settings: { ...interview.settings, pauses },
    });
  }

  async completeInterview(interviewId: string, userId: string): Promise<InterviewSession> {
    const interview = await this.getInterviewById(interviewId, userId);
    if (!interview) throw new Error('Interview not found');

    const feedback =
      interview.feedback ||
      (await this.aiService.getInterviewFeedback(userId, interview.responses, 'practice interview'));

    return this.persistInterview({
      ...interview,
      status: 'completed',
      feedback,
      completedAt: new Date(),
    });
  }

  async getFeedback(interviewId: string, userId: string): Promise<InterviewFeedback | null> {
    const interview = await this.getInterviewById(interviewId, userId);
    if (!interview) throw new Error('Interview not found');
    return interview.feedback;
  }

  private async persistInterview(session: InterviewSession): Promise<InterviewSession> {
    const supabase = getOptionalSupabaseAdmin();

    if (supabase) {
      const { data, error } = await supabase
        .from('interview_sessions')
        .upsert(
          {
            id: session.id,
            user_id: session.userId,
            status: session.status,
            payload: session,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        )
        .select()
        .single();

      if (error) throw error;
      return normalizeInterviewRow(data as InterviewRow);
    }

    demoInterviews.set(session.id, session);
    return session;
  }
}
