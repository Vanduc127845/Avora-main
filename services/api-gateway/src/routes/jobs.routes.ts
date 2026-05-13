import { Router, Request, Response, NextFunction } from 'express';
import { query, body, validationResult } from 'express-validator';
import { AppError } from '../middleware/error.middleware.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { JobService } from '../services/job.service.js';

const router: Router = Router();
const jobService = new JobService();

const getUserId = (req: Request) => {
  const userId = req.user?.userId;
  if (!userId) throw new AppError('Unauthorized', 401);
  return userId;
};

router.use(authMiddleware);

router.get('/',
  query('q').optional().trim(),
  query('location').optional().trim(),
  query('remote').optional().isIn(['true', 'false']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Invalid query parameters', 400);
      }

      const { q, location, remote, page = 1, limit = 20 } = req.query;
      
      const jobs = await jobService.searchJobs({
        query: q as string,
        location: location as string,
        remote: remote === 'true',
        page: Number(page),
        limit: Number(limit),
      });
      
      res.json(jobs);
    } catch (error) {
      next(error);
    }
  }
);

router.get('/saved',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = getUserId(req);
      const jobs = await jobService.getSavedJobs(userId);
      res.json({ jobs });
    } catch (error) {
      next(error);
    }
  }
);

router.get('/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const job = await jobService.getJobById(id);
      
      if (!job) {
        throw new AppError('Job not found', 404);
      }
      
      res.json({ job });
    } catch (error) {
      next(error);
    }
  }
);

router.post('/:id/analyze',
  body('userProfile').optional().isObject(),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Invalid input', 400);
      }

      const { id } = req.params;
      const userId = getUserId(req);
      const userProfile = req.body.userProfile;
      
      const analysis = await jobService.analyzeJob(id, userId, userProfile);
      res.json({ analysis });
    } catch (error) {
      next(error);
    }
  }
);

router.post('/:id/save',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = getUserId(req);
      await jobService.saveJob(id, userId);
      res.json({ message: 'Job saved successfully' });
    } catch (error) {
      next(error);
    }
  }
);

router.delete('/:id/save',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = getUserId(req);
      await jobService.unsaveJob(id, userId);
      res.json({ message: 'Job unsaved successfully' });
    } catch (error) {
      next(error);
    }
  }
);

export const jobsRouter = router;
