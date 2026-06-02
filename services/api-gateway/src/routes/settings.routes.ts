import { Router, type NextFunction, type Request, type Response } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { AppError } from '../middleware/error.middleware.js';
import { SettingsService } from '../services/settings.service.js';

const router: Router = Router();
const settingsService = new SettingsService();

const settingsUpdateSchema = z.object({
  notifications: z.object({
    emailNotifications: z.boolean().optional(),
    pushNotifications: z.boolean().optional(),
    weeklyDigest: z.boolean().optional(),
    interviewReminders: z.boolean().optional(),
  }).strict().optional(),
  privacy: z.object({
    shareProfile: z.boolean().optional(),
    shareProgress: z.boolean().optional(),
    anonymousAnalytics: z.boolean().optional(),
  }).strict().optional(),
  language: z.string().trim().min(2).max(20).optional(),
  timezone: z.string().trim().min(2).max(80).optional(),
  account: z.object({
    password: z.string().min(8).max(200).optional(),
    disconnectedProvider: z.string().trim().min(2).max(40).optional(),
  }).strict().optional(),
}).strict();

const getUser = (req: Request) => {
  if (!req.user?.userId) throw new AppError('Unauthorized', 401);
  return req.user;
};

router.use(authMiddleware);

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = getUser(req);
    res.json({ settings: await settingsService.getSettings(user.userId) });
  } catch (error) {
    next(error);
  }
});

router.patch('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updates = settingsUpdateSchema.parse(req.body);
    const user = getUser(req);
    const settings = await settingsService.updateSettings(user.userId, user.email, updates);
    res.json({ settings, message: 'Đã lưu' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new AppError('Invalid settings', 400));
      return;
    }
    next(error);
  }
});

router.get('/export', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = getUser(req);
    const data = await settingsService.exportData(user.userId, user.email);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

export const settingsRouter = router;
