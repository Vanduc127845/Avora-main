// Career and job types
export interface JobBasic {
  title: string;
  company: string;
  location: string;
  remote: 'remote' | 'hybrid' | 'onsite';
  salary: { min: number; max: number; currency: string } | null;
}

export interface JobRequirements {
  education: string[];
  experience: string;
  skills: string[];
}

export interface JobAccessibility {
  rating: number;
  features: string[];
  accommodations: string[];
  barriers: string[];
  communityRating: number;
}

export interface JDAnalysis {
  summary: {
    plainLanguage: string;
    readingLevel: number;
    confidence: number;
  };
  keyResponsibilities: {
    original: string;
    simplified: string;
    difficulty: 'easy' | 'medium' | 'hard';
    accommodationPossible: boolean;
  }[];
  skills: {
    name: string;
    importance: 'required' | 'preferred' | 'nice-to-have';
    transferable: boolean;
  }[];
  accessibility: {
    remotePotential: number;
    physicalDemands: 'minimal' | 'moderate' | 'significant';
    accommodationScore: number;
    barriers: string[];
    suggestions: string[];
  };
  compensation: {
    range: { min: number; max: number };
    currency: string;
    benchmark: number;
  };
  fit?: JobFitAnalysis;
}

export interface JobFitAnalysis {
  matchScore: number;
  verdict: string;
  matchedSkills: string[];
  missingSkills: {
    name: string;
    importance: 'critical' | 'important' | 'nice-to-have';
    reason: string;
    learningPriority: number;
  }[];
  missingRequirements: {
    requirement: string;
    impact: 'high' | 'medium' | 'low';
    workaround: string;
  }[];
  portfolioProjects: {
    title: string;
    goal: string;
    skills: string[];
  }[];
  roadmapFocus: string[];
  interviewFocus: string[];
  nextActions: string[];
}

export interface Job {
  id: string;
  source: string;
  url: string;
  basic: JobBasic;
  details: {
    description: string;
    responsibilities: string[];
    requirements: JobRequirements;
    benefits: string[];
  };
  accessibility: JobAccessibility;
  analysis: JDAnalysis | null;
  postedAt: Date;
  scrapedAt: Date;
}

export interface JobSearchParams {
  query?: string;
  location?: string;
  remote?: boolean;
  disabilityFriendly?: boolean;
  page?: number;
  limit?: number;
}

export interface CareerPath {
  id: string;
  title: string;
  description: string;
  entryRequirements: string[];
  typicalProgression: string[];
  alternativePaths: string[];
  requiredSkills: {
    name: string;
    level: string;
    learnable: boolean;
  }[];
  accessibilityConsiderations: string[];
  outlook: {
    growthRate: number;
    demand: 'high' | 'medium' | 'low';
    medianSalary: number;
  };
}
