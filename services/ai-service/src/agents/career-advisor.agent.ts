import { AzureOpenAIClient } from '../clients/openai.client.js';
import { CAREER_ADVISOR_PROMPT } from '../prompts/index.js';
import type { ConversationContext } from '../types/index.js';
import { logger } from '../utils/logger.js';

export class CareerAdvisorAgent {
  private aiClient: AzureOpenAIClient;

  constructor(aiClient: AzureOpenAIClient) {
    this.aiClient = aiClient;
  }

  async chat(context: ConversationContext, userMessage: string): Promise<string> {
    logger.info('Career Advisor: Processing message', { userId: context.userId });

    const systemPrompt = CAREER_ADVISOR_PROMPT;
    
    return this.aiClient.chat(context, userMessage);
  }

  async suggestCareers(userProfile: {
    interests: string[];
    skills: string[];
    values: string[];
    experienceLevel?: string;
  }): Promise<any[]> {
    const prompt = `
Based on the following user profile, suggest suitable careers:

Interests: ${userProfile.interests.join(', ')}
Skills: ${userProfile.skills.join(', ')}
Values: ${userProfile.values.join(', ')}
Experience Level: ${userProfile.experienceLevel || 'Not specified'}

Provide 5 career suggestions with:
- Career title
- Match score (0-1)
- Reasoning
- Accessibility considerations
- Growth potential (0-100)
- Market demand (0-100)

Return as JSON array.`;

    const response = await this.aiClient.generateWithJson<{ careers: any[] }>({
      prompt,
      system: CAREER_ADVISOR_PROMPT,
      temperature: 0.5,
      maxTokens: 1500,
    });

    return response.careers || [];
  }

  async analyzeStrengths(
    userResponses: string[]
  ): Promise<{ strengths: string[]; skills: string[]; interests: string[] }> {
    const prompt = `
Analyze the following responses to identify the user's strengths, skills, and interests:

${userResponses.map((r, i) => `Response ${i + 1}: ${r}`).join('\n\n')}

Return as JSON with:
- strengths: Key strengths identified
- skills: Transferable skills mentioned or implied
- interests: Areas of interest

Return as JSON.`;

    return this.aiClient.generateWithJson(prompt);
  }
}
