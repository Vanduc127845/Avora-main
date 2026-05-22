import { Router, Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/error.middleware.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { aiActionLimiter } from '../middleware/rate-limit.middleware.js';
import { AssessmentService } from '../services/assessment.service.js';

const router: Router = Router();
const assessmentService = new AssessmentService();

const getUserId = (req: Request) => {
  const userId = req.user?.userId;
  if (!userId) throw new AppError('Unauthorized', 401);
  return userId;
};

router.use(authMiddleware);

router.post('/',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = getUserId(req);
      const assessment = await assessmentService.createAssessment(userId);
      res.status(201).json({ assessment });
    } catch (error) {
      next(error);
    }
  }
);

router.get('/history',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = getUserId(req);
      const assessments = await assessmentService.getAssessmentHistory(userId);
      res.json({ assessments });
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
      const assessment = await assessmentService.getAssessment(id, userId);
      
      if (!assessment) {
        throw new AppError('Assessment not found', 404);
      }
      
      res.json({ assessment });
    } catch (error) {
      next(error);
    }
  }
);

const addAssessmentMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { message, extractedData } = req.body;
    const userId = getUserId(req);

    if (typeof message !== 'string' || !message.trim()) {
      throw new AppError('Message is required', 400);
    }

    const result = await assessmentService.addMessage(id, userId, {
      message: message.trim(),
      extractedData,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
};

router.post('/:id/message', aiActionLimiter, addAssessmentMessage);
router.post('/:id/chat', aiActionLimiter, addAssessmentMessage);

const completeAssessment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = getUserId(req);

    const assessment = await assessmentService.completeAssessment(id, userId);
    res.json({ assessment });
  } catch (error) {
    next(error);
  }
};

router.put('/:id/complete', aiActionLimiter, completeAssessment);
router.put('/:id/done', aiActionLimiter, completeAssessment);

export const assessmentsRouter = router;
