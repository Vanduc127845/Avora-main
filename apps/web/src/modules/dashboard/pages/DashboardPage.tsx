import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Briefcase,
  HeartPulse,
  Loader2,
  Map as MapIcon,
  Mic,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  UserRoundCheck,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../store';
import { dashboardService, handleApiError } from '../../../services';
import type { Assessment, GapSkill, InterviewSession, Job, Roadmap, Skill } from '../../../lib/shared';
import {
  AiInsight,
  EmptyState,
  LearningPathStepper,
  MilestoneStepper,
  PrimaryCta,
  SectionCard,
  SkillBars,
  type MilestoneStep,
  type PathStep,
} from '../components';
import { useDashboardInsight } from '../hooks/useDashboardInsight';

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
  const completedAssessments = snapshot.assessments.filter((a) => a.status === 'completed').length;
  const completedInterviews = snapshot.interviews.filter((i) => i.status === 'completed').length;
  const roadmapAverage = snapshot.roadmaps.length
    ? Math.round(
        snapshot.roadmaps.reduce((sum, r) => sum + r.progress.percentComplete, 0) / snapshot.roadmaps.length
      )
    : 0;
  const interviewAverage = snapshot.interviews.length
    ? Math.round(
        (snapshot.interviews.reduce((sum, i) => sum + (i.feedback?.overallScore || 0), 0) /
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

  // ---- Step progress ---------------------------------------------------------
  const stepDone = {
    profile: profileCompletion >= 60,
    assessment: completedAssessments > 0,
    jobs: snapshot.savedJobs.length > 0,
    interview: completedInterviews > 0,
  };
  const stepOrder: Array<keyof typeof stepDone> = ['profile', 'assessment', 'jobs', 'interview'];
  const firstPendingIndex = stepOrder.findIndex((key) => !stepDone[key]);
  const milestoneSteps: MilestoneStep[] = stepOrder.map((key, index) => ({
    label: t(`dashboard.step.${key}`),
    status: stepDone[key]
      ? 'done'
      : index === (firstPendingIndex === -1 ? stepOrder.length : firstPendingIndex)
        ? 'current'
        : 'locked',
  }));
  const doneCount = stepOrder.filter((key) => stepDone[key]).length;

  // ---- Primary CTA (first incomplete step) -----------------------------------
  const primaryCta = React.useMemo(() => {
    if (profileCompletion < 60)
      return { key: 'completeProfile', to: '/profile', minutes: 5 };
    if (completedAssessments === 0)
      return { key: 'completeAssessment', to: '/assessment', minutes: 5 };
    if (snapshot.savedJobs.length === 0) return { key: 'saveJob', to: '/jobs', minutes: 0 };
    if (snapshot.roadmaps.length === 0) return { key: 'createRoadmap', to: '/roadmaps', minutes: 0 };
    if (completedInterviews === 0)
      return { key: 'practiceInterview', to: '/interviews', minutes: 20 };
    return { key: 'allDone', to: '/roadmaps', minutes: 0 };
  }, [profileCompletion, completedAssessments, completedInterviews, snapshot.savedJobs.length, snapshot.roadmaps.length]);

  const ctaDescription =
    primaryCta.key === 'allDone'
      ? t('dashboard.primaryCta.allDoneDesc')
      : t(`dashboard.primaryCta.${primaryCta.key}Desc`);
  const ctaTitle =
    primaryCta.minutes > 0
      ? `${t(`dashboard.primaryCta.${primaryCta.key}`)} · ${t('dashboard.primaryCta.minutes', { count: primaryCta.minutes })}`
      : t(`dashboard.primaryCta.${primaryCta.key}`);

  // ---- Career matches --------------------------------------------------------
  const topRole = user?.careerProfile?.targetRoles?.[0] || snapshot.savedJobs[0]?.basic.title || '';
  const bestPath = snapshot.roadmaps[0];
  const accessProfiled = Boolean(user?.disabilityProfile?.primaryType);

  // ---- AI insight ------------------------------------------------------------
  const insightReady = profileCompletion >= 40 || skills.length > 0;
  const insight = useDashboardInsight({
    ready: insightReady && !isLoading,
    targetRole: topRole,
    skills: skills.map((s) => s.name),
    savedJobs: snapshot.savedJobs.length,
    roadmaps: snapshot.roadmaps.length,
  });

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
    return [...byName.values()]
      .sort((a, b) => IMPORTANCE_ORDER[a.importance] - IMPORTANCE_ORDER[b.importance])
      .slice(0, 6);
  }, [snapshot.roadmaps]);

  const importanceLabel = (importance: GapSkill['importance']) =>
    importance === 'critical'
      ? t('dashboard.skills.important')
      : importance === 'important'
        ? t('dashboard.skills.somewhatImportant')
        : t('dashboard.skills.niceToHave');
  const importanceTone = (importance: GapSkill['importance']) =>
    importance === 'critical'
      ? 'bg-red-50 text-red-700 border-red-200'
      : importance === 'important'
        ? 'bg-amber-50 text-amber-700 border-amber-200'
        : 'bg-stone-100 text-stone-600 border-stone-200';

  // ---- Learning path steps ---------------------------------------------------
  const pathSteps: PathStep[] = React.useMemo(() => {
    if (!bestPath?.phases?.length) return [];
    const phases = [...bestPath.phases].sort((a, b) => a.order - b.order);
    const currentIndex = Math.max(0, (bestPath.progress.currentPhase || 1) - 1);
    const allDone = bestPath.progress.percentComplete >= 100;
    return phases.map((phase, index) => ({
      name: phase.name,
      status: allDone || index < currentIndex ? 'done' : index === currentIndex ? 'current' : 'locked',
    }));
  }, [bestPath]);

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
      icon: MapIcon,
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

  const topSkillName = skills.length
    ? [...skills].sort((a, b) => (b.level > a.level ? 1 : -1))[0]?.name
    : '';

  const activityStats = [
    { label: t('dashboard.activity.profileDone'), value: `${profileCompletion}%`, icon: UserRoundCheck },
    { label: t('dashboard.activity.jobsSaved'), value: String(snapshot.savedJobs.length), icon: Briefcase },
    { label: t('dashboard.activity.practiced'), value: String(completedInterviews), icon: Mic },
    { label: t('dashboard.activity.assessmentsDone'), value: String(completedAssessments), icon: Sparkles },
  ];

  return (
    <div className="mx-auto max-w-[1100px] space-y-4 text-stone-950">
      {/* Section 1 — Hero */}
      <SectionCard>
        <p className="text-sm font-bold text-stone-400">{t('dashboard.report')}</p>
        <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-3xl font-bold leading-tight text-stone-950 sm:text-4xl">
            {t('dashboard.greeting', { name: firstName })}
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-2xl font-bold text-stone-950">
              {t('dashboard.readyPercent', { percent: readiness })}
            </span>
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
          </div>
        </div>
        <p className="mt-2 text-sm font-medium text-stone-500">{t('dashboard.updatedFrom')}</p>

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

        <div className="mt-6">
          <PrimaryCta
            eyebrow={t('dashboard.primaryCta.eyebrow')}
            title={ctaTitle}
            description={ctaDescription}
            buttonLabel={t('dashboard.primaryCta.start')}
            to={primaryCta.to}
          />
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <article
                key={metric.label}
                className={`interactive-card group rounded-[20px] border p-4 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md hover:shadow-sky-950/5 ${metric.tone}`}
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
      </SectionCard>

      {/* Section 2 — Career matches */}
      <SectionCard title={t('dashboard.match.title')}>
        <div className="grid gap-3 md:grid-cols-3">
          <Link
            to="/jobs"
            className="interactive-card focus-ring group rounded-[20px] border border-stone-200 bg-white p-4 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-md hover:shadow-sky-950/5"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-stone-400">
                {t('dashboard.match.topMatch')}
              </p>
              <Target className="h-4 w-4 text-primary-500" />
            </div>
            <p className="mt-3 truncate text-xl font-bold text-stone-950">
              {topRole || t('dashboard.match.pickRole')}
            </p>
            <p className="mt-1 text-sm font-medium text-stone-500">{t('dashboard.match.roleHint')}</p>
          </Link>

          <Link
            to="/roadmaps"
            className="interactive-card focus-ring group rounded-[20px] bg-stone-950 p-4 text-white transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:shadow-amber-300/15"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-stone-400">
                {t('dashboard.match.bestPath')}
              </p>
              <Sparkles className="h-4 w-4 text-amber-300" />
            </div>
            <p className="mt-3 truncate text-xl font-bold">
              {bestPath?.title || topRole || t('dashboard.match.startPathway')}
            </p>
            <p className="mt-1 text-sm font-medium text-stone-300">
              {bestPath
                ? t('dashboard.path.matchPercent', { percent: bestPath.progress.percentComplete })
                : t('dashboard.match.startPathway')}
            </p>
          </Link>

          <Link
            to="/profile"
            className="interactive-card focus-ring group rounded-[20px] border border-stone-200 bg-white p-4 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-md hover:shadow-sky-950/5"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-stone-400">
                {t('dashboard.match.accessFit')}
              </p>
              <ShieldCheck className="h-4 w-4 text-primary-500" />
            </div>
            <p className="mt-3 text-xl font-bold text-stone-950">
              {accessProfiled ? t('dashboard.match.profiled') : t('dashboard.match.needsSetup')}
            </p>
            <p className="mt-1 text-sm font-medium text-stone-500">{t('dashboard.match.addInProfile')}</p>
          </Link>
        </div>
      </SectionCard>

      {/* Section 3 — AI insight */}
      {(insight.loading || insight.text || !insightReady) && (
        <AiInsight
          eyebrow={t('dashboard.insights.eyebrow')}
          loading={insight.loading}
          loadingLabel={t('dashboard.insights.loading')}
          body={insight.text || t('dashboard.insights.fallback')}
          actionLabel={t('dashboard.insights.viewSkills')}
          onAction={() => navigate('/roadmaps')}
        />
      )}

      {/* Section 4 — Skills overview */}
      <SectionCard title={t('dashboard.skills.title')}>
        {skills.length ? (
          <>
            <SkillBars skills={skills} />
            {topSkillName && (
              <p className="mt-4 text-sm font-medium text-stone-500">
                {t('dashboard.skills.summary', { top: topSkillName })}
              </p>
            )}
          </>
        ) : (
          <EmptyState
            icon={<TrendingUp className="h-5 w-5" />}
            title={t('dashboard.skills.title')}
            description={t('dashboard.skills.empty')}
            ctaLabel={t('dashboard.skills.addCta')}
            to="/profile"
          />
        )}
      </SectionCard>

      {/* Section 5 — Missing skills */}
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
            icon={<MapIcon className="h-5 w-5" />}
            title={t('dashboard.skills.missingTitle')}
            description={t('dashboard.skills.missingEmpty')}
            ctaLabel={t('dashboard.path.create')}
            to="/roadmaps"
          />
        )}
      </SectionCard>

      {/* Section 6 — Learning path */}
      <SectionCard
        title={t('dashboard.path.title')}
        action={
          bestPath ? (
            <span className="rounded-full bg-primary-100 px-3 py-1 text-xs font-bold text-primary-700">
              {t('dashboard.path.matchPercent', { percent: bestPath.progress.percentComplete })}
            </span>
          ) : undefined
        }
      >
        {pathSteps.length ? (
          <>
            <p className="mb-4 text-sm font-medium text-stone-500">
              {t('dashboard.path.current', {
                current: Math.min(bestPath?.progress.currentPhase || 1, pathSteps.length),
                total: pathSteps.length,
              })}
            </p>
            <LearningPathStepper steps={pathSteps} />
          </>
        ) : (
          <EmptyState
            icon={<MapIcon className="h-5 w-5" />}
            title={t('dashboard.path.title')}
            description={t('dashboard.path.empty')}
            ctaLabel={t('dashboard.path.create')}
            to="/roadmaps"
          />
        )}
      </SectionCard>

      {/* Section 7 — Activity */}
      <SectionCard title={t('dashboard.activity.title')} eyebrow={t('dashboard.activity.subtitle')}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {activityStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="rounded-[20px] border border-stone-100 bg-stone-50 p-4">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-primary-600 shadow-sm">
                  <Icon className="h-4 w-4" />
                </span>
                <p className="mt-3 text-2xl font-bold text-stone-950">{stat.value}</p>
                <p className="mt-1 text-sm font-medium text-stone-500">{stat.label}</p>
              </div>
            );
          })}
        </div>
      </SectionCard>

      {/* Section 8 — Smart reminders */}
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

      {/* Section 9 — Accessibility health */}
      <section className="interactive-card rounded-[28px] border border-primary-100 bg-primary-50 p-5 shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-md hover:shadow-sky-950/5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-primary-600 shadow-sm">
              <HeartPulse className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-stone-950">{t('dashboard.accessibilityHealth.title')}</h2>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-stone-600">
                {t('dashboard.accessibilityHealth.desc')}
              </p>
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
