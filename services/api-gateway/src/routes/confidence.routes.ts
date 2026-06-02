import { Router, type NextFunction, type Request, type Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { AppError } from '../middleware/error.middleware.js';
import { ConfidenceService } from '../services/confidence.service.js';

const router: Router = Router();
const confidenceService = new ConfidenceService();

const getUserId = (req: Request) => {
  const userId = req.user?.userId;
  if (!userId) throw new AppError('Unauthorized', 401);
  return userId;
};

const validateRequest = (req: Request) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw new AppError('Invalid confidence entry', 400);
};

router.use(authMiddleware);

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const entries = await confidenceService.listEntries(getUserId(req));
    res.json({ entries });
  } catch (error) {
    next(error);
  }
});

router.post(
  '/',
  body('id').isString().trim().isLength({ min: 1, max: 120 }),
  body('mood').isIn(['steady', 'uncertain', 'blocked', 'confident']),
  body('win').isString().isLength({ max: 4000 }),
  body('blocker').isString().isLength({ max: 4000 }),
  body('nextStep').isString().isLength({ max: 4000 }),
  body('coachReply').isString().isLength({ max: 12000 }),
  body('createdAt').isISO8601(),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      validateRequest(req);
      const entry = await confidenceService.saveEntry(getUserId(req), req.body);
      res.status(201).json({ entry });
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  '/:id',
  param('id').isString().trim().isLength({ min: 1, max: 120 }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      validateRequest(req);
      const deleted = await confidenceService.deleteEntry(getUserId(req), req.params.id);
      res.json({ deleted });
    } catch (error) {
      next(error);
    }
  }
);

export const confidenceRouter = router;
