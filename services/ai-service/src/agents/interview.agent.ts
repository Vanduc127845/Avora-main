import { AzureOpenAIClient } from '../clients/openai.client.js';
import { INTERVIEW_COACH_PROMPT } from '../prompts/index.js';
import { logger } from '../utils/logger.js';

export interface InterviewQuestion {
  id: string;
  text: string;
  type: 'behavioral' | 'technical' | 'situational' | 'disability';
  difficulty: 'easy' | 'medium' | 'hard';
  followUpQuestions: string[];
  expectedPoints: string[];
  scoringCriteria: string[];
  tips?: string[];
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
  disabilityDisclosureAdvice?: {
    shouldDisclose: 'yes' | 'no' | 'optional';
    timing: string;
    script: string;
  };
  nextSteps: string[];
}

export class InterviewAgent {
  private aiClient: AzureOpenAIClient;

  constructor(aiClient: AzureOpenAIClient) {
    this.aiClient = aiClient;
  }

  async generateQuestions(
    jobType: string,
    difficulty: string,
    count: number = 5,
    types: string[] = ['behavioral', 'situational']
  ): Promise<InterviewQuestion[]> {
    logger.info('Interview Agent: Generating questions', { jobType, difficulty, count });

    const prompt = `
Generate ${count} interview questions for a ${jobType} position.
Difficulty: ${difficulty}
Types: ${types.join(', ')}

For each question provide:
- text: The question
- type: behavioral, technical, situational, or disability
- difficulty: easy, medium, hard
- followUpQuestions: 2 potential follow-ups
- expectedPoints: 3 key points an ideal answer should cover
- scoringCriteria: How to evaluate the answer
- tips: Brief tips for answering

Return as JSON array.`;

    const response = await this.aiClient.generateWithJson<{ questions: InterviewQuestion[] }>({
      prompt,
      system: INTERVIEW_COACH_PROMPT,
      temperature: 0.6,
      maxTokens: 2000,
    });

    return response.questions || [];
  }

  async evaluateResponse(
    question: InterviewQuestion,
    response: string
  ): Promise<{
    score: number;
    strengths: string[];
    improvements: string[];
    feedback: string;
  }> {
    const prompt = `
Evaluate this interview response:

Question: ${question.text}
Response: ${response}

Expected points: ${question.expectedPoints.join(', ')}
Scoring criteria: ${question.scoringCriteria.join(', ')}

Evaluate the response and provide:
- score: 1-10
- strengths: What's done well
- improvements: What could be better
- feedback: Constructive feedback

Return as JSON.`;

    return this.aiClient.generateWithJson(prompt);
  }

  async provideOverallFeedback(
    responses: { question: string; response: string; feedback: any }[],
    jobType: string
  ): Promise<InterviewFeedback> {
    const prompt = `
Provide overall interview feedback for a ${jobType} position.

Responses evaluated:
${responses.map((r, i) => `
Q${i + 1}: ${r.question}
Response: ${r.response}
Feedback: ${JSON.stringify(r.feedback)}
`).join('\n')}

Provide:
- overallScore: 1-10
- categories: Scores and feedback for Communication, Content, Structure, Confidence
- strengths: Overall strengths
- improvements: Overall areas for improvement
- nextSteps: 3-5 actionable next steps

Return as JSON.`;

    return this.aiClient.generateWithJson({
      prompt,
      system: INTERVIEW_COACH_PROMPT,
      temperature: 0.4,
      maxTokens: 1500,
    });
  }

  async generateDisabilityDisclosureAdvice(
    jobType: string,
    disabilityType?: string
  ): Promise<{
    shouldDisclose: 'yes' | 'no' | 'optional';
    reasoning: string;
    timing: string;
    script: string;
    legalRights: string[];
  }> {
    const prompt = `
Provide disability disclosure advice for a ${jobType} position.
${disabilityType ? `Disability type: ${disabilityType}` : ''}

Consider:
- Legal protections (ADA, Section 503)
- Workplace culture
- Job requirements
- Accommodation needs

Provide:
- shouldDisclose: yes, no, or optional
- reasoning: Explanation
- timing: When to disclose if choosing to do so
- script: Sample language
- legalRights: Key legal protections to know

Return as JSON.`;

    return this.aiClient.generateWithJson(prompt);
  }
}
