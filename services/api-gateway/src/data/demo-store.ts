import type {
  Assessment,
  InterviewSession,
  Job,
  Roadmap,
  UserProfile,
} from '../types/shared.js';

export const createId = (prefix: string) =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export const demoJobs: Job[] = [
  {
    id: 'job_frontend_remote',
    source: 'avora-demo',
    url: 'https://example.com/jobs/frontend',
    basic: {
      title: 'Junior Frontend Developer',
      company: 'Inclusive Web Studio',
      location: 'Remote',
      remote: 'remote',
      salary: { min: 55000, max: 75000, currency: 'USD' },
    },
    details: {
      description:
        'Build accessible React interfaces, fix UI issues, and collaborate with designers and backend engineers.',
      responsibilities: [
        'Build and test accessible web pages',
        'Fix interface bugs reported by users',
        'Work with designers and backend engineers',
      ],
      requirements: {
        education: ['Portfolio, bootcamp, or equivalent experience accepted'],
        experience: '0-2 years',
        skills: ['React', 'HTML', 'CSS', 'Git', 'Accessibility basics'],
      },
      benefits: ['Remote work', 'Flexible hours', 'Mentorship', 'Health insurance'],
    },
    accessibility: {
      rating: 92,
      features: ['Remote-first', 'Flexible schedule', 'Screen reader testing'],
      accommodations: ['Assistive technology budget', 'Async communication', 'Extra time for tasks'],
      barriers: ['Occasional live team meetings'],
      communityRating: 4.6,
    },
    analysis: null,
    postedAt: new Date(),
    scrapedAt: new Date(),
  },
  {
    id: 'job_backend_remote',
    source: 'avora-demo',
    url: 'https://example.com/jobs/backend',
    basic: {
      title: 'Junior Backend Developer',
      company: 'Avora API Studio',
      location: 'Remote',
      remote: 'remote',
      salary: { min: 60000, max: 82000, currency: 'USD' },
    },
    details: {
      description:
        'Build Node.js APIs, integrate databases, document endpoints, and collaborate with frontend engineers on accessible product workflows.',
      responsibilities: [
        'Build and maintain REST API endpoints',
        'Write clear validation and error handling for backend services',
        'Work with frontend engineers to connect user-facing flows',
      ],
      requirements: {
        education: ['Portfolio, bootcamp, or equivalent backend project experience accepted'],
        experience: '0-2 years',
        skills: ['Node.js', 'Express', 'REST API', 'SQL', 'Git'],
      },
      benefits: ['Remote work', 'Async documentation', 'Mentorship', 'Assistive technology budget'],
    },
    accessibility: {
      rating: 89,
      features: ['Remote-first', 'Async code review', 'Written technical specs'],
      accommodations: ['Flexible focus blocks', 'Meeting notes', 'Extra time for technical tasks'],
      barriers: ['Occasional incident response rotation'],
      communityRating: 4.4,
    },
    analysis: null,
    postedAt: new Date(),
    scrapedAt: new Date(),
  },
  {
    id: 'job_data_assistant',
    source: 'avora-demo',
    url: 'https://example.com/jobs/data-analyst',
    basic: {
      title: 'Data Analyst Assistant',
      company: 'Care Insights Lab',
      location: 'Hybrid',
      remote: 'hybrid',
      salary: { min: 35, max: 45, currency: 'USD' },
    },
    details: {
      description:
        'Clean spreadsheets, prepare simple dashboards, and summarize trends for nonprofit programs.',
      responsibilities: [
        'Clean spreadsheet data',
        'Prepare simple dashboard updates',
        'Summarize trends in clear language',
      ],
      requirements: {
        education: ['High school diploma or equivalent'],
        experience: 'Entry level',
        skills: ['Excel or Google Sheets', 'Basic SQL', 'Attention to detail'],
      },
      benefits: ['Part-time schedule', 'Quiet workspace', 'Training budget'],
    },
    accessibility: {
      rating: 86,
      features: ['Hybrid option', 'Written instructions', 'Quiet workspace'],
      accommodations: ['Extra time for detail-heavy tasks', 'Flexible break schedule'],
      barriers: ['Some office days may be expected'],
      communityRating: 4.3,
    },
    analysis: null,
    postedAt: new Date(),
    scrapedAt: new Date(),
  },
  {
    id: 'job_support_remote',
    source: 'avora-demo',
    url: 'https://example.com/jobs/support',
    basic: {
      title: 'Customer Support Specialist',
      company: 'AccessHelp',
      location: 'Remote',
      remote: 'remote',
      salary: { min: 42000, max: 58000, currency: 'USD' },
    },
    details: {
      description:
        'Help customers by email and chat, document issues, and work with product teams to improve accessibility.',
      responsibilities: [
        'Respond to customers through email and chat',
        'Document common problems',
        'Share user accessibility feedback with product teams',
      ],
      requirements: {
        education: ['No degree required'],
        experience: 'Customer support or community experience preferred',
        skills: ['Clear writing', 'Problem solving', 'Customer empathy'],
      },
      benefits: ['Remote work', 'No phone requirement', 'Wellness days'],
    },
    accessibility: {
      rating: 90,
      features: ['Text-based support', 'Remote work', 'Assistive tech friendly'],
      accommodations: ['Flexible break schedule', 'Written workflows', 'Reduced meeting load'],
      barriers: ['Peak support queues can be fast paced'],
      communityRating: 4.5,
    },
    analysis: null,
    postedAt: new Date(),
    scrapedAt: new Date(),
  },
];

export type DemoUser = { id: string; email: string; passwordHash: string; name: string };
export type DemoAgentMemory = {
  userId: string;
  agentId: string;
  summary: string;
  facts: string[];
  updatedAt: string;
};

export const demoUsers = new Map<string, DemoUser>();
export const demoPasswordResetTokens = new Map<string, { userId: string; expiresAt: Date }>();
export const demoProfiles = new Map<string, UserProfile>();
export const demoSavedJobs = new Map<string, Set<string>>();
export const demoAssessments = new Map<string, Assessment>();
export const demoRoadmaps = new Map<string, Roadmap>();
export const demoInterviews = new Map<string, InterviewSession>();
export const demoAgentMemories = new Map<string, DemoAgentMemory>();
