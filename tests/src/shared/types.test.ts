import { describe, it, expect } from 'vitest';
import type {
  UserProfile,
  DisabilityProfile,
  AccessibilitySettings,
  Assessment,
  Job,
  Roadmap,
  InterviewSession,
} from '@ai4a/shared';

describe('Shared Types', () => {
  describe('UserProfile', () => {
    it('should accept valid user profile', () => {
      const profile: UserProfile = {
        id: 'user_123',
        email: 'test@example.com',
        name: 'Test User',
        createdAt: new Date(),
        updatedAt: new Date(),
        disabilityProfile: {
          primaryType: 'visual',
          secondaryTypes: [],
          severity: 'moderate',
          accommodations: [],
          onsetAge: 25,
          disclosureLevel: 'private',
        },
        accessibilitySettings: {
          fontSize: 100,
          highContrast: false,
          reducedMotion: false,
          voiceNavigation: false,
          keyboardOnly: false,
          screenReaderOptimized: true,
          extraTime: true,
          preferredInput: 'voice',
        },
        careerProfile: {
          interests: ['Technology', 'Design'],
          skills: [],
          values: ['Growth', 'Impact'],
          workPreferences: {
            remote: 'required',
            schedule: 'full-time',
            environment: [],
            commuteTolerance: 30,
          },
          targetRoles: ['Software Developer'],
          experienceLevel: 'entry',
        },
        privacySettings: {
          shareProfile: false,
          shareProgress: true,
          anonymousAnalytics: true,
        },
      };

      expect(profile.id).toBe('user_123');
      expect(profile.email).toBe('test@example.com');
      expect(profile.disabilityProfile.primaryType).toBe('visual');
    });
  });

  describe('DisabilityProfile', () => {
    it('should allow null for optional fields', () => {
      const profile: DisabilityProfile = {
        primaryType: null,
        secondaryTypes: [],
        severity: null,
        accommodations: [],
        onsetAge: null,
        disclosureLevel: 'private',
      };

      expect(profile.primaryType).toBeNull();
      expect(profile.severity).toBeNull();
      expect(profile.onsetAge).toBeNull();
    });
  });

  describe('AccessibilitySettings', () => {
    it('should have correct default values structure', () => {
      const settings: AccessibilitySettings = {
        fontSize: 150,
        highContrast: true,
        reducedMotion: true,
        voiceNavigation: true,
        keyboardOnly: false,
        screenReaderOptimized: true,
        extraTime: true,
        preferredInput: 'text',
      };

      expect(settings.fontSize).toBeGreaterThanOrEqual(100);
      expect(settings.fontSize).toBeLessThanOrEqual(200);
      expect(settings.preferredInput).toMatch(/^(voice|text|switch|eye-tracking)$/);
    });
  });

  describe('Assessment', () => {
    it('should track assessment progress', () => {
      const assessment: Assessment = {
        id: 'assessment_123',
        userId: 'user_123',
        type: 'initial',
        status: 'in-progress',
        conversations: [],
        results: {
          interests: [
            { name: 'Technology', score: 0.9, examples: ['Coding', 'Building'] },
          ],
          skills: [{ skill: 'Problem Solving', confidence: 0.8, evidence: ['Projects'] }],
          values: ['Growth'],
          workStyle: {
            type: 'collaborative',
            pace: 'steady',
            environment: ['remote'],
            communication: 'async',
          },
          recommendedCareers: [
            {
              title: 'Software Developer',
              matchScore: 0.85,
              reasoning: 'Strong technical interest',
              accessibilityScore: 90,
              growthPotential: 95,
              marketDemand: 90,
            },
          ],
        },
        createdAt: new Date(),
        completedAt: null,
      };

      expect(assessment.status).toBe('in-progress');
      expect(assessment.results.interests).toHaveLength(1);
      expect(assessment.results.recommendedCareers).toHaveLength(1);
    });
  });

  describe('Job', () => {
    it('should handle job with full details', () => {
      const job: Job = {
        id: 'job_123',
        source: 'linkedin',
        url: 'https://linkedin.com/jobs/123',
        basic: {
          title: 'Software Developer',
          company: 'Tech Corp',
          location: 'Remote',
          remote: 'remote',
          salary: { min: 80000, max: 120000, currency: 'USD' },
        },
        details: {
          description: 'Build amazing software',
          responsibilities: ['Write code', 'Test', 'Deploy'],
          requirements: {
            education: ['CS Degree'],
            experience: '3+ years',
            skills: ['JavaScript', 'React'],
          },
          benefits: ['Health', '401k'],
        },
        accessibility: {
          rating: 85,
          features: ['Remote work'],
          accommodations: ['Flexible hours'],
          barriers: [],
          communityRating: 4.5,
        },
        analysis: null,
        postedAt: new Date(),
        scrapedAt: new Date(),
      };

      expect(job.basic.remote).toBe('remote');
      expect(job.accessibility.rating).toBeGreaterThanOrEqual(0);
      expect(job.accessibility.rating).toBeLessThanOrEqual(100);
    });
  });

  describe('Roadmap', () => {
    it('should track roadmap progress', () => {
      const roadmap: Roadmap = {
        id: 'roadmap_123',
        userId: 'user_123',
        targetJobId: 'job_123',
        title: 'Software Developer Path',
        description: 'Learn to become a software developer',
        currentSkills: ['HTML', 'CSS'],
        gapSkills: [],
        phases: [
          {
            id: 'phase_1',
            name: 'Foundation',
            description: 'Learn basics',
            order: 1,
            milestones: [],
            estimatedDuration: 40,
          },
        ],
        settings: {
          weeklyHours: 10,
          preferredPace: 'moderate',
          accommodations: [],
        },
        progress: {
          completedItems: 5,
          totalItems: 20,
          percentComplete: 25,
          currentPhase: 1,
          lastActivityAt: new Date(),
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(roadmap.progress.percentComplete).toBeGreaterThan(0);
      expect(roadmap.progress.percentComplete).toBeLessThanOrEqual(100);
    });
  });

  describe('InterviewSession', () => {
    it('should track interview state', () => {
      const interview: InterviewSession = {
        id: 'interview_123',
        userId: 'user_123',
        targetJobId: 'job_123',
        config: {
          types: ['behavioral', 'situational'],
          difficulty: 'medium',
          questionCount: 5,
          timePerQuestion: 120,
          allowPause: true,
          includeFollowUp: true,
        },
        status: 'in-progress',
        questions: [],
        currentQuestionIndex: 2,
        responses: [],
        feedback: null,
        settings: {
          accommodations: ['extra-time'],
          startTime: new Date(),
          duration: 0,
          pauses: [],
        },
        createdAt: new Date(),
        completedAt: null,
      };

      expect(interview.status).toBe('in-progress');
      expect(interview.currentQuestionIndex).toBe(2);
    });
  });
});
