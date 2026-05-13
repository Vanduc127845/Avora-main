import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, Button } from '../../../components/ui';
import { MapPin, Building2, DollarSign, CheckCircle2, AlertTriangle, Bookmark, Share2, Sparkles, Loader2, ArrowLeft } from 'lucide-react';
import { formatCurrency } from '../../../utils/helpers';
import { handleApiError, jobService } from '../../../services';
import type { JDAnalysis, Job } from '../../../lib/shared';

const salaryLabel = (job: Job) => {
  if (!job.basic.salary) return 'Salary not listed';
  return `${formatCurrency(job.basic.salary.min, job.basic.salary.currency)} - ${formatCurrency(job.basic.salary.max, job.basic.salary.currency)}`;
};

export default function JobDetailPage() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = React.useState<'overview' | 'simplified' | 'accessibility'>('overview');
  const [job, setJob] = React.useState<Job | null>(null);
  const [analysis, setAnalysis] = React.useState<JDAnalysis | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
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

  const handleAnalyze = async () => {
    if (!id) return;
    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await jobService.analyzeJob(id);
      setAnalysis(response.analysis);
      setActiveTab('simplified');
    } catch (err) {
      const apiError = handleApiError(err);
      setError(apiError.message || apiError.error);
    } finally {
      setIsAnalyzing(false);
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
                  Generate a plain-language breakdown, skills review, and accessibility considerations for this job.
                </p>
                <Button size="sm" variant="outline" className="border-primary-300 text-primary-700" onClick={handleAnalyze} isLoading={isAnalyzing}>
                  {analysis ? 'Refresh Analysis' : 'Get Full Analysis'}
                </Button>
              </CardContent>
            </Card>
          </div>
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
