import { AzureOpenAI } from 'openai';
import type { AzureOpenAIConfig, AIRequest, AIResponse, ConversationContext, Message } from '../types/index.js';
import { logger } from '../utils/logger.js';

export class AzureOpenAIClient {
  private client: AzureOpenAI;
  private deployment: string;

  constructor(config: AzureOpenAIConfig) {
    this.client = new AzureOpenAI({
      apiKey: config.apiKey,
      apiVersion: config.apiVersion || '2024-02-15',
      endpoint: config.endpoint,
    });
    this.deployment = config.deployment;
  }

  async generate(request: AIRequest): Promise<AIResponse> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.deployment,
        messages: [
          ...(request.system ? [{ role: 'system' as const, content: request.system }] : []),
          { role: 'user' as const, content: request.prompt },
        ],
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens ?? 1000,
        top_p: request.topP,
        frequency_penalty: request.frequencyPenalty,
        presence_penalty: request.presencePenalty,
      });

      const choice = response.choices[0];
      return {
        content: choice.message.content || '',
        usage: response.usage ? {
          promptTokens: response.usage.prompt_tokens,
          completionTokens: response.usage.completion_tokens,
          totalTokens: response.usage.total_tokens,
        } : undefined,
        model: response.model,
        finishReason: choice.finish_reason || 'stop',
      };
    } catch (error) {
      logger.error('Azure OpenAI error:', error);
      throw error;
    }
  }

  async chat(context: ConversationContext, userMessage: string): Promise<string> {
    const messages: Message[] = [
      ...context.history,
      { role: 'user', content: userMessage, timestamp: Date.now() },
    ];

    const response = await this.client.chat.completions.create({
      model: this.deployment,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      temperature: 0.7,
      max_tokens: 1000,
    });

    const assistantMessage = response.choices[0].message.content || '';
    
    context.history.push(
      { role: 'user', content: userMessage, timestamp: Date.now() },
      { role: 'assistant', content: assistantMessage, timestamp: Date.now() }
    );

    return assistantMessage;
  }

  async generateWithJson<T>(request: AIRequest): Promise<T> {
    const response = await this.client.chat.completions.create({
      model: this.deployment,
      messages: [
        ...(request.system ? [{ role: 'system' as const, content: request.system }] : []),
        { role: 'user' as const, content: request.prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: request.temperature ?? 0.3,
      max_tokens: request.maxTokens ?? 2000,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No content in response');
    }

    return JSON.parse(content) as T;
  }
}
