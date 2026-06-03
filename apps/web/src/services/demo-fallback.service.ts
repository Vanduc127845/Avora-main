import type {
  Assessment,
  Conversation,
  InterviewFeedback,
  InterviewQuestion,
  InterviewResponse,
  InterviewSession,
  JDAnalysis,
  Job,
  JobSearchParams,
  OrchestrationPlan,
  Roadmap,
  UserProfile,
} from '../lib/shared';
import { useAuthStore } from '../store/auth.store';
import { isRequestCanceled } from './api';
import { getMockDashboardSummary } from './dashboard.service';
import type { ConfidenceEntry } from './confidence.service';

type AiChatPayload = {
  message: string;
  context?: Record<string, unknown>;
};

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const timestampId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const generatedRoadmaps = new Map<string, Roadmap>();
const generatedInterviews = new Map<string, InterviewSession>();
const generatedAssessments = new Map<string, Assessment>();
let generatedConfidenceEntries: ConfidenceEntry[] = [];

export async function withDemoFallback<T>(
  operation: Promise<T>,
  fallback: () => T | Promise<T>
): Promise<T> {
  try {
    return await operation;
  } catch (error) {
    if (isRequestCanceled(error)) throw error;
    return fallback();
  }
}

const getJobs = () => clone(getMockDashboardSummary().savedJobs);
const getRoadmaps = () => [
  ...Array.from(generatedRoadmaps.values()).map((roadmap) => clone(roadmap)),
  ...clone(getMockDashboardSummary().roadmaps),
];
const getInterviews = () => [
  ...Array.from(generatedInterviews.values()).map((interview) => normalizeInterview(interview)),
  ...clone(getMockDashboardSummary().interviews).map((interview) => normalizeInterview(interview)),
];
const getAssessments = () => [
  ...Array.from(generatedAssessments.values()).map((assessment) => clone(assessment)),
  ...clone(getMockDashboardSummary().assessments),
];

const defaultQuestion = (index = 1): InterviewQuestion => ({
  id: `demo-question-${index}`,
  text: index === 1
    ? 'Tell me about a project where you improved an experience for different users.'
    : 'How would you ask for the support you need while keeping the work moving?',
  type: index === 1 ? 'behavioral' : 'disability',
  difficulty: 'medium',
  followUpQuestions: ['What was the result?', 'What would you improve next time?'],
  expectedPoints: ['Situation', 'Action', 'Result', 'Reflection'],
  scoringCriteria: ['Specificity', 'Structure', 'Practical next step'],
  accessibilityNotes: 'You can pause, write notes first, and answer in your own pace.',
});

const defaultQuestions = (): InterviewQuestion[] => [
  defaultQuestion(1),
  {
    ...defaultQuestion(2),
    id: 'demo-question-2',
    text: 'Describe a time you handled unclear instructions or competing priorities.',
    type: 'situational',
  },
  {
    ...defaultQuestion(3),
    id: 'demo-question-3',
    text: 'What accommodations or work conditions help you do your best work?',
    type: 'disability',
  },
];

const normalizeInterview = (interview: InterviewSession): InterviewSession => {
  const next = clone(interview);
  next.questions = next.questions?.length ? next.questions : defaultQuestions();
  const maxIndex = Math.max(0, next.questions.length - 1);
  next.currentQuestionIndex = Math.min(Math.max(0, next.currentQuestionIndex || 0), maxIndex);
  return next;
};

const fallbackFeedback = (score = 8): InterviewFeedback => ({
  overallScore: score,
  categories: [
    { name: 'Structure', score: score - 0.4, feedback: 'Clear answer flow. Add one measurable result.' },
    { name: 'Confidence', score, feedback: 'Professional and practical communication.' },
  ],
  strengths: ['Clear examples', 'Good awareness of support needs'],
  improvements: ['Use one concrete metric', 'Keep the answer under two minutes'],
  disabilityDisclosureAdvice: {
    shouldDisclose: 'optional',
    timing: 'After the role fit is clear',
    script: 'I do my best work with written context and captioned meetings, which helps me deliver reliably.',
  },
  nextSteps: ['Practice one STAR answer', 'Prepare two questions for the interviewer'],
});

const defaultProfile = (): UserProfile => {
  const authUser = useAuthStore.getState().user;
  const now = new Date().toISOString();

  return {
    id: authUser?.id || 'demo-user',
    email: authUser?.email || 'demo@avora.local',
    name: authUser?.name || authUser?.email?.split('@')[0] || 'Avora Demo User',
    avatar: authUser?.avatar,
    provider: authUser?.provider || 'demo',
    createdAt: authUser?.createdAt || now,
    updatedAt: authUser?.updatedAt || now,
    disabilityProfile: {
      primaryType: authUser?.disabilityProfile?.primaryType || null,
      secondaryTypes: authUser?.disabilityProfile?.secondaryTypes || [],
      severity: authUser?.disabilityProfile?.severity || null,
      accommodations: authUser?.disabilityProfile?.accommodations || [],
      onsetAge: authUser?.disabilityProfile?.onsetAge || null,
      disclosureLevel: authUser?.disabilityProfile?.disclosureLevel || 'private',
    },
    accessibilitySettings: {
      fontSize: authUser?.accessibilitySettings?.fontSize || 16,
      highContrast: authUser?.accessibilitySettings?.highContrast || false,
      reducedMotion: authUser?.accessibilitySettings?.reducedMotion || false,
      voiceNavigation: authUser?.accessibilitySettings?.voiceNavigation || false,
      keyboardOnly: authUser?.accessibilitySettings?.keyboardOnly || false,
      screenReaderOptimized: authUser?.accessibilitySettings?.screenReaderOptimized || false,
      extraTime: authUser?.accessibilitySettings?.extraTime || false,
      preferredInput: authUser?.accessibilitySettings?.preferredInput || 'text',
    },
    careerProfile: {
      interests: authUser?.careerProfile?.interests || ['Accessible technology', 'Remote collaboration'],
      skills: authUser?.careerProfile?.skills || [
        { id: 'skill-react', name: 'React', level: 'intermediate', disabilityAdapted: true },
        { id: 'skill-accessibility', name: 'Accessibility QA', level: 'beginner', disabilityAdapted: true },
      ],
      values: authUser?.careerProfile?.values || ['Autonomy', 'Inclusive teams', 'Clear communication'],
      workPreferences: authUser?.careerProfile?.workPreferences || {
        remote: 'preferred',
        schedule: 'flexible',
        environment: ['Remote', 'Quiet focus time', 'Async collaboration'],
        commuteTolerance: 30,
      },
      targetRoles: authUser?.careerProfile?.targetRoles || ['Accessibility QA Analyst', 'Junior Frontend Developer'],
      experienceLevel: authUser?.careerProfile?.experienceLevel || 'entry',
    },
    privacySettings: {
      shareProfile: authUser?.privacySettings?.shareProfile || false,
      shareProgress: authUser?.privacySettings?.shareProgress || false,
      anonymousAnalytics: authUser?.privacySettings?.anonymousAnalytics ?? true,
    },
  };
};

const findJob = (id: string): Job => getJobs().find((job) => job.id === id) || getJobs()[0];
const findRoadmap = (id: string): Roadmap => getRoadmaps().find((roadmap) => roadmap.id === id) || getRoadmaps()[0];
const findInterview = (id: string): InterviewSession =>
  getInterviews().find((interview) => interview.id === id) || normalizeInterview(getInterviews()[0]);

const makeRoadmapFromJob = (job: Job, title?: string): Roadmap => {
  const base = clone(getMockDashboardSummary().roadmaps[0]);
  const now = new Date();
  const roadmap: Roadmap = {
    ...base,
    id: timestampId('roadmap'),
    targetJobId: job.id,
    title: title || `${job.basic.title} roadmap`,
    description: `Demo learning plan for ${job.basic.title}.`,
    gapSkills: job.analysis?.fit?.missingSkills.map((skill) => ({
      name: skill.name,
      importance: skill.importance,
      currentLevel: 2,
      targetLevel: 4,
      resources: [
        {
          id: `${skill.name.toLowerCase().replace(/\s+/g, '-')}-resource`,
          title: `${skill.name} practice resource`,
          type: 'exercise',
          url: 'https://example.com/learning',
          accessibilityFeatures: ['Captions', 'Plain-language notes', 'Keyboard navigation'],
          accommodations: ['Self-paced', 'Downloadable transcript'],
          estimatedDuration: 90,
        },
      ],
    })) || base.gapSkills,
    progress: {
      completedItems: 0,
      totalItems: Math.max(1, base.progress.totalItems),
      percentComplete: 0,
      currentPhase: 1,
      lastActivityAt: now,
    },
    createdAt: now,
    updatedAt: now,
  };

  generatedRoadmaps.set(roadmap.id, roadmap);
  return clone(roadmap);
};

const makeInterview = (targetRole = 'Accessibility QA Analyst', targetJobId = 'job-accessibility-qa'): InterviewSession => {
  const now = new Date();
  const interview: InterviewSession = {
    id: timestampId('interview'),
    userId: defaultProfile().id,
    targetJobId,
    config: {
      types: ['behavioral', 'situational', 'disability'],
      difficulty: 'medium',
      questionCount: 3,
      timePerQuestion: 180,
      allowPause: true,
      includeFollowUp: true,
    },
    status: 'in-progress',
    questions: defaultQuestions(),
    currentQuestionIndex: 0,
    responses: [],
    feedback: null,
    settings: {
      accommodations: ['Pause button', 'Written prompts', 'Extra preparation time'],
      startTime: now,
      duration: 25,
      pauses: [],
    },
    createdAt: now,
    completedAt: null,
  };

  interview.questions[0] = {
    ...interview.questions[0],
    text: `Tell me why ${targetRole} is a good fit for your current skills and access needs.`,
  };

  generatedInterviews.set(interview.id, interview);
  return clone(interview);
};

const emptyResults = (): Assessment['results'] => ({
  interests: [],
  skills: [],
  values: [],
  workStyle: {
    type: 'mixed',
    pace: 'steady',
    environment: ['Remote', 'Quiet focus time'],
    communication: 'async',
  },
  recommendedCareers: [],
});

const makeOrchestration = (message: string): OrchestrationPlan => ({
  intent: 'career_assessment_demo',
  selectedJob: message.toLowerCase().includes('frontend') ? 'Junior Frontend Developer' : 'Accessibility QA Analyst',
  missingInputs: [],
  agentTraces: [
    {
      agentId: 'assessment',
      agentName: 'Assessment Agent',
      status: 'complete',
      runtimeStatus: 'done',
      summary: 'Identified a practical target role and the first skill gaps.',
      evidence: ['User message', 'Demo profile'],
      handoff: 'Send target role to roadmap and interview agents.',
      confidence: 0.84,
      actions: ['Clarify target role', 'Generate next steps'],
    },
    {
      agentId: 'roadmap',
      agentName: 'Roadmap Agent',
      status: 'complete',
      runtimeStatus: 'done',
      summary: 'Suggested a short learning path focused on portfolio proof.',
      evidence: ['Target role', 'Known skills'],
      handoff: 'Create a focused roadmap.',
      confidence: 0.82,
      actions: ['Build weekly plan'],
    },
  ],
  nextActions: [
    {
      label: 'Create roadmap',
      targetAgent: 'roadmap',
      route: '/roadmaps',
      prompt: 'Create a roadmap for the selected role.',
    },
    {
      label: 'Practice interview',
      targetAgent: 'interview',
      route: '/interviews',
      prompt: 'Start a mock interview for this role.',
    },
  ],
  finalRecommendation: 'Start with one target role, complete a short portfolio task, then practice one interview answer.',
  summaryCard: {
    goal: 'Prepare a focused career path',
    jobTitle: 'Accessibility QA Analyst',
    jdSource: 'Demo assessment',
    topGaps: [
      { skill: 'WCAG audit reporting', priority: 'High', reason: 'Common for accessibility QA roles.' },
      { skill: 'Portfolio storytelling', priority: 'Medium', reason: 'Helps explain your work clearly.' },
    ],
    weeklyRoadmap: [
      { week: 'Week 1', skill: 'WCAG basics', resource: 'Keyboard testing checklist', output: 'Audit notes' },
      { week: 'Week 2', skill: 'Bug reports', resource: 'Issue writing exercise', output: 'Portfolio case study' },
    ],
    interviewQuestions: [
      'Tell me about a time you improved accessibility.',
      'How do you communicate access needs at work?',
    ],
    nextAction: 'Choose one role and create a roadmap.',
  },
  generatedAt: new Date().toISOString(),
});

const makeAssessment = (): Assessment => {
  const now = new Date();
  const assessment: Assessment = {
    id: timestampId('assessment'),
    userId: defaultProfile().id,
    type: 'initial',
    status: 'in-progress',
    conversations: [
      {
        id: timestampId('message'),
        role: 'assistant',
        content: 'Tell me your target role, current skills, or paste a job description. I will turn it into a practical next step.',
        timestamp: now,
      },
    ],
    results: emptyResults(),
    createdAt: now,
    completedAt: null,
  };

  generatedAssessments.set(assessment.id, assessment);
  return clone(assessment);
};

const findAssessment = (id: string): Assessment => {
  const assessment = generatedAssessments.get(id) || getAssessments().find((item) => item.id === id);
  return assessment ? clone(assessment) : makeAssessment();
};

const makeChatResponse = ({ message, context }: AiChatPayload): string => {
  const agentId = String(context?.agentId || 'avora');
  const trimmed = message.trim();
  const prefixByAgent: Record<string, string> = {
    profile: 'Profile Agent',
    jobs: 'Jobs Agent',
    roadmap: 'Roadmap Agent',
    interview: 'Interview Agent',
    confidence: 'Confidence Agent',
    simulation: 'Simulation Agent',
    dashboard: 'Overview Agent',
  };
  const label = prefixByAgent[agentId] || 'Avora Agent';

  if (agentId === 'simulation') {
    return [
      'Good simulation response. Keep the structure: acknowledge the situation, state the action, and close with a clear next step.',
      'Risk to avoid: do not over-explain private details when a practical work request is enough.',
      'Practice script: "I can complete the highest-priority item today. Please confirm whether you want the audit notes or the fixes first."',
    ].join('\n\n');
  }

  if (agentId === 'confidence') {
    return [
      'Start with one small action today.',
      'Name the blocker in one sentence, choose the next visible step, and ask for written context when needed.',
      'Script: "I can move this forward if we confirm the priority and success criteria in writing."',
    ].join('\n\n');
  }

  return `${label}: I can help with "${trimmed || 'your next step'}". For the demo, start by choosing one target role, save one matching job, then create a roadmap and a mock interview from it.`;
};

export const demoFallback = {
  profile: {
    get: () => ({ user: defaultProfile() }),
    update: (updates: Partial<UserProfile>) => {
      const user = { ...defaultProfile(), ...updates, updatedAt: new Date().toISOString() };
      useAuthStore.getState().updateProfile(user);
      return { user };
    },
    delete: () => ({ message: 'Demo account delete skipped.' }),
  },

  jobs: {
    search: (params: JobSearchParams = {}) => {
      const query = params.query?.trim().toLowerCase();
      const page = Math.max(1, params.page || 1);
      const limit = Math.max(1, params.limit || 10);
      let jobs = getJobs();

      if (query) {
        jobs = jobs.filter((job) => {
          const haystack = [
            job.basic.title,
            job.basic.company,
            job.basic.location,
            job.details.description,
            ...job.details.requirements.skills,
          ].join(' ').toLowerCase();
          return haystack.includes(query);
        });
      }

      if (params.remote) {
        jobs = jobs.filter((job) => job.basic.remote === 'remote');
      }

      if (params.disabilityFriendly) {
        jobs = jobs.filter((job) => job.accessibility.rating >= 80);
      }

      const total = jobs.length;
      const totalPages = Math.max(1, Math.ceil(total / limit));
      const start = (page - 1) * limit;

      return { jobs: jobs.slice(start, start + limit), total, page, totalPages };
    },
    get: (id: string) => ({ job: findJob(id) }),
    saved: () => ({ jobs: getJobs().slice(0, 1) }),
    analyze: (id: string): { analysis: JDAnalysis } => ({ analysis: findJob(id).analysis || getJobs()[0].analysis! }),
    actionPlan: (id: string) => {
      const job = findJob(id);
      const roadmap = makeRoadmapFromJob(job);
      const interview = makeInterview(job.basic.title, job.id);
      return {
        analysis: job.analysis || getJobs()[0].analysis!,
        roadmap,
        interview,
        nextActions: job.analysis?.fit?.nextActions || ['Create a roadmap', 'Practice one interview answer'],
      };
    },
    save: () => ({ message: 'Job saved in demo mode.' }),
    unsave: () => ({ message: 'Job removed from saved list in demo mode.' }),
  },

  roadmaps: {
    list: () => ({ roadmaps: getRoadmaps() }),
    get: (id: string) => ({ roadmap: findRoadmap(id) }),
    create: (data: { title?: string; targetRole?: string; targetJobId?: string }) => {
      const job = data.targetJobId ? findJob(data.targetJobId) : getJobs()[0];
      return { roadmap: makeRoadmapFromJob(job, data.title || data.targetRole) };
    },
    update: (id: string, updates: Partial<Roadmap>) => {
      const roadmap = { ...findRoadmap(id), ...updates, updatedAt: new Date() };
      generatedRoadmaps.set(id, roadmap);
      return { roadmap };
    },
    delete: (id: string) => {
      generatedRoadmaps.delete(id);
      return { message: 'Roadmap deleted in demo mode.' };
    },
    completeItem: (roadmapId: string, itemId: string) => {
      const roadmap = findRoadmap(roadmapId);
      roadmap.phases = roadmap.phases.map((phase) => ({
        ...phase,
        milestones: phase.milestones.map((milestone) => ({
          ...milestone,
          items: milestone.items.map((item) =>
            item.id === itemId ? { ...item, completedAt: new Date() } : item
          ),
        })),
      }));
      roadmap.progress = {
        ...roadmap.progress,
        completedItems: Math.min(roadmap.progress.totalItems, roadmap.progress.completedItems + 1),
        percentComplete: Math.min(100, roadmap.progress.percentComplete + 12),
        lastActivityAt: new Date(),
      };
      generatedRoadmaps.set(roadmapId, roadmap);
      return { roadmap };
    },
    updateProgress: (id: string, updates: { completedItems?: number; currentPhase?: number }) => {
      const roadmap = findRoadmap(id);
      roadmap.progress = {
        ...roadmap.progress,
        ...updates,
        percentComplete: updates.completedItems !== undefined
          ? Math.round((updates.completedItems / Math.max(1, roadmap.progress.totalItems)) * 100)
          : roadmap.progress.percentComplete,
        lastActivityAt: new Date(),
      };
      generatedRoadmaps.set(id, roadmap);
      return { roadmap };
    },
  },

  interviews: {
    list: () => ({ interviews: getInterviews() }),
    get: (id: string) => ({ interview: findInterview(id) }),
    create: (data: { targetRole?: string; targetJobId?: string }) => ({
      interview: makeInterview(data.targetRole || 'Accessibility QA Analyst', data.targetJobId || 'job-accessibility-qa'),
    }),
    nextQuestion: (id: string) => {
      const interview = findInterview(id);
      return { question: interview.questions[interview.currentQuestionIndex] || interview.questions[0] };
    },
    respond: (id: string, data: { questionId: string; response: string }) => {
      const interview = findInterview(id);
      const response: InterviewResponse = {
        questionId: data.questionId,
        response: data.response,
        feedback: {
          score: 8,
          strengths: ['Specific answer', 'Good practical framing'],
          improvements: ['Add one measurable outcome'],
        },
        timestamp: new Date(),
      };
      const responses = [...interview.responses, response];
      const isComplete = responses.length >= interview.questions.length;
      const updated: InterviewSession = {
        ...interview,
        responses,
        currentQuestionIndex: Math.min(responses.length, Math.max(0, interview.questions.length - 1)),
        status: isComplete ? 'completed' : 'in-progress',
        feedback: isComplete ? fallbackFeedback(8.2) : interview.feedback,
        completedAt: isComplete ? new Date() : null,
      };
      generatedInterviews.set(id, updated);
      return { response, feedback: response.feedback, interview: updated };
    },
    pause: (id: string) => {
      const interview = { ...findInterview(id), status: 'paused' as const };
      generatedInterviews.set(id, interview);
      return { interview };
    },
    resume: (id: string) => {
      const interview = { ...findInterview(id), status: 'in-progress' as const };
      generatedInterviews.set(id, interview);
      return { interview };
    },
    complete: (id: string) => {
      const interview = { ...findInterview(id), status: 'completed' as const, feedback: fallbackFeedback(8.1), completedAt: new Date() };
      generatedInterviews.set(id, interview);
      return { interview };
    },
    feedback: () => ({ feedback: fallbackFeedback(8.1) }),
  },

  assessments: {
    create: () => ({ assessment: makeAssessment() }),
    get: (id: string) => ({ assessment: findAssessment(id) }),
    history: () => ({ assessments: getAssessments() }),
    sendMessage: (id: string, message: string) => {
      const assessment = findAssessment(id);
      const orchestration = makeOrchestration(message);
      const userMessage: Conversation = {
        id: timestampId('message'),
        role: 'user',
        content: message,
        timestamp: new Date(),
      };
      const assistantMessage: Conversation = {
        id: timestampId('message'),
        role: 'assistant',
        content: orchestration.finalRecommendation,
        timestamp: new Date(),
        extractedData: { orchestration },
      };
      const updated = {
        ...assessment,
        conversations: [...assessment.conversations, userMessage, assistantMessage],
      };
      generatedAssessments.set(id, updated);
      return { assessment: updated, response: assistantMessage.content, orchestration };
    },
    complete: (id: string) => {
      const assessment = findAssessment(id);
      const completed: Assessment = {
        ...assessment,
        status: 'completed',
        results: clone(getMockDashboardSummary().assessments[0].results),
        completedAt: new Date(),
      };
      generatedAssessments.set(id, completed);
      return { assessment: completed };
    },
  },

  confidence: {
    list: () => ({ entries: generatedConfidenceEntries }),
    create: (entry: ConfidenceEntry) => {
      generatedConfidenceEntries = [entry, ...generatedConfidenceEntries];
      return { entry };
    },
    delete: (id: string) => {
      generatedConfidenceEntries = generatedConfidenceEntries.filter((entry) => entry.id !== id);
      return { deleted: true };
    },
  },

  ai: {
    chat: (payload: AiChatPayload) => ({ response: makeChatResponse(payload) }),
  },
};
