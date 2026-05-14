import type { Assessment, AssessmentResult, Conversation } from '../types/shared.js';
import { createId, demoAssessments } from '../data/demo-store.js';
import { getOptionalSupabaseAdmin } from '../utils/supabase.js';
import { AIService } from './ai.service.js';

type AssessmentRow = {
  id: string;
  user_id: string;
  status: string;
  result?: AssessmentResult | null;
  started_at?: string | null;
  completed_at?: string | null;
  created_at?: string | null;
};

type MessageRow = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  extracted_data?: Conversation['extractedData'] | null;
  created_at?: string | null;
};

const emptyResults = (): AssessmentResult => ({
  interests: [],
  skills: [],
  values: [],
  workStyle: {
    type: 'mixed',
    pace: 'flexible',
    environment: [],
    communication: 'mixed',
  },
  recommendedCareers: [],
});

const toConversation = (row: MessageRow): Conversation => ({
  id: row.id,
  role: row.role,
  content: row.content,
  timestamp: row.created_at ? new Date(row.created_at) : new Date(),
  extractedData: row.extracted_data || undefined,
});

const normalizeAssessment = (row: AssessmentRow, conversations: Conversation[] = []): Assessment => ({
  id: row.id,
  userId: row.user_id,
  type: 'initial',
  status: row.status === 'completed' ? 'completed' : 'in-progress',
  conversations,
  results: row.result || emptyResults(),
  createdAt: row.started_at ? new Date(row.started_at) : new Date(row.created_at || Date.now()),
  completedAt: row.completed_at ? new Date(row.completed_at) : null,
});

export class AssessmentService {
  private aiService = new AIService();

  async createAssessment(userId: string): Promise<Assessment> {
    const supabase = getOptionalSupabaseAdmin();
    const openingMessage =
      "Hi, I am the Assessment Orchestrator. I will combine signals from Profile, Jobs, Roadmaps, Interviews, Confidence, and Simulation into one clear career direction. Tell me your goal, current skills, and what support you need most right now.";

    if (supabase) {
      const { data, error } = await supabase
        .from('assessments')
        .insert({ user_id: userId, status: 'active', current_step: 0, total_steps: 5 })
        .select()
        .single();

      if (error) throw error;

      await supabase.from('assessment_messages').insert({
        assessment_id: data.id,
        user_id: userId,
        role: 'assistant',
        content: openingMessage,
      });

      return this.getAssessment(data.id, userId) as Promise<Assessment>;
    }

    const assessment: Assessment = {
      id: createId('assessment'),
      userId,
      type: 'initial',
      status: 'in-progress',
      conversations: [
        {
          id: createId('conv'),
          role: 'assistant',
          content: openingMessage,
          timestamp: new Date(),
        },
      ],
      results: emptyResults(),
      createdAt: new Date(),
      completedAt: null,
    };
    demoAssessments.set(assessment.id, assessment);
    return assessment;
  }

  async getAssessment(id: string, userId: string): Promise<Assessment | null> {
    const supabase = getOptionalSupabaseAdmin();

    if (supabase) {
      const { data, error } = await supabase
        .from('assessments')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      const { data: messages, error: messagesError } = await supabase
        .from('assessment_messages')
        .select('*')
        .eq('assessment_id', id)
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;
      return normalizeAssessment(data as AssessmentRow, (messages || []).map((row) => toConversation(row as MessageRow)));
    }

    const assessment = demoAssessments.get(id);
    return assessment?.userId === userId ? assessment : null;
  }

  async addMessage(
    assessmentId: string,
    userId: string,
    data: { message: string; extractedData?: Conversation['extractedData'] }
  ): Promise<{ assessment: Assessment; response: string }> {
    const assessment = await this.getAssessment(assessmentId, userId);
    if (!assessment) throw new Error('Assessment not found');

    const userMessage: Conversation = {
      id: createId('conv'),
      role: 'user',
      content: data.message,
      timestamp: new Date(),
      extractedData: data.extractedData,
    };

    const aiContent = await this.aiService.chat(userId, data.message, {
      agentId: 'assessment',
      routePath: '/assessment',
      moduleTitle: 'Assessment',
      moduleScope: 'Synthesize specialist agents into one career direction',
      moduleContext: {
        assessmentStatus: assessment.status,
        userMessageCount: assessment.conversations.filter((message) => message.role === 'user').length,
      },
      history: assessment.conversations.map((message) => ({
        role: message.role,
        content: message.content,
      })),
    });

    const aiResponse: Conversation = {
      id: createId('conv'),
      role: 'assistant',
      content: aiContent,
      timestamp: new Date(),
    };

    const supabase = getOptionalSupabaseAdmin();
    if (supabase) {
      const { error } = await supabase.from('assessment_messages').insert([
        {
          assessment_id: assessmentId,
          user_id: userId,
          role: 'user',
          content: userMessage.content,
          extracted_data: userMessage.extractedData || null,
        },
        {
          assessment_id: assessmentId,
          user_id: userId,
          role: 'assistant',
          content: aiResponse.content,
        },
      ]);
      if (error) throw error;

      const updated = await this.getAssessment(assessmentId, userId);
      return { assessment: updated!, response: aiContent };
    }

    const updated: Assessment = {
      ...assessment,
      conversations: [...assessment.conversations, userMessage, aiResponse],
    };
    demoAssessments.set(assessmentId, updated);
    return { assessment: updated, response: aiContent };
  }

  async completeAssessment(id: string, userId: string): Promise<Assessment> {
    const assessment = await this.getAssessment(id, userId);
    if (!assessment) throw new Error('Assessment not found');

    const userResponses = assessment.conversations
      .filter((message) => message.role === 'user')
      .map((message) => message.content);

    const careers = await this.aiService.suggestCareers({
      interests: userResponses,
      skills: userResponses,
      values: userResponses,
    });

    const result: AssessmentResult = {
      interests: [
        { name: 'Technology and problem solving', score: 0.86, examples: userResponses.slice(0, 2) },
        { name: 'Helping others', score: 0.78, examples: userResponses.slice(-2) },
      ],
      skills: [
        { skill: 'Communication', confidence: 0.82, evidence: userResponses.slice(0, 2) },
        { skill: 'Self-advocacy', confidence: 0.78, evidence: ['Shared preferences and needs during assessment'] },
      ],
      values: ['Flexibility', 'Growth', 'Supportive environment'],
      workStyle: {
        type: 'mixed',
        pace: 'flexible',
        environment: ['remote-friendly', 'structured', 'accessible'],
        communication: 'mixed',
      },
      recommendedCareers: careers,
    };

    const supabase = getOptionalSupabaseAdmin();
    if (supabase) {
      const { error } = await supabase
        .from('assessments')
        .update({
          status: 'completed',
          result,
          completed_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', userId);
      if (error) throw error;

      const updated = await this.getAssessment(id, userId);
      return updated!;
    }

    const updated: Assessment = {
      ...assessment,
      status: 'completed',
      results: result,
      completedAt: new Date(),
    };
    demoAssessments.set(id, updated);
    return updated;
  }

  async getAssessmentHistory(userId: string): Promise<Assessment[]> {
    const supabase = getOptionalSupabaseAdmin();

    if (supabase) {
      const { data, error } = await supabase
        .from('assessments')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map((row) => normalizeAssessment(row as AssessmentRow));
    }

    return [...demoAssessments.values()]
      .filter((assessment) => assessment.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}
