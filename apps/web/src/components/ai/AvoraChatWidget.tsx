import React from 'react';
import { Loader2, MessageCircle, Send, Sparkles, X } from 'lucide-react';
import { handleApiError, post } from '../../services';
import { useAuthStore } from '../../store';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

const openingMessage: ChatMessage = {
  id: 'opening',
  role: 'assistant',
  content:
    'Chào bạn, mình là Avora. Bạn có thể hỏi mình về việc làm, lộ trình học, phỏng vấn, hoặc cách xin hỗ trợ tiếp cận tại nơi làm việc.',
};

export default function AvoraChatWidget() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [isOpen, setIsOpen] = React.useState(false);
  const [messages, setMessages] = React.useState<ChatMessage[]>([openingMessage]);
  const [input, setInput] = React.useState('');
  const [isSending, setIsSending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isSending, isOpen]);

  if (!isAuthenticated) return null;

  const sendMessage = async () => {
    const content = input.trim();
    if (!content || isSending) return;

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content,
    };

    setMessages((previous) => [...previous, userMessage]);
    setInput('');
    setError(null);
    setIsSending(true);

    try {
      const response = await post<{ response: string }>('/api/ai/chat', {
        message: content,
        context: {
          history: messages.slice(-8).map((message) => ({
            role: message.role,
            content: message.content,
          })),
        },
      });

      setMessages((previous) => [
        ...previous,
        {
          id: `assistant_${Date.now()}`,
          role: 'assistant',
          content: response.response,
        },
      ]);
    } catch (err) {
      const apiError = handleApiError(err);
      setError(apiError.message || apiError.error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-[70]">
      {isOpen && (
        <div className="mb-3 flex h-[560px] max-h-[calc(100vh-7rem)] w-[380px] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-stone-100 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-100 text-primary-700">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-stone-900">Avora AI</h2>
                <p className="text-xs text-stone-500">Trợ lý nghề nghiệp và tiếp cận</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-2 text-stone-500 hover:bg-stone-100 hover:text-stone-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              aria-label="Close Avora AI chat"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    message.role === 'user'
                      ? 'bg-primary-600 text-white'
                      : 'bg-stone-100 text-stone-900'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}

            {isSending && (
              <div className="flex items-center gap-2 text-sm text-stone-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Avora đang trả lời...</span>
              </div>
            )}
          </div>

          {error && (
            <div className="mx-4 mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {error}
            </div>
          )}

          <div className="border-t border-stone-100 p-3">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Hỏi Avora..."
                className="input flex-1"
                disabled={isSending}
              />
              <button
                type="button"
                onClick={sendMessage}
                disabled={isSending || !input.trim()}
                className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600 text-white hover:bg-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Send message to Avora AI"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-600 text-white shadow-xl hover:bg-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
        aria-label="Open Avora AI chat"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </div>
  );
}
