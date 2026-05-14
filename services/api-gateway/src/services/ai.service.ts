import type {
  CareerMatch,
  InterviewFeedback,
  InterviewQuestion,
  JDAnalysis,
  JobFitAnalysis,
  Roadmap,
} from '../types/shared.js';
import { createId } from '../data/demo-store.js';
import { logger } from '../utils/logger.js';

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

type AIProvider = 'azure-openai' | 'openai' | 'groq' | 'ollama' | 'demo-fallback';

type AIStatus = {
  provider: AIProvider;
  configured: boolean;
  fallbackEnabled: boolean;
  model: string | null;
  missingEnv: string[];
};

const SYSTEM_PROMPT =
  'You are Avora, a practical AI career copilot for people with disabilities. Be respectful, privacy-preserving, strengths-based, and concrete. Do not make medical or legal claims. Prefer plain language and actionable next steps.';

const AGENT_PROMPTS: Record<string, string> = {
  dashboard:
    'You are the Dashboard Agent. Focus on progress, priorities, blockers, and the next best action across Avora. Keep answers short and operational.',
  profile:
    'You are the Profile Agent. Focus on skills, strengths, access needs, work preferences, disclosure boundaries, and profile completeness. Do not diagnose medical conditions.',
  assessment:
    'You are the Assessment Orchestrator Agent. Synthesize signals from all specialist agents: Profile, Jobs, Roadmaps, Interviews, Confidence, Simulation, Settings, and Dashboard. Break complex user needs into specialist findings, then give one clear final recommendation. Ask for missing information only when it blocks a useful answer.',
  jobs:
    'You are the Jobs Agent. Focus on selected roles, job requirements, missing skills, accessibility signals, application readiness, and job-specific next steps. Avoid generic career advice.',
  roadmaps:
    'You are the Roadmap Agent. Focus on learning sequence, skill gaps, weekly plan, portfolio proof, pacing, and accessibility-friendly study structure.',
  interviews:
    'You are the Interview Agent. Focus on role-specific mock interview questions, STAR answers, technical drills, feedback, and accommodation request scripts.',
  confidence:
    'You are the Confidence Agent. Focus on self-advocacy, communication scripts, anxiety-reducing next steps, boundaries, and strengths-based reflection. Stay practical.',
  simulation:
    'You are the Simulation Agent. Focus on realistic workplace scenarios, choices, consequences, scripts, and safe practice. Keep the scenario concrete.',
  settings:
    'You are the Settings Agent. Focus on app settings, accessibility preferences, notifications, privacy, language, and setup troubleshooting.',
  help:
    'You are the Help Agent. Focus on documentation, setup, feature navigation, installation, and explaining how Avora works.',
  general:
    'You are the General Routing Agent. Identify which Avora specialist should handle the request, answer if simple, and suggest the right navigation area.',
};

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
    ? `Current Avora module: ${context.moduleTitle}. Scope: ${context.moduleScope || 'not specified'}.`
    : `Current Avora module route: ${context?.routePath || 'unknown'}.`;
  const extraContext = context?.moduleContext
    ? `Module context JSON: ${JSON.stringify(context.moduleContext)}`
    : '';

  return [
    SYSTEM_PROMPT,
    AGENT_PROMPTS[agentId] || AGENT_PROMPTS.general,
    moduleLine,
    extraContext,
    'You are one specialist in a multi-agent product. Stay in your scope. If another specialist is needed, name that agent and explain the handoff in one sentence.',
    'When the user asks in Vietnamese, answer in Vietnamese. Otherwise use the user language.',
  ]
    .filter(Boolean)
    .join('\n');
};

const asArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];

const isVietnameseMessage = (value: string) =>
  /[ăâđêôơưáàảãạấầẩẫậắằẳẵặéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]/i.test(value) ||
  /\b(toi|ban|minh|viec|nghe|hoc|phong van|khuyet tat|ho tro|dang|can)\b/i.test(value);

const normalizeVietnamese = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
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

const uniqueStrings = (values: string[]) =>
  [...new Set(values.map((value) => value.trim()).filter(Boolean))];

const skillKey = (value: string) =>
  normalizeVietnamese(value)
    .replace(/[^a-z0-9+#. ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

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
        fallbackEnabled: this.fallbackEnabled,
        model: this.deployment,
        missingEnv: [],
      };
    }

    if (wantsOpenAI && hasOpenAIKey && hasOpenAIModel) {
      return {
        provider: 'openai',
        configured: true,
        fallbackEnabled: this.fallbackEnabled,
        model: this.openAIModel,
        missingEnv: [],
      };
    }

    if (wantsGroq && hasGroqKey && hasGroqModel) {
      return {
        provider: 'groq',
        configured: true,
        fallbackEnabled: this.fallbackEnabled,
        model: this.groqModel,
        missingEnv: [],
      };
    }

    if (wantsOllama && hasOllamaBaseUrl && hasOllamaModel) {
      return {
        provider: 'ollama',
        configured: true,
        fallbackEnabled: this.fallbackEnabled,
        model: this.ollamaModel,
        missingEnv: [],
      };
    }

    if (this.preferredProvider === 'groq') {
      return {
        provider: 'demo-fallback',
        configured: false,
        fallbackEnabled: this.fallbackEnabled,
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
        fallbackEnabled: this.fallbackEnabled,
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
        fallbackEnabled: this.fallbackEnabled,
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
      fallbackEnabled: this.fallbackEnabled,
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
    if (this.fallbackEnabled) return fallback();
    throw new Error('AI provider is not configured and demo fallback is disabled.');
  }

  async chat(_userId: string, message: string, context?: ChatContext): Promise<string> {
    if (this.isConfigured()) {
      const response = await this.callModel([
        { role: 'system', content: buildAgentSystemPrompt(context) },
        ...(context?.history || []).slice(-8),
        { role: 'user', content: message },
      ]);

      if (response) return response;
    }

    return this.useFallback(() => this.fallbackChat(message, inferAgentId(context)));
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
Return {"questions":[{"id": string, "text": string, "type": string, "difficulty": string, "followUpQuestions": string[], "expectedPoints": string[], "scoringCriteria": string[], "accessibilityNotes": string}]}.`,
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

  private async callAzure(messages: ChatMessage[], jsonMode = false): Promise<string | null> {
    try {
      const response = await fetch(
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
      logger.warn('Azure OpenAI fallback activated', { error });
      return null;
    }
  }

  private async callOpenAI(messages: ChatMessage[], jsonMode = false): Promise<string | null> {
    try {
      const response = await fetch(`${this.openAIBaseUrl}/chat/completions`, {
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
      logger.warn('OpenAI fallback activated', { error });
      return null;
    }
  }

  private async callGroq(messages: ChatMessage[], jsonMode = false): Promise<string | null> {
    try {
      const response = await fetch(`${this.groqBaseUrl}/chat/completions`, {
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
        logger.warn('Groq request failed', {
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
      logger.warn('Groq fallback activated', { error });
      return null;
    }
  }

  private async callOllama(messages: ChatMessage[], jsonMode = false): Promise<string | null> {
    try {
      const response = await fetch(`${this.ollamaBaseUrl}/api/chat`, {
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
      logger.warn('Ollama fallback activated', { error });
      return null;
    }
  }

  private fallbackChat(message: string, agentId = 'general'): string {
    const lower = message.toLowerCase();
    const normalized = normalizeVietnamese(message);
    const vietnamese = isVietnameseMessage(message);
    const prefix = agentId === 'assessment'
      ? 'Assessment Orchestrator: '
      : `${(AGENT_PROMPTS[agentId] ? agentId : 'general').replace(/^\w/, (c) => c.toUpperCase())} Agent: `;

    if (agentId === 'jobs') {
      return `${prefix}Pick a specific job or paste its requirements. I will compare it with your current skills, list missing requirements, then suggest a roadmap and interview practice.`;
    }
    if (agentId === 'roadmaps') {
      return `${prefix}Tell me the target role and your current skills. I will turn the biggest gaps into a weekly learning plan with one portfolio project.`;
    }
    if (agentId === 'interviews') {
      return `${prefix}Tell me the role or selected job. I will create focused questions, expected points, and feedback using STAR and technical evidence.`;
    }
    if (agentId === 'profile') {
      return `${prefix}Share your skills, access needs, preferred work style, and boundaries. I will help make your profile specific enough for job matching.`;
    }
    if (agentId === 'assessment') {
      return `${prefix}I will combine profile, job fit, roadmap, interview, confidence, and simulation signals. Start with your goal, current skills, and what support you need.`;
    }

    if (vietnamese) {
      if (normalized.includes('phong van') || normalized.includes('interview')) {
        return 'Bạn nên chuẩn bị câu trả lời theo STAR: tình huống, nhiệm vụ, hành động và kết quả. Nếu cần hỗ trợ tiếp cận khi phỏng vấn, mình có thể giúp bạn viết một câu yêu cầu ngắn gọn và tự tin.';
      }
      if (normalized.includes('viec') || normalized.includes('job') || normalized.includes('nghe')) {
        return 'Mình sẽ ưu tiên các công việc có mô tả rõ, lịch linh hoạt, có thể làm từ xa và có hỗ trợ tiếp cận. Hãy nói cho mình biết kỹ năng mạnh nhất của bạn và điều kiện làm việc bạn cần.';
      }
      if (normalized.includes('hoc') || normalized.includes('lo trinh') || normalized.includes('roadmap')) {
        return 'Mình có thể chia mục tiêu của bạn thành lộ trình từng bước: học nền tảng trước, làm bài tập nhỏ để có sản phẩm, rồi luyện phỏng vấn và hồ sơ. Bạn muốn học ngành nào, ví dụ frontend, data, thiết kế, hay hỗ trợ khách hàng?';
      }
      return 'Mình hiểu. Hãy nói rõ hơn về điều bạn làm tốt, điều khiến bạn mệt hoặc cần hỗ trợ, và môi trường làm việc bạn mong muốn. Mình sẽ gợi ý bước tiếp theo thật cụ thể.';
    }

    if (lower.includes('interview') || lower.includes('phong van')) {
      return 'Start with a specific STAR example: situation, task, action, and result. If you need accessibility adjustments, I can help you write a short, confident request.';
    }
    if (lower.includes('job') || lower.includes('viec')) {
      return 'I will prioritize roles with clear expectations, flexible schedules, remote options, and accessibility support. Tell me your strongest skill and the work conditions you need.';
    }
    return 'I understand. Tell me more about what you do well, what drains your energy or requires support, and what kind of work environment you want.';
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
        type: 'behavioral',
        difficulty,
        followUpQuestions: ['What helped you learn?', 'How would you prove this skill to the employer?'],
        expectedPoints: ['Specific example', 'Learning process', 'Evidence or result'],
        scoringCriteria: ['Clarity', 'Specificity', 'Reflection'],
        accessibilityNotes: 'You can ask for a moment to think before answering.',
      },
      {
        text: `If this employer asked you to demonstrate ${secondaryFocus}, what small project or work sample would you show?`,
        type: 'technical',
        difficulty,
        followUpQuestions: ['What would you build first?', 'How would you test or document it?'],
        expectedPoints: ['Project scope', 'Relevant skills', 'Testing or documentation'],
        scoringCriteria: ['Job relevance', 'Technical clarity', 'Practical plan'],
        accessibilityNotes: 'You can describe the work step by step instead of answering quickly.',
      },
      {
        text: 'How do you organize your work when tasks or communication become overwhelming?',
        type: 'situational',
        difficulty,
        followUpQuestions: ['What tools help you?', 'How do you communicate blockers?'],
        expectedPoints: ['Prioritization', 'Communication', 'Self-advocacy'],
        scoringCriteria: ['Practicality', 'Confidence', 'Role fit'],
        accessibilityNotes: 'This can include assistive technology, written instructions, or flexible breaks.',
      },
      {
        text: 'What workplace setup helps you do your best work?',
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
    return {
      id: question.id || createId('q'),
      text: question.text,
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
