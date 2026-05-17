import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, Button } from '../../../components/ui';
import { Search, Filter, MapPin, Building2, DollarSign, ArrowRight, Bookmark, Share2, Loader2 } from 'lucide-react';
import { formatCurrency } from '../../../utils/helpers';
import { handleApiError, isRequestCanceled, jobService } from '../../../services';
import type { Job } from '../../../lib/shared';

const salaryLabel = (job: Job) => {
  if (!job.basic.salary) return 'Salary not listed';
  return `${formatCurrency(job.basic.salary.min, job.basic.salary.currency)} - ${formatCurrency(job.basic.salary.max, job.basic.salary.currency)}`;
};

const postedLabel = (postedAt: Date | string) => {
  const posted = new Date(postedAt);
  const days = Math.max(0, Math.round((Date.now() - posted.getTime()) / 86_400_000));
  if (days === 0) return 'Today';
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
};

export default function JobsPage() {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [remoteOnly, setRemoteOnly] = React.useState(false);
  const [accessibilityFriendly, setAccessibilityFriendly] = React.useState(true);
  const [jobs, setJobs] = React.useState<Job[]>([]);
  const [savedJobs, setSavedJobs] = React.useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;

    const loadSavedJobs = async () => {
      try {
        const response = await jobService.getSavedJobs({ cacheTtlMs: 30_000 });
        if (active) setSavedJobs(new Set(response.jobs.map((job) => job.id)));
      } catch (err) {
        if (active && !isRequestCanceled(err)) setError(handleApiError(err).error);
      }
    };

    loadSavedJobs();
    return () => {
      active = false;
    };
  }, []);

  const loadJobs = React.useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    setError(null);

    try {
      const jobsResponse = await jobService.searchJobs(
        {
          query: searchQuery || undefined,
          remote: remoteOnly || undefined,
          disabilityFriendly: accessibilityFriendly || undefined,
          limit: 20,
        },
        { signal, dedupe: false, cacheTtlMs: 20_000 }
      );

      setJobs(jobsResponse.jobs);
    } catch (err) {
      if (isRequestCanceled(err)) return;
      const apiError = handleApiError(err);
      setError(apiError.message || apiError.error);
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, [accessibilityFriendly, remoteOnly, searchQuery]);

  React.useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => loadJobs(controller.signal), 450);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [loadJobs]);

  const toggleSave = async (id: string) => {
    const next = new Set(savedJobs);
    const shouldUnsave = next.has(id);

    if (shouldUnsave) next.delete(id);
    else next.add(id);
    setSavedJobs(next);

    try {
      if (shouldUnsave) await jobService.unsaveJob(id);
      else await jobService.saveJob(id);
    } catch (err) {
      const reverted = new Set(savedJobs);
      setSavedJobs(reverted);
      setError(handleApiError(err).error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="heading-2 mb-2">Find Accessible Jobs</h1>
        <p className="text-gray-600">
          Search roles with remote options, flexible communication, and accommodation signals.
        </p>
      </div>

      <Card>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="search"
                placeholder="Search jobs, companies, or skills"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="input pl-12"
              />
            </div>
            <Button variant="outline" leftIcon={<Filter className="h-4 w-4" />}>
              Filters
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            <button
              type="button"
              onClick={() => setRemoteOnly((value) => !value)}
              className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                remoteOnly ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-700 hover:bg-primary-50'
              }`}
            >
              Remote only
            </button>
            <button
              type="button"
              onClick={() => setAccessibilityFriendly((value) => !value)}
              className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                accessibilityFriendly ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-700 hover:bg-primary-50'
              }`}
            >
              Accessibility friendly
            </button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-gray-600">
          <span className="font-semibold text-gray-900">{jobs.length}</span> jobs found
        </p>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12 gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-primary-600" />
            <span>Loading jobs...</span>
          </CardContent>
        </Card>
      ) : jobs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="font-medium text-gray-900">No matching jobs found.</p>
            <p className="text-sm text-gray-500 mt-1">Try a broader keyword or turn off one filter.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <Card key={job.id} className="hover:shadow-lg transition-shadow">
              <CardContent>
                <div className="flex items-start justify-between mb-4 gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 bg-success-100 text-success-700 rounded text-xs font-medium">
                        {job.accessibility.rating}% accessibility
                      </span>
                      <span className="text-sm text-gray-500">{postedLabel(job.postedAt)}</span>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{job.basic.title}</h3>
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
                  <button
                    onClick={() => toggleSave(job.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      savedJobs.has(job.id)
                        ? 'bg-primary-100 text-primary-600'
                        : 'text-gray-400 hover:bg-gray-100'
                    }`}
                    aria-label={savedJobs.has(job.id) ? 'Unsave job' : 'Save job'}
                  >
                    <Bookmark className={`h-5 w-5 ${savedJobs.has(job.id) ? 'fill-current' : ''}`} />
                  </button>
                </div>

                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{job.details.description}</p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {[job.basic.remote, ...job.accessibility.features.slice(0, 3)].map((tag) => (
                    <span key={tag} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm capitalize">
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-3">
                  <Link to={`/jobs/${job.id}`} className="flex-1">
                    <Button className="w-full" rightIcon={<ArrowRight className="h-4 w-4" />}>
                      View Details
                    </Button>
                  </Link>
                  <Button variant="outline" aria-label="Share job">
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
