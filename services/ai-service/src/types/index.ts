export interface AzureOpenAIConfig {
  apiKey: string;
  endpoint: string;
  deployment: string;
  apiVersion: string;
}

export interface AIRequest {
  prompt: string;
  system?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

export interface AIResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  finishReason: string;
}

export interface ConversationContext {
  userId: string;
  sessionId: string;
  history: Message[];
  metadata?: Record<string, any>;
}

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: number;
}
