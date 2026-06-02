import { get, isRequestCanceled, type ApiRequestConfig } from './api';
import type { Assessment, InterviewSession, Job, Roadmap } from '../lib/shared';

export type DashboardSummary = {
  savedJobs: Job[];
  roadmaps: Roadmap[];
  interviews: InterviewSession[];
  assessments: Assessment[];
  errors?: string[];
  generatedAt: string;
  source?: 'api' | 'mock';
};

const now = () => new Date();

const daysFromNow = (days: number) => {
  const date = now();
  date.setDate(date.getDate() + days);
  return date;
};

const makeJob = (
  id: string,
  title: string,
  company: string,
  matchScore: number,
  accessibilityRating: number,
  remote: Job['basic']['remote'],
  skills: string[],
  missingSkill: string
): Job => ({
  id,
  source: 'Avora mock board',
  url: `https://example.com/jobs/${id}`,
  basic: {
    title,
    company,
    location: remote === 'remote' ? 'Remote, Vietnam' : 'Ho Chi Minh City, Vietnam',
    remote,
    salary: {
      min: 1200,
      max: 2200,
      currency: 'USD',
    },
  },
  details: {
    description: `${title} role focused on accessible digital products and async collaboration.`,
    responsibilities: [
      'Ship usable product improvements with clear acceptance criteria.',
      'Work with design and engineering on inclusive workflows.',
      'Document decisions so teammates can follow asynchronously.',
    ],
    requirements: {
      education: ['Portfolio or equivalent practical experience'],
      experience: '1-3 years',
      skills,
    },
    benefits: ['Remote work', 'Flexible schedule', 'Assistive technology budget'],
  },
  accessibility: {
    rating: accessibilityRating,
    features: ['Remote-friendly', 'Written-first communication', 'Flexible meeting windows'],
    accommodations: ['Captioned calls', 'Async updates', 'Keyboard-accessible tooling'],
    barriers: accessibilityRating < 85 ? ['Occasional live stakeholder sessions'] : [],
    communityRating: Math.round(accessibilityRating / 10),
  },
  analysis: {
    summary: {
      plainLanguage: 'A practical role with strong remote and documentation support.',
      readingLevel: 7,
      confidence: 0.88,
    },
    keyResponsibilities: [
      {
        original: 'Collaborate cross-functionally to deliver product increments.',
        simplified: 'Work with teammates to deliver small product improvements.',
        difficulty: 'medium',
        accommodationPossible: true,
      },
    ],
    skills: skills.map((skill, index) => ({
      name: skill,
      importance: index < 2 ? 'required' : 'preferred',
      transferable: true,
    })),
    accessibility: {
      remotePotential: remote === 'remote' ? 96 : 72,
      physicalDemands: 'minimal',
      accommodationScore: accessibilityRating,
      barriers: accessibilityRating < 85 ? ['Some meetings may be synchronous'] : [],
      suggestions: ['Ask about meeting cadence', 'Confirm tooling accessibility during screening'],
    },
    compensation: {
      range: { min: 1200, max: 2200 },
      currency: 'USD',
      benchmark: 1700,
    },
    fit: {
      matchScore,
      verdict: matchScore >= 86 ? 'Strong fit' : 'Promising fit',
      matchedSkills: skills.slice(0, 3),
      missingSkills: [
        {
          name: missingSkill,
          importance: 'important',
          reason: 'Commonly requested in similar roles.',
          learningPriority: 2,
        },
      ],
      missingRequirements: [
        {
          requirement: 'Recent portfolio example',
          impact: 'medium',
          workaround: 'Turn one roadmap project into a case study.',
        },
      ],
      portfolioProjects: [
        {
          title: 'Accessible workflow case study',
          goal: 'Show measurable accessibility and usability improvements.',
          skills: skills.slice(0, 2),
        },
      ],
      roadmapFocus: [missingSkill, 'Portfolio storytelling'],
      interviewFocus: ['Explain accommodations confidently', 'Use one STAR example'],
      nextActions: ['Save role notes', 'Create a focused roadmap', 'Practice screening answer'],
    },
  },
  postedAt: daysFromNow(-5),
  scrapedAt: daysFromNow(-1),
});

const makeRoadmap = (
  id: string,
  title: string,
  percentComplete: number,
  currentPhase: number,
  gapSkill: string
): Roadmap => ({
  id,
  userId: 'mock-user',
  targetJobId: id.replace('roadmap', 'job'),
  title,
  description: `Focused 4-week plan for ${title.toLowerCase()}.`,
  currentSkills: ['React', 'TypeScript', 'User research', 'Documentation'],
  gapSkills: [
    {
      name: gapSkill,
      importance: 'important',
      currentLevel: 2,
      targetLevel: 4,
      resources: [
        {
          id: `${id}-resource`,
          title: `${gapSkill} practice guide`,
          type: 'exercise',
          url: 'https://example.com/learning',
          accessibilityFeatures: ['Captions', 'Plain-language notes', 'Keyboard navigation'],
          accommodations: ['Self-paced', 'Downloadable transcript'],
          estimatedDuration: 90,
        },
      ],
    },
  ],
  phases: [
    {
      id: `${id}-phase-1`,
      name: 'Skill refresh',
      description: 'Review the core concept and complete a small practice task.',
      order: 1,
      estimatedDuration: 5,
      milestones: [],
    },
    {
      id: `${id}-phase-2`,
      name: 'Portfolio proof',
      description: 'Convert the skill into a short case study artifact.',
      order: 2,
      estimatedDuration: 7,
      milestones: [],
    },
  ],
  settings: {
    weeklyHours: 6,
    preferredPace: 'moderate',
    accommodations: ['Short sessions', 'Written instructions', 'Flexible deadlines'],
  },
  progress: {
    completedItems: Math.round(percentComplete / 12.5),
    totalItems: 8,
    percentComplete,
    currentPhase,
    lastActivityAt: daysFromNow(-2),
  },
  createdAt: daysFromNow(-18),
  updatedAt: daysFromNow(-2),
});

const makeInterview = (
  id: string,
  status: InterviewSession['status'],
  score: number | null,
  createdOffset: number
): InterviewSession => ({
  id,
  userId: 'mock-user',
  targetJobId: 'job-product-analyst',
  config: {
    types: ['behavioral', 'disability'],
    difficulty: 'medium',
    questionCount: 5,
    timePerQuestion: 180,
    allowPause: true,
    includeFollowUp: true,
  },
  status,
  questions: [
    {
      id: `${id}-question-1`,
      text: 'Tell me about a time you improved an experience for users with different needs.',
      type: 'behavioral',
      difficulty: 'medium',
      followUpQuestions: ['What changed after your work?'],
      expectedPoints: ['Situation', 'Action', 'Result', 'Reflection'],
      scoringCriteria: ['Specificity', 'Impact', 'Communication'],
      accessibilityNotes: 'Pause support enabled.',
    },
  ],
  currentQuestionIndex: status === 'completed' ? 5 : 2,
  responses: [],
  feedback:
    score === null
      ? null
      : {
          overallScore: score,
          categories: [
            { name: 'Structure', score: score - 0.3, feedback: 'Clear setup; tighten result metrics.' },
            { name: 'Confidence', score, feedback: 'Good tone and practical examples.' },
          ],
          strengths: ['Clear examples', 'Good accommodation framing'],
          improvements: ['Add one measurable result', 'Keep answers under two minutes'],
          disabilityDisclosureAdvice: {
            shouldDisclose: 'optional',
            timing: 'After role fit is clear',
            script: 'I work best with written context and captioned meetings, which helps me deliver reliably.',
          },
          nextSteps: ['Practice one STAR answer', 'Prepare two questions for the recruiter'],
        },
  settings: {
    accommodations: ['Pause button', 'Captioned prompts', 'Extra preparation time'],
    startTime: daysFromNow(createdOffset),
    duration: 25,
    pauses: [],
  },
  createdAt: daysFromNow(createdOffset),
  completedAt: status === 'completed' ? daysFromNow(createdOffset) : null,
});

const makeAssessment = (id: string, status: Assessment['status'], scoreOffset: number): Assessment => ({
  id,
  userId: 'mock-user',
  type: id.endsWith('initial') ? 'initial' : 'targeted',
  status,
  conversations: [],
  results: {
    interests: [
      { name: 'Accessible product design', score: 91, examples: ['Design systems', 'Usability testing'] },
      { name: 'Data-informed support', score: 84, examples: ['Dashboards', 'Decision support'] },
    ],
    skills: [
      { skill: 'React', confidence: 0.82, evidence: ['Portfolio project', 'Assessment conversation'] },
      { skill: 'Accessibility QA', confidence: 0.78, evidence: ['Keyboard testing practice'] },
    ],
    values: ['Autonomy', 'Inclusive teams', 'Clear communication'],
    workStyle: {
      type: 'mixed',
      pace: 'steady',
      environment: ['Remote', 'Quiet focus time', 'Async collaboration'],
      communication: 'async',
    },
    recommendedCareers: [
      {
        title: 'Accessibility QA Analyst',
        matchScore: 89 - scoreOffset,
        reasoning: 'Strong fit for detail, empathy, and documented workflows.',
        accessibilityScore: 92,
        growthPotential: 82,
        marketDemand: 78,
      },
      {
        title: 'Product Operations Associate',
        matchScore: 84 - scoreOffset,
        reasoning: 'Good fit for structured coordination and user-centered thinking.',
        accessibilityScore: 88,
        growthPotential: 80,
        marketDemand: 76,
      },
    ],
  },
  createdAt: daysFromNow(-21 + scoreOffset),
  completedAt: status === 'completed' ? daysFromNow(-20 + scoreOffset) : null,
});

export const getMockDashboardSummary = (): DashboardSummary => ({
  savedJobs: [
    makeJob(
      'job-accessibility-qa',
      'Accessibility QA Analyst',
      'Inclusive Labs',
      91,
      94,
      'remote',
      ['Accessibility testing', 'Issue documentation', 'React basics', 'Screen reader QA'],
      'WCAG audit reporting'
    ),
    makeJob(
      'job-product-ops',
      'Product Operations Associate',
      'BrightPath Health',
      86,
      89,
      'hybrid',
      ['Product documentation', 'User research', 'Stakeholder updates', 'Data hygiene'],
      'SQL dashboards'
    ),
    makeJob(
      'job-frontend-support',
      'Frontend Support Specialist',
      'CareCloud Studio',
      82,
      87,
      'remote',
      ['HTML', 'CSS', 'React', 'Customer empathy'],
      'Debugging workflow'
    ),
  ],
  roadmaps: [
    makeRoadmap('roadmap-accessibility-qa', 'Accessibility QA Analyst path', 68, 2, 'WCAG audit reporting'),
    makeRoadmap('roadmap-product-ops', 'Product operations portfolio', 42, 1, 'SQL dashboards'),
  ],
  interviews: [
    makeInterview('interview-star', 'completed', 8.1, -9),
    makeInterview('interview-disclosure', 'in-progress', null, -1),
  ],
  assessments: [
    makeAssessment('assessment-initial', 'completed', 0),
    makeAssessment('assessment-targeted', 'completed', 4),
  ],
  errors: ['Showing polished sample data for the upgraded dashboard UI.'],
  generatedAt: now().toISOString(),
  source: 'mock',
});

const shouldUseApi = () => {
  const mode = import.meta.env.VITE_DASHBOARD_DATA_MODE;
  return mode === 'api' || mode === 'hybrid';
};

export const dashboardService = {
  async getSummary(config?: ApiRequestConfig): Promise<DashboardSummary> {
    if (!shouldUseApi()) {
      return getMockDashboardSummary();
    }

    try {
      const summary = await get<DashboardSummary>('/api/dashboard/summary', {
        cacheTtlMs: 30_000,
        ...config,
      });

      return {
        ...summary,
        source: 'api',
      };
    } catch (error) {
      if (isRequestCanceled(error)) throw error;

      return getMockDashboardSummary();
    }
  },
};
