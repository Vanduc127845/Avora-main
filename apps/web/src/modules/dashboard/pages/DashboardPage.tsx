import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  Briefcase,
  CalendarDays,
  Check,
  ChevronDown,
  FileText,
  HeartPulse,
  LineChart,
  Loader2,
  Map,
  MessageCircle,
  Mic,
  MoreHorizontal,
  PanelTop,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Target,
  UserRoundCheck,
} from 'lucide-react';
import { useAuthStore } from '../../../store';
import { dashboardService, handleApiError } from '../../../services';
import type { Assessment, InterviewSession, Job, Roadmap } from '../../../lib/shared';

const collaborators = [
  { name: 'Avora', image: 'A', tone: 'bg-stone-950 text-white' },
  { name: 'Coach', image: 'C', tone: 'bg-sky-100 text-sky-800' },
  { name: 'You', image: 'Y', tone: 'bg-primary-100 text-primary-800' },
];

const metrics = [
  { label: 'Profile', value: '75%', delta: '+12%', icon: UserRoundCheck, tone: 'border-primary-200 bg-primary-50 text-primary-700' },
  { label: 'Roadmaps', value: '3', delta: '+1', icon: Map, tone: 'border-sky-200 bg-sky-50 text-sky-700' },
  { label: 'Job matches', value: '12', delta: '+5', icon: Briefcase, tone: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
  { label: 'Practice', value: '45%', delta: '+8%', icon: Mic, tone: 'border-amber-200 bg-amber-50 text-amber-700' },
];

const progressTimeline = [
  { label: 'Profile', value: 75, amount: '75%', color: 'bg-primary-500' },
  { label: 'Assessment', value: 100, amount: '100%', color: 'bg-stone-950' },
  { label: 'Jobs', value: 62, amount: '12 saved', color: 'bg-sky-500' },
  { label: 'Interview', value: 45, amount: '1 session', color: 'bg-amber-500' },
];

const platforms = [
  { name: 'Assessment', value: '100%', amount: 'Complete', icon: Sparkles, color: 'text-primary-600', bg: 'bg-primary-50' },
  { name: 'Jobs', value: '62%', amount: '12 roles', icon: Briefcase, color: 'text-sky-600', bg: 'bg-sky-50' },
  { name: 'Roadmaps', value: '58%', amount: '3 plans', icon: Map, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { name: 'Interview', value: '45%', amount: 'Needs work', icon: Mic, color: 'text-amber-600', bg: 'bg-amber-50' },
];

const nextActions = [
  {
    title: 'Complete profile details',
    description: 'Add target roles, access preferences, and work style.',
    path: '/profile',
    status: 'High impact',
    icon: FileText,
  },
  {
    title: 'Start one focused roadmap',
    description: 'Turn a suitable job into a four-week learning plan.',
    path: '/roadmaps',
    status: 'Recommended',
    icon: BookOpenCheck,
  },
  {
    title: 'Practice interview answer',
    description: 'Use AI feedback for one disclosure or STAR response.',
    path: '/interviews',
    status: '20 min',
    icon: MessageCircle,
  },
];

const tableRows = [
  { module: 'Profile', owner: 'You', score: '75%', status: 'Review', trend: '+12%', icon: UserRoundCheck },
  { module: 'Career assessment', owner: 'Avora', score: '100%', status: 'Done', trend: '+24%', icon: Sparkles },
  { module: 'Accessible jobs', owner: 'Avora', score: '62%', status: 'Active', trend: '+5', icon: Briefcase },
  { module: 'Mock interview', owner: 'Coach', score: '45%', status: 'Next', trend: '+8%', icon: Mic },
];

const insights = [
  { label: 'Best match', value: 'Frontend', helper: 'Remote-first roles', icon: Target },
  { label: 'Access fit', value: '82%', helper: 'High compatibility', icon: ShieldCheck },
  { label: 'Next review', value: 'Thu', helper: 'Roadmap check-in', icon: CalendarDays },
];

function AvatarStack() {
  return (
    <div className="flex items-center">
      {collaborators.map((person, index) => (
        <div
          key={person.name}
          className={`flex h-9 w-9 items-center justify-center rounded-full border-2 border-white text-xs font-bold shadow-sm ${person.tone}`}
          style={{ marginLeft: index === 0 ? 0 : -8 }}
          title={person.name}
        >
          {person.image}
        </div>
      ))}
      <Link
        to="/assessment"
        className="-ml-2 flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-white text-stone-500 shadow-sm transition hover:text-stone-950"
        aria-label="Add assessment context"
      >
        <Plus className="h-4 w-4" />
      </Link>
    </div>
  );
}

function ProgressTrack({ items = progressTimeline }: { items?: typeof progressTimeline }) {
  return (
    <div className="rounded-[28px] border border-stone-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-stone-400">Pipeline</p>
          <h2 className="mt-1 text-xl font-bold text-stone-950">Career readiness</h2>
        </div>
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 text-stone-500 transition hover:bg-stone-50 hover:text-stone-950"
          aria-label="Pipeline settings"
        >
          <Settings2 className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.label}>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-semibold text-stone-700">{item.label}</span>
              <span className="font-bold text-stone-950">{item.amount}</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-stone-100">
              <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.value}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WeeklyChart({ bars }: { bars: { label: string; value: number; color: string }[] }) {
  return (
    <div className="flex h-[180px] items-end gap-3 rounded-[24px] bg-stone-50 px-4 pb-4 pt-6">
      {bars.map((bar) => (
        <div key={bar.label} className="flex min-w-0 flex-1 flex-col items-center gap-2">
          <div className="flex h-28 w-full max-w-9 items-end rounded-full bg-white p-1 shadow-inner">
            <div className={`w-full rounded-full ${bar.color}`} style={{ height: `${bar.value}%` }} />
          </div>
          <span className="text-[11px] font-bold text-stone-400">{bar.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const firstName = user?.name?.split(' ')[0] || 'there';
  const [snapshot, setSnapshot] = React.useState<{
    savedJobs: Job[];
    roadmaps: Roadmap[];
    interviews: InterviewSession[];
    assessments: Assessment[];
  }>({
    savedJobs: [],
    roadmaps: [],
    interviews: [],
    assessments: [],
  });
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;

    const loadSnapshot = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const summary = await dashboardService.getSummary();
        if (!mounted) return;
        setSnapshot({
          savedJobs: summary.savedJobs,
          roadmaps: summary.roadmaps,
          interviews: summary.interviews,
          assessments: summary.assessments,
        });
      } catch (err) {
        if (!mounted) return;
        const apiError = handleApiError(err);
        setError(apiError.message || apiError.error);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    loadSnapshot();
    return () => {
      mounted = false;
    };
  }, []);

  const profileCompletion = React.useMemo(() => {
    const checks = [
      Boolean(user?.name),
      Boolean(user?.email),
      Boolean(user?.disabilityProfile?.primaryType),
      Boolean(user?.disabilityProfile?.severity),
      Boolean(user?.careerProfile?.experienceLevel),
      Boolean(user?.careerProfile?.targetRoles?.length),
      Boolean(user?.careerProfile?.skills?.length),
      Boolean(user?.careerProfile?.workPreferences?.remote),
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [user]);

  const completedAssessments = snapshot.assessments.filter((assessment) => assessment.status === 'completed').length;
  const roadmapAverage = snapshot.roadmaps.length
    ? Math.round(snapshot.roadmaps.reduce((sum, roadmap) => sum + roadmap.progress.percentComplete, 0) / snapshot.roadmaps.length)
    : 0;
  const completedInterviews = snapshot.interviews.filter((interview) => interview.status === 'completed').length;
  const interviewAverage = snapshot.interviews.length
    ? Math.round(
        (snapshot.interviews.reduce((sum, interview) => sum + (interview.feedback?.overallScore || 0), 0) /
          snapshot.interviews.length) *
          10
      )
    : 0;
  const readiness = Math.round(
    profileCompletion * 0.25 +
      Math.min(100, completedAssessments * 100) * 0.2 +
      Math.min(100, snapshot.savedJobs.length * 20) * 0.2 +
      roadmapAverage * 0.2 +
      Math.min(100, Math.max(completedInterviews * 25, interviewAverage)) * 0.15
  );

  const liveMetrics = [
    { label: 'Profile', value: `${profileCompletion}%`, delta: user?.careerProfile?.skills?.length ? `${user.careerProfile.skills.length} skills` : 'Add skills', icon: UserRoundCheck, tone: 'border-primary-200 bg-primary-50 text-primary-700' },
    { label: 'Roadmaps', value: String(snapshot.roadmaps.length), delta: `${roadmapAverage}% avg`, icon: Map, tone: 'border-sky-200 bg-sky-50 text-sky-700' },
    { label: 'Saved jobs', value: String(snapshot.savedJobs.length), delta: snapshot.savedJobs.length ? 'Ready' : 'Find roles', icon: Briefcase, tone: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
    { label: 'Practice', value: `${completedInterviews}/${snapshot.interviews.length}`, delta: interviewAverage ? `${interviewAverage}% score` : 'Start', icon: Mic, tone: 'border-amber-200 bg-amber-50 text-amber-700' },
  ];

  const liveProgressTimeline = [
    { label: 'Profile', value: profileCompletion, amount: `${profileCompletion}%`, color: 'bg-primary-500' },
    { label: 'Assessment', value: completedAssessments ? 100 : 0, amount: completedAssessments ? 'Complete' : 'Start', color: 'bg-stone-950' },
    { label: 'Jobs', value: Math.min(100, snapshot.savedJobs.length * 20), amount: `${snapshot.savedJobs.length} saved`, color: 'bg-sky-500' },
    { label: 'Interview', value: Math.min(100, Math.max(completedInterviews * 25, interviewAverage)), amount: `${snapshot.interviews.length} sessions`, color: 'bg-amber-500' },
  ];
  const readinessBars = liveProgressTimeline.map((item) => ({
    label: item.label,
    value: item.value,
    color: item.color,
  }));

  const livePlatforms = [
    { name: 'Assessment', value: completedAssessments ? '100%' : '0%', amount: completedAssessments ? 'Complete' : 'Needs input', icon: Sparkles, color: 'text-primary-600', bg: 'bg-primary-50' },
    { name: 'Jobs', value: `${Math.min(100, snapshot.savedJobs.length * 20)}%`, amount: `${snapshot.savedJobs.length} saved roles`, icon: Briefcase, color: 'text-sky-600', bg: 'bg-sky-50' },
    { name: 'Roadmaps', value: `${roadmapAverage}%`, amount: `${snapshot.roadmaps.length} plans`, icon: Map, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { name: 'Interview', value: `${Math.min(100, Math.max(completedInterviews * 25, interviewAverage))}%`, amount: `${snapshot.interviews.length} sessions`, icon: Mic, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  const liveTableRows = [
    { module: 'Profile', owner: 'You', score: `${profileCompletion}%`, status: profileCompletion >= 80 ? 'Ready' : 'Review', trend: user?.careerProfile?.targetRoles?.length ? `${user.careerProfile.targetRoles.length} roles` : 'Missing roles', icon: UserRoundCheck },
    { module: 'Career assessment', owner: 'Avora', score: completedAssessments ? '100%' : '0%', status: completedAssessments ? 'Done' : 'Start', trend: `${snapshot.assessments.length} runs`, icon: Sparkles },
    { module: 'Accessible jobs', owner: 'Jobs Agent', score: `${snapshot.savedJobs.length}`, status: snapshot.savedJobs.length ? 'Active' : 'Find', trend: 'saved', icon: Briefcase },
    { module: 'Mock interview', owner: 'Interview Agent', score: `${snapshot.interviews.length}`, status: completedInterviews ? 'Review' : 'Next', trend: `${completedInterviews} done`, icon: Mic },
  ];

  const liveInsights = [
    { label: 'Best match', value: user?.careerProfile?.targetRoles?.[0] || snapshot.savedJobs[0]?.basic.title || 'Not set', helper: 'From profile and saved jobs', icon: Target },
    { label: 'Access fit', value: user?.disabilityProfile?.primaryType ? 'Profiled' : 'Needs setup', helper: 'Add access needs in Profile', icon: ShieldCheck },
    { label: 'Next review', value: snapshot.roadmaps[0] ? 'Roadmap' : 'Assessment', helper: snapshot.roadmaps[0]?.title || 'Start discovery', icon: CalendarDays },
  ];

  return (
    <div className="space-y-5 text-stone-950">
      <section className="overflow-hidden rounded-[32px] border border-stone-200 bg-white p-4 shadow-sm md:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <AvatarStack />
            <div className="flex h-10 min-w-0 items-center gap-2 rounded-full border border-stone-200 bg-stone-50 px-3 text-sm font-semibold text-stone-600">
              <Search className="h-4 w-4 text-stone-400" />
              <span className="truncate">Search insights, jobs, roadmaps</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="inline-flex h-10 items-center gap-2 rounded-full border border-stone-200 bg-white px-4 text-sm font-bold text-stone-700 transition hover:bg-stone-50"
            >
              <Settings2 className="h-4 w-4" />
              Filters
            </button>
            <button
              type="button"
              className="inline-flex h-10 items-center gap-2 rounded-full bg-stone-950 px-4 text-sm font-bold text-white transition hover:bg-stone-800"
            >
              May 2026
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-7 grid gap-5 xl:grid-cols-[1fr_470px]">
          <div className="min-w-0">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-bold text-stone-400">Avora career report</p>
                <h1 className="mt-1 max-w-2xl text-4xl font-bold leading-none text-stone-950 sm:text-5xl">
                  Welcome back, {firstName}
                </h1>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="text-3xl font-bold tracking-normal text-stone-950">{readiness}% ready</span>
                  {isLoading ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary-100 px-2.5 py-1 text-xs font-bold text-primary-700">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Syncing
                    </span>
                  ) : (
                    <span className="rounded-full bg-primary-500 px-2.5 py-1 text-xs font-bold text-white">Live data</span>
                  )}
                  <span className="rounded-full bg-primary-100 px-2.5 py-1 text-xs font-bold text-primary-700">
                    Accessibility-informed
                  </span>
                </div>
                <p className="mt-2 text-sm font-medium text-stone-500">
                  Updated from your current profile, jobs, roadmaps, and interview practice.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  to="/assessment"
                  className="inline-flex h-11 items-center rounded-full bg-primary-500 px-5 text-sm font-bold text-white shadow-sm shadow-primary-500/20 transition hover:bg-primary-600"
                >
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
                <button
                  type="button"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-stone-200 text-stone-500 transition hover:bg-stone-50 hover:text-stone-950"
                  aria-label="More dashboard actions"
                >
                  <MoreHorizontal className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-4">
              {liveMetrics.map((metric) => {
                const Icon = metric.icon;
                return (
                  <article key={metric.label} className={`rounded-[24px] border p-4 ${metric.tone}`}>
                    <div className="flex items-center justify-between gap-3">
                      <Icon className="h-5 w-5" />
                      <span className="rounded-full bg-white/70 px-2 py-0.5 text-xs font-bold">{metric.delta}</span>
                    </div>
                    <p className="mt-5 text-2xl font-bold text-stone-950">{metric.value}</p>
                    <p className="mt-1 text-sm font-semibold">{metric.label}</p>
                  </article>
                );
              })}
            </div>

            {error && (
              <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                Some dashboard data could not sync: {error}
              </div>
            )}

            <div className="mt-5 rounded-[28px] border border-stone-200 bg-stone-50 p-3">
              <div className="flex flex-col gap-3 rounded-[22px] bg-white p-4 shadow-sm lg:flex-row lg:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-700">
                    <BarChart3 className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3 text-sm font-bold text-stone-950">
                      <span>4 modules</span>
                      <span>{snapshot.savedJobs.length} saved jobs</span>
                      <span>{snapshot.roadmaps.length} plans</span>
                      <span>{snapshot.interviews.length} practice</span>
                    </div>
                    <div className="mt-2 grid h-2 overflow-hidden rounded-full bg-stone-100 grid-cols-[40fr_30fr_22fr_8fr]">
                      <div className="bg-primary-500" />
                      <div className="bg-sky-500" />
                      <div className="bg-amber-400" />
                      <div className="bg-stone-950" />
                    </div>
                  </div>
                </div>
                <Link
                  to="/jobs"
                  className="inline-flex h-10 shrink-0 items-center justify-center rounded-full bg-stone-950 px-5 text-sm font-bold text-white transition hover:bg-stone-800"
                >
                  Details
                </Link>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-2">
            <article className="rounded-[24px] border border-stone-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-stone-400">Top match</p>
              <p className="mt-3 text-3xl font-bold text-stone-950">{readiness}</p>
              <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-stone-500">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-100 text-xs text-sky-700">A</span>
                {user?.careerProfile?.targetRoles?.[0] || snapshot.savedJobs[0]?.basic.title || 'Pick a role'}
              </div>
            </article>

            <article className="rounded-[24px] bg-stone-950 p-4 text-white shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-stone-400">Best path</p>
                <Sparkles className="h-4 w-4 text-amber-300" />
              </div>
              <p className="mt-3 text-2xl font-bold">{user?.careerProfile?.targetRoles?.[0] || 'Assessment'}</p>
              <p className="mt-1 text-sm font-medium text-stone-300">
                {snapshot.roadmaps[0]?.title || 'Start a focused pathway'}
              </p>
            </article>

            {liveInsights.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.label} className="rounded-[24px] border border-stone-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-stone-400">{item.label}</p>
                    <Icon className="h-4 w-4 text-primary-500" />
                  </div>
                  <p className="mt-4 text-2xl font-bold text-stone-950">{item.value}</p>
                  <p className="mt-1 text-sm font-medium text-stone-500">{item.helper}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr] xl:grid-cols-1 2xl:grid-cols-[0.85fr_1.15fr]">
          <div className="rounded-[28px] border border-stone-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-stone-400">Channels</p>
                <h2 className="mt-1 text-xl font-bold text-stone-950">Work with modules</h2>
              </div>
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 text-stone-500 hover:bg-stone-50"
                aria-label="Module filters"
              >
                <PanelTop className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              {livePlatforms.map((platform) => {
                const Icon = platform.icon;
                return (
                  <Link
                    key={platform.name}
                    to={
                      platform.name === 'Assessment'
                        ? '/assessment'
                        : platform.name === 'Jobs'
                          ? '/jobs'
                          : platform.name === 'Roadmaps'
                            ? '/roadmaps'
                            : '/interviews'
                    }
                    className="flex items-center justify-between gap-3 rounded-[20px] border border-stone-100 bg-stone-50 p-3 transition hover:border-primary-200 hover:bg-primary-50"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className={`flex h-10 w-10 items-center justify-center rounded-full ${platform.bg} ${platform.color}`}>
                        <Icon className="h-5 w-5" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-stone-950">{platform.name}</p>
                        <p className="text-xs font-semibold text-stone-400">{platform.amount}</p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-stone-950">{platform.value}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="rounded-[28px] border border-stone-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-stone-400">Live mix</p>
                <h2 className="mt-1 text-xl font-bold text-stone-950">Readiness momentum</h2>
              </div>
              <div className="inline-flex rounded-full bg-stone-100 p-1">
                <span className="rounded-full bg-stone-950 px-3 py-1 text-xs font-bold text-white">Now</span>
                <span className="px-3 py-1 text-xs font-bold text-stone-500">Goals</span>
              </div>
            </div>

            <WeeklyChart bars={readinessBars} />
          </div>
        </div>

        <div className="rounded-[28px] border border-stone-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-stone-400">Avora modules</p>
              <h2 className="mt-1 text-xl font-bold text-stone-950">Module performance</h2>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" className="rounded-full bg-stone-100 px-3 py-1.5 text-xs font-bold text-stone-700">
                Readiness
              </button>
              <button type="button" className="rounded-full px-3 py-1.5 text-xs font-bold text-stone-400">
                Fit
              </button>
              <button type="button" className="rounded-full px-3 py-1.5 text-xs font-bold text-stone-400">
                Next
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] border-separate border-spacing-y-2 text-left">
              <thead>
                <tr className="text-xs font-bold uppercase tracking-[0.12em] text-stone-400">
                  <th className="px-3 py-2">Module</th>
                  <th className="px-3 py-2">Owner</th>
                  <th className="px-3 py-2">Score</th>
                  <th className="px-3 py-2">Trend</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {liveTableRows.map((row) => {
                  const Icon = row.icon;
                  return (
                    <tr key={row.module} className="rounded-[18px] bg-stone-50 text-sm">
                      <td className="rounded-l-[18px] px-3 py-3">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-primary-600 shadow-sm">
                            <Icon className="h-4 w-4" />
                          </span>
                          <span className="font-bold text-stone-950">{row.module}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 font-semibold text-stone-500">{row.owner}</td>
                      <td className="px-3 py-3 font-bold text-stone-950">{row.score}</td>
                      <td className="px-3 py-3">
                        <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-emerald-700">{row.trend}</span>
                      </td>
                      <td className="rounded-r-[18px] px-3 py-3">
                        <span className="inline-flex items-center gap-1 rounded-full bg-stone-950 px-3 py-1 text-xs font-bold text-white">
                          <Check className="h-3 w-3" />
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <div className="rounded-[28px] border border-stone-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-stone-400">Recommended work</p>
              <h2 className="mt-1 text-xl font-bold text-stone-950">Priority actions</h2>
            </div>
            <LineChart className="h-5 w-5 text-primary-500" />
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {nextActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.title}
                  to={action.path}
                  className="group min-h-[190px] rounded-[24px] border border-stone-100 bg-stone-50 p-4 transition hover:-translate-y-0.5 hover:border-primary-200 hover:bg-white hover:shadow-lg hover:shadow-primary-950/5"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-primary-600 shadow-sm">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="rounded-full bg-primary-100 px-2.5 py-1 text-xs font-bold text-primary-700">{action.status}</span>
                  </div>
                  <h3 className="mt-5 text-base font-bold text-stone-950">{action.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-stone-500">{action.description}</p>
                  <div className="mt-4 inline-flex items-center text-sm font-bold text-stone-950">
                    Open
                    <ArrowRight className="ml-2 h-4 w-4 transition group-hover:translate-x-1" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <ProgressTrack items={liveProgressTimeline} />
      </section>

      <section className="rounded-[28px] border border-primary-100 bg-primary-50 p-4 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-primary-600 shadow-sm">
              <HeartPulse className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-stone-950">Accessibility health</h2>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-stone-600">
                Your workspace keeps the main career tools visible, readable, and reachable without digging through empty screens.
              </p>
            </div>
          </div>
          <Link
            to="/settings"
            className="inline-flex h-11 items-center justify-center rounded-full bg-white px-5 text-sm font-bold text-stone-950 shadow-sm transition hover:bg-primary-100"
          >
            Review settings
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
