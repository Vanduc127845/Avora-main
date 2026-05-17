import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { AppError } from '../middleware/error.middleware.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { aiActionLimiter } from '../middleware/rate-limit.middleware.js';
import { InterviewService } from '../services/interview.service.js';

const router: Router = Router();
const interviewService = new InterviewService();

const getUserId = (req: Request) => {
  const userId = req.user?.userId;
  if (!userId) throw new AppError('Unauthorized', 401);
  return userId;
};

router.use(authMiddleware);

router.get('/',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = getUserId(req);
      const interviews = await interviewService.getUserInterviews(userId);
      res.json({ interviews });
    } catch (error) {
      next(error);
    }
  }
);

router.post('/',
  aiActionLimiter,
  body('targetJobId').optional().isString(),
  body('config').optional().isObject(),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Invalid input', 400);
      }

      const userId = getUserId(req);
      const interview = await interviewService.createInterview(userId, req.body);
      res.status(201).json({ interview });
    } catch (error) {
      next(error);
    }
  }
);

router.get('/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = getUserId(req);
      const interview = await interviewService.getInterviewById(id, userId);
      
      if (!interview) {
        throw new AppError('Interview not found', 404);
      }
      
      res.json({ interview });
    } catch (error) {
      next(error);
    }
  }
);

const getNextQuestion = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = getUserId(req);
    const question = await interviewService.getNextQuestion(id, userId);
    res.json({ question });
  } catch (error) {
    next(error);
  }
};

router.post('/:id/question', getNextQuestion);
router.post('/:id/ask', getNextQuestion);

const responseValidators = [
  body('questionId').notEmpty(),
  body('response').notEmpty(),
  body('audioUrl').optional().isString(),
];

const submitResponse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Invalid input', 400);
    }

    const { id } = req.params;
    const userId = getUserId(req);
    const result = await interviewService.submitResponse(id, userId, req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

router.post('/:id/respond', aiActionLimiter, ...responseValidators, submitResponse);
router.post('/:id/answer', aiActionLimiter, ...responseValidators, submitResponse);

router.post('/:id/pause',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = getUserId(req);
      const interview = await interviewService.pauseInterview(id, userId);
      res.json({ interview });
    } catch (error) {
      next(error);
    }
  }
);

router.post('/:id/resume',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = getUserId(req);
      const interview = await interviewService.resumeInterview(id, userId);
      res.json({ interview });
    } catch (error) {
      next(error);
    }
  }
);

router.post('/:id/complete',
  aiActionLimiter,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = getUserId(req);
      const interview = await interviewService.completeInterview(id, userId);
      res.json({ interview });
    } catch (error) {
      next(error);
    }
  }
);

router.get('/:id/feedback',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = getUserId(req);
      const feedback = await interviewService.getFeedback(id, userId);
      res.json({ feedback });
    } catch (error) {
      next(error);
    }
  }
);

export const interviewsRouter = router;
