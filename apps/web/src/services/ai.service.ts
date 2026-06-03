import { post, type ApiRequestConfig } from './api';
import { demoFallback, withDemoFallback } from './demo-fallback.service';

export type AiChatPayload = {
  message: string;
  context?: Record<string, unknown>;
};

export const aiService = {
  chat(payload: AiChatPayload, config?: ApiRequestConfig): Promise<{ response: string }> {
    return withDemoFallback(
      post<{ response: string }>('/api/ai/chat', payload, config),
      () => demoFallback.ai.chat(payload)
    );
  },
};
