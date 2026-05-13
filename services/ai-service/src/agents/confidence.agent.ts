import { AzureOpenAIClient } from '../clients/openai.client.js';
import { CONFIDENCE_BUILDER_PROMPT } from '../prompts/index.js';
import { logger } from '../utils/logger.js';

export interface ConfidenceMessage {
  type: 'affirmation' | 'encouragement' | 'exercise' | 'tip';
  content: string;
  timestamp: number;
}

export interface Affirmation {
  text: string;
  category: 'strength' | 'progress' | 'resilience' | 'value';
}

export class ConfidenceAgent {
  private aiClient: AzureOpenAIClient;
  private affirmationCache: Affirmation[] = [];

  constructor(aiClient: AzureOpenAIClient) {
    this.aiClient = aiClient;
  }

  async getPersonalizedAffirmation(
    context: { recentWins?: string[]; struggles?: string[]; goals?: string[] }
  ): Promise<Affirmation> {
    const prompt = `
Generate a personalized affirmation based on:
${context.recentWins ? `Recent wins: ${context.recentWins.join(', ')}` : ''}
${context.struggles ? `Current struggles: ${context.struggles.join(', ')}` : ''}
${context.goals ? `Goals: ${context.goals.join(', ')}` : ''}

Create an affirmation that:
- Acknowledges their situation
- Focuses on strengths and potential
- Is encouraging and specific
- Is realistic but hopeful

Return as JSON with text and category (strength, progress, resilience, or value).`;

    return this.aiClient.generateWithJson<Affirmation>({
      prompt,
      system: CONFIDENCE_BUILDER_PROMPT,
      temperature: 0.8,
      maxTokens: 200,
    });
  }

  async addressImposterSyndrome(
    userStatement: string
  ): Promise<{
    reframed: string;
    evidence: string[];
    action: string;
  }> {
    const prompt = `
The user expressed: "${userStatement}"

This sounds like imposter syndrome. Help reframe it by:
1. Acknowledging the feeling is valid
2. Providing evidence that contradicts the self-doubt
3. Suggesting one concrete action

Return as JSON with reframed (positive reframing), evidence (counter-evidence), and action (one step).`;

    return this.aiClient.generateWithJson(prompt);
  }

  async generateSuccessJournalPrompt(
    userGoals: string[],
    recentActivities: string[]
  ): Promise<string> {
    const prompt = `
Generate a success journal reflection prompt that:
- Focuses on growth and learning
- Acknowledges ${recentActivities.length ? `recent activities: ${recentActivities.join(', ')}` : 'their effort'}
- Connects to goals: ${userGoals.join(', ')}
- Is encouraging and specific
- Encourages self-compassion

Create 3 questions for them to reflect on today.`;

    const response = await this.aiClient.generate({
      prompt,
      system: CONFIDENCE_BUILDER_PROMPT,
      temperature: 0.7,
      maxTokens: 500,
    });

    return response.content;
  }

  async provideEncouragement(
    context: { progress?: number; challenges?: string[]; achievement?: string }
  ): Promise<string> {
    const prompt = `
Provide encouraging message for someone who:
${context.progress ? `- Made ${context.progress}% progress` : ''}
${context.challenges ? `- Is facing: ${context.challenges.join(', ')}` : ''}
${context.achievement ? `- Achieved: ${context.achievement}` : ''}

Keep it warm, specific, and encouraging. Maximum 2-3 sentences.`;

    const response = await this.aiClient.generate({
      prompt,
      system: CONFIDENCE_BUILDER_PROMPT,
      temperature: 0.7,
      maxTokens: 200,
    });

    return response.content;
  }
}
