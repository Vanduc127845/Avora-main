import type {
  CareerMatch,
  InterviewFeedback,
  InterviewQuestion,
  JDAnalysis,
  Roadmap,
} from '../types/shared.js';
import { createId } from '../data/demo-store.js';
import { logger } from '../utils/logger.js';

type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
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

  isConfigured(): boolean {
    return this.getStatus().configured;
  }

  getStatus(): AIStatus {
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
    if (this.fallbackEnabled) return fallback();
    throw new Error('AI provider is not configured and demo fallback is disabled.');
  }

  async chat(_userId: string, message: string, context?: { history?: ChatMessage[] }): Promise<string> {
    if (this.isConfigured()) {
      const response = await this.callModel([
        { role: 'system', content: SYSTEM_PROMPT },
        ...(context?.history || []).slice(-8),
        { role: 'user', content: message },
      ]);

      if (response) return response;
    }

    return this.useFallback(() => this.fallbackChat(message));
  }

  async analyzeJobDescription(jobDescription: string, userProfile?: any): Promise<JDAnalysis> {
    if (this.isConfigured()) {
      const response = await this.callModel(
        [
          { role: 'system', content: `${SYSTEM_PROMPT} Return valid JSON only.` },
          {
            role: 'user',
            content: `Analyze this job description for an accessibility-aware career seeker.

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
  "compensation": {"range": {"min": number, "max": number}, "currency": string, "benchmark": number}
}`,
          },
        ],
        true
      );

      const parsed = response ? parseJsonObject<JDAnalysis>(response) : null;
      if (parsed) return this.normalizeJDAnalysis(parsed);
    }

    return this.useFallback(() => this.fallbackJDAnalysis(jobDescription));
  }

  async generateRoadmap(userId: string, data: any): Promise<Roadmap> {
    const targetRole = data.targetRole || data.target_role || data.title || 'Accessible Career Path';
    const currentSkills = asArray(data.currentSkills);

    if (this.isConfigured()) {
      const response = await this.callModel(
        [
          { role: 'system', content: `${SYSTEM_PROMPT} Return valid JSON only.` },
          {
            role: 'user',
            content: `Create a practical accessible learning roadmap.

Target role: ${targetRole}
Current skills: ${currentSkills.join(', ') || 'not specified'}
Preferences JSON: ${JSON.stringify(data.preferences || data.settings || {})}

Return JSON for fields title, description, currentSkills, gapSkills, phases, settings. Use 3 phases, each with milestones and learning items. Keep items short and accessible.`,
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
    count: number
  ): Promise<InterviewQuestion[]> {
    if (this.isConfigured()) {
      const response = await this.callModel(
        [
          { role: 'system', content: `${SYSTEM_PROMPT} Return valid JSON only.` },
          {
            role: 'user',
            content: `Generate ${count} mock interview questions for ${jobType}. Difficulty: ${difficulty}.
Include behavioral, situational, and disability accommodation/disclosure coaching where appropriate.
Return {"questions":[{"id": string, "text": string, "type": string, "difficulty": string, "followUpQuestions": string[], "expectedPoints": string[], "scoringCriteria": string[], "accessibilityNotes": string}]}.`,
          },
        ],
        true
      );
      const parsed = response ? parseJsonObject<{ questions: InterviewQuestion[] }>(response) : null;
      if (parsed?.questions?.length) return parsed.questions.slice(0, count).map(this.normalizeQuestion);
    }

    return this.useFallback(() => this.fallbackQuestions(jobType, difficulty, count));
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

  private fallbackChat(message: string): string {
    const lower = message.toLowerCase();
    const normalized = normalizeVietnamese(message);
    const vietnamese = isVietnameseMessage(message);

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

  private fallbackJDAnalysis(jobDescription: string): JDAnalysis {
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
      skills: [...new Set(skills)].slice(0, 6).map((name, index) => ({
        name,
        importance: index < 2 ? ('required' as const) : ('preferred' as const),
        transferable: true,
      })),
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
    };
  }

  private fallbackRoadmap(userId: string, data: any): Roadmap {
    const targetRole = data.targetRole || data.target_role || data.title || 'Accessible Career Path';
    const targetJobId = data.targetJobId || data.target_job_id || 'general';
    const currentSkills = asArray(data.currentSkills);
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
          name: 'Role fundamentals',
          importance: 'critical',
          currentLevel: currentSkills.length ? 2 : 1,
          targetLevel: 4,
          resources: [],
        },
        {
          name: 'Portfolio evidence',
          importance: 'important',
          currentLevel: 1,
          targetLevel: 3,
          resources: [],
        },
      ],
      phases: [
        this.createPhase(1, 'Foundation', 'Build the core concepts and setup you need.', [
          'Review role basics in plain language',
          'Set up assistive tools and preferred workflow',
        ]),
        this.createPhase(2, 'Practice', 'Turn skills into small work samples.', [
          'Complete one guided practice project',
          'Collect feedback and revise your work',
        ]),
        this.createPhase(3, 'Apply', 'Prepare application and interview materials.', [
          'Write a targeted resume summary',
          'Practice interview answers and accommodation scripts',
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

  private fallbackQuestions(jobType: string, difficulty: string, count: number): InterviewQuestion[] {
    const base: Omit<InterviewQuestion, 'id'>[] = [
      {
        text: `Tell me about a time you learned something important for a ${jobType} role.`,
        type: 'behavioral',
        difficulty,
        followUpQuestions: ['What helped you learn?', 'What would you do differently next time?'],
        expectedPoints: ['Specific example', 'Learning process', 'Result'],
        scoringCriteria: ['Clarity', 'Specificity', 'Reflection'],
        accessibilityNotes: 'You can ask for a moment to think before answering.',
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

  private normalizeJDAnalysis(analysis: JDAnalysis): JDAnalysis {
    return {
      ...this.fallbackJDAnalysis(''),
      ...analysis,
      summary: { ...this.fallbackJDAnalysis('').summary, ...analysis.summary },
      accessibility: { ...this.fallbackJDAnalysis('').accessibility, ...analysis.accessibility },
      compensation: { ...this.fallbackJDAnalysis('').compensation, ...analysis.compensation },
      keyResponsibilities: Array.isArray(analysis.keyResponsibilities) ? analysis.keyResponsibilities : [],
      skills: Array.isArray(analysis.skills) ? analysis.skills : [],
    };
  }

  private normalizeRoadmap(userId: string, data: any, roadmap: Partial<Roadmap>): Roadmap {
    const fallback = this.fallbackRoadmap(userId, data);
    const phases = roadmap.phases?.length ? roadmap.phases : fallback.phases;
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
