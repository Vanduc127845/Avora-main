import type {
  CareerMatch,
  InterviewFeedback,
  InterviewQuestion,
  JDAnalysis,
  Job,
  JobFitAnalysis,
  OrchestrationPlan,
  Roadmap,
  UserProfile,
} from '../types/shared.js';
import { AGENT_PROMPTS, AGENT_TOOLS, SYSTEM_PROMPT } from '../config/agent-prompts.js';
import { createId } from '../data/demo-store.js';
import { logger } from '../utils/logger.js';
import { AgentMemoryService } from './agent-memory.service.js';

type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

type ChatContext = {
  history?: ChatMessage[];
  agentId?: string;
  routePath?: string;
  moduleTitle?: string;
  moduleScope?: string;
  moduleContext?: Record<string, unknown>;
};

type CandidateJob = Pick<Job, 'id' | 'source' | 'url' | 'basic' | 'details' | 'accessibility'>;

type SkillGap = {
  skill: string;
  priority: 'High' | 'Medium' | 'Low';
  reason: string;
  resource: string;
  output: string;
};

type AIProvider = 'azure-openai' | 'openai' | 'groq' | 'ollama' | 'demo-fallback';

type AIStatus = {
  provider: AIProvider;
  configured: boolean;
  fallbackEnabled: boolean;
  model: string | null;
  missingEnv: string[];
};

export class AIRateLimitError extends Error {
  statusCode = 429;
  code = 'AI_RATE_LIMITED';
  source = 'ai-provider';
  isOperational = true;

  constructor(
    public provider: Exclude<AIProvider, 'demo-fallback'>,
    public retryAfterMs: number,
    message = 'The AI service is temporarily busy. Please try again shortly.'
  ) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
  }
}

const inferAgentId = (context?: ChatContext) => {
  if (context?.agentId && AGENT_PROMPTS[context.agentId]) return context.agentId;
  const routePath = context?.routePath || '';
  if (routePath.startsWith('/dashboard')) return 'dashboard';
  if (routePath.startsWith('/profile')) return 'profile';
  if (routePath.startsWith('/assessment')) return 'assessment';
  if (routePath.startsWith('/jobs')) return 'jobs';
  if (routePath.startsWith('/roadmaps')) return 'roadmaps';
  if (routePath.startsWith('/interviews')) return 'interviews';
  if (routePath.startsWith('/confidence')) return 'confidence';
  if (routePath.startsWith('/simulation')) return 'simulation';
  if (routePath.startsWith('/settings')) return 'settings';
  if (routePath.startsWith('/docs')) return 'help';
  return 'general';
};

const buildAgentSystemPrompt = (context?: ChatContext) => {
  const agentId = inferAgentId(context);
  const moduleLine = context?.moduleTitle
    ? `Module Avora hiện tại: ${context.moduleTitle}. Phạm vi: ${context.moduleScope || 'chưa xác định'}.`
    : `Đường dẫn module Avora hiện tại: ${context?.routePath || 'không rõ'}.`;
  const extraContext = context?.moduleContext
    ? `Ngữ cảnh module dạng JSON: ${JSON.stringify(context.moduleContext)}`
    : '';

  return [
    SYSTEM_PROMPT,
    AGENT_PROMPTS[agentId] || AGENT_PROMPTS.general,
    `Công cụ chuyên môn có thể dùng: ${(AGENT_TOOLS[agentId] || AGENT_TOOLS.general).join(', ')}.`,
    moduleLine,
    extraContext,
    'Bạn là một chuyên gia trong sản phẩm multi-agent. Hãy ở đúng phạm vi; nếu cần agent khác, hãy nêu tên agent đó và nói rõ dữ liệu sẽ bàn giao.',
    'Luôn trả lời bằng tiếng Việt theo mặc định, trừ khi người dùng yêu cầu rõ một ngôn ngữ khác.',
  ]
    .filter(Boolean)
    .join('\n');
};

const asArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];

const isVietnameseMessage = (value: string) =>
  /\b(toi|ban|minh|em|anh|chi|chon|viec|nghe|hoc|phong van|khuyet tat|ho tro|dang|can|thieu|bo sung|lap trinh|lo trinh|ke hoach|cong viec)\b/i.test(
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toLowerCase()
  ) ||
  /[ăâđêôơưáàảãạấầẩẫậắằẳẵặéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]/i.test(value) ||
  /\b(toi|ban|minh|viec|nghe|hoc|phong van|khuyet tat|ho tro|dang|can)\b/i.test(value);

const normalizeVietnamese = (value: string | null | undefined) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();

const parseJsonObject = <T>(content: string): T | null => {
  try {
    return JSON.parse(content) as T;
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]) as T;
    } catch {
      return null;
    }
  }
};

const hasRealEnvValue = (value: string, placeholders: string[] = []) =>
  Boolean(value && !placeholders.includes(value) && !value.includes('your-'));

const clampNumber = (value: unknown, min: number, max: number, fallback: number) => {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return fallback;
  return Math.min(max, Math.max(min, Math.round(numberValue)));
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const parseRetryAfterMs = (headers: Headers): number | null => {
  const retryAfter = headers.get('retry-after');
  if (!retryAfter) return null;

  const seconds = Number(retryAfter);
  if (Number.isFinite(seconds)) return Math.max(0, Math.round(seconds * 1000));

  const retryAt = Date.parse(retryAfter);
  if (Number.isFinite(retryAt)) return Math.max(0, retryAt - Date.now());

  return null;
};

const getProviderRetryConfig = () => ({
  maxRetries: clampNumber(process.env.AI_PROVIDER_MAX_RETRIES, 0, 3, 1),
  baseDelayMs: clampNumber(process.env.AI_PROVIDER_RETRY_BASE_MS, 200, 2000, 700),
  maxDelayMs: clampNumber(process.env.AI_PROVIDER_RETRY_MAX_MS, 500, 5000, 2500),
});

const uniqueStrings = (values: string[]) =>
  [...new Set(values.map((value) => value.trim()).filter(Boolean))];

const cleanShortText = (value: unknown, fallback: string, maxLength = 520) => {
  const text = typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';
  if (!text) return fallback;
  return text.length > maxLength ? `${text.slice(0, maxLength - 3).trim()}...` : text;
};

const buildInterviewerPrompt = (questionText: string, type?: string) => {
  const questionType = type ? `${type} question` : 'question';
  return `Let's talk through a ${questionType}. ${questionText}`;
};

const skillKey = (value: string) =>
  normalizeVietnamese(value)
    .replace(/[^a-z0-9+#. ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const roleKey = (value: string) =>
  skillKey(value)
    .replace(/\bfront\s+end\b/g, 'frontend')
    .replace(/\bback\s+end\b/g, 'backend');

const keyTokens = (value: string) =>
  roleKey(value)
    .split(' ')
    .filter(Boolean);

const collectSkillNames = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (typeof item === 'string') return item;
      if (item && typeof item === 'object' && 'name' in item && typeof item.name === 'string') return item.name;
      if (item && typeof item === 'object' && 'title' in item && typeof item.title === 'string') return item.title;
      return '';
    })
    .filter(Boolean);
};

const extractUserSkillNames = (userProfile: any): string[] => {
  const careerProfile = userProfile?.careerProfile || userProfile?.career_profile || {};
  return uniqueStrings([
    ...collectSkillNames(userProfile?.skills),
    ...collectSkillNames(userProfile?.currentSkills),
    ...collectSkillNames(userProfile?.current_skills),
    ...collectSkillNames(careerProfile.skills),
    ...collectSkillNames(careerProfile.interests),
    ...collectSkillNames(careerProfile.targetRoles),
    ...collectSkillNames(userProfile?.preferences?.focusSkills),
    ...collectSkillNames(userProfile?.settings?.focusSkills),
  ]);
};

const extractLineValues = (content: string, label: string): string[] => {
  const match = content.match(new RegExp(`${label}:\\s*([^\\n]+)`, 'i'));
  if (!match?.[1]) return [];
  return match[1]
    .split(/[,;|]/)
    .map((item) => item.trim())
    .filter(Boolean);
};

const hasSkillMatch = (skill: string, userSkills: string[]) => {
  const jobKey = skillKey(skill);
  if (!jobKey) return false;
  return userSkills.some((userSkill) => {
    const userKey = skillKey(userSkill);
    return userKey === jobKey || userKey.includes(jobKey) || jobKey.includes(userKey);
  });
};

const AGENT_DISPLAY_NAMES: Record<string, string> = {
  profile: 'Profile Agent',
  jobs: 'Jobs Agent',
  roadmaps: 'Roadmap Agent',
  interviews: 'Interview Agent',
  confidence: 'Confidence Agent',
  simulation: 'Simulation Agent',
  assessment: 'Assessment Agent',
};

const ADDRESSED_AGENT_ALIASES: Record<string, string> = {
  dashboard: 'dashboard',
  'dashboard agent': 'dashboard',
  profile: 'profile',
  'profile agent': 'profile',
  assessment: 'assessment',
  'assessment agent': 'assessment',
  jobs: 'jobs',
  'job agent': 'jobs',
  'jobs agent': 'jobs',
  roadmap: 'roadmaps',
  roadmaps: 'roadmaps',
  'roadmap agent': 'roadmaps',
  interview: 'interviews',
  interviews: 'interviews',
  'interview agent': 'interviews',
  confidence: 'confidence',
  'confidence agent': 'confidence',
  simulation: 'simulation',
  'simulation agent': 'simulation',
  settings: 'settings',
  'settings agent': 'settings',
  help: 'help',
  'help agent': 'help',
};

const parseAddressedAgent = (message: string): { agentId: string; content: string } | null => {
  const match = message.match(/^\s*([A-Za-z ]{3,28}|[\p{L}\s]{3,28})\s*:\s*(.+)$/u);
  if (!match) return null;
  const alias = normalizeVietnamese(match[1]).replace(/\s+/g, ' ').trim();
  const agentId = ADDRESSED_AGENT_ALIASES[alias];
  return agentId ? { agentId, content: match[2].trim() } : null;
};

const asRecordValue = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};

const readStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.map((item) => String(item || '').trim()).filter(Boolean) : [];

const readCandidateJobs = (context?: ChatContext): CandidateJob[] => {
  const jobs = context?.moduleContext?.candidateJobs;
  return Array.isArray(jobs) ? jobs.filter((job): job is CandidateJob => Boolean(job && typeof job === 'object')) : [];
};

const readUserProfile = (context?: ChatContext): UserProfile | Record<string, unknown> | null => {
  const profile = context?.moduleContext?.userProfile;
  return profile && typeof profile === 'object' ? profile as UserProfile : null;
};

const contextProfileSkills = (context?: ChatContext): string[] =>
  uniqueStrings([
    ...readStringArray(context?.moduleContext?.profileSkills),
    ...extractUserSkillNames(readUserProfile(context)),
  ]);

const combineConversationText = (message: string, context?: ChatContext) =>
  [
    ...(context?.history || []).slice(-8).map((item) => item.content),
    message,
  ].join('\n\n');

const looksLikeJobDescription = (value: string) => {
  const normalized = normalizeVietnamese(value);
  const hasMarker =
    /\b(jd|job description|requirements|responsibilities|skills|benefits)\b/i.test(value) ||
    /\b(mo ta cong viec|yeu cau cong viec|yeu cau ung vien|trach nhiem|ky nang bat buoc|ky nang yeu cau|phuc loi|quyen loi)\b/i.test(normalized);
  return value.trim().length >= 120 && hasMarker;
};

const extractPastedJD = (message: string, context?: ChatContext): string | null => {
  const chunks = [
    message,
    ...(context?.history || [])
      .slice(-8)
      .reverse()
      .filter((item) => item.role === 'user')
      .map((item) => item.content),
  ];
  return chunks.find((chunk) => looksLikeJobDescription(chunk))?.trim() || null;
};

const detectRole = (text: string): string | undefined => {
  const normalized = normalizeVietnamese(text);
  const raw = text.toLowerCase();
  if (/\b(back\s*[- ]?\s*end|backend|node(?:\.js)?|express|api developer)\b/i.test(raw)) {
    return 'Backend Developer';
  }
  if (/\b(frontend|front-end|fe|react|ui developer|web developer)\b/i.test(raw) || normalized.includes('lap trinh web')) {
    return 'Frontend Developer';
  }
  if (/customer support|support specialist|helpdesk/i.test(raw) || normalized.includes('ho tro khach hang')) {
    return 'Customer Support Specialist';
  }
  if (/data analyst|excel|sql|power bi|analytics/i.test(raw) || normalized.includes('phan tich du lieu')) {
    return 'Data Analyst Assistant';
  }
  if (/qa|tester|testing|accessibility tester/i.test(raw) || normalized.includes('kiem thu')) {
    return 'Accessibility QA Tester';
  }
  if (/backend|node|express|api developer/i.test(raw)) {
    return 'Backend Developer';
  }
  const roleMatch = text.match(/(?:vị trí|vi tri|role|job)\s+([A-Za-zÀ-ỹ0-9 .+#-]{4,60})/i);
  return roleMatch?.[1]?.trim();
};

const scoreCandidateJob = (job: CandidateJob, text: string, role?: string) => {
  const haystackTokens = new Set(keyTokens(
    [
      job.basic?.title,
      job.basic?.company,
      job.details?.description,
      ...(job.details?.requirements?.skills || []),
    ].filter(Boolean).join(' ')
  ));
  const needles = keyTokens([text, role || ''].join(' '))
    .filter((part) => part.length > 2);

  return needles.reduce((score, part) => score + (haystackTokens.has(part) ? 1 : 0), 0);
};

const GENERIC_ROLE_TOKENS = new Set([
  'assistant',
  'developer',
  'engineer',
  'intern',
  'job',
  'junior',
  'lead',
  'middle',
  'role',
  'senior',
  'specialist',
  'staff',
]);

const roleSpecificTokens = (role: string) =>
  keyTokens(role)
    .filter((token) => token.length > 1 && !GENERIC_ROLE_TOKENS.has(token));

const roleMatchesJobTitle = (job: CandidateJob, role: string) => {
  const tokens = roleSpecificTokens(role);
  if (!tokens.length) return true;

  const titleTokens = new Set(keyTokens(job.basic.title));
  return tokens.some((token) => titleTokens.has(token));
};

const selectCandidateJob = (jobs: CandidateJob[], text: string, role?: string): CandidateJob | null => {
  if (!jobs.length) return null;
  const pool = role ? jobs.filter((job) => roleMatchesJobTitle(job, role)) : jobs;
  if (role && roleSpecificTokens(role).length && pool.length === 0) return null;

  const scored = (pool.length ? pool : jobs)
    .map((job) => ({ job, score: scoreCandidateJob(job, text, role) }))
    .sort((left, right) => right.score - left.score);
  if (scored[0]?.score > 0) return scored[0].job;
  return null;
};

const KNOWN_SKILLS = [
  'React',
  'TypeScript',
  'JavaScript',
  'HTML',
  'CSS',
  'Git',
  'REST API',
  'API integration',
  'Form validation',
  'Accessibility basics',
  'WCAG',
  'ARIA',
  'Responsive design',
  'Node.js',
  'Express',
  'SQL',
  'Excel or Google Sheets',
  'Clear writing',
  'Problem solving',
  'Customer empathy',
];

const ROLE_BASELINES: Record<string, { title: string; source: string; skills: string[]; description: string }> = {
  'backend developer': {
    title: 'Backend Developer',
    source: 'Mẫu yêu cầu phổ biến cho Backend Developer',
    skills: ['Node.js', 'Express', 'REST API', 'SQL', 'Authentication', 'Error handling', 'API testing', 'Git'],
    description: [
      'Job description: Build and maintain server-side APIs, data flows, authentication, and integration logic.',
      'Responsibilities: Design REST endpoints, validate requests, handle errors, work with SQL data, and document APIs.',
      'Requirements: Node.js, Express, REST API, SQL, Authentication, Error handling, API testing, Git.',
    ].join('\n'),
  },
  'frontend developer': {
    title: 'Frontend Developer',
    source: 'Mẫu yêu cầu phổ biến cho Frontend Developer',
    skills: ['React', 'TypeScript', 'HTML', 'CSS', 'API integration', 'Form validation', 'Accessibility basics', 'Git'],
    description: [
      'Job description: Build accessible web interfaces and connect them to API data.',
      'Responsibilities: Create React components, manage form states, call APIs, and test keyboard-friendly UI.',
      'Requirements: React, TypeScript, HTML, CSS, API integration, Form validation, Accessibility basics, Git.',
    ].join('\n'),
  },
  'data analyst assistant': {
    title: 'Data Analyst Assistant',
    source: 'Mẫu yêu cầu phổ biến cho Data Analyst Assistant',
    skills: ['Excel or Google Sheets', 'SQL', 'Data cleaning', 'Dashboard basics', 'Clear writing', 'Problem solving'],
    description: [
      'Job description: Clean data, build simple reports, and summarize insights for business or nonprofit teams.',
      'Responsibilities: Prepare spreadsheets, write basic SQL, check data quality, and explain trends clearly.',
      'Requirements: Excel or Google Sheets, SQL, Data cleaning, Dashboard basics, Clear writing, Problem solving.',
    ].join('\n'),
  },
};

const roleBaselineFor = (role?: string) => {
  const key = roleKey(role || '');
  if (key.includes('backend')) return ROLE_BASELINES['backend developer'];
  if (key.includes('frontend') || key.includes('react')) return ROLE_BASELINES['frontend developer'];
  if (key.includes('data analyst')) return ROLE_BASELINES['data analyst assistant'];
  return null;
};

const extractSkillsFromJDText = (jdText: string): string[] => {
  const explicitLines = jdText
    .split(/\r?\n/)
    .filter((line) => /(skill|kỹ năng|ky nang|requirement|yêu cầu|yeu cau)/i.test(line))
    .flatMap((line) => line.split(/[:;,|•-]/).map((item) => item.trim()))
    .filter((item) => item.length > 2 && item.length < 50);

  const detected = KNOWN_SKILLS.filter((skill) => {
    const key = skillKey(skill);
    return skillKey(jdText).includes(key);
  });

  return uniqueStrings([...detected, ...explicitLines])
    .filter((skill) => !/^(skills?|requirements?|ky nang|yeu cau|kỹ năng|yêu cầu)$/i.test(skill))
    .slice(0, 10);
};

const formatJobDescription = (job: CandidateJob) =>
  [
    `Vị trí: ${job.basic.title}`,
    `Công ty: ${job.basic.company}`,
    `Nguồn: ${job.source || 'Avora Jobs'}${job.url ? ` - ${job.url}` : ''}`,
    `Mô tả: ${job.details.description}`,
    `Trách nhiệm: ${job.details.responsibilities.join('; ')}`,
    `Yêu cầu kỹ năng: ${job.details.requirements.skills.join(', ')}`,
    `Kinh nghiệm: ${job.details.requirements.experience || 'Không nêu rõ'}`,
    `Trợ năng: ${job.accessibility.features.join(', ') || 'Không nêu rõ'}`,
  ].join('\n');

const resourceForSkill = (skill: string) => {
  const key = skillKey(skill);
  if (key.includes('react')) return 'React Docs - Learn React: https://react.dev/learn';
  if (key.includes('typescript')) return 'TypeScript Handbook: https://www.typescriptlang.org/docs/handbook/intro.html';
  if (key.includes('javascript')) return 'MDN JavaScript Guide: https://developer.mozilla.org/docs/Web/JavaScript/Guide';
  if (key.includes('html')) return 'MDN HTML Learn: https://developer.mozilla.org/docs/Learn/HTML';
  if (key.includes('css') || key.includes('responsive')) return 'web.dev Learn CSS: https://web.dev/learn/css';
  if (key.includes('git')) return 'Pro Git Book: https://git-scm.com/book/en/v2';
  if (key.includes('accessibility') || key.includes('wcag') || key.includes('aria')) {
    return 'web.dev Learn Accessibility: https://web.dev/learn/accessibility';
  }
  if (key.includes('api') || key.includes('rest')) return 'MDN Fetch API: https://developer.mozilla.org/docs/Web/API/Fetch_API';
  if (key.includes('node')) return 'Node.js Learn: https://nodejs.org/en/learn';
  if (key.includes('express')) return 'Express Guide: https://expressjs.com/en/guide/routing.html';
  if (key.includes('authentication')) return 'OWASP Authentication Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html';
  if (key.includes('error')) return 'Express error handling guide: https://expressjs.com/en/guide/error-handling.html';
  if (key.includes('testing')) return 'Postman API testing basics or Supertest practice project';
  if (key.includes('form')) return 'React form validation practice project';
  if (key.includes('sql')) return 'SQLBolt: https://sqlbolt.com';
  if (key.includes('excel') || key.includes('sheets')) return 'Google Sheets training: https://support.google.com/a/users/answer/9282959';
  return `Dự án thực hành nhỏ chứng minh kỹ năng ${skill}`;
};

const outputForSkill = (skill: string, role: string) => {
  const key = skillKey(skill);
  if (key.includes('react')) return `Một component ${role} dùng props, state và xử lý lỗi rõ ràng.`;
  if (key.includes('typescript')) return 'Chuyển một màn hình JavaScript sang TypeScript có type cho props và API response.';
  if (key.includes('api') || key.includes('rest')) return 'Một trang gọi API thật, xử lý loading/error/empty state.';
  if (key.includes('node') || key.includes('express')) return `Một REST API nhỏ cho ${role} có routing, validation và error response rõ ràng.`;
  if (key.includes('authentication')) return 'Một luồng đăng nhập demo có hash mật khẩu, token và middleware bảo vệ route.';
  if (key.includes('testing')) return 'Bộ test API cho happy path, lỗi validation và lỗi không có quyền.';
  if (key.includes('accessibility') || key.includes('wcag') || key.includes('aria')) {
    return 'Checklist kiểm thử keyboard, label, focus state và contrast cho một màn hình.';
  }
  if (key.includes('git')) return 'Một pull request mẫu có branch, commit rõ ràng và mô tả thay đổi.';
  return `Một bài tập hoặc mini project chứng minh ${skill} trong bối cảnh ${role}.`;
};

const buildSkillGaps = (requiredSkills: string[], userSkills: string[], role: string): SkillGap[] =>
  requiredSkills
    .filter((skill) => !hasSkillMatch(skill, userSkills))
    .map((skill, index) => ({
      skill,
      priority: index < 3 ? 'High' : index < 6 ? 'Medium' : 'Low',
      reason: `JD yêu cầu ${skill}, nhưng hồ sơ hiện tại chưa có bằng chứng rõ ràng cho kỹ năng này.`,
      resource: resourceForSkill(skill),
      output: outputForSkill(skill, role),
    }));

const buildWeeklyRoadmap = (gaps: SkillGap[], role: string): NonNullable<OrchestrationPlan['summaryCard']>['weeklyRoadmap'] =>
  gaps.slice(0, 4).map((gap, index) => ({
    week: `Tuần ${index + 1}`,
    skill: gap.skill,
    resource: gap.resource,
    output: gap.output || `Sản phẩm nhỏ chứng minh ${gap.skill} cho vị trí ${role}.`,
  }));

const buildInterviewQuestions = (role: string, gaps: SkillGap[], requiredSkills: string[]) => {
  const focus = gaps.length ? gaps : requiredSkills.slice(0, 3).map((skill) => ({
    skill,
    priority: 'Medium' as const,
    reason: '',
    resource: '',
    output: '',
  }));
  return focus.slice(0, 3).map((gap, index) => {
    if (index === 0) return `Trong JD ${role}, ${gap.skill} là yêu cầu quan trọng. Bạn hãy mô tả một project hoặc bài tập đã dùng ${gap.skill}.`;
    if (index === 1) return `Nếu gặp bug liên quan đến ${gap.skill}, bạn sẽ debug theo các bước nào và báo cáo kết quả ra sao?`;
    return `Bạn sẽ học và chứng minh ${gap.skill} trong 2-4 tuần như thế nào trước khi ứng tuyển vị trí này?`;
  });
};

const traceFor = (
  agentId: string,
  status: OrchestrationPlan['agentTraces'][number]['status'],
  summary: string,
  evidence: string[],
  handoff: string,
  actions: string[],
  confidence: number,
  rawOutput?: string,
  runtimeStatus: NonNullable<OrchestrationPlan['agentTraces'][number]['runtimeStatus']> = status === 'error' ? 'error' : 'done'
): OrchestrationPlan['agentTraces'][number] => ({
  agentId,
  agentName: AGENT_DISPLAY_NAMES[agentId] || agentId,
  status,
  runtimeStatus,
  summary,
  evidence,
  handoff,
  rawOutput,
  confidence,
  actions,
});

export class AIService {
  private endpoint = (process.env.AZURE_OPENAI_ENDPOINT || '').replace(/\/$/, '');
  private apiKey = process.env.AZURE_OPENAI_API_KEY || '';
  private deployment = process.env.AZURE_OPENAI_DEPLOYMENT || '';
  private apiVersion = process.env.AZURE_OPENAI_API_VERSION || '2024-02-15-preview';
  private openAIBaseUrl = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '');
  private openAIApiKey = process.env.OPENAI_API_KEY || '';
  private openAIModel = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  private groqBaseUrl = (process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1').replace(/\/$/, '');
  private groqApiKey = process.env.GROQ_API_KEY || '';
  private groqModel = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
  private preferredProvider = (process.env.AI_PROVIDER || '').toLowerCase();
  private ollamaBaseUrl = (process.env.OLLAMA_BASE_URL || '').replace(/\/$/, '');
  private ollamaModel = process.env.OLLAMA_MODEL || 'llama3.1:8b';
  private fallbackEnabled = process.env.AI_ENABLE_DEMO_FALLBACK !== 'false';
  private memoryService = new AgentMemoryService();

  private canUseFallback(): boolean {
    return this.fallbackEnabled || process.env.NODE_ENV !== 'production';
  }

  private refreshConfig() {
    this.endpoint = (process.env.AZURE_OPENAI_ENDPOINT || '').replace(/\/$/, '');
    this.apiKey = process.env.AZURE_OPENAI_API_KEY || '';
    this.deployment = process.env.AZURE_OPENAI_DEPLOYMENT || '';
    this.apiVersion = process.env.AZURE_OPENAI_API_VERSION || '2024-02-15-preview';
    this.openAIBaseUrl = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '');
    this.openAIApiKey = process.env.OPENAI_API_KEY || '';
    this.openAIModel = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    this.groqBaseUrl = (process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1').replace(/\/$/, '');
    this.groqApiKey = process.env.GROQ_API_KEY || '';
    this.groqModel = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
    this.preferredProvider = (process.env.AI_PROVIDER || '').toLowerCase();
    this.ollamaBaseUrl = (process.env.OLLAMA_BASE_URL || '').replace(/\/$/, '');
    this.ollamaModel = process.env.OLLAMA_MODEL || 'llama3.1:8b';
    this.fallbackEnabled = process.env.AI_ENABLE_DEMO_FALLBACK !== 'false';
  }

  isConfigured(): boolean {
    return this.getStatus().configured;
  }

  getStatus(): AIStatus {
    this.refreshConfig();

    const hasAzureEndpoint = hasRealEnvValue(this.endpoint, ['https://your-resource.openai.azure.com']);
    const hasAzureKey = hasRealEnvValue(this.apiKey, ['your-api-key-here']);
    const hasAzureDeployment = hasRealEnvValue(this.deployment);
    const hasOpenAIKey = hasRealEnvValue(this.openAIApiKey, ['sk-your-openai-key']);
    const hasOpenAIModel = hasRealEnvValue(this.openAIModel);
    const hasGroqKey = hasRealEnvValue(this.groqApiKey, ['gsk-your-groq-key']);
    const hasGroqModel = hasRealEnvValue(this.groqModel);
    const hasOllamaBaseUrl = hasRealEnvValue(this.ollamaBaseUrl);
    const hasOllamaModel = hasRealEnvValue(this.ollamaModel);
    const wantsAzure = this.preferredProvider === 'azure-openai' || !this.preferredProvider;
    const wantsOpenAI = this.preferredProvider === 'openai' || !this.preferredProvider;
    const wantsGroq = this.preferredProvider === 'groq' || (!this.preferredProvider && hasGroqKey);
    const wantsOllama = this.preferredProvider === 'ollama' || (!this.preferredProvider && hasOllamaBaseUrl);

    if (wantsAzure && hasAzureEndpoint && hasAzureKey && hasAzureDeployment) {
      return {
        provider: 'azure-openai',
        configured: true,
        fallbackEnabled: this.canUseFallback(),
        model: this.deployment,
        missingEnv: [],
      };
    }

    if (wantsOpenAI && hasOpenAIKey && hasOpenAIModel) {
      return {
        provider: 'openai',
        configured: true,
        fallbackEnabled: this.canUseFallback(),
        model: this.openAIModel,
        missingEnv: [],
      };
    }

    if (wantsGroq && hasGroqKey && hasGroqModel) {
      return {
        provider: 'groq',
        configured: true,
        fallbackEnabled: this.canUseFallback(),
        model: this.groqModel,
        missingEnv: [],
      };
    }

    if (wantsOllama && hasOllamaBaseUrl && hasOllamaModel) {
      return {
        provider: 'ollama',
        configured: true,
        fallbackEnabled: this.canUseFallback(),
        model: this.ollamaModel,
        missingEnv: [],
      };
    }

    if (this.preferredProvider === 'groq') {
      return {
        provider: 'demo-fallback',
        configured: false,
        fallbackEnabled: this.canUseFallback(),
        model: null,
        missingEnv: [
          ...(!hasGroqKey ? ['GROQ_API_KEY'] : []),
          ...(!hasGroqModel ? ['GROQ_MODEL'] : []),
        ],
      };
    }

    if (this.preferredProvider === 'ollama') {
      return {
        provider: 'demo-fallback',
        configured: false,
        fallbackEnabled: this.canUseFallback(),
        model: null,
        missingEnv: [
          ...(!hasOllamaBaseUrl ? ['OLLAMA_BASE_URL'] : []),
          ...(!hasOllamaModel ? ['OLLAMA_MODEL'] : []),
        ],
      };
    }

    if (this.preferredProvider === 'openai') {
      return {
        provider: 'demo-fallback',
        configured: false,
        fallbackEnabled: this.canUseFallback(),
        model: null,
        missingEnv: [
          ...(!hasOpenAIKey ? ['OPENAI_API_KEY'] : []),
          ...(!hasOpenAIModel ? ['OPENAI_MODEL'] : []),
        ],
      };
    }

    const missingEnv = this.endpoint || this.apiKey || this.deployment
      ? [
          ...(!hasAzureEndpoint ? ['AZURE_OPENAI_ENDPOINT'] : []),
          ...(!hasAzureKey ? ['AZURE_OPENAI_API_KEY'] : []),
          ...(!hasAzureDeployment ? ['AZURE_OPENAI_DEPLOYMENT'] : []),
        ]
      : ['AZURE_OPENAI_ENDPOINT', 'AZURE_OPENAI_API_KEY', 'AZURE_OPENAI_DEPLOYMENT', 'OPENAI_API_KEY'];

    return {
      provider: 'demo-fallback',
      configured: false,
      fallbackEnabled: this.canUseFallback(),
      model: null,
      missingEnv,
    };
  }

  private async callModel(messages: ChatMessage[], jsonMode = false): Promise<string | null> {
    const status = this.getStatus();
    if (status.provider === 'azure-openai') {
      return this.callAzure(messages, jsonMode);
    }
    if (status.provider === 'openai') {
      return this.callOpenAI(messages, jsonMode);
    }
    if (status.provider === 'groq') {
      return this.callGroq(messages, jsonMode);
    }
    if (status.provider === 'ollama') {
      return this.callOllama(messages, jsonMode);
    }
    return null;
  }

  private useFallback<T>(fallback: () => T): T {
    this.refreshConfig();
    if (this.canUseFallback()) return fallback();
    throw new Error('AI provider is not configured and demo fallback is disabled.');
  }

  private async fetchProvider(
    provider: Exclude<AIProvider, 'demo-fallback'>,
    url: string,
    init: RequestInit
  ): Promise<Response> {
    const { maxRetries, baseDelayMs, maxDelayMs } = getProviderRetryConfig();

    for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
      const response = await fetch(url, init);
      if (response.status !== 429) return response;

      const retryAfterMs = parseRetryAfterMs(response.headers);
      const computedDelayMs = Math.min(maxDelayMs, baseDelayMs * 2 ** attempt);
      const delayMs = Math.min(maxDelayMs, retryAfterMs ?? computedDelayMs);

      if (attempt >= maxRetries) {
        throw new AIRateLimitError(provider, retryAfterMs ?? computedDelayMs);
      }

      logger.warn('AI provider rate limited; backing off before retry', {
        provider,
        attempt: attempt + 1,
        retryAfterMs: retryAfterMs ?? null,
        delayMs,
      });
      await sleep(delayMs);
    }

    throw new AIRateLimitError(provider, maxDelayMs);
  }

  async chat(userId: string, message: string, context?: ChatContext): Promise<string> {
    const addressed = parseAddressedAgent(message);
    const effectiveMessage = addressed?.content || message;
    const routedContext = addressed
      ? {
          ...context,
          agentId: addressed.agentId,
          moduleTitle: AGENT_DISPLAY_NAMES[addressed.agentId] || context?.moduleTitle,
        }
      : context;
    const agentId = inferAgentId(routedContext);

    const memoryContext = await this.memoryService.getContext(userId, agentId);
    const systemPrompt = [
      buildAgentSystemPrompt(routedContext),
      memoryContext ? `Bộ nhớ phiên của agent:\n${memoryContext}` : '',
    ].filter(Boolean).join('\n\n');

    if (this.isConfigured()) {
      const response = await this.callModel([
        { role: 'system', content: systemPrompt },
        ...(routedContext?.history || []).slice(-8),
        { role: 'user', content: effectiveMessage },
      ]);

      if (response) {
        await this.rememberInteraction(userId, agentId, effectiveMessage, response, routedContext);
        return response;
      }
    }

    const fallback = this.useFallback(() => this.fallbackChat(effectiveMessage, agentId));
    await this.rememberInteraction(userId, agentId, effectiveMessage, fallback, routedContext);
    return fallback;
  }

  async orchestrateAssessment(
    userId: string,
    message: string,
    context?: ChatContext
  ): Promise<{ response: string; orchestration: OrchestrationPlan }> {
    const agentId = 'assessment';
    const assessmentContext: ChatContext = { ...context, agentId };
    const deterministic = this.buildDeterministicAssessment(message, assessmentContext);
    await this.rememberInteraction(userId, agentId, message, deterministic.response, {
      ...assessmentContext,
      moduleContext: {
        ...(assessmentContext.moduleContext || {}),
        orchestration: deterministic.orchestration,
      },
    });
    return deterministic;
  }

  private buildDeterministicAssessment(
    message: string,
    context?: ChatContext
  ): { response: string; orchestration: OrchestrationPlan } {
    const conversationText = combineConversationText(message, context);
    const messageRole = detectRole(message);
    const role = messageRole || detectRole(conversationText);
    const pastedJD = extractPastedJD(message, messageRole ? undefined : context);
    const candidateJob = selectCandidateJob(
      readCandidateJobs(context),
      messageRole ? message : conversationText,
      role
    );
    const roleBaseline = !candidateJob && !pastedJD ? roleBaselineFor(role) : null;
    const jobTitle = candidateJob?.basic.title || roleBaseline?.title || role || 'vị trí mục tiêu';
    const jdText = candidateJob ? formatJobDescription(candidateJob) : pastedJD || roleBaseline?.description || null;
    const jdSource = candidateJob
      ? `${candidateJob.basic.company} - ${candidateJob.basic.title}${candidateJob.url ? ` (${candidateJob.url})` : ''}`
      : pastedJD
        ? 'JD người dùng cung cấp trong cuộc trò chuyện'
        : roleBaseline
          ? roleBaseline.source
        : '';
    const userSkills = contextProfileSkills(context);
    const requiredSkills = uniqueStrings(
      candidateJob?.details.requirements.skills ||
      roleBaseline?.skills ||
      (jdText ? extractSkillsFromJDText(jdText) : [])
    );

    if (!jdText || requiredSkills.length === 0) {
      const profileSummary = userSkills.length
        ? `Hồ sơ hiện có kỹ năng: ${userSkills.slice(0, 8).join(', ')}.`
        : 'Hồ sơ hiện chưa có kỹ năng nào được xác nhận.';
      const selectedJob = role || candidateJob?.basic.title;
      const orchestration: OrchestrationPlan = {
        intent: 'Thu thập JD thật trước khi phân tích nghề nghiệp',
        selectedJob,
        jdSource: '',
        missingInputs: ['Cần JD thật hoặc chọn một job cụ thể trước khi tính khoảng trống kỹ năng.'],
        agentTraces: [
          traceFor(
            'profile',
            'complete',
            profileSummary,
            userSkills.length ? userSkills.slice(0, 6) : ['Chưa có kỹ năng lưu trong hồ sơ'],
            'Chuyển hồ sơ hiện tại sang Jobs Agent sau khi có JD.',
            ['Cập nhật kỹ năng hiện có trong Profile nếu còn thiếu.'],
            userSkills.length ? 0.78 : 0.48,
            profileSummary
          ),
          traceFor(
            'jobs',
            'needs-input',
            selectedJob
              ? `Đã nhận mục tiêu ${selectedJob}, nhưng chưa có JD thật để phân tích yêu cầu.`
              : 'Chưa có vị trí hoặc JD cụ thể để phân tích.',
            selectedJob ? [`Mục tiêu: ${selectedJob}`] : ['Thiếu JD'],
            'Cần người dùng paste JD hoặc chọn job trong Jobs để trích xuất yêu cầu thật.',
            ['Paste JD vào Assessment hoặc mở Jobs để chọn một tin tuyển dụng.'],
            0.62,
            'Jobs Agent dừng tại bước yêu cầu JD; chưa tạo skill gap.',
            'idle'
          ),
          traceFor(
            'roadmaps',
            'queued',
            'Chờ Jobs Agent trả về danh sách kỹ năng còn thiếu trước khi tạo lộ trình.',
            ['Không có skill gap thật'],
            'Không tạo lộ trình khi chưa có JD và skill gap.',
            ['Sau khi có gap, tạo lộ trình theo tuần cho từng kỹ năng thiếu.'],
            0.5,
            'Roadmap Agent chưa chạy vì thiếu đầu vào gap kỹ năng.',
            'idle'
          ),
          traceFor(
            'interviews',
            'queued',
            'Chờ JD thật để tạo câu hỏi phỏng vấn bám sát yêu cầu công việc.',
            ['Không có JD'],
            'Không tạo câu hỏi phỏng vấn chung chung.',
            ['Sau khi có JD, tạo 3-5 câu hỏi theo yêu cầu thực tế.'],
            0.5,
            'Interview Agent chưa chạy vì thiếu JD.',
            'idle'
          ),
        ],
        nextActions: [
          {
            label: 'Dán JD',
            targetAgent: 'jobs',
            route: '/assessment',
            prompt: 'Tôi sẽ paste JD cụ thể vào đây để bạn phân tích khoảng trống kỹ năng.',
          },
          {
            label: 'Tìm job phù hợp',
            targetAgent: 'jobs',
            route: '/jobs',
            prompt: `Jobs Agent: tìm một JD thật phù hợp với ${selectedJob || 'mục tiêu nghề nghiệp của tôi'} rồi phân tích kỹ năng còn thiếu.`,
          },
        ],
        finalRecommendation:
          'Bạn muốn ứng tuyển vị trí cụ thể nào? Hãy paste JD vào đây, hoặc tôi sẽ tìm JD phù hợp cho bạn. Mình sẽ không tạo lộ trình cho đến khi có JD thật và dữ liệu hồ sơ để so sánh.',
        generatedAt: new Date().toISOString(),
      };

      return {
        response: orchestration.finalRecommendation,
        orchestration,
      };
    }

    const gaps = buildSkillGaps(requiredSkills, userSkills, jobTitle);
    const matchedSkills = requiredSkills.filter((skill) => hasSkillMatch(skill, userSkills));
    const roadmap = buildWeeklyRoadmap(gaps, jobTitle);
    const interviewQuestions = buildInterviewQuestions(jobTitle, gaps, requiredSkills);
    const topGaps = gaps.slice(0, 3);
    const profileRaw = userSkills.length
      ? `Kỹ năng trong hồ sơ: ${userSkills.join(', ')}.`
      : 'Hồ sơ thật đã đọc nhưng chưa có kỹ năng nào được lưu; mọi kỹ năng trong JD được xem là chưa có bằng chứng.';
    const jobsRaw = [
      `JD source: ${jdSource}`,
      `Required skills: ${requiredSkills.join(', ')}`,
      `Matched skills: ${matchedSkills.length ? matchedSkills.join(', ') : 'Chưa có kỹ năng khớp rõ ràng'}`,
      `Missing skills: ${gaps.length ? gaps.map((gap) => `${gap.skill} (${gap.priority})`).join(', ') : 'Chưa phát hiện khoảng trống kỹ năng'}`,
    ].join('\n');
    const roadmapRaw = roadmap
      .map((item) => `${item.week}: ${item.skill} -> ${item.resource} -> ${item.output}`)
      .join('\n');
    const interviewRaw = interviewQuestions.map((question, index) => `${index + 1}. ${question}`).join('\n');
    const nextAction = topGaps.length
      ? `Bắt đầu với ${topGaps[0].skill}: học tài nguyên được gợi ý và tạo output trong Tuần 1.`
      : 'Cập nhật thêm kỹ năng và bằng chứng trong Profile, sau đó dùng Jobs Agent để phân tích lại JD.';

    const orchestration: OrchestrationPlan = {
      intent: `Phân tích JD và khoảng trống kỹ năng cho ${jobTitle}`,
      selectedJob: jobTitle,
      jdSource,
      missingInputs: [],
      agentTraces: [
        traceFor(
          'profile',
          'complete',
          userSkills.length
            ? `Đã đọc ${userSkills.length} kỹ năng từ hồ sơ để so sánh với JD.`
            : 'Đã đọc hồ sơ thật; hiện chưa có kỹ năng nào được lưu rõ ràng.',
          userSkills.length ? userSkills.slice(0, 6) : ['Hồ sơ chưa có kỹ năng đã lưu'],
          'Chuyển kỹ năng hiện có sang Jobs Agent để tính gap.',
          ['Bổ sung bằng chứng project cho các kỹ năng đã có.'],
          userSkills.length ? 0.84 : 0.58,
          profileRaw
        ),
        traceFor(
          'jobs',
          'complete',
          gaps.length
            ? `Đã trích xuất ${requiredSkills.length} kỹ năng từ JD và tìm ${gaps.length} kỹ năng còn thiếu.`
            : 'Đã trích xuất JD; hồ sơ hiện khớp với các kỹ năng chính được liệt kê.',
          [`JD: ${jdSource}`, ...topGaps.map((gap) => `${gap.skill}: ${gap.priority}`)].slice(0, 6),
          'Chuyển danh sách gap ưu tiên sang Roadmap và Interview.',
          ['Xác nhận top gap trước khi ứng tuyển.', 'Chuẩn bị bằng chứng cho kỹ năng đã khớp.'],
          0.9,
          jobsRaw
        ),
        traceFor(
          'roadmaps',
          'complete',
          roadmap.length
            ? `Đã tạo lộ trình theo tuần cho ${roadmap.length} kỹ năng thiếu ưu tiên.`
            : 'Không tạo lộ trình mới vì chưa có gap rõ ràng từ JD.',
          roadmap.map((item) => `${item.week}: ${item.skill}`),
          'Chuyển lộ trình học theo gap sang Assessment để tổng hợp.',
          roadmap.map((item) => `${item.week}: hoàn thành output cho ${item.skill}`),
          0.86,
          roadmapRaw || 'Không có roadmap vì chưa phát hiện gap.'
        ),
        traceFor(
          'interviews',
          'complete',
          `Đã tạo ${interviewQuestions.length} câu hỏi phỏng vấn bám theo JD ${jobTitle}.`,
          interviewQuestions.slice(0, 3),
          'Chuyển câu hỏi phỏng vấn theo JD sang Assessment.',
          ['Luyện trả lời từng câu bằng ví dụ project thật.'],
          0.84,
          interviewRaw
        ),
      ],
      nextActions: [
        {
          label: 'Tạo roadmap chi tiết',
          targetAgent: 'roadmaps',
          route: '/roadmaps',
          prompt: `Roadmap Agent: tạo roadmap theo tuần chỉ dựa trên các gap ${gaps.map((gap) => gap.skill).join(', ')} cho JD ${jobTitle}.`,
        },
        {
          label: 'Phỏng vấn thử',
          targetAgent: 'interviews',
          route: '/interviews',
          prompt: `Interview Agent: tạo phiên phỏng vấn thử cho ${jobTitle} dựa trên JD và các gap ${gaps.slice(0, 3).map((gap) => gap.skill).join(', ')}.`,
        },
      ],
      finalRecommendation: topGaps.length
        ? `Bạn đang thiếu ${topGaps.map((gap) => gap.skill).join(', ')} cho vị trí ${jobTitle}. Hãy học theo lộ trình tuần bên dưới và tạo output cụ thể trước khi ứng tuyển.`
        : `JD ${jobTitle} hiện khớp khá tốt với hồ sơ đã lưu. Bước tiếp theo là chuẩn bị bằng chứng project và luyện phỏng vấn theo yêu cầu trong JD.`,
      summaryCard: {
        goal: role || message,
        jobTitle,
        jdSource,
        topGaps: topGaps.map((gap) => ({
          skill: gap.skill,
          priority: gap.priority,
          reason: gap.reason,
        })),
        weeklyRoadmap: roadmap,
        interviewQuestions,
        nextAction,
      },
      generatedAt: new Date().toISOString(),
    };

    return {
      response: this.buildAssessmentResponse(orchestration, message),
      orchestration,
    };
  }
  private buildAssessmentResponse(orchestration: OrchestrationPlan, message: string): string {
    const card = orchestration.summaryCard;
    if (card) {
      const gaps = card.topGaps.length
        ? card.topGaps.map((gap) => `- ${gap.skill} (${gap.priority}): ${gap.reason}`).join('\n')
        : '- Chưa phát hiện kỹ năng thiếu rõ ràng từ JD.';
      const roadmap = card.weeklyRoadmap.length
        ? card.weeklyRoadmap.map((item) => `- ${item.week}: ${item.skill} -> ${item.resource}. Output: ${item.output}`).join('\n')
        : '- Chưa tạo roadmap vì không có gap ưu tiên.';
      const questions = card.interviewQuestions.map((question, index) => `${index + 1}. ${question}`).join('\n');

      return [
        `Dựa trên JD ${card.jobTitle} từ ${card.jdSource}:`,
        '',
        'Kỹ năng còn thiếu ưu tiên:',
        gaps,
        '',
        'Lộ trình học theo tuần:',
        roadmap,
        '',
        'Câu hỏi phỏng vấn phù hợp JD:',
        questions,
        '',
        `Hành động tiếp theo: ${card.nextAction}`,
      ].join('\n');
    }

    const topTraces = orchestration.agentTraces.slice(0, 4);
    return [
      `Assessment đã điều phối ${orchestration.agentTraces.length} agent${orchestration.selectedJob ? ` cho ${orchestration.selectedJob}` : ''}.`,
      ...topTraces.map((trace) => `- ${trace.agentName}: ${trace.summary}`),
      `Kết luận: ${orchestration.finalRecommendation}`,
    ].join('\n');
  }

  private async rememberInteraction(
    userId: string,
    agentId: string,
    userMessage: string,
    assistantMessage: string,
    context?: ChatContext
  ) {
    try {
      await this.memoryService.remember(userId, agentId, userMessage, assistantMessage, {
        routePath: context?.routePath,
        moduleTitle: context?.moduleTitle,
        moduleScope: context?.moduleScope,
        moduleContext: context?.moduleContext,
      });
    } catch (error) {
      logger.warn('Agent memory update skipped', { agentId, error });
    }
  }

  async analyzeJobDescription(jobDescription: string, userProfile?: any): Promise<JDAnalysis> {
    if (this.isConfigured()) {
      const response = await this.callModel(
        [
          { role: 'system', content: `${SYSTEM_PROMPT} Return valid JSON only.` },
          {
            role: 'user',
            content: `Analyze this exact job for an accessibility-aware career seeker.

Be specific to the selected job. Do not give generic career advice.
Compare the job requirements against the user's current profile. If the profile is incomplete, say which assumptions you are making and focus on concrete gaps from the job post.
The fit section must identify what the user already seems to have, what is missing, what to learn first, what portfolio proof to build, and what interview topics to practice. Use matchScore from 0 to 100.

User profile JSON:
${JSON.stringify(userProfile || {})}

Job description:
${jobDescription}

Return JSON with this exact shape:
{
  "summary": {"plainLanguage": string, "readingLevel": number, "confidence": number},
  "keyResponsibilities": [{"original": string, "simplified": string, "difficulty": "easy"|"medium"|"hard", "accommodationPossible": boolean}],
  "skills": [{"name": string, "importance": "required"|"preferred"|"nice-to-have", "transferable": boolean}],
  "accessibility": {"remotePotential": number, "physicalDemands": "minimal"|"moderate"|"significant", "accommodationScore": number, "barriers": string[], "suggestions": string[]},
  "compensation": {"range": {"min": number, "max": number}, "currency": string, "benchmark": number},
  "fit": {
    "matchScore": number,
    "verdict": string,
    "matchedSkills": string[],
    "missingSkills": [{"name": string, "importance": "critical"|"important"|"nice-to-have", "reason": string, "learningPriority": number}],
    "missingRequirements": [{"requirement": string, "impact": "high"|"medium"|"low", "workaround": string}],
    "portfolioProjects": [{"title": string, "goal": string, "skills": string[]}],
    "roadmapFocus": string[],
    "interviewFocus": string[],
    "nextActions": string[]
  }
}`,
          },
        ],
        true
      );

      const parsed = response ? parseJsonObject<JDAnalysis>(response) : null;
      if (parsed) return this.normalizeJDAnalysis(parsed, jobDescription, userProfile);
    }

    return this.useFallback(() => this.fallbackJDAnalysis(jobDescription, userProfile));
  }

  async generateRoadmap(userId: string, data: any): Promise<Roadmap> {
    const targetRole = data.targetRole || data.target_role || data.title || 'Accessible Career Path';
    const currentSkills = asArray(data.currentSkills);
    const settings = data.preferences || data.settings || {};
    const focusSkills = asArray(settings.focusSkills);

    if (this.isConfigured()) {
      const response = await this.callModel(
        [
          { role: 'system', content: `${SYSTEM_PROMPT} Return valid JSON only.` },
          {
            role: 'user',
            content: `Create a practical accessible learning roadmap.

Target role: ${targetRole}
Current skills: ${currentSkills.join(', ') || 'not specified'}
Missing/focus skills from selected job: ${focusSkills.join(', ') || 'not specified'}
Preferences JSON: ${JSON.stringify(settings)}

Return JSON for fields title, description, currentSkills, gapSkills, phases, settings. Use 3 phases. The phases must directly teach the selected-job gap skills first, then portfolio proof, then interview/application practice. Keep items short and accessible.`,
          },
        ],
        true
      );

      const parsed = response ? parseJsonObject<Partial<Roadmap>>(response) : null;
      if (parsed?.phases?.length) {
        return this.normalizeRoadmap(userId, data, parsed);
      }
    }

    return this.useFallback(() => this.fallbackRoadmap(userId, data));
  }

  async suggestCareers(data: any): Promise<CareerMatch[]> {
    if (this.isConfigured()) {
      const response = await this.callModel(
        [
          { role: 'system', content: `${SYSTEM_PROMPT} Return valid JSON only.` },
          {
            role: 'user',
            content: `Suggest 5 suitable careers for this accessibility-aware profile:
${JSON.stringify(data)}

Return {"careers":[{"title": string, "matchScore": number, "reasoning": string, "accessibilityScore": number, "growthPotential": number, "marketDemand": number}]}. Use matchScore between 0 and 1.`,
          },
        ],
        true
      );
      const parsed = response ? parseJsonObject<{ careers: CareerMatch[] }>(response) : null;
      if (parsed?.careers?.length) return parsed.careers.map(this.normalizeCareerMatch);
    }

    return this.useFallback(() => this.fallbackCareers(data));
  }

  async generateInterviewQuestions(
    jobType: string,
    difficulty: string,
    count: number,
    context?: { focusAreas?: string[]; selectedJobId?: string }
  ): Promise<InterviewQuestion[]> {
    const focusAreas = asArray(context?.focusAreas);

    if (this.isConfigured()) {
      const response = await this.callModel(
        [
          { role: 'system', content: `${SYSTEM_PROMPT} Return valid JSON only.` },
          {
            role: 'user',
            content: `Generate ${count} mock interview questions for the selected job: ${jobType}. Difficulty: ${difficulty}.
Focus areas from the job gap analysis: ${focusAreas.join(', ') || 'not specified'}.
Questions must target this selected job and the missing skills/gaps, not generic career advice.
Include technical, behavioral, situational, and disability accommodation/disclosure coaching where appropriate.
For each question, include interviewerPrompt: a natural interviewer line in 1-2 short sentences that asks the same question like a real person.
Return {"questions":[{"id": string, "text": string, "interviewerPrompt": string, "type": string, "difficulty": string, "followUpQuestions": string[], "expectedPoints": string[], "scoringCriteria": string[], "accessibilityNotes": string}]}.`,
          },
        ],
        true
      );
      const parsed = response ? parseJsonObject<{ questions: InterviewQuestion[] }>(response) : null;
      if (parsed?.questions?.length) return parsed.questions.slice(0, count).map(this.normalizeQuestion);
    }

    return this.useFallback(() => this.fallbackQuestions(jobType, difficulty, count, focusAreas));
  }

  async getInterviewFeedback(_userId: string, responses: any[], jobType = 'target role'): Promise<InterviewFeedback> {
    if (this.isConfigured()) {
      const response = await this.callModel(
        [
          { role: 'system', content: `${SYSTEM_PROMPT} Return valid JSON only.` },
          {
            role: 'user',
            content: `Review these mock interview responses for ${jobType}.
${JSON.stringify(responses)}

Return {"overallScore": number, "categories": [{"name": string, "score": number, "feedback": string}], "strengths": string[], "improvements": string[], "disabilityDisclosureAdvice": {"shouldDisclose": "yes"|"no"|"optional", "timing": string, "script": string} | null, "nextSteps": string[]}.`,
          },
        ],
        true
      );
      const parsed = response ? parseJsonObject<InterviewFeedback>(response) : null;
      if (parsed) return this.normalizeFeedback(parsed);
    }

    return this.useFallback(() => this.fallbackFeedback(responses));
  }

  async generateInterviewTurnReply(input: {
    jobType: string;
    question: InterviewQuestion;
    answer: string;
    feedback: InterviewFeedback;
    nextQuestion?: InterviewQuestion;
    questionIndex: number;
    totalQuestions: number;
    isComplete: boolean;
  }): Promise<string> {
    const fallback = this.fallbackInterviewTurnReply(input);

    if (this.isConfigured()) {
      const response = await this.callModel(
        [
          {
            role: 'system',
            content:
              'You are a realistic but supportive interviewer in a mock interview. Return valid JSON only.',
          },
          {
            role: 'user',
            content: `Write the next thing the interviewer says after the candidate answered.
Use the candidate's language if it is clear from the answer; otherwise use English.
Sound like a human interviewer, not a grading rubric. Use 2-4 short sentences.
Acknowledge one concrete part of the answer, give one gentle coaching cue only if useful, and transition naturally.
If there is a nextQuestion, do not repeat or ask that next question; the UI will show it separately.
Do not use bullet points, markdown, scores, or labels like "strength" and "improvement".
If the interview is complete, close the interview naturally and mention that feedback is ready.

Context JSON:
${JSON.stringify(input)}

Return {"reply": string}.`,
          },
        ],
        true
      );
      const parsed = response ? parseJsonObject<{ reply: string }>(response) : null;
      if (parsed?.reply) return cleanShortText(parsed.reply, fallback);
    }

    return this.useFallback(() => fallback);
  }

  private async callAzure(messages: ChatMessage[], jsonMode = false): Promise<string | null> {
    try {
      const response = await this.fetchProvider(
        'azure-openai',
        `${this.endpoint}/openai/deployments/${this.deployment}/chat/completions?api-version=${this.apiVersion}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'api-key': this.apiKey,
          },
          body: JSON.stringify({
            messages,
            temperature: jsonMode ? 0.25 : 0.6,
            max_tokens: jsonMode ? 2200 : 800,
            ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
          }),
        }
      );

      if (!response.ok) {
        logger.warn('Azure OpenAI request failed', {
          status: response.status,
          statusText: response.statusText,
        });
        return null;
      }

      const payload = (await response.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      return payload.choices?.[0]?.message?.content || null;
    } catch (error) {
      if (error instanceof AIRateLimitError && !this.canUseFallback()) throw error;
      logger.warn('Azure OpenAI fallback activated', { error });
      return null;
    }
  }

  private async callOpenAI(messages: ChatMessage[], jsonMode = false): Promise<string | null> {
    try {
      const response = await this.fetchProvider('openai', `${this.openAIBaseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.openAIModel,
          messages,
          temperature: jsonMode ? 0.25 : 0.6,
          max_tokens: jsonMode ? 2200 : 800,
          ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
        }),
      });

      if (!response.ok) {
        logger.warn('OpenAI request failed', {
          status: response.status,
          statusText: response.statusText,
        });
        return null;
      }

      const payload = (await response.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      return payload.choices?.[0]?.message?.content || null;
    } catch (error) {
      if (error instanceof AIRateLimitError && !this.canUseFallback()) throw error;
      logger.warn('OpenAI fallback activated', { error });
      return null;
    }
  }

  private async callGroq(messages: ChatMessage[], jsonMode = false): Promise<string | null> {
    try {
      const response = await this.fetchProvider('groq', `${this.groqBaseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.groqApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.groqModel,
          messages,
          temperature: jsonMode ? 0.25 : 0.6,
          max_tokens: jsonMode ? 2200 : 800,
          ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
        }),
      });

      if (!response.ok) {
        const body = await response.text().catch(() => '');
        logger.warn(
          `Groq request failed: ${response.status} ${response.statusText}${body ? ` - ${body.slice(0, 240)}` : ''}`
        );
        return null;
      }

      const payload = (await response.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      return payload.choices?.[0]?.message?.content || null;
    } catch (error) {
      if (error instanceof AIRateLimitError && !this.canUseFallback()) throw error;
      const message = error instanceof Error ? error.message : String(error);
      const cause = error instanceof Error && error.cause instanceof Error ? `; cause=${error.cause.message}` : '';
      logger.warn(`Groq fallback activated: ${message}${cause}`);
      return null;
    }
  }

  private async callOllama(messages: ChatMessage[], jsonMode = false): Promise<string | null> {
    try {
      const response = await this.fetchProvider('ollama', `${this.ollamaBaseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.ollamaModel,
          messages,
          stream: false,
          options: {
            temperature: jsonMode ? 0.25 : 0.6,
          },
          ...(jsonMode ? { format: 'json' } : {}),
        }),
      });

      if (!response.ok) {
        logger.warn('Ollama request failed', {
          status: response.status,
          statusText: response.statusText,
        });
        return null;
      }

      const payload = (await response.json()) as {
        message?: { content?: string };
        response?: string;
      };
      return payload.message?.content || payload.response || null;
    } catch (error) {
      if (error instanceof AIRateLimitError && !this.canUseFallback()) throw error;
      logger.warn('Ollama fallback activated', { error });
      return null;
    }
  }

  private fallbackChat(message: string, agentId = 'general'): string {
    const normalized = normalizeVietnamese(message);
    const prefix = agentId === 'assessment'
      ? 'Assessment Agent: '
      : `${AGENT_DISPLAY_NAMES[agentId] || 'Avora Agent'}: `;

    if (agentId === 'jobs') {
      return `${prefix}Hãy chọn một job cụ thể hoặc paste JD. Tôi sẽ trích xuất yêu cầu thật, so sánh với hồ sơ và liệt kê kỹ năng còn thiếu.`;
    }
    if (agentId === 'roadmaps') {
      return `${prefix}Tôi chỉ tạo lộ trình sau khi có danh sách gap kỹ năng từ Jobs Agent. Hãy gửi JD hoặc kết quả phân tích gap trước.`;
    }
    if (agentId === 'interviews') {
      return `${prefix}Hãy gửi vị trí hoặc JD cụ thể. Tôi sẽ tạo câu hỏi phỏng vấn bám sát yêu cầu thực tế của job đó.`;
    }
    if (agentId === 'profile') {
      return `${prefix}Hãy chia sẻ kỹ năng hiện có, kinh nghiệm, nhu cầu hỗ trợ và kiểu môi trường làm việc bạn muốn. Tôi sẽ giúp hồ sơ đủ cụ thể để so khớp JD.`;
    }
    if (agentId === 'assessment') {
      return `${prefix}Bạn muốn ứng tuyển vị trí cụ thể nào? Hãy paste JD vào đây, hoặc tôi sẽ tìm JD phù hợp cho bạn. Tôi sẽ không tạo lộ trình khi chưa có JD thật và dữ liệu hồ sơ để so sánh.`;
    }

    if (normalized.includes('phong van') || normalized.includes('interview')) {
      return 'Bạn nên chuẩn bị câu trả lời theo STAR: tình huống, nhiệm vụ, hành động và kết quả. Nếu có JD cụ thể, tôi sẽ tạo câu hỏi sát yêu cầu job hơn.';
    }
    if (normalized.includes('viec') || normalized.includes('job') || normalized.includes('nghe')) {
      return 'Hãy gửi một JD hoặc tên vị trí cụ thể. Tôi sẽ phân tích yêu cầu, so sánh với hồ sơ và chỉ ra gap kỹ năng thật.';
    }
    if (normalized.includes('hoc') || normalized.includes('lo trinh') || normalized.includes('roadmap')) {
      return 'Để tạo lộ trình đúng trọng tâm, tôi cần danh sách kỹ năng còn thiếu từ một JD cụ thể. Hãy paste JD hoặc yêu cầu Jobs Agent phân tích trước.';
    }
    return 'Mình hiểu. Hãy nói rõ mục tiêu, vị trí bạn muốn ứng tuyển hoặc JD cụ thể để mình chuyển đúng agent và đưa bước tiếp theo có cơ sở.';
  }

  private fallbackFitAnalysis(
    jobDescription: string,
    userProfile: any,
    skills: JDAnalysis['skills']
  ): JobFitAnalysis {
    const userSkills = extractUserSkillNames(userProfile);
    const jobSkills = uniqueStrings([
      ...skills.map((skill) => skill.name),
      ...extractLineValues(jobDescription, 'Skills'),
      ...extractLineValues(jobDescription, 'Required skills'),
    ]);
    const matchedSkills = jobSkills.filter((skill) => hasSkillMatch(skill, userSkills));
    const missingSkillNames = jobSkills.filter((skill) => !hasSkillMatch(skill, userSkills)).slice(0, 6);
    const requiredSkills = new Set(
      skills
        .filter((skill) => skill.importance === 'required')
        .map((skill) => skillKey(skill.name))
    );
    const matchScore = jobSkills.length
      ? Math.round((matchedSkills.length / jobSkills.length) * 70 + 20)
      : userSkills.length
        ? 55
        : 42;
    const role = extractLineValues(jobDescription, 'Title')[0] || extractLineValues(jobDescription, 'Role')[0] || 'this role';
    const experience = extractLineValues(jobDescription, 'Experience')[0];
    const education = extractLineValues(jobDescription, 'Education').join(', ');

    return {
      matchScore: clampNumber(matchScore, 20, 95, 50),
      verdict:
        missingSkillNames.length > 0
          ? `You have a partial fit for ${role}. Focus first on the highest-priority missing skills before applying or interviewing.`
          : `You appear to fit the listed skills for ${role}; prepare evidence and interview examples for the job requirements.`,
      matchedSkills,
      missingSkills: missingSkillNames.map((name, index) => ({
        name,
        importance: requiredSkills.has(skillKey(name)) ? 'critical' : index < 2 ? 'important' : 'nice-to-have',
        reason: `The selected job asks for ${name}, but it is not clearly present in the current profile.`,
        learningPriority: index + 1,
      })),
      missingRequirements: [
        ...(experience
          ? [
              {
                requirement: experience,
                impact: 'high' as const,
                workaround: 'Use portfolio projects, internship-style tasks, or freelance examples to prove the same ability.',
              },
            ]
          : []),
        ...(education
          ? [
              {
                requirement: education,
                impact: 'medium' as const,
                workaround: 'Highlight equivalent certificates, practical projects, and clear learning evidence.',
              },
            ]
          : []),
      ],
      portfolioProjects: [
        {
          title: `${role} mini project`,
          goal: 'Build one small project that proves the top missing requirements from this job post.',
          skills: missingSkillNames.slice(0, 3).length ? missingSkillNames.slice(0, 3) : jobSkills.slice(0, 3),
        },
        {
          title: 'Accessibility-ready case study',
          goal: 'Document the problem, solution, tradeoffs, testing steps, and accessibility considerations.',
          skills: ['Communication', 'Problem solving', ...missingSkillNames.slice(0, 1)],
        },
      ],
      roadmapFocus: missingSkillNames.slice(0, 5),
      interviewFocus: uniqueStrings([
        ...missingSkillNames.slice(0, 3).map((skill) => `${skill} fundamentals`),
        'Explain one relevant project clearly',
        'Request reasonable accessibility support if needed',
      ]),
      nextActions: [
        'Pick the top 2 missing skills and study them first.',
        'Build one portfolio project based on this job description.',
        'Practice interview answers for each required skill and responsibility.',
      ],
    };
  }

  private fallbackJDAnalysis(jobDescription: string, userProfile?: any): JDAnalysis {
    const lower = jobDescription.toLowerCase();
    const remotePotential = lower.includes('remote') || lower.includes('hybrid') ? 88 : 45;
    const physicalDemands =
      lower.includes('lift') || lower.includes('stand') || lower.includes('warehouse')
        ? 'significant'
        : 'minimal';
    const skills = ['Communication', 'Problem solving', 'Organization'];
    ['react', 'javascript', 'typescript', 'sql', 'excel', 'customer support'].forEach((skill) => {
      if (lower.includes(skill)) skills.unshift(skill.replace(/\b\w/g, (c) => c.toUpperCase()));
    });
    const skillItems = [...new Set(skills)].slice(0, 6).map((name, index) => ({
      name,
      importance: index < 2 ? ('required' as const) : ('preferred' as const),
      transferable: true,
    }));

    return {
      summary: {
        plainLanguage:
          'This role asks you to complete core job tasks, work with a team, communicate clearly, and use the listed tools or skills. Review the schedule, work location, and meeting expectations before applying.',
        readingLevel: 7,
        confidence: 0.72,
      },
      keyResponsibilities: [
        {
          original: 'Perform role responsibilities described in the job post',
          simplified: 'Do the main tasks listed by the employer',
          difficulty: 'medium',
          accommodationPossible: true,
        },
        {
          original: 'Collaborate with cross-functional partners',
          simplified: 'Work with people from other teams',
          difficulty: 'medium',
          accommodationPossible: true,
        },
      ],
      skills: skillItems,
      accessibility: {
        remotePotential,
        physicalDemands,
        accommodationScore: Math.round((remotePotential + (physicalDemands === 'minimal' ? 90 : 45)) / 2),
        barriers: lower.includes('fast-paced')
          ? ['Fast-paced wording may mean frequent context switching']
          : ['The post may not clearly describe accommodation processes'],
        suggestions: [
          'Ask about flexible scheduling, communication norms, and assistive technology support',
          'Request written instructions and success criteria for complex tasks',
        ],
      },
      compensation: {
        range: { min: 0, max: 0 },
        currency: 'USD',
        benchmark: 50,
      },
      fit: this.fallbackFitAnalysis(jobDescription, userProfile, skillItems),
    };
  }

  private fallbackRoadmap(userId: string, data: any): Roadmap {
    const targetRole = data.targetRole || data.target_role || data.title || 'Accessible Career Path';
    const targetJobId = data.targetJobId || data.target_job_id || 'general';
    const currentSkills = asArray(data.currentSkills);
    const focusSkills = asArray(data.settings?.focusSkills || data.preferences?.focusSkills);
    const primaryGap = focusSkills[0] || 'Role fundamentals';
    const secondaryGap = focusSkills[1] || 'Portfolio evidence';
    const now = new Date();

    return {
      id: createId('roadmap'),
      userId,
      targetJobId,
      title: `${targetRole} Roadmap`,
      description: `A practical learning path toward ${targetRole}, with flexible pacing and accessibility supports.`,
      currentSkills,
      gapSkills: [
        {
          name: primaryGap,
          importance: 'critical',
          currentLevel: currentSkills.length ? 2 : 1,
          targetLevel: 4,
          resources: [],
        },
        {
          name: secondaryGap,
          importance: 'important',
          currentLevel: 1,
          targetLevel: 3,
          resources: [],
        },
      ],
      phases: [
        this.createPhase(1, 'Foundation', 'Build the core concepts and setup you need.', [
          `Learn ${primaryGap} for this selected job`,
          'Collect accessible learning resources for the job gaps',
        ]),
        this.createPhase(2, 'Practice', 'Turn skills into small work samples.', [
          `Practice ${secondaryGap}`,
          'Build one portfolio project that proves the selected job requirements',
        ]),
        this.createPhase(3, 'Apply', 'Prepare application and interview materials.', [
          'Write resume bullets using the portfolio project',
          'Practice interview answers based on the selected job description',
        ]),
      ],
      settings: {
        weeklyHours: data.settings?.weeklyHours || data.preferences?.weeklyHours || 6,
        preferredPace: data.settings?.preferredPace || data.preferences?.preferredPace || 'moderate',
        accommodations: asArray(data.settings?.accommodations || data.preferences?.accommodations),
      },
      progress: {
        completedItems: 0,
        totalItems: 6,
        percentComplete: 0,
        currentPhase: 1,
        lastActivityAt: now,
      },
      createdAt: now,
      updatedAt: now,
    };
  }

  private fallbackCareers(data: any): CareerMatch[] {
    const skills = asArray(data.skills).join(', ') || 'your strengths';
    return [
      {
        title: 'Accessibility QA Tester',
        matchScore: 0.91,
        reasoning: `Uses ${skills} while valuing lived experience with accessible products.`,
        accessibilityScore: 92,
        growthPotential: 82,
        marketDemand: 80,
      },
      {
        title: 'Remote Customer Support Specialist',
        matchScore: 0.86,
        reasoning: 'Often supports text-based, remote, structured workflows.',
        accessibilityScore: 90,
        growthPotential: 72,
        marketDemand: 78,
      },
      {
        title: 'Junior Frontend Developer',
        matchScore: 0.84,
        reasoning: 'Good fit for people who enjoy building, problem solving, and flexible remote work.',
        accessibilityScore: 88,
        growthPotential: 88,
        marketDemand: 85,
      },
    ];
  }

  private fallbackQuestions(jobType: string, difficulty: string, count: number, focusAreas: string[] = []): InterviewQuestion[] {
    const primaryFocus = focusAreas[0] || 'the main required skill';
    const secondaryFocus = focusAreas[1] || 'a relevant portfolio project';
    const base: Omit<InterviewQuestion, 'id'>[] = [
      {
        text: `This selected ${jobType} job requires ${primaryFocus}. Tell me about a time you learned or practiced that skill.`,
        interviewerPrompt: `I'd like to start with ${primaryFocus}. Tell me about a time you learned or practiced that skill.`,
        type: 'behavioral',
        difficulty,
        followUpQuestions: ['What helped you learn?', 'How would you prove this skill to the employer?'],
        expectedPoints: ['Specific example', 'Learning process', 'Evidence or result'],
        scoringCriteria: ['Clarity', 'Specificity', 'Reflection'],
        accessibilityNotes: 'You can ask for a moment to think before answering.',
      },
      {
        text: `If this employer asked you to demonstrate ${secondaryFocus}, what small project or work sample would you show?`,
        interviewerPrompt: `Let's make this practical. If the employer asked you to demonstrate ${secondaryFocus}, what small project or work sample would you show?`,
        type: 'technical',
        difficulty,
        followUpQuestions: ['What would you build first?', 'How would you test or document it?'],
        expectedPoints: ['Project scope', 'Relevant skills', 'Testing or documentation'],
        scoringCriteria: ['Job relevance', 'Technical clarity', 'Practical plan'],
        accessibilityNotes: 'You can describe the work step by step instead of answering quickly.',
      },
      {
        text: 'How do you organize your work when tasks or communication become overwhelming?',
        interviewerPrompt: 'I want to understand how you work under pressure. How do you organize your work when tasks or communication become overwhelming?',
        type: 'situational',
        difficulty,
        followUpQuestions: ['What tools help you?', 'How do you communicate blockers?'],
        expectedPoints: ['Prioritization', 'Communication', 'Self-advocacy'],
        scoringCriteria: ['Practicality', 'Confidence', 'Role fit'],
        accessibilityNotes: 'This can include assistive technology, written instructions, or flexible breaks.',
      },
      {
        text: 'What workplace setup helps you do your best work?',
        interviewerPrompt: 'Now I want to ask about work setup. What workplace setup helps you do your best work?',
        type: 'disability',
        difficulty,
        followUpQuestions: ['How would you request that support?', 'What details would you keep private?'],
        expectedPoints: ['Clear needs', 'Privacy boundaries', 'Performance focus'],
        scoringCriteria: ['Professional tone', 'Specific request', 'Privacy awareness'],
        accessibilityNotes: 'Share only what you are comfortable sharing.',
      },
    ];

    return Array.from({ length: count }, (_, index) => {
      const item = base[index % base.length];
      return { ...item, id: `q_${index + 1}` };
    });
  }

  private fallbackFeedback(responses: any[]): InterviewFeedback {
    const answered = responses.filter((item) => item.response || item.content).length;
    const score = Math.min(9, Math.max(6, 6 + answered));
    return {
      overallScore: score,
      categories: [
        { name: 'Structure', score, feedback: 'Your answers are strongest when they include a clear situation, action, and result.' },
        { name: 'Accessibility self-advocacy', score: 8, feedback: 'Keep requests focused on what helps you perform well.' },
      ],
      strengths: ['You gave concrete information', 'You communicated needs in a practical way'],
      improvements: ['Add measurable outcomes where possible', 'Prepare one short accommodation script before interviews'],
      disabilityDisclosureAdvice: {
        shouldDisclose: 'optional',
        timing: 'Usually after the employer needs to coordinate interview or workplace accommodations.',
        script:
          'I can perform this role well. To do my best work, I use a few accommodations such as written instructions and flexible breaks. I am happy to discuss what is needed for this role.',
      },
      nextSteps: ['Practice two STAR answers', 'Prepare questions about team communication', 'Save one accommodation request template'],
    };
  }

  private fallbackInterviewTurnReply(input: {
    feedback: InterviewFeedback;
    isComplete: boolean;
  }): string {
    const strength = input.feedback.strengths[0] || 'you gave me useful context';
    const improvement = input.feedback.improvements[0] || 'try to add one specific result next time';

    if (input.isComplete) {
      return `Thank you, that gives me a clear picture. I noticed ${strength.toLowerCase()}. We will wrap the interview here, and your feedback is ready.`;
    }

    return `Thank you, that helps me understand your experience. I noticed ${strength.toLowerCase()}. For the next answer, ${improvement.toLowerCase()}. Let us move to the next question.`;
  }

  private createPhase(order: number, name: string, description: string, items: string[]) {
    return {
      id: createId(`phase_${order}`),
      name,
      description,
      order,
      estimatedDuration: items.length * 2,
      milestones: [
        {
          id: createId(`milestone_${order}`),
          title: `${name} milestone`,
          description,
          type: 'skill' as const,
          completedAt: null,
          items: items.map((title, index) => ({
            id: createId(`item_${order}_${index + 1}`),
            title,
            description: `${title} with accessible pacing and clear success criteria.`,
            type: index % 2 === 0 ? ('lesson' as const) : ('exercise' as const),
            duration: 30,
            resources: [],
            completedAt: null,
          })),
        },
      ],
    };
  }

  private normalizeFitAnalysis(fit: JDAnalysis['fit'] | undefined, fallback: JobFitAnalysis): JobFitAnalysis {
    if (!fit) return fallback;

    const missingSkills = Array.isArray(fit.missingSkills) ? fit.missingSkills : [];
    const missingRequirements = Array.isArray(fit.missingRequirements) ? fit.missingRequirements : [];
    const portfolioProjects = Array.isArray(fit.portfolioProjects) ? fit.portfolioProjects : [];

    return {
      ...fallback,
      ...fit,
      matchScore: clampNumber(
        Number(fit.matchScore) > 0 && Number(fit.matchScore) <= 1
          ? Number(fit.matchScore) * 100
          : fit.matchScore,
        0,
        100,
        fallback.matchScore
      ),
      verdict: fit.verdict || fallback.verdict,
      matchedSkills: asArray(fit.matchedSkills).length ? asArray(fit.matchedSkills) : fallback.matchedSkills,
      missingSkills: (missingSkills.length ? missingSkills : fallback.missingSkills).map((skill, index) => ({
        name: skill.name || fallback.missingSkills[index]?.name || 'Missing skill',
        importance: ['critical', 'important', 'nice-to-have'].includes(skill.importance)
          ? skill.importance
          : fallback.missingSkills[index]?.importance || 'important',
        reason: skill.reason || fallback.missingSkills[index]?.reason || 'This skill is listed in the selected job.',
        learningPriority: clampNumber(skill.learningPriority, 1, 10, index + 1),
      })),
      missingRequirements: (missingRequirements.length ? missingRequirements : fallback.missingRequirements).map((item, index) => ({
        requirement: item.requirement || fallback.missingRequirements[index]?.requirement || 'Job requirement',
        impact: ['high', 'medium', 'low'].includes(item.impact)
          ? item.impact
          : fallback.missingRequirements[index]?.impact || 'medium',
        workaround:
          item.workaround ||
          fallback.missingRequirements[index]?.workaround ||
          'Prepare concrete evidence through projects, practice tasks, or certificates.',
      })),
      portfolioProjects: (portfolioProjects.length ? portfolioProjects : fallback.portfolioProjects).map((project, index) => ({
        title: project.title || fallback.portfolioProjects[index]?.title || 'Portfolio project',
        goal: project.goal || fallback.portfolioProjects[index]?.goal || 'Show evidence for this job.',
        skills: asArray(project.skills).length ? asArray(project.skills) : fallback.portfolioProjects[index]?.skills || [],
      })),
      roadmapFocus: asArray(fit.roadmapFocus).length ? asArray(fit.roadmapFocus) : fallback.roadmapFocus,
      interviewFocus: asArray(fit.interviewFocus).length ? asArray(fit.interviewFocus) : fallback.interviewFocus,
      nextActions: asArray(fit.nextActions).length ? asArray(fit.nextActions) : fallback.nextActions,
    };
  }

  private normalizeJDAnalysis(analysis: JDAnalysis, jobDescription = '', userProfile?: any): JDAnalysis {
    const fallback = this.fallbackJDAnalysis(jobDescription, userProfile);
    const skills = Array.isArray(analysis.skills) ? analysis.skills : fallback.skills;
    const fallbackFit = this.fallbackFitAnalysis(jobDescription, userProfile, skills);

    return {
      ...fallback,
      ...analysis,
      summary: { ...fallback.summary, ...analysis.summary },
      accessibility: { ...fallback.accessibility, ...analysis.accessibility },
      compensation: { ...fallback.compensation, ...analysis.compensation },
      keyResponsibilities: Array.isArray(analysis.keyResponsibilities) ? analysis.keyResponsibilities : fallback.keyResponsibilities,
      skills,
      fit: this.normalizeFitAnalysis(analysis.fit, fallbackFit),
    };
  }

  private normalizeRoadmap(userId: string, data: any, roadmap: Partial<Roadmap>): Roadmap {
    const fallback = this.fallbackRoadmap(userId, data);
    const phases =
      Array.isArray(roadmap.phases) &&
      roadmap.phases.length > 0 &&
      roadmap.phases.every((phase) => Array.isArray(phase.milestones))
        ? roadmap.phases
        : fallback.phases;
    const currentSkills = Array.isArray(roadmap.currentSkills) && roadmap.currentSkills.length
      ? roadmap.currentSkills
      : fallback.currentSkills;
    const rawGapSkills = Array.isArray(roadmap.gapSkills) ? roadmap.gapSkills : [];
    const gapSkills = rawGapSkills.length
      ? rawGapSkills.map((skill: any, index) => {
          if (typeof skill === 'string') {
            return {
              name: skill,
              importance: index === 0 ? ('critical' as const) : ('important' as const),
              currentLevel: currentSkills.length ? 2 : 1,
              targetLevel: 4,
              resources: [],
            };
          }

          return {
            name: skill?.name || fallback.gapSkills[index]?.name || `Gap skill ${index + 1}`,
            importance: ['critical', 'important', 'nice-to-have'].includes(skill?.importance)
              ? skill.importance
              : fallback.gapSkills[index]?.importance || 'important',
            currentLevel: clampNumber(skill?.currentLevel, 1, 5, fallback.gapSkills[index]?.currentLevel || 1),
            targetLevel: clampNumber(skill?.targetLevel, 1, 5, fallback.gapSkills[index]?.targetLevel || 4),
            resources: Array.isArray(skill?.resources) ? skill.resources : [],
          };
        })
      : fallback.gapSkills;
    const totalItems = phases.reduce(
      (count, phase) =>
        count + phase.milestones.reduce((sum, milestone) => sum + milestone.items.length, 0),
      0
    );

    return {
      ...fallback,
      ...roadmap,
      id: roadmap.id || fallback.id,
      userId,
      targetJobId: data.targetJobId || fallback.targetJobId,
      currentSkills,
      gapSkills,
      phases,
      settings: { ...fallback.settings, ...roadmap.settings },
      progress: {
        ...fallback.progress,
        totalItems,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  private normalizeCareerMatch(career: CareerMatch): CareerMatch {
    return {
      title: career.title,
      matchScore: Number(career.matchScore) > 1 ? Number(career.matchScore) / 100 : Number(career.matchScore || 0.75),
      reasoning: career.reasoning || 'Matches your stated skills and preferences.',
      accessibilityScore: Number(career.accessibilityScore || 75),
      growthPotential: Number(career.growthPotential || 75),
      marketDemand: Number(career.marketDemand || 75),
    };
  }

  private normalizeQuestion(question: InterviewQuestion): InterviewQuestion {
    const text = typeof question.text === 'string' && question.text.trim()
      ? question.text.trim()
      : 'Tell me about your relevant experience for this role.';

    return {
      id: question.id || createId('q'),
      text,
      interviewerPrompt: cleanShortText(question.interviewerPrompt, buildInterviewerPrompt(text, question.type)),
      type: question.type || 'behavioral',
      difficulty: question.difficulty || 'medium',
      followUpQuestions: question.followUpQuestions || [],
      expectedPoints: question.expectedPoints || [],
      scoringCriteria: question.scoringCriteria || [],
      accessibilityNotes: question.accessibilityNotes,
    };
  }

  private normalizeFeedback(feedback: InterviewFeedback): InterviewFeedback {
    const rawShouldDisclose = feedback.disabilityDisclosureAdvice?.shouldDisclose as unknown;
    const advice = feedback.disabilityDisclosureAdvice
      ? {
          ...feedback.disabilityDisclosureAdvice,
          shouldDisclose:
            rawShouldDisclose === true
              ? ('yes' as const)
              : rawShouldDisclose === false
                ? ('no' as const)
                : feedback.disabilityDisclosureAdvice.shouldDisclose,
        }
      : null;

    return {
      overallScore: Number(feedback.overallScore || 7),
      categories: Array.isArray(feedback.categories) ? feedback.categories : [],
      strengths: Array.isArray(feedback.strengths) ? feedback.strengths : [],
      improvements: Array.isArray(feedback.improvements) ? feedback.improvements : [],
      disabilityDisclosureAdvice: advice,
      nextSteps: Array.isArray(feedback.nextSteps) ? feedback.nextSteps : [],
    };
  }
}
