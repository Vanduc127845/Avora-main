import { AzureOpenAIClient } from '../clients/openai.client.js';
import { JD_SIMPLIFIER_PROMPT } from '../prompts/index.js';
import { logger } from '../utils/logger.js';

export interface JDAnalysisResult {
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
  compensation?: {
    range: { min: number; max: number };
    currency: string;
    benchmark?: number;
  };
}

export class JDSimplifierAgent {
  private aiClient: AzureOpenAIClient;

  constructor(aiClient: AzureOpenAIClient) {
    this.aiClient = aiClient;
  }

  async analyze(jobDescription: string, userProfile?: any): Promise<JDAnalysisResult> {
    logger.info('JD Simplifier: Analyzing job description');

    const systemPrompt = JD_SIMPLIFIER_PROMPT + (userProfile ? 
      `\n\nUser Profile:\n${JSON.stringify(userProfile, null, 2)}` : '');

    return this.aiClient.generateWithJson<JDAnalysisResult>({
      prompt: `Analyze this job description:\n\n${jobDescription}`,
      system: systemPrompt,
      temperature: 0.3,
      maxTokens: 2000,
    });
  }

  async simplifyText(text: string, readingLevel: number = 8): Promise<string> {
    const prompt = `
Simplify the following text to a reading level of grade ${readingLevel}:

${text}

Provide only the simplified text without explanation.`;

    const response = await this.aiClient.generate({
      prompt,
      temperature: 0.3,
      maxTokens: 1000,
    });

    return response.content;
  }

  async extractKeyTerms(jobDescription: string): Promise<{
    terms: { term: string; definition: string }[];
    jargon: { original: string; plain: string }[];
  }> {
    const prompt = `
Extract technical terms and jargon from this job description and provide plain-language definitions:

${jobDescription}

Return as JSON with:
- terms: Array of {term, definition}
- jargon: Array of {original, plain} for jargon conversion`;

    return this.aiClient.generateWithJson(prompt);
  }
}
