import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { AppError } from '../middleware/error.middleware.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { aiRouteLimiter } from '../middleware/rate-limit.middleware.js';
import { AIService } from '../services/ai.service.js';

const router: Router = Router();
const aiService = new AIService();

const getUserId = (req: Request) => {
  const userId = req.user?.userId;
  if (!userId) throw new AppError('Unauthorized', 401);
  return userId;
};

router.get('/status', (_req: Request, res: Response) => {
  res.json(aiService.getStatus());
});

router.post('/chat',
  aiRouteLimiter,
  authMiddleware,
  body('message').notEmpty().trim(),
  body('context').optional().isObject(),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Invalid input', 400);
      }

      const userId = getUserId(req);
      const { message, context } = req.body;
      const response = await aiService.chat(userId, message, context);
      res.json({ response });
    } catch (error) {
      next(error);
    }
  }
);

router.post('/analyze-jd',
  aiRouteLimiter,
  authMiddleware,
  body('jobDescription').notEmpty(),
  body('userProfile').optional().isObject(),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Invalid input', 400);
      }

      const { jobDescription, userProfile } = req.body;
      const analysis = await aiService.analyzeJobDescription(jobDescription, userProfile);
      res.json({ analysis });
    } catch (error) {
      next(error);
    }
  }
);

router.post('/generate-roadmap',
  aiRouteLimiter,
  authMiddleware,
  body('targetJobId').notEmpty(),
  body('currentSkills').isArray(),
  body('preferences').optional().isObject(),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Invalid input', 400);
      }

      const userId = getUserId(req);
      const roadmap = await aiService.generateRoadmap(userId, req.body);
      res.json({ roadmap });
    } catch (error) {
      next(error);
    }
  }
);

router.post('/suggest-careers',
  aiRouteLimiter,
  authMiddleware,
  body('interests').isArray(),
  body('skills').isArray(),
  body('values').optional().isArray(),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Invalid input', 400);
      }

      const { interests, skills, values } = req.body;
      const careers = await aiService.suggestCareers({ interests, skills, values });
      res.json({ careers });
    } catch (error) {
      next(error);
    }
  }
);

router.post('/generate-questions',
  aiRouteLimiter,
  authMiddleware,
  body('jobType').notEmpty(),
  body('difficulty').optional().isIn(['easy', 'medium', 'hard']),
  body('count').optional().isInt({ min: 1, max: 20 }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Invalid input', 400);
      }

      const { jobType, difficulty = 'medium', count = 5 } = req.body;
      const questions = await aiService.generateInterviewQuestions(jobType, difficulty, count);
      res.json({ questions });
    } catch (error) {
      next(error);
    }
  }
);

router.post('/feedback',
  aiRouteLimiter,
  authMiddleware,
  body('responses').isArray(),
  body('jobType').optional().isString(),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Invalid input', 400);
      }

      const userId = getUserId(req);
      const { responses, jobType } = req.body;
      const feedback = await aiService.getInterviewFeedback(userId, responses, jobType);
      res.json({ feedback });
    } catch (error) {
      next(error);
    }
  }
);

export const aiRouter = router;
