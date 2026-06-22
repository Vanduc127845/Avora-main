import React from 'react';
import { Loader2, MessageCircle, Mic, MicOff, Send, Sparkles, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { aiService, handleApiError } from '../../services';
import { useAuthStore } from '../../store';
import { getAgentForPath, type AgentId } from '../../lib/agentRegistry';
import { useSpeechToText } from '../../hooks/useSpeechToText';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

type GuidedPrompt = {
  label: string;
  prompt: string;
};

const AGENT_FLOW_PROMPTS: Partial<Record<AgentId, GuidedPrompt[]>> = {
  dashboard: [
    { label: 'Tóm tắt tiến độ', prompt: 'Tóm tắt tiến độ hiện tại của tôi và đề xuất 3 việc nên làm tiếp theo.' },
    { label: 'Chọn bước tiếp theo', prompt: 'Dẫn tôi chọn hành động tiếp theo dựa trên hồ sơ, việc làm, lộ trình và phỏng vấn.' },
    { label: 'Tìm điểm đang kẹt', prompt: 'Tìm phần đang bị kẹt trong hành trình nghề nghiệp của tôi và gợi ý cách xử lý.' },
  ],
  profile: [
    { label: 'Rà soát kỹ năng', prompt: 'Rà soát hồ sơ của tôi và hỏi từng bước những kỹ năng hoặc kinh nghiệm còn thiếu.' },
    { label: 'Nhu cầu hỗ trợ', prompt: 'Giúp tôi làm rõ nhu cầu trợ năng, phong cách làm việc và mức độ chia sẻ phù hợp.' },
    { label: 'Hoàn thiện hồ sơ', prompt: 'Tạo checklist ngắn để tôi hoàn thiện hồ sơ trước khi ứng tuyển.' },
  ],
  jobs: [
    { label: 'Flow tìm việc', prompt: 'Dẫn tôi qua flow tìm việc: chọn vai trò, phân tích JD, đánh giá phù hợp và bước tiếp theo.' },
    { label: 'Phân tích JD', prompt: 'Phân tích một JD mẫu cho Junior Frontend Developer và chỉ ra kỹ năng còn thiếu.' },
    { label: 'Tìm việc phù hợp', prompt: 'Gợi ý tiêu chí tìm việc remote/accessibility-friendly phù hợp với hồ sơ của tôi.' },
  ],
  roadmaps: [
    { label: 'Lộ trình 4 tuần', prompt: 'Tạo flow lộ trình học 4 tuần cho Junior Frontend Developer, có bài thực hành và bằng chứng portfolio.' },
    { label: 'Ưu tiên gap', prompt: 'Giúp tôi ưu tiên các khoảng trống kỹ năng quan trọng nhất trước khi ứng tuyển.' },
    { label: 'Bằng chứng portfolio', prompt: 'Đề xuất 3 sản phẩm portfolio nhỏ để chứng minh kỹ năng frontend và accessibility.' },
  ],
  interviews: [
    { label: 'Câu hỏi thử', prompt: 'Tạo flow luyện phỏng vấn: hỏi 3 câu cho Junior Frontend Developer rồi chấm câu trả lời của tôi.' },
    { label: 'Cải thiện trả lời', prompt: 'Giúp tôi cải thiện một câu trả lời phỏng vấn theo cấu trúc rõ ràng và chuyên nghiệp.' },
    { label: 'Yêu cầu hỗ trợ', prompt: 'Tạo kịch bản nói về nhu cầu hỗ trợ/trợ năng trong buổi phỏng vấn.' },
  ],
  confidence: [
    { label: 'Kịch bản tự tin', prompt: 'Tạo kịch bản giúp tôi tự tin giới thiệu bản thân và nhu cầu hỗ trợ khi phỏng vấn.' },
    { label: 'Giảm lo lắng', prompt: 'Dẫn tôi qua một bài tập ngắn để giảm lo lắng trước khi ứng tuyển.' },
    { label: 'Tin nhắn ứng tuyển', prompt: 'Viết giúp tôi một tin nhắn ứng tuyển ngắn, chuyên nghiệp và tự tin.' },
  ],
  simulation: [
    { label: 'Tình huống công việc', prompt: 'Cho tôi một tình huống công việc thực tế và các lựa chọn phản hồi phù hợp.' },
    { label: 'Xử lý feedback', prompt: 'Mô phỏng tình huống nhận feedback khó và hướng dẫn tôi trả lời.' },
    { label: 'Giao tiếp nhóm', prompt: 'Tạo flow luyện giao tiếp trong nhóm khi cần hỗ trợ hoặc điều chỉnh cách làm việc.' },
  ],
  settings: [
    { label: 'Bật trợ năng', prompt: 'Hướng dẫn tôi bật trợ năng, tăng cỡ chữ và giảm chuyển động từng bước.' },
    { label: 'Đổi ngôn ngữ', prompt: 'Hướng dẫn tôi đổi ngôn ngữ và kiểm tra giao diện đã áp dụng chưa.' },
    { label: 'Quyền riêng tư', prompt: 'Giải thích các tuỳ chọn quyền riêng tư và tài khoản trong Avora.' },
  ],
  general: [
    { label: 'Bắt đầu từ đâu', prompt: 'Tôi nên bắt đầu từ đâu trong Avora nếu muốn tìm việc Junior Frontend Developer?' },
    { label: 'Giải thích tính năng', prompt: 'Giải thích nhanh các module chính của Avora và khi nào nên dùng từng module.' },
    { label: 'Chuẩn bị demo', prompt: 'Tạo checklist demo Avora trong 2 phút cho giám khảo hoặc người đánh giá.' },
  ],
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
  const guidedPrompts = AGENT_FLOW_PROMPTS[agent.id] || AGENT_FLOW_PROMPTS.general || [];

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

  if (!isAuthenticated) return null;

  const updateAgentMessages = (agentId: AgentId, updater: (previous: ChatMessage[]) => ChatMessage[]) => {
    setConversations((previous) => ({
      ...previous,
      [agentId]: updater(previous[agentId] || [getOpeningMessage(agentId)]),
    }));
  };

  const emitAgentStatus = (agentId: AgentId, status: 'thinking' | 'done' | 'error') => {
    window.dispatchEvent(new CustomEvent('avora:agent-status', { detail: { agentId, status } }));
  };

  const sendMessage = async (presetContent?: string) => {
    const content = (presetContent ?? input).trim();
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
      const response = await aiService.chat({
        message: content,
        context: {
          agentId: activeAgent.id,
          routePath: location.pathname,
          moduleTitle: activeAgent.label,
          moduleScope: activeAgent.scope,
          concise: true,
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
        <div className="interactive-card mb-3 flex h-[560px] max-h-[calc(100vh-7rem)] w-[390px] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl">
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
              className="interactive-button rounded-lg p-2 text-stone-500 hover:bg-stone-100 hover:text-stone-900"
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

            {agentMessages.length <= 1 && guidedPrompts.length > 0 && (
              <div className="rounded-2xl border border-primary-100 bg-primary-50/60 p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary-700">
                  Kịch bản nhanh
                </p>
                <div className="flex flex-wrap gap-2">
                  {guidedPrompts.map((prompt) => (
                    <button
                      key={prompt.label}
                      type="button"
                      onClick={() => void sendMessage(prompt.prompt)}
                      disabled={isSending}
                      className="interactive-button rounded-full border border-primary-200 bg-white px-3 py-1.5 text-xs font-semibold text-primary-700 hover:border-primary-300 hover:bg-primary-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {prompt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

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
                    void sendMessage();
                  }
                }}
                placeholder={`Hỏi ${agent.agentName}...`}
                className="input flex-1 transition-all duration-200 ease-out focus:border-sky-300 focus:ring-sky-400/25"
                disabled={isSending}
              />
              <button
                type="button"
                onClick={speechInput.toggle}
                disabled={isSending}
                className={`interactive-button flex h-12 w-12 items-center justify-center rounded-xl border disabled:cursor-not-allowed disabled:opacity-50 ${
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
                onClick={() => void sendMessage()}
                disabled={isSending || !input.trim()}
                className="interactive-button flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600 text-white hover:bg-primary-700 hover:shadow-lg hover:shadow-primary-500/25 disabled:cursor-not-allowed disabled:opacity-50"
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
        className="interactive-button flex h-14 w-14 items-center justify-center rounded-full bg-primary-600 text-white shadow-xl hover:scale-[1.06] hover:bg-primary-700 hover:shadow-2xl hover:shadow-primary-500/30 active:scale-[0.96]"
        aria-label={`Mở chat ${agent.agentName}`}
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </div>
  );
}
