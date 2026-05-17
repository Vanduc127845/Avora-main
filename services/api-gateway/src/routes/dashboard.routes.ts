import { Router, Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/error.middleware.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { AssessmentService } from '../services/assessment.service.js';
import { InterviewService } from '../services/interview.service.js';
import { JobService } from '../services/job.service.js';
import { RoadmapService } from '../services/roadmap.service.js';

const router: Router = Router();
const jobService = new JobService();
const roadmapService = new RoadmapService();
const interviewService = new InterviewService();
const assessmentService = new AssessmentService();

const getUserId = (req: Request) => {
  const userId = req.user?.userId;
  if (!userId) throw new AppError('Unauthorized', 401);
  return userId;
};

router.use(authMiddleware);

router.get('/summary', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = getUserId(req);
    const [savedJobs, roadmaps, interviews, assessments] = await Promise.allSettled([
      jobService.getSavedJobs(userId),
      roadmapService.getUserRoadmaps(userId),
      interviewService.getUserInterviews(userId),
      assessmentService.getAssessmentHistory(userId),
    ]);
    const errors = [
      savedJobs.status === 'rejected' ? 'savedJobs' : null,
      roadmaps.status === 'rejected' ? 'roadmaps' : null,
      interviews.status === 'rejected' ? 'interviews' : null,
      assessments.status === 'rejected' ? 'assessments' : null,
    ].filter(Boolean);

    res.json({
      savedJobs: savedJobs.status === 'fulfilled' ? savedJobs.value : [],
      roadmaps: roadmaps.status === 'fulfilled' ? roadmaps.value : [],
      interviews: interviews.status === 'fulfilled' ? interviews.value : [],
      assessments: assessments.status === 'fulfilled' ? assessments.value : [],
      errors,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

export const dashboardRouter = router;
