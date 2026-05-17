import React from 'react';
import { Button } from '../../../components/ui';
import {
  Briefcase,
  CheckCircle2,
  ClipboardCheck,
  Map as MapIcon,
  MessageCircle,
  Mic,
  RotateCcw,
  Send,
  Sparkles,
  Target,
  UserRound,
} from 'lucide-react';
import { agentMemoryService, assessmentService, handleApiError } from '../../../services';
import type { Assessment, Conversation, OrchestrationPlan } from '../../../lib/shared';

type PromptAction = {
  label: string;
  prompt: string;
  icon: React.ComponentType<{ className?: string }>;
};

const starterPrompts: PromptAction[] = [
  {
    label: 'Bắt đầu từ hồ sơ',
    prompt: 'Dùng hồ sơ của tôi để xác định kỹ năng hiện có, sau đó hỏi tôi JD cụ thể trước khi tạo lộ trình.',
    icon: UserRound,
  },
  {
    label: 'Phân tích job mục tiêu',
    prompt: 'Tôi muốn làm Frontend Developer. Hãy tìm hoặc yêu cầu JD thật trước khi phân tích khoảng trống kỹ năng.',
    icon: Briefcase,
  },
  {
    label: 'Tạo lộ trình từ JD',
    prompt: 'Roadmap Agent: chỉ tạo lộ trình sau khi Jobs Agent đã có JD thật và danh sách kỹ năng còn thiếu.',
    icon: MapIcon,
  },
];

const fallbackActionIcons = [Briefcase, MapIcon, Mic, Target];

const assessmentSteps = [
  { label: 'Mục tiêu', helper: 'Vai trò hoặc hướng nghề' },
  { label: 'Phân tích JD', helper: 'Tin tuyển dụng cụ thể' },
  { label: 'Khoảng trống kỹ năng', helper: 'So sánh JD với hồ sơ' },
  { label: 'Lộ trình', helper: 'Học theo gap ưu tiên' },
  { label: 'Kết quả', helper: 'Tổng hợp cá nhân hóa' },
];

const getMessageLabel = (message: Conversation) => {
  if (message.role === 'user') return 'Bạn';
  if (message.extractedData?.orchestration) return 'Tóm tắt đánh giá';
  return 'Avora Assessment';
};

const getMessageContent = (message: Conversation) => {
  const content = message.content?.trim();
  if (content) return content;

  const orchestration = message.extractedData?.orchestration;
  if (!orchestration) return 'Avora chưa trả về nội dung cho tin nhắn này. Vui lòng thử lại.';

  return [
    `Assessment đã điều phối ${orchestration.agentTraces.length} agent${orchestration.selectedJob ? ` cho ${orchestration.selectedJob}` : ''}.`,
    ...orchestration.agentTraces.slice(0, 4).map((trace) => `- ${trace.agentName}: ${trace.summary}`),
    orchestration.finalRecommendation ? `Kết luận: ${orchestration.finalRecommendation}` : '',
  ].filter(Boolean).join('\n');
};

const agentBadgeClasses: Record<string, string> = {
  profile: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  jobs: 'bg-amber-50 text-amber-700 ring-amber-100',
  roadmaps: 'bg-indigo-50 text-indigo-700 ring-indigo-100',
  interviews: 'bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-100',
  confidence: 'bg-rose-50 text-rose-700 ring-rose-100',
  simulation: 'bg-teal-50 text-teal-700 ring-teal-100',
};

const statusLabel: Record<string, string> = {
  complete: 'Hoàn tất',
  'needs-input': 'Cần dữ liệu',
  queued: 'Đang chờ',
  error: 'Lỗi',
};

export default function AssessmentPage() {
  const [assessment, setAssessment] = React.useState<Assessment | null>(null);
  const [messages, setMessages] = React.useState<Conversation[]>([]);
  const [input, setInput] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSending, setIsSending] = React.useState(false);
  const [isCompleting, setIsCompleting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [memoryChip, setMemoryChip] = React.useState<string>('Chưa có bộ nhớ phiên cho Assessment.');
  const [showRestartConfirm, setShowRestartConfirm] = React.useState(false);
  const messagesRef = React.useRef<HTMLDivElement>(null);
  const latestExchangeRef = React.useRef<HTMLElement | null>(null);
  const initialLoadStartedRef = React.useRef(false);
  const sendInFlightRef = React.useRef(false);
  const completeInFlightRef = React.useRef(false);

  const startAssessment = React.useCallback(async (forceNew = false) => {
    setIsLoading(true);
    setError(null);

    try {
      if (!forceNew) {
        const history = await assessmentService.getHistory({ cacheTtlMs: 10_000 });
        const active = history.assessments.find((item) => item.status === 'in-progress');
        if (active) {
          const response = await assessmentService.getAssessment(active.id, { cacheTtlMs: 10_000 });
          setAssessment(response.assessment);
          setMessages(response.assessment.conversations);
          return;
        }
      }

      const response = await assessmentService.createAssessment();
      setAssessment(response.assessment);
      setMessages(response.assessment.conversations);
    } catch (err) {
      const apiError = handleApiError(err);
      setError(apiError.message || apiError.error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    const controller = new AbortController();
    agentMemoryService
      .list(controller.signal)
      .then((response) => {
        const assessmentMemory = response.memories.find((memory) => memory.agentId === 'assessment');
        const profileMemory = response.memories.find((memory) => memory.agentId === 'profile');
        const memory = assessmentMemory || profileMemory;
        if (!memory) return;
        const fact = memory.facts.slice(-1)[0];
        setMemoryChip(fact || memory.summary || 'Assessment đã có ngữ cảnh phiên gần đây.');
      })
      .catch(() => undefined);

    return () => controller.abort();
  }, [messages.length]);

  React.useEffect(() => {
    window.dispatchEvent(new CustomEvent('avora:agent-status', {
      detail: { agentId: 'assessment', status: isSending ? 'thinking' : 'done' },
    }));
  }, [isSending]);

  React.useEffect(() => {
    if (initialLoadStartedRef.current) return;
    initialLoadStartedRef.current = true;
    startAssessment();
  }, [startAssessment]);

  React.useLayoutEffect(() => {
    const scrollToLatestExchange = () => {
      const container = messagesRef.current;
      if (!container) return;

      const target = latestExchangeRef.current;
      if (!target) {
        container.scrollTop = container.scrollHeight;
        return;
      }

      const nextTop = target.offsetTop - container.offsetTop - 16;
      const maxTop = container.scrollHeight - container.clientHeight;
      container.scrollTop = Math.max(0, Math.min(nextTop, maxTop));
    };

    scrollToLatestExchange();
    const frame = window.requestAnimationFrame(scrollToLatestExchange);
    const timeout = window.setTimeout(scrollToLatestExchange, 120);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
    };
  }, [messages, isSending]);

  const handleSend = async (message = input) => {
    if (sendInFlightRef.current) return;
    if (!assessment || !message.trim()) return;
    sendInFlightRef.current = true;

    const optimistic: Conversation = {
      id: `local_${Date.now()}`,
      role: 'user',
      content: message.trim(),
      timestamp: new Date(),
    };

    setMessages((previous) => [...previous, optimistic]);
    setInput('');
    setIsSending(true);
    setError(null);

    try {
      const response = await assessmentService.sendMessage(assessment.id, message.trim());
      setAssessment(response.assessment);
      setMessages(response.assessment.conversations);
    } catch (err) {
      const apiError = handleApiError(err);
      setError(apiError.message || apiError.error);
      setMessages((previous) => previous.filter((item) => item.id !== optimistic.id));
    } finally {
      setIsSending(false);
      sendInFlightRef.current = false;
    }
  };

  const handleComplete = async () => {
    if (completeInFlightRef.current) return;
    if (!assessment) return;
    completeInFlightRef.current = true;
    setIsCompleting(true);
    setError(null);

    try {
      const response = await assessmentService.completeAssessment(assessment.id);
      setAssessment(response.assessment);
      setMessages(response.assessment.conversations);
    } catch (err) {
      const apiError = handleApiError(err);
      setError(apiError.message || apiError.error);
    } finally {
      setIsCompleting(false);
      completeInFlightRef.current = false;
    }
  };

  const requestNewAssessment = () => {
    if (messages.some((message) => message.role === 'user' || message.extractedData?.orchestration)) {
      setShowRestartConfirm(true);
      return;
    }
    startAssessment(true);
  };

  const confirmNewAssessment = () => {
    setShowRestartConfirm(false);
    startAssessment(true);
  };

  const userMessageCount = messages.filter((message) => message.role === 'user').length;
  const latestUserMessageId = React.useMemo(() => {
    return [...messages].reverse().find((message) => message.role === 'user')?.id;
  }, [messages]);
  const latestOrchestration = React.useMemo<OrchestrationPlan | undefined>(() => {
    return [...messages]
      .reverse()
      .find((message) => message.role === 'assistant' && message.extractedData?.orchestration)
      ?.extractedData?.orchestration;
  }, [messages]);
  const traceByAgent = React.useMemo(() => {
    return new Map((latestOrchestration?.agentTraces || []).map((trace) => [trace.agentId, trace]));
  }, [latestOrchestration]);
  const completed = assessment?.status === 'completed';
  const stepDone = [
    userMessageCount > 0,
    Boolean(latestOrchestration?.jdSource),
    traceByAgent.get('jobs')?.status === 'complete' && Boolean(latestOrchestration?.summaryCard),
    traceByAgent.get('roadmaps')?.status === 'complete',
    Boolean(latestOrchestration?.summaryCard),
  ];
  const completedStepCount = completed ? assessmentSteps.length : stepDone.filter(Boolean).length;
  const progress = assessment ? Math.round((completedStepCount / assessmentSteps.length) * 100) : 0;
  const nextStepIndex = stepDone.findIndex((done) => !done);
  const activeStepIndex = completed
    ? assessmentSteps.length - 1
    : nextStepIndex === -1
      ? assessmentSteps.length - 1
      : Math.min(assessmentSteps.length - 1, nextStepIndex);
  const statusText = completed
    ? 'Hoàn tất'
    : isLoading
      ? 'Đang tải'
      : userMessageCount === 0
        ? 'Sẵn sàng'
        : latestOrchestration?.missingInputs?.length
          ? 'Cần JD'
          : 'Sẵn sàng tổng hợp';

  const suggestedActions = React.useMemo<PromptAction[]>(() => {
    if (!latestOrchestration?.nextActions?.length) return starterPrompts;

    return latestOrchestration.nextActions.slice(0, 4).map((action, index) => ({
      label: action.label,
      prompt: action.prompt,
      icon: fallbackActionIcons[index] || Sparkles,
    }));
  }, [latestOrchestration]);

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-primary-600 text-white">
              <ClipboardCheck className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary-600">Đánh giá nghề nghiệp</p>
              <h1 className="mt-2 text-3xl font-bold leading-tight text-stone-950 md:text-4xl">
                Tìm một hướng nghề cụ thể để tập trung tiếp theo
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600 md:text-base">
                Avora chỉ tạo lộ trình sau khi có JD thật, hồ sơ hiện tại và danh sách kỹ năng còn thiếu được phân tích rõ.
              </p>
              <div className="mt-3 inline-flex max-w-full items-center gap-2 rounded-full border border-primary-100 bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-800">
                <Sparkles className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">Ngữ cảnh phiên: {memoryChip}</span>
              </div>
            </div>
          </div>

          <div className="w-full rounded-2xl border border-stone-100 bg-stone-50 p-4 lg:w-64">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-bold text-stone-700">{statusText}</span>
              <span className="text-2xl font-bold text-stone-950">{progress}%</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
              <div className="h-full rounded-full bg-primary-600 transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">
            {error}
          </div>
        )}
      </section>

      <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        <div className="border-b border-stone-100 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
                <MessageCircle className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-lg font-bold text-stone-950">Cuộc trò chuyện đánh giá</h2>
                <p className="text-sm text-stone-500">Hãy đưa mục tiêu hoặc JD cụ thể; kết quả được xây từ luồng này.</p>
              </div>
            </div>

            <Button
              variant={completed ? 'primary' : 'outline'}
              onClick={requestNewAssessment}
              leftIcon={<RotateCcw className="h-4 w-4" />}
            >
              Đánh giá mới
            </Button>
          </div>

          <div className="mt-4 grid gap-2 md:grid-cols-5">
            {assessmentSteps.map((step, index) => {
              const isDone = completed || stepDone[index];
              const isActive = !completed && index === activeStepIndex;

              return (
                <div
                  key={step.label}
                  className={`rounded-xl border px-3 py-2 ${
                    isDone
                      ? 'border-emerald-100 bg-emerald-50'
                      : isActive
                        ? 'border-primary-200 bg-primary-50'
                        : 'border-stone-100 bg-stone-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold ${
                        isDone
                          ? 'bg-emerald-600 text-white'
                          : isActive
                            ? 'bg-primary-600 text-white'
                            : 'bg-white text-stone-400'
                      }`}
                    >
                      {isDone ? <CheckCircle2 className="h-3.5 w-3.5" /> : index + 1}
                    </span>
                    <span className="text-sm font-bold text-stone-900">{step.label}</span>
                  </div>
                  <p className="mt-1 text-xs text-stone-500">{step.helper}</p>
                </div>
              );
            })}
          </div>
        </div>

        {isLoading ? (
          <div className="min-h-[420px] space-y-4 p-5" aria-label="Đang tải đánh giá">
            <div className="h-5 w-48 animate-pulse rounded-full bg-stone-100" />
            <div className="h-24 max-w-3xl animate-pulse rounded-2xl bg-stone-100" />
            <div className="ml-auto h-14 max-w-md animate-pulse rounded-2xl bg-primary-100" />
            <div className="h-28 max-w-4xl animate-pulse rounded-2xl bg-stone-100" />
          </div>
        ) : (
          <>
            <div
              ref={messagesRef}
              className="h-[58vh] min-h-[420px] max-h-[640px] overflow-y-auto overscroll-contain bg-white p-5"
              aria-live="polite"
            >
              <div className="space-y-4 pb-40">
                {messages.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50 p-5 text-center">
                    <Sparkles className="mx-auto h-6 w-6 text-primary-600" />
                    <p className="mt-2 text-sm font-semibold text-stone-700">
                      Hãy bắt đầu bằng vai trò mục tiêu, JD cụ thể hoặc kỹ năng hiện tại của bạn.
                    </p>
                  </div>
                )}

                {messages.map((msg) => {
                  const isUser = msg.role === 'user';
                  const orchestration = msg.extractedData?.orchestration;
                  const traces = orchestration?.agentTraces || [];

                  return (
                    <article
                      key={msg.id}
                      ref={msg.id === latestUserMessageId ? latestExchangeRef : undefined}
                      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-full sm:max-w-[88%] ${isUser ? 'text-right' : 'text-left'}`}>
                        <div className={`mb-1 flex items-center gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
                          {!isUser && (
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 text-primary-700">
                              <Sparkles className="h-3.5 w-3.5" />
                            </span>
                          )}
                          <span className="text-xs font-bold uppercase tracking-[0.1em] text-stone-400">
                            {getMessageLabel(msg)}
                          </span>
                        </div>
                        <div
                          className={`break-words rounded-2xl px-4 py-3 text-left leading-7 shadow-sm ${
                            isUser ? 'bg-primary-600 text-white' : 'border border-stone-100 bg-stone-50 text-stone-900'
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{getMessageContent(msg)}</p>
                        </div>

                        {!isUser && traces.length > 0 && (
                          <div className="mt-3 space-y-2">
                            <div className="flex flex-wrap gap-1.5">
                              {traces.slice(0, 6).map((trace) => (
                                <span
                                  key={`${msg.id}-${trace.agentId}`}
                                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${
                                    agentBadgeClasses[trace.agentId] || 'bg-stone-100 text-stone-600 ring-stone-100'
                                  }`}
                                >
                                  {trace.agentName} · {statusLabel[trace.status] || trace.status}
                                </span>
                              ))}
                            </div>
                            <details className="rounded-xl border border-stone-100 bg-white px-3 py-2 text-left">
                              <summary className="cursor-pointer text-xs font-bold uppercase tracking-[0.1em] text-stone-500">
                                Lý luận của Agent
                              </summary>
                              <div className="mt-2 space-y-2">
                                {traces.map((trace) => (
                                  <div key={`${msg.id}-${trace.agentId}-raw`} className="rounded-lg bg-stone-50 p-3">
                                    <div className="text-xs font-bold text-stone-700">{trace.agentName}</div>
                                    <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-stone-600">
                                      {trace.rawOutput || trace.summary}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </details>
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}

                {isSending && (
                  <div className="flex justify-start">
                    <div className="w-full max-w-2xl rounded-2xl border border-primary-100 bg-primary-50 p-4">
                      <div className="h-4 w-40 animate-pulse rounded-full bg-primary-100" />
                      <div className="mt-3 h-3 w-full animate-pulse rounded-full bg-primary-100" />
                      <div className="mt-2 h-3 w-3/4 animate-pulse rounded-full bg-primary-100" />
                      <span className="sr-only">Agent đang phân tích JD và hồ sơ...</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {!completed && (
              <div className="border-t border-stone-100 bg-stone-50 px-5 py-4">
                <div className="flex flex-wrap gap-2">
                  {suggestedActions.map((action) => {
                    const Icon = action.icon;

                    return (
                      <button
                        key={`${action.label}-${action.prompt}`}
                        type="button"
                        onClick={() => handleSend(action.prompt)}
                        disabled={isSending}
                        className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2 text-left text-sm font-semibold text-stone-700 transition hover:border-primary-200 hover:bg-primary-50 disabled:opacity-50"
                      >
                        <Icon className="h-4 w-4 text-primary-600" />
                        {action.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="border-t border-stone-100 bg-white p-4">
              {completed ? (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-emerald-800">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-bold">Đánh giá đã hoàn tất</span>
                  </div>
                  <Button variant="outline" onClick={requestNewAssessment} leftIcon={<RotateCcw className="h-4 w-4" />}>
                    Bắt đầu lại
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-2 sm:flex-row">
                  <label className="sr-only" htmlFor="assessment-message">
                    Nhập tin nhắn đánh giá
                  </label>
                  <input
                    id="assessment-message"
                    type="text"
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') handleSend();
                    }}
                    placeholder="Nhập vị trí mục tiêu, JD, kỹ năng hiện tại hoặc điều bạn đang băn khoăn..."
                    className="input flex-1"
                    disabled={isSending}
                  />
                  <Button onClick={() => handleSend()} disabled={isSending || !input.trim()} aria-label="Gửi tin nhắn">
                    <Send className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleComplete}
                    isLoading={isCompleting}
                    disabled={userMessageCount === 0}
                  >
                    Hoàn tất
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </section>

      {latestOrchestration?.finalRecommendation && (
        <section className="rounded-2xl border border-primary-100 bg-primary-50 p-5">
          <p className="text-sm font-bold uppercase tracking-[0.12em] text-primary-700">Định hướng hiện tại</p>
          <p className="mt-2 leading-7 text-primary-950">{latestOrchestration.finalRecommendation}</p>
        </section>
      )}

      {latestOrchestration?.summaryCard && (
        <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.12em] text-primary-700">Thẻ tổng hợp Assessment</p>
              <h2 className="mt-1 text-xl font-bold text-stone-950">{latestOrchestration.summaryCard.jobTitle}</h2>
              <p className="mt-1 text-sm text-stone-500">Nguồn JD: {latestOrchestration.summaryCard.jdSource}</p>
            </div>
            <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-bold text-primary-700">
              Mục tiêu: {latestOrchestration.summaryCard.goal}
            </span>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            <div className="rounded-xl border border-stone-100 bg-stone-50 p-4">
              <h3 className="font-bold text-stone-900">Top kỹ năng thiếu</h3>
              <div className="mt-3 space-y-2">
                {latestOrchestration.summaryCard.topGaps.length ? latestOrchestration.summaryCard.topGaps.map((gap) => (
                  <div key={gap.skill} className="rounded-lg bg-white p-3 text-sm ring-1 ring-stone-100">
                    <div className="font-bold text-stone-900">{gap.skill} · {gap.priority}</div>
                    <p className="mt-1 leading-6 text-stone-600">{gap.reason}</p>
                  </div>
                )) : (
                  <p className="text-sm text-stone-600">Chưa phát hiện gap ưu tiên cao.</p>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-stone-100 bg-stone-50 p-4">
              <h3 className="font-bold text-stone-900">Lộ trình theo tuần</h3>
              <div className="mt-3 space-y-2">
                {latestOrchestration.summaryCard.weeklyRoadmap.map((item) => (
                  <div key={`${item.week}-${item.skill}`} className="rounded-lg bg-white p-3 text-sm ring-1 ring-stone-100">
                    <div className="font-bold text-stone-900">{item.week}: {item.skill}</div>
                    <p className="mt-1 leading-6 text-stone-600">{item.resource}</p>
                    <p className="mt-1 text-xs font-semibold text-stone-500">Output: {item.output}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-stone-100 bg-stone-50 p-4">
              <h3 className="font-bold text-stone-900">Câu hỏi phỏng vấn</h3>
              <ol className="mt-3 space-y-2 text-sm leading-6 text-stone-700">
                {latestOrchestration.summaryCard.interviewQuestions.map((question, index) => (
                  <li key={question} className="rounded-lg bg-white p-3 ring-1 ring-stone-100">
                    {index + 1}. {question}
                  </li>
                ))}
              </ol>
              <div className="mt-3 rounded-lg bg-primary-50 p-3 text-sm font-semibold text-primary-900">
                {latestOrchestration.summaryCard.nextAction}
              </div>
            </div>
          </div>
        </section>
      )}

      {completed && assessment && assessment.results.recommendedCareers.length > 0 && (
        <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-bold text-stone-950">Hướng nghề được đề xuất</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {assessment.results.recommendedCareers.map((career) => (
              <div key={career.title} className="rounded-xl border border-stone-100 bg-stone-50 p-4">
                <div className="text-sm font-bold text-primary-700">{Math.round(career.matchScore * 100)}% match</div>
                <h3 className="mt-1 font-bold text-stone-950">{career.title}</h3>
                <p className="mt-2 text-sm leading-6 text-stone-600">{career.reasoning}</p>
                <div className="mt-3 text-xs font-semibold text-stone-500">
                  Trợ năng {career.accessibilityScore}/100 - Nhu cầu thị trường {career.marketDemand}/100
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {showRestartConfirm && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-stone-950/45 px-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-5 shadow-2xl">
            <h2 className="text-lg font-bold text-stone-950">Tạo đánh giá mới?</h2>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              Luồng hiện tại đã có nội dung. Nếu tạo đánh giá mới, bạn sẽ bắt đầu một thread Assessment khác.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowRestartConfirm(false)}>
                Hủy
              </Button>
              <Button onClick={confirmNewAssessment}>
                Tạo mới
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
