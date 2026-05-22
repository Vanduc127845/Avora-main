// API Gateway contract types. These mirror packages/shared so the gateway can
// build independently in NodeNext without relying on Vite path aliases.

export type DisabilityType =
  | 'motor'
  | 'visual'
  | 'auditory'
  | 'cognitive'
  | 'speech'
  | 'chronic_illness'
  | 'psychiatric'
  | 'other';

export type SeverityLevel = 'mild' | 'moderate' | 'severe' | 'profound';

export interface Accommodation {
  type: string;
  description: string;
  required: boolean;
}

export interface AccessibilitySettings {
  fontSize: number;
  highContrast: boolean;
  reducedMotion: boolean;
  voiceNavigation: boolean;
  keyboardOnly: boolean;
  screenReaderOptimized: boolean;
  extraTime: boolean;
  preferredInput: 'voice' | 'text' | 'switch' | 'eye-tracking';
}

export interface DisabilityProfile {
  primaryType: DisabilityType | null;
  secondaryTypes: DisabilityType[];
  severity: SeverityLevel | null;
  accommodations: Accommodation[];
  onsetAge: number | null;
  disclosureLevel: 'public' | 'connections' | 'private';
}

export interface Skill {
  id: string;
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  disabilityAdapted: boolean;
  adaptationNotes?: string;
}

export interface WorkPreferences {
  remote: 'required' | 'preferred' | 'flexible' | 'onsite';
  schedule: 'full-time' | 'part-time' | 'flexible' | 'contract';
  environment: string[];
  commuteTolerance: number;
}

export interface PrivacySettings {
  shareProfile: boolean;
  shareProgress: boolean;
  anonymousAnalytics: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  provider?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  disabilityProfile: DisabilityProfile;
  accessibilitySettings: AccessibilitySettings;
  careerProfile: {
    interests: string[];
    skills: Skill[];
    values: string[];
    workPreferences: WorkPreferences;
    targetRoles: string[];
    experienceLevel: 'entry' | 'mid' | 'senior' | 'executive';
  };
  privacySettings: PrivacySettings;
}

export interface AgentTrace {
  agentId: string;
  agentName: string;
  status: 'complete' | 'needs-input' | 'queued' | 'error';
  runtimeStatus?: 'idle' | 'thinking' | 'done' | 'error';
  summary: string;
  evidence: string[];
  handoff: string;
  rawOutput?: string;
  confidence: number;
  actions: string[];
}

export interface OrchestrationAction {
  label: string;
  targetAgent: string;
  route: string;
  prompt: string;
}

export interface OrchestrationPlan {
  intent: string;
  selectedJob?: string;
  jdSource?: string;
  missingInputs: string[];
  agentTraces: AgentTrace[];
  nextActions: OrchestrationAction[];
  finalRecommendation: string;
  summaryCard?: {
    goal: string;
    jobTitle: string;
    jdSource: string;
    topGaps: { skill: string; priority: 'High' | 'Medium' | 'Low'; reason: string }[];
    weeklyRoadmap: { week: string; skill: string; resource: string; output: string }[];
    interviewQuestions: string[];
    nextAction: string;
  };
  generatedAt: string;
}

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
    orchestration?: OrchestrationPlan;
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

export interface JDAnalysis {
  summary: {
    plainLanguage: string;
    readingLevel: number;
    confidence: number;
  };
  keyResponsibilities: {
    original: string;
    simplified: string;
    difficulty: 'easy' | 'medium' | 'hard';
    accommodationPossible: boolean;
  }[];
  skills: {
    name: string;
    importance: 'required' | 'preferred' | 'nice-to-have';
    transferable: boolean;
  }[];
  accessibility: {
    remotePotential: number;
    physicalDemands: 'minimal' | 'moderate' | 'significant';
    accommodationScore: number;
    barriers: string[];
    suggestions: string[];
  };
  compensation: {
    range: { min: number; max: number };
    currency: string;
    benchmark: number;
  };
  fit?: JobFitAnalysis;
}

export interface JobFitAnalysis {
  matchScore: number;
  verdict: string;
  matchedSkills: string[];
  missingSkills: {
    name: string;
    importance: 'critical' | 'important' | 'nice-to-have';
    reason: string;
    learningPriority: number;
  }[];
  missingRequirements: {
    requirement: string;
    impact: 'high' | 'medium' | 'low';
    workaround: string;
  }[];
  portfolioProjects: {
    title: string;
    goal: string;
    skills: string[];
  }[];
  roadmapFocus: string[];
  interviewFocus: string[];
  nextActions: string[];
}

export interface Job {
  id: string;
  source: string;
  url: string;
  basic: {
    title: string;
    company: string;
    location: string;
    remote: 'remote' | 'hybrid' | 'onsite';
    salary: { min: number; max: number; currency: string } | null;
  };
  details: {
    description: string;
    responsibilities: string[];
    requirements: {
      education: string[];
      experience: string;
      skills: string[];
    };
    benefits: string[];
  };
  accessibility: {
    rating: number;
    features: string[];
    accommodations: string[];
    barriers: string[];
    communityRating: number;
  };
  analysis: JDAnalysis | null;
  postedAt: Date;
  scrapedAt: Date;
}

export interface JobSearchParams {
  query?: string;
  location?: string;
  remote?: boolean;
  disabilityFriendly?: boolean;
  page?: number;
  limit?: number;
}

export interface LearningResource {
  id: string;
  title: string;
  type: 'article' | 'video' | 'course' | 'book' | 'exercise';
  url: string;
  accessibilityFeatures: string[];
  accommodations: string[];
  estimatedDuration: number;
}

export interface LearningItem {
  id: string;
  title: string;
  description: string;
  type: 'lesson' | 'video' | 'exercise' | 'quiz' | 'project';
  duration: number;
  resources: LearningResource[];
  completedAt: Date | null;
  score?: number;
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  type: 'skill' | 'project' | 'certification' | 'checkpoint';
  items: LearningItem[];
  completedAt: Date | null;
}

export interface RoadmapPhase {
  id: string;
  name: string;
  description: string;
  order: number;
  milestones: Milestone[];
  estimatedDuration: number;
  actualDuration?: number;
}

export interface GapSkill {
  name: string;
  importance: 'critical' | 'important' | 'nice-to-have';
  currentLevel: number;
  targetLevel: number;
  resources: LearningResource[];
}

export interface Roadmap {
  id: string;
  userId: string;
  targetJobId: string;
  title: string;
  description: string;
  currentSkills: string[];
  gapSkills: GapSkill[];
  phases: RoadmapPhase[];
  settings: {
    weeklyHours: number;
    preferredPace: 'intensive' | 'moderate' | 'relaxed';
    accommodations: string[];
  };
  progress: {
    completedItems: number;
    totalItems: number;
    percentComplete: number;
    currentPhase: number;
    lastActivityAt: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

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

export interface InterviewFeedback {
  overallScore: number;
  categories: {
    name: string;
    score: number;
    feedback: string;
  }[];
  strengths: string[];
  improvements: string[];
  disabilityDisclosureAdvice: {
    shouldDisclose: 'yes' | 'no' | 'optional';
    timing: string;
    script: string;
  } | null;
  nextSteps: string[];
}

export interface Pause {
  pausedAt: Date;
  resumedAt?: Date;
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
  settings: {
    accommodations: string[];
    startTime: Date;
    duration: number;
    pauses: Pause[];
  };
  createdAt: Date;
  completedAt: Date | null;
}
