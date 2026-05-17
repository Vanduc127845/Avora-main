import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { AppError } from '../middleware/error.middleware.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { aiActionLimiter } from '../middleware/rate-limit.middleware.js';
import { RoadmapService } from '../services/roadmap.service.js';

const router: Router = Router();
const roadmapService = new RoadmapService();

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
      const roadmaps = await roadmapService.getUserRoadmaps(userId);
      res.json({ roadmaps });
    } catch (error) {
      next(error);
    }
  }
);

router.post('/',
  aiActionLimiter,
  body('targetJobId').notEmpty(),
  body('title').notEmpty().trim(),
  body('settings').optional().isObject(),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Invalid input', 400);
      }

      const userId = getUserId(req);
      const roadmap = await roadmapService.createRoadmap(userId, req.body);
      res.status(201).json({ roadmap });
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
      const roadmap = await roadmapService.getRoadmapById(id, userId);
      
      if (!roadmap) {
        throw new AppError('Roadmap not found', 404);
      }
      
      res.json({ roadmap });
    } catch (error) {
      next(error);
    }
  }
);

router.put('/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = getUserId(req);
      const roadmap = await roadmapService.updateRoadmap(id, userId, req.body);
      res.json({ roadmap });
    } catch (error) {
      next(error);
    }
  }
);

router.delete('/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = getUserId(req);
      await roadmapService.deleteRoadmap(id, userId);
      res.json({ message: 'Roadmap deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
);

router.put('/:id/progress',
  body('completedItems').optional().isInt({ min: 0 }),
  body('currentPhase').optional().isInt({ min: 0 }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Invalid input', 400);
      }

      const { id } = req.params;
      const userId = getUserId(req);
      const roadmap = await roadmapService.updateProgress(id, userId, req.body);
      res.json({ roadmap });
    } catch (error) {
      next(error);
    }
  }
);

router.post('/:id/item/:itemId/complete',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id, itemId } = req.params;
      const userId = getUserId(req);
      const roadmap = await roadmapService.completeItem(id, itemId, userId);
      res.json({ roadmap });
    } catch (error) {
      next(error);
    }
  }
);

export const roadmapsRouter = router;
