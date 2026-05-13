import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button } from '../../../components/ui';
import { Brain, MessageCircle, Sparkles, CheckCircle2, Loader2, RotateCcw } from 'lucide-react';
import { assessmentService, handleApiError } from '../../../services';
import type { Assessment, Conversation } from '../../../lib/shared';

const starterPrompts = [
  'I like helping people and solving practical problems.',
  'I need remote or flexible work because my energy changes during the day.',
  'I want to learn tech skills but need a clear step-by-step path.',
];

export default function AssessmentPage() {
  const [assessment, setAssessment] = React.useState<Assessment | null>(null);
  const [messages, setMessages] = React.useState<Conversation[]>([]);
  const [input, setInput] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSending, setIsSending] = React.useState(false);
  const [isCompleting, setIsCompleting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const messagesRef = React.useRef<HTMLDivElement>(null);

  const startAssessment = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
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
    startAssessment();
  }, [startAssessment]);

  React.useEffect(() => {
    messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isSending]);

  const handleSend = async (message = input) => {
    if (!assessment || !message.trim()) return;

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
    }
  };

  const handleComplete = async () => {
    if (!assessment) return;
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
    }
  };

  const progress = assessment
    ? Math.min(100, Math.round((messages.filter((message) => message.role === 'user').length / 4) * 100))
    : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
          <Brain className="h-8 w-8 text-primary-600" />
        </div>
        <h1 className="heading-2 mb-2">Career Discovery Assessment</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Chat with Avora to identify strengths, work preferences, accessibility needs, and possible career paths.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </div>
      )}

      <Card>
        <CardContent>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Discovery progress</span>
            <span className="text-sm font-medium text-primary-600">{progress}% ready</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-primary-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </CardContent>
      </Card>

      <Card className="min-h-[440px] flex flex-col">
        {isLoading ? (
          <CardContent className="flex items-center justify-center gap-3 py-20">
            <Loader2 className="h-5 w-5 animate-spin text-primary-600" />
            <span>Starting assessment...</span>
          </CardContent>
        ) : (
          <>
            <div ref={messagesRef} className="flex-1 overflow-y-auto p-6 space-y-4 max-h-[520px]">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      msg.role === 'user' ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {msg.role === 'assistant' && (
                        <Sparkles className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                      )}
                      <p>{msg.content}</p>
                    </div>
                  </div>
                </div>
              ))}

              {isSending && (
                <div className="flex items-center gap-2 text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Avora is thinking...</span>
                </div>
              )}
            </div>

            {assessment?.status !== 'completed' && (
              <div className="px-4 pb-2 flex flex-wrap gap-2">
                {starterPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => handleSend(prompt)}
                    disabled={isSending}
                    className="px-3 py-1.5 rounded-full bg-primary-50 text-primary-700 text-sm hover:bg-primary-100 disabled:opacity-50"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            <div className="p-4 border-t border-gray-100">
              {assessment?.status === 'completed' ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 rounded-xl bg-success-50 px-4 py-3 text-success-800">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-medium">Assessment completed</span>
                  </div>
                  <Button variant="outline" onClick={startAssessment} leftIcon={<RotateCcw className="h-4 w-4" />}>
                    Start a new assessment
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') handleSend();
                    }}
                    placeholder="Type your answer here"
                    className="input flex-1"
                    disabled={isSending}
                  />
                  <Button onClick={() => handleSend()} disabled={isSending || !input.trim()} aria-label="Send message">
                    <MessageCircle className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleComplete}
                    isLoading={isCompleting}
                    disabled={messages.filter((message) => message.role === 'user').length === 0}
                  >
                    Complete
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </Card>

      {assessment?.status === 'completed' && (
        <Card>
          <CardHeader>
            <CardTitle>Recommended Career Paths</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              {assessment.results.recommendedCareers.map((career) => (
                <div key={career.title} className="rounded-xl border border-gray-100 p-4">
                  <div className="text-sm font-semibold text-primary-600 mb-1">
                    {Math.round(career.matchScore * 100)}% match
                  </div>
                  <h3 className="font-semibold text-gray-900">{career.title}</h3>
                  <p className="text-sm text-gray-600 mt-2">{career.reasoning}</p>
                  <div className="mt-3 text-xs text-gray-500">
                    Accessibility {career.accessibilityScore}/100 - Demand {career.marketDemand}/100
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Assessment tips</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>Share specific tasks you enjoy or avoid.</li>
                <li>Mention accessibility needs only at the level you are comfortable sharing.</li>
                <li>Use the complete button when Avora has enough context.</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
