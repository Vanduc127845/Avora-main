import React from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, Button } from '../../../components/ui';
import {
  MapPin,
  Building2,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  Bookmark,
  Share2,
  Sparkles,
  Loader2,
  ArrowLeft,
  Target,
  GraduationCap,
  MessageSquare,
  ClipboardCheck,
} from 'lucide-react';
import { formatCurrency } from '../../../utils/helpers';
import { handleApiError, interviewService, jobService, roadmapService } from '../../../services';
import type { InterviewSession, JDAnalysis, Job, Roadmap } from '../../../lib/shared';
import { useAuthStore } from '../../../store';

const salaryLabel = (job: Job) => {
  if (!job.basic.salary) return 'Salary not listed';
  return `${formatCurrency(job.basic.salary.min, job.basic.salary.currency)} - ${formatCurrency(job.basic.salary.max, job.basic.salary.currency)}`;
};

export default function JobDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [activeTab, setActiveTab] = React.useState<'overview' | 'fit' | 'simplified' | 'accessibility'>('overview');
  const [job, setJob] = React.useState<Job | null>(null);
  const [analysis, setAnalysis] = React.useState<JDAnalysis | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [isCreatingRoadmap, setIsCreatingRoadmap] = React.useState(false);
  const [isStartingInterview, setIsStartingInterview] = React.useState(false);
  const [isCreatingActionPlan, setIsCreatingActionPlan] = React.useState(false);
  const [generatedPlan, setGeneratedPlan] = React.useState<{
    roadmap: Roadmap;
    interview: InterviewSession;
    nextActions: string[];
  } | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isSaved, setIsSaved] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;

    const loadJob = async () => {
      if (!id) return;
      setIsLoading(true);
      setError(null);

      try {
        const [jobResponse, savedResponse] = await Promise.all([
          jobService.getJob(id),
          jobService.getSavedJobs().catch(() => ({ jobs: [] })),
        ]);
        if (!mounted) return;
        setJob(jobResponse.job);
        setAnalysis(jobResponse.job.analysis || null);
        setIsSaved(savedResponse.jobs.some((savedJob) => savedJob.id === id));
      } catch (err) {
        if (!mounted) return;
        const apiError = handleApiError(err);
        setError(apiError.message || apiError.error);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    loadJob();
    return () => {
      mounted = false;
    };
  }, [id]);

  const userProfileContext = React.useMemo(() => ({
    ...user,
    selectedJob: job
      ? {
          id: job.id,
          title: job.basic.title,
          company: job.basic.company,
          skills: job.details.requirements.skills,
        }
      : undefined,
  }), [job, user]);

  const handleAnalyze = async () => {
    if (!id) return;
    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await jobService.analyzeJob(id, userProfileContext);
      setAnalysis(response.analysis);
      setActiveTab('fit');
    } catch (err) {
      const apiError = handleApiError(err);
      setError(apiError.message || apiError.error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCreateActionPlan = async () => {
    if (!id || !job) return;
    setIsCreatingActionPlan(true);
    setError(null);

    try {
      const response = await jobService.createJobActionPlan(id, userProfileContext);
      setAnalysis(response.analysis);
      setGeneratedPlan({
        roadmap: response.roadmap,
        interview: response.interview,
        nextActions: response.nextActions,
      });
      setActiveTab('fit');
    } catch (err) {
      const apiError = handleApiError(err);
      setError(apiError.message || apiError.error);
    } finally {
      setIsCreatingActionPlan(false);
    }
  };

  const handleCreateRoadmap = async () => {
    if (!job) return;
    setIsCreatingRoadmap(true);
    setError(null);

    try {
      const focusSkills = analysis?.fit?.roadmapFocus?.length
        ? analysis.fit.roadmapFocus
        : analysis?.fit?.missingSkills.map((skill) => skill.name) || job.details.requirements.skills.slice(0, 5);
      const response = await roadmapService.createRoadmap({
        targetJobId: job.id,
        targetRole: job.basic.title,
        title: `${job.basic.title} gap roadmap`,
        currentSkills: user?.careerProfile?.skills?.map((skill) => skill.name) || [],
        settings: {
          source: 'job-fit-analysis',
          company: job.basic.company,
          focusSkills,
          missingRequirements: analysis?.fit?.missingRequirements || [],
          accessibilityNeeds: user?.accessibilitySettings || {},
        },
      });
      navigate(`/roadmaps/${response.roadmap.id}`);
    } catch (err) {
      const apiError = handleApiError(err);
      setError(apiError.message || apiError.error);
    } finally {
      setIsCreatingRoadmap(false);
    }
  };

  const handleStartInterview = async () => {
    if (!job) return;
    setIsStartingInterview(true);
    setError(null);

    try {
      const response = await interviewService.createInterview({
        targetJobId: job.id,
        targetRole: job.basic.title,
        jobType: job.basic.title,
        focusAreas: interviewFocus.length ? interviewFocus : roadmapFocus,
        accommodations: job.accessibility.accommodations,
        config: {
          types: ['technical', 'behavioral', 'situational'],
          difficulty: 'medium',
          questionCount: 6,
          timePerQuestion: 120,
          allowPause: true,
          includeFollowUp: true,
        },
      });
      navigate(`/interviews/${response.interview.id}`);
    } catch (err) {
      const apiError = handleApiError(err);
      setError(apiError.message || apiError.error);
    } finally {
      setIsStartingInterview(false);
    }
  };

  const handleSave = async () => {
    if (!id) return;
    setIsSaved((value) => !value);
    try {
      if (isSaved) await jobService.unsaveJob(id);
      else await jobService.saveJob(id);
    } catch (err) {
      setIsSaved((value) => !value);
      setError(handleApiError(err).error);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center gap-3 py-16">
          <Loader2 className="h-5 w-5 animate-spin text-primary-600" />
          <span>Loading job...</span>
        </CardContent>
      </Card>
    );
  }

  if (error || !job) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <Link to="/jobs">
          <Button variant="ghost" leftIcon={<ArrowLeft className="h-4 w-4" />}>
            Back to jobs
          </Button>
        </Link>
        <Card>
          <CardContent className="py-10">
            <p className="font-medium text-red-700">{error || 'Job not found'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const fit = analysis?.fit;
  const missingSkills = fit?.missingSkills || [];
  const missingRequirements = fit?.missingRequirements || [];
  const matchedSkills = fit?.matchedSkills || [];
  const portfolioProjects = fit?.portfolioProjects || [];
  const roadmapFocus = fit?.roadmapFocus?.length
    ? fit.roadmapFocus
    : missingSkills.length
      ? missingSkills.map((skill) => skill.name)
      : job.details.requirements.skills.slice(0, 5);
  const interviewFocus = fit?.interviewFocus?.length
    ? fit.interviewFocus
    : roadmapFocus.slice(0, 3).map((skill) => `${skill} interview practice`);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Link to="/jobs" className="inline-flex">
        <Button variant="ghost" leftIcon={<ArrowLeft className="h-4 w-4" />}>
          Back to jobs
        </Button>
      </Link>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </div>
      )}

      <Card>
        <CardContent>
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <span className="px-2 py-0.5 bg-success-100 text-success-700 rounded text-xs font-medium">
                {job.accessibility.rating}% accessibility
              </span>
              <h1 className="text-2xl font-bold text-gray-900 mt-2 mb-1">{job.basic.title}</h1>
              <div className="flex flex-wrap items-center gap-4 text-gray-600">
                <span className="flex items-center gap-1">
                  <Building2 className="h-4 w-4" />
                  {job.basic.company}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {job.basic.location}
                </span>
                <span className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  {salaryLabel(job)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleSave} aria-label={isSaved ? 'Unsave job' : 'Save job'}>
                <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-current text-primary-600' : ''}`} />
              </Button>
              <Button variant="outline" aria-label="Share job">
                <Share2 className="h-4 w-4" />
              </Button>
              {job.url ? (
                <a href={job.url} target="_blank" rel="noreferrer">
                  <Button>Apply Now</Button>
                </a>
              ) : (
                <Button disabled>Apply Now</Button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            {[job.basic.remote, ...job.accessibility.features.slice(0, 4)].map((tag) => (
              <span key={tag} className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm capitalize">
                {tag}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4 border-b border-gray-200 overflow-x-auto">
        {[
          { id: 'overview', label: 'Job Overview' },
          { id: 'fit', label: 'Fit & Gaps' },
          { id: 'simplified', label: 'Easy Language Version' },
          { id: 'accessibility', label: 'Accessibility Info' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`pb-3 px-2 font-medium transition-colors relative whitespace-nowrap ${
              activeTab === tab.id ? 'text-primary-600' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
            {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500" />}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>About This Role</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">{job.details.description}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Key Responsibilities</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {job.details.responsibilities.map((responsibility) => (
                    <li key={responsibility} className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-success-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{responsibility}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Requirements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Education</h4>
                  <p className="text-gray-600">{job.details.requirements.education.join(', ')}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Experience</h4>
                  <p className="text-gray-600">{job.details.requirements.experience}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {job.details.requirements.skills.map((skill) => (
                      <span key={skill} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Benefits</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {(job.details.benefits.length ? job.details.benefits : ['Benefits not listed']).map((benefit) => (
                    <li key={benefit} className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-success-500 flex-shrink-0" />
                      <span className="text-gray-700 text-sm">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-primary-50 border-primary-100">
              <CardContent>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-5 w-5 text-primary-600" />
                  <h4 className="font-semibold text-primary-900">AI Analysis</h4>
                </div>
                <p className="text-primary-800 text-sm mb-4">
                  Compare this selected job with your profile, find missing skills, then create a focused roadmap or mock interview.
                </p>
                <div className="space-y-2">
                  <Button size="sm" onClick={handleCreateActionPlan} isLoading={isCreatingActionPlan}>
                    Build Full Job Plan
                  </Button>
                  <Button size="sm" variant="outline" className="border-primary-300 text-primary-700" onClick={handleAnalyze} isLoading={isAnalyzing}>
                    {analysis ? 'Refresh Fit Analysis' : 'Analyze Only'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'fit' && (
        <div className="space-y-6">
          {!fit ? (
            <Card>
              <CardContent className="py-10">
                <div className="mx-auto max-w-2xl text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
                    <Target className="h-6 w-6" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Analyze this job against your profile</h2>
                  <p className="mt-2 text-gray-600">
                    Avora will compare this selected role with your current skills, identify gaps, then prepare focused next steps.
                  </p>
                  <div className="mt-5 flex flex-wrap justify-center gap-3">
                    <Button onClick={handleCreateActionPlan} isLoading={isCreatingActionPlan}>
                      Build Full Job Plan
                    </Button>
                    <Button variant="outline" onClick={handleAnalyze} isLoading={isAnalyzing}>
                      Analyze Only
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card className="border-primary-100 bg-gradient-to-br from-primary-50 to-white">
                <CardContent>
                  <div className="grid gap-6 md:grid-cols-[180px_1fr] md:items-center">
                    <div className="rounded-2xl bg-white p-5 text-center shadow-sm">
                      <p className="text-sm font-medium text-gray-500">Job match</p>
                      <p className="mt-2 text-5xl font-bold text-primary-700">{fit.matchScore}%</p>
                      <p className="mt-2 text-xs text-gray-500">Based on selected job requirements</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-primary-700">
                        <Sparkles className="h-5 w-5" />
                        <span className="text-sm font-semibold uppercase tracking-wide">Focused AI analysis</span>
                      </div>
                      <h2 className="mt-2 text-2xl font-bold text-gray-900">{job.basic.title} at {job.basic.company}</h2>
                      <p className="mt-3 text-gray-700">{fit.verdict}</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {roadmapFocus.slice(0, 5).map((skill) => (
                          <span key={skill} className="rounded-full bg-white px-3 py-1 text-sm font-medium text-primary-700 shadow-sm">
                            Learn: {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-success-600" />
                      Skills You Already Match
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {matchedSkills.length ? (
                      <div className="flex flex-wrap gap-2">
                        {matchedSkills.map((skill) => (
                          <span key={skill} className="rounded-full bg-success-50 px-3 py-1 text-sm font-medium text-success-700">
                            {skill}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-600">
                        Your profile does not list matching skills yet. Add skills in your profile or use the gap list below as your starting point.
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-warning-600" />
                      Missing Skills to Improve
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {missingSkills.length ? (
                      <div className="space-y-3">
                        {missingSkills.map((skill) => (
                          <div key={skill.name} className="rounded-xl border border-gray-200 p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <h3 className="font-semibold text-gray-900">{skill.name}</h3>
                                <p className="mt-1 text-sm text-gray-600">{skill.reason}</p>
                              </div>
                              <span className="rounded-full bg-warning-50 px-2.5 py-1 text-xs font-semibold text-warning-700">
                                {skill.importance}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-600">No major missing skills were found from the selected job post.</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ClipboardCheck className="h-5 w-5 text-primary-600" />
                      Requirements That Need Evidence
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {missingRequirements.length ? (
                      <div className="space-y-3">
                        {missingRequirements.map((item) => (
                          <div key={item.requirement} className="rounded-xl bg-gray-50 p-4">
                            <div className="flex items-start justify-between gap-3">
                              <p className="font-medium text-gray-900">{item.requirement}</p>
                              <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-gray-700">
                                {item.impact} impact
                              </span>
                            </div>
                            <p className="mt-2 text-sm text-gray-600">{item.workaround}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-600">No extra requirement gap was detected beyond the skills list.</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <GraduationCap className="h-5 w-5 text-primary-600" />
                      Portfolio Projects to Build
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {portfolioProjects.length ? (
                      <div className="space-y-3">
                        {portfolioProjects.map((project) => (
                          <div key={project.title} className="rounded-xl border border-primary-100 bg-primary-50 p-4">
                            <h3 className="font-semibold text-primary-900">{project.title}</h3>
                            <p className="mt-1 text-sm text-primary-800">{project.goal}</p>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {project.skills.map((skill) => (
                                <span key={`${project.title}-${skill}`} className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-primary-700">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-600">Create one small project that demonstrates the top skills from this job post.</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Next Steps from This Job</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="rounded-xl bg-gray-50 p-4">
                        <h3 className="font-semibold text-gray-900">Roadmap focus</h3>
                        <ul className="mt-3 space-y-2 text-sm text-gray-700">
                          {roadmapFocus.slice(0, 5).map((item) => (
                            <li key={item} className="flex items-start gap-2">
                              <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary-600" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="rounded-xl bg-gray-50 p-4">
                        <h3 className="font-semibold text-gray-900">Mock interview focus</h3>
                        <ul className="mt-3 space-y-2 text-sm text-gray-700">
                          {interviewFocus.slice(0, 5).map((item) => (
                            <li key={item} className="flex items-start gap-2">
                              <MessageSquare className="mt-0.5 h-4 w-4 text-primary-600" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-gray-200 p-4">
                      <h3 className="font-semibold text-gray-900">Generate practice tools</h3>
                      <p className="mt-2 text-sm text-gray-600">
                        These actions use the selected job, not a generic role, so the plan and questions target the exact gaps above.
                      </p>
                      {generatedPlan && (
                        <div className="mt-4 rounded-xl bg-success-50 p-3 text-sm text-success-800">
                          <p className="font-semibold">Full plan created.</p>
                          <ul className="mt-2 list-disc space-y-1 pl-4">
                            {generatedPlan.nextActions.map((action) => (
                              <li key={action}>{action}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <div className="mt-4 space-y-3">
                        <Button className="w-full justify-center" onClick={handleCreateActionPlan} isLoading={isCreatingActionPlan}>
                          Build Full Job Plan
                        </Button>
                        <Button className="w-full justify-center" onClick={handleCreateRoadmap} isLoading={isCreatingRoadmap}>
                          Create Gap Roadmap
                        </Button>
                        <Button
                          className="w-full justify-center"
                          variant="outline"
                          onClick={handleStartInterview}
                          isLoading={isStartingInterview}
                        >
                          Start Mock Interview
                        </Button>
                        {generatedPlan && (
                          <div className="grid grid-cols-2 gap-2">
                            <Button variant="outline" size="sm" onClick={() => navigate(`/roadmaps/${generatedPlan.roadmap.id}`)}>
                              Open Roadmap
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => navigate(`/interviews/${generatedPlan.interview.id}`)}>
                              Open Interview
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}

      {activeTab === 'simplified' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary-600" />
              Easy Language Version
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {!analysis ? (
              <div className="p-4 bg-primary-50 rounded-xl border border-primary-100">
                <p className="text-primary-800 mb-4">Run AI analysis to generate a plain-language version of this job.</p>
                <Button onClick={handleAnalyze} isLoading={isAnalyzing}>Analyze Job</Button>
              </div>
            ) : (
              <>
                <div className="p-4 bg-success-50 rounded-xl border border-success-100">
                  <h3 className="font-semibold text-success-900 mb-2">In Simple Terms</h3>
                  <p className="text-success-800">{analysis.summary.plainLanguage}</p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Responsibilities Explained</h3>
                  <div className="space-y-3">
                    {analysis.keyResponsibilities.map((point) => (
                      <div key={`${point.original}-${point.simplified}`} className="p-4 bg-gray-50 rounded-xl">
                        <p className="text-gray-500 text-sm mb-1">Original: {point.original}</p>
                        <p className="text-gray-900 font-medium">{point.simplified}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-primary-50 rounded-xl">
                  <h3 className="font-semibold text-primary-900 mb-2">Skills to Prepare</h3>
                  <div className="flex flex-wrap gap-2">
                    {analysis.skills.map((skill) => (
                      <span key={skill.name} className="px-3 py-1 bg-white text-primary-700 rounded-full text-sm">
                        {skill.name} - {skill.importance}
                      </span>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'accessibility' && (
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Accessibility Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center mb-6">
                <div className="relative w-32 h-32">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="64" cy="64" r="56" fill="none" stroke="#e5e7eb" strokeWidth="12" />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      fill="none"
                      stroke="#22c55e"
                      strokeWidth="12"
                      strokeDasharray={`${(job.accessibility.rating / 100) * 352} 352`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl font-bold text-gray-900">{job.accessibility.rating}</span>
                  </div>
                </div>
              </div>
              <p className="text-center text-gray-600">
                {analysis
                  ? `AI accommodation score: ${analysis.accessibility.accommodationScore}/100.`
                  : 'This score is based on visible accessibility signals in the job post.'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Available Features</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {job.accessibility.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-success-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Barriers and Suggestions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {(analysis?.accessibility.barriers.length ? analysis.accessibility.barriers : job.accessibility.barriers).map((barrier) => (
                  <div key={barrier} className="p-4 bg-warning-50 rounded-xl">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-5 w-5 text-warning-600 flex-shrink-0" />
                      <p className="text-sm text-warning-900">{barrier}</p>
                    </div>
                  </div>
                ))}
                {(analysis?.accessibility.suggestions.length ? analysis.accessibility.suggestions : job.accessibility.accommodations).map((suggestion) => (
                  <div key={suggestion} className="p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-success-500 flex-shrink-0" />
                      <p className="text-sm text-gray-700">{suggestion}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
