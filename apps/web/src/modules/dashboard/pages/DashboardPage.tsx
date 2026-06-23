import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ArrowRight,
  Briefcase,
  CalendarDays,
  Loader2,
  Mic,
  Route,
  ShieldCheck,
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
  MilestoneStepper,
  ProgressRing,
  SectionCard,
  SkillRadar,
  type MilestoneStep,
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

  // ---- Step progress ---------------------------------------------------------
  const stepDone = {
    profile: profileCompletion >= 60,
    assessment: completedAssessments > 0,
    jobs: snapshot.savedJobs.length > 0,
    interview: completedInterviews > 0,
  };
  const stepOrder: Array<keyof typeof stepDone> = ['profile', 'assessment', 'jobs', 'interview'];
  const firstPending = stepOrder.findIndex((k) => !stepDone[k]);
  const milestoneSteps: MilestoneStep[] = stepOrder.map((key, index) => ({
    label: t(`dashboard.step.${key}`),
    status: stepDone[key]
      ? 'done'
      : index === (firstPending === -1 ? stepOrder.length : firstPending)
        ? 'current'
        : 'locked',
  }));
  const doneCount = stepOrder.filter((k) => stepDone[k]).length;

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

  // ---- Career matches --------------------------------------------------------
  const careerMatches = React.useMemo(() => {
    const roles = targetRoles.length ? targetRoles : snapshot.savedJobs.map((j) => j.basic.title);
    const base = Math.min(95, 72 + Math.round(readiness * 0.23));
    return roles.slice(0, 3).map((role, i) => ({ role, percent: Math.max(45, base - i * 4) }));
  }, [targetRoles, snapshot.savedJobs, readiness]);

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
    return [...byName.values()].sort((a, b) => IMPORTANCE_ORDER[a.importance] - IMPORTANCE_ORDER[b.importance]).slice(0, 6);
  }, [snapshot.roadmaps]);

  const importanceLabel = (imp: GapSkill['importance']) =>
    imp === 'critical'
      ? t('dashboard.skills.important')
      : imp === 'important'
        ? t('dashboard.skills.somewhatImportant')
        : t('dashboard.skills.niceToHave');
  const importanceTone = (imp: GapSkill['importance']) =>
    imp === 'critical'
      ? 'bg-red-50 text-red-700 border-red-200'
      : imp === 'important'
        ? 'bg-amber-50 text-amber-700 border-amber-200'
        : 'bg-stone-100 text-stone-600 border-stone-200';

  // ---- Learning path ---------------------------------------------------------
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
    return items;
  }, [t, profileCompletion, snapshot.savedJobs.length, snapshot.roadmaps.length, completedAssessments, completedInterviews]);

  // ---- Weekly activity (derived ramp) ----------------------------------------
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

  const leaderboard = [
    ...SAMPLE_LEADERBOARD,
    { rank: 4, name: firstName, level: 4, xp: 1240, isCurrentUser: true },
  ];

  // Quick-start checklist shown when there are no AI career matches yet,
  // so the suggestions card is useful (and not empty) for new users.
  const quickStart = [
    { key: 'completeProfile', to: '/profile', icon: UserRoundCheck, done: stepDone.profile },
    { key: 'completeAssessment', to: '/assessment', icon: Sparkles, done: stepDone.assessment },
    { key: 'saveJob', to: '/jobs', icon: Briefcase, done: stepDone.jobs },
    { key: 'practiceInterview', to: '/interviews', icon: Mic, done: stepDone.interview },
  ]
    .filter((s) => !s.done)
    .slice(0, 3);

  return (
    <div className="mx-auto max-w-[1180px] space-y-5 text-stone-950">
      {/* Hero */}
      <SectionCard>
        <p className="text-sm font-bold text-stone-400">{t('dashboard.report')}</p>
        <div className="mt-1 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <h1 className="text-3xl font-bold leading-tight text-stone-950 sm:text-4xl">
              {t('dashboard.greeting', { name: firstName })}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-2">
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
            <p className="mt-2 text-sm font-medium text-stone-500">{t('dashboard.updatedFrom')}</p>
          </div>
          <ProgressRing percent={readiness} label={t('dashboard.metric.ready')} size={104} />
        </div>

        <div className="mt-6">
          <MilestoneStepper
            steps={milestoneSteps}
            caption={t('dashboard.stepProgress', { done: doneCount, total: stepOrder.length })}
          />
        </div>

        {error && (
          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
            {t('dashboard.syncError', { error })}
          </div>
        )}
      </SectionCard>

      {/* Primary CTA */}
      <div className="interactive-card flex flex-col gap-4 rounded-[24px] bg-stone-950 p-5 text-white transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:shadow-stone-900/25 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/60">{t('dashboard.primaryCta.eyebrow')}</p>
          <h2 className="mt-1.5 text-lg font-bold leading-tight">{ctaTitle}</h2>
          <p className="mt-1 text-sm font-medium text-white/70">{ctaDesc}</p>
        </div>
        <Link
          to={primaryCta.to}
          className="interactive-button group inline-flex h-11 shrink-0 items-center justify-center rounded-full bg-white px-5 text-sm font-bold text-stone-950 hover:bg-stone-100"
        >
          {t('dashboard.primaryCta.start')}
          <ArrowRight className="interactive-icon ml-2 h-4 w-4 group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* Metrics */}
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

      {/* Career snapshot — 3 cards */}
      <SectionCard title={t('dashboard.match.title')}>
        <div className="grid gap-3 sm:grid-cols-3">
          <Link
            to="/jobs"
            className="focus-ring rounded-[20px] border border-stone-200 bg-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-md hover:shadow-sky-950/5"
          >
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-stone-400">{t('dashboard.rightRail.topMatch')}</p>
              <Target className="h-4 w-4 text-primary-500" />
            </div>
            <p className="mt-2 truncate text-lg font-bold text-stone-950">{topRole || t('dashboard.rightRail.pickRole')}</p>
            <p className="mt-1 text-xs font-medium text-stone-500">{t('dashboard.rightRail.fromProfile')}</p>
          </Link>
          <Link
            to="/roadmaps"
            className="focus-ring rounded-[20px] bg-stone-950 p-4 text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-amber-300/15"
          >
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-stone-400">{t('dashboard.rightRail.bestPath')}</p>
              <Sparkles className="h-4 w-4 text-amber-300" />
            </div>
            <p className="mt-2 truncate text-lg font-bold">{bestPath?.title || topRole || 'Frontend Developer'}</p>
            <p className="mt-1 text-xs font-medium text-stone-300">{t('dashboard.path.matchPercent', { percent: pathMatch })}</p>
          </Link>
          <Link
            to="/profile"
            className="focus-ring rounded-[20px] border border-stone-200 bg-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-md hover:shadow-sky-950/5"
          >
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-stone-400">{t('dashboard.rightRail.accessFit')}</p>
              <ShieldCheck className="h-4 w-4 text-primary-500" />
            </div>
            <p className="mt-2 text-lg font-bold text-stone-950">
              {user?.disabilityProfile?.primaryType ? t('dashboard.rightRail.profiled') : t('dashboard.rightRail.needsSetup')}
            </p>
            <p className="mt-1 text-xs font-medium text-stone-500">{t('dashboard.rightRail.addInProfile')}</p>
          </Link>
        </div>
      </SectionCard>

      {/* Two-column area — balanced, neither crammed nor endlessly long */}
      <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
      {/* AI insights */}
      <SectionCard eyebrow={t('dashboard.careerMatches.eyebrow')} title={t('dashboard.careerMatches.title')}>
        {careerMatches.length ? (
          <>
            <ul className="space-y-2.5">
              {careerMatches.map((match, i) => (
                <li key={match.role} className="flex items-center gap-3 rounded-[16px] bg-stone-50 px-4 py-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-bold text-stone-900">{match.role}</span>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
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
          <>
            <p className="text-sm leading-relaxed text-stone-600">{insight.text || t('dashboard.insights.fallback')}</p>
            {quickStart.length > 0 && (
              <>
                <p className="mb-2 mt-4 text-xs font-bold uppercase tracking-[0.12em] text-stone-400">
                  {t('dashboard.insights.quickStart')}
                </p>
                <ul className="space-y-2">
                  {quickStart.map((item) => {
                    const Icon = item.icon;
                    return (
                      <li key={item.key}>
                        <Link
                          to={item.to}
                          className="interactive-card focus-ring group flex items-center gap-3 rounded-[14px] border border-stone-100 bg-stone-50 px-4 py-3 hover:border-primary-200 hover:bg-primary-50"
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-primary-600 shadow-sm">
                            <Icon className="h-4 w-4" />
                          </span>
                          <span className="min-w-0 flex-1 truncate text-sm font-bold text-stone-900">
                            {t(`dashboard.primaryCta.${item.key}`)}
                          </span>
                          <ArrowRight className="interactive-icon h-4 w-4 text-stone-400 group-hover:translate-x-0.5 group-hover:text-primary-600" />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </>
        )}
      </SectionCard>

      {/* Skills radar — full width */}
      <SectionCard eyebrow={t('dashboard.skills.title')} title={t('dashboard.radar.title')}>
        {hasRadarData ? (
          <div className="py-2">
            <SkillRadar axes={radarAxes} size={300} />
          </div>
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
      <SectionCard title={t('dashboard.skills.missingTitle')}>
        {missingSkills.length ? (
          <>
            <div className="flex flex-wrap gap-2">
              {missingSkills.map((gap) => (
                <span
                  key={gap.name}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold ${importanceTone(gap.importance)}`}
                >
                  {gap.name}
                  <span className="text-[11px] font-bold opacity-70">· {importanceLabel(gap.importance)}</span>
                </span>
              ))}
            </div>
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

      {/* Learning path — full width */}
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

      {/* Weekly activity — full width */}
      <SectionCard eyebrow={t('dashboard.weekly.subtitle')} title={t('dashboard.weekly.title')}>
        <ActivitySparkline points={weeklyPoints} labels={weeklyLabels} height={180} />
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
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

      {/* Leaderboard — full width */}
      <SectionCard
        eyebrow={t('dashboard.leaderboard.eyebrow')}
        title={t('dashboard.leaderboard.title')}
        action={
          <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-bold text-stone-500">
            <Trophy className="h-3 w-3" />
            {t('dashboard.leaderboard.sample')}
          </span>
        }
      >
        <Leaderboard entries={leaderboard} />
      </SectionCard>

      {/* Notifications */}
      <SectionCard title={t('dashboard.notifications.title')}>
        {notifications.length ? (
          <ul className="space-y-2">
            {notifications.map((note) => (
              <li
                key={note}
                className="flex items-start gap-3 rounded-[16px] border border-stone-100 bg-stone-50 px-4 py-3 text-sm font-medium text-stone-700"
              >
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary-500" />
                {note}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm font-medium text-stone-500">{t('dashboard.notifications.empty')}</p>
        )}
      </SectionCard>

      {/* Next review */}
      <SectionCard>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-700">
              <CalendarDays className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-stone-400">{t('dashboard.rightRail.nextReview')}</p>
              <h2 className="mt-0.5 text-lg font-bold text-stone-950">{t('dashboard.rightRail.review')}</h2>
              <p className="mt-1 text-sm text-stone-500">{t('dashboard.rightRail.startDiscovery')}</p>
            </div>
          </div>
          <Link
            to="/assessment"
            className="interactive-button inline-flex h-11 items-center justify-center rounded-full bg-primary-500 px-5 text-sm font-bold text-white hover:bg-primary-600"
          >
            {t('dashboard.primaryCta.start')}
          </Link>
        </div>
      </SectionCard>
      </div>

      {/* Accessibility health */}
      <section className="interactive-card rounded-[28px] border border-primary-100 bg-primary-50 p-5 shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-md hover:shadow-sky-950/5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-primary-600 shadow-sm">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-stone-950">{t('dashboard.accessibilityHealth.title')}</h2>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-stone-600">{t('dashboard.accessibilityHealth.desc')}</p>
            </div>
          </div>
          <Link
            to="/settings"
            className="interactive-button inline-flex h-11 items-center justify-center rounded-full bg-white px-5 text-sm font-bold text-stone-950 shadow-sm hover:bg-primary-100 hover:shadow-md"
          >
            {t('dashboard.accessibilityHealth.review')}
          </Link>
        </div>
      </section>
    </div>
  );
}
