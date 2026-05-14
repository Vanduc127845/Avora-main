import type { JDAnalysis, Job, JobSearchParams } from '../types/shared.js';
import { demoJobs, demoSavedJobs } from '../data/demo-store.js';
import { saveDemoData } from '../data/demo-persistence.js';
import { getOptionalSupabaseAdmin } from '../utils/supabase.js';
import { AIService } from './ai.service.js';

type JobRow = {
  id: string;
  title: string;
  company: string;
  location: string;
  type?: string | null;
  salary_range?: string | null;
  description: string;
  requirements?: unknown;
  benefits?: unknown;
  accessibility_features?: unknown;
  accessibility_score?: number | null;
  source_url?: string | null;
  posted_date?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

const parseJsonArray = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string');
  if (typeof value !== 'string') return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
};

const parseSalary = (salaryRange?: string | null): Job['basic']['salary'] => {
  if (!salaryRange) return null;
  const numbers = salaryRange.match(/\d[\d,]*/g)?.map((item) => Number(item.replace(/,/g, ''))) || [];
  if (numbers.length < 2) return null;
  return { min: numbers[0], max: numbers[1], currency: /\u20ac|EUR|euro/i.test(salaryRange) ? 'EUR' : 'USD' };
};

const remoteFromText = (location: string, type?: string | null): Job['basic']['remote'] => {
  const text = `${location} ${type || ''}`.toLowerCase();
  if (text.includes('remote')) return 'remote';
  if (text.includes('hybrid')) return 'hybrid';
  return 'onsite';
};

const toJob = (row: JobRow): Job => {
  const requirements = parseJsonArray(row.requirements);
  const benefits = parseJsonArray(row.benefits);
  const accessibilityFeatures = parseJsonArray(row.accessibility_features);
  const postedAt = row.posted_date ? new Date(row.posted_date) : new Date();

  return {
    id: row.id,
    source: 'supabase',
    url: row.source_url || '',
    basic: {
      title: row.title,
      company: row.company,
      location: row.location,
      remote: remoteFromText(row.location, row.type),
      salary: parseSalary(row.salary_range),
    },
    details: {
      description: row.description,
      responsibilities: [
        `Contribute to ${row.title} work at ${row.company}`,
        'Communicate progress and blockers clearly',
        'Collaborate with teammates using agreed tools',
      ],
      requirements: {
        education: requirements.some((item) => /degree|school|education/i.test(item))
          ? requirements.filter((item) => /degree|school|education/i.test(item))
          : ['Equivalent experience accepted where appropriate'],
        experience: requirements.find((item) => /\d|year|entry|experience/i.test(item)) || 'Not specified',
        skills: requirements.length ? requirements : ['Communication', 'Problem solving'],
      },
      benefits,
    },
    accessibility: {
      rating: row.accessibility_score || 0,
      features: accessibilityFeatures,
      accommodations: accessibilityFeatures,
      barriers: [],
      communityRating: Math.round(((row.accessibility_score || 70) / 20) * 10) / 10,
    },
    analysis: null,
    postedAt,
    scrapedAt: row.updated_at ? new Date(row.updated_at) : postedAt,
  };
};

export class JobService {
  private aiService = new AIService();

  async searchJobs(params: JobSearchParams): Promise<{ jobs: Job[]; total: number; page: number; totalPages: number }> {
    const supabase = getOptionalSupabaseAdmin();
    const page = params.page || 1;
    const limit = params.limit || 20;

    if (supabase) {
      let query = supabase.from('jobs').select('*', { count: 'exact' });

      if (params.query) {
        const term = `%${params.query}%`;
        query = query.or(`title.ilike.${term},company.ilike.${term},description.ilike.${term}`);
      }
      if (params.location) query = query.ilike('location', `%${params.location}%`);
      if (params.remote) query = query.or('location.ilike.%remote%,type.ilike.%remote%');
      if (params.disabilityFriendly) query = query.gte('accessibility_score', 75);

      const from = (page - 1) * limit;
      const to = from + limit - 1;
      const { data, count, error } = await query
        .order('posted_date', { ascending: false })
        .range(from, to);

      if (error) throw error;
      const total = count || data?.length || 0;
      return {
        jobs: (data || []).map((row) => toJob(row as JobRow)),
        total,
        page,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      };
    }

    let jobs = demoJobs;
    if (params.query) {
      const term = params.query.toLowerCase();
      jobs = jobs.filter((job) =>
        [
          job.basic.title,
          job.basic.company,
          job.details.description,
          ...job.details.requirements.skills,
        ]
          .join(' ')
          .toLowerCase()
          .includes(term)
      );
    }
    if (params.location) {
      const location = params.location.toLowerCase();
      jobs = jobs.filter((job) => job.basic.location.toLowerCase().includes(location));
    }
    if (params.remote) jobs = jobs.filter((job) => job.basic.remote === 'remote');
    if (params.disabilityFriendly) jobs = jobs.filter((job) => job.accessibility.rating >= 75);

    return {
      jobs: jobs.slice((page - 1) * limit, page * limit),
      total: jobs.length,
      page,
      totalPages: Math.max(1, Math.ceil(jobs.length / limit)),
    };
  }

  async getJobById(id: string): Promise<Job | null> {
    const supabase = getOptionalSupabaseAdmin();

    if (supabase) {
      const { data, error } = await supabase.from('jobs').select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      return data ? toJob(data as JobRow) : null;
    }

    return demoJobs.find((job) => job.id === id) || null;
  }

  async analyzeJob(jobId: string, _userId: string, userProfile?: any): Promise<JDAnalysis> {
    const job = await this.getJobById(jobId);
    const description = job
      ? [
          `Title: ${job.basic.title}`,
          `Company: ${job.basic.company}`,
          `Location: ${job.basic.location}`,
          `Work mode: ${job.basic.remote}`,
          `Salary: ${
            job.basic.salary
              ? `${job.basic.salary.min}-${job.basic.salary.max} ${job.basic.salary.currency}`
              : 'Not listed'
          }`,
          `Description: ${job.details.description}`,
          `Responsibilities: ${job.details.responsibilities.join('; ')}`,
          `Education: ${job.details.requirements.education.join(', ') || 'Not listed'}`,
          `Experience: ${job.details.requirements.experience || 'Not listed'}`,
          `Skills: ${job.details.requirements.skills.join(', ')}`,
          `Benefits: ${job.details.benefits.join(', ') || 'Not listed'}`,
          `Accessibility features: ${job.accessibility.features.join(', ') || 'Not listed'}`,
          `Possible accommodations: ${job.accessibility.accommodations.join(', ') || 'Not listed'}`,
          `Accessibility barriers: ${job.accessibility.barriers.join(', ') || 'Not listed'}`,
        ].join('\n')
      : jobId;

    return this.aiService.analyzeJobDescription(description, userProfile);
  }

  async getSavedJobs(userId: string): Promise<Job[]> {
    const supabase = getOptionalSupabaseAdmin();

    if (supabase) {
      const { data, error } = await supabase
        .from('saved_jobs')
        .select('job_id, jobs(*)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || [])
        .map((row: any) => row.jobs)
        .filter(Boolean)
        .map((row: JobRow) => toJob(row));
    }

    const saved = demoSavedJobs.get(userId) || new Set<string>();
    return demoJobs.filter((job) => saved.has(job.id));
  }

  async saveJob(jobId: string, userId: string): Promise<void> {
    const supabase = getOptionalSupabaseAdmin();

    if (supabase) {
      const { error } = await supabase
        .from('saved_jobs')
        .upsert({ user_id: userId, job_id: jobId }, { onConflict: 'user_id,job_id' });
      if (error) throw error;
      return;
    }

    const saved = demoSavedJobs.get(userId) || new Set<string>();
    saved.add(jobId);
    demoSavedJobs.set(userId, saved);
    await saveDemoData();
  }

  async unsaveJob(jobId: string, userId: string): Promise<void> {
    const supabase = getOptionalSupabaseAdmin();

    if (supabase) {
      const { error } = await supabase
        .from('saved_jobs')
        .delete()
        .eq('user_id', userId)
        .eq('job_id', jobId);
      if (error) throw error;
      return;
    }

    const saved = demoSavedJobs.get(userId);
    saved?.delete(jobId);
    await saveDemoData();
  }
}
