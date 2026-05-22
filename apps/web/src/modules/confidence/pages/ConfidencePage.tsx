import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button } from '../../../components/ui';
import {
  BookOpen,
  CheckCircle2,
  Heart,
  Loader2,
  MessageSquareText,
  Plus,
  ShieldCheck,
  Sparkles,
  Star,
  Trash2,
} from 'lucide-react';
import { handleApiError, post } from '../../../services';
import { useAuthStore } from '../../../store';

type Mood = 'steady' | 'uncertain' | 'blocked' | 'confident';

type ConfidenceEntry = {
  id: string;
  mood: Mood;
  win: string;
  blocker: string;
  nextStep: string;
  coachReply: string;
  createdAt: string;
};

const storageKey = (userId?: string) => `avora-confidence-${userId || 'demo'}`;

const moods: { id: Mood; label: string; helper: string }[] = [
  { id: 'steady', label: 'Ổn định', helper: 'Tôi có thể đi tiếp với một kế hoạch nhỏ.' },
  { id: 'uncertain', label: 'Phân vân', helper: 'Tôi cần làm rõ trước khi hành động.' },
  { id: 'blocked', label: 'Đang kẹt', helper: 'Có điều gì đó đang chặn tiến độ.' },
  { id: 'confident', label: 'Tự tin', helper: 'Tôi đã sẵn sàng hành động.' },
];

const supportPrompts = [
  'Viết giúp tôi một kịch bản ngắn để xin hướng dẫn bằng văn bản.',
  'Giúp tôi biến điều đang kẹt hôm nay thành một hành động nhỏ.',
  'Nhắc tôi cách trình bày điểm mạnh trong phỏng vấn.',
];

export default function ConfidencePage() {
  const user = useAuthStore((state) => state.user);
  const [entries, setEntries] = React.useState<ConfidenceEntry[]>([]);
  const [mood, setMood] = React.useState<Mood>('steady');
  const [win, setWin] = React.useState('');
  const [blocker, setBlocker] = React.useState('');
  const [nextStep, setNextStep] = React.useState('');
  const [coachInput, setCoachInput] = React.useState('');
  const [coachReply, setCoachReply] = React.useState('');
  const [isSaving, setIsSaving] = React.useState(false);
  const [isCoaching, setIsCoaching] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey(user?.id));
      setEntries(saved ? JSON.parse(saved) : []);
    } catch {
      setEntries([]);
    }
  }, [user?.id]);

  const persistEntries = (next: ConfidenceEntry[]) => {
    setEntries(next);
    window.localStorage.setItem(storageKey(user?.id), JSON.stringify(next));
  };

  const askCoach = async (message: string, extraContext?: Record<string, unknown>) => {
    const response = await post<{ response: string }>('/api/ai/chat', {
      message,
      context: {
        agentId: 'confidence',
        routePath: '/confidence',
        moduleTitle: 'Tự tin ứng tuyển',
        moduleScope: 'Tự biện hộ, xây dựng tự tin, xử lý blocker và kịch bản hỗ trợ thực tế',
        moduleContext: {
          recentEntries: entries.slice(0, 5),
          currentMood: mood,
          userProfile: {
            targetRoles: user?.careerProfile?.targetRoles,
            workPreference: user?.careerProfile?.workPreferences?.remote,
          },
          ...extraContext,
        },
      },
    });
    return response.response;
  };

  const saveCheckIn = async () => {
    if (!win.trim() && !blocker.trim() && !nextStep.trim()) {
      setError('Hãy nhập ít nhất một ghi chú trước khi lưu check-in.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const reply = await askCoach(
        `Tạo phản hồi coaching ngắn từ check-in này. Tâm trạng: ${mood}. Điểm tốt: ${win}. Điều đang kẹt: ${blocker}. Bước tiếp theo: ${nextStep}. Đưa 2 hành động thực tế và một kịch bản ngắn nếu hữu ích.`,
        { win, blocker, nextStep }
      );
      const entry: ConfidenceEntry = {
        id: `confidence_${Date.now()}`,
        mood,
        win: win.trim(),
        blocker: blocker.trim(),
        nextStep: nextStep.trim(),
        coachReply: reply,
        createdAt: new Date().toISOString(),
      };
      persistEntries([entry, ...entries]);
      setCoachReply(reply);
      setWin('');
      setBlocker('');
      setNextStep('');
    } catch (err) {
      const apiError = handleApiError(err);
      setError(apiError.message || apiError.error);
    } finally {
      setIsSaving(false);
    }
  };

  const requestCoach = async (message = coachInput) => {
    if (!message.trim()) return;
    setIsCoaching(true);
    setError(null);
    try {
      const reply = await askCoach(message.trim());
      setCoachReply(reply);
      setCoachInput('');
    } catch (err) {
      const apiError = handleApiError(err);
      setError(apiError.message || apiError.error);
    } finally {
      setIsCoaching(false);
    }
  };

  const deleteEntry = (id: string) => {
    persistEntries(entries.filter((entry) => entry.id !== id));
  };

  const achievements = [
    { title: 'Check-in đầu tiên', unlocked: entries.length >= 1, helper: 'Lưu một ghi chú tự tin.' },
    { title: 'Nhận diện mô thức', unlocked: entries.length >= 3, helper: 'Theo dõi ba khoảnh khắc.' },
    { title: 'Tự biện hộ', unlocked: entries.some((entry) => entry.coachReply.toLowerCase().includes('script') || entry.coachReply.toLowerCase().includes('kịch bản')), helper: 'Tạo một kịch bản hỗ trợ.' },
    { title: 'Hành động tiếp theo', unlocked: entries.some((entry) => Boolean(entry.nextStep)), helper: 'Cam kết một bước nhỏ.' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="heading-2 mb-2">Agent tự tin</h1>
        <p className="text-gray-600">
          Ghi lại điểm mạnh, điều đang kẹt và kịch bản hỗ trợ để Avora đưa ra bước tiếp theo thực tế hơn.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary-600" />
              Check-in hằng ngày
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <label className="label">Hôm nay bạn cảm thấy thế nào về tiến độ nghề nghiệp?</label>
              <div className="grid gap-2 sm:grid-cols-4">
                {moods.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setMood(item.id)}
                    className={`rounded-2xl border p-3 text-left transition ${
                      mood === item.id
                        ? 'border-primary-300 bg-primary-50 text-primary-900'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-primary-200'
                    }`}
                  >
                    <span className="block font-semibold">{item.label}</span>
                    <span className="mt-1 block text-xs text-gray-500">{item.helper}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <div>
                <label className="label">Một điểm tốt</label>
                <textarea
                  className="input min-h-[130px] resize-none"
                  value={win}
                  onChange={(event) => setWin(event.target.value)}
                  placeholder="Ví dụ: Tôi đã hoàn thành một bài React."
                />
              </div>
              <div>
                <label className="label">Điều đang kẹt</label>
                <textarea
                  className="input min-h-[130px] resize-none"
                  value={blocker}
                  onChange={(event) => setBlocker(event.target.value)}
                  placeholder="Ví dụ: Tôi chưa biết nên luyện gì tiếp theo."
                />
              </div>
              <div>
                <label className="label">Bước nhỏ tiếp theo</label>
                <textarea
                  className="input min-h-[130px] resize-none"
                  value={nextStep}
                  onChange={(event) => setNextStep(event.target.value)}
                  placeholder="Ví dụ: Tạo một form nhỏ có hỗ trợ bàn phím."
                />
              </div>
            </div>

            <Button onClick={saveCheckIn} isLoading={isSaving} leftIcon={<Plus className="h-4 w-4" />}>
              Lưu check-in và nhận gợi ý AI
            </Button>
          </CardContent>
        </Card>

        <Card className="border-primary-100 bg-primary-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary-600" />
              Hỗ trợ cá nhân hóa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl bg-white p-4 text-gray-800">
              {isCoaching || isSaving ? (
                <div className="flex items-center gap-2 text-primary-700">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Agent tự tin đang phân tích...
                </div>
              ) : coachReply ? (
                <p className="whitespace-pre-wrap leading-7">{coachReply}</p>
              ) : (
                <p>Hỏi về kịch bản giao tiếp, cách lấy lại tự tin hoặc một bước nhỏ dựa trên điều bạn đang kẹt.</p>
              )}
            </div>

            <div className="space-y-2">
              {supportPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => requestCoach(prompt)}
                  className="w-full rounded-xl bg-white px-3 py-2 text-left text-sm font-medium text-primary-800 ring-1 ring-primary-100 hover:bg-primary-100"
                >
                  {prompt}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                className="input flex-1 bg-white"
                value={coachInput}
                onChange={(event) => setCoachInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') requestCoach();
                }}
                placeholder="Hỏi Agent tự tin..."
              />
              <Button onClick={() => requestCoach()} isLoading={isCoaching} aria-label="Hỏi Agent tự tin">
                <MessageSquareText className="h-5 w-5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-warning-500" />
              Thành tựu
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {achievements.map((achievement) => (
                <div
                  key={achievement.title}
                  className={`rounded-2xl border p-4 ${
                    achievement.unlocked ? 'border-warning-200 bg-warning-50' : 'border-gray-200 bg-gray-50 opacity-70'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {achievement.unlocked ? (
                      <CheckCircle2 className="h-5 w-5 text-warning-600" />
                    ) : (
                      <ShieldCheck className="h-5 w-5 text-gray-400" />
                    )}
                    <h3 className="font-semibold text-gray-900">{achievement.title}</h3>
                  </div>
                  <p className="mt-2 text-sm text-gray-600">{achievement.helper}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary-600" />
              Nhật ký tiến bộ
            </CardTitle>
          </CardHeader>
          <CardContent>
            {entries.length === 0 ? (
              <div className="rounded-2xl bg-gray-50 p-6 text-center">
                <p className="font-medium text-gray-900">Chưa có ghi chú tự tin.</p>
                <p className="mt-1 text-sm text-gray-500">Lưu một check-in để bắt đầu theo dõi tiến độ.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {entries.map((entry) => (
                  <article key={entry.id} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-primary-100 px-2.5 py-1 text-xs font-semibold capitalize text-primary-700">
                            {entry.mood}
                          </span>
                          <span className="text-xs text-gray-500">{new Date(entry.createdAt).toLocaleString()}</span>
                        </div>
                        {entry.win && <p className="mt-3 text-sm text-gray-700"><span className="font-semibold">Điểm tốt:</span> {entry.win}</p>}
                        {entry.blocker && <p className="mt-1 text-sm text-gray-700"><span className="font-semibold">Đang kẹt:</span> {entry.blocker}</p>}
                        {entry.nextStep && <p className="mt-1 text-sm text-gray-700"><span className="font-semibold">Tiếp theo:</span> {entry.nextStep}</p>}
                        <p className="mt-3 whitespace-pre-wrap rounded-xl bg-white p-3 text-sm leading-6 text-gray-700">
                          {entry.coachReply}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteEntry(entry.id)}
                        className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                        aria-label="Xóa ghi chú tự tin"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
