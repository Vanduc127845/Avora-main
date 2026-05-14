import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button } from '../../../components/ui';
import {
  ArrowRight,
  Briefcase,
  Building,
  CheckCircle2,
  Clock,
  Loader2,
  MessageSquareText,
  Play,
  RotateCcw,
  Sparkles,
  Star,
  Users,
} from 'lucide-react';
import { handleApiError, post } from '../../../services';
import { useAuthStore } from '../../../store';

type Scenario = {
  id: string;
  title: string;
  role: string;
  category: string;
  duration: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  setup: string;
  challenge: string;
  options: string[];
  skills: string[];
};

type SimulationTurn = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
};

type SimulationRecord = {
  id: string;
  scenarioTitle: string;
  completedAt: string;
  takeaway: string;
};

const scenarios: Scenario[] = [
  {
    id: 'frontend-accessibility',
    title: 'Frontend Accessibility Task',
    role: 'Junior Frontend Developer',
    category: 'Technology',
    duration: '15 min',
    difficulty: 'Beginner',
    setup: 'You joined a team that shipped a form. A screen reader user says the error messages are not clear.',
    challenge: 'Decide how you would investigate, fix, and explain the accessibility issue.',
    options: [
      'Inspect labels, focus order, ARIA error text, then test with keyboard and screen reader.',
      'Only change the color of the error message to red.',
      'Ask the designer to solve it and wait for a new mockup.',
    ],
    skills: ['HTML semantics', 'Form validation', 'Keyboard testing', 'Communication'],
  },
  {
    id: 'remote-meeting',
    title: 'Remote Team Meeting',
    role: 'Remote Support Specialist',
    category: 'Communication',
    duration: '10 min',
    difficulty: 'Beginner',
    setup: 'A meeting moves quickly and several instructions are only spoken once.',
    challenge: 'Practice asking for support while keeping the conversation professional.',
    options: [
      'Ask for written action items and confirm your assigned task in chat.',
      'Stay silent and try to remember everything later.',
      'Leave the meeting without telling anyone.',
    ],
    skills: ['Self-advocacy', 'Written communication', 'Task clarification'],
  },
  {
    id: 'workload-boundary',
    title: 'Workload Boundary',
    role: 'Accessibility QA Tester',
    category: 'Advocacy',
    duration: '20 min',
    difficulty: 'Intermediate',
    setup: 'Your manager asks you to finish a large test pass today, but your energy is dropping.',
    challenge: 'Choose how to communicate a realistic plan without over-sharing private health details.',
    options: [
      'Give a prioritized plan, name what can finish today, and ask which item matters most.',
      'Say yes to everything even if quality will drop.',
      'Explain private medical details to justify the request.',
    ],
    skills: ['Prioritization', 'Boundaries', 'Accessibility QA', 'Professional communication'],
  },
  {
    id: 'customer-escalation',
    title: 'Customer Escalation',
    role: 'Customer Support Specialist',
    category: 'Problem solving',
    duration: '15 min',
    difficulty: 'Intermediate',
    setup: 'A customer is frustrated because an accessibility bug blocks their workflow.',
    challenge: 'Respond with empathy, gather useful details, and escalate clearly.',
    options: [
      'Acknowledge the impact, ask for steps to reproduce, offer workaround, and escalate with priority.',
      'Tell them the product works for most people.',
      'Ask them to send a long video before offering any help.',
    ],
    skills: ['Empathy', 'Bug triage', 'Accessible support', 'Escalation'],
  },
];

const historyKey = (userId?: string) => `avora-simulation-history-${userId || 'demo'}`;

export default function SimulationPage() {
  const user = useAuthStore((state) => state.user);
  const [activeScenario, setActiveScenario] = React.useState<Scenario>(scenarios[0]);
  const [turns, setTurns] = React.useState<SimulationTurn[]>([]);
  const [customResponse, setCustomResponse] = React.useState('');
  const [history, setHistory] = React.useState<SimulationRecord[]>([]);
  const [isRunning, setIsRunning] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    try {
      const saved = window.localStorage.getItem(historyKey(user?.id));
      setHistory(saved ? JSON.parse(saved) : []);
    } catch {
      setHistory([]);
    }
  }, [user?.id]);

  const persistHistory = (next: SimulationRecord[]) => {
    setHistory(next);
    window.localStorage.setItem(historyKey(user?.id), JSON.stringify(next));
  };

  const startScenario = (scenario: Scenario) => {
    setActiveScenario(scenario);
    setTurns([
      {
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        content: `${scenario.setup}\n\nChallenge: ${scenario.challenge}\n\nChoose an option below or write your own response.`,
        createdAt: new Date().toISOString(),
      },
    ]);
    setCustomResponse('');
    setError(null);
  };

  const askSimulationAgent = async (choice: string) => {
    setIsRunning(true);
    setError(null);
    const userTurn: SimulationTurn = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: choice,
      createdAt: new Date().toISOString(),
    };
    setTurns((previous) => [...previous, userTurn]);

    try {
      const response = await post<{ response: string }>('/api/ai/chat', {
        message: `Evaluate this simulation choice and continue the scenario. Scenario: ${activeScenario.title}. Role: ${activeScenario.role}. Setup: ${activeScenario.setup}. Challenge: ${activeScenario.challenge}. User choice: ${choice}. Give specific feedback, risks, a better script if needed, and one next practice step.`,
        context: {
          agentId: 'simulation',
          routePath: '/simulation',
          moduleTitle: 'Simulation',
          moduleScope: 'Realistic workplace scenarios, decision practice, and feedback',
          moduleContext: {
            scenario: activeScenario,
            userProfile: {
              targetRoles: user?.careerProfile?.targetRoles,
              skills: user?.careerProfile?.skills?.map((skill) => skill.name),
              accessNeeds: user?.disabilityProfile,
            },
            previousTurns: turns.slice(-6),
          },
        },
      });

      const assistantTurn: SimulationTurn = {
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        content: response.response,
        createdAt: new Date().toISOString(),
      };
      setTurns((previous) => [...previous, assistantTurn]);
      persistHistory([
        {
          id: `record_${Date.now()}`,
          scenarioTitle: activeScenario.title,
          completedAt: new Date().toISOString(),
          takeaway: response.response.slice(0, 220),
        },
        ...history,
      ]);
      setCustomResponse('');
    } catch (err) {
      const apiError = handleApiError(err);
      setError(apiError.message || apiError.error);
    } finally {
      setIsRunning(false);
    }
  };

  const completedCount = history.length;
  const coveredSkills = new Set(history.flatMap((record) => {
    const scenario = scenarios.find((item) => item.title === record.scenarioTitle);
    return scenario?.skills || [];
  })).size;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="heading-2 mb-2">Simulation Agent</h1>
        <p className="text-gray-600">
          Practice realistic workplace decisions and get AI feedback on what to say, what to avoid, and what to improve.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-100 text-primary-700">
                <Play className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{completedCount}</p>
                <p className="text-sm text-gray-500">Scenarios practiced</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-success-100 text-success-700">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{coveredSkills}</p>
                <p className="text-sm text-gray-500">Skills touched</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-warning-100 text-warning-700">
                <Star className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{activeScenario.difficulty}</p>
                <p className="text-sm text-gray-500">Current difficulty</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-900">Choose a simulation</h2>
            <span className="rounded-full bg-primary-50 px-3 py-1 text-sm font-semibold text-primary-700">
              {scenarios.length} available
            </span>
          </div>

          {scenarios.map((scenario) => (
            <button key={scenario.id} type="button" onClick={() => startScenario(scenario)} className="w-full text-left">
              <Card className={`transition hover:shadow-lg ${activeScenario.id === scenario.id ? 'ring-2 ring-primary-500' : ''}`}>
                <CardContent>
                  <div className="flex gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gray-100 text-primary-700">
                      {scenario.category === 'Technology' ? <Briefcase className="h-6 w-6" /> : scenario.category === 'Communication' ? <Users className="h-6 w-6" /> : <Building className="h-6 w-6" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{scenario.title}</h3>
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{scenario.difficulty}</span>
                      </div>
                      <p className="mt-1 text-sm text-gray-600">{scenario.role}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {scenario.duration}
                        </span>
                        <span>{scenario.skills.slice(0, 3).join(', ')}</span>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
            </button>
          ))}
        </div>

        <Card className="min-h-[640px]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary-600" />
              {activeScenario.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {turns.length === 0 ? (
              <div className="rounded-2xl bg-primary-50 p-6">
                <h3 className="text-lg font-semibold text-primary-900">{activeScenario.role}</h3>
                <p className="mt-2 text-primary-800">{activeScenario.setup}</p>
                <p className="mt-3 font-medium text-primary-900">{activeScenario.challenge}</p>
                <Button className="mt-5" onClick={() => startScenario(activeScenario)} leftIcon={<Play className="h-4 w-4" />}>
                  Start simulation
                </Button>
              </div>
            ) : (
              <div className="max-h-[360px] space-y-3 overflow-y-auto rounded-2xl bg-gray-50 p-4">
                {turns.map((turn) => (
                  <div key={turn.id} className={`flex ${turn.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[86%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-6 ${
                        turn.role === 'user' ? 'bg-primary-600 text-white' : 'bg-white text-gray-800 shadow-sm'
                      }`}
                    >
                      {turn.content}
                    </div>
                  </div>
                ))}
                {isRunning && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Simulation Agent is evaluating...
                  </div>
                )}
              </div>
            )}

            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900">Choose a response</h3>
              {activeScenario.options.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => askSimulationAgent(option)}
                  disabled={isRunning}
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-left text-sm text-gray-700 transition hover:border-primary-300 hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {option}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <label className="label">Or write your own response</label>
              <textarea
                className="input min-h-[120px] resize-none"
                value={customResponse}
                onChange={(event) => setCustomResponse(event.target.value)}
                placeholder="Type what you would say or do in this situation..."
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => askSimulationAgent(customResponse)}
                  disabled={!customResponse.trim()}
                  isLoading={isRunning}
                  leftIcon={<MessageSquareText className="h-4 w-4" />}
                >
                  Submit custom response
                </Button>
                <Button variant="outline" onClick={() => startScenario(activeScenario)} leftIcon={<RotateCcw className="h-4 w-4" />}>
                  Restart
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Practice History</CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="rounded-2xl bg-gray-50 p-5 text-center text-gray-500">
              Completed simulation feedback will appear here.
            </p>
          ) : (
            <div className="space-y-3">
              {history.slice(0, 5).map((record) => (
                <article key={record.id} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-semibold text-gray-900">{record.scenarioTitle}</h3>
                    <span className="text-xs text-gray-500">{new Date(record.completedAt).toLocaleString()}</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-gray-600">{record.takeaway}</p>
                </article>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
