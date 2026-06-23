import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ArrowRight,
  BarChart3,
  Briefcase,
  CalendarDays,
  ChevronDown,
  Loader2,
  Mic,
  Plus,
  Route,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  UserRoundCheck,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../store';
import { dashboardService, handleApiError } from '../../../services';
import type { Assessment, GapSkill, InterviewSession, Job, Roadmap, Skill } from '../../../lib/shared';
import {
  ActivitySparkline,
  EmptyState,
  HorizontalPathStepper,
  Leaderboard,
  ProgressRing,
  SectionCard,
  SkillRadar,
  type PathStep,
  type RadarAxis,
} from '../components';
import { useDashboardInsight } from '../hooks/useDashboardInsight';
import { SAMPLE_LEADERBOARD, SAMPLE_PATH_STEPS } from '../sampleData';

type Snapshot = {
  savedJobs: Job[];
  roadmaps: Roadmap[];
  interviews: InterviewSession[];
  assessments: Assessment[];
};

const IMPORTANCE_ORDER: Record<GapSkill['importance'], number> = {
  critical: 0,
  important: 1,
  'nice-to-have': 2,
};
const LEVEL_PERCENT: Record<Skill['level'], number> = {
  beginner: 25,
  intermediate: 50,
  advanced: 75,
  expert: 100,
};

function AvatarStack() {
  const people = [
    { id: 'A', tone: 'bg-stone-950 text-white' },
    { id: 'C', tone: 'bg-sky-100 text-sky-800' },
    { id: 'Y', tone: 'bg-primary-100 text-primary-800' },
  ];
  return (
    <div className="flex items-center">
      {people.map((p, i) => (
        <span
          key={p.id}
          className={`flex h-9 w-9 items-center justify-center rounded-full border-2 border-white text-xs font-bold shadow-sm ${p.tone}`}
          style={{ marginLeft: i === 0 ? 0 : -8 }}
        >
          {p.id}
        </span>
      ))}
      <Link
        to="/assessment"
        className="interactive-button -ml-2 flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-white text-stone-500 shadow-sm hover:text-stone-950"
        aria-label="Add context"
      >
        <Plus className="h-4 w-4" />
      </Link>
    </div>
  );
}

export default function DashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const firstName = user?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'bạn';

  const [snapshot, setSnapshot] = React.useState<Snapshot>({
    savedJobs: [],
    roadmaps: [],
    interviews: [],
    assessments: [],
  });
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
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
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // ---- Derived metrics (real data) -------------------------------------------
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

  const skills: Skill[] = user?.careerProfile?.skills || [];
  const targetRoles = user?.careerProfile?.targetRoles || [];
  const completedAssessments = snapshot.assessments.filter((a) => a.status === 'completed').length;
  const completedInterviews = snapshot.interviews.filter((i) => i.status === 'completed').length;
  const roadmapAverage = snapshot.roadmaps.length
    ? Math.round(snapshot.roadmaps.reduce((s, r) => s + r.progress.percentComplete, 0) / snapshot.roadmaps.length)
    : 0;
  const interviewAverage = snapshot.interviews.length
    ? Math.round(
        (snapshot.interviews.reduce((s, i) => s + (i.feedback?.overallScore || 0), 0) / snapshot.interviews.length) * 10
      )
    : 0;
  const skillsAvg = skills.length
    ? Math.round(skills.reduce((s, k) => s + (LEVEL_PERCENT[k.level] ?? 25), 0) / skills.length)
    : 0;
  const jobsScore = Math.min(100, snapshot.savedJobs.length * 20);
  const interviewScore = Math.min(100, Math.max(completedInterviews * 25, interviewAverage));
  const readiness = Math.round(
    profileCompletion * 0.25 +
      Math.min(100, completedAssessments * 100) * 0.2 +
      jobsScore * 0.2 +
      roadmapAverage * 0.2 +
      interviewScore * 0.15
  );

  // ---- Primary CTA -----------------------------------------------------------
  const primaryCta = React.useMemo(() => {
    if (profileCompletion < 60) return { key: 'completeProfile', to: '/profile', minutes: 5 };
    if (completedAssessments === 0) return { key: 'completeAssessment', to: '/assessment', minutes: 5 };
    if (snapshot.savedJobs.length === 0) return { key: 'saveJob', to: '/jobs', minutes: 0 };
    if (snapshot.roadmaps.length === 0) return { key: 'createRoadmap', to: '/roadmaps', minutes: 0 };
    if (completedInterviews === 0) return { key: 'practiceInterview', to: '/interviews', minutes: 20 };
    return { key: 'allDone', to: '/roadmaps', minutes: 0 };
  }, [profileCompletion, completedAssessments, completedInterviews, snapshot.savedJobs.length, snapshot.roadmaps.length]);

  const ctaTitle = t(`dashboard.primaryCta.${primaryCta.key}`);
  const ctaDesc =
    primaryCta.minutes > 0
      ? `${t(`dashboard.primaryCta.${primaryCta.key}Desc`)} (${t('dashboard.primaryCta.minutes', { count: primaryCta.minutes })})`
      : t(`dashboard.primaryCta.${primaryCta.key}Desc`);

  // ---- Career matches (AI insights list) -------------------------------------
  const careerMatches = React.useMemo(() => {
    const roles = targetRoles.length ? targetRoles : snapshot.savedJobs.map((j) => j.basic.title);
    const base = Math.min(95, 72 + Math.round(readiness * 0.23));
    return roles.slice(0, 3).map((role, i) => ({ role, percent: Math.max(45, base - i * 4) }));
  }, [targetRoles, snapshot.savedJobs, readiness]);

  // ---- AI insight (real, used as fallback when no target roles) ---------------
  const topRole = targetRoles[0] || snapshot.savedJobs[0]?.basic.title || '';
  const insight = useDashboardInsight({
    ready: (profileCompletion >= 40 || skills.length > 0) && !isLoading && careerMatches.length === 0,
    targetRole: topRole,
    skills: skills.map((s) => s.name),
    savedJobs: snapshot.savedJobs.length,
    roadmaps: snapshot.roadmaps.length,
  });

  // ---- Radar (real Avora pillars) --------------------------------------------
  const radarAxes: RadarAxis[] = [
    { label: t('dashboard.radar.profile'), value: profileCompletion },
    { label: t('dashboard.radar.skills'), value: skillsAvg },
    { label: t('dashboard.radar.jobs'), value: jobsScore },
    { label: t('dashboard.radar.roadmap'), value: roadmapAverage },
    { label: t('dashboard.radar.interview'), value: interviewScore },
  ];
  const hasRadarData = radarAxes.some((a) => a.value > 0);

  // ---- Missing skills (real gapSkills) ---------------------------------------
  const missingSkills = React.useMemo(() => {
    const byName = new Map<string, GapSkill>();
    snapshot.roadmaps.forEach((r) =>
      (r.gapSkills || []).forEach((gap) => {
        const existing = byName.get(gap.name);
        if (!existing || IMPORTANCE_ORDER[gap.importance] < IMPORTANCE_ORDER[existing.importance]) {
          byName.set(gap.name, gap);
        }
      })
    );
    return [...byName.values()].sort((a, b) => IMPORTANCE_ORDER[a.importance] - IMPORTANCE_ORDER[b.importance]).slice(0, 5);
  }, [snapshot.roadmaps]);

  const importanceLabel = (imp: GapSkill['importance']) =>
    imp === 'critical'
      ? t('dashboard.skills.important')
      : imp === 'important'
        ? t('dashboard.skills.somewhatImportant')
        : t('dashboard.skills.niceToHave');
  const importanceTone = (imp: GapSkill['importance']) =>
    imp === 'critical' ? 'text-red-600' : imp === 'important' ? 'text-amber-600' : 'text-stone-400';

  // ---- Learning path (real phases, else sample) ------------------------------
  const bestPath = snapshot.roadmaps[0];
  const pathSteps: PathStep[] = React.useMemo(() => {
    if (bestPath?.phases?.length) {
      const phases = [...bestPath.phases].sort((a, b) => a.order - b.order);
      const currentIndex = Math.max(0, (bestPath.progress.currentPhase || 1) - 1);
      const allDone = bestPath.progress.percentComplete >= 100;
      return phases.map((phase, i) => ({
        name: phase.name,
        status: allDone || i < currentIndex ? 'done' : i === currentIndex ? 'current' : 'locked',
      }));
    }
    // Sample path so the section matches the design for new users.
    return SAMPLE_PATH_STEPS.map((name, i) => ({
      name,
      status: i < 2 ? 'done' : i === 2 ? 'current' : 'locked',
    }));
  }, [bestPath]);
  const pathMatch = bestPath ? bestPath.progress.percentComplete : 92;

  // ---- Notifications (rule-based) --------------------------------------------
  const notifications = React.useMemo(() => {
    const items: string[] = [];
    if (profileCompletion < 100)
      items.push(t('dashboard.notifications.profileIncomplete', { percent: profileCompletion }));
    if (snapshot.savedJobs.length > 0 && snapshot.roadmaps.length === 0)
      items.push(t('dashboard.notifications.jobsNoRoadmap', { count: snapshot.savedJobs.length }));
    if (completedAssessments === 0) items.push(t('dashboard.notifications.assessmentPending'));
    if (profileCompletion >= 60 && completedInterviews === 0)
      items.push(t('dashboard.notifications.interviewReady'));
    return items.slice(0, 3);
  }, [t, profileCompletion, snapshot.savedJobs.length, snapshot.roadmaps.length, completedAssessments, completedInterviews]);

  // ---- Weekly activity (derived ramp toward readiness) -----------------------
  const weeklyPoints = React.useMemo(() => {
    const target = Math.max(10, readiness);
    return Array.from({ length: 7 }, (_, i) => {
      const ramp = (target * (i + 1)) / 7;
      const wobble = i % 2 === 0 ? 6 : -4;
      return Math.max(4, Math.min(100, Math.round(ramp + wobble)));
    });
  }, [readiness]);
  const weeklyLabels = React.useMemo(() => {
    const out: string[] = [];
    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      out.push(`${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`);
    }
    return out;
  }, []);

  // ---- Metric cards ----------------------------------------------------------
  const metrics = [
    {
      label: t('dashboard.metric.profile'),
      value: `${profileCompletion}%`,
      delta: skills.length ? t('dashboard.metric.skillsCount', { count: skills.length }) : t('dashboard.metric.addSkills'),
      icon: UserRoundCheck,
      tone: 'border-primary-200 bg-primary-50 text-primary-700',
    },
    {
      label: t('dashboard.metric.roadmaps'),
      value: String(snapshot.roadmaps.length),
      delta: t('dashboard.metric.avg', { percent: roadmapAverage }),
      icon: Route,
      tone: 'border-sky-200 bg-sky-50 text-sky-700',
    },
    {
      label: t('dashboard.metric.savedJobs'),
      value: String(snapshot.savedJobs.length),
      delta: snapshot.savedJobs.length ? t('dashboard.metric.ready') : t('dashboard.metric.findRoles'),
      icon: Briefcase,
      tone: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    },
    {
      label: t('dashboard.metric.practice'),
      value: `${completedInterviews}/${snapshot.interviews.length}`,
      delta: interviewAverage ? t('dashboard.metric.score', { percent: interviewAverage }) : t('dashboard.metric.startShort'),
      icon: Mic,
      tone: 'border-amber-200 bg-amber-50 text-amber-700',
    },
  ];

  const weeklyStats = [
    { label: t('dashboard.weekly.profileDone'), value: `${profileCompletion}%`, icon: UserRoundCheck },
    { label: t('dashboard.weekly.jobsViewed'), value: String(snapshot.savedJobs.length), icon: Briefcase },
    { label: t('dashboard.weekly.practiced'), value: String(completedInterviews), icon: Mic },
    { label: t('dashboard.weekly.interview'), value: String(snapshot.interviews.length), icon: Sparkles },
  ];

  const matchCount = Math.max(snapshot.savedJobs.length, careerMatches.length);
  const leaderboard = [
    ...SAMPLE_LEADERBOARD,
    { rank: 4, name: firstName, level: 4, xp: 1240, isCurrentUser: true },
  ];

  return (
    <div className="space-y-4 text-stone-950">
      {/* Top toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <AvatarStack />
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="interactive-button inline-flex h-10 items-center gap-2 rounded-full border border-stone-200 bg-white px-4 text-sm font-bold text-stone-700 hover:border-sky-200 hover:bg-stone-50"
          >
            <SlidersHorizontal className="h-4 w-4" />
            {t('dashboard.filters')}
          </button>
          <span className="inline-flex h-10 items-center gap-2 rounded-full bg-stone-950 px-4 text-sm font-bold text-white">
            {t('dashboard.period')}
            <ChevronDown className="h-4 w-4" />
          </span>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_330px]">
        {/* ===================== MAIN COLUMN ===================== */}
        <div className="min-w-0 space-y-4">
          {/* Title */}
          <div>
            <p className="text-sm font-bold text-stone-400">{t('dashboard.report')}</p>
            <h1 className="mt-1 text-3xl font-bold leading-tight text-stone-950 sm:text-4xl">
              {t('dashboard.greeting', { name: firstName })}
            </h1>
          </div>

          {/* Hero CTA */}
          <SectionCard className="!p-0">
            <div className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary-600">
                  {t('dashboard.primaryCta.eyebrow')}
                </p>
                <h2 className="mt-2 text-2xl font-bold text-stone-950">{ctaTitle}</h2>
                <p className="mt-1 text-sm font-medium text-stone-500">{ctaDesc}</p>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Link
                    to={primaryCta.to}
                    className="interactive-button group inline-flex h-11 items-center rounded-full bg-primary-500 px-5 text-sm font-bold text-white shadow-sm shadow-primary-500/20 hover:bg-primary-600 hover:shadow-lg hover:shadow-primary-500/25"
                  >
                    {t('dashboard.primaryCta.start')}
                    <ArrowRight className="interactive-icon ml-2 h-4 w-4 group-hover:translate-x-0.5" />
                  </Link>
                  {isLoading ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary-100 px-2.5 py-1 text-xs font-bold text-primary-700">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      {t('dashboard.syncing')}
                    </span>
                  ) : (
                    <span className="rounded-full bg-primary-500 px-2.5 py-1 text-xs font-bold text-white">
                      {t('dashboard.liveData')}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary-100 px-2.5 py-1 text-xs font-bold text-primary-700">
                    <Sparkles className="h-3 w-3" />
                    {t('dashboard.accessibilityInformed')}
                  </span>
                </div>
              </div>
              <ProgressRing percent={readiness} label={t('dashboard.metric.ready')} />
            </div>
          </SectionCard>

          {error && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
              {t('dashboard.syncError', { error })}
            </div>
          )}

          {/* Metric cards */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {metrics.map((metric) => {
              const Icon = metric.icon;
              return (
                <article
                  key={metric.label}
                  className={`interactive-card rounded-[20px] border p-4 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md hover:shadow-sky-950/5 ${metric.tone}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <Icon className="h-5 w-5" />
                    <span className="rounded-full bg-white/70 px-2 py-0.5 text-xs font-bold">{metric.delta}</span>
                  </div>
                  <p className="mt-4 text-2xl font-bold text-stone-950">{metric.value}</p>
                  <p className="mt-1 text-sm font-semibold">{metric.label}</p>
                </article>
              );
            })}
          </div>

          {/* Module strip */}
          <div className="interactive-card flex flex-col gap-3 rounded-[20px] border border-stone-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-700">
                <BarChart3 className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-sm font-bold text-stone-950">
                  <span>{t('dashboard.modulesShort', { count: 4 })}</span>
                  <span>{t('dashboard.savedJobsShort', { count: snapshot.savedJobs.length })}</span>
                  <span>{t('dashboard.plansShort', { count: snapshot.roadmaps.length })}</span>
                  <span>{t('dashboard.practiceShort', { count: snapshot.interviews.length })}</span>
                </div>
                <div className="mt-2 grid h-2 grid-cols-[40fr_30fr_22fr_8fr] overflow-hidden rounded-full bg-stone-100">
                  <div className="bg-primary-500" />
                  <div className="bg-sky-500" />
                  <div className="bg-amber-400" />
                  <div className="bg-stone-950" />
                </div>
              </div>
            </div>
            <Link
              to="/jobs"
              className="interactive-button inline-flex h-10 shrink-0 items-center justify-center rounded-full bg-stone-950 px-5 text-sm font-bold text-white hover:bg-stone-800"
            >
              {t('dashboard.details')}
            </Link>
          </div>

          {/* AI insights + Radar + Missing skills */}
          <div className="grid gap-3 lg:grid-cols-3">
            {/* AI insights */}
            <SectionCard eyebrow={t('dashboard.careerMatches.eyebrow')} title={t('dashboard.careerMatches.title')}>
              {careerMatches.length ? (
                <>
                  <ul className="space-y-2">
                    {careerMatches.map((match, i) => (
                      <li key={match.role} className="flex items-center gap-3">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">
                          {i + 1}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-sm font-bold text-stone-900">{match.role}</span>
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700">
                          {t('dashboard.careerMatches.matchPercent', { percent: match.percent })}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={() => navigate('/jobs')}
                    className="interactive-button mt-4 text-sm font-bold text-primary-700 hover:text-primary-800"
                  >
                    {t('dashboard.careerMatches.viewAll')}
                  </button>
                </>
              ) : insight.loading ? (
                <p className="flex items-center gap-2 text-sm font-medium text-primary-700/80">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('dashboard.insights.loading')}
                </p>
              ) : (
                <p className="text-sm leading-relaxed text-stone-600">
                  {insight.text || t('dashboard.insights.fallback')}
                </p>
              )}
            </SectionCard>

            {/* Radar */}
            <SectionCard eyebrow={t('dashboard.skills.title')} title={t('dashboard.radar.title')}>
              {hasRadarData ? (
                <SkillRadar axes={radarAxes} />
              ) : (
                <EmptyState
                  icon={<TrendingUp className="h-5 w-5" />}
                  title={t('dashboard.radar.title')}
                  description={t('dashboard.skills.empty')}
                  ctaLabel={t('dashboard.skills.addCta')}
                  to="/profile"
                />
              )}
            </SectionCard>

            {/* Missing skills */}
            <SectionCard eyebrow={t('dashboard.skills.missingTitle')} title={t('dashboard.skills.missingTitle')}>
              {missingSkills.length ? (
                <>
                  <ul className="space-y-2.5">
                    {missingSkills.map((gap) => (
                      <li key={gap.name} className="flex items-center justify-between gap-2">
                        <span className="flex min-w-0 items-center gap-2 text-sm font-semibold text-stone-800">
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-stone-300" />
                          <span className="truncate">{gap.name}</span>
                        </span>
                        <span className={`shrink-0 text-xs font-bold ${importanceTone(gap.importance)}`}>
                          {importanceLabel(gap.importance)}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    to="/roadmaps"
                    className="interactive-button mt-4 inline-flex text-sm font-bold text-primary-700 hover:text-primary-800"
                  >
                    {t('dashboard.skills.viewPath')}
                  </Link>
                </>
              ) : (
                <EmptyState
                  icon={<Route className="h-5 w-5" />}
                  title={t('dashboard.skills.missingTitle')}
                  description={t('dashboard.skills.missingEmpty')}
                  ctaLabel={t('dashboard.path.create')}
                  to="/roadmaps"
                />
              )}
            </SectionCard>
          </div>

          {/* Weekly + Suggested path */}
          <div className="grid gap-3 lg:grid-cols-2">
            <SectionCard eyebrow={t('dashboard.weekly.subtitle')} title={t('dashboard.weekly.title')}>
              <ActivitySparkline points={weeklyPoints} labels={weeklyLabels} />
              <div className="mt-4 grid grid-cols-2 gap-2">
                {weeklyStats.map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <div key={stat.label} className="flex items-center gap-2 rounded-[14px] bg-stone-50 px-3 py-2">
                      <Icon className="h-4 w-4 text-primary-600" />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-stone-950">{stat.value}</p>
                        <p className="truncate text-[11px] font-semibold text-stone-400">{stat.label}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </SectionCard>

            <SectionCard
              eyebrow={t('dashboard.pathSuggested.title')}
              title={bestPath?.title || 'Frontend Developer Path'}
              action={
                <span className="rounded-full bg-primary-100 px-3 py-1 text-xs font-bold text-primary-700">
                  {t('dashboard.path.matchPercent', { percent: pathMatch })}
                </span>
              }
            >
              <HorizontalPathStepper steps={pathSteps} />
              <Link
                to="/roadmaps"
                className="interactive-button mt-4 inline-flex text-sm font-bold text-primary-700 hover:text-primary-800"
              >
                {t('dashboard.pathSuggested.viewDetail')} →
              </Link>
            </SectionCard>
          </div>
        </div>

        {/* ===================== RIGHT RAIL ===================== */}
        <aside className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {/* Top match */}
            <article className="interactive-card rounded-[20px] border border-stone-200 bg-white p-4 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-stone-400">
                {t('dashboard.rightRail.topMatch')}
              </p>
              <p className="mt-2 text-3xl font-bold text-stone-950">{matchCount}</p>
              <p className="mt-1 truncate text-sm font-medium text-stone-500">
                {topRole || t('dashboard.rightRail.pickRole')}
              </p>
            </article>

            {/* Best path (dark) */}
            <article className="interactive-card rounded-[20px] bg-stone-950 p-4 text-white shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-stone-400">
                  {t('dashboard.rightRail.bestPath')}
                </p>
                <Sparkles className="h-4 w-4 text-amber-300" />
              </div>
              <p className="mt-2 truncate text-lg font-bold">{bestPath?.title || topRole || 'Frontend Developer'}</p>
              <p className="mt-1 text-xs font-medium text-stone-300">
                {t('dashboard.path.matchPercent', { percent: pathMatch })}
              </p>
            </article>

            {/* Best match */}
            <article className="interactive-card rounded-[20px] border border-stone-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-stone-400">
                  {t('dashboard.rightRail.bestMatch')}
                </p>
                <Target className="h-4 w-4 text-primary-500" />
              </div>
              <p className="mt-2 truncate text-base font-bold text-stone-950">
                {topRole || t('dashboard.rightRail.notSet')}
              </p>
              <p className="mt-1 text-xs font-medium text-stone-500">{t('dashboard.rightRail.fromProfile')}</p>
            </article>

            {/* Access fit */}
            <article className="interactive-card rounded-[20px] border border-stone-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-stone-400">
                  {t('dashboard.rightRail.accessFit')}
                </p>
                <ShieldCheck className="h-4 w-4 text-primary-500" />
              </div>
              <p className="mt-2 text-base font-bold text-stone-950">
                {user?.disabilityProfile?.primaryType
                  ? t('dashboard.rightRail.profiled')
                  : t('dashboard.rightRail.needsSetup')}
              </p>
              <p className="mt-1 text-xs font-medium text-stone-500">{t('dashboard.rightRail.addInProfile')}</p>
            </article>
          </div>

          {/* Next review */}
          <Link
            to="/assessment"
            className="interactive-card focus-ring block rounded-[20px] border border-stone-200 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-sky-200"
          >
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-stone-400">
                {t('dashboard.rightRail.nextReview')}
              </p>
              <CalendarDays className="h-4 w-4 text-primary-500" />
            </div>
            <p className="mt-2 text-base font-bold text-stone-950">{t('dashboard.rightRail.review')}</p>
            <p className="mt-1 text-xs font-medium text-stone-500">{t('dashboard.rightRail.startDiscovery')}</p>
          </Link>

          {/* Smart reminders */}
          <SectionCard title={t('dashboard.notifications.title')} className="!p-4">
            {notifications.length ? (
              <ul className="space-y-2">
                {notifications.map((note) => (
                  <li
                    key={note}
                    className="flex items-start gap-2 rounded-[14px] bg-stone-50 px-3 py-2 text-xs font-medium text-stone-700"
                  >
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary-500" />
                    {note}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs font-medium text-stone-500">{t('dashboard.notifications.empty')}</p>
            )}
          </SectionCard>

          {/* Leaderboard (sample data) */}
          <SectionCard
            eyebrow={t('dashboard.leaderboard.eyebrow')}
            title={t('dashboard.leaderboard.title')}
            className="!p-4"
            action={
              <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-bold text-stone-500">
                <Trophy className="h-3 w-3" />
                {t('dashboard.leaderboard.sample')}
              </span>
            }
          >
            <Leaderboard entries={leaderboard} />
          </SectionCard>
        </aside>
      </div>
    </div>
  );
}
