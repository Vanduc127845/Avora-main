export interface Conversation {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  extractedData?: {
    interests?: string[];
    skills?: string[];
    values?: string[];
    barriers?: string[];
  };
}

export interface InterestCluster {
  name: string;
  score: number;
  examples: string[];
}

export interface SkillAssessment {
  skill: string;
  confidence: number;
  evidence: string[];
}

export interface Value {
  name: string;
  importance: number;
}

export interface WorkStyle {
  type: 'collaborative' | 'independent' | 'mixed';
  pace: 'fast' | 'steady' | 'flexible';
  environment: string[];
  communication: 'async' | 'sync' | 'mixed';
}

export interface CareerMatch {
  title: string;
  matchScore: number;
  reasoning: string;
  accessibilityScore: number;
  growthPotential: number;
  marketDemand: number;
}

export interface AssessmentResult {
  interests: InterestCluster[];
  skills: SkillAssessment[];
  values: string[];
  workStyle: WorkStyle;
  recommendedCareers: CareerMatch[];
}

export interface Assessment {
  id: string;
  userId: string;
  type: 'initial' | 'follow-up' | 'targeted';
  status: 'in-progress' | 'completed';
  conversations: Conversation[];
  results: AssessmentResult;
  createdAt: Date;
  completedAt: Date | null;
}
