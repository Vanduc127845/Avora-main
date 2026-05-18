import React from 'react';
import { Loader2, MessageCircle, Mic, MicOff, Send, Sparkles, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { handleApiError, post } from '../../services';
import { useAuthStore } from '../../store';
import { getAgentForPath, type AgentId } from '../../lib/agentRegistry';
import { useSpeechToText } from '../../hooks/useSpeechToText';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

export default function AvoraChatWidget() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const location = useLocation();
  const agent = getAgentForPath(location.pathname);
  const [isOpen, setIsOpen] = React.useState(false);
  const [conversations, setConversations] = React.useState<Record<string, ChatMessage[]>>({});
  const [input, setInput] = React.useState('');
  const [isSending, setIsSending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const speechInput = useSpeechToText({
    getBaseText: () => input,
    onTranscript: setInput,
  });
  const stopSpeechInput = speechInput.stop;

  const getOpeningMessage = React.useCallback(
    (agentId: AgentId, content = agent.opening): ChatMessage => ({
      id: `opening_${agentId}`,
      role: 'assistant',
      content,
    }),
    [agent.opening]
  );

  const agentMessages = conversations[agent.id] || [getOpeningMessage(agent.id)];

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [agentMessages, isSending, isOpen]);

  React.useEffect(() => {
    const openChat = () => setIsOpen(true);
    window.addEventListener('avora:open-agent-chat', openChat);
    return () => window.removeEventListener('avora:open-agent-chat', openChat);
  }, []);

  React.useEffect(() => {
    if (!isOpen) stopSpeechInput();
  }, [isOpen, stopSpeechInput]);

  if (!isAuthenticated || agent.id === 'assessment') return null;

  const updateAgentMessages = (agentId: AgentId, updater: (previous: ChatMessage[]) => ChatMessage[]) => {
    setConversations((previous) => ({
      ...previous,
      [agentId]: updater(previous[agentId] || [getOpeningMessage(agentId)]),
    }));
  };

  const emitAgentStatus = (agentId: AgentId, status: 'thinking' | 'done' | 'error') => {
    window.dispatchEvent(new CustomEvent('avora:agent-status', { detail: { agentId, status } }));
  };

  const sendMessage = async () => {
    const content = input.trim();
    if (!content || isSending) return;

    if (speechInput.isListening) speechInput.stop();

    const activeAgent = agent;
    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content,
    };

    updateAgentMessages(activeAgent.id, (previous) => [...previous, userMessage]);
    setInput('');
    setError(null);
    setIsSending(true);
    emitAgentStatus(activeAgent.id, 'thinking');

    try {
      const response = await post<{ response: string }>('/api/ai/chat', {
        message: content,
        context: {
          agentId: activeAgent.id,
          routePath: location.pathname,
          moduleTitle: activeAgent.label,
          moduleScope: activeAgent.scope,
          history: agentMessages.slice(-8).map((message) => ({
            role: message.role,
            content: message.content,
          })),
        },
      });

      updateAgentMessages(activeAgent.id, (previous) => [
        ...previous,
        {
          id: `assistant_${Date.now()}`,
          role: 'assistant',
          content: response.response,
        },
      ]);
      emitAgentStatus(activeAgent.id, 'done');
    } catch (err) {
      const apiError = handleApiError(err);
      setError(apiError.message || apiError.error);
      emitAgentStatus(activeAgent.id, 'error');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-[70]">
      {isOpen && (
        <div className="mb-3 flex h-[560px] max-h-[calc(100vh-7rem)] w-[390px] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-stone-100 px-4 py-3">
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-700">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-sm font-semibold text-stone-900">{agent.agentName}</h2>
                <p className="truncate text-xs text-stone-500">{agent.scope}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-2 text-stone-500 hover:bg-stone-100 hover:text-stone-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              aria-label="Đóng chat AI Avora"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {agentMessages.map((message) => (
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
                <span>{agent.agentName} đang suy nghĩ...</span>
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
                placeholder={`Hỏi ${agent.agentName}...`}
                className="input flex-1"
                disabled={isSending}
              />
              <button
                type="button"
                onClick={speechInput.toggle}
                disabled={isSending}
                className={`flex h-12 w-12 items-center justify-center rounded-xl border focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                  speechInput.isListening
                    ? 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
                    : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50 hover:text-primary-700'
                }`}
                aria-label={speechInput.isListening ? 'Dung nhap bang giong noi' : 'Nhap bang giong noi'}
                aria-pressed={speechInput.isListening}
                title={
                  speechInput.isSupported
                    ? speechInput.isListening
                      ? 'Dung nghe'
                      : 'Noi de chuyen thanh van ban'
                    : 'Trinh duyet chua ho tro speech-to-text'
                }
              >
                {speechInput.isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </button>
              <button
                type="button"
                onClick={sendMessage}
                disabled={isSending || !input.trim()}
                className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600 text-white hover:bg-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label={`Gửi tin nhắn cho ${agent.agentName}`}
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
            {(speechInput.isListening || speechInput.error) && (
              <p
                className={`mt-2 text-xs ${speechInput.error ? 'text-red-600' : 'text-stone-500'}`}
                role={speechInput.error ? 'alert' : 'status'}
              >
                {speechInput.error || (speechInput.interimTranscript ? 'Dang nghe va nhap van ban...' : 'Dang nghe...')}
              </p>
            )}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-600 text-white shadow-xl hover:bg-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
        aria-label={`Mở chat ${agent.agentName}`}
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </div>
  );
}
