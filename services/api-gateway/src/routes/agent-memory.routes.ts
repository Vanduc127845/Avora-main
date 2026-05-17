import { Router, type NextFunction, type Request, type Response } from 'express';
import { param, validationResult } from 'express-validator';
import { AppError } from '../middleware/error.middleware.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { AgentMemoryService } from '../services/agent-memory.service.js';

const router: Router = Router();
const memoryService = new AgentMemoryService();

const getUserId = (req: Request) => {
  const userId = req.user?.userId;
  if (!userId) throw new AppError('Unauthorized', 401);
  return userId;
};

router.use(authMiddleware);

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const memories = await memoryService.listMemories(getUserId(req));
    res.json({
      memories,
      privacy: {
        scope: 'Per user and per agent',
        retention: 'Stored until the user deletes it or the production database policy removes it.',
        deletionEndpoints: ['DELETE /api/agent-memory', 'DELETE /api/agent-memory/:agentId'],
      },
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deleted = await memoryService.deleteMemory(getUserId(req));
    res.json({ deleted });
  } catch (error) {
    next(error);
  }
});

router.delete(
  '/:agentId',
  param('agentId').isString().trim().isLength({ min: 2, max: 80 }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Invalid agent id', 400);
      }

      const deleted = await memoryService.deleteMemory(getUserId(req), req.params.agentId);
      res.json({ deleted });
    } catch (error) {
      next(error);
    }
  }
);

export const agentMemoryRouter = router;
