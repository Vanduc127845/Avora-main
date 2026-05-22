// Interview types
export interface InterviewConfig {
  types: ('behavioral' | 'technical' | 'situational' | 'disability')[];
  difficulty: 'easy' | 'medium' | 'hard';
  questionCount: number;
  timePerQuestion: number;
  allowPause: boolean;
  includeFollowUp: boolean;
}

export interface InterviewQuestion {
  id: string;
  text: string;
  interviewerPrompt?: string;
  type: string;
  difficulty: string;
  followUpQuestions: string[];
  expectedPoints: string[];
  scoringCriteria: string[];
  accessibilityNotes?: string;
}

export interface InterviewResponse {
  questionId: string;
  response: string;
  audioUrl?: string;
  interviewerReply?: string;
  feedback: {
    score: number;
    strengths: string[];
    improvements: string[];
  };
  timestamp: Date;
}

export interface Pause {
  pausedAt: Date;
  resumedAt?: Date;
  duration?: number;
}

export interface InterviewSettings {
  accommodations: string[];
  startTime: Date;
  duration: number;
  pauses: Pause[];
}

export interface DisabilityDisclosureAdvice {
  shouldDisclose: 'yes' | 'no' | 'optional';
  timing: string;
  script: string;
}

export interface InterviewFeedback {
  overallScore: number;
  categories: {
    name: string;
    score: number;
    feedback: string;
  }[];
  strengths: string[];
  improvements: string[];
  disabilityDisclosureAdvice: DisabilityDisclosureAdvice | null;
  nextSteps: string[];
}

export interface InterviewSession {
  id: string;
  userId: string;
  targetJobId: string;
  config: InterviewConfig;
  status: 'setup' | 'in-progress' | 'paused' | 'completed';
  questions: InterviewQuestion[];
  currentQuestionIndex: number;
  responses: InterviewResponse[];
  feedback: InterviewFeedback | null;
  settings: InterviewSettings;
  createdAt: Date;
  completedAt: Date | null;
}
